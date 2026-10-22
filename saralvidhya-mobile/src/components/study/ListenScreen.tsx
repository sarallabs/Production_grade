import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { SAMPLE_STUDY_CONTENT } from '@/data/sampleStudyContent';
import { SAMPLE_PODCASTS, PodcastParagraph } from '@/data/samplePodcasts';
import ListenScreenTablet from './ListenScreen.tablet';

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
  metamorphosis: 'Post-embryonic structural changes occurring between egg hatching and adult sexual maturity.',
  ecdysis: 'The process of shedding the old cuticular exoskeleton (moulting).',
  poikilothermic: 'Cold-blooded organisms whose body temperature tracks ambient microclimates.',
  'degree-day': 'Unit of heat accumulation used to predict insect development timing.',
  photoperiod: 'The duration of daily light exposure regulating diapause and seasonal cycles.',
  diapause: 'Hormonally regulated dormancy enabling survival during harsh climatic conditions.',
  pollination: 'Transfer of pollen grains from anther to stigma facilitating fertilization.',
  apiculture: 'The scientific management and rearing of honey bees for pollination and honey.',
  weathering: 'Physical disintegration and chemical decomposition of minerals and agro-substrates.',
};

export interface TokenizedWord {
  index: number;
  raw: string;
  clean: string;
  isGlossary: boolean;
  glossaryKey?: string;
}

function tokenizeParagraph(text: string): TokenizedWord[] {
  const words: TokenizedWord[] = [];
  const tokens = text.split(/\s+/).filter(Boolean);
  const glossaryKeys = Object.keys(GLOSSARY_TOOLTIPS);

  tokens.forEach((raw, idx) => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedKey = glossaryKeys.find(
      (k) => k.toLowerCase() === clean || clean === k.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    words.push({
      index: idx,
      raw,
      clean,
      isGlossary: !!matchedKey,
      glossaryKey: matchedKey,
    });
  });

  return words;
}

/**
 * Calibrated word duration and pause calculation for mobile Text-to-Speech (TTS).
 * Natural English speech tempo on mobile Android TTS (Google TTS) and iOS (AVSpeech)
 * averages ~170-175 words per minute at 1.0x rate (~340-350ms per word including pauses).
 */
function getWordDurationMs(rawWord: string, speedRate: number = 1.0): number {
  const clean = rawWord.trim();
  const len = clean.length;

  // Syllable-proportional base phoneme duration calibrated for standard TTS (~170 WPM)
  // Average word length of 5-6 letters yields ~250-280ms base duration
  let duration = 120 + Math.min(len, 12) * 26;

  // Articulation duration for longer multi-syllabic academic & scientific terminology
  if (len > 7) {
    duration += Math.min(len - 7, 7) * 14;
  }

  // Natural TTS pause on sentence end (. ! ?) -> TTS pauses ~180-200ms
  if (/[.!?]$/.test(clean)) {
    duration += 190;
  }
  // Natural TTS pause on clause delimiters (, ; : — -) -> TTS pauses ~80-90ms
  else if (/[,;:\u2014\u2013-]$/.test(clean)) {
    duration += 90;
  }

  const effectiveSpeed = speedRate > 0 ? speedRate : 1.0;
  return Math.max(110, Math.round(duration / effectiveSpeed));
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function markdownToAudioParagraphs(markdown: string, chapterNum: number, chapterTitle: string): string[] {
  if (!markdown || markdown.trim().length === 0) {
    return [
      `Welcome to the audio study session for Chapter ${chapterNum}: ${chapterTitle}.`,
      `Focus on the structural concepts, biological definitions, and faculty exam pointers covered in your lecture guides.`,
      `Review each section carefully, and follow along with the transcript to master the subject material for your upcoming assessments.`,
    ];
  }

  // 1. Remove markdown images & links [text](url) -> text
  let text = markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');

  // 2. Remove math formulas $$...$$ or $...$ -> clean spoken text
  text = text
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\text\{(.*?)\}/g, '$1')
    .replace(/\\longrightarrow/g, 'yields')
    .replace(/\\approx/g, 'approximately')
    .replace(/\\circ\s*C/g, ' degrees Celsius');

  // 3. Remove tables (lines with |)
  text = text.replace(/^\|.*\|$/gm, '');

  // 4. Convert headers: e.g. "### 1. Three Primary Gut Regions" -> "Three Primary Gut Regions."
  text = text.replace(/^#{1,6}\s*(?:[\d.]+\s*)?/gm, '');

  // 5. Remove horizontal rules
  text = text.replace(/^---$/gm, '');

  // 6. Remove blockquotes and formatting symbols (*, _, `, >)
  text = text.replace(/^[>]\s*/gm, '');
  text = text.replace(/[*_`]/g, '');

  // 7. Clean bullet points: e.g. "- Pharynx:" -> "Pharynx:"
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // 8. Split by double newlines or single newlines with content into paragraphs
  const rawParagraphs = text.split(/\n+/);
  const cleaned: string[] = [];

  for (const raw of rawParagraphs) {
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    if (trimmed.length > 25 && !trimmed.startsWith('|')) {
      cleaned.push(trimmed);
    }
  }

  if (cleaned.length > 0) {
    return cleaned;
  }

  return [
    `Welcome to the audio study session for Chapter ${chapterNum}: ${chapterTitle}.`,
    `Focus on the structural concepts, definitions, and faculty pointers covered in your lecture guides.`,
    `Follow along with the transcript to master the material for your upcoming assessments.`,
  ];
}

interface MicrocastEpisode {
  id: number;
  title: string;
  status: string;
  durationSec: number;
  durationLabel: string;
  recap: string;
}

export interface TokenizedParagraphItem {
  timestamp: string;
  startSec: number;
  words: TokenizedWord[];
}

export default function ListenScreen({
  chapterNumber = 1,
  chapterTitle,
  initialMode = 'quick',
  onNavigateToRead,
  onBackPress,
}: ListenScreenProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  // Dynamically compute the chapter title if not explicitly provided
  const defaultTitle =
    chapterNumber === 1
      ? 'Insect Digestive System & Anatomy'
      : chapterNumber === 2
      ? 'Insect Metamorphosis & Life Cycles'
      : chapterNumber === 3
      ? 'Weathering of Rocks & Minerals'
      : chapterNumber === 4
      ? 'Insect Pollination & Floral Biology'
      : 'Study Guide';
  const effectiveChapterTitle = chapterTitle || defaultTitle;

  // Tablet-specific layout delegation matching user design PNG
  if (isTablet) {
    return (
      <ListenScreenTablet
        chapterNumber={chapterNumber}
        chapterTitle={effectiveChapterTitle}
        initialMode={initialMode}
        onNavigateToRead={onNavigateToRead}
        onBackPress={onBackPress}
      />
    );
  }

  const [mode, setMode] = useState<ListenMode>(initialMode);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [currentSec, setCurrentSec] = useState<number>(0);
  const [speedIndex, setSpeedIndex] = useState<number>(0);
  const [selectedMicrocastId, setSelectedMicrocastId] = useState<number>(1);
  const [activeTooltip, setActiveTooltip] = useState<{ term: string; text: string } | null>(null);

  // Quick vs Detailed durations & metadata
  const isQuick = mode === 'quick';
  const isDetailed = mode === 'detailed';
  const isMicro = mode === 'microcasts';

  // Canonical podcast dataset matching web app 1:1
  const currentBundle = useMemo(() => {
    return SAMPLE_PODCASTS[chapterNumber] || SAMPLE_PODCASTS[1];
  }, [chapterNumber]);

  const microcastEpisodes: MicrocastEpisode[] = useMemo(() => {
    return currentBundle.microcasts.map((item) => ({
      id: item.id,
      title: item.title,
      recap: item.recap,
      durationSec: item.durationSec,
      durationLabel: item.durationLabel,
      status: `${item.durationLabel} · ${item.recap}`,
    }));
  }, [currentBundle]);

  const activeMicrocast = useMemo(() => {
    return (
      currentBundle.microcasts.find((e) => e.id === selectedMicrocastId) ||
      currentBundle.microcasts[0]
    );
  }, [currentBundle, selectedMicrocastId]);

  const activeTrack = useMemo(() => {
    if (isMicro) return activeMicrocast;
    return isDetailed ? currentBundle.detailed : currentBundle.quick;
  }, [isMicro, isDetailed, activeMicrocast, currentBundle]);

  const activeParagraphs: PodcastParagraph[] = useMemo(() => {
    return activeTrack.paragraphs;
  }, [activeTrack]);

  // Tokenized paragraphs for word-level karaoke and timestamp positioning
  const tokenizedParagraphs: TokenizedParagraphItem[] = useMemo(() => {
    return activeParagraphs.map((p) => ({
      timestamp: p.timestamp,
      startSec: p.startSec,
      words: tokenizeParagraph(p.text),
    }));
  }, [activeParagraphs]);

  // Total word count
  const totalWordCount = useMemo(() => {
    return tokenizedParagraphs.reduce((acc, p) => acc + p.words.length, 0);
  }, [tokenizedParagraphs]);

  const totalDurationSec = useMemo(() => {
    return activeTrack.durationSec;
  }, [activeTrack]);

  const totalDurationLabel = useMemo(() => {
    return formatSeconds(totalDurationSec);
  }, [totalDurationSec]);

  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const speedRef = useRef<number>(SPEED_OPTIONS[speedIndex]);
  const tokenizedRef = useRef<TokenizedParagraphItem[]>(tokenizedParagraphs);
  const startTimeRef = useRef<number>(0);
  const lastBoundaryTimeRef = useRef<number>(0);
  const hasNativeBoundaryRef = useRef<boolean>(false);
  const utteranceIdRef = useRef<number>(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    tokenizedRef.current = tokenizedParagraphs;
  }, [tokenizedParagraphs]);

  useEffect(() => {
    speedRef.current = SPEED_OPTIONS[speedIndex];
  }, [speedIndex]);

  useEffect(() => {
    return () => {
      try {
        Speech.stop().catch(() => {});
      } catch {}
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    };
  }, []);

  // Reset playback if chapter changes
  useEffect(() => {
    try {
      Speech.stop().catch(() => {});
    } catch {}
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentSec(0);
    setActiveParagraphIndex(0);
    setActiveWordIndex(-1);
  }, [chapterNumber]);

  const startTicker = () => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      setCurrentSec((prev) => {
        const next = prev + 1;
        if (next >= totalDurationSec) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          Speech.stop();
          if (tickerRef.current) clearInterval(tickerRef.current);
          if (wordTickerRef.current) clearInterval(wordTickerRef.current);
          return 0;
        }
        return next;
      });
    }, 1000 / speedRef.current);
  };

  const speakFromWord = (paraIdx: number, wordIdx: number = 0) => {
    const paras = tokenizedRef.current;
    if (paraIdx >= paras.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setActiveParagraphIndex(0);
      setActiveWordIndex(-1);
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
      return;
    }

    const currentUtteranceId = ++utteranceIdRef.current;
    hasNativeBoundaryRef.current = false;

    setActiveParagraphIndex(paraIdx);
    setActiveWordIndex(wordIdx);
    setIsPlaying(true);
    isPlayingRef.current = true;

    if (wordTickerRef.current) clearInterval(wordTickerRef.current);

    const paraItem = paras[paraIdx];
    if (wordIdx === 0 && paraItem) {
      setCurrentSec(paraItem.startSec);
    }
    const paraWords = paraItem.words;
    const wordsToSpeak = paraWords.slice(wordIdx);
    const textToSpeak = wordsToSpeak.map((w) => w.raw).join(' ');

    Speech.stop();

    // Precompute character boundary offsets for wordsToSpeak:
    const wordCharOffsets: number[] = [];
    let accChar = 0;
    for (let i = 0; i < wordsToSpeak.length; i++) {
      wordCharOffsets.push(accChar);
      accChar += wordsToSpeak[i].raw.length + 1;
    }

    // Calculate target paragraph duration if known from timestamps:
    const nextParaItem = paras[paraIdx + 1];
    const targetParaDurationSec =
      (nextParaItem ? nextParaItem.startSec : totalDurationSec) - paraItem.startSec;

    // Precompute raw word timing offsets:
    const rawDurations = wordsToSpeak.map((w) => getWordDurationMs(w.raw, 1.0));
    const rawTotalMs = rawDurations.reduce((sum, d) => sum + d, 0);

    // If we have a reliable target duration for the full paragraph (> 0 and < 300s):
    let scale = 1.0;
    if (targetParaDurationSec > 0 && targetParaDurationSec < 300 && rawTotalMs > 0) {
      const allParaDurations = paraWords.map((w) => getWordDurationMs(w.raw, 1.0));
      const totalAllMs = allParaDurations.reduce((sum, d) => sum + d, 0);
      const remainingFraction = totalAllMs > 0 ? rawTotalMs / totalAllMs : 1.0;
      const expectedRemainingMs = targetParaDurationSec * 1000 * remainingFraction;
      const ratio = expectedRemainingMs / rawTotalMs;
      // Clamp scale ratio between 0.80 and 1.20 to prevent any distortion
      scale = Math.max(0.80, Math.min(1.20, ratio));
    }

    const wordStartTimesMs: number[] = [];
    let accMs = 0;
    for (let i = 0; i < wordsToSpeak.length; i++) {
      wordStartTimesMs.push(accMs);
      const scaledDuration = Math.round((rawDurations[i] * scale) / speedRef.current);
      accMs += Math.max(80, scaledDuration);
    }

    let isAudioStarted = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    startTimeRef.current = 0;

    wordTickerRef.current = setInterval(() => {
      if (!isPlayingRef.current || utteranceIdRef.current !== currentUtteranceId) {
        if (wordTickerRef.current) {
          clearInterval(wordTickerRef.current);
          wordTickerRef.current = null;
        }
        return;
      }

      // If native boundaries are active, do NOT run the fallback ticker
      if (hasNativeBoundaryRef.current) {
        if (wordTickerRef.current) {
          clearInterval(wordTickerRef.current);
          wordTickerRef.current = null;
        }
        return;
      }

      // Wait until audio has actually started emitting sound
      if (!isAudioStarted || !startTimeRef.current) {
        return;
      }

      const elapsedMs = Date.now() - startTimeRef.current;

      let foundIdx = 0;
      for (let i = 0; i < wordStartTimesMs.length; i++) {
        if (elapsedMs >= wordStartTimesMs[i]) {
          foundIdx = i;
        } else {
          break;
        }
      }

      const nextWordIdx = wordIdx + foundIdx;
      if (nextWordIdx < paraWords.length) {
        // MONOTONIC: strictly forward only, never bounces backward!
        setActiveWordIndex((prev) => (nextWordIdx > prev ? nextWordIdx : prev));
      }
    }, 30);

    Speech.speak(textToSpeak, {
      rate: speedRef.current,
      pitch: 1.0,
      onStart: () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        if (!isPlayingRef.current || utteranceIdRef.current !== currentUtteranceId) return;
        isAudioStarted = true;
        startTimeRef.current = Date.now();
        lastBoundaryTimeRef.current = Date.now();
      },
      onBoundary: (ev: any) => {
        if (!isPlayingRef.current || utteranceIdRef.current !== currentUtteranceId) return;
        const charIdx = ev && typeof ev.charIndex === 'number' ? ev.charIndex : -1;
        if (charIdx >= 0) {
          hasNativeBoundaryRef.current = true;
          // Immediately destroy fallback ticker so it NEVER fights with native boundary events!
          if (wordTickerRef.current) {
            clearInterval(wordTickerRef.current);
            wordTickerRef.current = null;
          }

          let matchedOffset = -1;
          for (let i = 0; i < wordCharOffsets.length; i++) {
            const nextOffset = i + 1 < wordCharOffsets.length ? wordCharOffsets[i + 1] : Infinity;
            if (charIdx >= wordCharOffsets[i] && charIdx < nextOffset) {
              matchedOffset = i;
              break;
            }
          }

          if (matchedOffset >= 0) {
            const nextWordIdx = wordIdx + matchedOffset;
            // MONOTONIC: Highlight strictly moves forward, preventing any jitter or bouncing backward!
            setActiveWordIndex((prev) => (nextWordIdx > prev ? nextWordIdx : prev));
          }
        }
      },
      onDone: () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        if (!isPlayingRef.current || utteranceIdRef.current !== currentUtteranceId) return;
        if (wordTickerRef.current) {
          clearInterval(wordTickerRef.current);
          wordTickerRef.current = null;
        }

        // Highlight the final word of the paragraph briefly
        if (paraWords.length > 0) {
          setActiveWordIndex(paraWords.length - 1);
        }

        if (paraIdx + 1 < paras.length) {
          setTimeout(() => {
            if (isPlayingRef.current && utteranceIdRef.current === currentUtteranceId) {
              speakFromWord(paraIdx + 1, 0);
            }
          }, 120);
        } else {
          setIsPlaying(false);
          isPlayingRef.current = false;
          setActiveParagraphIndex(0);
          setActiveWordIndex(-1);
          setCurrentSec(totalDurationSec);
          if (tickerRef.current) clearInterval(tickerRef.current);
        }
      },
      onError: () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        if (utteranceIdRef.current !== currentUtteranceId) return;
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (tickerRef.current) clearInterval(tickerRef.current);
        if (wordTickerRef.current) {
          clearInterval(wordTickerRef.current);
          wordTickerRef.current = null;
        }
      },
    });

    // Fallback: If onStart does not trigger within 200ms (e.g. web or certain TTS engines), start ticker
    fallbackTimer = setTimeout(() => {
      if (!isAudioStarted && isPlayingRef.current && utteranceIdRef.current === currentUtteranceId) {
        isAudioStarted = true;
        startTimeRef.current = Date.now();
        lastBoundaryTimeRef.current = Date.now();
      }
    }, 200);
  };

  const handleSelectMode = (newMode: ListenMode) => {
    if (newMode === mode) return;
    Haptics.selectionAsync();
    Speech.stop();
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentSec(0);
    setActiveParagraphIndex(0);
    setActiveWordIndex(-1);
    setMode(newMode);
  };

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
      Speech.stop();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      const pIdx =
        activeParagraphIndex < tokenizedParagraphs.length ? activeParagraphIndex : 0;
      const wIdx =
        activeWordIndex >= 0 && activeWordIndex < (tokenizedParagraphs[pIdx]?.words.length || 0)
          ? activeWordIndex
          : 0;
      speakFromWord(pIdx, wIdx);
      startTicker();
    }
  };

  const handleSeekToParagraph = (pIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const targetPara = tokenizedParagraphs[pIdx];
    if (!targetPara) return;
    setCurrentSec(targetPara.startSec);
    speakFromWord(pIdx, 0);
    startTicker();
  };

  const handleWordPress = (pIdx: number, w: TokenizedWord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (w.isGlossary && w.glossaryKey) {
      setActiveTooltip({
        term: w.glossaryKey,
        text: GLOSSARY_TOOLTIPS[w.glossaryKey] || 'Glossary definition',
      });
    }

    const targetPara = tokenizedParagraphs[pIdx];
    const paraStartSec = targetPara?.startSec || 0;
    const nextParaStartSec = tokenizedParagraphs[pIdx + 1]?.startSec || totalDurationSec;
    const paraDuration = Math.max(1, nextParaStartSec - paraStartSec);
    const wordProgress = targetPara && targetPara.words.length > 0 ? w.index / targetPara.words.length : 0;
    const targetSec = Math.min(
      totalDurationSec,
      Math.floor(paraStartSec + wordProgress * paraDuration)
    );
    setCurrentSec(targetSec);

    speakFromWord(pIdx, w.index);
    startTicker();
  };

  const handleSkip = (deltaSeconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSec = Math.max(0, Math.min(totalDurationSec, currentSec + deltaSeconds));
    setCurrentSec(newSec);

    let targetPIdx = 0;
    for (let i = 0; i < tokenizedParagraphs.length; i++) {
      if (tokenizedParagraphs[i].startSec <= newSec) {
        targetPIdx = i;
      } else {
        break;
      }
    }

    const currentParaStart = tokenizedParagraphs[targetPIdx]?.startSec || 0;
    const nextParaStart = tokenizedParagraphs[targetPIdx + 1]?.startSec || totalDurationSec;
    const paraDuration = Math.max(1, nextParaStart - currentParaStart);
    const paraWordCount = tokenizedParagraphs[targetPIdx]?.words.length || 1;
    const progressInPara = Math.max(0, Math.min(0.95, (newSec - currentParaStart) / paraDuration));
    const targetWIdx = Math.floor(progressInPara * paraWordCount);

    if (isPlaying) {
      speakFromWord(targetPIdx, targetWIdx);
      startTicker();
    } else {
      setActiveParagraphIndex(targetPIdx);
      setActiveWordIndex(targetWIdx);
    }
  };

  const handleCycleSpeed = () => {
    Haptics.selectionAsync();
    const nextIdx = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIdx);
    speedRef.current = SPEED_OPTIONS[nextIdx];
    if (isPlaying) {
      speakFromWord(activeParagraphIndex, activeWordIndex >= 0 ? activeWordIndex : 0);
      startTicker();
    }
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
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. BRANDING HEADER OR MICROCASTS HEADER */}
        {isMicro ? (
          /* Microcasts Header */
          <View style={styles.listenChapterHeader}>
            <Text style={[styles.listenChapterTitle, { color: textDark }]}>Microcasts</Text>
            <Text style={[styles.pageSubtitle, { color: isDark ? '#A6C5B3' : '#637375', marginTop: 2 }]}>
              Short audio lessons for focused learning
            </Text>
          </View>
        ) : (
          /* Chapter Title Header */
          <View style={styles.listenChapterHeader}>
            <Text style={[styles.listenChapterTitle, { color: textDark }]}>
              {effectiveChapterTitle}
            </Text>
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
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            activeOpacity={0.75}
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
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            activeOpacity={0.75}
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
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            activeOpacity={0.75}
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
            {/* 3. Section Label & Badges */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.badgeGroupRow}>
                <View style={[styles.durationBadgePill, { backgroundColor: isDark ? '#1C3328' : '#E6F4EA' }]}>
                  <Ionicons name="time-outline" size={13} color="#00996E" />
                  <Text style={[styles.durationBadgeText, { color: isDark ? '#81C995' : '#0D652D' }]}>
                    {activeTrack.durationLabel}
                  </Text>
                </View>
                <View style={[styles.countBadgePill, { backgroundColor: isDark ? '#1C3328' : '#F0FDF4' }]}>
                  <Text style={[styles.countBadgeText, { color: isDark ? '#81C995' : '#15803D' }]}>
                    1 Podcast
                  </Text>
                </View>
              </View>
              <View style={[styles.chapterPillBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Ionicons name="book-outline" size={13} color={emeraldPrimary} />
                <Text style={[styles.chapterPillBtnText, { color: textDark }]}>
                  Ch {chapterNumber}
                </Text>
              </View>
            </View>

            {/* 4. Single Main Player Header */}
            <View style={styles.playerHeader}>
              <Text style={[styles.podcastOverline, { color: '#00996E' }]}>PODCAST 1 OF 1</Text>
              <Text style={[styles.playerTitle, { color: textDark }]}>
                {activeTrack.title}
              </Text>
              <Text style={[styles.playerSubtitle, { color: textMuted }]}>
                {effectiveChapterTitle} · {isQuick ? 'Essentials' : 'In-depth'}
              </Text>
            </View>

            {/* 5. Audio Player Controls Card (.audioPlayerControls) */}
            <View style={[styles.audioPlayerControls, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Skip Back 15s */}
              <TouchableOpacity
                style={[styles.back15Seconds, { backgroundColor: mintPillBg }]}
                onPress={() => handleSkip(-15)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                activeOpacity={0.75}
              >
                <Text style={[styles.backLabel, { color: textDark }]}>↶15</Text>
              </TouchableOpacity>

              {/* Main Play / Pause Circle (44x44) */}
              <TouchableOpacity
                style={[styles.playAudio, { backgroundColor: emeraldPrimary }]}
                onPress={handleTogglePlay}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.75}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Skip Forward 15s */}
              <TouchableOpacity
                style={[styles.forward30Seconds, { backgroundColor: mintPillBg }]}
                onPress={() => handleSkip(15)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                activeOpacity={0.75}
              >
                <Text style={[styles.forwardLabel, { color: textDark }]}>15↷</Text>
              </TouchableOpacity>

              {/* Speed Button */}
              <TouchableOpacity
                style={styles.speedBtn}
                onPress={handleCycleSpeed}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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

            {/* 6. Audio Progress Track (.audioProgressTrack) */}
            <View style={[styles.audioProgressTrack, { backgroundColor: isDark ? '#263B30' : '#D1E3D9' }]}>
              <View
                style={[
                  styles.audioProgress,
                  { width: `${progressPercent}%`, backgroundColor: emeraldPrimary },
                ]}
              />
            </View>

            {/* 7. Transcript Section (.transcriptHeading & .transcriptReadingCard) */}
            <View style={styles.transcriptSection}>
              <Text style={[styles.transcriptHeading, { color: textDark }]}>Transcript</Text>

              <View style={[styles.transcriptReadingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {tokenizedParagraphs.map((paraItem, pIdx) => {
                  return (
                    <View
                      key={pIdx}
                      style={styles.transcriptParagraphCard}
                    >
                      <TouchableOpacity
                        style={[styles.timestampBadge, { backgroundColor: isDark ? '#1C3328' : '#E8F5E9' }]}
                        onPress={() => handleSeekToParagraph(pIdx)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.timestampBadgeText, { color: isDark ? '#81C995' : '#0D652D' }]}>
                          [{paraItem.timestamp}]
                        </Text>
                      </TouchableOpacity>
                      {pIdx === activeParagraphIndex ? (
                        <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                          {paraItem.words.map((w) => {
                            const isWordActive = activeWordIndex === w.index;
                            return (
                              <Text
                                key={w.index}
                                onPress={() => handleWordPress(pIdx, w)}
                                style={[
                                  styles.wordInline,
                                  isWordActive && [
                                    styles.wordInlineActive,
                                    { backgroundColor: emeraldPrimary },
                                  ],
                                  w.isGlossary && styles.wordInlineGlossary,
                                  {
                                    color: isWordActive
                                      ? '#FFFFFF'
                                      : textDark,
                                    fontWeight: isWordActive
                                      ? '700'
                                      : w.isGlossary
                                      ? '600'
                                      : '400',
                                  },
                                ]}
                              >
                                {w.raw}{' '}
                              </Text>
                            );
                          })}
                        </Text>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSeekToParagraph(pIdx)}
                        >
                          <Text
                            style={[
                              styles.transcriptParagraph,
                              {
                                color:
                                  isPlaying && pIdx < activeParagraphIndex
                                    ? isDark
                                      ? '#8DA297'
                                      : '#687D72'
                                    : textDark,
                              },
                            ]}
                          >
                            {activeParagraphs[pIdx]?.text || ''}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
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
              {microcastEpisodes.map((ep) => {
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
                        Speech.stop();
                        if (tickerRef.current) clearInterval(tickerRef.current);
                        setCurrentSec(0);
                        setIsPlaying(false);
                        isPlayingRef.current = false;
                        setActiveParagraphIndex(0);
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
                    Episode {activeMicrocast.id} of {microcastEpisodes.length} · {isPlaying ? 'Playing' : 'Paused'}
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
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="refresh" size={11} color={isDark ? '#FFFFFF' : '#1A282D'} />
                  </TouchableOpacity>

                  {/* Play Button (.playButton) */}
                  <TouchableOpacity
                    style={[styles.playButton, { backgroundColor: '#00996E' }]}
                    onPress={handleTogglePlay}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Speed Control (.speedControl) */}
                  <TouchableOpacity
                    style={styles.speedControlBtn}
                    onPress={handleCycleSpeed}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

              {/* Transcript Divider (.transcriptDivider) */}
              <View style={[styles.transcriptDivider, { backgroundColor: isDark ? '#2D4538' : '#DBE5E0' }]} />

              <View style={styles.transcriptParagraphsWrap}>
                {tokenizedParagraphs.map((paraItem, pIdx) => {
                  return (
                    <View
                      key={pIdx}
                      style={styles.microTranscriptCard}
                    >
                      <TouchableOpacity
                        style={[styles.timestampBadge, { backgroundColor: isDark ? '#1C3328' : '#E8F5E9' }]}
                        onPress={() => handleSeekToParagraph(pIdx)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.timestampBadgeText, { color: isDark ? '#81C995' : '#0D652D' }]}>
                          [{paraItem.timestamp}]
                        </Text>
                      </TouchableOpacity>
                      {pIdx === activeParagraphIndex ? (
                        <Text
                          style={[
                            styles.transcriptParagraphText,
                            { color: isDark ? '#FFFFFF' : '#1A282D' },
                          ]}
                        >
                          {paraItem.words.map((w) => {
                            const isWordActive = activeWordIndex === w.index;
                            return (
                              <Text
                                key={w.index}
                                onPress={() => handleWordPress(pIdx, w)}
                                style={[
                                  styles.wordInline,
                                  isWordActive && [
                                    styles.wordInlineActive,
                                    { backgroundColor: '#00996E' },
                                  ],
                                  w.isGlossary && styles.wordInlineGlossary,
                                  {
                                    color: isWordActive
                                      ? '#FFFFFF'
                                      : (isDark ? '#FFFFFF' : '#1A282D'),
                                    fontWeight: isWordActive
                                      ? '700'
                                      : w.isGlossary
                                      ? '600'
                                      : '400',
                                  },
                                ]}
                              >
                                {w.raw}{' '}
                              </Text>
                            );
                          })}
                        </Text>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSeekToParagraph(pIdx)}
                        >
                          <Text
                            style={[
                              styles.transcriptParagraphText,
                              {
                                color:
                                  isPlaying && pIdx < activeParagraphIndex
                                    ? isDark
                                      ? '#8DA297'
                                      : '#687D72'
                                    : isDark
                                    ? '#FFFFFF'
                                    : '#1A282D',
                              },
                            ]}
                          >
                            {activeParagraphs[pIdx]?.text || ''}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
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
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
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
    height: 38,
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
  /* Section Header Row with Chapter Switcher */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chapterPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  chapterPillBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* Player Header (.playerTitle, .playerSubtitle) */
  playerHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  playerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 16,
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
    marginBottom: 8,
  },
  transcriptHint: {
    fontSize: 9.5,
    marginBottom: 8,
  },
  transcriptReadingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  transcriptParagraphCard: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  transcriptParagraphActive: {
    borderRadius: 6,
  },
  activeSpeakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  activeSpeakerText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transcriptParagraph: {
    fontSize: 12.5,
    lineHeight: 22,
  },
  wordInline: {
    fontSize: 12.5,
    lineHeight: 22,
  },
  wordInlineActive: {
    borderRadius: 4,
    paddingHorizontal: 3,
  },
  wordInlineGlossary: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
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
    gap: 6,
  },
  microTranscriptCard: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 6,
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
  listenChapterHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  badgeGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 4,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  countBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  podcastOverline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  timestampBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  timestampBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  listenChapterTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
