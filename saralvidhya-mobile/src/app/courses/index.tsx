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
import { manifestService, Subject } from '@/api/manifestService';
import { EntomologyMenuCard } from '@/components/study/EntomologyMenuCard';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export default function CourseSelectionScreen() {
  const router = useRouter();
  const { user, persona } = useAuth();
  const { isDark, setThemeMode } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const { selectSubject, selectChapter } = useCourseContext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entomologySubject, setEntomologySubject] = useState<Subject | null>(null);

  useEffect(() => {
    loadEntomologyData();
  }, []);

  const loadEntomologyData = async () => {
    setLoading(true);
    try {
      const allSubjs = await manifestService.getSubjects();
      const ento = allSubjs.find((s) => s.id === 'ento_131') || allSubjs[0];
      setEntomologySubject(ento);
    } catch (e) {
      console.warn('Failed to load entomology subject', e);
    } finally {
      setLoading(false);
    }
  };

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
  const badgeBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(45, 62, 54, 0.08)';

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
            <View>
              <Text style={[styles.greetingText, { color: headerTextColor }]}>
                Welcome, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
              </Text>
              <Text style={[styles.uniBadge, { color: subtextColor }]}>
                Saral Vidhya Learning Portal
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
              Enrolled Subject
            </Text>
            <Text style={[styles.semesterTag, { color: subtextColor, backgroundColor: badgeBg }]}>
              ANGRAU
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
    marginBottom: 16,
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
