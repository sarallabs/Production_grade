import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';

interface TranscriptLine {
  timeSec: number;
  timeLabel: string;
  speaker: string;
  text: string;
}

const SAMPLE_TRANSCRIPT: TranscriptLine[] = [
  {
    timeSec: 0,
    timeLabel: '00:00',
    speaker: 'Prof. Rao',
    text: 'Welcome students of ANGRAU to our audio lecture on ENTO 131: Fundamentals of Entomology.',
  },
  {
    timeSec: 15,
    timeLabel: '00:15',
    speaker: 'Prof. Rao',
    text: 'Today we explore the insect alimentary canal, which is partitioned into three major regions: Foregut, Midgut, and Hindgut.',
  },
  {
    timeSec: 32,
    timeLabel: '00:32',
    speaker: 'Student Priya',
    text: 'Professor, why are only the foregut and hindgut lined with cuticular intima while the midgut is naked?',
  },
  {
    timeSec: 48,
    timeLabel: '00:48',
    speaker: 'Prof. Rao',
    text: 'Excellent question Priya. The foregut and hindgut arise from the ectoderm, so they form cuticular intima which sheds during ecdysis. The midgut arises from endoderm and must remain permeable for enzyme secretion and nutrient absorption.',
  },
  {
    timeSec: 72,
    timeLabel: '01:12',
    speaker: 'Prof. Rao',
    text: 'To protect that naked midgut epithelium from coarse food particles, the insect secretes a marvelous structure called the Peritrophic Membrane.',
  },
];

const SPEED_OPTIONS = [1.0, 1.25, 1.5];

export default function PodcastsView({
  chapterNumber,
  chapterName,
}: {
  chapterNumber: number;
  chapterName: string;
}) {
  const { isDark } = useAppTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(120000); // 2 min demo
  const [speedIndex, setSpeedIndex] = useState(0);
  const [activeTranscriptSec, setActiveTranscriptSec] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const speakLineForTime = (timeSec: number) => {
    const currentLine = [...SAMPLE_TRANSCRIPT].reverse().find((line) => line.timeSec <= timeSec);
    if (currentLine) {
      Speech.stop();
      Speech.speak(`${currentLine.speaker}: ${currentLine.text}`, {
        rate: SPEED_OPTIONS[speedIndex],
      });
    }
  };

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      Speech.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakLineForTime(Math.floor(positionMillis / 1000));
      // Simulated playback ticker for smooth mobile preview
      timerRef.current = setInterval(() => {
        setPositionMillis((prev) => {
          const next = prev + 1000;
          const sec = Math.floor(next / 1000);
          setActiveTranscriptSec(sec);
          const matchingLine = SAMPLE_TRANSCRIPT.find((l) => l.timeSec === sec);
          if (matchingLine) {
            Speech.stop();
            Speech.speak(`${matchingLine.speaker}: ${matchingLine.text}`, {
              rate: SPEED_OPTIONS[speedIndex],
            });
          }
          if (next >= durationMillis) {
            setIsPlaying(false);
            Speech.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return next;
        });
      }, 1000 / SPEED_OPTIONS[speedIndex]);
    }
  };

  const handleSkip = (seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPositionMillis((prev) => {
      const next = Math.max(0, Math.min(durationMillis, prev + seconds * 1000));
      const sec = Math.floor(next / 1000);
      setActiveTranscriptSec(sec);
      if (isPlaying) {
        speakLineForTime(sec);
      }
      return next;
    });
  };

  const handleCycleSpeed = () => {
    Haptics.selectionAsync();
    const nextIdx = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIdx);
  };

  const handleSeekToTranscript = (timeSec: number) => {
    Haptics.selectionAsync();
    setPositionMillis(timeSec * 1000);
    setActiveTranscriptSec(timeSec);
    if (isPlaying) {
      speakLineForTime(timeSec);
    }
  };

  const formatTime = (millis: number) => {
    const totalSec = Math.floor(millis / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, (positionMillis / durationMillis) * 100);

  return (
    <View style={styles.container}>
      {/* Podcast Player Hero Card */}
      <View
        style={[
          styles.playerCard,
          {
            backgroundColor: isDark ? '#23322B' : '#ffffff',
            borderColor: isDark ? '#3D5449' : '#E5DDD8',
          },
        ]}
      >
        <View style={styles.artworkContainer}>
          <View style={styles.artworkCircle}>
            <Ionicons name="mic" size={32} color="#22c55e" />
          </View>
          <View style={styles.artworkPulse} />
        </View>

        <Text style={styles.seriesTag}>PODCAST SERIES • CH {chapterNumber}</Text>
        <Text
          style={[styles.episodeTitle, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}
          numberOfLines={2}
        >
          {chapterName}: Anatomy & Physiology Breakdown
        </Text>
        <Text style={[styles.speakerLabel, { color: isDark ? '#A6C5B3' : '#688875' }]}>Faculty: Prof. K. Rao • 2:00 mins</Text>

        {/* Seekbar */}
        <View style={styles.progressSection}>
          <View style={[styles.sliderTrack, { backgroundColor: isDark ? '#1C2822' : '#F7EBE3' }]}>
            <View style={[styles.sliderFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: isDark ? '#A6C5B3' : '#688875' }]}>{formatTime(positionMillis)}</Text>
            <Text style={[styles.timeText, { color: isDark ? '#A6C5B3' : '#688875' }]}>{formatTime(durationMillis)}</Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={[styles.speedPill, { backgroundColor: isDark ? '#1C2822' : '#F7EBE3' }]} onPress={handleCycleSpeed}>
            <Text style={styles.speedPillText}>{SPEED_OPTIONS[speedIndex]}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => handleSkip(-15)}
            activeOpacity={0.7}
          >
            <Ionicons name="play-back" size={20} color={isDark ? '#A6C5B3' : '#688875'} />
            <Text style={[styles.skipSecText, { color: isDark ? '#A6C5B3' : '#688875' }]}>15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainPlayBtn}
            onPress={handleTogglePlay}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => handleSkip(15)}
            activeOpacity={0.7}
          >
            <Ionicons name="play-forward" size={20} color={isDark ? '#A6C5B3' : '#688875'} />
            <Text style={[styles.skipSecText, { color: isDark ? '#A6C5B3' : '#688875' }]}>15</Text>
          </TouchableOpacity>

          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Synchronized Transcript Section */}
      <View style={styles.transcriptSection}>
        <View style={styles.transcriptHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="document-text-outline" size={16} color="#22c55e" />
            <Text style={[styles.transcriptHeading, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
              Synchronized Transcript
            </Text>
          </View>
          <Text style={[styles.transcriptHint, { color: isDark ? '#A6C5B3' : '#688875' }]}>Tap timestamp to jump</Text>
        </View>

        <View style={styles.transcriptList}>
          {SAMPLE_TRANSCRIPT.map((line, idx) => {
            const isLineActive =
              activeTranscriptSec >= line.timeSec &&
              (idx === SAMPLE_TRANSCRIPT.length - 1 ||
                activeTranscriptSec < SAMPLE_TRANSCRIPT[idx + 1].timeSec);

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.transcriptCard,
                  isLineActive && styles.transcriptCardActive,
                  {
                    backgroundColor: isDark ? '#23322B' : '#ffffff',
                    borderColor: isLineActive ? '#22c55e' : (isDark ? '#3D5449' : '#E5DDD8'),
                  },
                ]}
                onPress={() => handleSeekToTranscript(line.timeSec)}
                activeOpacity={0.8}
              >
                <View style={styles.transcriptTopRow}>
                  <View style={[styles.timeChip, isLineActive && styles.timeChipActive]}>
                    <Ionicons
                      name="play"
                      size={10}
                      color={isLineActive ? '#ffffff' : '#22c55e'}
                    />
                    <Text
                      style={[styles.timeChipText, isLineActive && styles.timeChipTextActive]}
                    >
                      {line.timeLabel}
                    </Text>
                  </View>
                  <Text style={[styles.speakerTag, { color: isDark ? '#A6C5B3' : '#688875' }]}>{line.speaker}</Text>
                </View>

                <Text
                  style={[
                    styles.transcriptBody,
                    { color: isDark ? '#A6C5B3' : '#334155' },
                    isLineActive && { color: isDark ? '#FFFFFF' : '#1C2E24', fontWeight: '600' },
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  playerCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  artworkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#064e3b33',
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkPulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#22c55e33',
  },
  seriesTag: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  speakerLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: Spacing.three,
  },
  progressSection: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.two,
  },
  speedPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  speedPillText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '800',
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipSecText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  mainPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  transcriptSection: {
    gap: Spacing.two,
  },
  transcriptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transcriptHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  transcriptHint: {
    fontSize: 11,
    color: '#94a3b8',
  },
  transcriptList: {
    gap: 8,
  },
  transcriptCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    gap: 6,
  },
  transcriptCardActive: {
    backgroundColor: '#064e3b1c',
    borderWidth: 1.5,
  },
  transcriptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064e3b22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  timeChipActive: {
    backgroundColor: '#22c55e',
  },
  timeChipText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '700',
  },
  timeChipTextActive: {
    color: '#ffffff',
  },
  speakerTag: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  transcriptBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
