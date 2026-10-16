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
import Svg, { Path, Rect, Circle } from 'react-native-svg';
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

interface MicrocastEpisode {
  id: number;
  title: string;
  status: string;
  durationSec: number;
  durationLabel: string;
  recap: string;
}

const MICROCAST_EPISODES: MicrocastEpisode[] = [
  {
    id: 1,
    title: 'Anatomy of the three-part insect gut',
    status: 'Paused · 01:36 · Recap: 3 questions',
    durationSec: 96,
    durationLabel: '01:36',
    recap: 'Recap: 3 questions',
  },
  {
    id: 2,
    title: 'Inside the Insect Foregut and Gizzard',
    status: 'Resume at 0:48 · 02:10',
    durationSec: 130,
    durationLabel: '02:10',
    recap: 'Links to Read §2',
  },
  {
    id: 3,
    title: 'How Insect Digestion Activates Bt Toxins',
    status: '01:36 · Links to Read §3',
    durationSec: 96,
    durationLabel: '01:36',
    recap: 'Links to Read §3',
  },
  {
    id: 4,
    title: 'How insects recycle water from waste',
    status: '02:44 · Links to Read §4',
    durationSec: 164,
    durationLabel: '02:44',
    recap: 'Links to Read §4',
  },
  {
    id: 5,
    title: 'Peritrophic Membrane & Bt Toxin Defense',
    status: '02:15 · Links to Read §5',
    durationSec: 135,
    durationLabel: '02:15',
    recap: 'Links to Read §5',
  },
];

export default function ListenScreen({
  chapterNumber = 1,
  chapterTitle = 'Insect Digestive System & Anatomy',
  initialMode = 'quick',
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
  const [selectedMicrocastId, setSelectedMicrocastId] = useState<number>(1);
  const [activeTooltip, setActiveTooltip] = useState<{ term: string; text: string } | null>(null);

  // Quick vs Detailed durations & metadata
  const isQuick = mode === 'quick';
  const isDetailed = mode === 'detailed';
  const isMicro = mode === 'microcasts';

  // Active microcast item
  const activeMicrocast =
    MICROCAST_EPISODES.find((e) => e.id === selectedMicrocastId) || MICROCAST_EPISODES[0];

  // Duration in seconds: Quick = 20:24 (1224s), Detailed = 44:39 (2679s), Micro = 01:36 (96s)
  const totalDurationSec = isQuick ? 1224 : isDetailed ? 2679 : activeMicrocast.durationSec;
  const totalDurationLabel = isQuick ? '20:24' : isDetailed ? '44:39' : activeMicrocast.durationLabel;

  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

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
        ? 'Imagine pouring solid wood chips or liquid blood directly into the gas tank of a Ferrari. The engine would struggle to process it. In the insect world, that rule of engineering is turned upside down. We are looking at a biological landscape where a microscopic tube has adapted to process incredibly diverse fuels. The insect gut has three distinct zones: the foregut, midgut, and hindgut. Each plays a different role in extracting energy and keeping the insect alive.'
        : isDetailed
        ? 'Yuteng once said, happiness for me is largely a matter of digestion. I mean, he is not wrong. If you are listening to this, you might think about digestion after a heavy meal. But for insects, digestion is not just processing lunch. It is a high-stakes evolutionary battleground. Today, we are unpacking the insect elementary canal and the specialized systems that help insects survive.'
        : 'This is the brief on insect digestive anatomy, drawing from Dr. Chirukari Srinivasa Rao’s lectures. To understand how agricultural pests process their food, we must examine the highly specialized three-part tube of their digestive tract. Function dictates form. Foregut and hindgut have an ectodermal origin; the midgut has an endodermal origin.';

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

  // DevMode CSS Color Tokens (.quickListenMobile412918)
  // Background: #f6faf6
  // Brand title: #265945, Tagline: #576b6e
  // Active pill / buttons: #05996b, Selected chip: #1f4d40
  // Card borders: #d1e3d9, Light green containers: #e8f5ed
  const bg = isDark ? '#121E17' : '#F6FAF6';
  const cardBg = isDark ? '#1C2B23' : '#FFFFFF';
  const cardBorder = isDark ? '#2D4538' : '#D1E3D9';
  const brandColor = isDark ? '#4ADE80' : '#265945';
  const textDark = isDark ? '#FFFFFF' : '#172933';
  const textMuted = isDark ? '#A6C5B3' : '#576B6E';
  const emeraldPrimary = '#05996B';
  const mintPillBg = isDark ? 'rgba(5, 153, 107, 0.15)' : '#E8F5ED';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. BRANDING HEADER OR MICROCASTS HEADER */}
        {isMicro ? (
          /* Microcasts Header (.header, .brandMark, .pageTitle, .pageSubtitle, .profileAvatar) */
          <View style={styles.microHeaderContainer}>
            <View style={styles.microcastsHeader}>
              <View style={styles.microHeaderLeft}>
                {onBackPress && (
                  <TouchableOpacity
                    style={[styles.backBtnSmall, { backgroundColor: cardBg, borderColor: '#DBE5E0' }]}
                    onPress={onBackPress}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={16} color="#1A282D" />
                  </TouchableOpacity>
                )}
                <View style={[styles.brandMark, { backgroundColor: '#00996E' }]}>
                  <Text style={styles.brandMarkLetter}>S</Text>
                </View>
                <View>
                  <Text style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>Microcasts</Text>
                  <Text style={[styles.pageSubtitle, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                    Short audio lessons for focused learning
                  </Text>
                </View>
              </View>
              <View style={[styles.profileAvatar, { backgroundColor: isDark ? '#1C2B23' : '#E8F7ED', borderColor: '#DBE5E0' }]}>
                <Text style={[styles.profileInitials, { color: '#175945' }]}>A</Text>
              </View>
            </View>
            <View style={[styles.headerDivider, { backgroundColor: isDark ? '#2D4538' : '#DBE5E0' }]} />
          </View>
        ) : (
          /* Brand Header: Saral Vidhya / Learning Simplified (.brand & .subtitle) */
          <View style={styles.brandHeader}>
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
              <Text style={[styles.brand, { color: brandColor }]}>Saral Vidhya</Text>
              <Text style={[styles.tagline, { color: textMuted }]}>Learning Simplified</Text>
            </View>
          </View>
        )}

        {/* 2. THREE LISTEN MODE TABS (.listenModeTabs) */}
        <View style={[styles.listenModeTabs, { backgroundColor: cardBg, borderColor: isMicro ? '#DBE5E0' : cardBorder }]}>
          {/* Quick Listen Tab */}
          <TouchableOpacity
            style={[
              styles.listenTab,
              mode === 'quick' && [styles.listenTabSelected, { backgroundColor: emeraldPrimary }],
            ]}
            onPress={() => handleSelectMode('quick')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: mode === 'quick' ? '#FFFFFF' : (isDark ? '#A6C5B3' : '#172933') },
              ]}
            />
            <Text style={[styles.listenTabText, { color: mode === 'quick' ? '#FFFFFF' : textDark }]}>
              Quick Listen
            </Text>
          </TouchableOpacity>

          {/* Detailed Listen Tab */}
          <TouchableOpacity
            style={[
              styles.listenTab,
              mode === 'detailed' && [styles.listenTabSelected, { backgroundColor: emeraldPrimary }],
            ]}
            onPress={() => handleSelectMode('detailed')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: mode === 'detailed' ? '#FFFFFF' : (isDark ? '#A6C5B3' : '#172933') },
              ]}
            />
            <Text style={[styles.listenTabText, { color: mode === 'detailed' ? '#FFFFFF' : textDark }]}>
              Detailed Listen
            </Text>
          </TouchableOpacity>

          {/* Microcasts Tab */}
          <TouchableOpacity
            style={[
              styles.listenTab,
              mode === 'microcasts' && [styles.microcastsActiveTab, { backgroundColor: '#00996E' }],
            ]}
            onPress={() => handleSelectMode('microcasts')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: mode === 'microcasts' ? '#FFFFFF' : (isDark ? '#A6C5B3' : '#172933') },
              ]}
            />
            <Text
              style={[
                styles.listenTabText,
                {
                  color: mode === 'microcasts' ? '#FFFFFF' : textDark,
                  fontWeight: mode === 'microcasts' ? '600' : '500',
                },
              ]}
            >
              Microcasts
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* VIEW A & B: QUICK LISTEN & DETAILED LISTEN                                 */}
        {/* ========================================================================= */}
        {!isMicro ? (
          <>
            {/* 3. Section Label (.sectionLabel) */}
            <Text style={[styles.sectionLabel, { color: textMuted }]}>
              {isQuick ? 'QUICK LISTEN · STANDARD DEPTH' : 'DETAILED LISTEN · 1 OF 1 MATCH'}
            </Text>

            {/* 4. Chapter Audio Summary Card (.chapterAudioSummary) */}
            <TouchableOpacity
              style={[
                styles.chapterAudioSummary,
                { backgroundColor: cardBg, borderColor: isQuick ? emeraldPrimary : cardBorder },
              ]}
              onPress={handleTogglePlay}
              activeOpacity={0.9}
            >
              <View style={[styles.playChapter, { backgroundColor: emeraldPrimary }]}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color="#FFFFFF" />
              </View>
              <View style={styles.chapterAudioInfo}>
                <Text style={[styles.chapterTitle, { color: textDark }]}>
                  {isQuick ? '1. Chapter Quick Recap' : '1. Chapter Complete Coverage'}
                </Text>
                <Text style={[styles.chapterStatus, { color: textMuted }]}>
                  {isPlaying ? 'Playing' : 'Paused'} · {formatSeconds(currentSec)} of {totalDurationLabel}
                  {isQuick ? ' · Complete chapter coverage' : ''}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 5. Player Header (.playerTitle & .playerSubtitle) */}
            <View style={styles.playerHeader}>
              <Text style={[styles.playerTitle, { color: textDark }]}>
                {isQuick ? '1. Chapter Quick Recap' : '1. Chapter Complete Coverage'}
              </Text>
              <Text style={[styles.playerSubtitle, { color: textMuted }]}>
                {chapterTitle}
              </Text>
            </View>

            {/* 6. Audio Player Controls Card (.audioPlayerControls) */}
            <View style={[styles.audioPlayerControls, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Skip Back 15s */}
              <TouchableOpacity
                style={[styles.back15Seconds, { backgroundColor: mintPillBg }]}
                onPress={() => handleSkip(-15)}
                activeOpacity={0.75}
              >
                <Text style={[styles.backLabel, { color: textDark }]}>↶15</Text>
              </TouchableOpacity>

              {/* Main Play / Pause Circle (44x44) */}
              <TouchableOpacity
                style={[styles.playAudio, { backgroundColor: emeraldPrimary }]}
                onPress={handleTogglePlay}
                activeOpacity={0.85}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Skip Forward 15s */}
              <TouchableOpacity
                style={[styles.forward30Seconds, { backgroundColor: mintPillBg }]}
                onPress={() => handleSkip(15)}
                activeOpacity={0.75}
              >
                <Text style={[styles.forwardLabel, { color: textDark }]}>15↷</Text>
              </TouchableOpacity>

              {/* Speed Button */}
              <TouchableOpacity
                style={styles.speedBtn}
                onPress={handleCycleSpeed}
                activeOpacity={0.75}
              >
                <Text style={[styles.speedText, { color: textDark }]}>
                  {SPEED_OPTIONS[speedIndex]}×
                </Text>
              </TouchableOpacity>

              {/* Duration Timestamp */}
              <Text style={[styles.durationText, { color: textMuted }]}>
                {formatSeconds(currentSec)} / {totalDurationLabel}
              </Text>
            </View>

            {/* 7. Audio Progress Track (.audioProgressTrack) */}
            <View style={[styles.audioProgressTrack, { backgroundColor: isDark ? '#263B30' : '#D1E3D9' }]}>
              <View
                style={[
                  styles.audioProgress,
                  { width: `${progressPercent}%`, backgroundColor: emeraldPrimary },
                ]}
              />
            </View>

            {/* 8. Transcript Section (.transcriptHeading & .transcriptReadingCard) */}
            <View style={styles.transcriptSection}>
              <Text style={[styles.transcriptHeading, { color: textDark }]}>Transcript</Text>
              <Text style={[styles.transcriptHint, { color: textMuted }]}>
                {isQuick
                  ? 'Karaoke sync · Tap a word to jump · Dotted terms to define'
                  : 'Tap a word to jump · Dotted terms to define'}
              </Text>

              <View style={[styles.transcriptReadingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
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
                      We’re looking at a biological landscape where a microscopic tube has adapted to
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
                      . I mean, he’s not wrong. If you’re listening to this, you might think about
                      digestion after a heavy meal.
                    </Text>

                    <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                      But for insects, digestion isn’t just processing lunch. It is a high-stakes
                      evolutionary battleground.
                    </Text>

                    <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                      Today, we’re unpacking the insect{' '}
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

            {/* 9. Follow Along in Read (.followHeading, .moduleChips, .topicFocusCard) */}
            <View style={styles.followAlongWrap}>
              <View style={styles.followAlongHeader}>
                <Text style={[styles.followHeading, { color: textDark }]}>FOLLOW ALONG IN READ</Text>
                <Text style={[styles.topicCounter, { color: textMuted }]}>
                  {isDetailed ? 'TOPIC 1 OF 8' : 'TOPIC 1 OF 6'}
                </Text>
              </View>

              {/* Module Chips (M1, M2, M3, M4, M5, M6) */}
              <View style={[styles.moduleChips, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  // In Detailed: M1 & M2 are highlighted; in Quick: M1 is highlighted
                  const isHighlighted = isDetailed ? num <= 2 : num === 1;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.moduleChipBtn,
                        isHighlighted
                          ? { backgroundColor: '#1F4D40', borderColor: '#1F4D40' }
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
                          styles.moduleLabel,
                          { color: isHighlighted ? '#FFFFFF' : textDark },
                        ]}
                      >
                        M{num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Topic Focus Card (.topicFocusCard) */}
              <TouchableOpacity
                style={[
                  styles.topicFocusCard,
                  {
                    backgroundColor: isDark ? 'rgba(5, 153, 107, 0.12)' : '#E8F5ED',
                    borderColor: cardBorder,
                  },
                ]}
                onPress={() => onNavigateToRead?.(selectedModule)}
                activeOpacity={0.85}
              >
                <Text style={[styles.focusEyebrow, { color: emeraldPrimary }]}>
                  MODULE {selectedModule} · TOPIC FOCUS
                </Text>
                <Text style={[styles.focusTitle, { color: textDark }]}>
                  {isQuick
                    ? 'Quick Review of Database Concepts & Architecture'
                    : 'Introduction to the World of Databases'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ========================================================================= */
          /* VIEW C: MICROCASTS VIEW (Figma DevMode .microcastsMobile412918)            */
          /* ========================================================================= */
          <View style={styles.microcastsView}>
            {/* Header row: MICROCASTS · STANDARD DEPTH / 5 lessons matched / See all */}
            <View style={styles.microSectionRow}>
              <View>
                <Text style={[styles.sectionEyebrow, { color: '#175945' }]}>
                  MICROCASTS · STANDARD DEPTH
                </Text>
                <Text style={[styles.filterSummary, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                  5 lessons matched
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.seeAll, { color: '#00996E' }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* List of Microcast Lesson Cards */}
            <View style={styles.microList}>
              {MICROCAST_EPISODES.map((ep) => {
                const isSelected = selectedMicrocastId === ep.id;
                return (
                  <TouchableOpacity
                    key={ep.id}
                    style={[
                      styles.microLessonCard,
                      isSelected
                        ? {
                            backgroundColor: isDark ? 'rgba(0, 153, 110, 0.15)' : '#E8F7ED',
                            borderColor: '#00996E',
                          }
                        : {
                            backgroundColor: cardBg,
                            borderColor: isDark ? '#2D4538' : '#DBE5E0',
                          },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMicrocastId(ep.id);
                      if (!isSelected) {
                        setCurrentSec(0);
                        setIsPlaying(false);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    {/* Circle badge: active = green with play/pause or number; inactive = white with gray border & dark text */}
                    {isSelected ? (
                      <View style={[styles.microEpisodeNumberActive, { backgroundColor: '#00996E' }]}>
                        {isPlaying ? (
                          <Ionicons name="pause" size={13} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.microEpisodeNumberActiveText}>{ep.id}</Text>
                        )}
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.microEpisodeNumberInactive,
                          {
                            backgroundColor: cardBg,
                            borderColor: isDark ? '#2D4538' : '#DBE5E0',
                          },
                        ]}
                      >
                        <Text style={[styles.microEpisodeNumberInactiveText, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>
                          {ep.id}
                        </Text>
                      </View>
                    )}

                    {/* Lesson Info: Title & Metadata */}
                    <View style={styles.microLessonInfo}>
                      <Text
                        style={[styles.microEpisodeTitle, { color: isDark ? '#FFFFFF' : '#1A282D' }]}
                        numberOfLines={1}
                      >
                        {ep.title}
                      </Text>
                      <Text style={[styles.microEpisodeMetadata, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                        {ep.status}
                      </Text>
                    </View>

                    {/* Download Action Glyph (21x21 circle) */}
                    <TouchableOpacity
                      style={[
                        styles.downloadAction,
                        {
                          backgroundColor: cardBg,
                          borderColor: isDark ? '#2D4538' : '#DBE5E0',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-down" size={11} color={isDark ? '#A6C5B3' : '#637375'} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Microcast Compact Audio Player Card (.audioPlayer) */}
            <View
              style={[
                styles.audioPlayerCard,
                {
                  backgroundColor: cardBg,
                  borderColor: isDark ? '#2D4538' : '#DBE5E0',
                },
              ]}
            >
              {/* Top Row: Headphones Icon, Title, Episode progress, and Track */}
              <View style={styles.audioPlayerTopRow}>
                <View style={[styles.headphonesIconBg, { backgroundColor: isDark ? '#1C2B23' : '#E8F7ED' }]}>
                  <Ionicons name="headset" size={17} color="#175945" />
                </View>
                <View style={styles.audioPlayerTitleWrap}>
                  <Text
                    style={[styles.nowPlayingTitle, { color: isDark ? '#FFFFFF' : '#1A282D' }]}
                    numberOfLines={1}
                  >
                    {activeMicrocast.title}
                  </Text>
                  <Text style={[styles.episodeProgress, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                    Episode {activeMicrocast.id} of {MICROCAST_EPISODES.length} · {isPlaying ? 'Playing' : 'Paused'}
                  </Text>
                </View>
              </View>

              {/* Middle Row: Thin 3px Playback Track (.playbackTrack) */}
              <View style={[styles.playbackTrack, { backgroundColor: isDark ? '#263B30' : '#DBE5E0' }]}>
                <View
                  style={[
                    styles.playbackTrackProgress,
                    { width: `${progressPercent}%`, backgroundColor: '#00996E' },
                  ]}
                />
              </View>

              {/* Bottom Row: Replay 15s, Play/Pause Button, Speed Control, Playback Time */}
              <View style={styles.audioPlayerBottomRow}>
                <View style={styles.audioControlsLeft}>
                  {/* Replay 15s (.replay15Seconds) */}
                  <TouchableOpacity
                    style={[
                      styles.replay15Seconds,
                      {
                        backgroundColor: cardBg,
                        borderColor: isDark ? '#2D4538' : '#DBE5E0',
                      },
                    ]}
                    onPress={() => handleSkip(-15)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="refresh" size={11} color={isDark ? '#FFFFFF' : '#1A282D'} />
                  </TouchableOpacity>

                  {/* Play Button (.playButton) */}
                  <TouchableOpacity
                    style={[styles.playButton, { backgroundColor: '#00996E' }]}
                    onPress={handleTogglePlay}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Speed Control (.speedControl) */}
                  <TouchableOpacity
                    style={styles.speedControlBtn}
                    onPress={handleCycleSpeed}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.speedControlText}>
                      {SPEED_OPTIONS[speedIndex]}x
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Playback Time (.playbackTime) */}
                <Text style={[styles.playbackTime, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                  {formatSeconds(currentSec)} / {activeMicrocast.durationLabel}
                </Text>
              </View>
            </View>

            {/* Microcast Transcript Panel (.transcriptPanel) */}
            <View
              style={[
                styles.transcriptPanel,
                {
                  backgroundColor: cardBg,
                  borderColor: isDark ? '#2D4538' : '#DBE5E0',
                },
              ]}
            >
              <Text style={[styles.transcriptHeadingText, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>
                Transcript
              </Text>
              <Text style={[styles.transcriptHelper, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                Karaoke sync · tap dotted terms to define
              </Text>

              {/* Transcript Divider (.transcriptDivider) */}
              <View style={[styles.transcriptDivider, { backgroundColor: isDark ? '#2D4538' : '#DBE5E0' }]} />

              <View style={styles.transcriptParagraphsWrap}>
                <Text style={[styles.transcriptParagraphText, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>
                  This is the brief on insect digestive anatomy, drawing from Dr. Chirukari Srinivasa
                  Rao’s lectures. To understand how agricultural pests process their food, we must
                  examine the highly specialized three-part tube of their{' '}
                  <Text
                    style={styles.dottedTerm}
                    onPress={() =>
                      setActiveTooltip({
                        term: 'Alimentary Canal',
                        text: GLOSSARY_TOOLTIPS['alimentary canal'],
                      })
                    }
                  >
                    digestive tract
                  </Text>
                  .
                </Text>
                <Text style={[styles.transcriptParagraphText, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>
                  Why would parts of the same gut have completely different linings? Function dictates
                  form. Foregut and hindgut have an ectodermal origin; the{' '}
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
                  </Text>{' '}
                  has an endodermal origin.
                </Text>
                <Text style={[styles.transcriptParagraphText, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>
                  The foregut and hindgut have a cuticular intima that is shed at each larval molt. The
                  midgut lacks this lining, allowing chemical{' '}
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
                  </Text>{' '}
                  and nutrient absorption.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  /* Brand Header (.brand, .tagline) */
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  tagline: {
    fontSize: 11,
    lineHeight: 16,
  },
  /* Microcasts Header (.header, .brandMark, .pageTitle, .pageSubtitle, .profileAvatar, .headerDivider) */
  microHeaderContainer: {
    marginBottom: 12,
  },
  microcastsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  microHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtnSmall: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  pageSubtitle: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerDivider: {
    height: 1,
    width: '100%',
    marginTop: 12,
  },
  /* Mode Tabs (.listenModeTabs) */
  listenModeTabs: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    marginBottom: 16,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  microcastsActiveTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  listenTab: {
    flex: 1,
    height: 34,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  listenTabSelected: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  listenTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* Section Labels (.sectionLabel) */
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  /* Chapter Audio Summary Card (.chapterAudioSummary) */
  chapterAudioSummary: {
    height: 65,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  playChapter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterAudioInfo: {
    flex: 1,
    gap: 2,
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  chapterStatus: {
    fontSize: 9.5,
  },
  /* Player Header (.playerTitle, .playerSubtitle) */
  playerHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  playerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  playerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  /* Controls Card (.audioPlayerControls) */
  audioPlayerControls: {
    height: 67,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  back15Seconds: {
    width: 42,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  playAudio: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forward30Seconds: {
    width: 43,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forwardLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  speedBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  /* Progress Track (.audioProgressTrack) */
  audioProgressTrack: {
    height: 5,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 20,
  },
  audioProgress: {
    height: 5,
    borderRadius: 3,
  },
  /* Transcript (.transcriptHeading, .transcriptReadingCard) */
  transcriptSection: {
    marginBottom: 24,
  },
  transcriptHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transcriptHint: {
    fontSize: 9.5,
    marginBottom: 8,
  },
  transcriptReadingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  transcriptParagraph: {
    fontSize: 12,
    lineHeight: 19,
  },
  dottedTerm: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    fontWeight: '600',
  },
  /* Follow Along in Read (.followHeading, .moduleChips, .topicFocusCard) */
  followAlongWrap: {
    gap: 10,
  },
  followAlongHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  followHeading: {
    fontSize: 11,
    fontWeight: '600',
  },
  topicCounter: {
    fontSize: 10,
    fontWeight: '500',
  },
  moduleChips: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  moduleChipBtn: {
    width: 52,
    height: 27,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  topicFocusCard: {
    height: 57,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 2,
  },
  focusEyebrow: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  focusTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  /* Microcasts Layout (.microcastsMobile412918) */
  microcastsView: {
    gap: 12,
  },
  microSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterSummary: {
    fontSize: 11,
    marginTop: 2,
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '600',
  },
  microList: {
    gap: 8,
  },
  microLessonCard: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  microEpisodeNumberActive: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microEpisodeNumberActiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  microEpisodeNumberInactive: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microEpisodeNumberInactiveText: {
    fontSize: 11,
    fontWeight: '600',
  },
  microLessonInfo: {
    flex: 1,
    gap: 2,
  },
  microEpisodeTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  microEpisodeMetadata: {
    fontSize: 9,
  },
  downloadAction: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Compact Audio Player Card (.audioPlayer) */
  audioPlayerCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginTop: 4,
  },
  audioPlayerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headphonesIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  nowPlayingTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  episodeProgress: {
    fontSize: 9,
  },
  playbackTrack: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  playbackTrackProgress: {
    height: 3,
    borderRadius: 1.5,
  },
  audioPlayerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioControlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replay15Seconds: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedControlBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  speedControlText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#175945',
  },
  playbackTime: {
    fontSize: 8,
    fontWeight: '500',
  },
  /* Microcasts Transcript Panel (.transcriptPanel) */
  transcriptPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  transcriptHeadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  transcriptHelper: {
    fontSize: 9,
    marginTop: 2,
  },
  transcriptDivider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  transcriptParagraphsWrap: {
    gap: 10,
  },
  transcriptParagraphText: {
    fontSize: 11.5,
    lineHeight: 18,
  },
  /* Tooltip Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tooltipCard: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 12,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tooltipBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  tooltipCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  tooltipCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
