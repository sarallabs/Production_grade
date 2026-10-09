import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Chapter, manifestService } from '@/api/manifestService';

export interface ChapterCardProps {
  chapter: Chapter;
  subjectName?: string;
  courseName?: string;
  isDark: boolean;
  onPress: () => void;
  onToolPress?: (toolId: string) => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  subjectName = 'Entomology',
  courseName = 'B.Sc Agriculture',
  isDark,
  onPress,
  onToolPress,
}) => {
  const [selectedToolModal, setSelectedToolModal] = useState<any | null>(null);

  // Chapter completion calculation
  const progressInfo = manifestService.calculateChapterProgress(chapter);

  // 5 Study Materials & Modules for this chapter
  const studyModules = [
    {
      index: 1,
      id: 'summary',
      name: 'Quick Study',
      icon: 'document-text-outline' as const,
      isDone: (chapter.completed || []).includes('summary'),
    },
    {
      index: 2,
      id: 'detailed',
      name: 'Detailed Notes',
      icon: 'book-outline' as const,
      isDone: (chapter.completed || []).includes('detailed_view') || (chapter.completed || []).includes('detailed'),
    },
    {
      index: 3,
      id: 'flashcards',
      name: 'Flashcards',
      icon: 'card-outline' as const,
      isDone: (chapter.completed || []).includes('flashcards'),
    },
    {
      index: 4,
      id: 'assessment',
      name: 'Practice Quiz',
      icon: 'help-circle-outline' as const,
      isDone: (chapter.completed || []).includes('quiz') || (chapter.completed || []).includes('assessment'),
    },
    {
      index: 5,
      id: 'podcasts',
      name: 'Podcasts',
      icon: 'mic-outline' as const,
      isDone: (chapter.completed || []).includes('podcasts'),
    },
  ];

  // Visual Theme Tokens matching user's exact PNG reference:
  // Dark Screen (#2D3E36): Card is Light Cream #FFF6F1 with Sage Green thumbnail box
  // Light Screen (#FFF6F1): Card is Dark Forest #2D3E36 with Cream thumbnail box
  const cardBg = isDark ? '#FFF6F1' : '#2D3E36';
  const titleColor = isDark ? '#1C2E24' : '#FFFFFF';
  const subtitleColor = isDark ? '#5E8570' : '#E8B89D'; // Soft peach/salmon on dark card, sage on light card

  const ringTrackColor = isDark ? '#E5DDD8' : '#3D5449';
  const ringActiveColor = isDark ? '#2D3E36' : '#FFFFFF';
  const ringTextColor = isDark ? '#1C2E24' : '#FFFFFF';

  const circleBg = isDark ? '#EFE9E4' : '#3D5247';
  const circleTextColor = isDark ? '#1C2E24' : '#FFFFFF';
  const statPercentColor = isDark ? '#3D5246' : '#E0ECE4';

  const thumbSource = isDark
    ? require('@/assets/images/card_thumb_light.png')
    : require('@/assets/images/card_thumb_dark.png');

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const handleModuleClick = (mod: typeof studyModules[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onToolPress) {
      onToolPress(mod.id);
    } else {
      setSelectedToolModal(mod);
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <TouchableOpacity
        style={[
          styles.cardContainer,
          {
            backgroundColor: cardBg,
            shadowColor: isDark ? '#000' : '#1a2921',
          },
        ]}
        onPress={handleCardPress}
        activeOpacity={0.9}
      >
        {/* Top Header: Clean 3-Book Logo + Chapter Name (Weathering, Pollination...) + Subtitle */}
        <View style={styles.topRow}>
          {/* Left Book Illustration Box */}
          <View style={styles.thumbnailBox}>
            <Image
              source={thumbSource}
              style={styles.bookIllustration}
              contentFit="cover"
            />
          </View>

          {/* Center: Chapter Name & Course Subtitle */}
          <View style={styles.infoColumn}>
            <Text style={[styles.titleText, { color: titleColor }]} numberOfLines={1}>
              {chapter.name}
            </Text>
            <Text style={[styles.subtitleText, { color: subtitleColor }]} numberOfLines={1}>
              {subjectName} • {courseName}
            </Text>
          </View>

          {/* Right Circular Progress Ring */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressCircleTrack,
                {
                  borderColor: ringTrackColor,
                  borderTopColor: ringActiveColor,
                  borderRightColor: ringActiveColor,
                },
              ]}
            >
              <Text style={[styles.progressNumber, { color: ringTextColor }]}>
                {progressInfo.percentage}%
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section: 5 Study Material Numbers with Status Checkmarks */}
        <View style={styles.chaptersRow}>
          {studyModules.map((mod) => {
            const pct = mod.isDone ? 100 : 0;
            const statusColor = mod.isDone ? '#22c55e' : '#f97316';
            return (
              <TouchableOpacity
                key={mod.id}
                style={styles.chapterCol}
                onPress={() => handleModuleClick(mod)}
                activeOpacity={0.7}
              >
                {/* Number Circle (1: Summary, 2: Notes, 3: Flashcards, 4: Quiz, 5: Podcasts) */}
                <View style={[styles.numberCircle, { backgroundColor: circleBg }]}>
                  <Text style={[styles.numberText, { color: circleTextColor }]}>
                    {mod.index}
                  </Text>
                </View>

                {/* Percentage & Checkmark */}
                <View style={styles.percentRow}>
                  <Text style={[styles.percentLabel, { color: statPercentColor }]}>
                    {pct}%
                  </Text>
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={statusColor}
                    style={styles.checkIcon}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>

      {/* Popover Preview for individual study material */}
      <Modal
        visible={!!selectedToolModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedToolModal(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedToolModal(null)}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#FFF6F1' : '#2D3E36',
                borderColor: isDark ? '#E5DDD8' : '#3D5449',
              },
            ]}
          >
            {selectedToolModal && (
              <>
                <View style={styles.modalHeader}>
                  <Text
                    style={[
                      styles.modalUnitTag,
                      { color: isDark ? '#557A65' : '#A6C5B3' },
                    ]}
                  >
                    Module #{selectedToolModal.index} • {chapter.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedToolModal(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={isDark ? '#557A65' : '#D4A88E'}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.modalToolTitle,
                    { color: isDark ? '#1C2E24' : '#FFFFFF' },
                  ]}
                >
                  {selectedToolModal.name}
                </Text>

                <Text
                  style={[
                    styles.modalStatusText,
                    { color: selectedToolModal.isDone ? '#22c55e' : '#f97316' },
                  ]}
                >
                  Status: {selectedToolModal.isDone ? 'Completed (100%)' : 'Not Started (0%)'}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.openStudyBtn,
                    { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' },
                  ]}
                  onPress={() => {
                    const toolId = selectedToolModal.id;
                    setSelectedToolModal(null);
                    if (onToolPress) {
                      onToolPress(toolId);
                    } else {
                      onPress();
                    }
                  }}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[
                      styles.openStudyBtnText,
                      { color: isDark ? '#FFF6F1' : '#2D3E36' },
                    ]}
                  >
                    Learn & Study Material Now
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={isDark ? '#FFF6F1' : '#2D3E36'}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
  },
  cardContainer: {
    width: '100%',
    borderRadius: 26,
    padding: 18,
    marginVertical: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  thumbnailBox: {
    width: 86,
    height: 82,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bookIllustration: {
    width: '100%',
    height: '100%',
  },
  infoColumn: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  progressCircleTrack: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  chaptersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  chapterCol: {
    alignItems: 'center',
    flex: 1,
  },
  numberCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  numberText: {
    fontSize: 17,
    fontWeight: '700',
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalUnitTag: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalToolTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 20,
  },
  openStudyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
  },
  openStudyBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
