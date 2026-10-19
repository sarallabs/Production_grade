import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/context/AuthContext';
import { useCourseContext } from '@/context/CourseContext';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import { storage } from '@/utils/storage';

const PROFILE_SEGMENTS: NavSegment[] = [
  { id: 'profile', label: 'My Profile', vectorIcon: 'person-outline' },
  { id: 'rankings', label: 'Rankings', vectorIcon: 'trophy-outline' },
  { id: 'settings', label: 'Settings', vectorIcon: 'settings-outline' },
];

const LEADERBOARD_STUDENTS = [
  { rank: 1, name: 'Priya K.', roll: 'AG-2023-014', points: 2840, streak: 18, badge: '🥇' },
  { rank: 2, name: 'Kiran Reddy', roll: 'AG-2023-089', points: 2690, streak: 14, badge: '🥈' },
  { rank: 3, name: 'Sanjay Varma', roll: 'AG-2023-042', points: 2510, streak: 12, badge: '🥉' },
  { rank: 4, name: 'Aditya (You)', roll: 'AG-2023-131', points: 2380, streak: 5, badge: '⭐', isUser: true },
  { rank: 5, name: 'Anusha M.', roll: 'AG-2023-076', points: 2240, streak: 9, badge: '' },
  { rank: 6, name: 'Ravi Teja', roll: 'AG-2023-112', points: 2100, streak: 7, badge: '' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, persona, logout } = useAuth();
  const { selectedCourse, selectedSubject } = useCourseContext();
  const { themeMode, setThemeMode, isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [activeSegment, setActiveSegment] = useState<string>('profile');

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Saral Vidhya?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleClearCache = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.clear();
    Alert.alert('Cache Cleared', 'Offline study materials and local manifest cache cleared successfully.');
  };

  const screenBg = isDark ? '#2D3E36' : '#FFF6F1';
  const cardBg = isDark ? '#1E2B24' : '#FFFFFF';
  const cardBorder = isDark ? '#3D5449' : '#E5DDD8';
  const textColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#557A65';
  const tagBg = isDark ? '#1C2822' : '#F7EBE3';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Top Navigation Bar with Toggle Pills */}
      <TopNavBar
        segments={PROFILE_SEGMENTS}
        activeSegment={activeSegment}
        onSegmentChange={setActiveSegment}
        showProfile={false}
        title="Student Portal"
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, isTablet && { alignItems: 'center' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentWrap, isTablet && { width: '100%', maxWidth: 860, alignSelf: 'center' }]}>
          {activeSegment === 'profile' ? (
            <View>
              {/* Header Profile Card */}
              <View
                style={[
                  styles.profileCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>

                <Text style={[styles.profileName, { color: textColor }]}>
                  {user?.name || 'Student'}
                </Text>
                <Text style={[styles.profileRoll, { color: subtextColor }]}>
                  {user?.rollNumber || 'AG-2023-131'}
                </Text>

                <View style={styles.uniBadge}>
                  <Ionicons name="business" size={14} color="#22c55e" />
                  <Text style={styles.uniBadgeText}>{user?.university || 'ANGRAU University'}</Text>
                </View>
                <Text style={[styles.programText, { color: subtextColor }]}>
                  {user?.program || 'B.Sc (Hons) Agriculture'} • {user?.semester || 'Semester 3'}
                </Text>
              </View>

              {/* Study Stats Grid */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={styles.statEmoji}>🔥</Text>
                  <Text style={[styles.statNum, { color: textColor }]}>5 Days</Text>
                  <Text style={[styles.statLabel, { color: subtextColor }]}>Current Streak</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={styles.statEmoji}>⭐</Text>
                  <Text style={[styles.statNum, { color: textColor }]}>2,380</Text>
                  <Text style={[styles.statLabel, { color: subtextColor }]}>Study Points</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={styles.statEmoji}>🗂</Text>
                  <Text style={[styles.statNum, { color: textColor }]}>32 / 40</Text>
                  <Text style={[styles.statLabel, { color: subtextColor }]}>Cards Mastered</Text>
                </View>
              </View>

              {/* Learning Persona Tier Card */}
              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={[styles.sectionLabel, { color: subtextColor }]}>CURRENT LEARNING PERSONA</Text>
                    <Text style={[styles.personaTitle, { color: textColor }]}>
                      {persona.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changePersonaBtn}
                    onPress={() => router.push('/(auth)/persona')}
                  >
                    <Text style={styles.changePersonaText}>Change</Text>
                    <Ionicons name="chevron-forward" size={14} color="#22c55e" />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.personaDesc, { color: subtextColor }]}>
                  {persona === 'beginner'
                    ? 'Foundations first with simplified summaries and step-by-step guidance.'
                    : persona === 'intermediate'
                    ? 'Standard syllabus speed with balanced study guides and quizzes.'
                    : 'Deep-dive mode with 10-mark past question papers and advanced taxonomy.'}
                </Text>
              </View>

              {/* Active Curriculum Selection Card */}
              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={[styles.sectionLabel, { color: subtextColor }]}>ENROLLED DEGREE PROGRAM</Text>
                    <Text style={[styles.personaTitle, { color: textColor }]}>
                      {selectedCourse?.name || 'B.Sc. (Hons) Agriculture'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changePersonaBtn}
                    onPress={() => router.push('/courses')}
                  >
                    <Text style={styles.changePersonaText}>Switch Course</Text>
                    <Ionicons name="chevron-forward" size={14} color="#22c55e" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#2D3E36' : '#F1EBE5' }}>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: subtextColor }}>ACTIVE STUDY SUBJECT</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginTop: 2 }}>
                      {selectedSubject?.name || 'Entomology'} ({selectedSubject?.code || 'ENTO 131'})
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changePersonaBtn}
                    onPress={() => router.push('/subjects')}
                  >
                    <Text style={styles.changePersonaText}>Switch Subject</Text>
                    <Ionicons name="chevron-forward" size={14} color="#22c55e" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : activeSegment === 'rankings' ? (
            <View>
              {/* Leaderboard Header */}
              <View style={[styles.rankingsHeaderCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.statewidePill}>
                  <Text style={styles.statewidePillText}>ANGRAU STATEWIDE LEADERBOARD</Text>
                </View>
                <Text style={[styles.rankingsTitle, { color: textColor }]}>
                  Semester Academic Standings
                </Text>
                <Text style={[styles.rankingsSubtitle, { color: subtextColor }]}>
                  Earn points by completing reading notes, active recall decks, and scoring high in quizzes.
                </Text>
              </View>

              {/* Top 3 Podium */}
              <View style={styles.podiumContainer}>
                {/* Rank 2 */}
                <View style={styles.podiumCol}>
                  <Text style={styles.podiumMedal}>🥈</Text>
                  <View style={[styles.podiumBar, styles.podiumBar2]}>
                    <Text style={styles.podiumRank}>2</Text>
                  </View>
                  <Text style={[styles.podiumName, { color: textColor }]} numberOfLines={1}>
                    {LEADERBOARD_STUDENTS[1].name}
                  </Text>
                  <Text style={styles.podiumPoints}>{LEADERBOARD_STUDENTS[1].points} pts</Text>
                </View>

                {/* Rank 1 */}
                <View style={styles.podiumCol}>
                  <Text style={styles.podiumMedal}>🥇</Text>
                  <View style={[styles.podiumBar, styles.podiumBar1]}>
                    <Text style={styles.podiumRank}>1</Text>
                  </View>
                  <Text style={[styles.podiumName, { color: textColor }]} numberOfLines={1}>
                    {LEADERBOARD_STUDENTS[0].name}
                  </Text>
                  <Text style={styles.podiumPoints}>{LEADERBOARD_STUDENTS[0].points} pts</Text>
                </View>

                {/* Rank 3 */}
                <View style={styles.podiumCol}>
                  <Text style={styles.podiumMedal}>🥉</Text>
                  <View style={[styles.podiumBar, styles.podiumBar3]}>
                    <Text style={styles.podiumRank}>3</Text>
                  </View>
                  <Text style={[styles.podiumName, { color: textColor }]} numberOfLines={1}>
                    {LEADERBOARD_STUDENTS[2].name}
                  </Text>
                  <Text style={styles.podiumPoints}>{LEADERBOARD_STUDENTS[2].points} pts</Text>
                </View>
              </View>

              {/* Leaderboard Listing */}
              <View style={styles.listContainer}>
                {LEADERBOARD_STUDENTS.map((item) => (
                  <View
                    key={item.rank}
                    style={[
                      styles.studentRow,
                      item.isUser && styles.studentRowUser,
                      {
                        backgroundColor: item.isUser
                          ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)')
                          : cardBg,
                        borderColor: item.isUser ? '#22c55e' : cardBorder,
                      },
                    ]}
                  >
                    <View style={[styles.rankBadge, item.isUser && styles.rankBadgeUser, !item.isUser && { backgroundColor: tagBg }]}>
                      <Text style={[styles.rankText, item.isUser && styles.rankTextUser, !item.isUser && { color: textColor }]}>
                        #{item.rank}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.studentName, { color: textColor }, item.isUser && { fontWeight: '800' }]}>
                          {item.name}
                        </Text>
                        {item.badge ? <Text style={{ fontSize: 13 }}>{item.badge}</Text> : null}
                      </View>
                      <Text style={[styles.studentRoll, { color: subtextColor }]}>{item.roll}</Text>
                    </View>

                    <View style={styles.streakBadge}>
                      <Ionicons name="flame" size={13} color="#f59e0b" />
                      <Text style={styles.streakText}>{item.streak}d</Text>
                    </View>

                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>{item.points}</Text>
                      <Text style={[styles.ptsLabel, { color: subtextColor }]}>pts</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : activeSegment === 'settings' ? (
            <View>
              {/* Theme Settings Card */}
              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <Text style={[styles.sectionLabel, { color: subtextColor }]}>APP THEME & FOCUS MODE</Text>
                <View style={styles.themeOptionsRow}>
                  {(['light', 'dark', 'focus'] as const).map((mode) => {
                    const isSelected = themeMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.themePill,
                          { backgroundColor: tagBg },
                          isSelected && styles.themePillActive,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setThemeMode(mode);
                        }}
                      >
                        <Ionicons
                          name={mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'eye-off'}
                          size={16}
                          color={isSelected ? '#ffffff' : subtextColor}
                        />
                        <Text
                          style={[
                            styles.themePillText,
                            { color: isSelected ? '#FFFFFF' : subtextColor },
                            isSelected && styles.themePillTextActive,
                          ]}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Diagnostic Questionnaire Retake */}
              <TouchableOpacity
                style={[
                  styles.actionRow,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={() => router.push('/(auth)/questionnaire')}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="clipboard-outline" size={20} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: textColor }]}>
                    Retake Diagnostic Questionnaire
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: subtextColor }]}>Re-evaluate your learning pace</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={subtextColor} />
              </TouchableOpacity>

              {/* Offline Cache Reset */}
              <TouchableOpacity
                style={[
                  styles.actionRow,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={handleClearCache}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="refresh-circle-outline" size={20} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: textColor }]}>
                    Clear Cache & Re-sync Syllabus
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: subtextColor }]}>Download fresh notes from Cloud Run</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={subtextColor} />
              </TouchableOpacity>

              {/* Sign Out Button */}
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                <Text style={styles.logoutText}>Sign Out from Saral Vidhya</Text>
              </TouchableOpacity>

              <Text style={styles.versionInfo}>Saral Vidhya Mobile • v1.0.0 (ANGRAU Production Grade)</Text>
            </View>
          ) : null}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  contentWrap: {
    width: '100%',
  },
  profileCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  profileRoll: {
    fontSize: 13,
    marginBottom: 8,
  },
  uniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064e3b22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  uniBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  programText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personaTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  changePersonaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#064e3b22',
    borderRadius: BorderRadius.full,
  },
  changePersonaText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  personaDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  themePillActive: {
    backgroundColor: '#22c55e',
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themePillTextActive: {
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: '#ef444415',
    borderWidth: 1,
    borderColor: '#ef444444',
    marginTop: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  versionInfo: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 16,
  },
  rankingsHeaderCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 16,
  },
  statewidePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#064e3b22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  statewidePillText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rankingsTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  rankingsSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  podiumCol: {
    alignItems: 'center',
    flex: 1,
  },
  podiumMedal: {
    fontSize: 26,
    marginBottom: 4,
  },
  podiumBar: {
    width: '100%',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumBar1: {
    height: 100,
    backgroundColor: '#22c55e',
  },
  podiumBar2: {
    height: 75,
    backgroundColor: '#3b82f6',
  },
  podiumBar3: {
    height: 55,
    backgroundColor: '#f59e0b',
  },
  podiumRank: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  podiumPoints: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '800',
  },
  listContainer: {
    gap: 8,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  studentRowUser: {
    borderWidth: 1.5,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeUser: {
    backgroundColor: '#22c55e',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rankTextUser: {
    color: '#FFFFFF',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
  },
  studentRoll: {
    fontSize: 11,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 10,
  },
  streakText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '700',
  },
  pointsBadge: {
    alignItems: 'flex-end',
  },
  pointsText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '800',
  },
  ptsLabel: {
    fontSize: 9,
  },
});
