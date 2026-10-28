import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import {
  ChapterPodcastBundle,
  PodcastParagraph,
  MicrocastItemData,
  fetchPodcastBundle,
} from '@/services/contentService';
import { getPodcastAudioUrl } from '@/services/podcastAudioService';
import ListenScreenTablet from './ListenScreen.tablet';
import BreadcrumbBar from '@/components/navigation/BreadcrumbBar';

const { width } = Dimensions.get('window');

export type ListenMode = 'quick' | 'detailed' | 'microcasts';

interface ListenScreenProps {
  chapterNumber?: number;
  chapterTitle?: string;
  initialMode?: ListenMode;
  initialMicrocastTopic?: string;
  initialAutoPlay?: boolean;
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
  initialMicrocastTopic,
  initialAutoPlay,
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
        initialMicrocastTopic={initialMicrocastTopic}
        initialAutoPlay={initialAutoPlay}
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

  // Fallback initial microcast placeholder so activeTrack is never undefined while bundle loads
  const initialMicrocastPlaceholder: MicrocastItemData = useMemo(() => ({
    id: 1,
    title: initialMicrocastTopic || `Chapter ${chapterNumber} Audio Lesson`,
    recap: 'Audio overview',
    durationSec: 300,
    durationFormatted: '00:05:00',
    durationLabel: '5 min listen',
    paragraphs: [],
  }), [chapterNumber, initialMicrocastTopic]);

  // Pure API-driven podcast bundle with local storage caching
  const [currentBundle, setCurrentBundle] = useState<ChapterPodcastBundle>({
    chapterNumber,
    quick: {
      title: `Chapter ${chapterNumber} Quick Recap`,
      durationSec: 300,
      durationFormatted: '00:05:00',
      durationLabel: '5 min listen',
      paragraphs: [],
    },
    detailed: {
      title: `Chapter ${chapterNumber} Comprehensive Lecture`,
      durationSec: 600,
      durationFormatted: '00:10:00',
      durationLabel: '10 min listen',
      paragraphs: [],
    },
    microcasts: [initialMicrocastPlaceholder],
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    fetchPodcastBundle('entomology', chapterNumber, controller.signal)
      .then((bundle) => {
        if (isMounted && bundle) {
          setCurrentBundle(bundle);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      controller.abort();
    };
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
      currentBundle.microcasts[0] ||
      initialMicrocastPlaceholder
    );
  }, [currentBundle, selectedMicrocastId, initialMicrocastPlaceholder]);

  const activeTrack = useMemo(() => {
    if (isMicro) return activeMicrocast || initialMicrocastPlaceholder;
    if (isDetailed) return currentBundle.detailed || initialMicrocastPlaceholder;
    return currentBundle.quick || initialMicrocastPlaceholder;
  }, [isMicro, isDetailed, activeMicrocast, currentBundle, initialMicrocastPlaceholder]);

  const activeParagraphs: PodcastParagraph[] = useMemo(() => {
    return (activeTrack?.paragraphs || []).map((p) => ({
      ...p,
      text: p.text.replace(/^\[\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\]\s*/, ''),
    }));
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
    return activeTrack?.durationSec || 0;
  }, [activeTrack]);

  const totalDurationLabel = useMemo(() => {
    return formatSeconds(totalDurationSec);
  }, [totalDurationSec]);

  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const currentUrlRef = useRef<string>('');
  const isPlayingRef = useRef<boolean>(isPlaying);
  const speedRef = useRef<number>(SPEED_OPTIONS[speedIndex]);
  const tokenizedRef = useRef<TokenizedParagraphItem[]>(tokenizedParagraphs);
  const modeRef = useRef<ListenMode>(mode);
  const microcastIdRef = useRef<number>(selectedMicrocastId);
  const totalDurationRef = useRef<number>(totalDurationSec);
  const transcriptScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [paragraphLayouts, setParagraphLayouts] = useState<Record<number, number>>({});

  // Auto-scroll transcript box to keep active read-through paragraph centered in view
  useEffect(() => {
    if (transcriptScrollRef.current && paragraphLayouts[activeParagraphIndex] !== undefined) {
      const targetY = Math.max(0, paragraphLayouts[activeParagraphIndex] - 16);
      transcriptScrollRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [activeParagraphIndex, paragraphLayouts]);

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
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    microcastIdRef.current = selectedMicrocastId;
  }, [selectedMicrocastId]);

  useEffect(() => {
    totalDurationRef.current = totalDurationSec;
  }, [totalDurationSec]);

  // Configure audio session on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(() => {});

    return () => {
      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
          audioPlayerRef.current.remove();
        } catch {}
        audioPlayerRef.current = null;
        currentUrlRef.current = '';
      }
    };
  }, []);

  // Sync active paragraph and word with current playback second
  const syncTranscriptProgress = (timeSec: number) => {
    const paras = tokenizedRef.current;
    if (!paras || paras.length === 0) return;

    let pIdx = 0;
    for (let i = 0; i < paras.length; i++) {
      if (paras[i].startSec <= timeSec) {
        pIdx = i;
      } else {
        break;
      }
    }
    setActiveParagraphIndex(pIdx);

    const para = paras[pIdx];
    if (para && para.words.length > 0) {
      const nextPara = paras[pIdx + 1];
      const start = para.startSec;
      const end = nextPara ? nextPara.startSec : (totalDurationRef.current || start + 30);
      const span = Math.max(1, end - start);
      const elapsed = Math.max(0, timeSec - start);
      const fraction = Math.min(0.99, elapsed / span);
      const wIdx = Math.min(para.words.length - 1, Math.floor(fraction * para.words.length));
      setActiveWordIndex(wIdx);
    }
  };

  /**
   * Loads and attaches listeners to an AudioPlayer from the cloud database audio URL.
   */
  const loadAndPlayTrack = (
    url: string,
    autoPlay: boolean = false,
    startAtSec: number = 0
  ) => {
    // If the player already holds this exact audio URL:
    if (audioPlayerRef.current && currentUrlRef.current === url) {
      if (startAtSec > 0) {
        audioPlayerRef.current.seekTo(startAtSec).catch(() => {});
      }
      if (autoPlay) {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Clean up existing player
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.remove();
      } catch {}
      audioPlayerRef.current = null;
    }

    currentUrlRef.current = url;

    try {
      const player = createAudioPlayer(url, { updateInterval: 200 });
      audioPlayerRef.current = player;
      try {
        player.setPlaybackRate(speedRef.current);
      } catch {}

      player.addListener('playbackStatusUpdate', (status) => {
        if (!status) return;

        if (typeof status.playing === 'boolean') {
          setIsPlaying(status.playing);
        }

        if (typeof status.currentTime === 'number') {
          const sec = Math.floor(status.currentTime);
          setCurrentSec(sec);
          syncTranscriptProgress(status.currentTime);
        }

        // Lock playback rate to speedRef.current whenever audio status updates
        if (status.isLoaded && typeof (status as any).playbackRate === 'number') {
          if (Math.abs((status as any).playbackRate - speedRef.current) > 0.05) {
            try {
              player.setPlaybackRate(speedRef.current);
            } catch {}
          }
        }

        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentSec(0);
          setActiveParagraphIndex(0);
          setActiveWordIndex(-1);
        }
      });

      if (startAtSec > 0) {
        player.seekTo(startAtSec).catch(() => {});
      }

      if (autoPlay) {
        player.play();
        setIsPlaying(true);
        setTimeout(() => {
          try {
            player.setPlaybackRate(speedRef.current);
          } catch {}
        }, 80);
      }
    } catch (err) {
      console.warn('Failed to load cloud podcast audio:', err);
    }
  };

  // Reset player whenever chapter changes
  useEffect(() => {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.remove();
      } catch {}
      audioPlayerRef.current = null;
      currentUrlRef.current = '';
    }
    setIsPlaying(false);
    setCurrentSec(0);
    setActiveParagraphIndex(0);
    setActiveWordIndex(-1);
  }, [chapterNumber]);

  /**
   * Card tap handler for Microcasts view:
   * Plays inline directly on the selected microcast card using BD cloud voice.
   */
  const handleSelectAndPlayMicrocast = (epId: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    const url = getPodcastAudioUrl(chapterNumber, 'microcasts', epId);

    // If tapping the already selected microcast card:
    if (selectedMicrocastId === epId) {
      if (audioPlayerRef.current && currentUrlRef.current === url) {
        if (isPlaying) {
          audioPlayerRef.current.pause();
          setIsPlaying(false);
        } else {
          audioPlayerRef.current.play();
          setIsPlaying(true);
        }
        return;
      }
    }

    // A different microcast card was tapped:
    setSelectedMicrocastId(epId);
    setCurrentSec(0);
    setActiveParagraphIndex(0);
    setActiveWordIndex(-1);

    const targetMicro =
      currentBundle.microcasts.find((m) => m.id === epId) || currentBundle.microcasts[0];
    const targetTokenized: TokenizedParagraphItem[] = (targetMicro?.paragraphs || []).map((p) => ({
      timestamp: p.timestamp,
      startSec: p.startSec,
      words: tokenizeParagraph(p.text),
    }));
    tokenizedRef.current = targetTokenized;

    // Stream and play the cloud audio immediately on the card
    loadAndPlayTrack(url, true, 0);
  };

  useEffect(() => {
    if (initialMode === 'microcasts') {
      setMode('microcasts');
    }
  }, [initialMode]);

  useEffect(() => {
    if (!currentBundle.microcasts || currentBundle.microcasts.length === 0) return;

    let targetEpId = 1;
    if (initialMicrocastTopic) {
      const topicLower = initialMicrocastTopic.toLowerCase();
      const matched = currentBundle.microcasts.find((m) => {
        const titleLower = m.title.toLowerCase();
        const recapLower = (m.recap || '').toLowerCase();
        return (
          titleLower.includes(topicLower) ||
          topicLower.includes(titleLower) ||
          topicLower.split(/\s+/).some((w) => w.length > 3 && titleLower.includes(w)) ||
          recapLower.includes(topicLower)
        );
      });
      if (matched) {
        targetEpId = matched.id;
      }
    }
    setSelectedMicrocastId(targetEpId);

    if (initialAutoPlay) {
      const timer = setTimeout(() => {
        handleSelectAndPlayMicrocast(targetEpId);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentBundle.microcasts, initialMicrocastTopic, initialAutoPlay]);

  const handleSelectMode = (newMode: ListenMode) => {
    if (newMode === mode) return;
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}

    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.remove();
      } catch {}
      audioPlayerRef.current = null;
      currentUrlRef.current = '';
    }

    setIsPlaying(false);
    setCurrentSec(0);
    setActiveParagraphIndex(0);
    setActiveWordIndex(-1);
    setParagraphLayouts({});
    setMode(newMode);
  };

  const handleTogglePlay = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    const url = getPodcastAudioUrl(chapterNumber, mode, selectedMicrocastId);

    if (!audioPlayerRef.current || currentUrlRef.current !== url) {
      loadAndPlayTrack(url, true, currentSec);
      return;
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
      setTimeout(() => {
        try {
          audioPlayerRef.current?.setPlaybackRate(speedRef.current);
        } catch {}
      }, 50);
    }
  };

  const handleSeekToParagraph = (pIdx: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}

    const targetPara = tokenizedParagraphs[pIdx];
    if (!targetPara) return;
    const targetSec = targetPara.startSec;
    setCurrentSec(targetSec);
    setActiveParagraphIndex(pIdx);
    setActiveWordIndex(0);

    const url = getPodcastAudioUrl(chapterNumber, mode, selectedMicrocastId);
    if (audioPlayerRef.current && currentUrlRef.current === url) {
      audioPlayerRef.current.seekTo(targetSec).catch(() => {});
      if (!isPlaying) {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    } else {
      loadAndPlayTrack(url, true, targetSec);
    }
  };

  const handleWordPress = (pIdx: number, w: TokenizedWord) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}

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
    setActiveParagraphIndex(pIdx);
    setActiveWordIndex(w.index);

    const url = getPodcastAudioUrl(chapterNumber, mode, selectedMicrocastId);
    if (audioPlayerRef.current && currentUrlRef.current === url) {
      audioPlayerRef.current.seekTo(targetSec).catch(() => {});
      if (!isPlaying) {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    } else {
      loadAndPlayTrack(url, true, targetSec);
    }
  };

  const handleSkip = (deltaSeconds: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}

    const newSec = Math.max(0, Math.min(totalDurationSec, currentSec + deltaSeconds));
    setCurrentSec(newSec);
    syncTranscriptProgress(newSec);

    const url = getPodcastAudioUrl(chapterNumber, mode, selectedMicrocastId);
    if (audioPlayerRef.current && currentUrlRef.current === url) {
      audioPlayerRef.current.seekTo(newSec).catch(() => {});
    } else {
      loadAndPlayTrack(url, isPlaying, newSec);
    }
  };

  const handleCycleSpeed = () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}

    const nextIdx = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIdx);
    const newRate = SPEED_OPTIONS[nextIdx];
    speedRef.current = newRate;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.setPlaybackRate(newRate);
    }
  };

  const [scrubberWidth, setScrubberWidth] = useState(0);

  const handleScrubberPress = useCallback(
    (e: any) => {
      if (scrubberWidth <= 0 || totalDurationSec <= 0) return;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
      const clickX = e.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, clickX / scrubberWidth));
      const targetSec = Math.round(ratio * totalDurationSec);
      setCurrentSec(targetSec);
      syncTranscriptProgress(targetSec);

      const url = getPodcastAudioUrl(chapterNumber, mode, selectedMicrocastId);
      if (audioPlayerRef.current && currentUrlRef.current === url) {
        audioPlayerRef.current.seekTo(targetSec).catch(() => {});
      } else {
        loadAndPlayTrack(url, isPlaying, targetSec);
      }
    },
    [scrubberWidth, totalDurationSec, chapterNumber, mode, selectedMicrocastId, isPlaying, loadAndPlayTrack]
  );

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
  const emeraldPrimary = '#A4C6B5';
  const mintPillBg = isDark ? 'rgba(164, 198, 181, 0.15)' : '#EAF3EE';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Consistent Breadcrumb Line */}
        <BreadcrumbBar
          chapterNumber={chapterNumber}
          chapterTitle={effectiveChapterTitle}
          onBackPress={onBackPress}
        />

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
          {/* Quick Listen / Essentials Tab */}
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
              Essentials
            </Text>
          </TouchableOpacity>

          {/* Detailed Listen / In-Depth Tab */}
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
              In-Depth
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
        {/* VIEW A & B: ESSENTIALS & IN-DEPTH LISTEN                                   */}
        {/* ========================================================================= */}
        {!isMicro ? (
          <>
            {/* Unified Audio Player Card (Matching User's Reference) */}
            <View style={[styles.unifiedPlayerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Top: Full-Width Scrubber Progress Bar */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleScrubberPress}
                onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}
                style={styles.playerScrubberTouch}
              >
                <View style={[styles.playerScrubberTrack, { backgroundColor: isDark ? '#263B30' : '#D2E6DC' }]}>
                  <View
                    style={[
                      styles.playerScrubberFill,
                      { width: `${progressPercent}%`, backgroundColor: '#00996E' },
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {/* Bottom: Main Player Controls Row */}
              <View style={styles.playerControlsRow}>
                {/* Left: Speed Toggle (Bold Clean Text) */}
                <TouchableOpacity
                  onPress={handleCycleSpeed}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                  style={styles.playerSpeedBtn}
                >
                  <Text style={[styles.playerSpeedText, { color: textDark }]}>
                    {SPEED_OPTIONS[speedIndex]}×
                  </Text>
                </TouchableOpacity>

                {/* Center Cluster: Rewind 15s, Play/Pause, Forward 15s */}
                <View style={styles.playerCenterGroup}>
                  {/* Skip -15s */}
                  <TouchableOpacity
                    style={[
                      styles.playerSkipCircle,
                      { backgroundColor: isDark ? 'rgba(0, 153, 110, 0.22)' : '#E6F3EB' },
                    ]}
                    onPress={() => handleSkip(-15)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.playerSkipLabel, { color: textDark }]}>↶15</Text>
                  </TouchableOpacity>

                  {/* Play / Pause Button */}
                  <TouchableOpacity
                    style={styles.playerPlayCircle}
                    onPress={handleTogglePlay}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={25}
                      color="#FFFFFF"
                      style={!isPlaying ? { marginLeft: 2.5 } : undefined}
                    />
                  </TouchableOpacity>

                  {/* Skip +15s */}
                  <TouchableOpacity
                    style={[
                      styles.playerSkipCircle,
                      { backgroundColor: isDark ? 'rgba(0, 153, 110, 0.22)' : '#E6F3EB' },
                    ]}
                    onPress={() => handleSkip(15)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.playerSkipLabel, { color: textDark }]}>15↷</Text>
                  </TouchableOpacity>
                </View>

                {/* Right: Timestamp */}
                <Text style={[styles.playerTimeText, { color: isDark ? '#A6C5B3' : '#475569' }]}>
                  {formatSeconds(currentSec)} / {totalDurationLabel}
                </Text>
              </View>
            </View>

            {/* 7. Transcript Section (Dedicated Scrollable Box with Auto-following Read-through) */}
            <View style={styles.transcriptSection}>
              <View style={styles.transcriptHeaderRow}>
                <Text style={[styles.transcriptHeading, { color: textDark }]}>Transcript</Text>
                {isPlaying && (
                  <View style={[styles.followingBadge, { backgroundColor: isDark ? 'rgba(0, 153, 110, 0.2)' : '#E6F4EA' }]}>
                    <View style={styles.followingDot} />
                    <Text style={[styles.followingText, { color: '#00996E' }]}>Auto-following</Text>
                  </View>
                )}
              </View>

              <View style={[styles.transcriptBoxContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <ScrollView
                  ref={transcriptScrollRef}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.transcriptBoxContent}
                >
                  {tokenizedParagraphs.map((paraItem, pIdx) => {
                    const isActive = pIdx === activeParagraphIndex;
                    return (
                      <View
                        key={pIdx}
                        onLayout={(e) => {
                          const y = e.nativeEvent.layout.y;
                          setParagraphLayouts((prev) => ({ ...prev, [pIdx]: y }));
                        }}
                        style={[
                          styles.transcriptParagraphCard,
                          isActive && [
                            styles.transcriptParagraphActive,
                            {
                              backgroundColor: isDark
                                ? 'rgba(0, 153, 110, 0.15)'
                                : 'rgba(0, 153, 110, 0.08)',
                            },
                          ],
                        ]}
                      >
                        {isActive ? (
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
                </ScrollView>
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

            {/* List of Microcast Lesson Cards (Cards play inline directly with no separate player) */}
            <View style={styles.microList}>
              {microcastEpisodes.map((ep) => {
                const isSelected = selectedMicrocastId === ep.id;

                if (isSelected) {
                  return (
                    <View
                      key={ep.id}
                      style={[
                        styles.microLessonCard,
                        styles.microLessonCardActive,
                        {
                          backgroundColor: isDark ? 'rgba(0, 153, 110, 0.15)' : '#E8F7ED',
                          borderColor: '#00996E',
                        },
                      ]}
                    >
                      {/* Top Row: Play/Pause circle, Title & Status */}
                      <TouchableOpacity
                        style={styles.microCardTopRow}
                        onPress={() => handleSelectAndPlayMicrocast(ep.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.microEpisodeNumberActive, { backgroundColor: '#00996E' }]}>
                          <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={14}
                            color="#FFFFFF"
                            style={!isPlaying ? { marginLeft: 1.5 } : undefined}
                          />
                        </View>

                        <View style={styles.microLessonInfo}>
                          <Text
                            style={[
                              styles.microEpisodeTitle,
                              { color: isDark ? '#FFFFFF' : '#1A282D', fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                          >
                            {ep.title}
                          </Text>
                          <Text
                            style={[
                              styles.microEpisodeMetadata,
                              { color: isDark ? '#A6C5B3' : '#175945', fontWeight: '600' },
                            ]}
                          >
                            Episode {ep.id} of {microcastEpisodes.length} · {isPlaying ? 'Playing now' : 'Paused'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Integrated Playback Scrubber Track */}
                      <View style={[styles.inlinePlaybackTrack, { backgroundColor: isDark ? '#263B30' : '#DBE5E0' }]}>
                        <View
                          style={[
                            styles.inlinePlaybackProgress,
                            { width: `${progressPercent}%`, backgroundColor: '#00996E' },
                          ]}
                        />
                      </View>

                      {/* Integrated Controls Row */}
                      <View style={styles.inlineControlsRow}>
                        <View style={styles.inlineControlsLeft}>
                          <TouchableOpacity
                            style={[
                              styles.inlineReplayBtn,
                              {
                                backgroundColor: cardBg,
                                borderColor: isDark ? '#2D4538' : '#DBE5E0',
                              },
                            ]}
                            onPress={() => handleSkip(-15)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="refresh" size={11} color={isDark ? '#FFFFFF' : '#1A282D'} />
                            <Text style={[styles.inlineReplayText, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>-15s</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.inlinePlayPauseBtn, { backgroundColor: '#00996E' }]}
                            onPress={() => handleSelectAndPlayMicrocast(ep.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.75}
                          >
                            <Ionicons
                              name={isPlaying ? 'pause' : 'play'}
                              size={13}
                              color="#FFFFFF"
                              style={!isPlaying ? { marginLeft: 1.5 } : undefined}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.inlineSpeedBtn}
                            onPress={handleCycleSpeed}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.inlineSpeedText}>{SPEED_OPTIONS[speedIndex]}x</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={[styles.inlineTimeText, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                          {formatSeconds(currentSec)} / {ep.durationLabel}
                        </Text>
                      </View>
                    </View>
                  );
                }

                // Inactive Card: Tapping it turns it on and immediately starts playback
                return (
                  <TouchableOpacity
                    key={ep.id}
                    style={[
                      styles.microLessonCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: isDark ? '#2D4538' : '#DBE5E0',
                      },
                    ]}
                    onPress={() => handleSelectAndPlayMicrocast(ep.id)}
                    activeOpacity={0.8}
                  >
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

                    <View style={[styles.microPlayIconWrap, { backgroundColor: isDark ? '#1C2B23' : '#E8F7ED' }]}>
                      <Ionicons name="play" size={13} color="#00996E" style={{ marginLeft: 1.5 }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
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
  /* Unified Player Card (Matching User's Reference Image) */
  unifiedPlayerCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  playerScrubberTouch: {
    width: '100%',
    paddingVertical: 4,
  },
  playerScrubberTrack: {
    height: 7,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  playerScrubberFill: {
    height: 7,
    borderRadius: 4,
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  playerSpeedBtn: {
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  playerSpeedText: {
    fontSize: 16,
    fontWeight: '700',
  },
  playerCenterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  playerSkipCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSkipLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  playerPlayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00996E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00996E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  playerTimeText: {
    fontSize: 14.5,
    fontWeight: '600',
    minWidth: 105,
    textAlign: 'right',
  },
  /* Progress Track on top of the Audio Player */
  audioProgressTrack: {
    height: 5,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
  },
  audioProgress: {
    height: 5,
    borderRadius: 3,
  },
  /* Controls Card (.audioPlayerControls) */
  audioPlayerControls: {
    height: 66,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  allControlsCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
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
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  durationText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  /* Transcript (.transcriptHeading, .transcriptBoxContainer) */
  transcriptSection: {
    marginBottom: 24,
  },
  transcriptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  followingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  followingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00996E',
  },
  followingText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  transcriptHeading: {
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptHint: {
    fontSize: 9.5,
    marginBottom: 8,
  },
  transcriptBoxContainer: {
    height: 270,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  transcriptBoxContent: {
    padding: 12,
    gap: 8,
  },
  transcriptReadingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  transcriptParagraphCard: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  transcriptParagraphActive: {
    borderRadius: 8,
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
  /* Active Inline Playing Card Styles */
  microLessonCardActive: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
  },
  microCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  microPlayIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlinePlaybackTrack: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  inlinePlaybackProgress: {
    height: 4,
    borderRadius: 2,
  },
  inlineControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  inlineControlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineReplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  inlineReplayText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inlinePlayPauseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSpeedBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inlineSpeedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00996E',
  },
  inlineTimeText: {
    fontSize: 11,
    fontWeight: '600',
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
