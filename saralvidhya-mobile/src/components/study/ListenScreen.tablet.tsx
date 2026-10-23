import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { SAMPLE_PODCASTS, MicrocastItemData, ChapterPodcastBundle } from '@/data/samplePodcasts';
import {
  fetchPodcastMetadata,
  fetchMicrocastTranscript,
  fetchPodcastTranscript,
} from '@/services/contentService';

export type ListenMode = 'quick' | 'detailed' | 'microcasts';

interface ListenScreenTabletProps {
  chapterNumber?: number;
  chapterTitle?: string;
  initialMode?: ListenMode;
  onNavigateToRead?: (moduleNumber?: number) => void;
  onBackPress?: () => void;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

const GLOSSARY_DEFINITIONS: Record<string, string> = {
  foregut: 'Stomodaeum: anterior region of digestive tract of ectodermal origin lined with cuticular intima.',
  midgut: 'Mesenteron: central digestive chamber of endodermal origin lacking cuticle, major site of digestion & absorption.',
  hindgut: 'Proctodaeum: posterior chamber of ectodermal origin lined with cuticle, reclaims water & electrolytes.',
  'cuticular intima': 'Chitinous inner lining shed during each larval molt (ecdysis) protecting cells from abrasion.',
  ectodermal: 'Originating from the embryonic ectoderm, characteristically possessing a cuticle lining.',
  endodermal: 'Originating from the embryonic endoderm, allowing naked microvillar chemical digestion.',
  digestion: 'The biochemical and physical breakdown of food into nutrient molecules absorbed by gut enterocytes.',
  absorption: 'The uptake of dissolved amino acids, carbohydrates, and minerals across the gut epithelium into hemolymph.',
};

// Module topic focus definitions
const MODULE_TOPICS: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'Architectural Blueprint & Alimentary Canal',
    subtitle: 'One tube, three chambers — embryonic origin & histological layers',
  },
  2: {
    title: 'Foregut Mechanics & Proventriculus Gizzard',
    subtitle: 'Muscular ingestion pump, storage crop & cuticular teeth filtration',
  },
  3: {
    title: 'Midgut Histology & Peritrophic Membrane',
    subtitle: 'Enzyme secretion, peritrophic matrix sieve & nutrient absorption',
  },
  4: {
    title: 'Hindgut Osmoregulation & Rectal Pads',
    subtitle: 'Malpighian tubule filtration, electrolyte recovery & dry frass compaction',
  },
  5: {
    title: 'Salivary Versatility & Chemical Weapons',
    subtitle: 'Pre-oral external digestion, anticoagulant injection & silk production',
  },
  6: {
    title: 'Filter Chambers & Symbiotic Wood Digestion',
    subtitle: 'Sap-shunting bypass organs & termite flagellate cellulase fermentation',
  },
};

// Walkthrough topic items for the right sidebar
const WALKTHROUGH_TOPICS = [
  { id: 1, title: 'Chapter Complete Coverage', duration: '44:39', desc: 'Full chapter walkthrough' },
  { id: 2, title: 'Key Concepts and Definitions', duration: '12:18', desc: 'Core concepts explained' },
  { id: 3, title: 'Real-world Examples', duration: '08:26', desc: 'Examples and use cases' },
  { id: 4, title: 'Quick Recap', duration: '06:12', desc: 'Summary of key points' },
  { id: 5, title: 'Practice Questions', duration: '10:05', desc: 'Check your understanding' },
  { id: 6, title: 'Additional Resources', duration: '05:30', desc: 'Links and references' },
];

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function ListenScreenTablet({
  chapterNumber = 1,
  chapterTitle = 'Insect Digestive System & Anatomy',
  initialMode = 'detailed',
  onNavigateToRead,
  onBackPress,
}: ListenScreenTabletProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  // Mode: defaults to 'detailed' as depicted in user's latest reference PNG
  const [mode, setMode] = useState<ListenMode>(initialMode);
  const [selectedMicrocastId, setSelectedMicrocastId] = useState<number>(1);
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSec, setCurrentSec] = useState<number>(0);
  const [speedIndex, setSpeedIndex] = useState<number>(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [activeTooltip, setActiveTooltip] = useState<{ term: string; definition: string } | null>(null);

  // Cloud database dynamic state
  const [cloudTitles, setCloudTitles] = useState<string[] | null>(null);
  const [cloudTranscript, setCloudTranscript] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);

  // Playback timers
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch chapter podcast metadata from cloud DB
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    fetchPodcastMetadata('ento_131', chapterNumber, controller.signal)
      .then((data) => {
        if (isMounted && data?.microcast_titles?.length) {
          setCloudTitles(data.microcast_titles);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [chapterNumber]);

  // Fetch live active track transcript from cloud DB
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsCloudLoading(true);

    if (mode === 'microcasts') {
      fetchMicrocastTranscript('ento_131', chapterNumber, selectedMicrocastId, controller.signal)
        .then((txt) => {
          if (isMounted && txt && txt.trim().length > 20) {
            setCloudTranscript(txt.trim());
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsCloudLoading(false);
        });
    } else if (mode === 'quick') {
      fetchPodcastTranscript('ento_131', chapterNumber, 'short', controller.signal)
        .then((txt) => {
          if (isMounted && txt && txt.trim().length > 20) {
            setCloudTranscript(txt.trim());
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsCloudLoading(false);
        });
    } else if (mode === 'detailed') {
      fetchPodcastTranscript('ento_131', chapterNumber, 'long', controller.signal)
        .then((txt) => {
          if (isMounted && txt && txt.trim().length > 20) {
            setCloudTranscript(txt.trim());
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsCloudLoading(false);
        });
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [chapterNumber, mode, selectedMicrocastId]);

  // Data bundle
  const currentBundle: ChapterPodcastBundle = useMemo(() => {
    return SAMPLE_PODCASTS[chapterNumber] || SAMPLE_PODCASTS[1];
  }, [chapterNumber]);

  // Microcast list for Chapter (live titles from DB with fallback)
  const microcastList: MicrocastItemData[] = useMemo(() => {
    const base = currentBundle.microcasts || [];
    return base.map((item, idx) => ({
      ...item,
      title: (cloudTitles && cloudTitles[idx]) || item.title,
    }));
  }, [currentBundle, cloudTitles]);

  // Active microcast
  const activeMicrocast = useMemo(() => {
    return (
      microcastList.find((m) => m.id === selectedMicrocastId) ||
      microcastList[0]
    );
  }, [microcastList, selectedMicrocastId]);

  // Active track information based on mode
  const activeTrack = useMemo(() => {
    if (mode === 'quick') {
      return {
        title: '1. Chapter Quick Recap',
        durationSec: currentBundle.quick?.durationSec || 1224,
        durationFormatted: '20:24',
        subtitle: 'Paused · 00:00 of 20:24 · Complete chapter coverage',
        paragraphs: currentBundle.quick?.paragraphs || [],
      };
    }
    if (mode === 'detailed') {
      return {
        title: '1. Chapter Complete Coverage',
        durationSec: currentBundle.detailed?.durationSec || 2677,
        durationFormatted: '44:39',
        subtitle: 'Paused · 00:00 of 44:39',
        paragraphs: currentBundle.detailed?.paragraphs || [],
      };
    }
    return {
      title: activeMicrocast.title,
      durationSec: activeMicrocast.durationSec,
      durationFormatted: activeMicrocast.durationFormatted.replace(/^00:/, ''),
      subtitle: `Microcast · Episode ${activeMicrocast.id} of ${microcastList.length}`,
      paragraphs: activeMicrocast.paragraphs,
    };
  }, [mode, activeMicrocast, microcastList, currentBundle]);

  const totalDurationSec = activeTrack.durationSec;
  const currentSpeed = SPEED_OPTIONS[speedIndex];

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      try {
        Speech.stop().catch(() => {});
      } catch {}
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    };
  }, []);

  // When track or mode changes, reset playback
  useEffect(() => {
    try {
      Speech.stop().catch(() => {});
    } catch {}
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    setIsPlaying(false);
    setCurrentSec(0);
    setActiveWordIndex(-1);
  }, [mode, selectedMicrocastId]);

  // Default transcript text based on mode (matches reference PNG)
  const defaultTranscript = useMemo(() => {
    if (mode === 'detailed') {
      return `Yuteng once said, happiness for me is largely a matter of digestion. I mean, he's not wrong. If you're listening to this, you might think about digestion after a heavy meal.

But for insects, digestion isn't just processing lunch. It is a high-stakes evolutionary battleground.

Today, we're unpacking the insect alimentary canal and the specialized systems that help insects survive.`;
    }
    if (mode === 'quick') {
      return `Imagine pouring solid wood chips or liquid blood directly into the gas tank of a Ferrari. The engine would struggle to process it. In the insect world, that rule of engineering is turned upside down.

We're looking at a biological landscape where a microscopic tube has adapted to process incredibly diverse fuels.

The insect gut has three distinct zones: the foregut, midgut, and hindgut. Each plays a different role in extracting energy and keeping the insect alive.`;
    }
    return 'This is a brief overview of insect digestive anatomy. The foregut and hindgut have an ectodermal origin and a cuticular intima; the midgut develops from endoderm and supports most digestion and nutrient absorption.';
  }, [mode]);

  const rawTranscript = cloudTranscript || defaultTranscript;

  // Audio Play / Pause handler
  const handleTogglePlay = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    if (isPlaying) {
      setIsPlaying(false);
      try {
        await Speech.stop();
      } catch {}
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    } else {
      setIsPlaying(true);
      const textToSpeak = rawTranscript;
      const words = textToSpeak.split(/\s+/).filter(Boolean);
      let wordIdx = 0;

      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
      wordTickerRef.current = setInterval(() => {
        if (wordIdx < words.length) {
          setActiveWordIndex(wordIdx++);
        } else {
          setActiveWordIndex(-1);
          if (wordTickerRef.current) clearInterval(wordTickerRef.current);
        }
      }, Math.max(160, Math.round(320 / currentSpeed)));

      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = setInterval(() => {
        setCurrentSec((prev) => {
          const next = prev + 1;
          if (next >= totalDurationSec) {
            setIsPlaying(false);
            if (tickerRef.current) clearInterval(tickerRef.current);
            if (wordTickerRef.current) clearInterval(wordTickerRef.current);
            return 0;
          }
          return next;
        });
      }, 1000 / currentSpeed);

      Speech.speak(textToSpeak, {
        rate: currentSpeed,
        language: 'en-IN',
        onDone: () => {
          setIsPlaying(false);
          setActiveWordIndex(-1);
          if (tickerRef.current) clearInterval(tickerRef.current);
          if (wordTickerRef.current) clearInterval(wordTickerRef.current);
        },
        onError: () => {
          setIsPlaying(false);
          if (tickerRef.current) clearInterval(tickerRef.current);
          if (wordTickerRef.current) clearInterval(wordTickerRef.current);
        },
      });
    }
  };

  // Replay 15 seconds
  const handleReplay15s = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setCurrentSec((prev) => Math.max(0, prev - 15));
  };

  // Forward 15 seconds
  const handleForward15s = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setCurrentSec((prev) => Math.min(totalDurationSec, prev + 15));
  };

  // Cycle playback speed
  const handleCycleSpeed = () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    const nextIdx = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIdx);
  };

  // Select a microcast card & play inline directly
  const handleSelectAndPlayMicrocast = (mId: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    if (selectedMicrocastId === mId) {
      handleTogglePlay();
      return;
    }

    try {
      Speech.stop().catch(() => {});
    } catch {}
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    setIsPlaying(false);
    setCurrentSec(0);
    setActiveWordIndex(-1);

    setSelectedMicrocastId(mId);

    setTimeout(() => {
      handleTogglePlay();
    }, 60);
  };

  // Select module M1-M6
  const handleSelectModule = (mId: number) => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    setSelectedModuleId(mId);
  };

  // Dotted term interaction
  const handleTermPress = (term: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    const clean = term.toLowerCase().replace(/[^a-z]/g, '');
    const matchedKey = Object.keys(GLOSSARY_DEFINITIONS).find((k) =>
      clean.includes(k) || k.includes(clean)
    );
    if (matchedKey) {
      setActiveTooltip({
        term: matchedKey.toUpperCase(),
        definition: GLOSSARY_DEFINITIONS[matchedKey],
      });
    }
  };

  // Color tokens matching user PNG reference:
  // Background: Clean mint off-white #F4F8F5 / #F7FAF8 (light), #0F1713 (dark)
  // Text: #1A2E26 (dark charcoal), muted: #5E7A6B
  // Active pill / button: #057A44 / #0B7C4B
  // Inactive border: #D8E4DC
  // Module active pill bg: #E1EFE6 / #E8F4EC
  const screenBg = isDark ? '#0F1713' : '#F4F8F5';
  const cardBg = isDark ? '#16231B' : '#FFFFFF';
  const cardBorder = isDark ? '#2D4538' : '#D8E4DC';
  const activeBorder = isDark ? '#4ADE80' : '#057A44';
  const textColor = isDark ? '#FFFFFF' : '#1A2E26';
  const mutedTextColor = isDark ? '#8CA897' : '#5E7A6B';
  const headerBg = isDark ? '#16231B' : '#FFFFFF';
  const headerBorder = isDark ? '#2D4538' : '#E2EBE5';
  const brandGreen = isDark ? '#4ADE80' : '#057A44';
  const mintActiveBg = isDark ? '#23392D' : '#E1EFE6';

  // Subheader labels based on mode
  const subheaderLabel =
    mode === 'detailed'
      ? 'DETAILED LISTEN · 1 OF 1 MATCH'
      : mode === 'quick'
      ? 'QUICK LISTEN · STANDARD DEPTH'
      : 'MICROCASTS · STANDARD DEPTH';

  const subheaderCount =
    mode === 'microcasts'
      ? `${microcastList.length} lessons matched`
      : '1 OF 1 MATCH';

  // Progress percentage
  const progressRatio = Math.min(1, Math.max(0, currentSec / (totalDurationSec || 1)));

  // Active module focus
  const activeFocus = MODULE_TOPICS[selectedModuleId] || MODULE_TOPICS[1];
  const activeFocusTitle =
    mode === 'quick'
      ? `Quick Review of ${activeFocus.title.replace('Architectural Blueprint & ', '')}`
      : activeFocus.title;

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* ── 1. TOP HEADER BAR: SARAL VIDHYA BRAND & USER AVATAR ─────────── */}
      <View
        style={[
          styles.topHeaderBar,
          {
            backgroundColor: headerBg,
            borderBottomColor: headerBorder,
            paddingTop: Math.max(insets.top, 14),
          },
        ]}
      >
        <View style={styles.headerContentWrapper}>
          {/* Brand Left: Tree Logo + Title + Subtitle */}
          <View style={styles.brandContainer}>
            <View style={styles.treeLogoContainer}>
              <Image
                source={require('@/../assets/images/saral-logo.png')}
                style={styles.treeLogoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTextCol}>
              <Text style={[styles.brandTitle, { color: textColor }]}>
                Saral Vidhya
              </Text>
              <Text style={[styles.brandSubtitle, { color: mutedTextColor }]}>
                Learning Simplified
              </Text>
            </View>
          </View>

          {/* Right: Student Avatar Circle (A) */}
          <View style={[styles.avatarCircle, { backgroundColor: mintActiveBg }]}>
            <Text style={[styles.avatarLetter, { color: brandGreen }]}>A</Text>
          </View>
        </View>
      </View>

      {/* ── 2. SCROLLABLE LEARNING CONTENT ─────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidthWrapper}>
          {/* Segmented Mode Switcher Capsule (White container with subtle border) */}
          <View style={[styles.modeToggleCapsule, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Quick Listen Tab (⟲ icon matching PNG) */}
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'quick' && [styles.modeTabActive, { backgroundColor: brandGreen }],
              ]}
              onPress={() => {
                try {
                  Haptics.selectionAsync().catch(() => {});
                } catch {}
                setMode('quick');
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={mode === 'quick' ? '#FFFFFF' : mutedTextColor}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'quick' ? '#FFFFFF' : textColor },
                ]}
              >
                Quick Listen
              </Text>
            </TouchableOpacity>

            {/* Detailed Listen Tab (Active in PNG) */}
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'detailed' && [styles.modeTabActive, { backgroundColor: brandGreen }],
              ]}
              onPress={() => {
                try {
                  Haptics.selectionAsync().catch(() => {});
                } catch {}
                setMode('detailed');
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="radio-button-on"
                size={14}
                color={mode === 'detailed' ? '#FFFFFF' : mutedTextColor}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'detailed' ? '#FFFFFF' : textColor },
                ]}
              >
                Detailed Listen
              </Text>
            </TouchableOpacity>

            {/* Microcasts Tab */}
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'microcasts' && [styles.modeTabActive, { backgroundColor: brandGreen }],
              ]}
              onPress={() => {
                try {
                  Haptics.selectionAsync().catch(() => {});
                } catch {}
                setMode('microcasts');
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="radio-button-on"
                size={14}
                color={mode === 'microcasts' ? '#FFFFFF' : mutedTextColor}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'microcasts' ? '#FFFFFF' : textColor },
                ]}
              >
                Microcasts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subheader tracking label */}
          <View style={styles.subheaderRow}>
            <Text style={[styles.subheaderBadge, { color: mutedTextColor }]}>
              {subheaderLabel}
            </Text>
            {mode === 'microcasts' && (
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => {
                  try {
                    Haptics.selectionAsync().catch(() => {});
                  } catch {}
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: brandGreen }]}>See all</Text>
                <Ionicons name="arrow-forward" size={15} color={brandGreen} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── 3. MODE: DETAILED & QUICK LISTEN (TWO-COLUMN SPLIT LAYOUT) ─── */}
          {(mode === 'detailed' || mode === 'quick') ? (
            <View style={styles.twoColumnContainer}>
              {/* ── LEFT COLUMN: PLAYER & TRANSCRIPT ─────────────────────── */}
              <View style={styles.leftColumn}>
                {/* A. Track Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <TouchableOpacity
                    style={[styles.summaryPlayBtn, { backgroundColor: brandGreen }]}
                    onPress={handleTogglePlay}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={20}
                      color="#FFFFFF"
                      style={{ marginLeft: isPlaying ? 0 : 2 }}
                    />
                  </TouchableOpacity>
                  <View style={styles.summaryTextCol}>
                    <Text style={[styles.summaryTitle, { color: textColor }]}>
                      {activeTrack.title}
                    </Text>
                    <Text style={[styles.summarySubtitle, { color: mutedTextColor }]}>
                      {`${isPlaying ? 'Playing' : 'Paused'} · ${formatSec(currentSec)} of ${activeTrack.durationFormatted}`}
                    </Text>
                  </View>
                </View>

                {/* B. Detailed Audio Player Card */}
                <View style={[styles.playerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.playerMainTitle, { color: textColor }]}>
                    {activeTrack.title}
                  </Text>
                  <Text style={[styles.playerSubTitle, { color: mutedTextColor }]}>
                    {chapterTitle}
                  </Text>

                  {/* Player Controls Row: ↶15 | Play/Pause | 15↷ | 1x | Timestamp */}
                  <View style={styles.detailedControlsRow}>
                    <View style={styles.leftControlsGroup}>
                      {/* Replay 15s */}
                      <TouchableOpacity
                        style={[styles.roundSkipBtn, { backgroundColor: mintActiveBg }]}
                        onPress={handleReplay15s}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.skipNumberText, { color: textColor }]}>↶15</Text>
                      </TouchableOpacity>

                      {/* Main Play / Pause Circle */}
                      <TouchableOpacity
                        style={[styles.mainPlayCircle, { backgroundColor: brandGreen }]}
                        onPress={handleTogglePlay}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={isPlaying ? 'pause' : 'play'}
                          size={24}
                          color="#FFFFFF"
                          style={{ marginLeft: isPlaying ? 0 : 2 }}
                        />
                      </TouchableOpacity>

                      {/* Forward 15s */}
                      <TouchableOpacity
                        style={[styles.roundSkipBtn, { backgroundColor: mintActiveBg }]}
                        onPress={handleForward15s}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.skipNumberText, { color: textColor }]}>15↷</Text>
                      </TouchableOpacity>

                      {/* Speed Button */}
                      <TouchableOpacity
                        style={styles.speedBtn}
                        onPress={handleCycleSpeed}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.speedText, { color: textColor }]}>
                          {currentSpeed}x
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Monospace Timestamp */}
                    <Text style={[styles.detailedTimestamp, { color: mutedTextColor }]}>
                      {`${formatSec(currentSec)} / ${activeTrack.durationFormatted}`}
                    </Text>
                  </View>

                  {/* Scrubber Progress Bar */}
                  <View style={[styles.scrubberTrack, { backgroundColor: isDark ? '#24352B' : '#E2EBE5' }]}>
                    <View
                      style={[
                        styles.scrubberFill,
                        {
                          backgroundColor: brandGreen,
                          width: `${progressRatio * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* C. Interactive Transcript Card */}
                <View style={[styles.transcriptCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={styles.transcriptHeader}>
                    <Text style={[styles.transcriptMainTitle, { color: textColor }]}>
                      Transcript
                    </Text>
                    <Text style={[styles.transcriptSubTitle, { color: mutedTextColor }]}>
                      Karaoke sync · Tap a word to jump · Dotted terms to define
                    </Text>
                  </View>

                  <View style={[styles.transcriptDivider, { backgroundColor: cardBorder }]} />

                  {/* Body Paragraphs */}
                  <View style={styles.transcriptParagraphsWrapper}>
                    {rawTranscript.split('\n\n').map((paraText, pIdx) => {
                      const words = paraText.split(/\s+/).filter(Boolean);
                      return (
                        <Text key={pIdx} style={[styles.transcriptParagraph, { color: textColor }]}>
                          {words.map((word, wIdx) => {
                            const clean = word.toLowerCase().replace(/[^a-z]/g, '');
                            const isDotted = Object.keys(GLOSSARY_DEFINITIONS).some(
                              (k) => clean.includes(k) || k.includes(clean)
                            );
                            const isHighlighted = isPlaying && activeWordIndex === wIdx && pIdx === 0;

                            if (isDotted) {
                              return (
                                <Text
                                  key={wIdx}
                                  style={[
                                    styles.dottedWord,
                                    {
                                      borderBottomColor: brandGreen,
                                      color: isHighlighted ? brandGreen : textColor,
                                      fontWeight: isHighlighted ? '800' : '600',
                                      backgroundColor: isHighlighted ? 'rgba(5, 122, 68, 0.12)' : 'transparent',
                                    },
                                  ]}
                                  onPress={() => handleTermPress(word)}
                                >
                                  {word}{' '}
                                </Text>
                              );
                            }

                            return (
                              <Text
                                key={wIdx}
                                style={{
                                  color: isHighlighted ? brandGreen : textColor,
                                  fontWeight: isHighlighted ? '800' : '400',
                                  backgroundColor: isHighlighted ? 'rgba(5, 122, 68, 0.12)' : 'transparent',
                                }}
                              >
                                {word}{' '}
                              </Text>
                            );
                          })}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* ── RIGHT COLUMN: FOLLOW ALONG IN READ ─────────────────────── */}
              <View style={[styles.rightColumn, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {/* Header */}
                <View style={styles.readNavHeader}>
                  <Text style={[styles.readNavTitle, { color: textColor }]}>
                    FOLLOW ALONG IN READ
                  </Text>
                  <Text style={[styles.topicCountBadge, { color: mutedTextColor }]}>
                    {mode === 'quick' ? 'TOPIC 1 OF 6' : 'TOPIC 1 OF 8'}
                  </Text>
                </View>

                {/* Module Pill Buttons Row: M1 - M6 */}
                <View style={styles.modulePillsRow}>
                  {[1, 2, 3, 4, 5, 6].map((mNum) => {
                    const isSelected = selectedModuleId === mNum;
                    return (
                      <TouchableOpacity
                        key={mNum}
                        style={[
                          styles.modulePill,
                          {
                            backgroundColor: isSelected ? mintActiveBg : cardBg,
                            borderColor: isSelected ? 'transparent' : cardBorder,
                          },
                        ]}
                        onPress={() => handleSelectModule(mNum)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.modulePillText,
                            {
                              color: isSelected ? brandGreen : mutedTextColor,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          M{mNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Active Module Topic Focus Banner */}
                <View style={[styles.focusBanner, { backgroundColor: isDark ? '#1C2E24' : '#E8F4EC' }]}>
                  <Text style={[styles.focusBannerTag, { color: brandGreen }]}>
                    MODULE {selectedModuleId} · TOPIC FOCUS
                  </Text>
                  <Text style={[styles.focusBannerTitle, { color: textColor }]}>
                    {activeFocusTitle}
                  </Text>
                </View>

                {/* Walkthrough Topic Items List */}
                <View style={styles.walkthroughList}>
                  {WALKTHROUGH_TOPICS.map((topic, tIdx) => {
                    const isActive = tIdx === 0;
                    return (
                      <TouchableOpacity
                        key={topic.id}
                        style={[
                          styles.walkthroughCard,
                          {
                            backgroundColor: isActive
                              ? isDark
                                ? '#1E3227'
                                : '#EAF4EE'
                              : 'transparent',
                            borderColor: isActive ? 'transparent' : cardBorder,
                          },
                        ]}
                        onPress={() => {
                          try {
                            Haptics.selectionAsync().catch(() => {});
                          } catch {}
                          onNavigateToRead?.(selectedModuleId);
                        }}
                        activeOpacity={0.8}
                      >
                        {/* Number or Checkmark Circle */}
                        <View
                          style={[
                            styles.topicIconCircle,
                            {
                              backgroundColor: isActive
                                ? brandGreen
                                : isDark
                                ? '#24352B'
                                : '#F0F4F1',
                              borderColor: isActive ? 'transparent' : cardBorder,
                            },
                          ]}
                        >
                          {isActive ? (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          ) : (
                            <Text style={[styles.topicNumberText, { color: mutedTextColor }]}>
                              {topic.id}
                            </Text>
                          )}
                        </View>

                        {/* Title & Duration */}
                        <View style={styles.topicTextCol}>
                          <Text style={[styles.topicTitleText, { color: textColor }]}>
                            {topic.title}
                          </Text>
                          <Text style={[styles.topicDescText, { color: mutedTextColor }]}>
                            {`${topic.duration} · ${topic.desc}`}
                          </Text>
                        </View>

                        {/* Play Icon Circle */}
                        <View style={[styles.topicPlayIcon, { borderColor: cardBorder }]}>
                          <Ionicons name="play" size={14} color={textColor} style={{ marginLeft: 1 }} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : (
            /* ── 4. MODE: MICROCASTS (SINGLE COLUMN LIST) ───────────────── */
            <View>
              {/* Playlist Cards */}
              <View style={styles.playlistContainer}>
                {microcastList.map((item) => {
                  const isSelected = selectedMicrocastId === item.id;
                  const formattedNum = `${item.id < 10 ? '0' : ''}${item.id}`;

                  if (isSelected) {
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.microcastCard,
                          {
                            backgroundColor: cardBg,
                            borderColor: activeBorder,
                            borderWidth: 1.5,
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            padding: 16,
                            gap: 12,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                          onPress={() => handleTogglePlay()}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.numberBadge,
                              { backgroundColor: brandGreen },
                            ]}
                          >
                            <Ionicons
                              name={isPlaying ? 'pause' : 'play'}
                              size={15}
                              color="#FFFFFF"
                              style={!isPlaying ? { marginLeft: 1.5 } : undefined}
                            />
                          </View>

                          <View style={styles.cardInfoCol}>
                            <Text style={[styles.cardTitle, { color: textColor, fontWeight: '700' }]}>
                              {item.title}
                            </Text>
                            <Text style={[styles.cardSubtitle, { color: brandGreen, fontWeight: '600' }]}>
                              Episode {item.id} of {microcastList.length} · {isPlaying ? 'Playing now' : 'Paused'}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Scrubber */}
                        <View style={[styles.scrubberTrack, { backgroundColor: isDark ? '#24352B' : '#E0EDE5', height: 4, borderRadius: 2, marginTop: 4 }]}>
                          <View
                            style={[
                              styles.scrubberFill,
                              {
                                backgroundColor: brandGreen,
                                width: `${progressRatio * 100}%`,
                                height: 4,
                                borderRadius: 2,
                              },
                            ]}
                          />
                        </View>

                        {/* Controls */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TouchableOpacity
                              style={[styles.replayBtn, { borderColor: cardBorder, width: 32, height: 32, borderRadius: 8 }]}
                              onPress={handleReplay15s}
                              activeOpacity={0.75}
                            >
                              <Ionicons name="refresh" size={14} color={mutedTextColor} />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.mainPlayCircle, { backgroundColor: brandGreen, width: 34, height: 34, borderRadius: 17 }]}
                              onPress={handleTogglePlay}
                              activeOpacity={0.85}
                            >
                              <Ionicons
                                name={isPlaying ? 'pause' : 'play'}
                                size={16}
                                color="#FFFFFF"
                                style={!isPlaying ? { marginLeft: 1.5 } : undefined}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.speedBtn, { paddingHorizontal: 8, paddingVertical: 4 }]}
                              onPress={handleCycleSpeed}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.speedText, { color: brandGreen, fontSize: 13 }]}>
                                {currentSpeed}x
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={[styles.detailedTimestamp, { color: mutedTextColor, fontSize: 12 }]}>
                            {formatSec(currentSec)} / {item.durationFormatted.replace(/^00:/, '')}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.microcastCard,
                        {
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => handleSelectAndPlayMicrocast(item.id)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.numberBadge,
                          {
                            backgroundColor: isDark ? '#24352B' : '#F0F4F1',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.numberBadgeText,
                            {
                              color: mutedTextColor,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {formattedNum}
                        </Text>
                      </View>

                      <View style={styles.cardInfoCol}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.cardSubtitle, { color: mutedTextColor }]}>
                          {item.recap || `${item.durationFormatted.replace(/^00:/, '')} · Standard depth`}
                        </Text>
                      </View>

                      <View style={[styles.downloadBtn, { borderColor: cardBorder }]}>
                        <Ionicons name="play" size={15} color={brandGreen} style={{ marginLeft: 1.5 }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Microcast Transcript */}
              <View style={[styles.transcriptCard, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 16 }]}>
                <View style={styles.transcriptHeader}>
                  <Text style={[styles.transcriptMainTitle, { color: textColor }]}>
                    Transcript
                  </Text>
                  <Text style={[styles.transcriptSubTitle, { color: mutedTextColor }]}>
                    Karaoke sync · tap dotted terms to define
                  </Text>
                </View>
                <View style={[styles.transcriptDivider, { backgroundColor: cardBorder }]} />
                <Text style={[styles.transcriptParagraph, { color: textColor }]}>
                  {rawTranscript}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── 5. SCIENTIFIC TERM DEFINITION POPOVER MODAL ────────────────────── */}
      {activeTooltip && (
        <Modal
          transparent
          animationType="fade"
          visible={!!activeTooltip}
          onRequestClose={() => setActiveTooltip(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActiveTooltip(null)}
          >
            <View
              style={[
                styles.modalCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeaderRow}>
                <View style={[styles.modalBadge, { backgroundColor: 'rgba(5, 122, 68, 0.12)' }]}>
                  <Text style={[styles.modalBadgeText, { color: brandGreen }]}>
                    EXAM DEFINITION
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveTooltip(null)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={18} color={mutedTextColor} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalTermTitle, { color: textColor }]}>
                {activeTooltip.term}
              </Text>
              <Text style={[styles.modalTermDef, { color: isDark ? '#D5E2D9' : '#2D3E36' }]}>
                {activeTooltip.definition}
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderBar: {
    width: '100%',
    borderBottomWidth: 1,
    paddingHorizontal: 36,
    paddingBottom: 16,
  },
  headerContentWrapper: {
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  treeLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  treeLogoImage: {
    width: 42,
    height: 42,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 36,
    paddingTop: 20,
  },
  maxWidthWrapper: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
  },
  modeToggleCapsule: {
    width: '100%',
    height: 48,
    borderRadius: 100,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    height: '100%',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeTabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subheaderBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1.15,
    gap: 16,
  },
  rightColumn: {
    flex: 0.85,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summarySubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  playerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  playerMainTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  playerSubTitle: {
    fontSize: 13,
    marginTop: 3,
    marginBottom: 14,
  },
  detailedControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  leftControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roundSkipBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailedTimestamp: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    borderRadius: 2,
  },
  transcriptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 40,
  },
  transcriptHeader: {
    marginBottom: 4,
  },
  transcriptMainTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  transcriptSubTitle: {
    fontSize: 12,
    marginTop: 3,
  },
  transcriptDivider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  transcriptParagraphsWrapper: {
    gap: 14,
  },
  transcriptParagraph: {
    fontSize: 15,
    lineHeight: 24,
  },
  dottedWord: {
    borderBottomWidth: 1.5,
  },
  readNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  readNavTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topicCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modulePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modulePill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modulePillText: {
    fontSize: 13,
  },
  focusBanner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  focusBannerTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  focusBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  walkthroughList: {
    gap: 10,
  },
  walkthroughCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topicTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  topicTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topicDescText: {
    fontSize: 11,
    marginTop: 2,
  },
  topicPlayIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistContainer: {
    gap: 12,
  },
  microcastCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    fontSize: 13,
  },
  cardInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicSquircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  playerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  replayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
  },
  modalTermTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalTermDef: {
    fontSize: 14,
    lineHeight: 22,
  },
});
