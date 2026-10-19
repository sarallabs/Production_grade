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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useCourseContext } from '@/context/CourseContext';
import { manifestService, Subject, Chapter } from '@/api/manifestService';
import { ChapterCard } from '@/components/study/ChapterCard';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export default function SubjectUnitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string; courseId?: string; courseName?: string }>();
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const { isTablet, columns } = useDeviceLayout();
  const { selectedSubject, selectSubject } = useCourseContext();

  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (selectedSubject && (!params.subjectId || params.subjectId === selectedSubject.id)) {
      setActiveSubject(selectedSubject);
      setChapters(selectedSubject.chapters || []);
      setLoading(false);
    } else {
      loadSubjectAndUnits();
    }
  }, [params.subjectId, selectedSubject]);

  const loadSubjectAndUnits = async () => {
    setLoading(true);
    try {
      const allSubjects = await manifestService.getSubjects();
      const targetId = params.subjectId || selectedSubject?.id || 'ento_131';
      const found = allSubjects.find((s) => s.id === targetId || s.code.toLowerCase().replace(/\s+/g, '_') === targetId) || allSubjects[0];
      setActiveSubject(found);
      setChapters(found?.chapters || []);
      if (found && found.id !== selectedSubject?.id) {
        selectSubject(found);
      }
    } catch (e) {
      console.warn('Failed to load subject units from DB', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const subjects = await manifestService.getSubjects();
    const targetId = params.subjectId || selectedSubject?.id || 'ento_131';
    const found = subjects.find((s) => s.id === targetId || s.code.toLowerCase().replace(/\s+/g, '_') === targetId) || subjects[0];
    setActiveSubject(found);
    setChapters(found?.chapters || []);
    setRefreshing(false);
  };

  // Screen background matching user reference images:
  // Dark Theme: #2D3E36
  // Light Theme: #FFF6F1
  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const headerTextColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#688875';
  const iconBtnBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(45, 62, 54, 0.08)';

  // Navigate to corresponding tab in 4-tab study workspace
  const handleOpenStudyMaterials = (chapter: Chapter, toolId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (toolId === 'flashcards') {
      router.push({
        pathname: '/(tabs)/practice',
        params: {
          part: 'revise',
          chapter: chapter.number.toString(),
        },
      });
    } else if (toolId === 'quiz') {
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

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={screenBg}
      />

      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: iconBtnBg }]}
          onPress={() => router.replace('/courses')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={headerTextColor} />
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={[styles.navTitle, { color: headerTextColor }]}>
            {activeSubject?.name || 'Entomology'}
          </Text>
          <Text style={[styles.navSubtitle, { color: subtextColor }]}>
            {params.courseName || user?.program || 'B.Sc Agriculture'} • {chapters.length} Units
          </Text>
        </View>

        {/* Right Spacer for balance */}
        <View style={{ width: 40, height: 40 }} />
      </View>

      {/* Scrollable Unit Cards List (Digestive System, Metamorphosis, Weathering, Pollination...) */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#4ade80' : '#22c55e'} />
          <Text style={[styles.loadingText, { color: subtextColor }]}>
            Loading units from database...
          </Text>
        </View>
      ) : (
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
          {/* Card interaction helper banner */}
          <View
            style={[
              styles.helperBanner,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(45, 62, 54, 0.05)' },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={17}
              color={isDark ? '#A6C5B3' : '#688875'}
            />
            <Text style={[styles.helperBannerText, { color: subtextColor }]}>
              Tap any unit card below to study its notes, flashcards, quizzes & audio.
            </Text>
          </View>

          <View style={isTablet ? styles.tabletGrid : undefined}>
          {chapters.map((chapter) => (
            <View
              key={chapter.number}
              style={isTablet ? { width: columns === 3 ? '32%' : '48.5%' } : undefined}
            >
              <ChapterCard
                chapter={chapter}
                subjectName={activeSubject?.name || 'Entomology'}
                courseName={params.courseName || user?.program || 'B.Sc Agriculture'}
                isDark={isDark}
                onPress={() => handleOpenStudyMaterials(chapter)}
                onToolPress={(toolId) => handleOpenStudyMaterials(chapter, toolId)}
              />
            </View>
          ))}
          </View>

          <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 52 : 38,
    paddingBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  navSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  tabletScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  tabletColumn: {
    width: '100%',
    maxWidth: 1100,
  },
  tabletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  helperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 10,
    gap: 8,
  },
  helperBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
