import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useCourseContext } from '@/context/CourseContext';
import { manifestService, Subject } from '@/api/manifestService';
import { EntomologyMenuCard } from '@/components/study/EntomologyMenuCard';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export default function CourseSelectionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const { selectSubject, selectChapter } = useCourseContext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entomologySubject, setEntomologySubject] = useState<Subject | null>(null);

  const loadEntomologyData = useCallback(async () => {
    try {
      const allSubjs = await manifestService.getSubjects();
      const ento = allSubjs.find((s) => s.id === 'ento_131') || allSubjs[0];
      setEntomologySubject(ento ? { ...ento } : null);
    } catch (e) {
      console.warn('Failed to load entomology subject', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntomologyData();
  }, [loadEntomologyData]);

  // Re-fetch dynamic progress whenever the student returns to this screen
  useFocusEffect(
    useCallback(() => {
      loadEntomologyData();
    }, [loadEntomologyData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntomologyData();
    setRefreshing(false);
  };

  // Tapping the card opens the subject units & syllabus
  const handleSelectEntomology = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (entomologySubject) {
      await selectSubject(entomologySubject);
    }
    router.push({
      pathname: '/subjects',
      params: {
        courseId: 'bsc_agri',
        subjectId: 'ento_131',
        view: 'units',
      },
    });
  };

  // Tapping circle 1, 2, 3, or 4 navigates directly to that chapter in 4-phase workspace
  const handleChapterPress = async (chapterNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (entomologySubject) {
      await selectSubject(entomologySubject);
      const ch = entomologySubject.chapters?.find((c) => c.number === chapterNumber);
      if (ch) {
        selectChapter(ch);
      }
    }
    router.push({
      pathname: '/(tabs)/learn',
      params: {
        chapter: chapterNumber.toString(),
        segment: 'read',
      },
    });
  };

  // Color tokens matching user reference images:
  // Dark Theme: #2D3E36
  // Light Theme: #FFF6F1
  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const headerTextColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#688875';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
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
            <Text style={[styles.greetingText, { color: headerTextColor }]}>
              Welcome, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
            </Text>
          </View>

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: headerTextColor }]}>
              My Subject
            </Text>
          </View>

          {/* Entomology Starting Card with 1, 2, 3, 4 Chapters */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDark ? '#4ade80' : '#22c55e'} />
              <Text style={[styles.loadingText, { color: subtextColor }]}>
                Loading course modules...
              </Text>
            </View>
          ) : (
            <View style={styles.cardsList}>
              <View style={styles.cardItem}>
                <EntomologyMenuCard
                  subject={entomologySubject || undefined}
                  title="Entomology"
                  subtitle="B.Sc Agriculture"
                  isDark={isDark}
                  onPress={handleSelectEntomology}
                  onChapterPress={handleChapterPress}
                />
              </View>
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
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardsList: {
    width: '100%',
    gap: 12,
  },
  cardItem: {
    width: '100%',
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
