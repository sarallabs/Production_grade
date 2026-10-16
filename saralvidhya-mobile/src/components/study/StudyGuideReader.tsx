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
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth, PersonaType } from '@/context/AuthContext';
import { speechService } from '@/services/speechService';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const { width, height } = Dimensions.get('window');

// 1. Beginner Tier Icon: Single green book with bookmark ribbon
function BeginnerBookIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x="5" y="8" width="22" height="18" rx="2.5" fill="#3D6852" />
      <Rect x="7" y="10" width="18" height="14" rx="1.5" fill="#FAF6EE" />
      <Rect x="5" y="8" width="4" height="18" rx="1.5" fill="#254333" />
      <Path d="M14 8V16L16.5 14L19 16V8H14Z" fill="#F59E0B" />
      <Path d="M11 13H13M11 16H13M11 19H17" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
    </Svg>
  );
}

// 2. Intermediate Tier Icon: Stack of 2 green books with sparkles
function IntermediateBookIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x="4" y="17" width="22" height="9" rx="2" fill="#2A4B3A" />
      <Rect x="6" y="19" width="19" height="5" rx="1" fill="#F1ECE1" />
      <Rect x="4" y="17" width="3.5" height="9" rx="1" fill="#1C3527" />

      <Rect x="6" y="9" width="20" height="9" rx="2" fill="#3D6852" />
      <Rect x="8" y="11" width="17" height="5" rx="1" fill="#FAF6EE" />
      <Rect x="6" y="9" width="3.5" height="9" rx="1" fill="#254333" />

      <Path d="M26 4L26.8 6.2L29 7L26.8 7.8L26 10L25.2 7.8L23 7L25.2 6.2L26 4Z" fill="#22C55E" />
      <Path d="M3 8L3.5 9.5L5 10L3.5 10.5L3 12L2.5 10.5L1 10L2.5 9.5L3 8Z" fill="#86EFAC" />
    </Svg>
  );
}

// 3. Advanced Tier Icon: Stacked books with gold crown
function AdvancedBookIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x="4" y="20" width="24" height="8" rx="2" fill="#20382B" />
      <Rect x="6" y="22" width="20" height="4" rx="1" fill="#ECE7DC" />
      <Rect x="5" y="14" width="22" height="7" rx="2" fill="#2E523F" />
      <Rect x="7" y="16" width="18" height="3.5" rx="1" fill="#F7F3EB" />
      <Rect x="6" y="8" width="20" height="6.5" rx="2" fill="#3D6852" />

      <Path
        d="M10 9L11.5 3.5L14 6.5L16 2L18 6.5L20.5 3.5L22 9H10Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="0.8"
      />
      <Circle cx="11.5" cy="4" r="0.9" fill="#EF4444" />
      <Circle cx="16" cy="2.5" r="1.1" fill="#3B82F6" />
      <Circle cx="20.5" cy="4" r="0.9" fill="#10B981" />
    </Svg>
  );
}


interface StudyGuideReaderProps {
  chapterNumber?: number;
  chapterTitle?: string;
  subjectName?: string;
  onBackPress?: () => void;
  onBookmarkPress?: () => void;
  onChapterPress?: () => void;
  onOpenListen?: (mode: 'quick' | 'detailed') => void;
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

const INFOGRAPHIC_URL =
  'https://saralvidhya-api-193782571555.asia-south1.run.app/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/Insect_Digestive_System_Blueprint.png';

export default function StudyGuideReader({
  chapterNumber = 1,
  chapterTitle = 'Insect Digestive System & Anatomy',
  subjectName = 'Entomology',
  onBackPress,
  onBookmarkPress,
  onChapterPress,
  onOpenListen,
}: StudyGuideReaderProps) {
  const { isDark } = useAppTheme();
  const { persona, updatePersona } = useAuth();
  const { isTablet } = useDeviceLayout();

  // Mode: 'essentials' vs 'in_depth'
  const [studyMode, setStudyMode] = useState<'essentials' | 'in_depth'>('essentials');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDiagramZoomed, setIsDiagramZoomed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeGlossaryKey, setActiveGlossaryKey] = useState<string | null>(null);

  useEffect(() => {
    const unsub = speechService.subscribe((speaking) => {
      setIsPlayingAudio(speaking);
    });
    return () => {
      unsub();
      speechService.stop();
    };
  }, []);

  const handleToggleBookmark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsBookmarked((prev) => !prev);
    onBookmarkPress?.();
  };

  const handleToggleAudio = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onOpenListen) {
      onOpenListen(studyMode === 'essentials' ? 'quick' : 'detailed');
      return;
    }
    if (isPlayingAudio) {
      await speechService.stop();
    } else {
      const textToSpeak =
        studyMode === 'essentials'
          ? 'The insect alimentary canal is a specialized muscular tube extending from the mouth to the anus. It is divided into three distinct anatomical chambers: the Foregut, Midgut, and Hindgut. This division reflects fundamental embryonic origins that govern how food is processed and eliminated.'
          : 'Detailed Study Guide: Insect Digestive System. Architectural Blueprint and Division of Labor in the Insect Gut. The insect alimentary canal is one of the most remarkable evolutionary adaptations in the animal kingdom. Rather than functioning as a uniform, undifferentiated tube, the digestive tract operates as a highly coordinated biological assembly line.';
      await speechService.speak(textToSpeak, 1.0);
    }
  };

  const handleTermPress = (termKey: string) => {
    Haptics.selectionAsync();
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
      {/* 1. APP BAR (.appBar: height 56px, padding 0 24px) */}
      <View style={[styles.appBar, { backgroundColor: bg }]}>
        <TouchableOpacity
          style={[styles.backToChapter, { backgroundColor: cardBg, borderColor: cardBorder }]}
          onPress={onBackPress}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onChapterPress} activeOpacity={0.7}>
          <Text style={[styles.subject, { color: textColor }]}>
            {subjectName}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backToChapter, { backgroundColor: cardBg, borderColor: cardBorder }]}
          onPress={handleToggleBookmark}
          activeOpacity={0.8}
          accessibilityLabel="Bookmark this chapter"
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isBookmarked ? emeraldPrimary : textColor}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. MODE SPECIFIC HEADER */}
        {studyMode === 'essentials' ? (
          /* Essentials Header (.guideIntroduction) */
          <View style={styles.guideIntroduction}>
            <TouchableOpacity
              onPress={onChapterPress}
              disabled={!onChapterPress}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={[styles.chapter, { color: subtextColor }]}>
                Chapter {chapterNumber}: {chapterTitle}
              </Text>
              {onChapterPress && <Ionicons name="chevron-down" size={13} color={emeraldPrimary} />}
            </TouchableOpacity>

            <Text style={[styles.guideType, { color: emeraldPrimary }]}>
              QUICK STUDY GUIDE
            </Text>

            <Text style={[styles.guideTitle, { color: textColor }]}>
              Insect Digestive System
            </Text>
          </View>
        ) : (
          /* In-depth Header (.chapterBreadcrumbParent & .frameParent & .readAloud) */
          <View style={[styles.inDepthHeader, { borderBottomColor: isDark ? '#2D4538' : '#C6EBDC' }]}>
            <TouchableOpacity
              onPress={onChapterPress}
              disabled={!onChapterPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.chapterBreadcrumb, { color: textColor }]}>
                {subjectName} - Chapter {chapterNumber}: {chapterTitle}
              </Text>
            </TouchableOpacity>

            {/* 3 Persona / Tier Level Badges (.frameParent: 41x41px each, 4px radius, subtle shadow) */}
            <View style={styles.frameParent}>
              {(['beginner', 'intermediate', 'advanced'] as PersonaType[]).map((lvl) => {
                const isActive = persona === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.groupBadge,
                      { backgroundColor: cardBg, borderColor: isActive ? emeraldPrimary : cardBorder },
                      isActive && styles.groupBadgeActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updatePersona(lvl);
                    }}
                    activeOpacity={0.8}
                  >
                    {lvl === 'beginner' ? (
                      <BeginnerBookIcon size={26} />
                    ) : lvl === 'intermediate' ? (
                      <IntermediateBookIcon size={26} />
                    ) : (
                      <AdvancedBookIcon size={26} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Read Aloud Pill (.readAloud: height 26px, #ecf6f1 bg, #55bf7a border, #12833e text) */}
            <TouchableOpacity
              style={[
                styles.readAloudInDepth,
                {
                  backgroundColor: isDark ? 'rgba(20, 122, 67, 0.15)' : '#ECF6F1',
                  borderColor: isDark ? '#147A43' : '#55BF7A',
                },
              ]}
              onPress={handleToggleAudio}
              activeOpacity={0.8}
            >
              <Ionicons name="headset-outline" size={11} color={isDark ? '#4ADE80' : '#12833E'} />
              <Text style={[styles.labelAndDuration, { color: isDark ? '#4ADE80' : '#12833E' }]}>
                {isPlayingAudio ? 'Speaking...' : 'Read Aloud · 31:22'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. READING DEPTH SELECTOR (.readingDepth & .depthSelector) */}
        <View style={styles.readingDepth}>
          <View style={[styles.depthSelector, { backgroundColor: toggleBg }]}>
            {/* Essentials Pill */}
            <TouchableOpacity
              style={[
                styles.depthPill,
                studyMode === 'essentials' && [styles.depthPillActive, { backgroundColor: activeToggleBg }],
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setStudyMode('essentials');
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="flash"
                size={15}
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
                Haptics.selectionAsync();
                setStudyMode('in_depth');
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add-circle-outline"
                size={15}
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
        </View>

        {/* 4. ESSENTIALS MODE (.studyContent) */}
        {studyMode === 'essentials' && (
          <View style={styles.studyContent}>
            {/* Section Heading (.sectionHeading) */}
            <View style={styles.sectionHeading}>
              <View style={[styles.sectionMarker, { backgroundColor: toggleBg }]}>
                <Text style={[styles.sectionMarkerNumber, { color: emeraldPrimary }]}>1</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Architectural Blueprint & Regional Partitioning
              </Text>
            </View>

            {/* Explanation (.explanation) */}
            <Text style={[styles.explanation, { color: isDark ? '#D8E5DC' : '#1D2C26' }]}>
              The insect alimentary canal is a specialized muscular tube extending from the mouth to the
              anus. It is divided into three distinct anatomical chambers: the{' '}
              <Text style={styles.foregutStomodaeum}>Foregut (Stomodaeum)</Text>, the{' '}
              <Text style={styles.foregutStomodaeum}>Midgut (Mesenteron)</Text>, and the{' '}
              <Text style={styles.foregutStomodaeum}>Hindgut (Proctodaeum)</Text>. This division reflects
              fundamental embryonic origins that govern how food is processed and eliminated.
            </Text>

            {/* Scientific Diagram Card (.scientificDiagram) */}
            <View style={[styles.scientificDiagram, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Figure Tools (.figureTools) */}
              <View style={styles.figureTools}>
                <Text style={[styles.figureLabel, { color: subtextColor }]}>ALIMENTARY CANAL</Text>
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

              {/* Diagram Graphic Preview */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setIsDiagramZoomed(true);
                }}
                activeOpacity={0.9}
                style={styles.diagramTouch}
              >
                <Image
                  source={{ uri: INFOGRAPHIC_URL }}
                  style={styles.originalDiagramDetail}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Divider (.divider) */}
              <View style={[styles.divider, { backgroundColor: cardBorder }]} />

              {/* Regional Key (.regionalKey) */}
              <View style={styles.regionalKey}>
                <View style={styles.anatomicalRegion}>
                  <Text style={[styles.regionName, { color: textColor }]}>Foregut</Text>
                  <Text style={[styles.scientificName, { color: subtextColor }]}>Stomodaeum</Text>
                </View>
                <View style={styles.anatomicalRegion}>
                  <Text style={[styles.regionName, { color: textColor }]}>Midgut</Text>
                  <Text style={[styles.scientificName, { color: subtextColor }]}>Mesenteron</Text>
                </View>
                <View style={styles.anatomicalRegion}>
                  <Text style={[styles.regionName, { color: textColor }]}>Hindgut</Text>
                  <Text style={[styles.scientificName, { color: subtextColor }]}>Proctodaeum</Text>
                </View>
              </View>
            </View>

            {/* Read Aloud Audio Action Card (.readAloud) */}
            <TouchableOpacity
              style={[styles.readAloud, { backgroundColor: audioBarBg, borderColor: audioBorder }]}
              onPress={handleToggleAudio}
              activeOpacity={0.8}
            >
              <Ionicons name="headset-outline" size={20} color={emeraldPrimary} />
              <Text style={[styles.actionLabel, { color: emeraldPrimary }]}>
                {isPlayingAudio ? 'Speaking...' : 'Read Aloud'}
              </Text>
              <Text style={[styles.duration, { color: subtextColor }]}>6:28</Text>
              <Ionicons
                name={isPlayingAudio ? 'pause' : 'play-outline'}
                size={16}
                color={emeraldPrimary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* 5. IN-DEPTH MODE (.guidePanel & .readingPassages) */}
        {studyMode === 'in_depth' && (
          <View style={styles.guidePanel}>
            <Text style={[styles.inDepthGuideTitle, { color: inDepthTextColor }]}>
              Detailed Study Guide: Insect Digestive System
            </Text>

            <View style={styles.architecturalBlueprint}>
              <Text style={[styles.inDepthSectionHeading, { color: inDepthTextColor }]}>
                1. Architectural Blueprint and Division of Labor in the Insect Gut
              </Text>

              <View style={styles.readingPassages}>
                {/* Passage 1 */}
                <Text style={[styles.passageText, { color: isDark ? '#D8E5DC' : '#344155' }]}>
                  The insect{' '}
                  <Text
                    style={[styles.underlinedTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('alimentary canal')}
                  >
                    alimentary canal
                  </Text>{' '}
                  is one of the most remarkable evolutionary adaptations in the animal kingdom. Rather than
                  functioning as a uniform, undifferentiated tube, the digestive tract of an insect operates
                  as a highly coordinated biological assembly line. This internal processing system is strictly
                  compartmentalized into three primary morphological regions: the{' '}
                  <Text
                    style={[styles.underlinedBoldTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('foregut')}
                  >
                    foregut
                  </Text>{' '}
                  (stomodaeum), the{' '}
                  <Text
                    style={[styles.underlinedBoldTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('midgut')}
                  >
                    midgut
                  </Text>{' '}
                  (
                  <Text
                    style={[styles.underlinedTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('mesenteron')}
                  >
                    mesenteron
                  </Text>
                  ), and the{' '}
                  <Text
                    style={[styles.underlinedBoldTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('hindgut')}
                  >
                    hindgut
                  </Text>{' '}
                  (
                  <Text
                    style={[styles.underlinedTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('proctodaeum')}
                  >
                    proctodaeum
                  </Text>
                  ). Each region performs a non-overlapping physiological assignment, transforming raw,
                  often abrasive environmental food sources into molecular energy while conserving vital bodily
                  fluids.
                </Text>

                {/* Passage 2 */}
                <Text style={[styles.passageText, { color: isDark ? '#D8E5DC' : '#344155' }]}>
                  Understanding the insect digestive tract requires understanding where these organs come from
                  during the development of the embryo. The insect body is built around an embryonic framework
                  where different tissue layers give rise to different organ systems. The{' '}
                  <Text
                    style={[styles.underlinedTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('foregut')}
                  >
                    foregut
                  </Text>{' '}
                  and the{' '}
                  <Text
                    style={[styles.underlinedTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('hindgut')}
                  >
                    hindgut
                  </Text>{' '}
                  arise directly from the{' '}
                  <Text
                    style={[styles.boldOnlyTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('ectoderm')}
                  >
                    ectoderm
                  </Text>
                  , which is the exact same embryonic cell layer that forms the insect's outer body wall and
                  exoskeleton. Because they develop as inward folds (invaginations) of the outer body surface,
                  both the{' '}
                  <Text
                    style={[styles.underlinedTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('foregut')}
                  >
                    foregut
                  </Text>{' '}
                  and the{' '}
                  <Text
                    style={[styles.underlinedTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('hindgut')}
                  >
                    hindgut
                  </Text>{' '}
                  inherit the protective armor of the exterior cuticle. Their innermost lining is covered by a
                  specialized chitinous sheet known as the{' '}
                  <Text
                    style={[styles.underlinedBoldTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('cuticular intima')}
                  >
                    cuticular intima
                  </Text>
                  . In contrast, the central chamber—the{' '}
                  <Text
                    style={[styles.underlinedTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('midgut')}
                  >
                    midgut
                  </Text>
                  —develops from embryonic{' '}
                  <Text
                    style={[styles.boldOnlyTerm, { color: inDepthTextColor }]}
                    onPress={() => handleTermPress('endoderm')}
                  >
                    endoderm
                  </Text>
                  . The midgut never develops a cuticular lining, leaving its cellular surface naked and
                  accessible to facilitate the rapid secretion of digestive juices and the active absorption of
                  dissolved nutrients.
                </Text>
              </View>
            </View>

            <View style={{ height: 60 }} />
          </View>
        )}
      </ScrollView>


      {/* 6. FULL-SCREEN INTERACTIVE DIAGRAM MODAL */}
      <Modal
        visible={isDiagramZoomed}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDiagramZoomed(false)}
      >
        <TouchableOpacity
          style={styles.zoomModalBackdrop}
          activeOpacity={1}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsDiagramZoomed(false);
          }}
        >
          <View style={styles.zoomHeader}>
            <View>
              <Text style={styles.zoomTitle}>Alimentary Canal Tripartite Blueprint</Text>
              <Text style={styles.zoomSubtitle}>Foregut • Midgut • Hindgut</Text>
            </View>
            <TouchableOpacity
              style={styles.zoomCloseBtn}
              onPress={() => setIsDiagramZoomed(false)}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.zoomImgWrap}>
            <Image
              source={{ uri: INFOGRAPHIC_URL }}
              style={styles.zoomedImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.shrinkPill}>
            <Ionicons name="contract-outline" size={15} color="#FFFFFF" />
            <Text style={styles.shrinkPillText}>Tap anywhere to shrink</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 7. CLICKABLE GLOSSARY DEFINITION MODAL */}
      <Modal
        visible={activeGlossaryKey !== null}
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
                >
                  <Text style={styles.glossaryCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 18,
    paddingBottom: 18,
    gap: 8,
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
    fontSize: 30,
    letterSpacing: -0.6,
    lineHeight: 34,
    fontWeight: '700',
  },
  /* In-depth Header (.chapterBreadcrumbParent, .frameParent, .readAloud) */
  inDepthHeader: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
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
  readAloudInDepth: {
    height: 26,
    borderRadius: 20,
    borderWidth: 0.6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  labelAndDuration: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  readingDepth: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  depthSelector: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 4,
    gap: 4,
  },
  depthPill: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    gap: 7,
  },
  depthPillActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  depthPillText: {
    fontSize: 13,
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
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
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
