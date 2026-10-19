import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useCourseContext } from '@/context/CourseContext';
import { manifestService, CourseOverviewData, CourseSubjectProgress } from '@/api/manifestService';
import { CourseOverviewCard } from '@/components/study/CourseOverviewCard';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export default function CourseSelectionScreen() {
  const router = useRouter();
  const { user, persona, logout } = useAuth();
  const { isDark, themeMode, setThemeMode } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const { selectedCourse, selectCourse, selectSubjectById, subjects } = useCourseContext();

  const [courseData, setCourseData] = useState<CourseOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCourseOverviewFromDb();
  }, [user, selectedCourse, subjects]);

  const loadCourseOverviewFromDb = async () => {
    setLoading(true);
    try {
      const courseName = selectedCourse?.name || 'B.Sc. (Hons) Agriculture';
      const subjects = await manifestService.getSubjects();

      // Dynamic subjects list with real DB progress
      const unitProgressList: CourseSubjectProgress[] = subjects.map((subj, index) => {
        const pct = manifestService.calculateSubjectProgress(subj);
        const statusColor = pct === 100 ? '#22c55e' : pct > 0 ? '#3b82f6' : '#f97316';
        return {
          index: index + 1,
          id: subj.id,
          code: subj.code,
          name: subj.name,
          progressPercent: pct,
          statusColor,
        };
      });

      const totalProgress = subjects.reduce((sum, s) => sum + manifestService.calculateSubjectProgress(s), 0);
      const overallProgress = subjects.length > 0 ? Math.round(totalProgress / subjects.length) : 50;

      setCourseData({
        courseId: selectedCourse?.id || 'bsc_agri',
        courseName,
        degree: selectedCourse?.degree || 'Undergraduate • Semester 3',
        semester: selectedCourse?.semester || 'Semester 3',
        overallProgress,
        subjects: unitProgressList,
      });
    } catch (e) {
      console.warn('Failed to load course overview from DB', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourseOverviewFromDb();
    setRefreshing(false);
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/subjects',
      params: {
        courseId: courseData?.courseId || 'bsc_agri',
        courseName: courseData?.courseName || 'B.Sc. (Hons) Agriculture',
      },
    });
  };

  const handleSubjectPress = async (subj: CourseSubjectProgress) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await selectSubjectById(subj.id);
    router.push({
      pathname: '/subjects',
      params: {
        subjectId: subj.id,
        courseId: courseData?.courseId || 'bsc_agri',
        courseName: courseData?.courseName || 'B.Sc. (Hons) Agriculture',
      },
    });
  };

  // Color tokens matching user reference images:
  // Dark Theme: Screen background is #2D3E36
  // Light Theme: Screen background is #FFF6F1
  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const headerTextColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#688875';
  const cardBg = isDark ? '#1E2B24' : '#FFFFFF';
  const cardBorder = isDark ? '#3D5449' : '#E5DDD8';
  const badgeBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(45, 62, 54, 0.08)';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={screenBg}
      />

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
          {/* Top Brand Header */}
          <View style={styles.topHeader}>
            <View>
              <Text style={[styles.greetingText, { color: headerTextColor }]}>
                Welcome, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
              </Text>
              <Text style={[styles.uniBadge, { color: subtextColor }]}>
                Acharya N.G. Ranga Agricultural University
              </Text>
            </View>

            <View style={styles.headerActions}>
              <View style={[styles.personaPill, { backgroundColor: badgeBg }]}>
                <Ionicons name="sparkles" size={13} color={isDark ? '#4ade80' : '#22c55e'} />
                <Text style={[styles.personaText, { color: isDark ? '#4ade80' : '#22c55e' }]}>
                  {persona.toUpperCase()}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.themePill, { backgroundColor: badgeBg }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setThemeMode(isDark ? 'light' : 'dark');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isDark ? 'sunny' : 'moon'}
                  size={16}
                  color={headerTextColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: headerTextColor }]}>
              Degree Courses & Progress
            </Text>
            <Text style={[styles.semesterTag, { color: subtextColor, backgroundColor: badgeBg }]}>
              Semester 3
            </Text>
          </View>

          {/* EXACT ORIGINAL CourseOverviewCard (Matching Figma DevMode CSS and PNG references) */}
          {loading || !courseData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDark ? '#4ade80' : '#22c55e'} />
              <Text style={[styles.loadingText, { color: subtextColor }]}>
                Loading course overview from database...
              </Text>
            </View>
          ) : (
            <View style={styles.cardWrapper}>
              <CourseOverviewCard
                data={courseData}
                isDark={isDark}
                onPress={handleCardPress}
                onSubjectPress={handleSubjectPress}
              />
            </View>
          )}

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
    paddingTop: Platform.OS === 'android' ? 52 : 44,
    paddingBottom: 40,
  },
  tabletScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  tabletColumn: {
    width: '100%',
    maxWidth: 900,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  uniBadge: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  personaText: {
    fontSize: 11,
    fontWeight: '800',
  },
  themePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  semesterTag: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginTop: 18,
    gap: 10,
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subjectListWrap: {
    gap: 10,
    marginTop: 20,
  },
  subjectListTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  miniIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIndexText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subjCode: {
    fontSize: 11,
    fontWeight: '700',
  },
  subjName: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 2,
  },
  subjPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
});
