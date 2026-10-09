import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';

const UNIVERSITIES = [
  {
    id: 'angrau',
    name: 'Acharya N.G. Ranga Agricultural University (ANGRAU)',
    location: 'Lam, Guntur, Andhra Pradesh',
    badge: 'Active Official Curriculum',
    selected: true,
  },
];

const PROGRAMS = [
  { id: 'bsc_agri', name: 'B.Sc. (Hons.) Agriculture', code: 'AGRI-UG' },
  { id: 'btech_agri', name: 'B.Tech. (Agricultural Engineering)', code: 'AGENG-UG' },
  { id: 'bsc_comm', name: 'B.Sc. (Hons.) Community Science', code: 'COMSC-UG' },
];

const SEMESTERS = [
  'Semester 1',
  'Semester 2',
  'Semester 3 (ENTO 131 Active)',
  'Semester 4',
  'Semester 5',
  'Semester 6',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { isDark } = useAppTheme();
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0].name);
  const [selectedSemester, setSelectedSemester] = useState(SEMESTERS[2]);

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateProfile({
      university: UNIVERSITIES[0].name,
      program: selectedProgram,
      semester: selectedSemester,
    });
    router.push('/(auth)/persona');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' }]} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepBadge}>STEP 1 OF 3</Text>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>Academic Profile</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#A6C5B3' : '#688875' }]}>
          Welcome, {user?.name || 'Student'}! Confirm your university and curriculum details to personalize your study resources.
        </Text>
      </View>

      {/* University Card */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: isDark ? '#A6C5B3' : '#688875' }]}>UNIVERSITY & BOARD</Text>
        <View style={[styles.selectedUniCard, { backgroundColor: isDark ? '#23322B' : '#ffffff', borderColor: '#22c55e' }]}>
          <View style={styles.uniIconBadge}>
            <Ionicons name="school" size={24} color="#22c55e" />
          </View>
          <View style={styles.uniInfo}>
            <View style={styles.badgeRow}>
              <Text style={styles.activeTag}>OFFICIAL ANGRAU</Text>
            </View>
            <Text style={[styles.uniName, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>{UNIVERSITIES[0].name}</Text>
            <Text style={[styles.uniLocation, { color: isDark ? '#A6C5B3' : '#688875' }]}>{UNIVERSITIES[0].location}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
        </View>
      </View>

      {/* Program Selector */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: isDark ? '#A6C5B3' : '#688875' }]}>SELECT DEGREE PROGRAM</Text>
        {PROGRAMS.map((prog) => {
          const isSelected = selectedProgram === prog.name;
          return (
            <TouchableOpacity
              key={prog.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isDark ? '#23322B' : '#ffffff',
                  borderColor: isSelected ? '#22c55e' : (isDark ? '#3D5449' : '#E5DDD8'),
                },
                isSelected && (isDark ? { backgroundColor: 'rgba(34, 197, 94, 0.15)' } : { backgroundColor: 'rgba(34, 197, 94, 0.08)' }),
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedProgram(prog.name);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.radioOuter, { borderColor: isSelected ? '#22c55e' : (isDark ? '#557A65' : '#8A7A70') }]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: isDark ? '#FFFFFF' : '#1C2E24' }, isSelected && { fontWeight: '700' }]}>
                  {prog.name}
                </Text>
                <Text style={[styles.optionCode, { color: isDark ? '#A6C5B3' : '#688875' }]}>{prog.code}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Semester Selector */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: isDark ? '#A6C5B3' : '#688875' }]}>SELECT CURRENT SEMESTER</Text>
        <View style={styles.chipGrid}>
          {SEMESTERS.map((sem) => {
            const isSelected = selectedSemester === sem;
            return (
              <TouchableOpacity
                key={sem}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isDark ? '#23322B' : '#ffffff',
                    borderColor: isSelected ? '#22c55e' : (isDark ? '#3D5449' : '#E5DDD8'),
                  },
                  isSelected && (isDark ? { backgroundColor: 'rgba(34, 197, 94, 0.15)' } : { backgroundColor: 'rgba(34, 197, 94, 0.08)' }),
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSemester(sem);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: isDark ? '#A6C5B3' : '#688875' }, isSelected && { color: '#22c55e', fontWeight: '700' }]}>
                  {sem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Next: Select Learning Persona</Text>
        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D3E36',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 50 : 30,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.four,
  },
  stepBadge: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
  },
  selectedUniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#22c55e66',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: 12,
  },
  uniIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#064e3b33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uniInfo: {
    flex: 1,
  },
  badgeRow: {
    marginBottom: 4,
  },
  activeTag: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  uniName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  uniLocation: {
    color: '#94a3b8',
    fontSize: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#064e3b1a',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  optionTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTitleSelected: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  optionCode: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e22',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#4ade80',
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#22c55e',
    borderRadius: BorderRadius.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.three,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
