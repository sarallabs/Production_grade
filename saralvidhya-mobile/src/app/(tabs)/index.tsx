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

export default function MainMenuScreen() {
  const router = useRouter();
  const { user, persona } = useAuth();
  const { isDark, setThemeMode } = useAppTheme();
  const [courseData, setCourseData] = useState<CourseOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    // Directs to the subject card selection screen
    router.push('/subjects');
  };

  // Color tokens matching user reference images:
  // Dark Theme: Screen background is #2D3E36
  // Light Theme: Screen background is #FFF6F1
  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const headerTextColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#688875';
  const badgeBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(45, 62, 54, 0.08)';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={screenBg}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4ade80' : '#22c55e'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.greetingText, { color: headerTextColor }]}>
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

            {/* Quick Theme Switcher (for previewing Light #FFF6F1 vs Dark #2D3E36) */}
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

        {/* Section Header */}
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
    paddingTop: Platform.OS === 'android' ? 52 : 36,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
});
