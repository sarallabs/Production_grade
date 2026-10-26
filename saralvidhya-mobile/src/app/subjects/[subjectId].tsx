import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useCourseContext } from '@/context/CourseContext';
import { manifestService, Subject, Chapter } from '@/api/manifestService';
import { ChapterCard } from '@/components/study/ChapterCard';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export default function SubjectChaptersScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const { isTablet, columns } = useDeviceLayout();
  const { selectSubject, selectChapter, selectedCourse } = useCourseContext();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadSubjectData();
  }, [subjectId]);

  const loadSubjectData = async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const allSubjects = await manifestService.getSubjects();
      const sub =
        allSubjects.find((s) => s.id === subjectId || s.code.toLowerCase().replace(/\s+/g, '_') === subjectId) ||
        (await manifestService.getSubject(subjectId));
      if (sub) {
        setSubject(sub);
        selectSubject(sub);
      }
    } catch (e) {
      console.warn('Failed to load subject in [subjectId]', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubjectData();
    setRefreshing(false);
  };

  const handleOpenStudyMaterials = (chapter: Chapter, toolId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (subject) {
      selectSubject(subject);
    }
    selectChapter(chapter);

    if (toolId === 'flashcards') {
      router.push({
        pathname: '/(tabs)/practice',
        params: {
          part: 'revise',
          chapter: chapter.number.toString(),
        },
      });
    } else if (toolId === 'quiz' || toolId === 'assessment') {
      router.push({
        pathname: '/(tabs)/practice',
        params: {
          part: 'assessments',
          chapter: chapter.number.toString(),
        },
      });
    } else if (toolId === 'audio' || toolId === 'podcasts' || toolId === 'listen') {
      router.push({
        pathname: '/(tabs)/learn',
        params: {
          segment: 'listen',
          chapter: chapter.number.toString(),
        },
      });
    } else if (toolId === 'videos' || toolId === 'watch') {
      router.push({
        pathname: '/(tabs)/learn',
        params: {
          segment: 'watch',
          chapter: chapter.number.toString(),
        },
      });
    } else {
      router.push({
        pathname: '/(tabs)/learn',
        params: {
          segment: 'read',
          chapter: chapter.number.toString(),
        },
      });
    }
  };

  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const headerTextColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#688875';
  const iconBtnBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(45, 62, 54, 0.08)';

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: screenBg }]}>
        <ActivityIndicator size="large" color={isDark ? '#4ade80' : '#22c55e'} />
        <Text style={[styles.loadingText, { color: subtextColor }]}>
          Loading syllabus chapters...
        </Text>
      </View>
    );
  }

  const courseDisplayName = selectedCourse?.name || user?.program || 'B.Sc. (Hons) Agriculture';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Top Header */}
      <View style={styles.navBar}>
        <View style={styles.leftNavActions}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: iconBtnBg }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            activeOpacity={0.8}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color={headerTextColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.treeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace('/courses');
            }}
            hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessibilityLabel="Go to Courses"
            accessibilityRole="button"
          >
            <Image
              source={require('@/assets/images/saral-tree.png')}
              style={styles.headerTreeImage}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.navTitleContainer}>
          <Text style={[styles.navTitle, { color: headerTextColor }]} numberOfLines={1}>
            {subject?.name || 'Subject Units'}
          </Text>
          <Text style={[styles.navSubtitle, { color: subtextColor }]} numberOfLines={1}>
            {subject?.code} • {subject?.credits || '3 (2+1) Credits'} • {subject?.chapters.length || 0} Units
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4ade80' : '#22c55e'}
          />
        }
      >
        <View style={isTablet ? styles.tabletColumn : undefined}>
          {/* Helper Banner */}
          <View
            style={[
              styles.helperBanner,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(45, 62, 54, 0.05)' },
            ]}
          >
            <Ionicons name="book-outline" size={17} color={isDark ? '#4ade80' : '#22c55e'} />
            <Text style={[styles.helperBannerText, { color: subtextColor }]}>
              {courseDisplayName} • Official curriculum units. Tap any module to study.
            </Text>
          </View>

          {/* Chapters List using ChapterCard */}
          <View style={isTablet ? styles.tabletGrid : undefined}>
            {(subject?.chapters || []).map((ch) => (
              <View
                key={ch.number}
                style={isTablet ? { width: columns === 3 ? '32%' : '48.5%' } : undefined}
              >
                <ChapterCard
                  chapter={ch}
                  subjectCode={subject?.code || 'ENTO 131'}
                  subjectName={subject?.name || 'Entomology'}
                  courseName={courseDisplayName}
                  isDark={isDark}
                  onPress={() => handleOpenStudyMaterials(ch)}
                  onToolPress={(toolId) => handleOpenStudyMaterials(ch, toolId)}
                />
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 40,
  },
  tabletScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  tabletColumn: {
    width: '100%',
    maxWidth: 960,
  },
  tabletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 40,
    paddingBottom: 14,
    gap: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  treeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  headerTreeImage: {
    width: 26,
    height: 32,
  },
  navTitleContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  navSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  helperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  helperBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
  },
});
