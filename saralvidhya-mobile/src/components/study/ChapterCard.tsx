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
import { Chapter, manifestService } from '@/api/manifestService';
import { getChapterThumbnailUrl } from '@/services/contentService';

export interface ChapterCardProps {
  chapter: Chapter;
  subjectCode?: string;
  subjectName?: string;
  courseName?: string;
  isDark: boolean;
  onPress: () => void;
  onToolPress?: (toolId: string) => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  subjectCode,
  subjectName = 'Entomology',
  courseName = 'B.Sc. Agriculture',
  isDark,
  onPress,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Chapter completion calculation for visual progress line
  const progressInfo = manifestService.calculateChapterProgress(chapter);

  // Visual Theme Tokens matching user's exact PNG reference:
  // Dark Screen (#2D3E36): Card is Light Cream #FFF6F1 with Sage Green thumbnail box
  // Light Screen (#FFF6F1): Card is Dark Forest #2D3E36 with Cream thumbnail box
  const cardBg = isDark ? '#FFF6F1' : '#2D3E36';
  const titleColor = isDark ? '#1C2E24' : '#FFFFFF';
  const subtitleColor = isDark ? '#5E8570' : '#E8B89D';
  const trackBg = isDark ? '#E5DDD8' : 'rgba(255, 255, 255, 0.15)';
  const progressFill = isDark ? '#22c55e' : '#4ade80';
  const chevronBg = isDark ? 'rgba(45, 62, 54, 0.08)' : 'rgba(255, 255, 255, 0.12)';
  const chevronColor = isDark ? '#1C2E24' : '#FFFFFF';

  // Dedicated topic fallback if offline or failed to fetch from GCP cloud database
  const fallbackSource = chapter.number === 3
    ? require('@/assets/images/weathering_thumb.png')
    : isDark
      ? require('@/assets/images/card_thumb_light.png')
      : require('@/assets/images/card_thumb_dark.png');

  // Dynamic GCP Cloud Database URL for the chapter
  const cloudThumbUri = getChapterThumbnailUrl(chapter.number, subjectCode || subjectName);
  const imageSource = imageError || !cloudThumbUri ? fallbackSource : { uri: cloudThumbUri };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
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
        activeOpacity={0.92}
      >
        <View style={styles.contentRow}>
          {/* Left Topic Illustration Box from Cloud GCS */}
          <View style={[styles.thumbnailBox, { backgroundColor: isDark ? '#709180' : '#41594D' }]}>
            <Image
              source={imageSource}
              placeholder={fallbackSource}
              placeholderContentFit="cover"
              style={styles.bookIllustration}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
              onError={() => setImageError(true)}
            />
          </View>

          {/* Center: Chapter Name & Subject Subtitle (NO numbers or ticks) */}
          <View style={styles.infoColumn}>
            <Text style={[styles.titleText, { color: titleColor }]} numberOfLines={1}>
              {chapter.name}
            </Text>
            <Text style={[styles.subtitleText, { color: subtitleColor }]} numberOfLines={1}>
              {subjectName} • Chapter {chapter.number}
            </Text>

            {/* Visual Progress Line Indicator (NO numbers or checkmark ticks) */}
            <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.max(0, progressInfo.percentage))}%`,
                    backgroundColor: progressFill,
                  },
                ]}
              />
            </View>
          </View>

          {/* Right Action: Sleek Chevron Arrow (NO numbers) */}
          <View style={[styles.chevronWrap, { backgroundColor: chevronBg }]}>
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </View>
        </View>
      </TouchableOpacity>
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
    marginVertical: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailBox: {
    width: 76,
    height: 72,
    borderRadius: 18,
    overflow: 'hidden',
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
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  subtitleText: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressTrack: {
    width: '100%',
    height: 4.5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  chevronWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
