import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth, PersonaType } from '@/context/AuthContext';
import { speechService } from '@/services/speechService';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import MarkdownReader from './MarkdownReader';
import ReadAloudBar from './ReadAloudBar';
import QuickCheckCard from './QuickCheckCard';
import {
  fetchQuickCheckQuestions,
  QuickCheckQuestion,
  FALLBACK_QUICK_CHECK_BANK,
} from '@/data/quickCheckData';
import { parseMarkdownSections, StudySection } from '@/utils/sectionParser';
import { fetchQuickStudyGuide, fetchDetailedNotes, GCS_API_BASE } from '@/services/contentService';
import { SAMPLE_STUDY_CONTENT } from '@/data/sampleStudyContent';
import StudyGuideReaderTablet from './StudyGuideReader.tablet';

const { width, height } = Dimensions.get('window');

// Persona Tier Icons:
// Beginner: 1 Book with glowing rays
// Intermediate: 2 Books with bookmark & rays
// Advanced: 3 Books with gold star
const PERSONA_ICONS: Record<PersonaType, any> = {
  beginner: require('@/assets/images/personas/persona_beginner.png'),
  intermediate: require('@/assets/images/personas/persona_intermediate.png'),
  advanced: require('@/assets/images/personas/persona_advanced.png'),
};


interface StudyGuideReaderProps {
  chapterNumber?: number;
  chapterTitle?: string;
  subjectName?: string;
  subjectId?: string;
  onBackPress?: () => void;
  onBookmarkPress?: () => void;
  onOpenListen?: (mode: 'quick' | 'detailed') => void;
  onCompleteReading?: (mode: 'essentials' | 'in_depth') => void;
}

const GLOSSARY_TERMS: Record<string, { term: string; definition: string; examTip: string }> = {
  'alimentary canal': {
    term: 'Alimentary Canal (Gut)',
    definition: 'A continuous muscular tube extending from the mouth to the anus, differentiated into three distinct embryological chambers: foregut, midgut, and hindgut.',
    examTip: 'Core 5-mark question in ANGRAU exams. State embryonic germ layer origins (ectoderm vs endoderm).',
  },
  'proctodaeum': {
    term: 'Proctodaeum (Hindgut)',
    definition: 'The posterior section of the alimentary canal of ectodermal origin, lined with shed cuticular intima, subdivided into ileum, colon, and rectum.',
    examTip: 'Primary site of water and salt reabsorption via 6 rectal pads. Prevents fatal desiccation.',
  },
  'cuticular intima': {
    term: 'Cuticular Intima',
    definition: 'An impermeable chitin-protein layer lining the foregut and hindgut, derived from ectoderm and shed during ecdysis (molting).',
    examTip: 'Protects tissue from coarse abrasive plant fibers. Strictly absent in the midgut.',
  },
  'endoderm': {
    term: 'Endoderm',
    definition: 'The innermost primary germ layer in insect embryogenesis that gives rise specifically to the midgut (mesenteron) epithelial lining.',
    examTip: 'Crucial distinction: only midgut is endodermal; foregut and hindgut are ectodermal.',
  },
  'foregut': {
    term: 'Foregut (Stomodaeum)',
    definition: 'The anterior region of the digestive tract consisting of pharynx, esophagus, crop, and proventriculus (gizzard).',
    examTip: 'Responsible for ingestion, temporary food storage, and mechanical maceration.',
  },
  'midgut': {
    term: 'Midgut (Mesenteron / Ventriculus)',
    definition: 'The central digestive and absorptive chamber lined with columnar epithelial cells and gastric caeca, lacking cuticular intima.',
    examTip: 'Site of primary chemical enzyme digestion and microvillar nutrient absorption.',
  },
  'hindgut': {
    term: 'Hindgut (Proctodaeum)',
    definition: 'The posterior gut consisting of ileum, colon, and rectum, receiving Malpighian tubules at its anterior boundary.',
    examTip: 'Key function: osmoregulation, feces packaging, and water reabsorption.',
  },
  'ectoderm': {
    term: 'Ectoderm',
    definition: 'The outermost embryonic germ layer that invaginates at the stomodaeum and proctodaeum to produce the cuticular lining.',
    examTip: 'Explains why the foregut and hindgut must shed their cuticular lining during each molt.',
  },
  'mesenteron': {
    term: 'Mesenteron (Midgut)',
    definition: 'The midsection of the digestive tract derived from endoderm, dedicated to enzymatic hydrolysis and cellular absorption.',
    examTip: 'Key landmark: marked anteriorly by gastric caeca and posteriorly by Malpighian tubules.',
  },
};

interface ChapterInfographic {
  title: string;
  subtitle: string;
  badgeLabel: string;
  remoteUri?: string;
  imageSource: any;
  regions: { label: string; scientific: string }[];
}

interface ChapterModeInfographics {
  essentials: ChapterInfographic;
  in_depth: ChapterInfographic;
}

const CHAPTER_INFOGRAPHICS: Record<number, ChapterModeInfographics> = {
  1: {
    essentials: {
      title: 'Alimentary Canal Tripartite Blueprint',
      subtitle: 'Foregut • Midgut • Hindgut',
      badgeLabel: 'ALIMENTARY CANAL',
      remoteUri: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/media/hero.png`,
      imageSource: require('../../../assets/images/infographics/insect_digestive_system_blueprint.png'),
      regions: [
        { label: 'Foregut', scientific: 'Stomodaeum (Ingestion & Mastication)' },
        { label: 'Midgut', scientific: 'Mesenteron (Enzymatic Absorption)' },
        { label: 'Hindgut', scientific: 'Proctodaeum (Osmoregulation & Excretion)' },
      ],
    },
    in_depth: {
      title: 'Midgut Histology & Cellular Labor Architecture',
      subtitle: 'Columnar Cells • Nidi • Peritrophic Membrane',
      badgeLabel: 'GUT HISTOLOGY BLUEPRINT',
      remoteUri: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20(Mesenteron)/The_Insect_Midgut_Biological_Engine.png`,
      imageSource: require('../../../assets/images/infographics/digestive_system_mindmap.jpg'),
      regions: [
        { label: 'Columnar Epithelium', scientific: 'Active Hydrolysis & Microvillar Absorption' },
        { label: 'Peritrophic Envelope', scientific: 'Chitin-Protein Food Abrasion & Pathogen Shield' },
        { label: 'Malpighian Complex', scientific: 'Cryptonephridial Osmoregulation & Uric Acid' },
      ],
    },
  },
  2: {
    essentials: {
      title: 'Metamorphosis Life Cycles & Developmental Stages',
      subtitle: 'Ametabola • Hemimetabola • Holometabola',
      badgeLabel: 'METAMORPHOSIS BLUEPRINT',
      remoteUri: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_02/media/hero.png`,
      imageSource: require('../../../assets/images/infographics/metamorphosis_card_01.png'),
      regions: [
        { label: 'Ametabola', scientific: 'Direct (Egg → Young → Adult, Lepisma)' },
        { label: 'Hemimetabola', scientific: 'Incomplete (Egg → Nymph → Adult)' },
        { label: 'Holometabola', scientific: 'Complete (Egg → Larva → Pupa → Adult)' },
      ],
    },
    in_depth: {
      title: 'Neuroendocrine Regulation & Hormonal Balance Axis',
      subtitle: 'PTTH • Ecdysone • Juvenile Hormone Cascade',
      badgeLabel: 'ENDOCRINE AXIS BLUEPRINT',
      remoteUri: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_02/generated_infographics/advanced/infographic_card_002.png`,
      imageSource: require('../../../assets/images/infographics/metamorphosis_mindmap.png'),
      regions: [
        { label: 'Brain PTTH', scientific: 'Protocerebral Neurosecretory Activation' },
        { label: 'Prothoracic Ecdysone', scientific: 'Apolysis & Cuticular Synthesis Trigger' },
        { label: 'Corpora Allata (JH)', scientific: 'Larval Instar Retention vs Metamorphosis' },
      ],
    },
  },
  3: {
    essentials: {
      title: 'Rock Weathering & Regolith Petrogenesis',
      subtitle: 'Physical • Chemical • Biological Disintegration',
      badgeLabel: 'WEATHERING ARCHITECTURE',
      remoteUri: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_03/media/hero.png`,
      imageSource: require('../../../assets/images/infographics/weathering_regolith_blueprint.jpg'),
      regions: [
        { label: 'Physical / Mechanical', scientific: 'Frost Wedging & Thermal Exfoliation' },
        { label: 'Chemical Decomposition', scientific: 'Hydration, Hydrolysis & Oxidation' },
        { label: 'Biological Weathering', scientific: 'Plant Root Wedging & Lichen Organic Acids' },
      ],
    },
    in_depth: {
      title: 'Comprehensive Soil Profile & Weathering Mind Map',
      subtitle: 'Bedrock Saprolite • Regolith Mantle • Solum Horizons',
      badgeLabel: 'PEDOGENESIS & SOIL PROFILE',
      remoteUri: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_03/media/hero.png`,
      imageSource: require('../../../assets/images/infographics/weathering_mindmap.png'),
      regions: [
        { label: 'Horizon Differentiation', scientific: 'Topsoil (O/A) to Subsoil (B) & Saprolite' },
        { label: 'Mineral Transformation', scientific: 'Secondary Clay Mineral Genesis & Solum' },
        { label: 'Thermal Kinetics', scientific: "Van 't Hoff Rule (Q₁₀ ≈ 2) & Degree-Days" },
      ],
    },
  },
  4: {
    essentials: {
      title: 'Floral Reproductive Anatomy & Pollination Process',
      subtitle: 'Stamen Locules • Anther Dehiscence • Honey Bee Vectors',
      badgeLabel: 'FLORAL POLLINATION BLUEPRINT',
      remoteUri: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_04/media/hero.png`,
      imageSource: require('../../../assets/images/infographics/floral_pollination_blueprint.jpg'),
      regions: [
        { label: 'Stamen & Anther', scientific: '4 Microsporangial Locules & Pollen Dehiscence' },
        { label: 'Insect Vector', scientific: 'Apis mellifera Honey Bee Pollen Transfer' },
        { label: 'Gynoecium & Pistil', scientific: 'Stigma, Style & Double Fertilization' },
      ],
    },
    in_depth: {
      title: 'Entomophilous Pollination Ecology & Agro-Ecosystems',
      subtitle: 'Floral Adaptations • Vector Ecology • Yield Thresholds',
      badgeLabel: 'POLLINATION ECOLOGY',
      remoteUri: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_04/media/hero.png`,
      imageSource: require('../../../assets/images/infographics/chapter-pollination-hero.png'),
      regions: [
        { label: 'Entomophily', scientific: 'Melittophily, Nectar Rewards & Floral Guides' },
        { label: 'Pollen Transport', scientific: 'Corbicula (Pollen Basket) Loading Dynamics' },
        { label: 'Economic Threshold', scientific: 'Fruit Set Maximization & Optimal Bee Densities' },
      ],
    },
  },
};

export function getActiveInfographic(
  chapterNumber: number | string | undefined,
  chapterTitle: string | undefined,
  mode: 'essentials' | 'in_depth'
): ChapterInfographic {
  let chNum = Number(chapterNumber);

  // If a valid chapter number between 1 and 4 is provided, prioritize it directly!
  if (chNum >= 1 && chNum <= 4) {
    const modeKey = mode === 'in_depth' ? 'in_depth' : 'essentials';
    const config = CHAPTER_INFOGRAPHICS[chNum] || CHAPTER_INFOGRAPHICS[1];
    return config[modeKey];
  }

  // Fallback to topic keyword matching if chapterNumber is missing or not 1-4
  const lowerTitle = (chapterTitle || '').toLowerCase();
  if (lowerTitle.includes('weather') || lowerTitle.includes('regolith') || lowerTitle.includes('soil') || lowerTitle.includes('petrogenesis')) {
    chNum = 3;
  } else if (lowerTitle.includes('pollin') || lowerTitle.includes('floral') || lowerTitle.includes('flower') || lowerTitle.includes('stamen')) {
    chNum = 4;
  } else if (lowerTitle.includes('metamorph') || lowerTitle.includes('diapause') || lowerTitle.includes('morphogen')) {
    chNum = 2;
  } else if (lowerTitle.includes('digest') || lowerTitle.includes('alimentary') || lowerTitle.includes('foregut') || lowerTitle.includes('anatomy')) {
    chNum = 1;
  } else {
    chNum = 1;
  }

  const modeKey = mode === 'in_depth' ? 'in_depth' : 'essentials';
  const config = CHAPTER_INFOGRAPHICS[chNum] || CHAPTER_INFOGRAPHICS[1];
  return config[modeKey];
}

export default function StudyGuideReader({
  chapterNumber = 1,
  chapterTitle,
  subjectName = 'Entomology',
  subjectId = 'ento_131',
  onBackPress,
  onBookmarkPress,
  onOpenListen,
  onCompleteReading,
}: StudyGuideReaderProps) {
  const { isDark } = useAppTheme();
  const { persona, updatePersona } = useAuth();
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

  if (isTablet) {
    return (
      <StudyGuideReaderTablet
        chapterNumber={chapterNumber}
        chapterTitle={effectiveChapterTitle}
        subjectName={subjectName}
        subjectId={subjectId}
        onBackPress={onBackPress}
        onBookmarkPress={onBookmarkPress}
        onOpenListen={onOpenListen}
        onCompleteReading={onCompleteReading}
      />
    );
  }

  // Mode: 'essentials' vs 'in_depth'
  const [studyMode, setStudyMode] = useState<'essentials' | 'in_depth'>('essentials');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDiagramZoomed, setIsDiagramZoomed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeGlossaryKey, setActiveGlossaryKey] = useState<string | null>(null);

  // Robust mode-specific and chapter-specific infographic resolver
  const activeInfographic = getActiveInfographic(chapterNumber, effectiveChapterTitle, studyMode);

  // Dynamic remote image fallback handler
  const [remoteImageFailed, setRemoteImageFailed] = useState(false);
  useEffect(() => {
    setRemoteImageFailed(false);
  }, [chapterNumber, studyMode]);

  const infographicSource =
    !remoteImageFailed && activeInfographic.remoteUri
      ? { uri: activeInfographic.remoteUri }
      : activeInfographic.imageSource;

  // Dynamic Content for the selected chapter
  const [quickContent, setQuickContent] = useState<string>(
    SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || ''
  );
  const [detailedContent, setDetailedContent] = useState<string>(
    SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || ''
  );

  const scrollViewRef = useRef<ScrollView>(null);
  const [quickCheckQuestions, setQuickCheckQuestions] = useState<QuickCheckQuestion[]>(() =>
    FALLBACK_QUICK_CHECK_BANK[chapterNumber] || FALLBACK_QUICK_CHECK_BANK[1] || []
  );
  const [completedQuickChecks, setCompletedQuickChecks] = useState<Set<number>>(new Set());
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [sectionLayouts, setSectionLayouts] = useState<Record<number, number>>({});

  // Sync instant fallback content synchronously whenever chapterNumber changes
  useEffect(() => {
    setQuickContent(SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || '');
    setDetailedContent(SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || '');
    setQuickCheckQuestions(
      FALLBACK_QUICK_CHECK_BANK[chapterNumber] || FALLBACK_QUICK_CHECK_BANK[1] || []
    );
    setCompletedQuickChecks(new Set());
  }, [chapterNumber]);

  // Fast mode-specific fetch: avoids downloading 5MB detailed notes on initial mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (studyMode === 'essentials') {
      fetchQuickStudyGuide(subjectId, chapterNumber, persona, controller.signal)
        .then((quick) => {
          if (isMounted && quick && quick.trim().length > 50) setQuickContent(quick);
        })
        .catch(() => {});
    } else {
      fetchDetailedNotes(subjectId, chapterNumber, persona, controller.signal)
        .then((detailed) => {
          if (isMounted && detailed && detailed.trim().length > 50) setDetailedContent(detailed);
        })
        .catch(() => {});
    }

    const track = studyMode === 'in_depth' ? 'detailed' : 'quick';
    fetchQuickCheckQuestions(chapterNumber, track, persona, controller.signal)
      .then((questions) => {
        if (isMounted && questions && questions.length > 0) {
          setQuickCheckQuestions(questions);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [chapterNumber, subjectId, persona, studyMode]);

  const activeRawContent =
    studyMode === 'essentials'
      ? quickContent || SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || ''
      : detailedContent || SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || '';

  const sections = useMemo(() => {
    return parseMarkdownSections(activeRawContent, quickCheckQuestions, chapterNumber);
  }, [activeRawContent, quickCheckQuestions, chapterNumber]);

  const totalSections = sections.length;
  const totalReadingMinutes = useMemo(() => {
    return sections.reduce((acc, s) => acc + s.readTimeMinutes, 0) || 10;
  }, [sections]);
  const chapterProgressPercent = Math.min(
    100,
    Math.round((completedQuickChecks.size / Math.max(1, totalSections)) * 100)
  );

  const [isReadingGuideOpen, setIsReadingGuideOpen] = useState(true);
  const [quickCheckLayouts, setQuickCheckLayouts] = useState<Record<number, number>>({});

  const handleScrollToSection = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < sections.length) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
      setActiveSectionIndex(targetIndex);
      const targetY = sectionLayouts[targetIndex];
      if (typeof targetY === 'number') {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY - 15), animated: true });
      }
    }
  };

  const handleScrollToQuickCheck = (secIdx: number) => {
    if (secIdx >= 0 && secIdx < sections.length) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
      setActiveSectionIndex(secIdx);
      const targetY = quickCheckLayouts[secIdx] ?? sectionLayouts[secIdx];
      if (typeof targetY === 'number') {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY - 40), animated: true });
      }
    }
  };

  const handleQcAnswer = (sectionNumber: number, isCorrect: boolean) => {
    if (isCorrect) {
      setCompletedQuickChecks((prev) => {
        const next = new Set(prev);
        next.add(sectionNumber);
        return next;
      });
    }
  };

  const [showReadAloudBar, setShowReadAloudBar] = useState(false);

  useEffect(() => {
    const unsub = speechService.subscribe((speaking) => {
      setIsPlayingAudio(speaking);
      if (speaking) {
        setShowReadAloudBar(true);
      }
    });
    return () => {
      unsub();
      speechService.stop();
    };
  }, []);

  const handleToggleBookmark = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch {}
    setIsBookmarked((prev) => !prev);
    onBookmarkPress?.();
  };

  const handleToggleAudio = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
    if (isPlayingAudio) {
      await speechService.stop();
      setShowReadAloudBar(false);
    } else {
      setShowReadAloudBar(true);
      const rawText = studyMode === 'essentials' ? quickContent : detailedContent;
      const effectiveText =
        rawText ||
        (studyMode === 'essentials'
          ? SAMPLE_STUDY_CONTENT[chapterNumber]?.summary
          : SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed) ||
        `Reading Chapter ${chapterNumber}: ${effectiveChapterTitle}`;
      await speechService.speak(effectiveText, 1.0);
    }
  };

  const handleTermPress = (termKey: string) => {
    try { Haptics.selectionAsync().catch(() => {}); } catch {}
    setActiveGlossaryKey(termKey);
  };


  const insets = useSafeAreaInsets();

  // Color tokens from DevMode CSS (.readEssentials & .readInDepth)
  // Background: #f0f7f3 / #f0f7f4
  // Text: #2d3e36 / #172136
  // Pill Bg: #e3efe8, Active: #2d3e36
  const bg = isDark ? '#121E17' : '#F0F7F4';
  const cardBg = isDark ? '#1C2B23' : '#FEFEFE';
  const cardBorder = isDark ? '#2D4538' : '#CFDFD5';
  const textColor = isDark ? '#FFFFFF' : '#2D3E36';
  const inDepthTextColor = isDark ? '#E2E8F0' : '#172136';
  const subtextColor = isDark ? '#A6C5B3' : '#617269';
  const emeraldPrimary = '#147A43';
  const activeToggleBg = isDark ? '#147A43' : '#2D3E36';
  const toggleBg = isDark ? '#1E2B24' : '#E3EFE8';
  const audioBarBg = isDark ? 'rgba(20, 122, 67, 0.15)' : '#E3EFE8';
  const audioBorder = isDark ? '#2D4538' : '#CFDFD5';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          const scrollY = e.nativeEvent.contentOffset.y;
          let currentIdx = 0;
          for (let i = 0; i < sections.length; i++) {
            const layoutY = sectionLayouts[i];
            if (typeof layoutY === 'number' && scrollY >= layoutY - 140) {
              currentIdx = i;
            }
          }
          if (currentIdx !== activeSectionIndex) {
            setActiveSectionIndex(currentIdx);
          }
        }}
        scrollEventThrottle={32}
      >
        {/* 1. BREADCRUMB HEADER (Matching Web App Screenshot) */}
        <View style={styles.breadcrumbBar}>
          <View style={styles.breadcrumbLeft}>
            {onBackPress && (
              <TouchableOpacity
                onPress={onBackPress}
                style={styles.backBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={18} color={textColor} />
              </TouchableOpacity>
            )}
            <Text style={[styles.breadcrumbText, { color: subtextColor }]} numberOfLines={1}>
              {subjectName || 'Fundamentals of Entomology'} › Chapter {chapterNumber}: {effectiveChapterTitle}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={handleToggleBookmark}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
            accessibilityLabel="Save chapter"
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isBookmarked ? emeraldPrimary : textColor}
            />
          </TouchableOpacity>
        </View>

        {/* 2. PERSONA SELECTOR: ONLY LOGOS & CENTERED */}
        <View style={styles.personaCenterRow}>
          {(['beginner', 'intermediate', 'advanced'] as PersonaType[]).map((lvl) => {
            const isActive = persona === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.personaLogoBtn,
                  {
                    backgroundColor: isActive
                      ? (isDark ? '#2D2210' : '#FFFBEB')
                      : (isDark ? '#17241D' : '#FEFEFE'),
                    borderColor: isActive
                      ? '#D97706'
                      : (isDark ? '#2E4438' : '#E2E8F0'),
                  },
                  isActive && styles.personaLogoBtnActive,
                ]}
                onPress={() => {
                  if (persona !== lvl) {
                    try { Haptics.selectionAsync().catch(() => {}); } catch {}
                    updatePersona(lvl);
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.75}
                accessibilityLabel={`Persona: ${lvl}`}
              >
                <Image
                  source={PERSONA_ICONS[lvl]}
                  style={styles.personaLogoIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. ESSENTIALS & IN-DEPTH TOGGLE: CENTERED */}
        <View style={styles.depthCenterRow}>
          <View style={[styles.depthToggleCapsule, { backgroundColor: toggleBg }]}>
            <TouchableOpacity
              style={[
                styles.depthCapsuleBtn,
                studyMode === 'essentials' && [
                  styles.depthCapsuleBtnActive,
                  { backgroundColor: activeToggleBg },
                ],
              ]}
              onPress={() => {
                if (studyMode !== 'essentials') {
                  try { Haptics.selectionAsync().catch(() => {}); } catch {}
                  setStudyMode('essentials');
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="flash"
                size={13}
                color={studyMode === 'essentials' ? '#FFFFFF' : isDark ? '#A6C5B3' : '#475569'}
              />
              <Text
                style={[
                  styles.depthCapsuleText,
                  { color: studyMode === 'essentials' ? '#FFFFFF' : isDark ? '#A6C5B3' : '#475569' },
                  studyMode === 'essentials' && styles.depthCapsuleTextActive,
                ]}
              >
                Essentials
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.depthCapsuleBtn,
                studyMode === 'in_depth' && [
                  styles.depthCapsuleBtnActive,
                  { backgroundColor: activeToggleBg },
                ],
              ]}
              onPress={() => {
                if (studyMode !== 'in_depth') {
                  try { Haptics.selectionAsync().catch(() => {}); } catch {}
                  setStudyMode('in_depth');
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="book-outline"
                size={13}
                color={studyMode === 'in_depth' ? '#FFFFFF' : isDark ? '#A6C5B3' : '#475569'}
              />
              <Text
                style={[
                  styles.depthCapsuleText,
                  { color: studyMode === 'in_depth' ? '#FFFFFF' : isDark ? '#A6C5B3' : '#475569' },
                  studyMode === 'in_depth' && styles.depthCapsuleTextActive,
                ]}
              >
                In-depth
              </Text>
            </TouchableOpacity>
          </View>

          {/* Audio Circle Button Beside Centered Toggle */}
          <TouchableOpacity
            style={[
              styles.audioCircleBtn,
              isPlayingAudio && styles.audioCircleBtnActive,
            ]}
            onPress={handleToggleAudio}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
            accessibilityLabel="Toggle read aloud"
          >
            <Ionicons
              name={isPlayingAudio ? 'pause' : 'volume-high'}
              size={17}
              color={isPlayingAudio ? '#FFFFFF' : '#16A34A'}
            />
          </TouchableOpacity>
        </View>

        {/* 3. READING GUIDE PILL BUTTON */}
        <View style={styles.readingGuideTriggerWrap}>
          <TouchableOpacity
            style={styles.readingGuidePillBtn}
            onPress={() => {
              try { Haptics.selectionAsync().catch(() => {}); } catch {}
              setIsReadingGuideOpen((prev) => !prev);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.readingGuidePillText}>Reading Guide</Text>
            <Ionicons
              name={isReadingGuideOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="rgba(255, 255, 255, 0.85)"
            />
          </TouchableOpacity>
        </View>

        {/* 4. "IN THIS CHAPTER" CARD (Matching Web App Screenshot Drawer) */}
        {isReadingGuideOpen && sections.length > 0 && (
          <View style={[styles.inThisChapterCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.inThisChapterHeading, { color: subtextColor }]}>
              IN THIS CHAPTER
            </Text>

            <View style={styles.guideItemsList}>
              {sections.map((sec, sIdx) => {
                const isCurrent = activeSectionIndex === sIdx;
                const isQcDone = completedQuickChecks.has(sec.sectionNumber);

                return (
                  <View key={`guide-sec-${sec.id}-${sIdx}`} style={styles.guideItemContainer}>
                    {/* Main Section Navigation Row */}
                    <TouchableOpacity
                      style={[
                        styles.guideSectionRow,
                        isCurrent && [
                          styles.guideSectionRowActive,
                          {
                            backgroundColor: isDark ? '#2D2415' : '#FFFDF7',
                            borderColor: isDark ? '#D97706' : '#FDE68A',
                          },
                        ],
                      ]}
                      onPress={() => handleScrollToSection(sIdx)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.guideBulletWrap}>
                        {isCurrent ? (
                          <View style={styles.guideBulletActiveRing}>
                            <View style={styles.guideBulletActiveDot} />
                          </View>
                        ) : isQcDone ? (
                          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                        ) : (
                          <View
                            style={[
                              styles.guideBulletHollow,
                              { borderColor: isDark ? '#4B5563' : '#CBD5E1' },
                            ]}
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.guideSectionTitle,
                          { color: isCurrent ? (isDark ? '#FDE68A' : '#92400E') : textColor },
                          isCurrent && { fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {sec.title}
                      </Text>

                      {isCurrent && (
                        <View style={styles.youAreHereBadge}>
                          <Text style={styles.youAreHereText}>YOU ARE HERE</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Mini Sub-bullet: Quick Check */}
                    {sec.quickChecks && sec.quickChecks.length > 0 && (
                      <TouchableOpacity
                        style={styles.guideSubBulletRow}
                        onPress={() => handleScrollToQuickCheck(sIdx)}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            styles.guideSubHollowDot,
                            { borderColor: isQcDone ? '#16A34A' : subtextColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.guideSubText,
                            { color: isQcDone ? '#16A34A' : subtextColor },
                            isQcDone && { fontWeight: '600' },
                          ]}
                        >
                          {isQcDone ? '✓ Quick Check Done' : 'Quick Check'}
                        </Text>

                        {sec.subBulletBadge && (
                          <View style={styles.subPyqBadge}>
                            <Text style={styles.subPyqBadgeText}>{sec.subBulletBadge}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Chapter Progress Bar Footer */}
            <View style={[styles.guideProgressFooter, { borderTopColor: isDark ? '#2D3E36' : '#F1F5F9' }]}>
              <View style={styles.guideProgressLabels}>
                <Text style={[styles.guideProgressCaption, { color: subtextColor }]}>
                  Chapter progress
                </Text>
                <Text style={[styles.guideProgressPercentText, { color: textColor }]}>
                  {chapterProgressPercent}%
                </Text>
              </View>
              <View style={[styles.guideProgressBarTrack, { backgroundColor: isDark ? '#26382E' : '#F1F5F9' }]}>
                <View
                  style={[
                    styles.guideProgressBarFill,
                    {
                      width: `${chapterProgressPercent}%`,
                      backgroundColor: emeraldPrimary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* 5. CHAPTER OVERVIEW META LINE (Matches Web App Screenshot) */}
        <View style={styles.overviewMetaRow}>
          <View style={styles.totalReadBadge}>
            <Ionicons name="time-outline" size={13} color="#92400E" />
            <Text style={styles.totalReadText}>
              {totalReadingMinutes} min total read
            </Text>
          </View>
          <View style={styles.totalSectionsBadge}>
            <Text style={styles.totalSectionsText}>
              {totalSections} Sections
            </Text>
          </View>
        </View>

        {/* 6. SECTIONIZED READING STREAM + MASTER HERO INFOGRAPHIC */}
        <View style={styles.sectionsContainer}>
          {sections.map((sec, idx) => (
            <View
              key={`${sec.id}-${idx}`}
              onLayout={(e) => {
                const layoutY = e.nativeEvent.layout.y;
                setSectionLayouts((prev) => ({ ...prev, [idx]: layoutY }));
              }}
              style={styles.sectionBlock}
            >
              {/* Section Header Banner matching Web App Screenshot */}
              <View style={styles.sectionHeaderBanner}>
                <View style={styles.sectionMetaTop}>
                  <Text style={[styles.sectionOrderLabel, { color: isDark ? '#F59E0B' : '#B45309' }]}>
                    SECTION {sec.sectionNumber} OF {sections.length}
                  </Text>
                </View>

                <View style={styles.sectionHeadingWrap}>
                  <Text style={[styles.sectionHeadingTitle, { color: textColor }]}>
                    {sec.title}
                  </Text>
                  {sec.hasInfographic && (
                    <View style={styles.infographicTagBadge}>
                      <Text style={styles.infographicTagText}>INFOGRAPHIC</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sectionMetaRow}>
                  <View style={[styles.readTimeBadge, { backgroundColor: isDark ? '#22382B' : '#F1F5F9' }]}>
                    <Ionicons name="time-outline" size={12} color={subtextColor} />
                    <Text style={[styles.readTimeText, { color: textColor }]}>
                      {sec.readTimeMinutes} min read
                    </Text>
                  </View>

                  {sec.quickChecks && sec.quickChecks.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.quickChecksPill,
                        {
                          backgroundColor: isDark ? '#3D2A14' : '#FEF3C7',
                          borderColor: isDark ? '#B45309' : '#FDE68A',
                        },
                      ]}
                      onPress={() => handleScrollToQuickCheck(idx)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.quickChecksPillText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                        {completedQuickChecks.has(sec.sectionNumber)
                          ? '✓ Quick Check Answered'
                          : `${sec.quickChecks.length} quick check${sec.quickChecks.length > 1 ? 's' : ''}`}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {sec.examBadge && (
                    <View style={styles.examBadgePill}>
                      <Ionicons name="disc-outline" size={12} color="#BE123C" />
                      <Text style={styles.examBadgeText}>{sec.examBadge}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Section Markdown Reading Content */}
              <MarkdownReader
                title={sec.title}
                chapterNumber={chapterNumber}
                content={sec.content}
              />

              {/* Hero Infographic Card for Section 1 (always displayed in Section 1 as in web app) */}
              {idx === 0 && (
                <View style={[styles.scientificDiagram, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 16 }]}>
                  <View style={styles.figureTools}>
                    <Text style={[styles.figureLabel, { color: subtextColor }]}>
                      {activeInfographic.badgeLabel} • INFOGRAPHIC
                    </Text>
                    <TouchableOpacity
                      style={styles.expandDiagram}
                      onPress={() => {
                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
                        setIsDiagramZoomed(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.expandLabel, { color: emeraldPrimary }]}>Expand</Text>
                      <Ionicons name="expand-outline" size={13} color={emeraldPrimary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
                      setIsDiagramZoomed(true);
                    }}
                    activeOpacity={0.9}
                    style={styles.diagramTouch}
                  >
                    <ExpoImage
                      source={infographicSource}
                      onError={() => setRemoteImageFailed(true)}
                      style={styles.originalDiagramDetail}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                      priority="high"
                      transition={200}
                    />
                  </TouchableOpacity>

                  <View style={[styles.divider, { backgroundColor: cardBorder }]} />

                  <View style={styles.regionalKey}>
                    {activeInfographic.regions.map((reg, rIdx) => (
                      <View key={rIdx} style={styles.anatomicalRegion}>
                        <Text style={[styles.regionName, { color: textColor }]}>{reg.label}</Text>
                        <Text style={[styles.scientificName, { color: subtextColor }]}>{reg.scientific}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Formative Quick Check Card at the end of this Section */}
              {sec.quickChecks && sec.quickChecks.length > 0 && (
                <View
                  onLayout={(e) => {
                    const blockY = sectionLayouts[idx] || 0;
                    const cardRelativeY = e.nativeEvent.layout.y;
                    setQuickCheckLayouts((prev) => ({ ...prev, [idx]: blockY + cardRelativeY }));
                  }}
                >
                  <QuickCheckCard
                    questions={sec.quickChecks}
                    sectionNumber={sec.sectionNumber}
                    totalSections={sections.length}
                    sectionTitle={sec.shortTitle}
                    nextSectionTitle={sections[idx + 1]?.shortTitle}
                    onNextSection={
                      idx + 1 < sections.length
                        ? () => handleScrollToSection(idx + 1)
                        : undefined
                    }
                    onAnswerSubmitted={(isCorrect) => {
                      handleQcAnswer(sec.sectionNumber, isCorrect);
                    }}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Dynamic Completion Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#147A43',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 14,
            marginTop: 20,
            marginBottom: 40,
            gap: 8,
            shadowColor: '#147A43',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 3,
          }}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onCompleteReading?.(studyMode);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
            Mark Chapter Notes as Completed
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom-Right "Next: Section [N+1] →" Button (Matching Web App Screenshot) */}
      {activeSectionIndex + 1 < sections.length && (
        <TouchableOpacity
          style={styles.floatingNextBtn}
          onPress={() => handleScrollToSection(activeSectionIndex + 1)}
          activeOpacity={0.88}
        >
          <Text style={styles.floatingNextBtnText}>
            Next: Section {activeSectionIndex + 2} →
          </Text>
        </TouchableOpacity>
      )}

      {/* 6. FULL-SCREEN INTERACTIVE DIAGRAM MODAL (Never mounted in background) */}
      {isDiagramZoomed && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDiagramZoomed(false)}
        >
          <TouchableOpacity
            style={styles.zoomModalBackdrop}
            activeOpacity={1}
            onPress={() => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch {}
              setIsDiagramZoomed(false);
            }}
          >
            <View style={styles.zoomHeader}>
              <View>
                <Text style={styles.zoomTitle}>{activeInfographic.title}</Text>
                <Text style={styles.zoomSubtitle}>{activeInfographic.subtitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.zoomCloseBtn}
                onPress={() => setIsDiagramZoomed(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.zoomImgWrap}>
              <ExpoImage
                source={infographicSource}
                style={styles.zoomedImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
              />
            </View>

            <View style={styles.shrinkPill}>
              <Ionicons name="contract-outline" size={15} color="#FFFFFF" />
              <Text style={styles.shrinkPillText}>Tap anywhere to shrink</Text>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 7. CLICKABLE GLOSSARY DEFINITION MODAL (Never mounted in background) */}
      {activeGlossaryKey !== null && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveGlossaryKey(null)}
        >
          <TouchableOpacity
            style={styles.glossaryBackdrop}
            activeOpacity={1}
            onPress={() => setActiveGlossaryKey(null)}
          >
            <View
              style={[styles.glossaryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              {activeGlossaryKey && GLOSSARY_TERMS[activeGlossaryKey] && (
                <>
                  <View style={styles.glossaryHeader}>
                    <Ionicons name="book" size={18} color="#16a34a" />
                    <Text style={[styles.glossaryTermText, { color: textColor }]}>
                      {GLOSSARY_TERMS[activeGlossaryKey].term}
                    </Text>
                  </View>

                  <Text style={[styles.glossaryDefText, { color: isDark ? '#D8E5DC' : '#2D3E36' }]}>
                    {GLOSSARY_TERMS[activeGlossaryKey].definition}
                  </Text>

                  <View style={styles.examTipBox}>
                    <Ionicons name="school-outline" size={15} color="#16a34a" />
                    <Text style={styles.examTipText}>
                      {GLOSSARY_TERMS[activeGlossaryKey].examTip}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.glossaryCloseBtn, { backgroundColor: isDark ? '#2E4438' : '#203328' }]}
                    onPress={() => setActiveGlossaryKey(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.glossaryCloseText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 8. FLOATING READ ALOUD / VOICE OVER BAR */}
      {showReadAloudBar && (
        <View style={{ position: 'absolute', bottom: insets.bottom + 8, left: 0, right: 0, zIndex: 100 }}>
          <ReadAloudBar
            title={`Ch ${chapterNumber} · ${studyMode === 'essentials' ? 'Essentials' : 'In-depth'}`}
            content={
              studyMode === 'essentials'
                ? quickContent || SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || ''
                : detailedContent || SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || ''
            }
            onClose={() => {
              setShowReadAloudBar(false);
              speechService.stop();
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  backToChapter: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  guideIntroduction: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chapter: {
    fontSize: 12,
    lineHeight: 18,
  },
  guideType: {
    fontSize: 11,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  guideTitle: {
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
    fontWeight: '700',
  },
  guideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  chapterBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  chapterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* In-depth Header (.chapterBreadcrumbParent, .frameParent, .readAloud) */
  inDepthHeader: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 0.7,
    alignItems: 'center',
    gap: 12,
  },
  chapterBreadcrumb: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  frameParent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadge: {
    width: 41,
    height: 41,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#2D3E36',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupBadgeActive: {
    transform: [{ scale: 1.05 }],
    borderColor: '#147A43',
    borderWidth: 1.5,
  },
  personaBadgeImage: {
    width: 29,
    height: 29,
  },
  readingDepthRow: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personaRowContainer: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  personaBadgeBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  personaBadgeBtnActive: {
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#147A43',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    transform: [{ scale: 1.06 }],
  },
  personaBadgeIcon: {
    width: 30,
    height: 30,
  },
  depthSelector: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    borderRadius: 100,
    padding: 3,
    gap: 4,
  },
  compactAudioPill: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    gap: 5,
  },
  compactAudioTime: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  depthPill: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    gap: 5,
  },
  depthPillActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  depthPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  depthPillTextActive: {
    fontWeight: '600',
  },
  /* Essentials (.studyContent) */
  studyContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionMarker: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionMarkerNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 19,
    letterSpacing: -0.2,
    lineHeight: 25,
    fontWeight: '700',
  },
  explanation: {
    fontSize: 15,
    lineHeight: 25,
  },
  foregutStomodaeum: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  scientificDiagram: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  figureTools: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  figureLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expandDiagram: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  diagramTouch: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  originalDiagramDetail: {
    width: '100%',
    height: '100%',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  regionalKey: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  anatomicalRegion: {
    flex: 1,
    gap: 2,
  },
  regionName: {
    fontSize: 12,
    fontWeight: '600',
  },
  scientificName: {
    fontSize: 10,
  },
  readAloud: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  duration: {
    fontSize: 12,
  },
  /* In-depth Panel (.guidePanel, .readingPassages) */
  guidePanel: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 18,
  },
  inDepthGuideTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  architecturalBlueprint: {
    gap: 10,
  },
  inDepthSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  readingPassages: {
    gap: 14,
  },
  passageText: {
    fontSize: 12.5,
    lineHeight: 21,
  },
  underlinedTerm: {
    textDecorationLine: 'underline',
  },
  underlinedBoldTerm: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  boldOnlyTerm: {
    fontWeight: '700',
  },
  /* Zoom Modal */
  zoomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 14, 0.94)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'android' ? 36 : 48,
    paddingHorizontal: 16,
  },
  zoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  zoomTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  zoomSubtitle: {
    color: '#A6C5B3',
    fontSize: 12,
    marginTop: 2,
  },
  zoomCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImgWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  zoomedImage: {
    width: width * 0.94,
    height: height * 0.72,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  shrinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shrinkPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  /* Glossary Modal */
  glossaryBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glossaryCard: {
    width: '100%',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  glossaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glossaryTermText: {
    fontSize: 17,
    fontWeight: '700',
  },
  glossaryDefText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  examTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  examTipText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#16a34a',
    fontWeight: '600',
  },
  glossaryCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  glossaryCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  /* Breadcrumb Header */
  breadcrumbBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  breadcrumbLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 2,
  },
  breadcrumbText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  /* Persona Selector (Centered, Logos Only) */
  personaCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  personaLogoBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  personaLogoBtnActive: {
    borderWidth: 2,
    borderColor: '#D97706',
    elevation: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    transform: [{ scale: 1.05 }],
  },
  personaLogoIcon: {
    width: 32,
    height: 32,
  },
  /* Reading Depth Toggle (Centered) */
  depthCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 4,
  },
  depthToggleCapsule: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 3,
    gap: 4,
    alignItems: 'center',
  },
  depthCapsuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 5,
  },
  depthCapsuleBtnActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  depthCapsuleText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  depthCapsuleTextActive: {
    fontWeight: '700',
  },
  audioCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  audioCircleBtnActive: {
    backgroundColor: '#16A34A',
  },
  /* Reading Guide Pill */
  readingGuideTriggerWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  readingGuidePillBtn: {
    backgroundColor: '#24332C',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  readingGuidePillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  /* In This Chapter Card */
  inThisChapterCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  inThisChapterHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  guideItemsList: {
    gap: 6,
  },
  guideItemContainer: {
    gap: 3,
  },
  guideSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  guideSectionRowActive: {
    borderWidth: 1.5,
  },
  guideBulletWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBulletActiveRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBulletActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D97706',
  },
  guideBulletHollow: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  guideSectionTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  youAreHereBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  youAreHereText: {
    color: '#B45309',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  guideSubBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 36,
    paddingVertical: 3,
    gap: 6,
  },
  guideSubHollowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.2,
  },
  guideSubText: {
    fontSize: 11,
    fontWeight: '500',
  },
  subPyqBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subPyqBadgeText: {
    color: '#BE123C',
    fontSize: 9.5,
    fontWeight: '700',
  },
  guideProgressFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  guideProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideProgressCaption: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  guideProgressPercentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  guideProgressBarTrack: {
    height: 5,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  guideProgressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  /* Overview Meta Row */
  overviewMetaRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalReadBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  totalReadText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  totalSectionsBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  totalSectionsText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  /* Section Header Banner */
  sectionsContainer: {
    gap: 12,
    paddingHorizontal: 16,
  },
  sectionBlock: {
    marginBottom: 6,
  },
  sectionHeaderBanner: {
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
    marginBottom: 10,
    gap: 6,
  },
  sectionMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionOrderLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionHeadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionHeadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginTop: 2,
    flex: 1,
  },
  infographicTagBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  infographicTagText: {
    color: '#C2410C',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  readTimeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  quickChecksPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickChecksPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  examBadgePill: {
    backgroundColor: '#FFE4E6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  examBadgeText: {
    color: '#BE123C',
    fontSize: 11,
    fontWeight: '700',
  },
  /* Floating Next Section Button */
  floatingNextBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#D97706',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    elevation: 6,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 99,
  },
  floatingNextBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
