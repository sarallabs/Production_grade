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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { manifestService, Subject } from '@/api/manifestService';
import { EntomologyMenuCard } from '@/components/study/EntomologyMenuCard';

export default function MainMenuScreen() {
  const router = useRouter();
  const { user, persona } = useAuth();
  const { isDark, setThemeMode } = useAppTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const list = await manifestService.getSubjects();
    setSubjects(list);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubjects();
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

  // Color tokens matching user reference images
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
              ANGRAU • B.Sc. (Hons) Agriculture
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

        {/* Section Label */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: headerTextColor }]}>
            Course Overview
          </Text>
          <Text style={[styles.semesterTag, { color: subtextColor, backgroundColor: badgeBg }]}>
            Semester 3
          </Text>
        </View>

        {/* Featured Main Menu Card (Matching 1st PNG & 2nd PNG) */}
        <View style={styles.featuredContainer}>
          <EntomologyMenuCard
            isDark={isDark}
            onPress={handleCardPress}
          />
        </View>

        {/* Card Interaction Hint */}
        <Text style={[styles.hintText, { color: subtextColor }]}>
          Tap the course card above to open chapters & syllabus
        </Text>
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
    marginBottom: 28,
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
    fontSize: 17,
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
  featuredContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 14,
    opacity: 0.8,
  },
});
