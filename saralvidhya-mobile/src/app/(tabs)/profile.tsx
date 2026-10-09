import React from 'react';
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
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, persona, logout } = useAuth();
  const { themeMode, setThemeMode, isDark } = useAppTheme();

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#090d16' : '#f8fafc' }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header Profile Card */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
        ]}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </Text>
        </View>

        <Text style={[styles.profileName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          {user?.name || 'ANGRAU Student'}
        </Text>
        <Text style={styles.profileRoll}>{user?.rollNumber || 'AG-2023-131'}</Text>

        <View style={styles.uniBadge}>
          <Ionicons name="business" size={14} color="#22c55e" />
          <Text style={styles.uniBadgeText}>{user?.university}</Text>
        </View>
        <Text style={styles.programText}>
          {user?.program || 'B.Sc (Hons) Agriculture'} • {user?.semester || 'Semester 3'}
        </Text>
      </View>

      {/* Learning Persona Tier Card */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionLabel}>CURRENT LEARNING PERSONA</Text>
            <Text style={[styles.personaTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
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
        <Text style={styles.personaDesc}>
          {persona === 'beginner'
            ? 'Foundations first with simplified summaries and step-by-step guidance.'
            : persona === 'intermediate'
            ? 'Standard ANGRAU syllabus speed with balanced study guides and quizzes.'
            : 'Deep-dive mode with 10-mark past question papers and advanced taxonomy.'}
        </Text>
      </View>

      {/* Theme Controls */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
        ]}
      >
        <Text style={styles.sectionLabel}>APP THEME & FOCUS MODE</Text>
        <View style={styles.themeOptionsRow}>
          {(['light', 'dark', 'focus'] as const).map((mode) => {
            const isSelected = themeMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.themePill, isSelected && styles.themePillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setThemeMode(mode);
                }}
              >
                <Ionicons
                  name={mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'eye-off'}
                  size={16}
                  color={isSelected ? '#ffffff' : '#94a3b8'}
                />
                <Text style={[styles.themePillText, isSelected && styles.themePillTextActive]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Questionnaire Retake */}
      <TouchableOpacity
        style={[
          styles.actionRow,
          { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
        ]}
        onPress={() => router.push('/(auth)/questionnaire')}
      >
        <View style={styles.actionIcon}>
          <Ionicons name="clipboard-outline" size={20} color="#22c55e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Retake Diagnostic Questionnaire
          </Text>
          <Text style={styles.actionSubtitle}>Re-evaluate your learning style & pace</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </TouchableOpacity>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out from Saral Vidhya</Text>
      </TouchableOpacity>

      <Text style={styles.versionInfo}>Saral Vidhya Mobile • v1.0.0 (Expo Android)</Text>
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
  profileCard: {
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#064e3b33',
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '800',
    color: '#22c55e',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileRoll: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  uniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064e3b22',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: 10,
  },
  uniBadgeText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
  },
  programText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  personaTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  changePersonaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064e3b22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  changePersonaText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  personaDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginTop: 4,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.two,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    gap: 6,
  },
  themePillActive: {
    backgroundColor: '#22c55e',
  },
  themePillText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  themePillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    gap: 12,
    marginBottom: Spacing.three,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#064e3b22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#450a0a22',
    borderColor: '#ef444466',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: 48,
    gap: 8,
    marginTop: Spacing.two,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  versionInfo: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 11,
    marginTop: Spacing.four,
  },
});
