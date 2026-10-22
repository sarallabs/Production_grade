import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth, PersonaType } from '@/context/AuthContext';
import { speechService } from '@/services/speechService';
import MarkdownReader from './MarkdownReader';
import {
  fetchQuickStudyGuide,
  fetchDetailedNotes,
} from '@/services/contentService';
import { SAMPLE_STUDY_CONTENT } from '@/data/sampleStudyContent';

interface StudyGuideReaderTabletProps {
  chapterNumber?: number;
  chapterTitle?: string;
  subjectName?: string;
  subjectId?: string;
  onBackPress?: () => void;
  onBookmarkPress?: () => void;
  onOpenListen?: (mode: 'quick' | 'detailed') => void;
  onCompleteReading?: (mode: 'essentials' | 'in_depth') => void;
}

// Persona audio duration mapping
const AUDIO_DURATIONS: Record<'essentials' | 'in_depth', Record<PersonaType, string>> = {
  essentials: {
    beginner: '4:15',
    intermediate: '6:28',
    advanced: '8:45',
  },
  in_depth: {
    beginner: '18:30',
    intermediate: '31:22',
    advanced: '42:10',
  },
};

// Chapter key concept callout mapping
const KEY_CONCEPTS: Record<number, { essentials: string; in_depth: string }> = {
  1: {
    essentials: 'Tripartite canal: Foregut (ingest/grind), Midgut (digest/absorb), Hindgut (water recovery)',
    in_depth: 'Foregut + hindgut: ectodermal origin · Midgut: endodermal origin',
  },
  2: {
    essentials: 'Hormonal cascade: PTTH triggers ecdysone synthesis in prothoracic glands',
    in_depth: 'Ecdysone drives apolysis & molting · Juvenile Hormone prevents premature adult differentiation',
  },
  3: {
    essentials: 'Weathering pathways: Physical fragmentation precedes chemical breakdown',
    in_depth: 'Physical disintegration yields regolith · Chemical decomposition yields secondary clay minerals',
  },
  4: {
    essentials: 'Pollination biology: Entomophilous transfer ensures high genetic diversity',
    in_depth: 'Stamen microsporangia release pollen · Apis mellifera vectors transfer to receptive stigma',
  },
};

export default function StudyGuideReaderTablet({
  chapterNumber = 1,
  chapterTitle = 'Insect Digestive System & Anatomy',
  subjectName = 'Entomology',
  subjectId = 'ento_131',
  onBackPress,
  onBookmarkPress,
  onOpenListen,
  onCompleteReading,
}: StudyGuideReaderTabletProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { persona: contextPersona, updatePersona } = useAuth();

  // Mode: default to 'in_depth' matching user's reference PNG
  const [studyMode, setStudyMode] = useState<'essentials' | 'in_depth'>('in_depth');
  
  // Local active persona for zero-latency UI toggle
  const [activePersona, setActivePersona] = useState<PersonaType>(contextPersona || 'intermediate');

  // Synchronize local active persona if context updates externally
  useEffect(() => {
    if (contextPersona && contextPersona !== activePersona) {
      setActivePersona(contextPersona);
    }
  }, [contextPersona]);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // Synchronous initial fallback content
  const [quickContent, setQuickContent] = useState<string>(
    SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || ''
  );
  const [detailedContent, setDetailedContent] = useState<string>(
    SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || ''
  );

  // Sync state whenever chapter changes
  useEffect(() => {
    setQuickContent(SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || '');
    setDetailedContent(SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || '');
  }, [chapterNumber]);

  // Pull live content from cloud database parameterized by activePersona and chapter
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsCloudLoading(true);

    if (studyMode === 'essentials') {
      fetchQuickStudyGuide(subjectId, chapterNumber, activePersona, controller.signal)
        .then((quick) => {
          if (isMounted && quick && quick.trim().length > 50) {
            setQuickContent(quick);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsCloudLoading(false);
        });
    } else {
      fetchDetailedNotes(subjectId, chapterNumber, activePersona, controller.signal)
        .then((detailed) => {
          if (isMounted && detailed && detailed.trim().length > 50) {
            setDetailedContent(detailed);
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
  }, [chapterNumber, subjectId, activePersona, studyMode]);

  // Speech subscription
  useEffect(() => {
    const unsub = speechService.subscribe((speaking) => {
      setIsPlayingAudio(speaking);
    });
    return () => {
      unsub();
      speechService.stop();
    };
  }, []);

  const handleToggleAudio = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    if (onOpenListen) {
      onOpenListen(studyMode === 'essentials' ? 'quick' : 'detailed');
      return;
    }

    if (isPlayingAudio) {
      await speechService.stop();
    } else {
      const rawText = studyMode === 'essentials' ? quickContent : detailedContent;
      const cleanText = rawText
        ? rawText.replace(/[#*`_>\[\]]/g, '').slice(0, 350)
        : `Reading Chapter ${chapterNumber}: ${chapterTitle}`;
      await speechService.speak(cleanText, 1.0);
    }
  };

  const handleSelectPersona = (newPersona: PersonaType) => {
    if (activePersona !== newPersona) {
      try {
        Haptics.selectionAsync().catch(() => {});
      } catch {}
      setActivePersona(newPersona);
      updatePersona(newPersona).catch(() => {});
    }
  };

  // Color tokens matching user PNG reference:
  // Background: #F4F8F5 / #F7FAF8 (light), #0F1713 (dark)
  // Text: #1C2E24 (dark charcoal), muted: #5E7A6B
  // Active capsule: #263D33 (forest slate)
  // Green outline / brand: #147A43 / #057A44
  // Persona button bg: #E0EDE5 (inactive), #FFFFFF (active) with #C8DAD0 border
  const screenBg = isDark ? '#0F1713' : '#F7FAF8';
  const textColor = isDark ? '#FFFFFF' : '#1C2E24';
  const breadcrumbColor = isDark ? '#8CA897' : '#5E7A6B';
  const pillOutlineColor = isDark ? '#4ADE80' : '#147A43';
  const capsuleBg = isDark ? '#1C2E24' : '#E0EDE5';
  const capsuleActiveBg = isDark ? '#2E4B3D' : '#263D33';
  const personaBtnInactiveBg = isDark ? '#1B2C22' : '#E0EDE5';
  const personaBtnActiveBg = isDark ? '#263D33' : '#FFFFFF';
  const personaBtnActiveBorder = isDark ? '#4ADE80' : '#C8DAD0';

  const breadcrumbText = `${(subjectName || 'ENTOMOLOGY').toUpperCase()} / CHAPTER ${chapterNumber}`;

  // Clean chapter title for study guide header
  const cleanTitle = chapterTitle.replace(/&.*/, '').trim();

  // Audio duration dynamically based on mode and active persona
  const audioDuration = AUDIO_DURATIONS[studyMode][activePersona];

  // Key concept text dynamically based on chapter and mode
  const keyConceptText =
    KEY_CONCEPTS[chapterNumber]?.[studyMode] ||
    (studyMode === 'in_depth'
      ? 'Foregut + hindgut: ectodermal origin · Midgut: endodermal origin'
      : 'Tripartite canal: Foregut (ingest/grind), Midgut (digest/absorb), Hindgut (water recovery)');

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: insets.bottom + 60,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidthWrapper}>
          {/* 1. TOP BREADCRUMB */}
          <Text style={[styles.breadcrumbText, { color: breadcrumbColor }]}>
            {breadcrumbText}
          </Text>

          {/* 2. CHAPTER TITLE */}
          <Text style={[styles.chapterTitleText, { color: textColor }]}>
            {chapterTitle}
          </Text>

          {/* 3. PERSONA LEVEL SELECTOR (3 Rounded Square Buttons) */}
          <View style={styles.personaRow}>
            {/* Button 1: Beginner (Green Bar) */}
            <TouchableOpacity
              style={[
                styles.personaSquareBtn,
                {
                  backgroundColor:
                    activePersona === 'beginner' ? personaBtnActiveBg : personaBtnInactiveBg,
                },
                activePersona === 'beginner' && [
                  styles.personaSquareBtnActive,
                  { borderColor: personaBtnActiveBorder },
                ],
              ]}
              onPress={() => handleSelectPersona('beginner')}
              activeOpacity={0.8}
              accessibilityLabel="Beginner Level"
            >
              <View style={styles.greenBarIcon} />
            </TouchableOpacity>

            {/* Button 2: Intermediate (Document Page with Lines) */}
            <TouchableOpacity
              style={[
                styles.personaSquareBtn,
                {
                  backgroundColor:
                    activePersona === 'intermediate' ? personaBtnActiveBg : personaBtnInactiveBg,
                },
                activePersona === 'intermediate' && [
                  styles.personaSquareBtnActive,
                  { borderColor: personaBtnActiveBorder },
                ],
              ]}
              onPress={() => handleSelectPersona('intermediate')}
              activeOpacity={0.8}
              accessibilityLabel="Intermediate Level"
            >
              <View style={styles.docLinesIcon}>
                <View style={[styles.docLine, { backgroundColor: '#057A44' }]} />
                <View style={[styles.docLine, { backgroundColor: '#057A44' }]} />
                <View style={[styles.docLine, { backgroundColor: '#057A44' }]} />
                <View style={[styles.docLine, { width: 11, backgroundColor: '#057A44' }]} />
              </View>
            </TouchableOpacity>

            {/* Button 3: Advanced (Gold Bar) */}
            <TouchableOpacity
              style={[
                styles.personaSquareBtn,
                {
                  backgroundColor:
                    activePersona === 'advanced' ? personaBtnActiveBg : personaBtnInactiveBg,
                },
                activePersona === 'advanced' && [
                  styles.personaSquareBtnActive,
                  { borderColor: personaBtnActiveBorder },
                ],
              ]}
              onPress={() => handleSelectPersona('advanced')}
              activeOpacity={0.8}
              accessibilityLabel="Advanced Level"
            >
              <View style={styles.goldBarIcon} />
            </TouchableOpacity>

            {/* Subtle Cloud Fetch Indicator */}
            {isCloudLoading && (
              <ActivityIndicator size="small" color="#147A43" style={{ marginLeft: 8 }} />
            )}
          </View>

          {/* 4. READ ALOUD PILL (Full Width with Headset Icon) */}
          <TouchableOpacity
            style={[
              styles.readAloudPill,
              {
                borderColor: pillOutlineColor,
                backgroundColor: isPlayingAudio ? 'rgba(20, 122, 67, 0.08)' : 'transparent',
              },
            ]}
            onPress={handleToggleAudio}
            activeOpacity={0.8}
            accessibilityLabel="Read Aloud"
          >
            <Ionicons
              name={isPlayingAudio ? 'pause' : 'headset-outline'}
              size={18}
              color={pillOutlineColor}
            />
            <Text style={[styles.readAloudText, { color: pillOutlineColor }]}>
              {isPlayingAudio ? 'Pause Narration' : `Read Aloud · ${audioDuration}`}
            </Text>
          </TouchableOpacity>

          {/* 5. READING DEPTH CAPSULE TOGGLE: ⚡ Essentials | 🌐 In-depth */}
          <View style={[styles.capsuleContainer, { backgroundColor: capsuleBg }]}>
            {/* Essentials Tab */}
            <TouchableOpacity
              style={[
                styles.capsuleTab,
                studyMode === 'essentials' && [
                  styles.capsuleTabActive,
                  { backgroundColor: capsuleActiveBg },
                ],
              ]}
              onPress={() => {
                if (studyMode !== 'essentials') {
                  try {
                    Haptics.selectionAsync().catch(() => {});
                  } catch {}
                  setStudyMode('essentials');
                }
              }}
              activeOpacity={0.85}
              accessibilityLabel="Essentials Mode"
            >
              <Ionicons
                name="flash"
                size={15}
                color={studyMode === 'essentials' ? '#FFFFFF' : textColor}
              />
              <Text
                style={[
                  styles.capsuleTabText,
                  { color: studyMode === 'essentials' ? '#FFFFFF' : textColor },
                ]}
              >
                Essentials
              </Text>
            </TouchableOpacity>

            {/* In-depth Tab */}
            <TouchableOpacity
              style={[
                styles.capsuleTab,
                studyMode === 'in_depth' && [
                  styles.capsuleTabActive,
                  { backgroundColor: capsuleActiveBg },
                ],
              ]}
              onPress={() => {
                if (studyMode !== 'in_depth') {
                  try {
                    Haptics.selectionAsync().catch(() => {});
                  } catch {}
                  setStudyMode('in_depth');
                }
              }}
              activeOpacity={0.85}
              accessibilityLabel="In-depth Mode"
            >
              <Ionicons
                name="globe-outline"
                size={16}
                color={studyMode === 'in_depth' ? '#FFFFFF' : textColor}
              />
              <Text
                style={[
                  styles.capsuleTabText,
                  { color: studyMode === 'in_depth' ? '#FFFFFF' : textColor },
                ]}
              >
                In-depth
              </Text>
            </TouchableOpacity>
          </View>

          {/* 6. STUDY GUIDE ARTICLE CONTENT */}
          <View style={styles.articleContainer}>
            {/* Main Article Title */}
            <Text style={[styles.articleMainTitle, { color: textColor }]}>
              {studyMode === 'in_depth'
                ? `Detailed Study Guide: ${cleanTitle}`
                : `Quick Study Guide: ${cleanTitle}`}
            </Text>

            {/* Markdown Body Content pulled directly from cloud database */}
            <MarkdownReader
              title={chapterTitle}
              chapterNumber={chapterNumber}
              content={
                studyMode === 'in_depth'
                  ? detailedContent || SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || ''
                  : quickContent || SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || ''
              }
            />

            {/* Key Concept Callout Box (as shown in user design PNG) */}
            <View style={[styles.keyConceptCard, { backgroundColor: isDark ? '#192C22' : '#E1EFE6' }]}>
              <Text style={[styles.keyConceptLabel, { color: isDark ? '#4ADE80' : '#057A44' }]}>
                KEY CONCEPT
              </Text>
              <Text style={[styles.keyConceptText, { color: textColor }]}>
                {keyConceptText}
              </Text>
            </View>

            {/* Mark Chapter as Completed Button */}
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onCompleteReading?.(studyMode);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.completeBtnText}>
                {studyMode === 'in_depth'
                  ? 'Mark In-Depth Notes as Completed'
                  : 'Mark Essentials as Completed'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 36,
  },
  maxWidthWrapper: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  breadcrumbText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  chapterTitleText: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 18,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  personaSquareBtn: {
    width: 48,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaSquareBtnActive: {
    borderWidth: 1.5,
  },
  greenBarIcon: {
    width: 22,
    height: 5.5,
    borderRadius: 2.75,
    backgroundColor: '#057A44',
  },
  docLinesIcon: {
    width: 19,
    height: 19,
    borderWidth: 1.3,
    borderColor: '#057A44',
    borderRadius: 3,
    padding: 2.5,
    justifyContent: 'space-between',
  },
  docLine: {
    width: '100%',
    height: 1.5,
    borderRadius: 1,
  },
  goldBarIcon: {
    width: 22,
    height: 5.5,
    borderRadius: 2.75,
    backgroundColor: '#C78D24',
  },
  readAloudPill: {
    width: '100%',
    height: 42,
    borderRadius: 100,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  readAloudText: {
    fontSize: 14,
    fontWeight: '700',
  },
  capsuleContainer: {
    width: '100%',
    height: 50,
    borderRadius: 100,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },
  capsuleTab: {
    flex: 1,
    height: '100%',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  capsuleTabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  capsuleTabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  articleContainer: {
    width: '100%',
  },
  articleMainTitle: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  keyConceptCard: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 20,
    marginBottom: 32,
  },
  keyConceptLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  keyConceptText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  completeBtn: {
    backgroundColor: '#147A43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 40,
    gap: 8,
    shadowColor: '#147A43',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
