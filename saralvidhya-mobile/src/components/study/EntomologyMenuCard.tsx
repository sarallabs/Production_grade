import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Subject, manifestService } from '@/api/manifestService';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export interface ChapterProgressItem {
  chapter: number;
  name?: string;
  percentage: number;
  statusColor: string;
}

export interface EntomologyMenuCardProps {
  subject?: Subject;
  title?: string;
  subtitle?: string;
  isDark: boolean;
  onPress: () => void;
  onChapterPress?: (chapterNumber: number) => void;
  chapters?: ChapterProgressItem[];
}

const DEFAULT_CHAPTERS: ChapterProgressItem[] = [
  { chapter: 1, name: 'Digestive System', percentage: 100, statusColor: '#22c55e' },
  { chapter: 2, name: 'Metamorphosis', percentage: 100, statusColor: '#22c55e' },
  { chapter: 3, name: 'Weathering', percentage: 25, statusColor: '#3b82f6' },
  { chapter: 4, name: 'Pollination', percentage: 0, statusColor: '#f97316' },
];

export const EntomologyMenuCard: React.FC<EntomologyMenuCardProps> = ({
  subject,
  title = 'Entomology',
  subtitle = 'B.Sc Agriculture',
  isDark,
  onPress,
  onChapterPress,
  chapters,
}) => {
  const { isTablet } = useDeviceLayout();
  const displayTitle = subject?.name || title || 'Entomology';
  const displaySubtitle = subtitle || 'B.Sc Agriculture';

  const overallProgress = subject
    ? manifestService.calculateSubjectProgress(subject)
    : 50;

  const dynamicChapters: ChapterProgressItem[] = chapters || (subject?.chapters || []).slice(0, 4).map((ch) => {
    const info = manifestService.calculateChapterProgress(ch);
    return {
      chapter: ch.number,
      name: ch.name,
      percentage: info.percentage,
      statusColor: info.statusColor,
    };
  });

  const finalChapters = dynamicChapters.length > 0 ? dynamicChapters : DEFAULT_CHAPTERS;

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

  const thumbSource = isDark
    ? require('@/assets/images/card_thumb_light.png')
    : require('@/assets/images/card_thumb_dark.png');

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleChapterClick = (num: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onChapterPress) {
      onChapterPress(num);
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        {
          backgroundColor: cardBg,
          shadowColor: isDark ? '#000' : '#1a2921',
        },
        isTablet && { padding: 24, borderRadius: 28 },
      ]}
      onPress={handleCardPress}
      activeOpacity={0.92}
    >
      {/* Top Row: Thumbnail + Info (Entomology / B.Sc Agriculture) + Progress Ring */}
      <View style={[styles.topRow, isTablet && { marginBottom: 22 }]}>
        <View
          style={[
            styles.thumbnailBox,
            { backgroundColor: imgBoxBg },
            isTablet && { width: 92, height: 86, borderRadius: 22 },
          ]}
        >
          <Image
            source={thumbSource}
            style={styles.bookIllustration}
            contentFit="cover"
          />
        </View>

        <View style={[styles.infoColumn, isTablet && { marginLeft: 18 }]}>
          <Text
            style={[styles.titleText, { color: titleColor }, isTablet && { fontSize: 26, marginBottom: 6 }]}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>
          <Text
            style={[styles.subtitleText, { color: subtitleColor }, isTablet && { fontSize: 15 }]}
            numberOfLines={1}
          >
            {displaySubtitle}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressCircleTrack,
              {
                borderColor: ringTrackColor,
                borderTopColor: ringActiveColor,
                borderRightColor: ringActiveColor,
              },
              isTablet && { width: 56, height: 56, borderRadius: 28, borderWidth: 4.5 },
            ]}
          >
            <Text
              style={[styles.progressNumber, { color: ringTextColor }, isTablet && { fontSize: 14 }]}
            >
              {overallProgress}%
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Section: 1 2 3 4 Chapters with Progress & Status Checkmarks */}
      <View style={[styles.chaptersRow, isTablet && { paddingTop: 10 }]}>
        {finalChapters.map((item) => (
          <TouchableOpacity
            key={item.chapter}
            style={styles.chapterCol}
            onPress={() => handleChapterClick(item.chapter)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.numberCircle,
                { backgroundColor: circleBg },
                isTablet && { width: 48, height: 48, borderRadius: 24, marginBottom: 8 },
              ]}
            >
              <Text
                style={[styles.numberText, { color: circleTextColor }, isTablet && { fontSize: 18 }]}
              >
                {item.chapter}
              </Text>
            </View>

            <View style={styles.percentRow}>
              <Text
                style={[styles.percentLabel, { color: statPercentColor }, isTablet && { fontSize: 13 }]}
              >
                {item.percentage}%
              </Text>
              <Ionicons
                name="checkmark"
                size={isTablet ? 14 : 11}
                color={item.statusColor}
                style={styles.checkIcon}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export const SubjectMenuCard = EntomologyMenuCard;

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
    width: 76,
    height: 72,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookIllustration: {
    width: '100%',
    height: '100%',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  chaptersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
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
    fontSize: 11,
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: 1,
    marginTop: 0.5,
  },
});
