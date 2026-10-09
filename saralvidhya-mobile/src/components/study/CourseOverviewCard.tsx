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
import { CourseOverviewData, CourseSubjectProgress } from '@/api/manifestService';

export interface CourseOverviewCardProps {
  data: CourseOverviewData;
  isDark: boolean;
  onPress: () => void;
  onSubjectPress?: (subject: CourseSubjectProgress) => void;
}

export const CourseOverviewCard: React.FC<CourseOverviewCardProps> = ({
  data,
  isDark,
  onPress,
  onSubjectPress,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<CourseSubjectProgress | null>(null);

  // Visual Theme Tokens matching user's design reference:
  // Dark Mode: Screen is #2D3E36 -> Card is #FFF6F1 (cream), text #1C2E24, badge #6E997E
  // Light Mode: Screen is #FFF6F1 -> Card is #2D3E36 (forest green), text #FFFFFF, badge #FFF6F1
  const cardBg = isDark ? '#FFF6F1' : '#2D3E36';
  const imgBoxBg = isDark ? '#6E997E' : '#FFF6F1';
  const titleColor = isDark ? '#1C2E24' : '#FFFFFF';
  const subtitleColor = isDark ? '#557A65' : '#D4A88E';

  const ringTrackColor = isDark ? '#E5DDD8' : '#3D5449';
  const ringActiveColor = isDark ? '#2D3E36' : '#FFFFFF';
  const ringTextColor = isDark ? '#1C2E24' : '#FFFFFF';

  const circleBg = isDark ? '#F1EBE5' : '#3E5247';
  const circleTextColor = isDark ? '#1C2E24' : '#FFFFFF';
  const statPercentColor = isDark ? '#3D5246' : '#E0ECE4';

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleNumberPress = (subj: CourseSubjectProgress) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSubject(subj);
    if (onSubjectPress) {
      onSubjectPress(subj);
    }
  };

  // Use the clean cropped book illustration matching the user's PNG (NO cockroach)
  const thumbSource = isDark
    ? require('@/assets/images/card_thumb_light.png')
    : require('@/assets/images/card_thumb_dark.png');

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
        {/* Top Header Section: Thumbnail + Course Info + Overall Progress */}
        <View style={styles.topRow}>
          {/* Left Book Illustration Box - Exact clean 3 books with leaves */}
          <View style={styles.thumbnailBox}>
            <Image
              source={thumbSource}
              style={styles.bookIllustration}
              contentFit="cover"
            />
          </View>

          {/* Center Course / Degree Title - NO University Name */}
          <View style={styles.infoColumn}>
            <Text style={[styles.titleText, { color: titleColor }]} numberOfLines={1}>
              {data.courseName || 'Entomology'}
            </Text>
            <Text style={[styles.subtitleText, { color: subtitleColor }]} numberOfLines={1}>
              {data.degree || 'B.Sc Agriculture'}
            </Text>
          </View>

          {/* Right Circular Overall Course Progress Ring */}
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
                {data.overallProgress}%
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section: Numbered Subject Pills & Subject Completion % */}
        <View style={styles.subjectsRow}>
          {data.subjects.map((subj) => (
            <TouchableOpacity
              key={subj.id}
              style={styles.subjectCol}
              onPress={() => handleNumberPress(subj)}
              activeOpacity={0.7}
            >
              {/* Number Circle (1, 2, 3... representing each Subject present in DB) */}
              <View style={[styles.numberCircle, { backgroundColor: circleBg }]}>
                <Text style={[styles.numberText, { color: circleTextColor }]}>
                  {subj.index}
                </Text>
              </View>

              {/* Percentage completed for this specific subject */}
              <View style={styles.percentRow}>
                <Text style={[styles.percentLabel, { color: statPercentColor }]}>
                  {subj.progressPercent}%
                </Text>
                <Ionicons
                  name="checkmark"
                  size={11}
                  color={subj.statusColor}
                  style={styles.checkIcon}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>

      {/* Modal / Popover shown when user taps a subject number */}
      <Modal
        visible={!!selectedSubject}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSubject(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedSubject(null)}
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
            {selectedSubject && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIndexBadge,
                      { backgroundColor: isDark ? '#6E997E' : '#3E5247' },
                    ]}
                  >
                    <Text style={styles.modalIndexText}>
                      Unit #{selectedSubject.index}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedSubject(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={isDark ? '#557A65' : '#D4A88E'}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.modalSubjectName,
                    { color: isDark ? '#1C2E24' : '#FFFFFF' },
                  ]}
                >
                  {selectedSubject.name}
                </Text>
                <Text
                  style={[
                    styles.modalSubjectCode,
                    { color: isDark ? '#557A65' : '#A6C5B3' },
                  ]}
                >
                  Code: {selectedSubject.code}
                </Text>

                <View style={styles.modalProgressSection}>
                  <View style={styles.modalProgressHeader}>
                    <Text
                      style={[
                        styles.modalProgressLabel,
                        { color: isDark ? '#3D5246' : '#E0ECE4' },
                      ]}
                    >
                      Subject Completion
                    </Text>
                    <Text
                      style={[
                        styles.modalProgressValue,
                        { color: isDark ? '#1C2E24' : '#FFFFFF' },
                      ]}
                    >
                      {selectedSubject.progressPercent}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.modalProgressBarTrack,
                      { backgroundColor: isDark ? '#E8E0DA' : '#3D5449' },
                    ]}
                  >
                    <View
                      style={[
                        styles.modalProgressBarFill,
                        {
                          width: `${selectedSubject.progressPercent}%`,
                          backgroundColor: selectedSubject.statusColor,
                        },
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.viewSubjectBtn,
                    { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' },
                  ]}
                  onPress={() => {
                    setSelectedSubject(null);
                    onPress();
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.viewSubjectBtnText,
                      { color: isDark ? '#FFF6F1' : '#2D3E36' },
                    ]}
                  >
                    Open Subject Units
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
    borderRadius: 24,
    padding: 16,
    marginVertical: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thumbnailBox: {
    width: 86,
    height: 78,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bookIllustration: {
    width: '90%',
    height: '90%',
  },
  infoColumn: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  progressCircleTrack: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  subjectsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  subjectCol: {
    alignItems: 'center',
    flex: 1,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  numberText: {
    fontSize: 14,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalIndexBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalIndexText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalSubjectName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubjectCode: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalProgressSection: {
    marginBottom: 20,
  },
  modalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalProgressValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalProgressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  viewSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  viewSubjectBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
