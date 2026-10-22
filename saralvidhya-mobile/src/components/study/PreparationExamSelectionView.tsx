import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export interface UnitItem {
  id: number;
  title: string;
  description: string;
}

export const DEFAULT_UNITS: UnitItem[] = [
  {
    id: 1,
    title: 'Unit 1',
    description: 'Insect Digestive System & Anatomy',
  },
  {
    id: 2,
    title: 'Unit 2',
    description: 'Insect Morphology & Structural Taxonomy',
  },
  {
    id: 3,
    title: 'Unit 3',
    description: 'Weathering',
  },
  {
    id: 4,
    title: 'Unit 4',
    description: 'Pollination',
  },
];

interface PreparationExamSelectionViewProps {
  units?: UnitItem[];
  pageTitle?: string;
  backLabel?: string;
  onBack?: () => void;
  onStart?: (config: { selectedUnits: number[]; questionCount: number }) => void;
}

export default function PreparationExamSelectionView({
  units = DEFAULT_UNITS,
  pageTitle = 'Preparation Exam',
  backLabel = 'Back to Study Table',
  onBack,
  onStart,
}: PreparationExamSelectionViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [selectedUnits, setSelectedUnits] = useState<number[]>([1]);
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Exact 1:1 color palettes matching the Figma/PNG design
  const colors = isDark
    ? {
        screenBg: '#0F1713',
        backCircleBg: '#17241E',
        backCircleBorder: '#283B32',
        backArrowColor: '#8FA89B',
        backLabelColor: '#8FA89B',
        titleColor: '#FFFFFF',
        // Card container
        cardBg: '#15211B',
        cardBorder: '#23342B',
        cardTitle: '#FFFFFF',
        cardSubtitle: '#8FA89B',
        // Units
        unitSelectedBg: '#243A30',
        unitSelectedBorder: '#96BCA8',
        unitUnselectedBg: '#19251F',
        unitUnselectedBorder: '#273830',
        unitTitleSelected: '#FFFFFF',
        unitTitleUnselected: '#FFFFFF',
        unitDesc: '#8FA89B',
        checkboxSelectedBg: '#96BCA8',
        checkboxCheckColor: '#15261E',
        checkboxUnselectedBorder: '#486355',
        // Question count pills
        pillSelectedBg: '#96BCA8',
        pillSelectedText: '#15261E',
        pillSelectedCheck: '#15261E',
        pillUnselectedBg: '#23342B',
        pillUnselectedText: '#FFFFFF',
        // Start button
        startBtnBg: '#96BCA8',
        startBtnText: '#15261E',
        footerText: '#8FA89B',
      }
    : {
        screenBg: '#F4F7F5',
        backCircleBg: '#FFFFFF',
        backCircleBorder: '#DCE5E0',
        backArrowColor: '#3A5447',
        backLabelColor: '#5C7066',
        titleColor: '#172A21',
        // Card container
        cardBg: '#FFFFFF',
        cardBorder: '#DFE7E2',
        cardTitle: '#172A21',
        cardSubtitle: '#5C7066',
        // Units
        unitSelectedBg: '#E2EDE7',
        unitSelectedBorder: '#3B6852',
        unitUnselectedBg: '#FFFFFF',
        unitUnselectedBorder: '#DFE7E2',
        unitTitleSelected: '#172A21',
        unitTitleUnselected: '#172A21',
        unitDesc: '#5C7066',
        checkboxSelectedBg: '#3B6852',
        checkboxCheckColor: '#FFFFFF',
        checkboxUnselectedBorder: '#9BB0A5',
        // Question count pills
        pillSelectedBg: '#3B6852',
        pillSelectedText: '#FFFFFF',
        pillSelectedCheck: '#FFFFFF',
        pillUnselectedBg: '#E2EDE7',
        pillUnselectedText: '#172A21',
        // Start button
        startBtnBg: '#3B6852',
        startBtnText: '#FFFFFF',
        footerText: '#5C7066',
      };

  const toggleUnit = (unitId: number) => {
    Haptics.selectionAsync();
    setSelectedUnits((prev) => {
      if (prev.includes(unitId)) {
        if (prev.length === 1) return prev; // Keep at least one unit selected
        return prev.filter((id) => id !== unitId);
      } else {
        return [...prev, unitId];
      }
    });
  };

  const handleSelectCount = (count: number) => {
    Haptics.selectionAsync();
    setQuestionCount(count);
  };

  const handleStart = () => {
    if (selectedUnits.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onStart) {
      onStart({
        selectedUnits,
        questionCount,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 8),
            paddingBottom: insets.bottom + 28,
          },
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainStack}>
          {/* Header Row: Circular back button + Back to Study Table / Preparation Exam */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.backCircleBg,
                  borderColor: colors.backCircleBorder,
                },
              ]}
              onPress={onBack}
              activeOpacity={0.75}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.backArrowColor} />
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={[styles.backLabel, { color: colors.backLabelColor }]}>
                {backLabel}
              </Text>
              <Text style={[styles.pageTitle, { color: colors.titleColor }]}>
                {pageTitle}
              </Text>
            </View>
          </View>

          {/* Card 1: Choose units to prepare */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.cardTitle }]}>
                Choose units to prepare
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.cardSubtitle }]}>
                Select one or more units
              </Text>
            </View>

            <View style={styles.unitList}>
              {units.map((unit) => {
                const isSelected = selectedUnits.includes(unit.id);
                return (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitItem,
                      isSelected
                        ? {
                            backgroundColor: colors.unitSelectedBg,
                            borderColor: colors.unitSelectedBorder,
                            borderWidth: 1.5,
                          }
                        : {
                            backgroundColor: colors.unitUnselectedBg,
                            borderColor: colors.unitUnselectedBorder,
                            borderWidth: 1,
                          },
                    ]}
                    onPress={() => toggleUnit(unit.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.unitTextContent}>
                      <Text
                        style={[
                          styles.unitTitle,
                          {
                            color: isSelected
                              ? colors.unitTitleSelected
                              : colors.unitTitleUnselected,
                          },
                        ]}
                      >
                        {unit.title}
                      </Text>
                      <Text
                        style={[styles.unitDescription, { color: colors.unitDesc }]}
                        numberOfLines={2}
                      >
                        {unit.description}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View
                        style={[
                          styles.checkboxBox,
                          { backgroundColor: colors.checkboxSelectedBg },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={17}
                          color={colors.checkboxCheckColor}
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.checkboxBox,
                          styles.checkboxInactive,
                          { borderColor: colors.checkboxUnselectedBorder },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Card 2: Number of questions */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.cardTitle }]}>
                Number of questions
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.cardSubtitle }]}>
                Choose your test length
              </Text>
            </View>

            <View style={styles.pillsRow}>
              {[10, 20].map((count) => {
                const isSelected = questionCount === count;
                return (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.pill,
                      isSelected
                        ? { backgroundColor: colors.pillSelectedBg }
                        : { backgroundColor: colors.pillUnselectedBg },
                    ]}
                    onPress={() => handleSelectCount(count)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.pillSelectedCheck}
                        style={styles.pillCheckIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isSelected
                            ? colors.pillSelectedText
                            : colors.pillUnselectedText,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: colors.startBtnBg },
              selectedUnits.length === 0 && styles.startButtonDisabled,
            ]}
            onPress={handleStart}
            activeOpacity={0.85}
            disabled={selectedUnits.length === 0}
          >
            <Text style={[styles.startButtonText, { color: colors.startBtnText }]}>
              Start
            </Text>
          </TouchableOpacity>

          {/* Encouragement Footer */}
          <Text style={[styles.encouragement, { color: colors.footerText }]}>
            You’ve got this!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tabletContainer: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  mainStack: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  backLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  unitList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  unitItem: {
    width: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  unitTextContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  unitTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  unitDescription: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '400',
  },
  checkboxBox: {
    height: 24,
    width: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pill: {
    height: 46,
    width: 100,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  pillCheckIcon: {
    marginRight: 2,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '700',
  },
  startButton: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  startButtonDisabled: {
    opacity: 0.45,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  encouragement: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
});
