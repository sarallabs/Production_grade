import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  LayoutChangeEvent,
  Platform,
  Modal,
  StatusBar,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import BreadcrumbBar from '@/components/navigation/BreadcrumbBar';

// Fallback thumbnail URI helper
const getYoutubeThumb = (ytId: string) => `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

interface VideoTopicItem {
  number: string;
  title: string;
  subtitle: string;
}

interface VideoLessonItem {
  id: string;
  lessonNumber: string;
  title: string;
  topic: string;
  duration: string;
  status: string;
  progressPct: number;
  filterStatus: 'in_progress' | 'completed' | 'not_started';
  thumbSource: any;
  ytId: string;
  topicsWhatYouLearn: VideoTopicItem[];
}

const CHAPTER_VIDEO_LESSONS: Record<number, VideoLessonItem[]> = {
  1: [
    {
      id: 'lesson_1_01',
      lessonNumber: 'LESSON 01',
      title: 'Insects Digestive System',
      topic: 'Foregut, midgut & hindgut',
      duration: '10:55',
      status: 'Ready to watch',
      progressPct: 0,
      filterStatus: 'not_started',
      thumbSource: { uri: 'https://img.youtube.com/vi/Ioa25iYy53g/hqdefault.jpg' },
      ytId: 'Ioa25iYy53g',
      topicsWhatYouLearn: [
        {
          number: '01',
          title: 'Anatomy of the Insect Alimentary Canal',
          subtitle: 'Foregut, midgut & hindgut differentiation and histology',
        },
        {
          number: '02',
          title: 'Stomodaeal Specializations',
          subtitle: 'Pharynx, crop food storage & proventriculus cuticular teeth',
        },
        {
          number: '03',
          title: 'Mesenteron Physiology',
          subtitle: 'Secretory microvilli epithelium & peritrophic membrane barrier',
        },
        {
          number: '04',
          title: 'Proctodaeum & Excretion',
          subtitle: 'Malpighian tubules & rectal pad water reabsorption',
        },
        {
          number: '05',
          title: 'Enzymatic Digestion & Nutritional Adaptations',
          subtitle: 'Proteases, amylases, lipases and symbiotic digestion',
        },
      ],
    },
  ],
  2: [
    {
      id: 'lesson_2_01',
      lessonNumber: 'LESSON 01',
      title: 'Insect Metamorphosis & Life Cycles',
      topic: 'Metamorphosis, larvae, pupae & hormones',
      duration: '12:40',
      status: 'Ready to watch',
      progressPct: 0,
      filterStatus: 'not_started',
      thumbSource: { uri: 'https://img.youtube.com/vi/7TyeiuOEVBo/hqdefault.jpg' },
      ytId: '7TyeiuOEVBo',
      topicsWhatYouLearn: [
        {
          number: '01',
          title: 'Three Categories of Insect Metamorphosis',
          subtitle: 'Ametabolous, hemimetabolous & holometabolous development',
        },
        {
          number: '02',
          title: 'Larval Classifications & Field Adaptations',
          subtitle: 'Eruciform, scarabaeiform, campodeiform & vermiform larvae',
        },
        {
          number: '03',
          title: 'Pupal Types & Eclosion Strategies',
          subtitle: 'Exarate, obtect & coarctate pupal morphology',
        },
        {
          number: '04',
          title: 'Neuroendocrine Regulatory Cascade',
          subtitle: 'Brain PTTH, prothoracic ecdysone & juvenile hormone titers',
        },
        {
          number: '05',
          title: 'Diapause vs Quiescence',
          subtitle: 'Environmental dormancy triggers, photoperiod & cold hardiness',
        },
      ],
    },
  ],
  3: [
    {
      id: 'lesson_3_01',
      lessonNumber: 'LESSON 01',
      title: 'Weathering of Rocks and Minerals',
      topic: 'Regolith, physical & chemical weathering',
      duration: '11:50',
      status: 'Ready to watch',
      progressPct: 0,
      filterStatus: 'not_started',
      thumbSource: { uri: 'https://img.youtube.com/vi/UMJFfCFFF4M/hqdefault.jpg' },
      ytId: 'UMJFfCFFF4M',
      topicsWhatYouLearn: [
        {
          number: '01',
          title: 'Foundations of Weathering & Regolith Genesis',
          subtitle: 'Bedrock disintegration and saprolite boundary dynamics',
        },
        {
          number: '02',
          title: 'Physical Weathering & Mechanical Forces',
          subtitle: 'Frost wedging (9% expansion), thermal exfoliation & abrasion',
        },
        {
          number: '03',
          title: 'Chemical Weathering Reactions',
          subtitle: 'Hydrolysis, hydration, carbonation, oxidation and reduction pathways',
        },
        {
          number: '04',
          title: 'Biological Agents of Weathering',
          subtitle: 'Pioneer lichens, microbial organic acids & tree root wedging',
        },
        {
          number: '05',
          title: 'Goldich Stability Series vs Bowen Series',
          subtitle: 'Mineral weathering vulnerability and soil profile development',
        },
      ],
    },
  ],
  4: [
    {
      id: 'lesson_4_01',
      lessonNumber: 'LESSON 01',
      title: 'Pollination, Pollinizers & Parthenocarpy in Fruit Crops',
      topic: 'Floral biology, cross-pollination & orchard management',
      duration: '11:30',
      status: 'Ready to watch',
      progressPct: 0,
      filterStatus: 'not_started',
      thumbSource: { uri: 'https://img.youtube.com/vi/elWWuKv5b9Q/hqdefault.jpg' },
      ytId: 'elWWuKv5b9Q',
      topicsWhatYouLearn: [
        {
          number: '01',
          title: 'Floral Biology Architecture & Double Fertilization',
          subtitle: 'Microsporangial locules, sporopollenin & angiosperm syngamy',
        },
        {
          number: '02',
          title: 'Cross-Pollination Enforcements & Barriers',
          subtitle: 'Dichogamy (protandry/protogyny), herkogamy & self-incompatibility',
        },
        {
          number: '03',
          title: 'Managed Pollinator Guilds & Apiculture',
          subtitle: 'Apis mellifera foraging fidelity and tibial corbiculae loading',
        },
        {
          number: '04',
          title: 'Commercial Orchard Planting Geometry',
          subtitle: 'Pollinizer cultivar proportion, windbreaks & minimum stocking rates',
        },
        {
          number: '05',
          title: 'Parthenocarpy Physiological Pathways',
          subtitle: 'Vegetative, stimulative & stenospermocarpy mechanisms',
        },
      ],
    },
  ],
};

function getChapterVideoLessons(chNum: number, chName: string, subjectId?: string): VideoLessonItem[] {
  if (subjectId === 'pubadm_ur' && chNum === 1) {
    return [
      {
        id: 'lesson_pa_01',
        lessonNumber: 'LESSON 01',
        title: 'Video Lecture Part 1: Intro to Public Administration',
        topic: 'Foundations & core concepts',
        duration: '12:00',
        status: 'Ready to watch',
        progressPct: 0,
        filterStatus: 'not_started',
        thumbSource: { uri: 'https://img.youtube.com/vi/zudAdjtoraA/hqdefault.jpg' },
        ytId: 'zudAdjtoraA',
        topicsWhatYouLearn: [
          { number: '01', title: 'Core Concepts & Scope', subtitle: 'Evolution of administrative thought' },
          { number: '02', title: 'Public vs Private Admin', subtitle: 'Key structural and operational differences' },
          { number: '03', title: 'Modern Governance Roles', subtitle: 'Accountability and service delivery' },
        ],
      },
      {
        id: 'lesson_pa_02',
        lessonNumber: 'LESSON 02',
        title: 'Video Lecture Part 2: Administrative Theories',
        topic: 'Scientific & classical theories',
        duration: '14:00',
        status: 'Ready to watch',
        progressPct: 0,
        filterStatus: 'not_started',
        thumbSource: { uri: 'https://img.youtube.com/vi/LEfMH2SNznY/hqdefault.jpg' },
        ytId: 'LEfMH2SNznY',
        topicsWhatYouLearn: [
          { number: '01', title: 'Taylorism & Scientific Management', subtitle: 'Efficiency and workflow analysis' },
          { number: '02', title: 'Henri Fayol Classical Theory', subtitle: 'Principles of departmental organization' },
          { number: '03', title: 'Human Relations Approach', subtitle: 'Hawthorne experiments and group behavior' },
        ],
      },
      {
        id: 'lesson_pa_03',
        lessonNumber: 'LESSON 03',
        title: 'Video Lecture Part 3: Decision Making & Ethics',
        topic: 'Herbert Simon & leadership',
        duration: '15:00',
        status: 'Ready to watch',
        progressPct: 0,
        filterStatus: 'not_started',
        thumbSource: { uri: 'https://img.youtube.com/vi/vb9N0S158GA/hqdefault.jpg' },
        ytId: 'vb9N0S158GA',
        topicsWhatYouLearn: [
          { number: '01', title: 'Herbert Simon Decision Making', subtitle: 'Bounded rationality model' },
          { number: '02', title: 'Leadership & Motivation', subtitle: 'Public organizational dynamics' },
          { number: '03', title: 'Development Administration', subtitle: 'Comparative public administration' },
        ],
      },
    ];
  }

  if (CHAPTER_VIDEO_LESSONS[chNum]) {
    return CHAPTER_VIDEO_LESSONS[chNum];
  }

  return [
    {
      id: 'lesson_' + chNum + '_01',
      lessonNumber: 'LESSON 01',
      title: chName + ' — Comprehensive Lecture',
      topic: 'Core principles & foundations',
      duration: '11:00',
      status: 'Ready to watch',
      progressPct: 0,
      filterStatus: 'not_started',
      thumbSource: { uri: 'https://img.youtube.com/vi/Ioa25iYy53g/hqdefault.jpg' },
      ytId: 'Ioa25iYy53g',
      topicsWhatYouLearn: [
        { number: '01', title: 'Foundational Principles', subtitle: chName + ' structure and overview' },
        { number: '02', title: 'Biological Mechanisms', subtitle: 'Detailed physiological pathways' },
        { number: '03', title: 'Agro-Ecological Relevance', subtitle: 'Field applications and key exam takeaways' },
      ],
    },
  ];
}

type FilterType = 'all' | 'in_progress' | 'completed';

interface VideosViewProps {
  subjectId?: string;
  subjectName?: string;
  chapterNumber?: number;
  chapterName?: string;
  onContinueLearning?: () => void;
}

export default function VideosView({
  subjectId = 'entomology',
  subjectName = 'ENTOMOLOGY',
  chapterNumber = 1,
  chapterName = 'Insect Digestive System & Anatomy',
  onContinueLearning,
}: VideosViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Dynamic Video Lessons for the current chapter
  const currentChapterLessons = useMemo(() => {
    return getChapterVideoLessons(chapterNumber, chapterName, subjectId);
  }, [chapterNumber, chapterName, subjectId]);

  // If chapter has only 1 video, skip selection screen completely!
  const isSingleVideoUnit = currentChapterLessons.length <= 1;

  // Selected lesson state:
  // When unit is single video, default directly to that video id so selection screen is never shown.
  // When unit has multiple videos, start with null (showing library list) unless user selects one.
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    isSingleVideoUnit ? currentChapterLessons[0]?.id || null : null
  );

  useEffect(() => {
    if (isSingleVideoUnit) {
      setSelectedLessonId(currentChapterLessons[0]?.id || null);
    } else {
      setSelectedLessonId(null);
    }
  }, [chapterNumber, subjectId, isSingleVideoUnit, currentChapterLessons]);

  const currentLesson = useMemo(() => {
    return (
      currentChapterLessons.find((l) => l.id === selectedLessonId) ||
      currentChapterLessons[0]
    );
  }, [currentChapterLessons, selectedLessonId]);

  // Player & Controls State
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  // Start with CC ON by default; user can toggle it OFF/ON at any time
  const [showCaptions, setShowCaptions] = useState(true);
  const showCaptionsRef = useRef<boolean>(true);
  const [captionToastText, setCaptionToastText] = useState<string | null>(null);
  const captionToastTimerRef = useRef<any>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [containerWidth, setContainerWidth] = useState(0);
  const [inlineScrubberWidth, setInlineScrubberWidth] = useState(0);
  const [fsScrubberWidth, setFsScrubberWidth] = useState(0);

  // Auto-hide controls state (YouTube style)
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimerRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const playerRef = useRef<any>(null);
  const playerFsRef = useRef<any>(null);
  const currentTimeRef = useRef<number>(0);
  const hasStartedRef = useRef<boolean>(false);

  // Helper to execute arbitrary JS inside the YouTube player WebView without seeking
  const runPlayerCommand = useCallback((jsCode: string) => {
    if (playerFsRef.current?.seekTo) {
      try {
        (playerFsRef.current.seekTo as any)(
          -999,
          `false); try { ${jsCode} } catch(e){} true; //`
        );
      } catch {}
    }
  }, []);

  const handleToggleCaptions = useCallback(() => {
    Haptics.selectionAsync();
    const next = !showCaptionsRef.current;
    showCaptionsRef.current = next;
    setShowCaptions(next);
    setCaptionToastText(next ? 'Subtitles on' : 'Subtitles off');
    if (captionToastTimerRef.current) clearTimeout(captionToastTimerRef.current);
    captionToastTimerRef.current = setTimeout(() => {
      setCaptionToastText(null);
    }, 2000);

    // Immediately apply captions ON or OFF inside the live YouTube player without reloading
    runPlayerCommand(
      `window.__saralCCEnabled = ${next ? 'true' : 'false'}; if (typeof window.__saralApplyCC === 'function') { window.__saralApplyCC(${next ? 'true' : 'false'}); }`
    );

    // Reset control hide timer so UI remains visible while interacting
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    setControlsVisible(true);
    fadeAnim.setValue(1);
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3500);
  }, [fadeAnim, runPlayerCommand]);

  // Orientation handling: Lock to landscape for fullscreen, restore portrait/default on exit
  const lockLandscape = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch (e) {
      console.warn('[VideosView] lockAsync error:', e);
    }
  }, []);

  const restoreOrientation = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      const s = Dimensions.get('screen');
      const isTabletDevice = Math.min(s.width, s.height) >= 600;
      if (isTabletDevice) {
        await ScreenOrientation.unlockAsync();
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    } catch (e) {
      console.warn('[VideosView] unlock error:', e);
    }
  }, []);

  // Sync orientation with isFullScreen state (lock landscape on enter, restore portrait on exit)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (isFullScreen) {
      lockLandscape();
    } else {
      restoreOrientation();
    }
  }, [isFullScreen, lockLandscape, restoreOrientation]);

  // Cleanup: ensure portrait/default is restored if component unmounts while in fullscreen
  useEffect(() => {
    return () => {
      if (Platform.OS !== 'web') {
        const s = Dimensions.get('screen');
        const isTabletDevice = Math.min(s.width, s.height) >= 600;
        if (isTabletDevice) {
          ScreenOrientation.unlockAsync().catch(() => {});
        } else {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
        }
      }
    };
  }, []);

  // Convert duration string "10:55" into total seconds as fallback
  const totalDurationSecs = useMemo(() => {
    if (duration > 0) return duration;
    if (!currentLesson?.duration) return 655;
    const parts = currentLesson.duration.split(':').map((p) => parseInt(p, 10));
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }, [duration, currentLesson]);

  // Format seconds to mm:ss
  const formatTime = useCallback((totalSecs: number) => {
    const s = Math.max(0, Math.floor(totalSecs));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  // Controls Visibility & Auto-Hide handling
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    setControlsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    // Auto-hide after 3.2 seconds if video is currently playing
    if (isPlayingVideo) {
      hideControlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowVolumeSlider(false);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 3200);
    }
  }, [isPlayingVideo, fadeAnim]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlayingVideo, resetHideTimer]);

  const toggleControls = useCallback(() => {
    // When paused, keep controls visible so clean controls are always available
    if (!isPlayingVideo) {
      setControlsVisible(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      return;
    }
    if (controlsVisible) {
      setControlsVisible(false);
      setShowVolumeSlider(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      resetHideTimer();
    }
  }, [isPlayingVideo, controlsVisible, fadeAnim, resetHideTimer]);

  // Video Actions - Opens fullscreen in landscape and starts playback immediately
  const handlePlayFullscreen = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hasStartedRef.current = false;
    setIsPlayingVideo(true);
    setIsFullScreen(true);
    resetHideTimer();
    await lockLandscape();
  }, [resetHideTimer, lockLandscape]);

  const handleExitFullScreen = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Explicitly pause video before unmounting and capture current time
    const cur = currentTimeRef.current || currentTime || 0;
    try {
      if (playerFsRef.current?.seekTo) {
        (playerFsRef.current.seekTo as any)(
          cur,
          'true); try { player.pauseVideo(); } catch(e){} true; //'
        );
      }
      if (playerFsRef.current?.pauseVideo) {
        try { playerFsRef.current.pauseVideo(); } catch {}
      }
      if (playerFsRef.current?.getCurrentTime) {
        const t = await playerFsRef.current.getCurrentTime();
        if (typeof t === 'number' && !isNaN(t) && t >= 0) {
          currentTimeRef.current = t;
          setCurrentTime(Math.floor(t));
        }
      }
    } catch {}
    // Cleanly pause and exit fullscreen so device smoothly returns to portrait without dual-WebView glitch
    setIsPlayingVideo(false);
    setIsFullScreen(false);
    resetHideTimer();
    await restoreOrientation();
  }, [currentTime, resetHideTimer, restoreOrientation]);

  const handleToggleFullScreen = useCallback(async () => {
    if (isFullScreen) {
      await handleExitFullScreen();
    } else {
      await handlePlayFullscreen();
    }
  }, [isFullScreen, handleExitFullScreen, handlePlayFullscreen]);

  const handlePlayLessonDirectly = useCallback(async (lessonId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLessonId(lessonId);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    hasStartedRef.current = false;
    setIsPlayingVideo(true);
    setIsFullScreen(true);
    resetHideTimer();
    await lockLandscape();
  }, [resetHideTimer, lockLandscape]);

  const handlePlayerStateChange = useCallback(
    (state: string) => {
      if (state === 'playing') {
        hasStartedRef.current = true;
        setIsPlayingVideo(true);
        // Re-enforce current caption state & playback speed as soon as playback starts
        const ccOn = showCaptionsRef.current;
        runPlayerCommand(
          `window.__saralCCEnabled = ${ccOn ? 'true' : 'false'}; if (typeof window.__saralApplyCC === 'function') { window.__saralApplyCC(${ccOn ? 'true' : 'false'}); } if (typeof player !== 'undefined' && player && player.setPlaybackRate) { player.setPlaybackRate(${playbackSpeed}); }`
        );
      } else if (state === 'paused') {
        if (hasStartedRef.current) {
          setIsPlayingVideo(false);
        }
      } else if (state === 'ended') {
        hasStartedRef.current = false;
        setIsPlayingVideo(false);
        currentTimeRef.current = 0;
        setCurrentTime(0);
      }
    },
    [runPlayerCommand, playbackSpeed]
  );

  const handlePlayerReady = useCallback(async () => {
    hasStartedRef.current = true;
    setIsPlayingVideo(true);
    // Explicit seek forces YouTube iframe to buffer and start playing immediately
    const startSec = currentTimeRef.current > 0 ? currentTimeRef.current : 0.1;
    const ccOn = showCaptionsRef.current;
    if (playerFsRef.current?.seekTo) {
      try {
        (playerFsRef.current.seekTo as any)(
          startSec,
          `true); try { if (typeof player !== 'undefined' && player && typeof player.seekTo === 'function' && !player.__saralWrappedSeek) { var __os = player.seekTo.bind(player); player.seekTo = function(s, a){ if (s === -999) return; return __os(s, a); }; player.__saralWrappedSeek = true; } player.playVideo(); window.__saralCCEnabled = ${ccOn ? 'true' : 'false'}; if (typeof window.__saralApplyCC === 'function') { window.__saralApplyCC(${ccOn ? 'true' : 'false'}); } } catch(e){} true; //`
        );
      } catch {}
    }
    if (playerFsRef.current?.getDuration) {
      try {
        const d = await playerFsRef.current.getDuration();
        if (typeof d === 'number' && !isNaN(d) && d > 0) {
          setDuration(Math.floor(d));
        }
      } catch {}
    }
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    Haptics.selectionAsync();
    if (!isFullScreen) {
      handlePlayFullscreen();
      return;
    }
    setIsPlayingVideo((prev) => {
      const next = !prev;
      const cur = currentTimeRef.current || currentTime || 0;
      if (!next) {
        // Paused: explicitly command YouTube iframe to pause via reliable injection
        runPlayerCommand('if (typeof player !== "undefined" && player && player.pauseVideo) { player.pauseVideo(); }');
        if (playerFsRef.current?.pauseVideo) {
          try { playerFsRef.current.pauseVideo(); } catch {}
        }
        // Keep controls visible
        setControlsVisible(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
      } else {
        hasStartedRef.current = true;
        // Playing: explicitly command YouTube iframe to play via reliable injection
        runPlayerCommand(`if (typeof player !== "undefined" && player && player.playVideo) { player.playVideo(); }`);
        if (playerFsRef.current?.playVideo) {
          try { playerFsRef.current.playVideo(); } catch {}
        }
        resetHideTimer();
      }
      return next;
    });
  }, [isFullScreen, handlePlayFullscreen, currentTime, fadeAnim, resetHideTimer, runPlayerCommand]);

  const handleSeekRewind = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let cur = currentTimeRef.current || currentTime;
    try {
      if (playerFsRef.current?.getCurrentTime) {
        const t = await playerFsRef.current.getCurrentTime();
        if (typeof t === 'number' && !isNaN(t) && t >= 0) {
          cur = t;
        }
      }
    } catch {}
    const target = Math.max(0, cur - 10);
    currentTimeRef.current = target;
    setCurrentTime(Math.floor(target));
    if (playerFsRef.current?.seekTo) {
      playerFsRef.current.seekTo(target, true);
    }
    resetHideTimer();
  }, [currentTime, resetHideTimer]);

  const handleSeekForward = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let cur = currentTimeRef.current || currentTime;
    try {
      if (playerFsRef.current?.getCurrentTime) {
        const t = await playerFsRef.current.getCurrentTime();
        if (typeof t === 'number' && !isNaN(t) && t >= 0) {
          cur = t;
        }
      }
    } catch {}
    const target = Math.min(totalDurationSecs, cur + 10);
    currentTimeRef.current = target;
    setCurrentTime(Math.floor(target));
    if (playerFsRef.current?.seekTo) {
      playerFsRef.current.seekTo(target, true);
    }
    resetHideTimer();
  }, [currentTime, totalDurationSecs, resetHideTimer]);

  const handleScrubberPress = useCallback(
    (evt: any, isFull?: boolean) => {
      const locationX = evt.nativeEvent.locationX;
      const fallbackWidth = isFull
        ? Math.max(windowWidth, windowHeight) - 32
        : containerWidth > 0
        ? containerWidth - 32
        : 320;
      const trackWidth = isFull
        ? fsScrubberWidth > 0
          ? fsScrubberWidth
          : fallbackWidth
        : inlineScrubberWidth > 0
        ? inlineScrubberWidth
        : fallbackWidth;
      if (trackWidth <= 0) return;
      const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
      const newSec = Math.round(ratio * totalDurationSecs);
      currentTimeRef.current = newSec;
      setCurrentTime(newSec);
      if (playerFsRef.current?.seekTo) {
        playerFsRef.current.seekTo(newSec, true);
      }
      resetHideTimer();
    },
    [containerWidth, inlineScrubberWidth, fsScrubberWidth, windowWidth, windowHeight, totalDurationSecs, resetHideTimer]
  );

  const handleToggleMute = useCallback(() => {
    Haptics.selectionAsync();
    setIsMuted((prev) => {
      const next = !prev;
      runPlayerCommand(
        next
          ? 'if (typeof player !== "undefined" && player && player.mute) { player.mute(); }'
          : 'if (typeof player !== "undefined" && player && player.unMute) { player.unMute(); if (player.setVolume) player.setVolume(100); }'
      );
      return next;
    });
    resetHideTimer();
  }, [resetHideTimer, runPlayerCommand]);

  // Real-time synchronization interval to track playback and keep time & duration synced in fullscreen
  useEffect(() => {
    let interval: any = null;
    if (isPlayingVideo && isFullScreen) {
      interval = setInterval(async () => {
        if (playerFsRef.current?.getDuration && duration === 0) {
          try {
            const d = await playerFsRef.current.getDuration();
            if (typeof d === 'number' && !isNaN(d) && d > 0) {
              setDuration(Math.floor(d));
            }
          } catch {}
        }
        if (playerFsRef.current?.getCurrentTime) {
          try {
            const t = await playerFsRef.current.getCurrentTime();
            if (typeof t === 'number' && !isNaN(t) && t >= 0) {
              currentTimeRef.current = t;
              setCurrentTime(Math.floor(t));
              return;
            }
          } catch {}
        }
        // Fallback ticker if player is buffering or on web
        setCurrentTime((prev) => {
          if (prev >= totalDurationSecs) {
            setIsPlayingVideo(false);
            return totalDurationSecs;
          }
          const next = prev + 1;
          currentTimeRef.current = next;
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingVideo, isFullScreen, totalDurationSecs, duration]);

  // Guarantee playback starts when entering fullscreen
  useEffect(() => {
    let timer: any = null;
    if (isFullScreen && isPlayingVideo) {
      timer = setTimeout(() => {
        const startSec = currentTimeRef.current > 0 ? currentTimeRef.current : 0.1;
        if (playerFsRef.current?.seekTo) {
          try {
            (playerFsRef.current.seekTo as any)(
              startSec,
              'true); try { player.playVideo(); } catch(e){} true; //'
            );
          } catch {}
        }
      }, 400);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFullScreen, isPlayingVideo]);

  // Statistics for multi-video view
  const totalVideos = currentChapterLessons.length;
  const inProgressCount = currentChapterLessons.filter((l) => l.filterStatus === 'in_progress').length;
  const completedCount = currentChapterLessons.filter((l) => l.filterStatus === 'completed').length;
  const totalMinutes = useMemo(() => {
    return currentChapterLessons.reduce((acc, l) => {
      const parts = l.duration.split(':').map((p) => parseInt(p, 10));
      const mins = (parts[0] || 0) + (parts[1] && parts[1] >= 30 ? 1 : 0);
      return acc + mins;
    }, 0);
  }, [currentChapterLessons]);

  const completionPct = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  const filteredLessons = currentChapterLessons.filter((lesson) => {
    if (filter === 'all') return true;
    return lesson.filterStatus === filter;
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    Haptics.selectionAsync();
    setSelectedLessonId(lessonId);
    setIsPlayingVideo(false);
  };

  const handleBackToLibrary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLessonId(null);
    setIsPlayingVideo(false);
  };

  // Color Tokens
  const bg = isDark ? '#121E17' : '#F1F6F2';
  const cardBg = isDark ? '#1C2B23' : '#FEFEFE';
  const cardBorder = isDark ? '#2D4538' : '#E0E3D9';
  const activeCardBorder = isDark ? '#4ADE80' : '#8DAE9B';
  const brandGreen = isDark ? '#4ADE80' : '#265945';
  const textDark = isDark ? '#FFFFFF' : '#1A2924';
  const textMuted = isDark ? '#A6C5B3' : '#596B66';
  const progressBg = isDark ? '#263B30' : '#DCE7DE';
  const progressFill = isDark ? '#4ADE80' : '#4F7B64';
  const iconTileBg = isDark ? 'rgba(38, 89, 69, 0.25)' : '#E8F0E8';

  const playerHeight = Math.round((containerWidth * 9) / 16) || 215;
  const progressRatio = totalDurationSecs > 0 ? Math.min(1, currentTime / totalDurationSecs) : 0;

  // Fullscreen video dimensions in landscape:
  const fsScreenWidth = isFullScreen ? Math.max(windowWidth, windowHeight) : windowWidth;
  const fsScreenHeight = isFullScreen ? Math.min(windowWidth, windowHeight) : windowHeight;

  let playerFsWidth = fsScreenWidth;
  let playerFsHeight = Math.round((fsScreenWidth * 9) / 16);

  if (playerFsHeight > fsScreenHeight) {
    playerFsHeight = fsScreenHeight;
    playerFsWidth = Math.round((fsScreenHeight * 16) / 9);
  }

  // Fit 16:9 perfectly inside fullscreen without crop bleed, keeping subtitles and bottom content 100% visible
  const renderedFsWidth = playerFsWidth;
  const renderedFsHeight = playerFsHeight;

  // Injected JavaScript for YouTube player WebView to dynamically configure Closed Captions track & styling
  const injectedCcScript = useMemo(() => {
    return `
      (function() {
        if (!window.__saralMsgBridged) {
          window.__saralMsgBridged = true;
          document.addEventListener('message', function(e) {
            try {
              window.dispatchEvent(new MessageEvent('message', { data: e.data }));
            } catch(err) {}
          });
        }

        if (typeof window.__saralCCEnabled === 'undefined') {
          window.__saralCCEnabled = ${showCaptionsRef.current ? 'true' : 'false'};
        }

        window.__saralApplyCC = function(enabled) {
          window.__saralCCEnabled = Boolean(enabled);
          if (typeof player === 'undefined' || !player) return;
          try {
            if (window.__saralCCEnabled) {
              if (typeof player.loadModule === 'function') {
                try { player.loadModule('captions'); } catch(e) {}
                try { player.loadModule('cc'); } catch(e) {}
              }
              if (typeof player.setOption === 'function') {
                var tracks = [];
                try { tracks = player.getOption('captions', 'tracklist') || []; } catch(e) {}
                var track = (tracks && tracks.length > 0) ? tracks[0] : { languageCode: 'en' };
                try { player.setOption('captions', 'track', track); } catch(e) {}
                try { player.setOption('cc', 'track', track); } catch(e) {}
                try { player.setOption('captions', 'fontSize', 1); } catch(e) {}
              }
            } else {
              if (typeof player.setOption === 'function') {
                try { player.setOption('captions', 'track', {}); } catch(e) {}
                try { player.setOption('cc', 'track', {}); } catch(e) {}
              }
              if (typeof player.unloadModule === 'function') {
                try { player.unloadModule('captions'); } catch(e) {}
                try { player.unloadModule('cc'); } catch(e) {}
              }
            }
          } catch(e) {}
        };

        if (!window.__saralCCInterval) {
          window.__saralCCInterval = setInterval(function() {
            if (typeof player !== 'undefined' && player) {
              if (typeof player.seekTo === 'function' && !player.__saralWrappedSeek) {
                var origSeek = player.seekTo.bind(player);
                player.seekTo = function(sec, allow) {
                  if (sec === -999) return;
                  return origSeek(sec, allow);
                };
                player.__saralWrappedSeek = true;
              }
              if (!window.__saralCCEnabled) {
                window.__saralApplyCC(false);
              } else {
                try {
                  var curTrack = (typeof player.getOption === 'function') ? player.getOption('captions', 'track') : null;
                  if (!curTrack || !curTrack.languageCode) {
                    window.__saralApplyCC(true);
                  }
                } catch(e) {
                  window.__saralApplyCC(true);
                }
              }
            }
          }, 400);
        }

        try {
          var st = document.createElement('style');
          st.innerHTML = '.caption-window, .ytp-caption-window-bottom { margin-bottom: 12px !important; }';
          document.head.appendChild(st);
        } catch(e) {}
      })();
      true;
    `;
  }, []);

  // Shared Bottom Controls Bar Component (Matching User's PNG + Clean No-Overlap Spacing)
  const renderControlsBar = (isFull: boolean) => {
    return (
      <Animated.View
        style={[
          styles.controlsOverlayContainer,
          isFull ? styles.controlsFullScreenPosition : styles.controlsInlinePosition,
          { opacity: fadeAnim },
        ]}
      >
        {/* Blue Scrubber Progress Bar */}
        <TouchableOpacity
          activeOpacity={1}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setInlineScrubberWidth(w);
          }}
          onPress={(e) => handleScrubberPress(e, isFull)}
          style={styles.scrubberTouchArea}
        >
          <View style={styles.scrubberTrack}>
            <View style={[styles.scrubberFill, { width: `${progressRatio * 100}%` }]} />
            <View style={[styles.scrubberThumb, { left: `${progressRatio * 100}%` }]} />
          </View>
        </TouchableOpacity>

        {/* Dark Controls Bar */}
        <View style={styles.controlsBarRow}>
          {/* Left Controls: Play, Rewind, Forward, Speaker (+ Popout Volume Slider) */}
          <View style={styles.controlsLeftGroup}>
            {/* Play/Pause Button */}
            <TouchableOpacity
              onPress={handleTogglePlayPause}
              style={styles.playPauseCircleBtn}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlayingVideo ? 'pause' : 'play'}
                size={15}
                color="#FFFFFF"
                style={isPlayingVideo ? undefined : { marginLeft: 2 }}
              />
            </TouchableOpacity>

            {/* Rewind 10s */}
            <TouchableOpacity
              onPress={handleSeekRewind}
              style={styles.controlIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="play-back" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Fast-forward 10s */}
            <TouchableOpacity
              onPress={handleSeekForward}
              style={styles.controlIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="play-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Speaker Icon - Tapping toggles the hidden volume slider */}
            <View style={styles.volumeControlGroup}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowVolumeSlider((prev) => !prev);
                  resetHideTimer();
                }}
                onLongPress={handleToggleMute}
                style={styles.controlIconBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'volume-high'}
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {/* Volume Track - ONLY displayed when user taps speaker! */}
              {showVolumeSlider && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleToggleMute}
                  style={styles.volumeTrack}
                >
                  <View
                    style={[
                      styles.volumeFill,
                      { width: isMuted ? '0%' : '75%' },
                    ]}
                  />
                  <View
                    style={[
                      styles.volumeThumb,
                      { left: isMuted ? '0%' : '75%' },
                    ]}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Timestamp Counter */}
            <Text style={styles.timeCounterText}>
              {`${formatTime(currentTime)} / ${formatTime(totalDurationSecs)}`}
            </Text>
          </View>

          {/* Right Controls: CC, Gear, Fullscreen */}
          <View style={styles.controlsRightGroup}>
            {/* Subtitles [CC] */}
            <TouchableOpacity
              onPress={handleToggleCaptions}
              style={[
                styles.ccBadge,
                showCaptions && styles.ccBadgeActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.ccBadgeText,
                  showCaptions && styles.ccBadgeTextActive,
                ]}
              >
                CC
              </Text>
            </TouchableOpacity>

            {/* Settings Gear */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setShowSpeedModal(true);
              }}
              style={styles.controlIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-sharp" size={17} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Fullscreen Expand / Minimize */}
            <TouchableOpacity
              onPress={handleToggleFullScreen}
              style={styles.controlIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFull ? 'contract' : 'expand'}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Consistent Breadcrumb Line */}
        <BreadcrumbBar
          subjectName={subjectName}
          chapterNumber={chapterNumber}
          chapterTitle={chapterName}
          onBackPress={() => {
            if (selectedLessonId !== null && !isSingleVideoUnit) {
              setSelectedLessonId(null);
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/subjects');
            }
          }}
        />

        {/* ========================================================================= */}
        {/* VIEW 1: MULTI-VIDEO SELECTION SCREEN (Shown ONLY if videos > 1)           */}
        {/* ========================================================================= */}
        {!isSingleVideoUnit && selectedLessonId === null ? (
          <>
            {/* Page Header */}
            <View style={styles.introduction}>
              <View style={styles.headerTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pageTitle, { color: textDark }]}>
                    Video Lessons
                  </Text>
                  <Text style={[styles.chapterSubheading, { color: textMuted }]} numberOfLines={1}>
                    Chapter {chapterNumber}: {chapterName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Card */}
            <View style={[styles.learningProgressCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.progressTopRow}>
                <View style={[styles.progressIconWrap, { backgroundColor: iconTileBg }]}>
                  <Ionicons name="play-circle" size={24} color={brandGreen} />
                </View>
                <View style={styles.progressStatsWrap}>
                  <Text style={[styles.progressNumber, { color: textDark }]}>
                    {completedCount} of {totalVideos}
                  </Text>
                  <Text style={[styles.progressLabel, { color: textMuted }]}>
                    Lessons Completed ({completionPct}%)
                  </Text>
                </View>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: progressBg, marginTop: 12 }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: progressFill,
                      width: `${completionPct}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filter === 'all'
                    ? { backgroundColor: '#265945', borderColor: '#265945' }
                    : { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter('all');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: filter === 'all' ? '#FFFFFF' : textMuted,
                      fontWeight: filter === 'all' ? '600' : '500',
                    },
                  ]}
                >
                  All ({totalVideos})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filter === 'in_progress'
                    ? { backgroundColor: '#265945', borderColor: '#265945' }
                    : { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter('in_progress');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: filter === 'in_progress' ? '#FFFFFF' : textMuted,
                      fontWeight: filter === 'in_progress' ? '600' : '500',
                    },
                  ]}
                >
                  In Progress ({inProgressCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filter === 'completed'
                    ? { backgroundColor: '#265945', borderColor: '#265945' }
                    : { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter('completed');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: filter === 'completed' ? '#FFFFFF' : textMuted,
                      fontWeight: filter === 'completed' ? '600' : '500',
                    },
                  ]}
                >
                  Completed ({completedCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lessons List Heading */}
            <View style={styles.lessonListHeading}>
              <Text style={[styles.listHeadingText, { color: brandGreen }]}>YOUR VIDEO LESSONS</Text>
              <Text style={[styles.totalDuration, { color: textMuted }]}>
                {totalVideos} video{totalVideos === 1 ? '' : 's'} · {totalMinutes} min
              </Text>
            </View>

            {/* Multi-Video Cards */}
            <View style={styles.videoLessonsList}>
              {filteredLessons.map((item) => {
                const isInProgress = item.filterStatus === 'in_progress';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.videoLessonCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: isInProgress ? activeCardBorder : cardBorder,
                      },
                    ]}
                    onPress={() => handleSelectLesson(item.id)}
                    activeOpacity={0.88}
                  >
                    <TouchableOpacity
                      style={styles.videoThumbnail}
                      onPress={() => handlePlayLessonDirectly(item.id)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={item.thumbSource || { uri: getYoutubeThumb(item.ytId) }}
                        style={styles.lessonImageIcon}
                        resizeMode="cover"
                      />
                      <View style={styles.playLessonBtn}>
                        <Ionicons name="play" size={11} color="#265945" style={{ marginLeft: 2 }} />
                      </View>
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationBadgeText}>{item.duration}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.lessonDetails}>
                      <Text style={[styles.lessonNumber, { color: textMuted }]}>
                        {item.lessonNumber}
                      </Text>
                      <Text style={[styles.lessonTitleText, { color: textDark }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.lessonTopicText, { color: textMuted }]} numberOfLines={1}>
                        {item.topic}
                      </Text>

                      <View style={styles.watchProgress}>
                        <Text
                          style={[
                            styles.progressStatusText,
                            {
                              color: item.filterStatus === 'not_started' ? textMuted : brandGreen,
                              fontWeight: item.filterStatus === 'not_started' ? '400' : '600',
                            },
                          ]}
                        >
                          {item.status}
                        </Text>
                        <View style={[styles.progressTrack, { backgroundColor: progressBg }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                backgroundColor: progressFill,
                                width: `${item.progressPct}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.savedProgressNote}>
              <Ionicons name="checkmark-circle-outline" size={14} color={textMuted} />
              <Text style={[styles.savedProgressText, { color: textMuted }]}>
                Your lesson progress is saved automatically.
              </Text>
            </View>
          </>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: DEDICATED SINGLE VIDEO SCREEN (Clean Header + Thumb + Bullets)     */
          /* ========================================================================= */
          <>
            {/* 1. UNIT HEADER TITLE WITH BLUE ACCENT UNDERLINE */}
            <View style={styles.unitHeaderRow}>
              {!isSingleVideoUnit && (
                <TouchableOpacity
                  style={[styles.backToLibraryBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  onPress={handleBackToLibrary}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={18} color={textDark} />
                </TouchableOpacity>
              )}

              <View style={styles.unitTitleWrapper}>
                <View style={styles.unitBadgeContainer}>
                  <Text style={styles.unitBadgeLabel}>
                    Unit-{chapterNumber}:
                  </Text>
                  <View style={styles.unitBadgeUnderline} />
                </View>
                <Text style={[styles.unitTitleText, { color: textDark }]} numberOfLines={1}>
                  {currentLesson.title}
                </Text>
              </View>
            </View>

            {/* 2. VIDEO PLAYER CARD (Real Video Thumbnail + Red Play + YouTube Controls) */}
            <View
              onLayout={onLayout}
              style={[
                styles.videoPlayerCard,
                { backgroundColor: '#000000', borderColor: isDark ? '#223547' : '#E2E8F0' },
              ]}
            >
              {/* Poster View (Real Video Thumbnail + Red Play Button + Controls) */}
              <TouchableOpacity
                style={[styles.posterContainer, { height: playerHeight }]}
                onPress={handlePlayFullscreen}
                activeOpacity={0.92}
              >
                {/* Real Video Thumbnail Image */}
                <Image
                  source={currentLesson.thumbSource || { uri: getYoutubeThumb(currentLesson.ytId) }}
                  style={styles.posterImage}
                  resizeMode="cover"
                />

                {/* Subtle darkening tint for contrast */}
                <View style={styles.posterTintOverlay} />

                {/* Center Large White Play Button with Red Triangle */}
                <View style={styles.centerPlayCircle}>
                  <Ionicons name="play" size={32} color="#EF4444" style={{ marginLeft: 4 }} />
                </View>

                {/* Controls Bar at bottom of poster */}
                {renderControlsBar(false)}
              </TouchableOpacity>
            </View>

            {/* 3. WHAT YOU'LL LEARN HEADING & BULLET POINTS (Directly below video card) */}
            <View style={styles.topicsHeadingParent}>
              <View style={styles.topicsHeadingRow}>
                <View style={styles.topicsBulletDot} />
                <Text style={[styles.topicsHeading, { color: brandGreen }]}>
                  WHAT YOU’LL LEARN
                </Text>
              </View>
            </View>

            {/* 4. TOPIC BULLET POINT CARDS */}
            <View style={styles.topicCardsList}>
              {currentLesson.topicsWhatYouLearn.map((topic) => (
                <View
                  key={topic.number}
                  style={[styles.topicCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <View style={[styles.topicBulletPoint, { backgroundColor: brandGreen }]} />
                  <View style={styles.topicInfoWrap}>
                    <Text style={[styles.topicTitle, { color: textDark }]} numberOfLines={2}>
                      {topic.title}
                    </Text>
                    <Text style={[styles.topicSubtitle, { color: textMuted }]} numberOfLines={3}>
                      {topic.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* FULLSCREEN YOUTUBE MODAL (Rotates to Landscape & Auto-Plays)              */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* FULLSCREEN YOUTUBE MODAL (Rotates to Landscape & Auto-Plays)              */}
      {/* ========================================================================= */}
      <Modal
        visible={isFullScreen}
        animationType="fade"
        statusBarTranslucent
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={handleExitFullScreen}
      >
        <StatusBar hidden={isFullScreen} />
        <View style={styles.fullScreenContainer}>
          {/* Layer 1: Video Player (Sized 16:9 to fill landscape screen) */}
          <View style={styles.fullScreenVideoWrap}>
            {Platform.OS === 'web' ? (
              React.createElement('iframe', {
                key: `fs-${currentLesson.ytId}-${showCaptions ? 'cc1' : 'cc0'}`,
                src: `https://www.youtube.com/embed/${currentLesson.ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&controls=0&cc_load_policy=${showCaptions ? 1 : 0}${showCaptions ? '&cc_lang_pref=en' : ''}&start=${Math.floor(currentTimeRef.current || 0)}`,
                width: '100%',
                height: '100%',
                style: { border: 0, display: 'block', backgroundColor: '#000000' },
                allow:
                  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
                allowFullScreen: true,
                title: currentLesson.title,
              })
            ) : (
              <YoutubePlayer
                key={`fs-player-${currentLesson.ytId}`}
                ref={playerFsRef}
                height={renderedFsHeight}
                width={renderedFsWidth}
                videoId={currentLesson.ytId}
                play={isPlayingVideo && isFullScreen}
                mute={isMuted}
                volume={isMuted ? 0 : volumeLevel}
                playbackRate={playbackSpeed}
                forceAndroidAutoplay={true}
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  androidLayerType: 'hardware',
                  injectedJavaScript: injectedCcScript,
                }}
                initialPlayerParams={{
                  rel: false,
                  modestbranding: true,
                  controls: false,
                  preventFullScreen: true,
                  showClosedCaptions: showCaptions,
                  cc_lang_pref: showCaptions ? 'en' : '',
                  iv_load_policy: 3,
                  start: Math.floor(currentTimeRef.current || 0),
                }}
                onChangeState={handlePlayerStateChange}
                onReady={handlePlayerReady}
              />
            )}
          </View>

          {/* Layer 2: Invisible tap surface behind controls to toggle controls on/off */}
          <TouchableWithoutFeedback onPress={toggleControls}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          {/* Layer 3: Controls Overlay (Auto-hiding, pointerEvents="box-none") */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.fullScreenControlsOverlay,
              {
                opacity: fadeAnim,
                backgroundColor: isPlayingVideo ? 'transparent' : 'rgba(0, 0, 0, 0.45)',
              },
            ]}
            pointerEvents={controlsVisible ? 'box-none' : 'none'}
          >
            {/* Top Bar Overlay */}
            <View
              style={[
                styles.fullScreenTopBar,
                {
                  paddingTop: Math.max(insets.top, 10),
                  paddingLeft: Math.max(insets.left, 16),
                  paddingRight: Math.max(insets.right, 16),
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleExitFullScreen}
                style={styles.fullScreenBackBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.fullScreenVideoTitle} numberOfLines={1}>
                  {`Unit ${chapterNumber}: ${currentLesson.title}`}
                </Text>
                <Text style={styles.fullScreenVideoSub} numberOfLines={1}>
                  {currentLesson.topic}
                </Text>
              </View>
              {/* Screen Minimise Button (Top Bar) */}
              <TouchableOpacity
                onPress={handleExitFullScreen}
                style={styles.fullScreenMinimizeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="contract" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Center Quick Controls Row (10s Rewind, Play/Pause, 10s Forward) */}
            <View style={styles.fullScreenCenterControlsRow} pointerEvents="box-none">
              {/* 10 Seconds Backward Button */}
              <TouchableOpacity
                onPress={handleSeekRewind}
                style={styles.centerSkipBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="play-back" size={28} color="#FFFFFF" />
                <Text style={styles.centerSkipText}>-10s</Text>
              </TouchableOpacity>

              {/* Center Play / Pause Button */}
              <TouchableOpacity
                onPress={handleTogglePlayPause}
                style={styles.centerPlayPauseBtn}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={isPlayingVideo ? 'pause' : 'play'}
                  size={36}
                  color="#FFFFFF"
                  style={isPlayingVideo ? undefined : { marginLeft: 4 }}
                />
              </TouchableOpacity>

              {/* 10 Seconds Forward Button */}
              <TouchableOpacity
                onPress={handleSeekForward}
                style={styles.centerSkipBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="play-forward" size={28} color="#FFFFFF" />
                <Text style={styles.centerSkipText}>+10s</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Fullscreen Controls Bar (Real layout with full touch responsiveness) */}
            <View
              style={[
                styles.fullScreenBottomBarWrapper,
                {
                  paddingLeft: Math.max(insets.left, 16),
                  paddingRight: Math.max(insets.right, 16),
                  paddingBottom: Math.max(insets.bottom, 10),
                },
              ]}
            >
              {/* Blue Scrubber Progress Bar */}
              <TouchableOpacity
                activeOpacity={1}
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0) setFsScrubberWidth(w);
                }}
                onPress={(e) => handleScrubberPress(e, true)}
                style={styles.scrubberTouchArea}
                hitSlop={{ top: 10, bottom: 10 }}
              >
                <View style={styles.scrubberTrack}>
                  <View style={[styles.scrubberFill, { width: `${progressRatio * 100}%` }]} />
                  <View style={[styles.scrubberThumb, { left: `${progressRatio * 100}%` }]} />
                </View>
              </TouchableOpacity>

              {/* Controls Bar Row */}
              <View style={styles.fullScreenControlsBarRow}>
                {/* Left group: Play/Pause, Rewind, Forward, Volume, Time */}
                <View style={styles.controlsLeftGroup}>
                  {/* Play/Pause Button */}
                  <TouchableOpacity
                    onPress={handleTogglePlayPause}
                    style={styles.playPauseCircleBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={isPlayingVideo ? 'pause' : 'play'}
                      size={16}
                      color="#FFFFFF"
                      style={isPlayingVideo ? undefined : { marginLeft: 2 }}
                    />
                  </TouchableOpacity>

                  {/* Rewind 10s Button */}
                  <TouchableOpacity
                    onPress={handleSeekRewind}
                    style={styles.controlIconBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  >
                    <Ionicons name="play-back" size={18} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Forward 10s Button */}
                  <TouchableOpacity
                    onPress={handleSeekForward}
                    style={styles.controlIconBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  >
                    <Ionicons name="play-forward" size={18} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Volume / Mute Button */}
                  <View style={styles.volumeControlGroup}>
                    <TouchableOpacity
                      onPress={handleToggleMute}
                      style={styles.controlIconBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name={isMuted ? 'volume-mute' : 'volume-high'}
                        size={20}
                        color={isMuted ? '#EF4444' : '#FFFFFF'}
                      />
                    </TouchableOpacity>

                    {/* Popout Volume Track */}
                    {showVolumeSlider && (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleToggleMute}
                        style={styles.volumeTrack}
                      >
                        <View
                          style={[
                            styles.volumeFill,
                            { width: isMuted ? '0%' : '100%' },
                          ]}
                        />
                        <View
                          style={[
                            styles.volumeThumb,
                            { left: isMuted ? '0%' : '100%' },
                          ]}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Timestamp Counter */}
                  <Text style={styles.timeCounterText}>
                    {`${formatTime(currentTime)} / ${formatTime(totalDurationSecs)}`}
                  </Text>
                </View>

                {/* Right Group: CC, Speed, Minimise */}
                <View style={styles.controlsRightGroup}>
                  {/* CC Button (Subtitles) */}
                  <TouchableOpacity
                    onPress={handleToggleCaptions}
                    style={[
                      styles.ccBadge,
                      showCaptions && styles.ccBadgeActive,
                    ]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  >
                    <Text
                      style={[
                        styles.ccBadgeText,
                        showCaptions && styles.ccBadgeTextActive,
                      ]}
                    >
                      CC
                    </Text>
                  </TouchableOpacity>

                  {/* Speed Button (shows speed selector overlay) */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowSpeedModal((prev) => !prev);
                      resetHideTimer();
                    }}
                    style={[
                      styles.speedBadgeBtn,
                      playbackSpeed !== 1.0 && styles.speedBadgeBtnActive,
                    ]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  >
                    <Ionicons name="speedometer-outline" size={15} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.speedBadgeBtnText}>{playbackSpeed === 1.0 ? '1.0x' : `${playbackSpeed}x`}</Text>
                  </TouchableOpacity>

                  {/* Screen Minimise Button */}
                  <TouchableOpacity
                    onPress={handleExitFullScreen}
                    style={styles.controlIconBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="contract"
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Layer 4: Speed Selector In-Player Dialog (NO nested Modal!) */}
          {showSpeedModal && (
            <TouchableOpacity
              style={styles.inPlayerSpeedBackdrop}
              activeOpacity={1}
              onPress={() => setShowSpeedModal(false)}
            >
              <View style={[styles.inPlayerSpeedCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                <View style={styles.inPlayerSpeedHeader}>
                  <Text style={[styles.inPlayerSpeedTitle, { color: textDark }]}>Playback Speed</Text>
                  <TouchableOpacity onPress={() => setShowSpeedModal(false)} style={{ padding: 4 }}>
                    <Ionicons name="close" size={20} color={textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.speedOptionsGrid}>
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.speedPillOption,
                        playbackSpeed === speed && styles.speedPillOptionActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPlaybackSpeed(speed);
                        runPlayerCommand(
                          `if (typeof player !== "undefined" && player && player.setPlaybackRate) { player.setPlaybackRate(${speed}); }`
                        );
                        setShowSpeedModal(false);
                        resetHideTimer();
                      }}
                    >
                      <Text
                        style={[
                          styles.speedPillText,
                          { color: textDark },
                          playbackSpeed === speed && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {speed === 1.0 ? '1.0x (Normal)' : `${speed}x`}
                      </Text>
                      {playbackSpeed === speed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Subtitles Toast Indicator */}
          {captionToastText && (
            <View style={styles.captionsIndicatorWrap} pointerEvents="none">
              <View
                style={[
                  styles.captionsIndicator,
                  { borderColor: showCaptions ? '#4ADE80' : '#94A3B8' },
                ]}
              >
                <Ionicons
                  name={showCaptions ? 'chatbox-ellipses-outline' : 'chatbox-outline'}
                  size={14}
                  color={showCaptions ? '#4ADE80' : '#94A3B8'}
                />
                <Text style={styles.captionsIndicatorText}>{captionToastText}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Portrait Speed Selector Modal (if user taps Settings gear before entering fullscreen) */}
      {!isFullScreen && showSpeedModal && (
        <TouchableOpacity
          style={styles.inPlayerSpeedBackdrop}
          activeOpacity={1}
          onPress={() => setShowSpeedModal(false)}
        >
          <View style={[styles.inPlayerSpeedCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.inPlayerSpeedHeader}>
              <Text style={[styles.inPlayerSpeedTitle, { color: textDark }]}>Playback Speed</Text>
              <TouchableOpacity onPress={() => setShowSpeedModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.speedOptionsGrid}>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedPillOption,
                    playbackSpeed === speed && styles.speedPillOptionActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPlaybackSpeed(speed);
                    setShowSpeedModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.speedPillText,
                      { color: textDark },
                      playbackSpeed === speed && { color: '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    {speed === 1.0 ? '1.0x (Normal)' : `${speed}x`}
                  </Text>
                  {playbackSpeed === speed && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Portrait Subtitles Toast Indicator */}
      {!isFullScreen && captionToastText && (
        <View style={styles.captionsIndicatorWrap} pointerEvents="none">
          <View
            style={[
              styles.captionsIndicator,
              { borderColor: showCaptions ? '#4ADE80' : '#94A3B8' },
            ]}
          >
            <Ionicons
              name={showCaptions ? 'chatbox-ellipses-outline' : 'chatbox-outline'}
              size={14}
              color={showCaptions ? '#4ADE80' : '#94A3B8'}
            />
            <Text style={styles.captionsIndicatorText}>{captionToastText}</Text>
          </View>
        </View>
      )}
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
    paddingTop: 12,
    paddingBottom: 48,
  },
  tabletContent: {
    paddingHorizontal: 32,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },

  /* Introduction / Header */
  introduction: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chapterSubheading: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  chapterPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  chapterPillBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Unit Header Row */
  unitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
  },
  backToLibraryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  unitTitleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitBadgeContainer: {
    position: 'relative',
    paddingBottom: 4,
  },
  unitBadgeLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: -0.2,
  },
  unitBadgeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  unitTitleText: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },

  /* Multi-Video Progress Card */
  learningProgressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStatsWrap: {
    flex: 1,
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Filter Bar */
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },

  /* Lesson List Heading */
  lessonListHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeadingText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  totalDuration: {
    fontSize: 12,
  },

  /* Video Lessons List */
  videoLessonsList: {
    gap: 12,
  },
  videoLessonCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  videoThumbnail: {
    width: 104,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  lessonImageIcon: {
    width: '100%',
    height: '100%',
  },
  playLessonBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durationBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '600',
  },
  lessonDetails: {
    flex: 1,
  },
  lessonNumber: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  lessonTitleText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  lessonTopicText: {
    fontSize: 12,
    marginBottom: 6,
  },
  watchProgress: {
    flexDirection: 'column',
    gap: 4,
  },
  progressStatusText: {
    fontSize: 11,
  },
  savedProgressNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 20,
  },
  savedProgressText: {
    fontSize: 12,
  },

  /* Video Player Card (Real Video Thumbnail) */
  videoPlayerCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 16,
  },
  posterContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  posterImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  posterTintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  centerPlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
  },
  inlinePlayerContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  inlineTouchSurface: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },

  /* Shared Custom Controls Bar Overlay (Matching User's PNG) */
  controlsOverlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  controlsInlinePosition: {
    borderBottomLeftRadius: 19,
    borderBottomRightRadius: 19,
    overflow: 'hidden',
  },
  controlsFullScreenPosition: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
  },

  /* Scrubber Track */
  scrubberTouchArea: {
    height: 18,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: '#334155',
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  scrubberThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    top: -5,
    marginLeft: -7,
  },

  /* Dark Controls Bar Row */
  controlsBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  controlsLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlsRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playPauseCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconBtn: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volumeTrack: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    position: 'relative',
    justifyContent: 'center',
    marginLeft: 2,
  },
  volumeFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#3B82F6',
  },
  volumeThumb: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    top: -2,
    marginLeft: -4,
  },
  timeCounterText: {
    color: '#E2E8F0',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 2,
  },
  ccBadge: {
    borderWidth: 1.2,
    borderColor: '#94A3B8',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  ccBadgeActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A8A',
  },
  ccBadgeText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  ccBadgeTextActive: {
    color: '#FFFFFF',
  },

  /* What You'll Learn Heading */
  topicsHeadingParent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  topicsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topicsBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#265945',
  },
  topicsHeading: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topicsCount: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Topic Bullet Point Cards */
  topicCardsList: {
    gap: 10,
  },
  topicCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  topicBulletPoint: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 7,
  },
  topicIconTile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  topicInfoWrap: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  topicSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  topicNumber: {
    fontSize: 14,
    fontWeight: '800',
  },

  /* FullScreen Modal Styles */
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenTouchLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  fullScreenTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  fullScreenBackBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenMinimizeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenVideoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fullScreenVideoSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  fullScreenCenterTapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCenterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  centerSkipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSkipText: {
    color: '#E2E8F0',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: -2,
  },
  centerPlayPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(38, 89, 69, 0.95)',
    borderWidth: 2.5,
    borderColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  /* FullScreen Controls Overlay & Bottom Bar */
  fullScreenControlsOverlay: {
    justifyContent: 'space-between',
    zIndex: 10,
  },
  fullScreenBottomBarWrapper: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingTop: 8,
  },
  fullScreenControlsBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  /* Speed Selector Badge & In-Player Dialog */
  speedBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  speedBadgeBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  speedBadgeBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  inPlayerSpeedBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  inPlayerSpeedCard: {
    width: 290,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  inPlayerSpeedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inPlayerSpeedTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  speedOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  speedPillOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.25)',
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    minWidth: 80,
  },
  speedPillOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  speedPillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Captions Indicator */
  captionsIndicatorWrap: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 20,
  },
  captionsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  captionsIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
