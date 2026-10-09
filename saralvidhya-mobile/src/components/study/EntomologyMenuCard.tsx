import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface ChapterProgress {
  chapter: number;
  percentage: number;
  statusColor: string;
}

export interface EntomologyMenuCardProps {
  isDark: boolean;
  onPress: () => void;
  title?: string;
  subtitle?: string;
  progress?: number;
  chapters?: ChapterProgress[];
}

const DEFAULT_CHAPTERS: ChapterProgress[] = [
  { chapter: 1, percentage: 100, statusColor: '#22c55e' },
  { chapter: 2, percentage: 100, statusColor: '#22c55e' },
  { chapter: 3, percentage: 25, statusColor: '#3b82f6' },
  { chapter: 4, percentage: 0, statusColor: '#f97316' },
  { chapter: 5, percentage: 0, statusColor: '#f97316' },
  { chapter: 6, percentage: 0, statusColor: '#f97316' },
];

export const EntomologyMenuCard: React.FC<EntomologyMenuCardProps> = ({
  isDark,
  onPress,
  title = 'Entomology',
  subtitle = 'B.Sc Agriculture',
  progress = 50,
  chapters = DEFAULT_CHAPTERS,
}) => {
  // Color tokens matching user reference images
  // In Dark Theme (Screen is #2D3E36): Card is #FFF6F1
  // In Light Theme (Screen is #FFF6F1): Card is #2D3E36
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        {
          backgroundColor: cardBg,
          shadowColor: isDark ? '#000' : '#1a2921',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      {/* Top Section: Thumbnail + Info + Progress Ring */}
      <View style={styles.topRow}>
        {/* Left Book Illustration Box */}
        <View style={[styles.thumbnailBox, { backgroundColor: imgBoxBg }]}>
          <Image
            source={require('@/assets/images/subject-entomology-icon.png')}
            style={styles.bookIllustration}
            contentFit="contain"
          />
        </View>

        {/* Center Title & Subtitle */}
        <View style={styles.infoColumn}>
          <Text style={[styles.titleText, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitleText, { color: subtitleColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Right Circular Progress Indicator */}
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
              {progress}%
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Section: Chapter Numbers & Progress Checkmarks */}
      <View style={styles.chaptersRow}>
        {chapters.map((item) => (
          <View key={item.chapter} style={styles.chapterCol}>
            {/* Number Circle */}
            <View style={[styles.numberCircle, { backgroundColor: circleBg }]}>
              <Text style={[styles.numberText, { color: circleTextColor }]}>
                {item.chapter}
              </Text>
            </View>

            {/* Percentage & Checkmark */}
            <View style={styles.percentRow}>
              <Text style={[styles.percentLabel, { color: statPercentColor }]}>
                {item.percentage}%
              </Text>
              <Ionicons
                name="checkmark"
                size={11}
                color={item.statusColor}
                style={styles.checkIcon}
              />
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 22,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '800',
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  percentLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 1,
    marginTop: 0.5,
  },
});
