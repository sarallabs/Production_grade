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


// Local bundled fallback hero images (matching the 4 web app chapter cards)
const CHAPTER_HERO_IMAGES: Record<number, any> = {
  1: require('@/assets/images/infographics/chapter-digestive-hero.png'),
  2: require('@/assets/images/infographics/chapter-metamorphosis-hero.png'),
  3: require('@/assets/images/infographics/chapter-weathering-hero.png'),
  4: require('@/assets/images/infographics/chapter-pollination-hero.png'),
};

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  subjectCode,
  subjectName = 'Entomology',
  courseName = 'B.Sc. Agriculture',
  isDark,
  onPress,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Chapter completion calculation for visual progress bar
  const progressInfo = manifestService.calculateChapterProgress(chapter);

  // Number of topics for this chapter (e.g. 4 for Ch1/Ch3, 6 for Ch2/Ch4)
  const topicCount =
    chapter.topicCount ??
    (Array.isArray(chapter.topics)
      ? chapter.topics.length
      : chapter.number === 2 || chapter.number === 4
      ? 6
      : 4);



  // Visual Theme Tokens matching user's design reference:
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
  const fallbackSource =
    CHAPTER_HERO_IMAGES[chapter.number] ||
    require('@/assets/images/chapter-hero.png');

  // Dynamic GCP Cloud Database URL for the chapter (media/hero.png)
  const cloudThumbUri =
    chapter.heroImage ||
    chapter.heroImageUrl ||
    getChapterThumbnailUrl(chapter.number, subjectCode || subjectName);

  const imageSource = imageError || !cloudThumbUri ? fallbackSource : { uri: cloudThumbUri };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const displayName = chapter.title || chapter.name;

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
          {/* Left Topic Illustration Box from Cloud Database / Local Fallback */}
          <View style={[styles.thumbnailBox, { backgroundColor: isDark ? '#E8EFEA' : '#35483F' }]}>
            <Image
              source={imageSource}
              placeholder={fallbackSource}
              placeholderContentFit="contain"
              style={styles.bookIllustration}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => setImageError(true)}
            />
          </View>

          {/* Center: Chapter Name, Subtitle, Topics Count, and Progress Bar */}
          <View style={styles.infoColumn}>
            <Text style={[styles.titleText, { color: titleColor }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.subtitleText, { color: subtitleColor }]} numberOfLines={1}>
              {subjectName} • Chapter {chapter.number}
            </Text>

            {/* Topics Count Badge */}
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.topicBadge,
                  { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(74, 222, 128, 0.2)' },
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={11}
                  color={isDark ? '#16a34a' : '#4ade80'}
                />
                <Text
                  style={[
                    styles.topicBadgeText,
                    { color: isDark ? '#16a34a' : '#4ade80' },
                  ]}
                >
                  {topicCount} Topics
                </Text>
              </View>
            </View>

            {/* Visual Progress Bar with Percentage Label */}
            <View style={styles.progressSection}>
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
              <Text
                style={[
                  styles.progressPercentText,
                  {
                    color:
                      progressInfo.percentage > 0
                        ? isDark
                          ? '#16a34a'
                          : '#4ade80'
                        : subtitleColor,
                  },
                ]}
              >
                {progressInfo.percentage}%
              </Text>
            </View>
          </View>

          {/* Right Action: Sleek Chevron Arrow */}
          <View style={[styles.chevronWrap, { backgroundColor: chevronBg }]}>
            <Ionicons name="chevron-forward" size={18} color={chevronColor} />
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
    borderRadius: 22,
    padding: 14,
    marginVertical: 7,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailBox: {
    width: 80,
    height: 76,
    borderRadius: 16,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bookIllustration: {
    width: '100%',
    height: '100%',
  },
  infoColumn: {
    flex: 1,
    marginLeft: 13,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
