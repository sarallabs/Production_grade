import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCourseContext } from '@/context/CourseContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { ANGRAU_SUBJECTS } from '@/api/manifestService';
import FlashcardDeck from '@/components/flashcards/FlashcardDeck';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import BreadcrumbBar from '@/components/navigation/BreadcrumbBar';
import AssessmentView from '@/components/study/AssessmentView';
import TeacherQuestionBankView from '@/components/study/TeacherQuestionBankView';
import { fetchFlashcards, Flashcard } from '@/services/contentService';

const PRACTICE_PARTS: NavSegment[] = [
  { id: 'revise', label: 'Revise', vectorIcon: 'flash-outline' },
  { id: 'assessments', label: 'Assessments', vectorIcon: 'checkmark-circle-outline' },
  { id: 'question_bank', label: 'Question Bank', vectorIcon: 'file-tray-full-outline' },
];

export default function PracticeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { persona, updatePersona } = useAuth();
  const { isTablet } = useDeviceLayout();
  const {
    selectedSubject,
    selectedChapter,
    selectChapter,
    selectChapterByNumber,
    markResourceCompleted,
  } = useCourseContext();
  const params = useLocalSearchParams<{ chapter?: string; part?: string }>();
  const activeSubject = selectedSubject || ANGRAU_SUBJECTS[0];

  // 3 Practice parts: Revise, Assessments, Question Bank. Default to Revise.
  const [activePart, setActivePart] = useState<'revise' | 'assessments' | 'question_bank'>(
    params.part === 'assessments'
      ? 'assessments'
      : params.part === 'question_bank'
      ? 'question_bank'
      : 'revise'
  );

  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    params.chapter ? parseInt(params.chapter, 10) : (selectedChapter?.number || 1)
  );
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);
  const [flashcardsList, setFlashcardsList] = useState<Flashcard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState<boolean>(false);

  useEffect(() => {
    if (params.part && ['revise', 'assessments', 'question_bank'].includes(params.part)) {
      setActivePart(params.part as 'revise' | 'assessments' | 'question_bank');
    }
  }, [params.part]);

  useEffect(() => {
    if (params.chapter) {
      const parsed = parseInt(params.chapter, 10);
      if (!isNaN(parsed)) {
        setSelectedChapterNum(parsed);
        if (selectedChapter?.number !== parsed) {
          selectChapterByNumber(parsed);
        }
      }
    }
  }, [params.chapter]);

  useEffect(() => {
    if (selectedChapter?.number && selectedChapter.number !== selectedChapterNum) {
      setSelectedChapterNum(selectedChapter.number);
    }
  }, [selectedChapter?.number]);

  useEffect(() => {
    if (activePart !== 'revise') return;

    let isMounted = true;
    const controller = new AbortController();
    setIsLoadingCards(true);

    fetchFlashcards(activeSubject.id, selectedChapterNum, persona, controller.signal)
      .then((cards) => {
        if (isMounted) {
          setFlashcardsList(cards);
          setIsLoadingCards(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('Practice flashcards loading error:', err);
        }
        if (isMounted) setIsLoadingCards(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activePart, selectedChapterNum, persona]);

  const currentChapter =
    activeSubject.chapters.find((c) => c.number === selectedChapterNum) ||
    activeSubject.chapters[0];

  // Dynamically record chapter progress as the user goes through Revise, Assessments, or Question Bank
  useEffect(() => {
    if (!activeSubject?.id || !currentChapter?.number) return;
    markResourceCompleted(activeSubject.id, currentChapter.number, activePart);
  }, [activeSubject?.id, currentChapter?.number, activePart]);

  // Theme tokens
  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const toggleBg = isDark ? '#1E2B24' : '#E8F2EB';
  const activePillBg = isDark ? '#147A43' : '#2D3E36';
  const textColor = isDark ? '#FFFFFF' : '#1F2B29';
  const subtextColor = isDark ? '#A6C5B3' : '#596B66';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Top Mobile Toolbar with Back Button + Toggle Pills + Profile Avatar */}
      <TopNavBar
        segments={PRACTICE_PARTS}
        activeSegment={activePart}
        onSegmentChange={(segId) => setActivePart(segId as any)}
        pillar="practice"
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/(tabs)');
          }
        }}
        showProfile={true}
      />

      {/* Consistent Breadcrumb Line */}
      <BreadcrumbBar
        subjectName={activeSubject.name}
        chapterNumber={currentChapter.number}
        chapterTitle={currentChapter.name}
        onPress={() => setShowChapterModal(true)}
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/subjects');
          }
        }}
      />

      {/* 2. MAIN ACTIVE PART */}
      {activePart === 'assessments' ? (
        /* Assessments View: MCQ Single Choice */
        <AssessmentView
          subjectId={activeSubject.id}
          chapterNumber={selectedChapterNum}
          subjectName={activeSubject.name}
          onFinish={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markResourceCompleted(activeSubject.id, selectedChapterNum, 'quiz');
          }}
          onBackPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          }}
        />
      ) : activePart === 'revise' ? (
        /* Revise View: Active Recall Flashcards */
        <View style={styles.flashcardCenterArea}>
          {isLoadingCards ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={[styles.loadingText, { color: subtextColor }]}>
                Loading active recall deck...
              </Text>
            </View>
          ) : (
            <FlashcardDeck
              cards={flashcardsList}
              chapterNumber={currentChapter.number}
              persona={persona}
              onPersonaChange={updatePersona}
              onFinish={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                markResourceCompleted(activeSubject.id, selectedChapterNum, 'flashcards');
              }}
            />
          )}
        </View>
      ) : (
        /* Question Bank View: Questions assigned by teachers */
        <TeacherQuestionBankView
          subjectId={activeSubject.id}
          chapterNumber={selectedChapterNum}
          chapterName={currentChapter.name}
        />
      )}

      {/* Chapter Selector Modal */}
      <Modal
        visible={showChapterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChapterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChapterModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Select Chapter ({activeSubject.code})
              </Text>
              <TouchableOpacity onPress={() => setShowChapterModal(false)}>
                <Ionicons name="close" size={24} color={subtextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {activeSubject.chapters.map((ch) => {
                const isCur = ch.number === selectedChapterNum;
                return (
                  <TouchableOpacity
                    key={ch.number}
                    style={[styles.modalChapterRow, isCur && styles.modalChapterRowActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedChapterNum(ch.number);
                      selectChapter(ch);
                      setShowChapterModal(false);
                    }}
                  >
                    <View style={[styles.modalNumBadge, isCur && styles.modalNumBadgeActive]}>
                      <Text style={[styles.modalNumText, isCur && styles.modalNumTextActive]}>
                        {ch.number}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.modalChapterText,
                        isCur && styles.modalChapterTextActive,
                        { color: textColor },
                      ]}
                    >
                      {ch.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  /* Top Bar */
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  chapterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chapterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Top Segment Toggle */
  topSegmentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    zIndex: 10,
  },
  topSegmentContainer: {
    flexDirection: 'row',
    height: 38,
    borderRadius: 19,
    padding: 3,
    alignItems: 'center',
  },
  segmentPill: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  segmentPillActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '500',
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  /* Revise / Flashcards area */
  flashcardCenterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalChapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#A8C7B2',
    gap: 12,
  },
  modalChapterRowActive: {
    backgroundColor: 'rgba(20, 122, 67, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  modalNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNumBadgeActive: {
    backgroundColor: '#147A43',
  },
  modalNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D3E36',
  },
  modalNumTextActive: {
    color: '#FFFFFF',
  },
  modalChapterText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  modalChapterTextActive: {
    color: '#147A43',
    fontWeight: '700',
  },
});
