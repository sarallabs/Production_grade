import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import ReadAloudBar from './ReadAloudBar';
import QuickCheckCard from './QuickCheckCard';
import {
  fetchQuickCheckQuestions,
  QuickCheckQuestion,
} from '@/data/quickCheckData';
import { parseMarkdownSections, StudySection } from '@/utils/sectionParser';
import {
  fetchQuickStudyGuide,
  fetchDetailedNotes,
} from '@/services/contentService';

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

  // State for content loaded purely from API
  const [quickContent, setQuickContent] = useState<string>('');
  const [detailedContent, setDetailedContent] = useState<string>('');

  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [quickCheckQuestions, setQuickCheckQuestions] = useState<QuickCheckQuestion[]>([]);
  const [completedQuickChecks, setCompletedQuickChecks] = useState<Set<number>>(new Set());
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [sectionLayouts, setSectionLayouts] = useState<Record<number, number>>({});

  // Reset state whenever chapter changes
  useEffect(() => {
    setCompletedQuickChecks(new Set());
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

    const track = studyMode === 'in_depth' ? 'detailed' : 'quick';
    fetchQuickCheckQuestions(chapterNumber, track, activePersona, controller.signal)
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
  }, [chapterNumber, subjectId, activePersona, studyMode]);

  const activeRawContent =
    studyMode === 'in_depth'
      ? detailedContent || ''
      : quickContent || '';

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

  const [quickCheckLayouts, setQuickCheckLayouts] = useState<Record<number, number>>({});

  const handleScrollToSection = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < sections.length) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
      setActiveSectionIndex(targetIndex);
      const targetY = sectionLayouts[targetIndex];
      if (typeof targetY === 'number') {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY - 20), animated: true });
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

  // Speech subscription
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

  const handleToggleAudio = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    if (isPlayingAudio) {
      await speechService.stop();
      setShowReadAloudBar(false);
    } else {
      setShowReadAloudBar(true);
      const rawText = studyMode === 'essentials' ? quickContent : detailedContent;
      const effectiveText =
        rawText || `Reading Chapter ${chapterNumber}: ${chapterTitle}`;
      await speechService.speak(effectiveText, 1.0);
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
        ref={scrollViewRef}
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

          {/* 6. "IN THIS CHAPTER" READING GUIDE */}
          {sections.length > 1 && (
            <View style={styles.readingGuideContainer}>
              <View style={styles.readingGuideHeader}>
                <View style={styles.readingGuideTitleRow}>
                  <Ionicons name="compass-outline" size={15} color={pillOutlineColor} />
                  <Text style={[styles.readingGuideLabel, { color: breadcrumbColor }]}>
                    IN THIS CHAPTER
                  </Text>
                </View>
                <Text style={[styles.chapterProgressLabel, { color: pillOutlineColor }]}>
                  {chapterProgressPercent}% Done
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sectionPillsScroll}
              >
                {sections.map((sec, sIdx) => {
                  const isQcDone = completedQuickChecks.has(sec.sectionNumber);
                  const isCurrent = activeSectionIndex === sIdx;

                  return (
                    <TouchableOpacity
                      key={`${sec.id}-${sIdx}`}
                      style={[
                        styles.sectionNavPill,
                        {
                          backgroundColor: isCurrent
                            ? (isDark ? '#1C3A2B' : '#E8F5EE')
                            : (isDark ? '#17241D' : '#FEFEFE'),
                          borderColor: isCurrent ? pillOutlineColor : personaBtnActiveBorder,
                        },
                      ]}
                      onPress={() => handleScrollToSection(sIdx)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.sectionNavPillTop}>
                        <View
                          style={[
                            styles.sectionDot,
                            {
                              backgroundColor: isQcDone
                                ? '#16A34A'
                                : isCurrent
                                ? pillOutlineColor
                                : breadcrumbColor,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.sectionPillTitle,
                            {
                              color: isCurrent ? (isDark ? '#FFFFFF' : '#147A43') : textColor,
                              fontWeight: isCurrent ? '700' : '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {sec.shortTitle}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.qcStatusBadge,
                          {
                            backgroundColor: isQcDone
                              ? (isDark ? '#143322' : '#DCFCE7')
                              : (isDark ? '#202E26' : '#F1F5F9'),
                          },
                        ]}
                        onPress={() => handleScrollToQuickCheck(sIdx)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isQcDone ? 'checkmark-circle' : 'flash'}
                          size={11}
                          color={isQcDone ? '#16A34A' : breadcrumbColor}
                        />
                        <Text
                          style={[
                            styles.qcStatusText,
                            { color: isQcDone ? '#16A34A' : breadcrumbColor },
                          ]}
                        >
                          {isQcDone ? 'Quick Check Done' : 'Quick Check'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 7. STUDY GUIDE ARTICLE CONTENT WITH FORMATIVE QUICK CHECKS */}
          <View style={styles.articleContainer}>
            {/* Chapter Overview Meta Line (Matching Web App Screenshot) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: '#FEF3C7',
                  borderColor: '#FDE68A',
                  borderWidth: 1,
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Ionicons name="time-outline" size={14} color="#92400E" />
                <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '700' }}>
                  {totalReadingMinutes} min total read
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: '#F1F5F9',
                  borderColor: '#E2E8F0',
                  borderWidth: 1,
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>
                  {totalSections} Sections
                </Text>
              </View>
            </View>

            {/* Render Each Section + Inline Quick Check Card */}
            {sections.map((sec, idx) => (
              <View
                key={`${sec.id}-${idx}`}
                onLayout={(e) => {
                  const layoutY = e.nativeEvent.layout.y;
                  setSectionLayouts((prev) => ({ ...prev, [idx]: layoutY }));
                }}
                style={styles.sectionBlock}
              >
                {/* Tablet Section Header Banner with Quick Check shortcut button */}
                <View style={styles.sectionHeaderBanner}>
                  <View style={styles.sectionMetaTop}>
                    <Text style={[styles.sectionOrderLabel, { color: isDark ? '#F59E0B' : '#B45309' }]}>
                      SECTION {sec.sectionNumber} OF {sections.length}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Text style={[styles.sectionHeadingTitle, { color: textColor, flex: 1 }]}>
                      {sec.title}
                    </Text>
                    {sec.hasInfographic && (
                      <View
                        style={{
                          backgroundColor: '#FFEDD5',
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          borderRadius: 6,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text style={{ color: '#C2410C', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
                          INFOGRAPHIC
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.sectionMetaRow}>
                    <View style={[styles.readTimeBadge, { backgroundColor: isDark ? '#22382B' : '#F1F5F9' }]}>
                      <Ionicons name="time-outline" size={13} color={breadcrumbColor} />
                      <Text style={[styles.readTimeText, { color: textColor }]}>
                        {sec.readTimeMinutes} min read
                      </Text>
                    </View>

                    {sec.quickChecks && sec.quickChecks.length > 0 && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: isDark ? '#3D2A14' : '#FEF3C7',
                          borderColor: isDark ? '#B45309' : '#FDE68A',
                          borderWidth: 1,
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          borderRadius: 6,
                        }}
                        onPress={() => handleScrollToQuickCheck(idx)}
                        activeOpacity={0.75}
                      >
                        <Text style={{ color: isDark ? '#FDE68A' : '#92400E', fontSize: 12, fontWeight: '700' }}>
                          {completedQuickChecks.has(sec.sectionNumber)
                            ? '✓ Quick Check Answered'
                            : `${sec.quickChecks.length} quick check${sec.quickChecks.length > 1 ? 's' : ''}`}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {sec.examBadge && (
                      <View
                        style={{
                          backgroundColor: '#FFE4E6',
                          paddingVertical: 4,
                          paddingHorizontal: 9,
                          borderRadius: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Ionicons name="disc-outline" size={13} color="#BE123C" />
                        <Text style={{ color: '#BE123C', fontSize: 12, fontWeight: '700' }}>
                          {sec.examBadge}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <MarkdownReader
                  title={sec.title}
                  chapterNumber={chapterNumber}
                  content={sec.content}
                />

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

      {/* Floating Bottom-Right "Next: Section [N+1] →" Button */}
      {activeSectionIndex + 1 < sections.length && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 28,
            right: 28,
            backgroundColor: '#D97706',
            paddingHorizontal: 22,
            paddingVertical: 13,
            borderRadius: 999,
            elevation: 6,
            shadowColor: '#B45309',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            zIndex: 99,
          }}
          onPress={() => handleScrollToSection(activeSectionIndex + 1)}
          activeOpacity={0.88}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 }}>
            Next: Section {activeSectionIndex + 2} →
          </Text>
        </TouchableOpacity>
      )}

      {/* Floating Read Aloud / Voice Over Bar */}
      {showReadAloudBar && (
        <View style={{ position: 'absolute', bottom: insets.bottom + 12, left: 24, right: 24, zIndex: 100 }}>
          <ReadAloudBar
            title={`Ch ${chapterNumber} · ${studyMode === 'essentials' ? 'Essentials' : 'In-depth'}`}
            content={
              studyMode === 'essentials'
                ? quickContent || ''
                : detailedContent || ''
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
    justifyContent: 'center',
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
  /* Reading Guide & Section Styles */
  readingGuideContainer: {
    marginTop: 10,
    marginBottom: 20,
    gap: 8,
  },
  readingGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  readingGuideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readingGuideLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chapterProgressLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionPillsScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  sectionNavPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 5,
    minWidth: 160,
    maxWidth: 240,
  },
  sectionNavPillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionPillTitle: {
    fontSize: 13.5,
    flex: 1,
  },
  qcStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    marginTop: 2,
  },
  qcStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeaderBanner: {
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
    marginBottom: 14,
    gap: 6,
  },
  sectionMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionOrderLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionHeadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginTop: 2,
  },
  sectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
    gap: 5,
  },
  readTimeText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  skipToQcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 7,
    borderWidth: 1,
    gap: 6,
  },
  skipToQcText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
});
