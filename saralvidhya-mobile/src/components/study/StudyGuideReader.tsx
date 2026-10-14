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
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth, PersonaType } from '@/context/AuthContext';
import { speechService } from '@/services/speechService';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const { width, height } = Dimensions.get('window');

// 1. Beginner Tier Icon: Single green book with bookmark ribbon
function BeginnerBookIcon({ size = 28 }: { size?: number }) {
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
function IntermediateBookIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x="4" y="17" width="22" height="9" rx="2" fill="#2A4B3A" />
      <Rect x="6" y="19" width="19" height="5" rx="1" fill="#F1ECE1" />
      <Rect x="4" y="17" width="3.5" height="9" rx="1" fill="#1C3527" />

      <Rect x="6" y="9" width="20" height="9" rx="2" fill="#3D6852" />
      <Rect x="8" y="11" width="17" height="5" rx="1" fill="#FAF6EE" />
      <Rect x="6" y="9" width="3.5" height="9" rx="1" fill="#254333" />

      {/* Sparkles */}
      <Path d="M26 4L26.8 6.2L29 7L26.8 7.8L26 10L25.2 7.8L23 7L25.2 6.2L26 4Z" fill="#22C55E" />
      <Path d="M3 8L3.5 9.5L5 10L3.5 10.5L3 12L2.5 10.5L1 10L2.5 9.5L3 8Z" fill="#86EFAC" />
    </Svg>
  );
}

// 3. Advanced Tier Icon: Stacked books with gold crown
function AdvancedBookIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x="4" y="20" width="24" height="8" rx="2" fill="#20382B" />
      <Rect x="6" y="22" width="20" height="4" rx="1" fill="#ECE7DC" />
      <Rect x="5" y="14" width="22" height="7" rx="2" fill="#2E523F" />
      <Rect x="7" y="16" width="18" height="3.5" rx="1" fill="#F7F3EB" />
      <Rect x="6" y="8" width="20" height="6.5" rx="2" fill="#3D6852" />

      {/* Golden Crown */}
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

// 4. PDF Acrobat Floating Button Icon
function PdfAcrobatIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 17.5C5.8 17.5 4.5 16.2 4.5 14.5C4.5 12.2 6.8 10.4 10.5 9.8C10.5 9.8 11.2 7.2 11.8 5.2C12.1 4.2 12.8 3.5 13.8 3.5C14.7 3.5 15.3 4.2 15.1 5.2C14.7 7.2 13.8 10.5 13.4 12.2C15.2 13.5 17.5 14.5 19.2 14.5C20.5 14.5 21.2 15.2 21.2 16.1C21.2 17.1 20.3 17.8 19 17.8C16.8 17.8 14.2 16.4 12.2 14.8C9.5 16.5 7.8 17.5 7.5 17.5Z"
        fill="#E11D48"
      />
      <Path
        d="M13.2 4.8C13 5.5 12.5 7.5 12 9.5C12.7 8.2 13.3 6.5 13.5 5.2C13.5 4.9 13.4 4.8 13.2 4.8ZM6.2 14.8C6.2 15.4 6.8 15.8 7.5 15.8C8.2 15.8 9.5 15 10.8 13.8C8.2 14.2 6.2 14.5 6.2 14.8ZM18.5 16.2C19.2 16.2 19.6 15.8 19.6 15.5C19.6 15.2 18.8 14.8 17.5 14.5C17.8 15.4 18.2 16.2 18.5 16.2Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

interface StudyGuideReaderProps {
  chapterNumber: number;
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
};

const INFOGRAPHIC_URL =
  'https://saralvidhya-api-193782571555.asia-south1.run.app/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20%28Stomodaem%29/Anatomy_of_the_Insect_Foregut.png';

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

  // Mode: 'essentials' (Screen 1) vs 'in_depth' (Screen 2)
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

  const handlePdfDownload = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Export PDF Study Guide',
      `Official ANGRAU Chapter ${chapterNumber}: ${chapterTitle} summary guide is ready for download.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Download PDF', onPress: () => {} }]
    );
  };

  // Color tokens matching user reference images:
  // Light Mode: Screen background #F2F7F4, cards #FFFFFF
  // Dark Mode: Screen background #23322B, cards #1E2B24
  const bg = isDark ? '#23322B' : '#F2F7F4';
  const cardBg = isDark ? '#1E2B24' : '#FFFFFF';
  const cardBorder = isDark ? '#3D5449' : '#DDE8E0';
  const textColor = isDark ? '#FFFFFF' : '#0F1D16';
  const subtextColor = isDark ? '#A6C5B3' : '#688875';
  const audioBarBg = isDark ? 'rgba(74, 222, 128, 0.12)' : '#E2EFE7';
  const audioBorder = isDark ? '#2A4638' : '#CFE2D6';
  const toggleBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E6EFEA';
  const activeToggleBg = isDark ? '#2E4438' : '#203328';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* 1. TOP HEADER (Screen 1 vs Screen 2 Header) */}
      {studyMode === 'essentials' ? (
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={onBackPress}
            activeOpacity={0.8}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={textColor} />
          </TouchableOpacity>

          <Text style={[styles.headerSubjectTitle, { color: textColor }]}>
            {subjectName}
          </Text>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={handleToggleBookmark}
            activeOpacity={0.8}
            accessibilityLabel="Bookmark this chapter"
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? '#16a34a' : textColor}
            />
          </TouchableOpacity>
        </View>
      ) : (
        /* Screen 2 In-depth Header */
        <View style={styles.inDepthTopHeader}>
          <Text style={[styles.inDepthHeaderTitle, { color: textColor }]}>
            {subjectName} - Chapter {chapterNumber}: {chapterTitle}
          </Text>

          {/* 3 Persona / Tier Level Badges (Beginner, Intermediate, Advanced) */}
          <View style={styles.tierIconsRow}>
            {(['beginner', 'intermediate', 'advanced'] as PersonaType[]).map((lvl) => {
              const isActive = persona === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.tierIconBadge,
                    { backgroundColor: cardBg, borderColor: isActive ? '#22c55e' : cardBorder },
                    isActive && styles.tierIconBadgeActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updatePersona(lvl);
                  }}
                  activeOpacity={0.8}
                >
                  {lvl === 'beginner' ? (
                    <BeginnerBookIcon size={30} />
                  ) : lvl === 'intermediate' ? (
                    <IntermediateBookIcon size={30} />
                  ) : (
                    <AdvancedBookIcon size={30} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Screen 2 Audio Pill */}
          <TouchableOpacity
            style={[styles.inDepthAudioPill, { backgroundColor: audioBarBg, borderColor: '#22c55e' }]}
            onPress={handleToggleAudio}
            activeOpacity={0.8}
          >
            <Ionicons name={isPlayingAudio ? 'volume-high' : 'headset-outline'} size={16} color="#16a34a" />
            <Text style={[styles.inDepthAudioText, { color: '#16a34a' }]}>
              {isPlayingAudio ? 'Speaking...' : 'Read Aloud - 31:22'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle & Category for Essentials mode */}
        {studyMode === 'essentials' && (
          <View style={styles.metaSection}>
            <TouchableOpacity
              onPress={onChapterPress}
              disabled={!onChapterPress}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={[styles.chapterSubtitle, { color: subtextColor }]}>
                Chapter {chapterNumber}: {chapterTitle}
              </Text>
              {onChapterPress && <Ionicons name="chevron-down" size={14} color="#22c55e" />}
            </TouchableOpacity>
            <Text style={styles.categoryGreenLabel}>QUICK STUDY GUIDE</Text>
            <Text style={[styles.mainHeadline, { color: textColor }]}>
              Insect Digestive System
            </Text>
          </View>
        )}

        {/* 2. TOGGLE PILLS: [ ⚡ Essentials ]  vs  [ ⊙ In-depth ] */}
        <View style={[styles.toggleContainer, { backgroundColor: toggleBg }]}>
          <TouchableOpacity
            style={[
              styles.togglePill,
              studyMode === 'essentials' && [styles.activeTogglePill, { backgroundColor: activeToggleBg }],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setStudyMode('essentials');
            }}
            activeOpacity={0.85}
          >
            <Ionicons
              name="flash"
              size={14}
              color={studyMode === 'essentials' ? '#FFFFFF' : subtextColor}
            />
            <Text
              style={[
                styles.togglePillText,
                { color: studyMode === 'essentials' ? '#FFFFFF' : subtextColor },
                studyMode === 'essentials' && styles.activeToggleText,
              ]}
            >
              Essentials
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.togglePill,
              studyMode === 'in_depth' && [styles.activeTogglePill, { backgroundColor: activeToggleBg }],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setStudyMode('in_depth');
            }}
            activeOpacity={0.85}
          >
            <Ionicons
              name="radio-button-on"
              size={13}
              color={studyMode === 'in_depth' ? '#FFFFFF' : subtextColor}
            />
            <Text
              style={[
                styles.togglePillText,
                { color: studyMode === 'in_depth' ? '#FFFFFF' : subtextColor },
                studyMode === 'in_depth' && styles.activeToggleText,
              ]}
            >
              In-depth
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. MODE CONTENT: ESSENTIALS (Screen 1) */}
        {studyMode === 'essentials' && (
          <View style={styles.essentialsContainer}>
            {/* Section Heading Row */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.numBadge}>
                <Text style={styles.numBadgeText}>1</Text>
              </View>
              <Text style={[styles.sectionHeading, { color: textColor }]}>
                Architectural Blueprint & Regional Partitioning
              </Text>
            </View>

            {/* Paragraph Text with Bolded Anatomy terms */}
            <Text style={[styles.bodyParagraph, { color: isDark ? '#D8E5DC' : '#2D3E36' }]}>
              The insect alimentary canal is a specialized muscular tube extending from the mouth to the
              anus. It is divided into three distinct anatomical chambers: the{' '}
              <Text style={styles.boldTerm}>Foregut (Stomodaeum)</Text>, the{' '}
              <Text style={styles.boldTerm}>Midgut (Mesenteron)</Text>, and the{' '}
              <Text style={styles.boldTerm}>Hindgut (Proctodaeum)</Text>. This division reflects
              fundamental embryonic origins that govern how food is processed and eliminated.
            </Text>

            {/* Infographic Diagram Card with Expand button */}
            <View style={[styles.infographicCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Card Header: ALIMENTARY CANAL & Expand */}
              <View style={styles.diagramCardHeader}>
                <Text style={styles.diagramLabel}>ALIMENTARY CANAL</Text>
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsDiagramZoomed(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.expandText, { color: isDark ? '#4ade80' : '#16a34a' }]}>Expand</Text>
                  <Ionicons name="expand-outline" size={14} color={isDark ? '#4ade80' : '#16a34a'} />
                </TouchableOpacity>
              </View>

              {/* Diagram Graphic Preview */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setIsDiagramZoomed(true);
                }}
                activeOpacity={0.9}
                style={styles.diagramImageTouch}
              >
                <Image
                  source={{ uri: INFOGRAPHIC_URL }}
                  style={styles.diagramImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* 3-Column Legend: Foregut, Midgut, Hindgut */}
              <View style={styles.diagramLegendRow}>
                <View style={styles.legendCol}>
                  <Text style={[styles.legendColTitle, { color: textColor }]}>Foregut</Text>
                  <Text style={[styles.legendColSub, { color: subtextColor }]}>Stomodaeum</Text>
                </View>
                <View style={styles.legendCol}>
                  <Text style={[styles.legendColTitle, { color: textColor }]}>Midgut</Text>
                  <Text style={[styles.legendColSub, { color: subtextColor }]}>Mesenteron</Text>
                </View>
                <View style={styles.legendCol}>
                  <Text style={[styles.legendColTitle, { color: textColor }]}>Hindgut</Text>
                  <Text style={[styles.legendColSub, { color: subtextColor }]}>Proctodaeum</Text>
                </View>
              </View>
            </View>

            {/* Screen 1 Audio Player Bar: [ 🎧 Read Aloud       6:28  ▷ ] */}
            <TouchableOpacity
              style={[styles.essentialsAudioBar, { backgroundColor: audioBarBg, borderColor: audioBorder }]}
              onPress={handleToggleAudio}
              activeOpacity={0.8}
            >
              <View style={styles.audioLeft}>
                <Ionicons name="headset-outline" size={20} color={isDark ? '#4ade80' : '#1C2E24'} />
                <Text style={[styles.audioLabelText, { color: isDark ? '#4ade80' : '#1C2E24' }]}>
                  {isPlayingAudio ? 'Playing...' : 'Read Aloud'}
                </Text>
              </View>

              <View style={styles.audioRight}>
                <Text style={[styles.durationText, { color: subtextColor }]}>6:28</Text>
                <Ionicons
                  name={isPlayingAudio ? 'pause' : 'play-outline'}
                  size={20}
                  color={isDark ? '#4ade80' : '#16a34a'}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. MODE CONTENT: IN-DEPTH (Screen 2) */}
        {studyMode === 'in_depth' && (
          <View style={styles.inDepthContainer}>
            <Text style={[styles.inDepthMainTitle, { color: textColor }]}>
              Detailed Study Guide: Insect Digestive System
            </Text>

            <Text style={[styles.inDepthSectionTitle, { color: textColor }]}>
              1. Architectural Blueprint and Division of Labor in the Insect Gut
            </Text>

            <Text style={[styles.inDepthParagraph, { color: isDark ? '#D8E5DC' : '#2D3E36' }]}>
              The insect{' '}
              <Text
                style={styles.clickableGlossaryTerm}
                onPress={() => handleTermPress('alimentary canal')}
              >
                alimentary canal
              </Text>{' '}
              is one of the most remarkable evolutionary adaptations in the animal kingdom. Rather than
              functioning as a uniform, undifferentiated tube, the digestive tract of an insect operates
              as a highly coordinated biological assembly line. This internal processing system is strictly
              compartmentalized into three primary morphological regions: the{' '}
              <Text
                style={styles.clickableGlossaryBold}
                onPress={() => handleTermPress('foregut')}
              >
                foregut
              </Text>{' '}
              (stomodaeum), the{' '}
              <Text
                style={styles.clickableGlossaryBold}
                onPress={() => handleTermPress('midgut')}
              >
                midgut
              </Text>{' '}
              (mesenteron), and the{' '}
              <Text
                style={styles.clickableGlossaryBold}
                onPress={() => handleTermPress('hindgut')}
              >
                hindgut
              </Text>{' '}
              (
              <Text
                style={styles.clickableGlossaryTerm}
                onPress={() => handleTermPress('proctodaeum')}
              >
                proctodaeum
              </Text>
              ). Each region performs a non-overlapping physiological assignment, transforming raw, often
              abrasive environmental food sources into molecular energy while conserving vital bodily
              fluids.
            </Text>

            <Text style={[styles.inDepthParagraph, { color: isDark ? '#D8E5DC' : '#2D3E36' }]}>
              Understanding the insect digestive tract requires understanding where these organs come from
              during the development of the embryo. The insect body is built around an embryonic framework
              where different tissue layers give rise to different organ systems. The{' '}
              <Text
                style={styles.clickableGlossaryTerm}
                onPress={() => handleTermPress('foregut')}
              >
                foregut
              </Text>{' '}
              and the{' '}
              <Text
                style={styles.clickableGlossaryTerm}
                onPress={() => handleTermPress('hindgut')}
              >
                hindgut
              </Text>{' '}
              arise directly from the{' '}
              <Text
                style={styles.clickableGlossaryBold}
                onPress={() => handleTermPress('ectoderm')}
              >
                ectoderm
              </Text>
              , which is the exact same embryonic cell layer that forms the insect's outer body wall and
              exoskeleton. Because they develop as inward folds (invaginations) of the outer body surface,
              both the foregut and the hindgut inherit the protective armor of the exterior cuticle.
              Their innermost lining is covered by a specialized chitinous sheet known as the{' '}
              <Text
                style={styles.clickableGlossaryTerm}
                onPress={() => handleTermPress('cuticular intima')}
              >
                cuticular intima
              </Text>
              . In contrast, the central chamber—the midgut—develops from embryonic{' '}
              <Text
                style={styles.clickableGlossaryTerm}
                onPress={() => handleTermPress('endoderm')}
              >
                endoderm
              </Text>
              . The midgut never develops a cuticular lining, leaving its cellular surface naked and
              accessible to facilitate the rapid secretion of digestive juices and the active absorption of
              dissolved nutrients.
            </Text>

            <View style={{ height: 60 }} />
          </View>
        )}
      </ScrollView>

      {/* Floating Red PDF Action Button (Screen 2) */}
      {studyMode === 'in_depth' && (
        <TouchableOpacity
          style={styles.floatingPdfBtn}
          onPress={handlePdfDownload}
          activeOpacity={0.85}
          accessibilityLabel="Export study guide as PDF"
        >
          <PdfAcrobatIcon size={24} />
        </TouchableOpacity>
      )}

      {/* 5. FULL-SCREEN INTERACTIVE DIAGRAM MODAL (Gets big on tap, shrinks on tap) */}
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

      {/* 6. CLICKABLE GLOSSARY DEFINITION MODAL */}
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
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  headerSubjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inDepthTopHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 8,
    gap: 8,
  },
  inDepthHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tierIconsRow: {
    flexDirection: 'row',
    gap: 14,
    marginVertical: 4,
  },
  tierIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tierIconBadgeActive: {
    transform: [{ scale: 1.08 }],
    backgroundColor: '#FFFFFF',
  },
  tierEmoji: {
    fontSize: 22,
  },
  inDepthAudioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  inDepthAudioText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  metaSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  chapterSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  categoryGreenLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  mainHeadline: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 33,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 3,
    marginBottom: 20,
  },
  togglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 22,
    gap: 6,
  },
  activeTogglePill: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  togglePillText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  activeToggleText: {
    fontWeight: '700',
  },
  essentialsContainer: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCECE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C2E24',
  },
  sectionHeading: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  bodyParagraph: {
    fontSize: 15,
    lineHeight: 24,
  },
  boldTerm: {
    fontWeight: '700',
    color: '#1C2E24',
  },
  infographicCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  diagramCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagramLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#688875',
    letterSpacing: 0.6,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diagramImageTouch: {
    width: '100%',
    height: 140,
    marginVertical: 4,
  },
  diagramImage: {
    width: '100%',
    height: '100%',
  },
  diagramLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    marginTop: 6,
  },
  legendCol: {
    alignItems: 'flex-start',
  },
  legendColTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  legendColSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  essentialsAudioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  audioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioLabelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  audioRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  /* In-depth Styles */
  inDepthContainer: {
    gap: 14,
  },
  inDepthMainTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  inDepthSectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    marginTop: 4,
  },
  inDepthParagraph: {
    fontSize: 14.5,
    lineHeight: 23,
  },
  clickableGlossaryTerm: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    color: '#16a34a',
  },
  clickableGlossaryBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: '#1C2E24',
  },
  floatingPdfBtn: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
