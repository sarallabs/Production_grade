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
import { manifestService, CourseOverviewData } from '@/api/manifestService';
import { CourseOverviewCard } from '@/components/study/CourseOverviewCard';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { TabletFontSize } from '@/constants/theme';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';

const HOME_SEGMENTS: NavSegment[] = [
  { id: 'overview', label: 'Overview', vectorIcon: 'grid-outline' },
  { id: 'progress', label: 'Progress', vectorIcon: 'trending-up-outline' },
  { id: 'tasks', label: 'Tasks', vectorIcon: 'checkbox-outline' },
];

export default function MainMenuScreen() {
  const router = useRouter();
  const { user, persona } = useAuth();
  const { isDark, setThemeMode } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const [activeSegment, setActiveSegment] = useState<string>('overview');
  const [courseData, setCourseData] = useState<CourseOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    task1: true,
  });

  useEffect(() => {
    loadCourseOverview();
  }, [user]);

  const loadCourseOverview = async () => {
    setLoading(true);
    const data = await manifestService.getCourseOverview('Entomology');
    setCourseData(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await manifestService.getCourseOverview('Entomology');
    setCourseData(data);
    setRefreshing(false);
  };

  const toggleTheme = () => {
    Haptics.selectionAsync();
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/subjects');
  };

  const toggleTask = (id: string) => {
    Haptics.selectionAsync();
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Color tokens matching user reference images:
  // Dark Theme: Screen background is #23322B (or #2D3E36)
  // Light Theme: Screen background is #FFF6F1
  const screenBg = isDark ? '#23322B' : '#FFF6F1';
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

      {/* Top Mobile Toolbar with Toggle Pills + Profile Avatar */}
      <TopNavBar
        segments={HOME_SEGMENTS}
        activeSegment={activeSegment}
        onSegmentChange={setActiveSegment}
        showProfile={true}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4ade80' : '#22c55e'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
       <View style={isTablet ? styles.tabletColumn : undefined}>
        {/* Top Welcome Bar */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.greetingText, isTablet && { fontSize: TabletFontSize.title + 2 }, { color: headerTextColor }]}>
              Welcome, {user?.name ? user.name.split(' ')[0] : 'Student'} 👋
            </Text>
            <Text style={[styles.uniBadge, { color: subtextColor }]}>
              {user?.program || 'B.Sc Agriculture'} • {user?.semester || 'Semester 3'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Persona Pill */}
            <TouchableOpacity
              style={[styles.personaPill, { backgroundColor: badgeBg }]}
              onPress={() => router.push('/(auth)/persona')}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={13} color={isDark ? '#4ade80' : '#22c55e'} />
              <Text style={[styles.personaText, { color: isDark ? '#4ade80' : '#22c55e' }]}>
                {persona.toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Quick Theme Switcher */}
            <TouchableOpacity
              style={[styles.themePill, { backgroundColor: badgeBg }]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={headerTextColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. TOGGLE: Overview View */}
        {activeSegment === 'overview' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: headerTextColor }]}>
                Course Overview
              </Text>
              <Text style={[styles.semesterTag, { color: subtextColor, backgroundColor: badgeBg }]}>
                {user?.semester || 'Semester 3'}
              </Text>
            </View>

            {/* Course Overview Card (100% DB Driven) */}
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
                />
              </View>
            )}

            {/* Quick Launch Action Cards */}
            <View style={styles.quickLaunchRow}>
              <TouchableOpacity
                style={[styles.quickCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={() => router.push('/(tabs)/learn')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : '#ECFDF5' }]}>
                  <Ionicons name="sparkles" size={20} color={isDark ? '#4ade80' : '#16a34a'} />
                </View>
                <Text style={[styles.quickCardTitle, { color: headerTextColor }]}>Start Learning</Text>
                <Text style={[styles.quickCardSub, { color: subtextColor }]}>Notes, Audio & Videos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={() => router.push('/(tabs)/practice')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#F0F9FF' }]}>
                  <Ionicons name="create" size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
                </View>
                <Text style={[styles.quickCardTitle, { color: headerTextColor }]}>Practice Drills</Text>
                <Text style={[styles.quickCardSub, { color: subtextColor }]}>Flashcards & Quizzes</Text>
              </TouchableOpacity>
            </View>

            {/* Information Callout */}
            <View
              style={[
                styles.infoCallout,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(45, 62, 54, 0.05)' },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={isDark ? '#A6C5B3' : '#688875'}
              />
              <Text style={[styles.infoCalloutText, { color: subtextColor }]}>
                Numbers 1–{courseData?.subjects.length || 5} represent the curriculum subjects in your semester. Tap any number or the card to explore each subject in detail.
              </Text>
            </View>
          </View>
        )}

        {/* 2. TOGGLE: Progress View */}
        {activeSegment === 'progress' && (
          <View style={styles.segmentContainer}>
            <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.statsTitle, { color: headerTextColor }]}>Semester Progress</Text>
              <View style={styles.progressBarWrap}>
                <View style={[styles.progressBarFill, { width: '68%', backgroundColor: isDark ? '#4ade80' : '#22c55e' }]} />
              </View>
              <View style={styles.statsRow}>
                <Text style={[styles.statsNumber, { color: isDark ? '#4ade80' : '#22c55e' }]}>68%</Text>
                <Text style={[styles.statsSub, { color: subtextColor }]}>Overall Curriculum Completed</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Ionicons name="flame" size={24} color="#f97316" />
                <Text style={[styles.metricVal, { color: headerTextColor }]}>5 Days</Text>
                <Text style={[styles.metricLabel, { color: subtextColor }]}>Active Streak</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Ionicons name="time" size={24} color="#38bdf8" />
                <Text style={[styles.metricVal, { color: headerTextColor }]}>14.5 hrs</Text>
                <Text style={[styles.metricLabel, { color: subtextColor }]}>Study Time</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Ionicons name="trophy" size={24} color="#eab308" />
                <Text style={[styles.metricVal, { color: headerTextColor }]}>#4</Text>
                <Text style={[styles.metricLabel, { color: subtextColor }]}>Class Rank</Text>
              </View>
            </View>

            <View style={styles.subjectListWrap}>
              <Text style={[styles.subjectListTitle, { color: headerTextColor }]}>Subject Breakdown</Text>
              {[
                { name: 'Fundamentals of Entomology', prog: 78, code: 'ENTO 131' },
                { name: 'Principles of Agronomy', prog: 62, code: 'AGRO 101' },
                { name: 'Plant Biochemistry', prog: 55, code: 'BIOCH 111' },
                { name: 'Agricultural Microbiology', prog: 85, code: 'MICRO 121' },
              ].map((subj) => (
                <View key={subj.code} style={[styles.subjectRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subjCode, { color: subtextColor }]}>{subj.code}</Text>
                    <Text style={[styles.subjName, { color: headerTextColor }]}>{subj.name}</Text>
                  </View>
                  <Text style={[styles.subjPercent, { color: isDark ? '#4ade80' : '#22c55e' }]}>{subj.prog}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 3. TOGGLE: Daily Tasks View */}
        {activeSegment === 'tasks' && (
          <View style={styles.segmentContainer}>
            <View style={styles.tasksHeader}>
              <Text style={[styles.sectionTitle, { color: headerTextColor }]}>Today's Study Checklist</Text>
              <Text style={[styles.tasksCount, { color: subtextColor }]}>
                {Object.values(completedTasks).filter(Boolean).length}/4 Done
              </Text>
            </View>

            {[
              { id: 'task1', title: 'Read Chapter 1 Digestive System Notes', desc: 'Focus on stomodaeal valve structure', tag: 'Reading' },
              { id: 'task2', title: 'Complete 20 Flashcards in Anatomy', desc: 'Master cuticular teeth & peritrophic membrane', tag: 'Practice' },
              { id: 'task3', title: 'Solve 2023 PYQ Mid-Term 5-Marker', desc: 'Review model answer & scheme of evaluation', tag: 'Prepare' },
              { id: 'task4', title: 'Listen to 15-min Digestive Podcast', desc: 'Audio revision before lab session', tag: 'Audio' },
            ].map((task) => {
              const isDone = !!completedTasks[task.id];
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskCard,
                    { backgroundColor: cardBg, borderColor: isDone ? (isDark ? '#2e4e3a' : '#c8e6c9') : cardBorder },
                  ]}
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isDone ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={isDone ? (isDark ? '#4ade80' : '#22c55e') : subtextColor}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: headerTextColor },
                        isDone && { textDecorationLine: 'line-through', opacity: 0.6 },
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={[styles.taskDesc, { color: subtextColor }]}>{task.desc}</Text>
                  </View>
                  <View style={[styles.taskTag, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.taskTagText, { color: isDark ? '#4ade80' : '#22c55e' }]}>{task.tag}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
    paddingTop: Platform.OS === 'android' ? 12 : 8,
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
  quickLaunchRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  quickCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  quickCardSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  segmentContainer: {
    marginTop: 4,
    gap: 16,
  },
  statsCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarWrap: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  statsNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statsSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  subjectListWrap: {
    gap: 10,
    marginTop: 4,
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
    fontSize: 15,
    fontWeight: '800',
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tasksCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  taskDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  taskTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  taskTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
