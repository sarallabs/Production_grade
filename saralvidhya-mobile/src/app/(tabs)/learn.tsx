import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

class SafeErrorBoundary extends React.Component<
  { sectionName: string; children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.warn(`[LearnScreen ${this.props.sectionName} Error]:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444', marginTop: 12 }}>
            Unable to display {this.props.sectionName}
          </Text>
          <Text style={{ fontSize: 13, color: '#888', marginTop: 6, textAlign: 'center' }}>
            {String(this.state.error?.message || 'A temporary rendering error occurred.')}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 18,
              backgroundColor: '#05996B',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 10,
            }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

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
            router.push('/subjects');
          }
        }}
        showProfile={true}
      />

      {/* 2. MAIN ACTIVE VIEW - Wrapped in SafeErrorBoundary */}
      {activeSegment === 'watch' ? (
        <SafeErrorBoundary sectionName="Video Lessons" key={`watch_${currentChapter.number}`}>
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
        </SafeErrorBoundary>
      ) : activeSegment === 'listen' ? (
        <SafeErrorBoundary sectionName="Audio Lessons" key={`listen_${selectedChapterNum}`}>
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
        </SafeErrorBoundary>
      ) : (
        <SafeErrorBoundary sectionName="Study Guide" key={`read_${selectedChapterNum}`}>
          <View style={{ flex: 1 }}>
            <StudyGuideReader
              key={`study_reader_${selectedChapterNum}_${currentChapter.name}`}
              chapterNumber={selectedChapterNum}
              chapterTitle={currentChapter.name}
              subjectName={activeSubject.name}
              subjectId={activeSubject.id}
              onBackPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push('/subjects');
                }
              }}
              onBookmarkPress={() => {
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch {}
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
          </View>
        </SafeErrorBoundary>
      )}
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
