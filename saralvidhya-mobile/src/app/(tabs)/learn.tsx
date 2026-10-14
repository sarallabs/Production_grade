import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/context/ThemeContext';
import { useAuth, PersonaType } from '@/context/AuthContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { ANGRAU_SUBJECTS } from '@/api/manifestService';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import StudyGuideReader from '@/components/study/StudyGuideReader';
import ListenScreen, { ListenMode } from '@/components/study/ListenScreen';
import MarkdownReader from '@/components/study/MarkdownReader';
import MindmapView from '@/components/study/MindmapView';
import PodcastsView from '@/components/study/PodcastsView';
import VideosView from '@/components/study/VideosView';
import {
  fetchQuickStudyGuide,
  fetchDetailedNotes,
  fetchMindmap,
  MindmapData,
} from '@/services/contentService';
import { SAMPLE_STUDY_CONTENT } from '@/data/sampleStudyContent';
import { BorderRadius, Spacing } from '@/constants/theme';

const LEARN_SEGMENTS: NavSegment[] = [
  { id: 'learn', label: 'Learn', vectorIcon: 'book-outline' },
  { id: 'practice', label: 'Practice', vectorIcon: 'headset-outline' },
  { id: 'watch', label: 'Watch', vectorIcon: 'play-circle-outline' },
];

export default function LearnScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { persona, updatePersona } = useAuth();
  const { isTablet, isLandscape } = useDeviceLayout();
  const params = useLocalSearchParams<{ chapter?: string; segment?: string }>();
  const activeSubject = ANGRAU_SUBJECTS[0];

  const [activeSegment, setActiveSegment] = useState<string>(
    params.segment === 'watch' ? 'watch' : params.segment === 'listen' ? 'listen' : 'learn'
  );
  const [listenInitialMode, setListenInitialMode] = useState<ListenMode>('detailed');

  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    params.chapter ? parseInt(params.chapter, 10) : 1
  );
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);
  const [readSubMode, setReadSubMode] = useState<'quick' | 'detailed'>('quick');

  const [quickStudyText, setQuickStudyText] = useState<string>('');
  const [detailedNotesText, setDetailedNotesText] = useState<string>('');
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(true);

  useEffect(() => {
    if (params.chapter) {
      const parsed = parseInt(params.chapter, 10);
      if (!isNaN(parsed) && parsed !== selectedChapterNum) {
        setSelectedChapterNum(parsed);
      }
    }
  }, [params.chapter, selectedChapterNum]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoadingContent(true);

    Promise.all([
      fetchQuickStudyGuide(activeSubject.id, selectedChapterNum, persona, controller.signal),
      fetchDetailedNotes(activeSubject.id, selectedChapterNum, persona, controller.signal),
      fetchMindmap(activeSubject.id, selectedChapterNum, controller.signal),
    ])
      .then(([quick, detailed, mMap]) => {
        if (isMounted) {
          setQuickStudyText(quick);
          setDetailedNotesText(detailed);
          setMindmapData(mMap);
          setIsLoadingContent(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('Learn content loading error:', err);
        }
        if (isMounted) setIsLoadingContent(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedChapterNum, persona]);

  const currentChapter =
    activeSubject.chapters.find((c) => c.number === selectedChapterNum) ||
    activeSubject.chapters[0];

  const screenBg = isDark ? '#23322B' : '#FFF6F1';
  const cardBg = isDark ? '#1E2B24' : '#FFFFFF';
  const cardBorder = isDark ? '#3D5449' : '#E5DDD8';
  const textColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#557A65';
  const pillBg = isDark ? '#1C2822' : '#F7EBE3';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {activeSegment === 'watch' ? (
        <View style={{ flex: 1 }}>
          <TopNavBar
            segments={LEARN_SEGMENTS}
            activeSegment={activeSegment}
            onSegmentChange={(id) => {
              if (id === 'practice') {
                router.push('/(tabs)/practice');
              } else {
                setActiveSegment(id);
              }
            }}
            showProfile={true}
          />
          <VideosView
            subjectId={activeSubject.id}
            chapterNumber={currentChapter.number}
            chapterName={currentChapter.name}
          />
        </View>
      ) : activeSegment === 'listen' ? (
        <ListenScreen
          chapterNumber={selectedChapterNum}
          chapterTitle={currentChapter.name}
          initialMode={listenInitialMode}
          onNavigateToRead={() => setActiveSegment('learn')}
          onBackPress={() => setActiveSegment('learn')}
        />
      ) : (
        <StudyGuideReader
          chapterNumber={selectedChapterNum}
          chapterTitle={currentChapter.name}
          subjectName={activeSubject.name}
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
  depthPills: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    padding: 2,
    gap: 2,
  },
  depthPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  depthPillActive: {
    backgroundColor: '#22c55e',
  },
  depthPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  depthPillTextActive: {
    color: '#FFFFFF',
  },
  workspace: {
    flex: 1,
  },
  workspaceContent: {
    padding: Spacing.four,
  },
  toolCardWrap: {
    width: '100%',
  },
  readToggleWrap: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  readSubBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  readSubBtnActive: {
    backgroundColor: '#22c55e',
  },
  readSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A9E92',
  },
  readSubTextActive: {
    color: '#FFFFFF',
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
});
