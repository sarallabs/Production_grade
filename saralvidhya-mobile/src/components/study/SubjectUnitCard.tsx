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

export interface SubjectUnitCardProps {
  subject: Subject;
  degree?: string;
  isDark: boolean;
  onPress: () => void;
  onChapterPress?: (subject: Subject, chapter: any) => void;
  onUnitSelect?: (subjectId: string, chapter: any) => void;
  onProgressChange?: () => void;
}

export const SubjectUnitCard: React.FC<SubjectUnitCardProps> = ({
  subject,
  degree = 'B.Sc Agriculture',
  isDark,
  onPress,
}) => {
  // Title: Subject name (e.g. Entomology)
  const title = subject.name || subject.code;
  // Subtitle: Course degree (e.g. B.Sc Agriculture) - NO numbers present
  const subtitle = degree || 'B.Sc Agriculture';

  // Overall progress ratio for visual progress bar only (NO numeric digits)
  const overallProgress = manifestService.calculateSubjectProgress(subject);
  const progressRatio = Math.min(100, Math.max(0, overallProgress));

  // Visual Theme Tokens matching user's design reference:
  // Dark Screen (#2D3E36): Card is Light Cream #FFF6F1 with Sage Green thumbnail box
  // Light Screen (#FFF6F1): Card is Dark Forest #2D3E36 with Cream thumbnail box
  const cardBg = isDark ? '#FFF6F1' : '#2D3E36';
  const titleColor = isDark ? '#1C2E24' : '#FFFFFF';
  const subtitleColor = isDark ? '#5E8570' : '#E8B89D'; // Soft peach/salmon on dark card, sage on light card
  const trackBg = isDark ? '#E5DDD8' : 'rgba(255, 255, 255, 0.15)';
  const progressFill = isDark ? '#22c55e' : '#4ade80';
  const chevronBg = isDark ? 'rgba(45, 62, 54, 0.08)' : 'rgba(255, 255, 255, 0.12)';
  const chevronColor = isDark ? '#1C2E24' : '#FFFFFF';

  // Clean cropped book illustration matching user's PNG reference (NO cockroach)
  const thumbSource = isDark
    ? require('@/assets/images/card_thumb_light.png')
    : require('@/assets/images/card_thumb_dark.png');

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          {/* Left Book Illustration Box in squircle */}
          <View style={styles.thumbnailBox}>
            <Image
              source={thumbSource}
              style={styles.bookIllustration}
              contentFit="cover"
            />
          </View>

          {/* Center: Subject Name & Degree Subtitle (NO numbers present) */}
          <View style={styles.infoColumn}>
            <Text style={[styles.titleText, { color: titleColor }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.subtitleText, { color: subtitleColor }]} numberOfLines={1}>
              {subtitle}
            </Text>

            {/* Visual Progress Line Indicator (NO numbers or percentage text) */}
            <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressRatio}%`,
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressTrack: {
    height: 4,
    width: '85%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  chevronWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
