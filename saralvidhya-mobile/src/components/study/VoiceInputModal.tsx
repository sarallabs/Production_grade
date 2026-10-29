import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppTheme } from '@/context/ThemeContext';
import { GEMINI_API_KEY } from '@/services/askService';

interface VoiceInputModalProps {
  visible: boolean;
  chapterNumber: number;
  chapterName: string;
  onClose: () => void;
  onTranscript: (spokenText: string) => void;
}

const QUICK_CHAPTER_TOPICS: Record<number, string[]> = {
  1: [
    'Explain the 3 main parts of insect alimentary canal',
    'What is the function of proventriculus and gastric caeca?',
    'Why does the midgut lack cuticular intima?',
  ],
  2: [
    'Difference between hemimetabolous and holometabolous metamorphosis',
    'What is the role of ecdysone and juvenile hormone?',
    'Describe the pupal stage of insects in detail',
  ],
  3: [
    'Explain physical vs chemical weathering of rocks',
    'What are primary minerals in soil formation?',
    'Describe the role of hydration and hydrolysis',
  ],
  4: [
    'How do honey bees pollinate agricultural crops?',
    'What is floral biology in agricultural entomology?',
    'Explain cross-pollination mechanisms by insects',
  ],
};

const NUM_BARS = 17;

export default function VoiceInputModal({
  visible,
  chapterNumber,
  chapterName,
  onClose,
  onTranscript,
}: VoiceInputModalProps) {
  const { isDark } = useAppTheme();
  const [transcribedText, setTranscribedText] = useState('');
  const [statusMessage, setStatusMessage] = useState('Tap mic to start speaking');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveMetering, setLiveMetering] = useState(-160);

  // Active native recorder instance (dynamically managed per recording session)
  const activeRecorderRef = useRef<any>(null);
  const pollingIntervalRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const hasSpokenRef = useRef(false);
  const lastVoiceTimestampRef = useRef<number>(0);

  // Pulse animation for the glowing mic orb
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim1 = useRef(new Animated.Value(1)).current;
  const rippleAnim2 = useRef(new Animated.Value(1)).current;

  // Start continuous pulse animation while recording
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;

    if (isRecording && !isProcessing) {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.14,
              duration: 650,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1.0,
              duration: 650,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(rippleAnim1, {
              toValue: 1.38,
              duration: 850,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(rippleAnim1, {
              toValue: 1.0,
              duration: 40,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(rippleAnim2, {
              toValue: 1.6,
              duration: 1100,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(rippleAnim2, {
              toValue: 1.0,
              duration: 40,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
      rippleAnim1.setValue(1);
      rippleAnim2.setValue(1);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isRecording, isProcessing]);

  // When modal opens, auto-request permissions and start recording
  useEffect(() => {
    if (visible) {
      setTranscribedText('');
      setIsProcessing(false);
      setIsRecording(false);
      setRecordingSeconds(0);
      setLiveMetering(-160);
      hasSpokenRef.current = false;
      lastVoiceTimestampRef.current = 0;
      startRecording();
    } else {
      cleanupActiveRecorder();
    }

    return () => {
      cleanupActiveRecorder();
    };
  }, [visible]);

  const cleanupActiveRecorder = async () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (activeRecorderRef.current) {
      try {
        if (activeRecorderRef.current.isRecording) {
          await activeRecorderRef.current.stop();
        }
      } catch { }
      activeRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const ensureMicrophonePermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const androidPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Saral Vidhya needs microphone access to listen to your agricultural questions.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (androidPerm !== PermissionsAndroid.RESULTS.GRANTED) {
          setStatusMessage('Microphone permission denied. Please allow microphone in Android Settings.');
          return false;
        }
      }

      const expoPerm = await AudioModule.requestRecordingPermissionsAsync();
      if (!expoPerm.granted) {
        setStatusMessage('Microphone permission required. Tap an exam topic below.');
        return false;
      }

      return true;
    } catch (err: any) {
      console.warn('[VoiceInputModal] Permission error:', err);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setStatusMessage('🎤 Preparing microphone...');

      // 1. Ensure permissions
      const hasPerm = await ensureMicrophonePermissions();
      if (!hasPerm) return;

      // 2. Configure native audio session
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // 3. Clean up any previous recorder instance
      await cleanupActiveRecorder();

      // 4. Create a fresh dynamic AudioRecorder instance with high quality preset
      const recorder = new AudioModule.AudioRecorder({
        ...RecordingPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      activeRecorderRef.current = recorder;

      // 5. Prepare and start recording
      await recorder.prepareToRecordAsync();
      recorder.record();

      setIsRecording(true);
      setIsProcessing(false);
      recordingStartTimeRef.current = Date.now();
      hasSpokenRef.current = false;
      lastVoiceTimestampRef.current = 0;
      setStatusMessage('🔴 Listening... Speak now (Tap mic when done)');

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch { }

      // 6. Polling loop: update seconds, metering, and smart silence detection
      pollingIntervalRef.current = setInterval(() => {
        if (!activeRecorderRef.current) return;

        try {
          const status = activeRecorderRef.current.getStatus();
          const elapsedSec = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingSeconds(elapsedSec);

          const meteringDb = status.metering ?? -160;
          setLiveMetering(meteringDb);

          // Update status with live timer
          const mins = Math.floor(elapsedSec / 60);
          const secs = elapsedSec % 60;
          const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
          setStatusMessage(`🔴 Listening... (${timeStr}) - Tap mic when done`);

          // Senses voice when metering > -58dB
          if (meteringDb > -58) {
            hasSpokenRef.current = true;
            lastVoiceTimestampRef.current = Date.now();
          } else if (hasSpokenRef.current && lastVoiceTimestampRef.current > 0) {
            // After user speaks, if silent for > 2.5s, auto stop & transcribe
            const silenceElapsed = Date.now() - lastVoiceTimestampRef.current;
            if (silenceElapsed > 2500) {
              stopRecordingAndTranscribe();
            }
          }

          // Max 20s safety limit
          if (elapsedSec >= 20) {
            stopRecordingAndTranscribe();
          }
        } catch { }
      }, 70);
    } catch (err: any) {
      console.warn('[VoiceInputModal] Start recording failed:', err);
      setStatusMessage(`Microphone error: ${err.message || 'Failed to start'}. Tap below:`);
      setIsRecording(false);
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsRecording(false);
    setStatusMessage('🤖 Transcribing your speech with AI...');

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    const recorder = activeRecorderRef.current;
    if (!recorder) {
      setStatusMessage('No active recording. Tap mic to try again.');
      setIsProcessing(false);
      return;
    }

    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch { }

      // Stop native recording and get final status/URL
      const stopStatus = await recorder.stop();
      const recordingUri = recorder.uri || stopStatus?.url;

      if (!recordingUri) {
        setStatusMessage('No audio captured. Tap mic to try again.');
        setIsProcessing(false);
        return;
      }

      // Read audio recording as base64 using expo-file-system
      let base64Data = '';
      try {
        base64Data = await FileSystem.readAsStringAsync(recordingUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (fsErr) {
        console.warn('[VoiceInputModal] FileSystem read error, trying fallback:', fsErr);
      }

      if (!base64Data || base64Data.length < 300) {
        setStatusMessage('No speech detected. Tap mic to speak again.');
        setIsProcessing(false);
        return;
      }

      // Call Gemini 3.5 Flash Lite with native audio payload
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'audio/mp4',
                    data: base64Data,
                  },
                },
                {
                  text: 'You are an accurate voice speech recognizer for agricultural students. Transcribe the spoken question in this audio recording into clear English text. Return ONLY the transcribed words. Do NOT add quotes or explanation. If inaudible or silent, return SILENCE.',
                },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        if (text && !text.toUpperCase().includes('SILENCE') && text.length > 2) {
          setTranscribedText(text);
          setStatusMessage('Got it! AI is answering out loud... 🔊');
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch { }

          setTimeout(() => {
            onTranscript(text);
            onClose();
          }, 750);
          return;
        }
      }

      setStatusMessage("Didn't catch that clearly. Tap mic to speak again, or tap a topic below.");
      setIsProcessing(false);
    } catch (err: any) {
      console.warn('[VoiceInputModal] Transcription error:', err);
      setStatusMessage(`Transcription issue: ${err.message || 'Please retry'}. Tap below:`);
      setIsProcessing(false);
    }
  };

  const handleMicButtonPress = () => {
    if (isProcessing) return;

    if (isRecording) {
      stopRecordingAndTranscribe();
    } else {
      setTranscribedText('');
      startRecording();
    }
  };

  const handleSelectQuickPrompt = (prompt: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
    setTranscribedText(prompt);
    setStatusMessage('Got it! AI is answering out loud... 🔊');
    cleanupActiveRecorder();
    setTimeout(() => {
      onTranscript(prompt);
      onClose();
    }, 400);
  };

  const quickPrompts =
    QUICK_CHAPTER_TOPICS[chapterNumber] || QUICK_CHAPTER_TOPICS[1];

  const colors = isDark
    ? {
      modalBg: '#1B2720',
      primaryText: '#FFFFFF',
      subText: '#9CB8A8',
      transcriptBox: '#23332A',
      chipBg: '#23332A',
      chipBorder: '#344A3D',
      chipText: '#E6F0EA',
    }
    : {
      modalBg: '#FFFFFF',
      primaryText: '#182B21',
      subText: '#5A7063',
      transcriptBox: '#F2FAF5',
      chipBg: '#F0F8F3',
      chipBorder: '#D2E8DB',
      chipText: '#147A43',
    };

  // Compute live visual heights for the 17 voice shower bars based on live hardware metering
  // Metering normalized between -65dB (silence) and -10dB (loud)
  const normalizedLevel = isRecording
    ? Math.max(0, Math.min(1, (liveMetering + 65) / 50))
    : 0;

  const centerIndex = Math.floor(NUM_BARS / 2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.cardContainer, { backgroundColor: colors.modalBg }]}>
          {/* Top Sheet Handle */}
          <View style={styles.sheetHandle} />

          {/* Header Row: Title & Close Button */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.primaryText }]}>
                Ask by Voice 🎙️
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
                Chapter {chapterNumber}: {chapterName}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color={colors.subText} />
            </TouchableOpacity>
          </View>

          {/* Native High-Performance Audio Interface (Glowing Mic & Live Voice Shower) */}
          <View style={styles.interactiveAudioSection}>
            {/* Center Mic Orb with Animated Pulsing Waves */}
            <View style={styles.micOrbContainer}>
              {isRecording && (
                <>
                  <Animated.View
                    style={[
                      styles.rippleRing,
                      styles.rippleRing2,
                      {
                        transform: [{ scale: rippleAnim2 }],
                        opacity: rippleAnim2.interpolate({
                          inputRange: [1, 1.6],
                          outputRange: [0.35, 0],
                        }),
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.rippleRing,
                      styles.rippleRing1,
                      {
                        transform: [{ scale: rippleAnim1 }],
                        opacity: rippleAnim1.interpolate({
                          inputRange: [1, 1.38],
                          outputRange: [0.55, 0.05],
                        }),
                      },
                    ]}
                  />
                </>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleMicButtonPress}
                disabled={isProcessing}
              >
                <Animated.View
                  style={[
                    styles.micButton,
                    {
                      backgroundColor: isRecording ? '#EF4444' : '#147A43',
                      transform: [{ scale: isRecording ? pulseAnim : 1.0 }],
                    },
                  ]}
                >
                  <Ionicons
                    name={isRecording ? 'stop' : isProcessing ? 'hourglass-outline' : 'mic'}
                    size={36}
                    color="#FFFFFF"
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Live 17-Bar Symmetrical Voice Shower (Bounces with hardware voice level) */}
            <View style={styles.voiceShowerContainer}>
              {Array.from({ length: NUM_BARS }).map((_, i) => {
                const distFromCenter = Math.abs(i - centerIndex);
                const curveFactor = Math.max(0.2, 1 - distFromCenter * 0.11);
                // Bar height from 4px minimum to 44px peak
                const barHeight = isRecording && normalizedLevel > 0.03

                  ? Math.round(4 + normalizedLevel * 40 * curveFactor)
                  : 4;

                return (
                  <View
                    key={i}
                    style={[
                      styles.voiceBar,
                      {
                        height: barHeight,
                        backgroundColor: isRecording ? '#22C55E' : '#9CB8A8',
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Live Translation / Transcribed Speech Box */}
          <View style={[styles.transcriptContainer, { backgroundColor: colors.transcriptBox }]}>
            {transcribedText ? (
              <View>
                <Text style={styles.translatedBadge}>TRANSLATED QUESTION:</Text>
                <Text style={[styles.translatedText, { color: colors.primaryText }]}>
                  “{transcribedText}”
                </Text>
              </View>
            ) : (
              <Text style={[styles.statusText, { color: colors.primaryText }]}>
                {statusMessage}
              </Text>
            )}
          </View>

          {/* Quick Chapter Exam Questions (1-Tap for live spoken answer) */}
          <Text style={[styles.quickTopicHeader, { color: colors.subText }]}>
            OR TAP A QUESTION FOR LIVE SPOKEN ANSWER:
          </Text>

          <View style={styles.quickPromptsList}>
            {quickPrompts.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.quickPromptChip,
                  {
                    backgroundColor: colors.chipBg,
                    borderColor: colors.chipBorder,
                  },
                ]}
                onPress={() => handleSelectQuickPrompt(prompt)}
                activeOpacity={0.7}
              >
                <Ionicons name="volume-medium-outline" size={16} color="#147A43" />
                <Text
                  style={[styles.quickPromptText, { color: colors.chipText }]}
                  numberOfLines={1}
                >
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  cardContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 32,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  interactiveAudioSection: {
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  micOrbContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rippleRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  rippleRing1: {
    width: 104,
    height: 104,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
  },
  rippleRing2: {
    width: 130,
    height: 130,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  voiceShowerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 48,
    marginTop: 10,
  },
  voiceBar: {
    width: 4,
    borderRadius: 2,
  },
  transcriptContainer: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 8,
    minHeight: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translatedBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#147A43',
    marginBottom: 4,
    textAlign: 'center',
  },
  translatedText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 21,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickTopicHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  quickPromptsList: {
    width: '100%',
    gap: 6,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickPromptText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
