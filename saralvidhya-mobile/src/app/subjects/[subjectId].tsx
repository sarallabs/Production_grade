import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { manifestService, Subject, Chapter } from '@/api/manifestService';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function SubjectChaptersScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjectData();
  }, [subjectId]);

  const loadSubjectData = async () => {
    if (!subjectId) return;
    setLoading(true);
    const sub = await manifestService.getSubject(subjectId);
    setSubject(sub || null);
    setLoading(false);
  };

  const handleOpenChapter = (ch: Chapter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/study',
      params: {
        subjectId: subject?.id || 'ento_131',
        chapter: ch.number.toString(),
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' }]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Back button and title */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#22c55e" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.codeText}>{subject?.code} • {subject?.credits} Credits</Text>
          <Text style={[styles.titleText, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
            {subject?.name}
          </Text>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.uniBanner}>
        <Ionicons name="school" size={20} color="#22c55e" />
        <Text style={styles.uniBannerText}>
          Official Syllabus
        </Text>
      </View>

      {/* Chapters list */}
      <View style={styles.chaptersContainer}>
        <Text style={[styles.chaptersHeading, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
          Syllabus Chapters ({subject?.chapters.length || 0})
        </Text>

        {subject?.chapters.map((ch) => {
          const isCompleted = (ch.completed?.length || 0) > 4;
          return (
            <TouchableOpacity
              key={ch.number}
              style={[
                styles.chapterCard,
                {
                  backgroundColor: isDark ? '#23322B' : '#ffffff',
                  borderColor: isDark ? '#3D5449' : '#E5DDD8',
                },
              ]}
              onPress={() => handleOpenChapter(ch)}
              activeOpacity={0.8}
            >
              <View style={styles.chapterTopRow}>
                <View style={[styles.chapterNumBadge, isCompleted && styles.chapterNumBadgeDone]}>
                  <Text style={[styles.chapterNumText, isCompleted && styles.chapterNumTextDone]}>
                    {ch.number}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chapterName, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
                    {ch.name}
                  </Text>
                  <Text style={styles.toolsCountText}>
                    {ch.resourceCount || 7} Study Resources (Notes, Quiz, Flashcards, Audio)
                  </Text>
                </View>
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : 'chevron-forward'}
                  size={22}
                  color={isCompleted ? '#22c55e' : '#94a3b8'}
                />
              </View>

              {ch.description ? (
                <Text style={styles.chapterDesc}>{ch.description}</Text>
              ) : null}

              <View style={styles.chapterFooter}>
                <View style={styles.toolIconsRow}>
                  <Text style={styles.toolIcon}>📖</Text>
                  <Text style={styles.toolIcon}>🗂️</Text>
                  <Text style={styles.toolIcon}>🎯</Text>
                  <Text style={styles.toolIcon}>🎙️</Text>
                  <Text style={styles.toolIcon}>📺</Text>
                </View>
                <Text style={styles.openBtnText}>Open Study Table →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 50 : 30,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#064e3b22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  uniBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    gap: 8,
    marginBottom: Spacing.four,
  },
  uniBannerText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  chaptersContainer: {
    gap: Spacing.three,
  },
  chaptersHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  chapterCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  chapterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chapterNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumBadgeDone: {
    backgroundColor: '#064e3b33',
    borderColor: '#22c55e',
    borderWidth: 1,
  },
  chapterNumText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
  },
  chapterNumTextDone: {
    color: '#22c55e',
  },
  chapterName: {
    fontSize: 15,
    fontWeight: '700',
  },
  toolsCountText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  chapterDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
    marginTop: 8,
    paddingLeft: 48,
  },
  chapterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    marginTop: 10,
  },
  toolIconsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toolIcon: {
    fontSize: 14,
  },
  openBtnText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
});
