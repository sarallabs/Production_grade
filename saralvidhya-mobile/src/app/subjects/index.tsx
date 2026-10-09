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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { manifestService, Subject, Chapter } from '@/api/manifestService';
import { ChapterCard } from '@/components/study/ChapterCard';

export default function SubjectUnitsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark, setThemeMode } = useAppTheme();

  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadSubjectAndUnits();
  }, []);

  const loadSubjectAndUnits = async () => {
    setLoading(true);
    const subjects = await manifestService.getSubjects();
    const ento = subjects.find((s) => s.id === 'ento_131') || subjects[0];
    setActiveSubject(ento);
    setChapters(ento?.chapters || []);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const subjects = await manifestService.getSubjects();
    const ento = subjects.find((s) => s.id === 'ento_131') || subjects[0];
    setActiveSubject(ento);
    setChapters(ento?.chapters || []);
    setRefreshing(false);
  };

  // Screen background matching user reference images:
  // Dark Theme: #2D3E36
  // Light Theme: #FFF6F1
  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const headerTextColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#688875';
  const iconBtnBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(45, 62, 54, 0.08)';

  const toggleTheme = () => {
    Haptics.selectionAsync();
    setThemeMode(isDark ? 'light' : 'dark');
  };

  // Navigate to study materials page
  const handleOpenStudyMaterials = (chapter: Chapter, toolId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(tabs)/study',
      params: {
        subjectId: activeSubject?.id || 'ento_131',
        chapter: chapter.number.toString(),
        ...(toolId ? { tool: toolId } : {}),
      },
    });
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
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={headerTextColor} />
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={[styles.navTitle, { color: headerTextColor }]}>
            {activeSubject?.name || 'Entomology'}
          </Text>
          <Text style={[styles.navSubtitle, { color: subtextColor }]}>
            {user?.program || 'B.Sc Agriculture'} • {chapters.length} Units
          </Text>
        </View>

        {/* Theme Toggle Button */}
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: iconBtnBg }]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={19}
            color={headerTextColor}
          />
        </TouchableOpacity>
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#4ade80' : '#22c55e'}
            />
          }
        >
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

          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.number}
              chapter={chapter}
              subjectName={activeSubject?.name || 'Entomology'}
              courseName={user?.program || 'B.Sc Agriculture'}
              isDark={isDark}
              onPress={() => handleOpenStudyMaterials(chapter)}
              onToolPress={(toolId) => handleOpenStudyMaterials(chapter, toolId)}
            />
          ))}

          <View style={{ height: 32 }} />
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
