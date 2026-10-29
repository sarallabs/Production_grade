import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useCourseContext } from '@/context/CourseContext';
import { manifestService, Subject, Chapter } from '@/api/manifestService';
import { SubjectUnitCard } from '@/components/study/SubjectUnitCard';
import { ChapterCard } from '@/components/study/ChapterCard';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export default function MySubjectsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    subjectId?: string;
    courseId?: string;
    courseName?: string;
    view?: 'subjects' | 'units';
  }>();

  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const { isTablet, columns } = useDeviceLayout();
  const { selectedSubject, selectSubject, selectChapter, selectedCourse, courses } = useCourseContext();

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [viewMode, setViewMode] = useState<'subjects' | 'units'>('units');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const activeCourseId = params.courseId || selectedCourse?.id || 'bsc_agri';
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const courseSubjIds = activeCourse?.subjectIds || ['ento_131'];

  const loadSubjectsData = useCallback(async () => {
    setLoading(true);
    try {
      const subjects = await manifestService.getSubjects();
      setAllSubjects(subjects);

      const targetId = params.subjectId || selectedSubject?.id || courseSubjIds[0] || 'ento_131';
      const found =
        subjects.find((s) => s.id === targetId || s.code.toLowerCase().replace(/\s+/g, '_') === targetId) ||
        subjects.find((s) => courseSubjIds.includes(s.id)) ||
        subjects[0];
      setActiveSubject(found);
      if (found && found.id !== selectedSubject?.id) {
        selectSubject(found);
      }
    } catch (e) {
      console.warn('Failed to load subjects from DB', e);
    } finally {
      setLoading(false);
    }
  }, [params.subjectId, activeCourseId, selectedSubject?.id, courseSubjIds, selectSubject]);

  useFocusEffect(
    useCallback(() => {
      loadSubjectsData();
    }, [loadSubjectsData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const subjects = await manifestService.getSubjects();
    setAllSubjects(subjects);
    if (activeSubject) {
      const found = subjects.find((s) => s.id === activeSubject.id);
      if (found) setActiveSubject(found);
    }
    setRefreshing(false);
  };

  // Color tokens matching user reference images:
  // Dark Theme: #2D3E36
  // Light Theme: #FFF6F1
  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const headerTextColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#688875';
  const iconBtnBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(45, 62, 54, 0.08)';
  const activeTabBg = isDark ? '#22c55e' : '#1C2E24';
  const activeTabText = '#FFFFFF';
  const inactiveTabBg = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(45, 62, 54, 0.08)';
  const inactiveTabText = isDark ? '#A6C5B3' : '#557A65';

  const courseDisplayName =
    params.courseName || activeCourse?.name || user?.program || 'B.Sc. Agriculture';

  // Navigate directly to 4-phase workspace on chapter circle tap (Exact Web App wiring)
  const handleChapterCirclePress = (subj: Subject, ch: Chapter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectSubject(subj);
    selectChapter(ch);
    router.push({
      pathname: '/(tabs)/learn',
      params: {
        chapter: ch.number.toString(),
        segment: 'read',
      },
    });
  };

  // Direct Subject Cards: tapping opens the chapters list for this subject
  const handleSubjectCardPress = async (subj: Subject) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await selectSubject(subj);
    setActiveSubject(subj);
    setViewMode('units');
  };

  // Study tool navigation for ChapterCard
  const handleOpenStudyMaterials = (chapter: Chapter, toolId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeSubject) {
      selectSubject(activeSubject);
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

  const courseSubjects = allSubjects.filter((s) => courseSubjIds.includes(s.id));
  const filteredSubjects = courseSubjects.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <View style={styles.leftNavActions}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: iconBtnBg }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/courses');
              }
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
            {activeSubject?.name || 'Entomology'}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : '#4D6256',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            try { Haptics.selectionAsync().catch(() => {}); } catch {}
            router.navigate('/(tabs)/profile');
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="My Profile and Themes"
        >
          <Ionicons name="person-outline" size={18} color={headerTextColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#4ade80' : '#22c55e'} />
          <Text style={[styles.loadingText, { color: subtextColor }]}>
            Loading subjects and syllabus units...
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
            {/* ── MODE 1: MY SUBJECTS GRID (Web App Step 2 Replication) ── */}
            {viewMode === 'subjects' ? (
              <>
                {/* Search & Filter Bar */}
                <View
                  style={[
                    styles.searchBar,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(45, 62, 54, 0.06)' },
                  ]}
                >
                  <Ionicons name="search" size={17} color={subtextColor} />
                  <TextInput
                    style={[styles.searchInput, { color: headerTextColor }]}
                    placeholder="Search subjects by name or code..."
                    placeholderTextColor={isDark ? '#7E9F8E' : '#88A392'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color={subtextColor} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Helpful Instruction Banner */}
                <View
                  style={[
                    styles.helperBanner,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(45, 62, 54, 0.05)' },
                  ]}
                >
                  <Ionicons name="bulb-outline" size={17} color={isDark ? '#4ade80' : '#22c55e'} />
                  <Text style={[styles.helperBannerText, { color: subtextColor }]}>
                    Select any subject below to explore its syllabus units, study guides, flashcards & quizzes.
                  </Text>
                </View>

                {/* Subject Cards Grid */}
                <View style={isTablet ? styles.tabletGrid : undefined}>
                  {filteredSubjects.map((subj) => {
                    const chapterCount = subj.chapters?.length || 1;
                    const chapterLabel = chapterCount === 1 ? '1 Chapter' : `${chapterCount} Chapters`;
                    const cardSubtitle = `${activeCourse?.popularTag || activeCourse?.name} • ${chapterLabel}`;

                    return (
                      <View
                        key={subj.id}
                        style={isTablet ? { width: columns === 3 ? '32%' : '48.5%' } : undefined}
                      >
                        <SubjectUnitCard
                          subject={subj}
                          degree={cardSubtitle}
                          isDark={isDark}
                          onPress={() => handleSubjectCardPress(subj)}
                          onProgressChange={onRefresh}
                        />
                      </View>
                    );
                  })}
                </View>

                {filteredSubjects.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="book-outline" size={48} color={subtextColor} />
                    <Text style={[styles.emptyText, { color: headerTextColor }]}>
                      No subjects found matching "{searchQuery}"
                    </Text>
                  </View>
                )}
              </>
            ) : (
              /* ── MODE 2: SUBJECT UNITS LIST (ChapterCard Replication) ── */
              <>
                {/* Horizontal Subject Switcher Pills (only if more than 1 subject in course) */}
                {courseSubjects.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.subjectPillsRow}
                  >
                    {courseSubjects.map((subj) => {
                      const isSelected = activeSubject?.id === subj.id;
                      return (
                        <TouchableOpacity
                          key={subj.id}
                          style={[
                            styles.subjectPill,
                            {
                              backgroundColor: isSelected ? activeTabBg : inactiveTabBg,
                              borderColor: isSelected
                                ? '#22c55e'
                                : isDark
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(45,62,54,0.1)',
                            },
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setActiveSubject(subj);
                            selectSubject(subj);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.subjectPillText,
                              {
                                color: isSelected ? activeTabText : inactiveTabText,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}
                          >
                            {subj.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* H2 Section Header */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: headerTextColor }]}>
                    My Subjects
                  </Text>
                </View>

                {/* Units List */}
                <View style={isTablet ? styles.tabletGrid : undefined}>
                  {(activeSubject?.chapters || []).map((chapter) => (
                    <View
                      key={chapter.number}
                      style={isTablet ? { width: columns === 3 ? '32%' : '48.5%' } : undefined}
                    >
                      <ChapterCard
                        chapter={chapter}
                        subjectCode={activeSubject?.code || 'ENTO 131'}
                        subjectName={activeSubject?.name || 'Entomology'}
                        courseName={courseDisplayName}
                        isDark={isDark}
                        onPress={() => handleOpenStudyMaterials(chapter)}
                        onToolPress={(toolId) => handleOpenStudyMaterials(chapter, toolId)}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  helperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  helperBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  subjectPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14,
  },
  subjectPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  subjectPillText: {
    fontSize: 13,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 14,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
