import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { EntomologyMenuCard } from '@/components/study/EntomologyMenuCard';

interface SubjectItem {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
}

const SUBJECT_LIST: SubjectItem[] = [
  { id: 'ento_131', title: 'Entomology', subtitle: 'B.Sc Agriculture', progress: 50 },
  { id: 'agro_101', title: 'Agronomy', subtitle: 'B.Sc Agriculture', progress: 50 },
  { id: 'path_101', title: 'Plant Pathology', subtitle: 'B.Sc Agriculture', progress: 50 },
  { id: 'soil_101', title: 'Soil Science', subtitle: 'B.Sc Agriculture', progress: 50 },
  { id: 'gpb_101', title: 'Genetics & Breeding', subtitle: 'B.Sc Agriculture', progress: 50 },
];

export default function SubjectSelectionScreen() {
  const router = useRouter();
  const { isDark, setThemeMode } = useAppTheme();

  // Screen background matching user reference images
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

  const handleSubjectSelect = (subject: SubjectItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // When clicked, open the next page that the user will provide!
    router.push({
      pathname: '/subjects/[subjectId]',
      params: { subjectId: subject.id, subjectTitle: subject.title },
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
            Select Subject
          </Text>
          <Text style={[styles.navSubtitle, { color: subtextColor }]}>
            B.Sc. (Hons) Agriculture • Semester 3
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

      {/* Scrollable Subject Cards List matching user reference PNGs */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SUBJECT_LIST.map((subj) => (
          <EntomologyMenuCard
            key={subj.id}
            isDark={isDark}
            title={subj.title}
            subtitle={subj.subtitle}
            progress={subj.progress}
            onPress={() => handleSubjectSelect(subj)}
          />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
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
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  navSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
});
