import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useCourseContext } from '@/context/CourseContext';
import { ANGRAU_SUBJECTS } from '@/api/manifestService';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import PYQView from '@/components/study/PYQView';
import StudyPlanView from '@/components/study/StudyPlanView';
import PreparationExamView from '@/components/study/PreparationExamView';
import PreparationExamSelectionView, { DEFAULT_UNITS } from '@/components/study/PreparationExamSelectionView';
import { BorderRadius, Spacing } from '@/constants/theme';

const PREPARE_SEGMENTS: NavSegment[] = [
  { id: 'pyq', label: "PYQ's", vectorIcon: 'document-text-outline' },
  { id: 'prep_exam', label: 'Preparation Exam', vectorIcon: 'timer-outline' },
  { id: 'study_plan', label: 'Study Plan', vectorIcon: 'calendar-outline' },
];

export default function PrepareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chapter?: string; segment?: string }>();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const { selectedSubject, selectedCourse, markResourceCompleted } = useCourseContext();
  const activeSubject = selectedSubject || ANGRAU_SUBJECTS[0];

  const [activeSegment, setActiveSegment] = useState<string>(
    params.segment && ['pyq', 'prep_exam', 'study_plan'].includes(params.segment)
      ? params.segment
      : 'prep_exam'
  );
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    params.chapter ? parseInt(params.chapter, 10) : 1
  );
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);

  useEffect(() => {
    if (params.chapter) {
      const parsed = parseInt(params.chapter, 10);
      if (!isNaN(parsed) && parsed !== selectedChapterNum) {
        setSelectedChapterNum(parsed);
      }
    }
    if (params.segment && ['study_plan', 'pyq', 'prep_exam'].includes(params.segment)) {
      setActiveSegment(params.segment);
    }
  }, [params.chapter, params.segment]);

  // Preparation Exam 2-step flow state: 'selection' (screen 1) -> 'exam' (screen 2)
  const [prepExamStep, setPrepExamStep] = useState<'selection' | 'exam'>('selection');
  const [examConfig, setExamConfig] = useState<{ selectedUnits: number[]; questionCount: number }>({
    selectedUnits: [1],
    questionCount: 10,
  });

  const currentChapter =
    activeSubject.chapters.find((c) => c.number === selectedChapterNum) ||
    activeSubject.chapters[0];

  const subjectUnits =
    activeSubject.chapters && activeSubject.chapters.length > 0
      ? activeSubject.chapters.map((ch) => ({
          id: ch.number,
          title: `Unit ${ch.number}`,
          description:
            ch.number === 1 && activeSubject.id.includes('ento')
              ? 'Insect Digestive System & Anatomy'
              : ch.number === 2 && activeSubject.id.includes('ento')
              ? 'Insect Morphology & Structural Taxonomy'
              : ch.number === 3 && activeSubject.id.includes('ento')
              ? 'Weathering'
              : ch.number === 4 && activeSubject.id.includes('ento')
              ? 'Pollination'
              : ch.description || ch.name,
        }))
      : DEFAULT_UNITS;

  const screenBg = activeSegment === 'prep_exam'
    ? (isDark ? '#0F1713' : '#F4F7F5')
    : (isDark ? '#2D3E36' : '#FFF6F1');
  const cardBg = isDark ? '#1E2B24' : '#FFFFFF';
  const cardBorder = isDark ? '#3D5449' : '#E5DDD8';
  const textColor = isDark ? '#FEFEFE' : '#172A24';
  const subtextColor = isDark ? '#ACC0B5' : '#5C7066';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* 1. TOP TOOLBAR: [ Back Arrow ] [ PYQ's | Preparation Exam | Study Plan ] [ Profile ]
          Always visible so users can freely toggle across all three Prepare features.
          Only hidden when the user is actively inside the timed full-screen exam. */}
      {!(activeSegment === 'prep_exam' && prepExamStep === 'exam') && (
        <TopNavBar
          segments={PREPARE_SEGMENTS}
          activeSegment={activeSegment}
          pillar="prepare"
          onSegmentChange={(segId) => {
            setActiveSegment(segId);
            if (segId === 'prep_exam') {
              setPrepExamStep('selection');
            }
          }}
          onBackPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          }}
          showProfile={true}
        />
      )}

      {/* Main Content Area based on Active Segment */}
      {activeSegment === 'pyq' ? (
        <PYQView
          chapterNumber={currentChapter.number}
          chapterName={currentChapter.name}
        />
      ) : activeSegment === 'prep_exam' ? (
        prepExamStep === 'selection' ? (
          /* SCREEN 1: SELECTION SCREEN */
          <PreparationExamSelectionView
            units={subjectUnits}
            pageTitle="Preparation Exam"
            backLabel="Back to Study Table"
            hideHeader={true}
            onBack={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(tabs)');
              }
            }}
            onStart={(config) => {
              setExamConfig(config);
              setPrepExamStep('exam');
            }}
          />
        ) : (
          /* SCREEN 2: EXAM SCREEN */
          <PreparationExamView
            subjectId={activeSubject.id}
            chapterNumber={examConfig.selectedUnits[0] || currentChapter.number}
            subjectName={`${activeSubject.name.toUpperCase()} · ${currentChapter.name.toUpperCase()}`}
            selectedUnits={examConfig.selectedUnits}
            questionCount={examConfig.questionCount}
            onBack={() => {
              setPrepExamStep('selection');
            }}
            onSubmit={() => {
              markResourceCompleted(activeSubject.id, currentChapter.number, 'prep_exam');
              setPrepExamStep('selection');
            }}
          />
        )
      ) : activeSegment === 'study_plan' ? (
        <StudyPlanView
          subjectId={activeSubject.id}
          chapterNumber={currentChapter.number}
          chapterTitle={currentChapter.name}
          unitName={currentChapter.name}
          subjectName={activeSubject.name}
          totalChapters={activeSubject.chapters?.length || 4}
          completedResources={currentChapter.completed || []}
          onMarkModuleCompleted={() => {
            markResourceCompleted(activeSubject.id, currentChapter.number, 'study_plan');
          }}
          onOpenTask={(task) => {
            if (task.type === 'video') {
              router.push({ pathname: '/(tabs)/learn', params: { segment: 'watch', chapter: currentChapter.number.toString() } });
            } else if (task.type === 'review') {
              router.push({ pathname: '/(tabs)/learn', params: { segment: 'read', chapter: currentChapter.number.toString() } });
            } else if (task.type === 'quiz') {
              router.push({ pathname: '/(tabs)/practice', params: { part: 'assessments', chapter: currentChapter.number.toString() } });
            } else if (task.type === 'mindmap') {
              router.push({ pathname: '/(tabs)/resources', params: { segment: 'mindmaps', chapter: currentChapter.number.toString() } });
            }
          }}
        />
      ) : null}

      {/* Chapter Selection Modal */}
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
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#23322B' : '#FFF6F1' }]}>
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
                      setShowChapterModal(false);
                    }}
                  >
                    <View style={[styles.modalNumBadge, isCur && styles.modalNumBadgeActive]}>
                      <Text style={[styles.modalNumText, isCur && styles.modalNumTextActive]}>
                        {ch.number}
                      </Text>
                    </View>
                    <Text style={[styles.modalChapterText, isCur && styles.modalChapterTextActive, { color: textColor }]}>
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
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  chapterPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 8,
    flex: 1,
  },
  chNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chapterPickerName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  examTag: {
    backgroundColor: '#064e3b22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  examTagText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  workspace: {
    flex: 1,
  },
  workspaceContent: {
    padding: Spacing.four,
  },
  contentWrap: {
    width: '100%',
  },
  introCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 14,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  introBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  marksBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  marksText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  focusText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  examTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginBottom: 10,
  },
  examTipText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
    fontWeight: '600',
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  keywordText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.four,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalChapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    gap: 12,
  },
  modalChapterRowActive: {
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  modalNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(128,128,128,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNumBadgeActive: {
    backgroundColor: '#22c55e',
  },
  modalNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888888',
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
    color: '#22c55e',
    fontWeight: '700',
  },
  examReadyCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 16,
  },
  backToSetupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backToSetupText: {
    fontSize: 14,
    fontWeight: '600',
  },
  examReadyHeader: {
    gap: 4,
  },
  examReadyTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  examReadySub: {
    fontSize: 14,
    fontWeight: '500',
  },
  configPillsRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  configPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

