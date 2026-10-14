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
import { useAuth } from '@/context/AuthContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { ANGRAU_SUBJECTS } from '@/api/manifestService';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import FlashcardDeck from '@/components/flashcards/FlashcardDeck';
import AssessmentView from '@/components/study/AssessmentView';
import PYQView from '@/components/study/PYQView';
import { fetchFlashcards } from '@/services/contentService';
import { SAMPLE_FLASHCARDS, Flashcard } from '@/data/sampleFlashcards';
import { BorderRadius, Spacing } from '@/constants/theme';

const PRACTICE_SEGMENTS: NavSegment[] = [
  { id: 'learn', label: 'Learn', vectorIcon: 'book-outline' },
  { id: 'practice', label: 'Practice', vectorIcon: 'headset-outline' },
  { id: 'watch', label: 'Watch', vectorIcon: 'play-circle-outline' },
];

export default function PracticeScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { persona } = useAuth();
  const { isTablet } = useDeviceLayout();
  const params = useLocalSearchParams<{ chapter?: string; segment?: string }>();
  const activeSubject = ANGRAU_SUBJECTS[0];

  const [activeSegment, setActiveSegment] = useState<string>('practice');

  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    params.chapter ? parseInt(params.chapter, 10) : 1
  );
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);
  const [flashcardsList, setFlashcardsList] = useState<Flashcard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState<boolean>(true);

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
  }, [selectedChapterNum, persona]);

  const currentChapter =
    activeSubject.chapters.find((c) => c.number === selectedChapterNum) ||
    activeSubject.chapters[0];

  const screenBg = isDark ? '#23322B' : '#FFF6F1';
  const cardBg = isDark ? '#1E2B24' : '#FFFFFF';
  const cardBorder = isDark ? '#3D5449' : '#E5DDD8';
  const textColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#557A65';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Top Navigation Bar with [Learn] [Practice] [Watch] + Profile Avatar (Matches User Screenshots) */}
      <TopNavBar
        segments={PRACTICE_SEGMENTS}
        activeSegment={activeSegment}
        onSegmentChange={(id) => {
          if (id === 'learn') {
            router.push('/(tabs)/learn');
          } else if (id === 'watch') {
            router.push({ pathname: '/(tabs)/learn', params: { segment: 'watch' } });
          } else {
            setActiveSegment(id);
          }
        }}
        showProfile={true}
      />

      {/* Centered Flashcard Area (Matches Screenshots) */}
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
            cards={
              flashcardsList.length > 0
                ? flashcardsList
                : SAMPLE_FLASHCARDS[currentChapter.number] || SAMPLE_FLASHCARDS[1]
            }
            chapterNumber={currentChapter.number}
          />
        )}
      </View>

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
  flashcardCenterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  statIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
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
