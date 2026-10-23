import React, { useState, useEffect } from 'react';
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

  // Sync instant fallback content synchronously whenever chapterNumber changes
  useEffect(() => {
    setQuickContent(SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || '');
    setDetailedContent(SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || '');
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

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [chapterNumber, subjectId, persona, studyMode]);

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
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. CHAPTER HEADING ROW WITH SAVE BUTTON */}
        <View style={styles.guideIntroduction}>
          <View style={styles.guideTitleRow}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.chapterBadgePill, { backgroundColor: toggleBg, borderColor: cardBorder }]}>
                <Text style={[styles.chapterBadgeText, { color: emeraldPrimary }]}>
                  Ch {chapterNumber}
                </Text>
              </View>
              <Text style={[styles.guideTitle, { color: textColor, flex: 1 }]} numberOfLines={1}>
                {effectiveChapterTitle}
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
                size={19}
                color={isBookmarked ? emeraldPrimary : textColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. COMPACT READING DEPTH SELECTOR + READ ALOUD (BESIDE TOGGLE) */}
        <View style={styles.readingDepthRow}>
          <View style={[styles.depthSelector, { backgroundColor: toggleBg }]}>
            {/* Essentials Pill */}
            <TouchableOpacity
              style={[
                styles.depthPill,
                studyMode === 'essentials' && [styles.depthPillActive, { backgroundColor: activeToggleBg }],
              ]}
              onPress={() => {
                if (studyMode !== 'essentials') {
                  try { Haptics.selectionAsync().catch(() => {}); } catch {}
                  setStudyMode('essentials');
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="flash"
                size={13}
                color={studyMode === 'essentials' ? '#FEFEFE' : isDark ? '#A6C5B3' : '#2D3E36'}
              />
              <Text
                style={[
                  styles.depthPillText,
                  { color: studyMode === 'essentials' ? '#FEFEFE' : isDark ? '#A6C5B3' : '#2D3E36' },
                  studyMode === 'essentials' && styles.depthPillTextActive,
                ]}
              >
                Essentials
              </Text>
            </TouchableOpacity>

            {/* In-depth Pill */}
            <TouchableOpacity
              style={[
                styles.depthPill,
                studyMode === 'in_depth' && [styles.depthPillActive, { backgroundColor: activeToggleBg }],
              ]}
              onPress={() => {
                if (studyMode !== 'in_depth') {
                  try { Haptics.selectionAsync().catch(() => {}); } catch {}
                  setStudyMode('in_depth');
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="add-circle-outline"
                size={13}
                color={studyMode === 'in_depth' ? '#FEFEFE' : isDark ? '#A6C5B3' : '#2D3E36'}
              />
              <Text
                style={[
                  styles.depthPillText,
                  { color: studyMode === 'in_depth' ? '#FEFEFE' : isDark ? '#A6C5B3' : '#2D3E36' },
                  studyMode === 'in_depth' && styles.depthPillTextActive,
                ]}
              >
                In-depth
              </Text>
            </TouchableOpacity>
          </View>

          {/* Read Aloud Beside Toggle (Icon and Time) */}
          <TouchableOpacity
            style={[
              styles.compactAudioPill,
              {
                backgroundColor: isPlayingAudio
                  ? (isDark ? '#147A43' : '#2D3E36')
                  : audioBarBg,
                borderColor: isPlayingAudio
                  ? (isDark ? '#4ADE80' : '#2D3E36')
                  : audioBorder,
              },
            ]}
            onPress={handleToggleAudio}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.75}
            accessibilityLabel="Read aloud"
          >
            <Ionicons
              name={isPlayingAudio ? 'pause' : 'headset-outline'}
              size={14}
              color={isPlayingAudio ? '#FFFFFF' : emeraldPrimary}
            />
            <Text
              style={[
                styles.compactAudioTime,
                { color: isPlayingAudio ? '#FFFFFF' : emeraldPrimary },
              ]}
            >
              {isPlayingAudio
                ? 'Playing'
                : studyMode === 'in_depth'
                ? '31:22'
                : '6:28'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. PERSONA LOGO BADGES (Logos only - Beginner, Intermediate, Advanced) */}
        <View style={styles.personaRowContainer}>
          <View style={styles.personaBadgesRow}>
            {(['beginner', 'intermediate', 'advanced'] as PersonaType[]).map((lvl) => {
              const isActive = persona === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.personaBadgeBtn,
                    {
                      backgroundColor: isActive ? (isDark ? '#1E3B2C' : '#E8F5EE') : cardBg,
                      borderColor: isActive ? emeraldPrimary : cardBorder,
                    },
                    isActive && styles.personaBadgeBtnActive,
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
                    style={styles.personaBadgeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. ESSENTIALS MODE (.studyContent) - Clean Markdown study guide without redundant static card */}
        {studyMode === 'essentials' && (
          <View style={styles.studyContent}>
            {/* Complete Chapter Matter rendered via MarkdownReader */}
            <MarkdownReader
              title={effectiveChapterTitle}
              chapterNumber={chapterNumber}
              content={quickContent || SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || ''}
            />
          </View>
        )}

        {/* 5. IN-DEPTH MODE (.guidePanel) */}
        {studyMode === 'in_depth' && (
          <View style={styles.guidePanel}>
            {/* Architectural Blueprint & Infographic Card */}
            <View style={[styles.scientificDiagram, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.figureTools}>
                <Text style={[styles.figureLabel, { color: subtextColor }]}>
                  {activeInfographic.badgeLabel} • IN-DEPTH
                </Text>
                <TouchableOpacity
                  style={styles.expandDiagram}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
                {activeInfographic.regions.map((reg, idx) => (
                  <View key={idx} style={styles.anatomicalRegion}>
                    <Text style={[styles.regionName, { color: textColor }]}>{reg.label}</Text>
                    <Text style={[styles.scientificName, { color: subtextColor }]}>{reg.scientific}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Complete Detailed Chapter Matter rendered via MarkdownReader */}
            <MarkdownReader
              title={effectiveChapterTitle}
              chapterNumber={chapterNumber}
              content={detailedContent || SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || ''}
            />
          </View>
        )}

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
});
