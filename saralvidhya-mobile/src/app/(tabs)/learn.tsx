import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import StudyGuideReader from '@/components/study/StudyGuideReader';
import ListenScreen, { ListenMode } from '@/components/study/ListenScreen';
import VideosView from '@/components/study/VideosView';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import { BorderRadius, Spacing } from '@/constants/theme';

const LEARN_SEGMENTS: NavSegment[] = [
  { id: 'read', label: 'Read', vectorIcon: 'book-outline' },
  { id: 'listen', label: 'Listen', vectorIcon: 'headset-outline' },
  { id: 'watch', label: 'Videos', vectorIcon: 'play-circle-outline' },
];

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const { selectedSubject, selectedCourse, markResourceCompleted } = useCourseContext();
  const params = useLocalSearchParams<{ chapter?: string; segment?: string }>();
  const activeSubject = selectedSubject || ANGRAU_SUBJECTS[0];

  const [activeSegment, setActiveSegment] = useState<'read' | 'listen' | 'watch'>(
    params.segment === 'watch' ? 'watch' : params.segment === 'listen' ? 'listen' : 'read'
  );
  const [listenInitialMode, setListenInitialMode] = useState<ListenMode>('detailed');

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
  }, [params.chapter, selectedChapterNum]);

  const currentChapter =
    activeSubject.chapters.find((c) => c.number === selectedChapterNum) ||
    activeSubject.chapters[0];

  // DevMode CSS background: #f0f7f3
  const screenBg = isDark ? '#121E17' : '#F0F7F3';
  const textColor = isDark ? '#FFFFFF' : '#2D3E36';
  const subtextColor = isDark ? '#A6C5B3' : '#617269';

  const shortCode = activeSubject.code ? activeSubject.code.split(' ')[0] : 'ENTO';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* 1. TOP TOOLBAR: [ Back Arrow ] [ Read | Listen | Video ] [ Profile ] */}
      <TopNavBar
        segments={LEARN_SEGMENTS}
        activeSegment={activeSegment}
        onSegmentChange={(segId) => setActiveSegment(segId as any)}
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/(tabs)');
          }
        }}
        showProfile={true}
      />

      {/* 2. MAIN ACTIVE VIEW */}
      {activeSegment === 'watch' ? (
        <View style={{ flex: 1 }}>
          <VideosView
            subjectId={activeSubject.id}
            subjectName={activeSubject.name}
            chapterNumber={currentChapter.number}
            chapterName={currentChapter.name}
            onContinueLearning={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              markResourceCompleted(activeSubject.id, currentChapter.number, 'videos');
            }}
          />
        </View>
      ) : activeSegment === 'listen' ? (
        <ListenScreen
          chapterNumber={selectedChapterNum}
          chapterTitle={currentChapter.name}
          initialMode={listenInitialMode}
          onNavigateToRead={() => {
            markResourceCompleted(activeSubject.id, currentChapter.number, 'audio');
            setActiveSegment('read');
          }}
          onBackPress={() => setActiveSegment('read')}
        />
      ) : (
        <StudyGuideReader
          chapterNumber={selectedChapterNum}
          chapterTitle={currentChapter.name}
          subjectName={activeSubject.name}
          subjectId={activeSubject.id}
          onBackPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          }}
          onChapterPress={() => setShowChapterModal(true)}
          onBookmarkPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markResourceCompleted(activeSubject.id, currentChapter.number, 'summary');
          }}
          onCompleteReading={(mode) => {
            const resourceKey = mode === 'in_depth' ? 'detailed_view' : 'summary';
            markResourceCompleted(activeSubject.id, currentChapter.number, resourceKey);
          }}
          onOpenListen={(targetMode) => {
            setListenInitialMode(targetMode);
            setActiveSegment('listen');
          }}
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
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C2B23' : '#FEFEFE' }]}>
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
  topSegmentWrap: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  topSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 3,
    gap: 4,
    width: '100%',
    maxWidth: 400,
  },
  segmentPill: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    gap: 6,
  },
  segmentPillActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    borderBottomColor: 'rgba(128,128,128,0.12)',
    gap: 12,
  },
  modalChapterRowActive: {
    backgroundColor: 'rgba(20, 122, 67, 0.08)',
  },
  modalNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(128,128,128,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNumBadgeActive: {
    backgroundColor: '#147A43',
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
    color: '#147A43',
    fontWeight: '700',
  },
});
