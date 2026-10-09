import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';

const LEADERBOARD_STUDENTS = [
  { rank: 1, name: 'Priya K.', roll: 'AG-2023-014', points: 2840, streak: 18, badge: '🥇' },
  { rank: 2, name: 'Kiran Reddy', roll: 'AG-2023-089', points: 2690, streak: 14, badge: '🥈' },
  { rank: 3, name: 'Sanjay Varma', roll: 'AG-2023-042', points: 2510, streak: 12, badge: '🥉' },
  { rank: 4, name: 'Aditya (You)', roll: 'AG-2023-131', points: 2380, streak: 5, badge: '⭐', isUser: true },
  { rank: 5, name: 'Anusha M.', roll: 'AG-2023-076', points: 2240, streak: 9, badge: '' },
  { rank: 6, name: 'Ravi Teja', roll: 'AG-2023-112', points: 2100, streak: 7, badge: '' },
];

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { isDark } = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.badge}>STATEWIDE RANKINGS</Text>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
          Study Leaderboard
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#A6C5B3' : '#688875' }]}>
          Earn points by completing reading notes, scoring above 80% on assessments, and maintaining study streaks.
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
          <Text style={[styles.podiumName, { color: isDark ? '#FFFFFF' : '#1C2E24' }]} numberOfLines={1}>{LEADERBOARD_STUDENTS[1].name}</Text>
          <Text style={styles.podiumPoints}>{LEADERBOARD_STUDENTS[1].points} pts</Text>
        </View>

        {/* Rank 1 */}
        <View style={styles.podiumCol}>
          <Text style={styles.podiumMedal}>🥇</Text>
          <View style={[styles.podiumBar, styles.podiumBar1]}>
            <Text style={styles.podiumRank}>1</Text>
          </View>
          <Text style={[styles.podiumName, { color: isDark ? '#FFFFFF' : '#1C2E24' }]} numberOfLines={1}>{LEADERBOARD_STUDENTS[0].name}</Text>
          <Text style={styles.podiumPoints}>{LEADERBOARD_STUDENTS[0].points} pts</Text>
        </View>

        {/* Rank 3 */}
        <View style={styles.podiumCol}>
          <Text style={styles.podiumMedal}>🥉</Text>
          <View style={[styles.podiumBar, styles.podiumBar3]}>
            <Text style={styles.podiumRank}>3</Text>
          </View>
          <Text style={[styles.podiumName, { color: isDark ? '#FFFFFF' : '#1C2E24' }]} numberOfLines={1}>{LEADERBOARD_STUDENTS[2].name}</Text>
          <Text style={styles.podiumPoints}>{LEADERBOARD_STUDENTS[2].points} pts</Text>
        </View>
      </View>

      {/* Full Leaderboard List */}
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
                  : (isDark ? '#23322B' : '#ffffff'),
                borderColor: item.isUser ? '#22c55e' : (isDark ? '#3D5449' : '#E5DDD8'),
              },
            ]}
          >
            <View style={[styles.rankBadge, item.isUser && styles.rankBadgeUser, !item.isUser && { backgroundColor: isDark ? '#374B41' : '#F7EBE3' }]}>
              <Text style={[styles.rankText, item.isUser && styles.rankTextUser, !item.isUser && { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
                #{item.rank}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.studentName, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
                  {item.isUser ? `${user?.name || item.name} (You)` : item.name}
                </Text>
                {item.badge ? <Text>{item.badge}</Text> : null}
              </View>
              <Text style={[styles.studentRoll, { color: isDark ? '#A6C5B3' : '#688875' }]}>{item.roll}</Text>
            </View>

            <View style={styles.scoreCol}>
              <Text style={styles.scoreText}>{item.points} pts</Text>
              <Text style={styles.streakText}>🔥 {item.streak}d streak</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 50 : 30,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.four,
  },
  badge: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: Spacing.three,
    gap: 12,
  },
  podiumCol: {
    alignItems: 'center',
    width: 90,
  },
  podiumMedal: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumBar: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  podiumBar1: {
    height: 90,
    backgroundColor: '#eab308',
  },
  podiumBar2: {
    height: 70,
    backgroundColor: '#94a3b8',
  },
  podiumBar3: {
    height: 50,
    backgroundColor: '#b45309',
  },
  podiumRank: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  podiumName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  podiumPoints: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    gap: 10,
    marginTop: Spacing.three,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    gap: 12,
  },
  studentRowUser: {
    backgroundColor: '#064e3b18',
    borderWidth: 1.5,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeUser: {
    backgroundColor: '#22c55e',
  },
  rankText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
  },
  rankTextUser: {
    color: '#ffffff',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentRoll: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '800',
  },
  streakText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 2,
  },
});
