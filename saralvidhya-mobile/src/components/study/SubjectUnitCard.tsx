import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Subject, Chapter, manifestService } from '@/api/manifestService';

export interface SubjectUnitCardProps {
  subject: Subject;
  degree?: string;
  isDark: boolean;
  onPress: () => void;
  onUnitSelect?: (subjectId: string, chapter: Chapter) => void;
  onProgressChange?: () => void;
}

export const SubjectUnitCard: React.FC<SubjectUnitCardProps> = ({
  subject,
  degree = 'B.Sc Agriculture',
  isDark,
  onPress,
  onUnitSelect,
  onProgressChange,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // DB-Driven subject and course calculations:
  // Title: Subject name (e.g. Entomology)
  const title = subject.name || subject.code;
  // Subtitle: Course name ONLY (e.g. B.Sc Agriculture) - NO university name
  const subtitle = degree || 'B.Sc Agriculture';
  const overallProgress = manifestService.calculateSubjectProgress(subject);

  // Units/chapters directly from database
  const chaptersList = subject.chapters || [];

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

  // Use the clean cropped book illustration matching the user's PNG (NO cockroach)
  const thumbSource = isDark
    ? require('@/assets/images/card_thumb_light.png')
    : require('@/assets/images/card_thumb_dark.png');

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleUnitPress = (ch: Chapter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChapter(ch);
  };

  const handleToggleResource = async (resourceKey: string) => {
    if (!selectedChapter) return;
    Haptics.selectionAsync();
    await manifestService.toggleChapterResource(subject.id, selectedChapter.number, resourceKey);
    // Refresh local selectedChapter state
    const updatedSubj = await manifestService.getSubject(subject.id);
    if (updatedSubj) {
      const updatedCh = updatedSubj.chapters.find((c) => c.number === selectedChapter.number);
      if (updatedCh) {
        setSelectedChapter({ ...updatedCh });
      }
    }
    if (onProgressChange) {
      onProgressChange();
    }
  };

  const selectedChProgress = selectedChapter
    ? manifestService.calculateChapterProgress(selectedChapter)
    : { percentage: 0, statusColor: '#9ca3af' };

  const resourcesList = [
    { key: 'summary', label: 'Summary', icon: 'document-text-outline' as const },
    { key: 'detailed_view', label: 'Deep Dive', icon: 'book-outline' as const },
    { key: 'flashcards', label: 'Flashcards', icon: 'card-outline' as const },
    { key: 'quiz', label: 'Practice Quiz', icon: 'help-circle-outline' as const },
  ];

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
        activeOpacity={0.92}
      >
        {/* Top Section: Clean Book Logo (No Cockroach) + Subject & Course Name + Progress Ring */}
        <View style={styles.topRow}>
          {/* Left Book Illustration Box - Exact 3 books with leaves */}
          <View style={styles.thumbnailBox}>
            <Image
              source={thumbSource}
              style={styles.bookIllustration}
              contentFit="cover"
            />
          </View>

          {/* Center: Subject Name & Course Name clearly shown (NO university name) */}
          <View style={styles.infoColumn}>
            <Text style={[styles.titleText, { color: titleColor }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.subtitleText, { color: subtitleColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          {/* Right Circular Subject Progress Indicator */}
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
                {overallProgress}%
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section: Unit Numbers & Chapter Completion % */}
        <View style={styles.chaptersRow}>
          {chaptersList.map((ch) => {
            const chProgress = manifestService.calculateChapterProgress(ch);
            return (
              <TouchableOpacity
                key={ch.number}
                style={styles.chapterCol}
                onPress={() => handleUnitPress(ch)}
                activeOpacity={0.7}
              >
                {/* Number Circle (1, 2, 3, 4, 5, 6... representing DB Units) */}
                <View style={[styles.numberCircle, { backgroundColor: circleBg }]}>
                  <Text style={[styles.numberText, { color: circleTextColor }]}>
                    {ch.number}
                  </Text>
                </View>

                {/* Percentage completed for this specific unit & colored checkmark */}
                <View style={styles.percentRow}>
                  <Text style={[styles.percentLabel, { color: statPercentColor }]}>
                    {chProgress.percentage}%
                  </Text>
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={chProgress.statusColor}
                    style={styles.checkIcon}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>

      {/* Interactive Modal when clicking any Unit Number:
          Displays the chapter name, description, and total user progress in this chapter */}
      <Modal
        visible={!!selectedChapter}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedChapter(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedChapter(null)}
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
            {selectedChapter && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header row with Unit tag & Close button */}
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalUnitTag,
                      { backgroundColor: isDark ? '#6E997E' : '#3E5247' },
                    ]}
                  >
                    <Ionicons name="bookmark" size={12} color="#FFFFFF" />
                    <Text style={styles.modalUnitTagText}>
                      Unit {selectedChapter.number} • {subject.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedChapter(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={isDark ? '#557A65' : '#D4A88E'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Chapter Name */}
                <Text
                  style={[
                    styles.modalChapterTitle,
                    { color: isDark ? '#1C2E24' : '#FFFFFF' },
                  ]}
                >
                  {selectedChapter.name}
                </Text>

                {/* Chapter Syllabus Description */}
                {selectedChapter.description ? (
                  <Text
                    style={[
                      styles.modalChapterDesc,
                      { color: isDark ? '#557A65' : '#A6C5B3' },
                    ]}
                  >
                    {selectedChapter.description}
                  </Text>
                ) : null}

                {/* Total Progress Completed in this Chapter */}
                <View
                  style={[
                    styles.progressBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(110, 153, 126, 0.12)'
                        : 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                >
                  <View style={styles.progressBoxHeader}>
                    <Text
                      style={[
                        styles.progressBoxTitle,
                        { color: isDark ? '#1C2E24' : '#FFFFFF' },
                      ]}
                    >
                      Chapter Progress
                    </Text>
                    <Text
                      style={[
                        styles.progressBoxPercent,
                        { color: selectedChProgress.statusColor },
                      ]}
                    >
                      {selectedChProgress.percentage}%
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.progressBarTrack,
                      { backgroundColor: isDark ? '#E2D8D1' : '#3D5449' },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${selectedChProgress.percentage}%`,
                          backgroundColor: selectedChProgress.statusColor,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Modules & Resource Checklist */}
                <Text
                  style={[
                    styles.resourcesHeader,
                    { color: isDark ? '#1C2E24' : '#FFFFFF' },
                  ]}
                >
                  Learning Modules (Tap to toggle)
                </Text>

                <View style={styles.resourceGrid}>
                  {resourcesList.map((res) => {
                    const isDone = (selectedChapter.completed || []).includes(res.key);
                    return (
                      <TouchableOpacity
                        key={res.key}
                        style={[
                          styles.resourceItem,
                          {
                            backgroundColor: isDark ? '#F4EDE7' : '#37493F',
                            borderColor: isDone
                              ? '#22c55e'
                              : isDark
                              ? '#E2D8D1'
                              : '#455C50',
                          },
                        ]}
                        onPress={() => handleToggleResource(res.key)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={res.icon}
                          size={16}
                          color={isDone ? '#22c55e' : isDark ? '#557A65' : '#A6C5B3'}
                        />
                        <Text
                          style={[
                            styles.resourceLabel,
                            {
                              color: isDark ? '#1C2E24' : '#FFFFFF',
                              fontWeight: isDone ? '700' : '500',
                            },
                          ]}
                        >
                          {res.label}
                        </Text>
                        <Ionicons
                          name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={isDone ? '#22c55e' : isDark ? '#C7BDB6' : '#5C7466'}
                          style={{ marginLeft: 'auto' }}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={[
                    styles.studyNowBtn,
                    { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' },
                  ]}
                  onPress={() => {
                    setSelectedChapter(null);
                    if (onUnitSelect) {
                      onUnitSelect(subject.id, selectedChapter);
                    } else {
                      onPress();
                    }
                  }}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[
                      styles.studyNowBtnText,
                      { color: isDark ? '#FFF6F1' : '#2D3E36' },
                    ]}
                  >
                    Open Unit Materials
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={isDark ? '#FFF6F1' : '#2D3E36'}
                  />
                </TouchableOpacity>
              </ScrollView>
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
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  subtitleText: {
    fontSize: 15,
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
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '82%',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalUnitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  modalUnitTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalChapterTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 6,
    lineHeight: 26,
  },
  modalChapterDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  progressBox: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  progressBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBoxPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  resourcesHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  resourceGrid: {
    gap: 8,
    marginBottom: 20,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  resourceLabel: {
    fontSize: 13,
  },
  studyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
  },
  studyNowBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
