import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useCourseContext } from '@/context/CourseContext';

export interface BreadcrumbBarProps {
  subjectName?: string;
  chapterNumber?: number | string;
  chapterTitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

/**
 * Standard Breadcrumb Header across all study, read, practice, and prepare screens.
 * Displays: "• [Subject] › Chapter [X]: [Title]" with optional back button.
 */
export default function BreadcrumbBar({
  subjectName,
  chapterNumber,
  chapterTitle,
  showBack = true,
  onBackPress,
  onPress,
  style,
  compact = false,
}: BreadcrumbBarProps) {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { selectedSubject, selectedChapter } = useCourseContext();

  const handleBack = () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/subjects');
    }
  };

  const handlePress = () => {
    if (onPress) {
      try {
        Haptics.selectionAsync().catch(() => {});
      } catch {}
      onPress();
    }
  };

  // Determine display values with safe fallbacks from CourseContext
  const rawSubject = subjectName || selectedSubject?.name || 'Entomology';
  const cleanSubject = rawSubject
    .replace(/^Fundamentals of\s+/i, '')
    .replace(/^Introductory\s+/i, '')
    .replace(/^Principles of\s+/i, '')
    .trim();

  const chNum = chapterNumber ?? selectedChapter?.number ?? 1;

  const rawChapterTitle =
    chapterTitle || selectedChapter?.name || 'Digestive System';
  const cleanChapterTitle = rawChapterTitle
    .replace(/^Chapter\s+\d+[:\s\-\.]*/i, '')
    .trim();

  const textColor = isDark ? '#E5E7EB' : '#2D3E36';
  const subtextColor = isDark ? '#A6C5B3' : '#617269';

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={17} color={textColor} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={onPress ? 0.7 : 1}
          style={styles.textWrap}
          disabled={!onPress}
        >
          <Text
            style={[styles.breadcrumbText, { color: subtextColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cleanSubject} › Chapter {chNum}: {cleanChapterTitle}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  containerCompact: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  breadcrumbText: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
