import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useCourseContext } from '@/context/CourseContext';
import { ANGRAU_SUBJECTS } from '@/api/manifestService';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import BreadcrumbBar from '@/components/navigation/BreadcrumbBar';
import AskMeWelcomeView from '@/components/study/AskMeWelcomeView';
import MindMapRadialDiagramView from '@/components/study/MindMapRadialDiagramView';
import KeyTakeawaysView from '@/components/study/KeyTakeawaysView';
import { BorderRadius, Spacing } from '@/constants/theme';

const RESOURCE_SEGMENTS: NavSegment[] = [
  { id: 'mindmaps', label: 'Mind Maps', vectorIcon: 'git-network-outline' },
  { id: 'key_takeaways', label: 'Key Takeaways', vectorIcon: 'bookmarks-outline' },
  { id: 'ask_me', label: 'Ask Me', vectorIcon: 'chatbubbles-outline' },
];

export default function ResourcesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chapter?: string; segment?: string }>();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const {
    selectedSubject,
    selectedChapter,
    selectChapter,
    selectChapterByNumber,
    markResourceCompleted,
  } = useCourseContext();
  const activeSubject = selectedSubject || ANGRAU_SUBJECTS[0];

  const [activeSegment, setActiveSegment] = useState<string>(
    params.segment && ['mindmaps', 'key_takeaways', 'ask_me'].includes(params.segment)
      ? params.segment
      : 'mindmaps'
  );
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    params.chapter ? parseInt(params.chapter, 10) : (selectedChapter?.number || 1)
  );
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);

  useEffect(() => {
    if (params.segment && ['ask_me', 'mindmaps', 'key_takeaways'].includes(params.segment)) {
      setActiveSegment(params.segment);
    }
  }, [params.segment]);

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

  const currentChapter =
    activeSubject.chapters.find((c) => c.number === selectedChapterNum) ||
    activeSubject.chapters[0];

  // Dynamically record chapter progress as the user goes through Mind Maps, Key Takeaways, or Ask Me
  useEffect(() => {
    if (!activeSubject?.id || !currentChapter?.number) return;
    markResourceCompleted(activeSubject.id, currentChapter.number, activeSegment);
  }, [activeSubject?.id, currentChapter?.number, activeSegment]);

  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const cardBg = isDark ? '#1E2B24' : '#FFFFFF';
  const cardBorder = isDark ? '#3D5449' : '#E5DDD8';
  const textColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#557A65';
  const tagBg = isDark ? '#26382F' : '#E8F1EB';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Top Navigation Bar with Back Button + Toggle Pills + Profile Avatar: Always visible across all 3 segments */}
      <TopNavBar
        segments={RESOURCE_SEGMENTS}
        activeSegment={activeSegment}
        pillar="resources"
        onSegmentChange={setActiveSegment}
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

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {activeSegment === 'mindmaps' ? (
          <MindMapRadialDiagramView
            subjectId={activeSubject.id}
            chapterNumber={currentChapter.number}
            chapterTitle={currentChapter.name}
            subjectName={activeSubject.name}
            onNavigateBack={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(tabs)');
              }
            }}
          />
        ) : activeSegment === 'key_takeaways' ? (
          <KeyTakeawaysView
            subjectId={activeSubject.id}
            chapterNumber={currentChapter.number}
            chapterName={currentChapter.name}
            subjectName={activeSubject.name}
          />
        ) : activeSegment === 'ask_me' ? (
          <AskMeWelcomeView
            chapterNumber={currentChapter.number}
            chapterName={currentChapter.name}
          />
        ) : null}
      </View>

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
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C2B23' : '#FEFEFE' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FEFEFE' : '#1C2E24' }]}>
                Select Chapter · {activeSubject.name}
              </Text>
              <TouchableOpacity onPress={() => setShowChapterModal(false)}>
                <Ionicons name="close" size={22} color={isDark ? '#A6C5B3' : '#596B66'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeSubject.chapters.map((ch) => {
                const isSelected = ch.number === selectedChapterNum;
                return (
                  <TouchableOpacity
                    key={ch.number}
                    style={[
                      styles.modalChapterRow,
                      isSelected && styles.modalChapterRowActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedChapterNum(ch.number);
                      selectChapter(ch);
                      setShowChapterModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.modalNumBadge,
                        isSelected && styles.modalNumBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalNumText,
                          isSelected && styles.modalNumTextActive,
                        ]}
                      >
                        {ch.number}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.modalChapterText,
                        { color: isDark ? '#FEFEFE' : '#1C2E24' },
                        isSelected && styles.modalChapterTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {ch.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    )}
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
  contentContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  toolCardWrap: {
    width: '100%',
  },
  overviewCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#064e3b22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  codeBadgeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  courseUni: {
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  chapterCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  chHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  chNum: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  chNumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  chName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  chDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  chMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chMetaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  chMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  downloadsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 16,
  },
  downloadsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  downloadsSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  downloadItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  docDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docType: {
    fontSize: 11,
    fontWeight: '700',
  },
  docDot: {
    fontSize: 11,
  },
  docSize: {
    fontSize: 11,
    fontWeight: '600',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  downloadBtnSaved: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  downloadBtnTextSaved: {
    color: '#22c55e',
  },
  placeholderCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
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
