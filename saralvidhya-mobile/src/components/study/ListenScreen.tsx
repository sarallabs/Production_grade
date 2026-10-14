import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const { width } = Dimensions.get('window');

export type ListenMode = 'quick' | 'detailed' | 'microcasts';

interface ListenScreenProps {
  chapterNumber?: number;
  chapterTitle?: string;
  initialMode?: ListenMode;
  onNavigateToRead?: (moduleNumber?: number) => void;
  onBackPress?: () => void;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

const GLOSSARY_TOOLTIPS: Record<string, string> = {
  digestion: 'The biological breakdown of food into nutrient molecules absorbed by gut cells.',
  'elementary canal': 'Alimentary canal: the specialized tube from mouth to anus (foregut, midgut, hindgut).',
  'alimentary canal': 'The continuous muscular digestive tract extending from mouth to anus.',
  foregut: 'Stomodaeum: anterior region (pharynx, crop, proventriculus) lined with shed cuticle.',
  midgut: 'Mesenteron: central digestive chamber lined with columnar microvilli, lacking cuticle.',
  hindgut: 'Proctodaeum: posterior chamber (ileum, colon, rectum) responsible for water reabsorption.',
  Ferrari: 'Metaphor for high metabolic energy throughput in flying insects.',
};

export default function ListenScreen({
  chapterNumber = 1,
  chapterTitle = 'Insect Digestive System & Anatomy',
  initialMode = 'detailed',
  onNavigateToRead,
  onBackPress,
}: ListenScreenProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [mode, setMode] = useState<ListenMode>(initialMode);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSec, setCurrentSec] = useState<number>(0);
  const [speedIndex, setSpeedIndex] = useState<number>(0);
  const [selectedModule, setSelectedModule] = useState<number>(1);
  const [activeTooltip, setActiveTooltip] = useState<{ term: string; text: string } | null>(null);

  // Quick vs Detailed durations & metadata
  const isQuick = mode === 'quick';
  const isDetailed = mode === 'detailed';

  // Duration in seconds: Quick = 20:24 (1224s), Detailed = 44:39 (2679s), Micro = 02:30 (150s)
  const totalDurationSec = isQuick ? 1224 : isDetailed ? 2679 : 150;
  const totalDurationLabel = isQuick ? '20:24' : isDetailed ? '44:39' : '02:30';

  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  // When switching modes, stop and reset position
  const handleSelectMode = (newMode: ListenMode) => {
    Haptics.selectionAsync();
    Speech.stop();
    if (tickerRef.current) clearInterval(tickerRef.current);
    setIsPlaying(false);
    setCurrentSec(0);
    setMode(newMode);
  };

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      if (tickerRef.current) clearInterval(tickerRef.current);
      Speech.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const textToSpeak = isQuick
        ? 'Imagine pouring solid wood chips or liquid blood directly into the gas tank of a Ferrari. The engine would struggle to process it. In the insect world, that rule of engineering is turned upside down. We are looking at a biological landscape where a microscopic tube has adapted to process incredibly diverse fuels. The insect gut has three distinct zones: the foregut, midgut, and hindgut.'
        : 'Yuteng once said, happiness for me is largely a matter of digestion. I mean, he is not wrong. If you are listening to this, you might think about digestion after a heavy meal. But for insects, digestion is not just processing lunch. It is a high-stakes evolutionary battleground. Today, we are unpacking the insect elementary canal and the specialized systems that help insects survive.';

      Speech.stop();
      Speech.speak(textToSpeak, {
        rate: SPEED_OPTIONS[speedIndex],
        onDone: () => setIsPlaying(false),
      });

      tickerRef.current = setInterval(() => {
        setCurrentSec((prev) => {
          const next = prev + 1;
          if (next >= totalDurationSec) {
            setIsPlaying(false);
            Speech.stop();
            if (tickerRef.current) clearInterval(tickerRef.current);
            return 0;
          }
          return next;
        });
      }, 1000 / SPEED_OPTIONS[speedIndex]);
    }
  };

  const handleSkip = (deltaSeconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentSec((prev) => Math.max(0, Math.min(totalDurationSec, prev + deltaSeconds)));
  };

  const handleCycleSpeed = () => {
    Haptics.selectionAsync();
    const nextIdx = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIdx);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, (currentSec / totalDurationSec) * 100);

  // Theming colors
  const bg = isDark ? '#17241D' : '#F6FAF7';
  const cardBg = isDark ? '#1F3027' : '#FFFFFF';
  const cardBorder = isDark ? '#2D4538' : '#E2EBE5';
  const textDark = isDark ? '#FFFFFF' : '#142B20';
  const textMuted = isDark ? '#A6C5B3' : '#647D70';
  const emeraldPrimary = '#00875A';
  const mintPillBg = isDark ? 'rgba(74, 222, 128, 0.15)' : '#DCECE3';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header: Saral Vidhya / Learning Simplified */}
        <View style={styles.brandingHeader}>
          {onBackPress && (
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={onBackPress}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={textDark} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.brandTitle, { color: textDark }]}>Saral Vidhya</Text>
            <Text style={[styles.brandSubtitle, { color: textMuted }]}>Learning Simplified</Text>
          </View>
        </View>

        {/* 2. Three Segmented Pills: [ ● Quick Listen ] [ ◉ Detailed Listen ] [ ● Microcasts ] */}
        <View style={[styles.modeSelectorWrap, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* Quick Listen */}
          <TouchableOpacity
            style={[styles.modePill, mode === 'quick' && { backgroundColor: emeraldPrimary }]}
            onPress={() => handleSelectMode('quick')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={mode === 'quick' ? 'radio-button-on' : 'ellipse'}
              size={11}
              color={mode === 'quick' ? '#FFFFFF' : textDark}
            />
            <Text style={[styles.modePillText, { color: mode === 'quick' ? '#FFFFFF' : textDark }]}>
              Quick Listen
            </Text>
          </TouchableOpacity>

          {/* Detailed Listen */}
          <TouchableOpacity
            style={[styles.modePill, mode === 'detailed' && { backgroundColor: emeraldPrimary }]}
            onPress={() => handleSelectMode('detailed')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={mode === 'detailed' ? 'radio-button-on' : 'ellipse'}
              size={11}
              color={mode === 'detailed' ? '#FFFFFF' : textDark}
            />
            <Text
              style={[
                styles.modePillText,
                { color: mode === 'detailed' ? '#FFFFFF' : textDark },
              ]}
            >
              Detailed Listen
            </Text>
          </TouchableOpacity>

          {/* Microcasts */}
          <TouchableOpacity
            style={[styles.modePill, mode === 'microcasts' && { backgroundColor: emeraldPrimary }]}
            onPress={() => handleSelectMode('microcasts')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={mode === 'microcasts' ? 'radio-button-on' : 'ellipse'}
              size={11}
              color={mode === 'microcasts' ? '#FFFFFF' : textDark}
            />
            <Text
              style={[
                styles.modePillText,
                { color: mode === 'microcasts' ? '#FFFFFF' : textDark },
              ]}
            >
              Microcasts
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Section Tag: DETAILED LISTEN · 1 OF 1 MATCH or QUICK LISTEN · STANDARD DEPTH */}
        <Text style={[styles.sectionMatchLabel, { color: textMuted }]}>
          {isQuick
            ? 'QUICK LISTEN · STANDARD DEPTH'
            : isDetailed
            ? 'DETAILED LISTEN · 1 OF 1 MATCH'
            : 'MICROCASTS · HIGH-YIELD'}
        </Text>

        {/* 4. Mini Player / Track Card (Card 1) */}
        <TouchableOpacity
          style={[styles.miniTrackCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          onPress={handleTogglePlay}
          activeOpacity={0.9}
        >
          <View style={[styles.miniPlayBtn, { backgroundColor: emeraldPrimary }]}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
          </View>
          <View style={styles.miniTrackInfo}>
            <Text style={[styles.miniTrackTitle, { color: textDark }]}>
              {isQuick
                ? '1. Chapter Quick Recap'
                : isDetailed
                ? '1. Chapter Complete Coverage'
                : '1. Fast Exam Microcast'}
            </Text>
            <Text style={[styles.miniTrackSub, { color: textMuted }]}>
              {isPlaying ? 'Playing' : 'Paused'} · {formatSeconds(currentSec)} of{' '}
              {totalDurationLabel}
              {isQuick ? ' · Complete chapter coverage' : ''}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 5. Active Player Block */}
        <View style={styles.activePlayerHeader}>
          <Text style={[styles.activePlayerTitle, { color: textDark }]}>
            {isQuick
              ? '1. Chapter Quick Recap'
              : isDetailed
              ? '1. Chapter Complete Coverage'
              : '1. Fast Exam Microcast'}
          </Text>
          <Text style={[styles.activePlayerSubtitle, { color: textMuted }]}>
            {chapterTitle}
          </Text>
        </View>

        {/* Player Controls Card (Card 2) */}
        <View style={[styles.controlsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.controlsRow}>
            {/* Skip Back 15s */}
            <TouchableOpacity
              style={[styles.skipRoundBtn, { backgroundColor: mintPillBg }]}
              onPress={() => handleSkip(-15)}
              activeOpacity={0.75}
            >
              <Ionicons name="refresh-outline" size={18} color={isDark ? '#4ade80' : '#142B20'} />
              <Text style={[styles.skipSecLabel, { color: isDark ? '#4ade80' : '#142B20' }]}>15</Text>
            </TouchableOpacity>

            {/* Main Play / Pause */}
            <TouchableOpacity
              style={[styles.mainPlayBtn, { backgroundColor: emeraldPrimary }]}
              onPress={handleTogglePlay}
              activeOpacity={0.85}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Skip Forward 15s */}
            <TouchableOpacity
              style={[styles.skipRoundBtn, { backgroundColor: mintPillBg }]}
              onPress={() => handleSkip(15)}
              activeOpacity={0.75}
            >
              <Text style={[styles.skipSecLabel, { color: isDark ? '#4ade80' : '#142B20' }]}>15</Text>
              <Ionicons name="refresh-outline" size={18} color={isDark ? '#4ade80' : '#142B20'} />
            </TouchableOpacity>

            {/* Playback Speed */}
            <TouchableOpacity
              style={styles.speedBtn}
              onPress={handleCycleSpeed}
              activeOpacity={0.75}
            >
              <Text style={[styles.speedText, { color: textDark }]}>
                {SPEED_OPTIONS[speedIndex]}×
              </Text>
            </TouchableOpacity>

            {/* Timestamp */}
            <Text style={[styles.timestampText, { color: textMuted }]}>
              {formatSeconds(currentSec)} / {totalDurationLabel}
            </Text>
          </View>
        </View>

        {/* Progress Bar under Card 2 */}
        <View style={[styles.progressTrack, { backgroundColor: isDark ? '#263B30' : '#DCECE3' }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: emeraldPrimary },
            ]}
          />
        </View>

        {/* 6. Transcript Section */}
        <View style={styles.transcriptWrap}>
          <Text style={[styles.transcriptTitle, { color: textDark }]}>Transcript</Text>
          <Text style={[styles.transcriptSubtitle, { color: textMuted }]}>
            {isQuick ? 'Karaoke sync · Tap a word to jump · Dotted terms to define' : 'Tap a word to jump · Dotted terms to define'}
          </Text>

          <View style={[styles.transcriptCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {isQuick ? (
              <>
                <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                  Imagine pouring solid wood chips or liquid blood directly into the gas tank of a{' '}
                  <Text
                    style={styles.dottedTerm}
                    onPress={() =>
                      setActiveTooltip({
                        term: 'Ferrari',
                        text: GLOSSARY_TOOLTIPS['Ferrari'],
                      })
                    }
                  >
                    Ferrari
                  </Text>
                  . The engine would struggle to process it. In the insect world, that rule of
                  engineering is turned upside down.
                </Text>

                <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                  We're looking at a biological landscape where a microscopic tube has adapted to
                  process incredibly diverse fuels.
                </Text>

                <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                  The insect gut has three distinct zones: the{' '}
                  <Text
                    style={styles.dottedTerm}
                    onPress={() =>
                      setActiveTooltip({
                        term: 'Foregut',
                        text: GLOSSARY_TOOLTIPS['foregut'],
                      })
                    }
                  >
                    foregut
                  </Text>
                  ,{' '}
                  <Text
                    style={styles.dottedTerm}
                    onPress={() =>
                      setActiveTooltip({
                        term: 'Midgut',
                        text: GLOSSARY_TOOLTIPS['midgut'],
                      })
                    }
                  >
                    midgut
                  </Text>
                  , and{' '}
                  <Text
                    style={styles.dottedTerm}
                    onPress={() =>
                      setActiveTooltip({
                        term: 'Hindgut',
                        text: GLOSSARY_TOOLTIPS['hindgut'],
                      })
                    }
                  >
                    hindgut
                  </Text>
                  . Each plays a different role in extracting energy and keeping the insect alive.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                  Yuteng once said, happiness for me is largely a matter of{' '}
                  <Text
                    style={styles.dottedTerm}
                    onPress={() =>
                      setActiveTooltip({
                        term: 'Digestion',
                        text: GLOSSARY_TOOLTIPS['digestion'],
                      })
                    }
                  >
                    digestion
                  </Text>
                  . I mean, he's not wrong. If you're listening to this, you might think about
                  digestion after a heavy meal.
                </Text>

                <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                  But for insects, digestion isn't just processing lunch. It is a high-stakes
                  evolutionary battleground.
                </Text>

                <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                  Today, we're unpacking the insect{' '}
                  <Text
                    style={styles.dottedTerm}
                    onPress={() =>
                      setActiveTooltip({
                        term: 'Elementary Canal',
                        text: GLOSSARY_TOOLTIPS['elementary canal'],
                      })
                    }
                  >
                    elementary canal
                  </Text>{' '}
                  and the specialized systems that help insects survive.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* 7. FOLLOW ALONG IN READ Section */}
        <View style={styles.followAlongWrap}>
          <View style={styles.followAlongHeader}>
            <Text style={[styles.followAlongTitle, { color: textDark }]}>
              FOLLOW ALONG IN READ
            </Text>
            <Text style={[styles.followAlongCount, { color: textMuted }]}>
              {isDetailed ? 'TOPIC 1 OF 8' : 'TOPIC 1 OF 6'}
            </Text>
          </View>

          {/* Module Pills: M1, M2, M3, M4, M5, M6 */}
          <View style={[styles.modulePillContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {[1, 2, 3, 4, 5, 6].map((num) => {
              // In detailed screenshot, M1 and M2 are dark green
              // In quick screenshot, M1 is dark green
              const isPillActive = isDetailed ? num <= 2 : num === 1;
              const isSelected = selectedModule === num;

              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.modulePill,
                    isPillActive
                      ? { backgroundColor: '#1A3828', borderColor: '#1A3828' }
                      : { backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedModule(num);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modulePillText,
                      { color: isPillActive ? '#FFFFFF' : textDark },
                    ]}
                  >
                    M{num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Module Topic Focus Card */}
          <TouchableOpacity
            style={[styles.topicFocusCard, { backgroundColor: isDark ? 'rgba(74, 222, 128, 0.1)' : '#E7F4ED', borderColor: isDark ? '#2A4638' : '#CEE6D9' }]}
            onPress={() => onNavigateToRead?.(selectedModule)}
            activeOpacity={0.85}
          >
            <Text style={[styles.topicFocusLabel, { color: emeraldPrimary }]}>
              MODULE {selectedModule} · TOPIC FOCUS
            </Text>
            <Text style={[styles.topicFocusTitle, { color: textDark }]}>
              {isQuick
                ? 'Quick Review of Database Concepts & Architecture'
                : 'Introduction to the World of Databases'}
            </Text>
            <View style={styles.jumpToReadPrompt}>
              <Text style={[styles.jumpPromptText, { color: emeraldPrimary }]}>
                Tap to read section in study guide
              </Text>
              <Ionicons name="arrow-forward" size={14} color={emeraldPrimary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Dotted Term Tooltip Modal */}
      <Modal
        visible={activeTooltip !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTooltip(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveTooltip(null)}
        >
          <View style={[styles.tooltipCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.tooltipHeader}>
              <Ionicons name="information-circle" size={20} color={emeraldPrimary} />
              <Text style={[styles.tooltipTitle, { color: textDark }]}>
                {activeTooltip?.term}
              </Text>
            </View>
            <Text style={[styles.tooltipBody, { color: isDark ? '#D8E5DC' : '#2D3E36' }]}>
              {activeTooltip?.text}
            </Text>
            <TouchableOpacity
              style={[styles.tooltipCloseBtn, { backgroundColor: emeraldPrimary }]}
              onPress={() => setActiveTooltip(null)}
            >
              <Text style={styles.tooltipCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 30,
  },
  tabletContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  brandingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 1,
  },
  modeSelectorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 30,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 25,
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionMatchLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  miniTrackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  miniPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTrackInfo: {
    flex: 1,
    gap: 2,
  },
  miniTrackTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  miniTrackSub: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  activePlayerHeader: {
    marginBottom: 12,
  },
  activePlayerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activePlayerSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    marginTop: 2,
  },
  controlsCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipRoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 40,
    borderRadius: 20,
    gap: 2,
  },
  skipSecLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  mainPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#00875A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  transcriptWrap: {
    marginBottom: 24,
  },
  transcriptTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  transcriptSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 12,
  },
  transcriptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transcriptParagraph: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '400',
  },
  dottedTerm: {
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    color: '#00875A',
  },
  followAlongWrap: {
    marginBottom: 20,
  },
  followAlongHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  followAlongTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  followAlongCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  modulePillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    marginBottom: 12,
  },
  modulePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  modulePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topicFocusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  topicFocusLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  topicFocusTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  jumpToReadPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  jumpPromptText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tooltipCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  tooltipBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  tooltipCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  tooltipCloseText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
