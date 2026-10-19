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
    description: 'Digestive System & Insect Anatomy',
  },
  {
    id: 2,
    title: 'Unit 2',
    description: 'Metamorphosis & Life Cycles',
  },
  {
    id: 3,
    title: 'Unit 3',
    description: 'Weathering & Abiotic Factors',
  },
  {
    id: 4,
    title: 'Unit 4',
    description: 'Pollination & Floral Biology',
  },
];

interface PYQSelectionViewProps {
  units?: UnitItem[];
  pageTitle?: string;
  backLabel?: string;
  onBack?: () => void;
  onStart?: (config: { selectedUnits: number[]; questionCount: number }) => void;
}

export default function PYQSelectionView({
  units = DEFAULT_UNITS,
  pageTitle = 'Preparation Exam',
  backLabel = 'Back to Study Table',
  onBack,
  onStart,
}: PYQSelectionViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [selectedUnits, setSelectedUnits] = useState<number[]>([1]);
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Exact color palettes from Figma DevMode CSS exports
  const colors = isDark
    ? {
        screenBg: '#2D3E36',
        cardBg: '#1E2B24',
        cardBorder: '#3D5449',
        titleColor: '#fefefe',
        subtitleColor: '#acc0b5',
        backArrowColor: '#a6c8b7',
        // Unit states
        unitSelectedBg: '#147A43',
        unitSelectedBorder: '#a6c8b7',
        unitUnselectedBg: '#1E2B24',
        unitUnselectedBorder: '#3D5449',
        unitDesc: '#acc0b5',
        checkSelectedBg: '#a6c8b7',
        checkSelectedTick: '#172a24',
        checkUnselectedBorder: '#789486',
        // Question Chips
        chipSelectedBg: '#a6c8b7',
        chipSelectedText: '#172a24',
        chipSelectedTickBox: 'rgba(23, 42, 36, 0.15)',
        chipUnselectedBg: '#1E2B24',
        chipUnselectedBorder: '#3D5449',
        chipUnselectedText: '#fefefe',
        // CTA
        buttonBg: '#a6c8b7',
        buttonText: '#172a24',
        encouragementText: '#acc0b5',
      }
    : {
        screenBg: '#FFF6F1',
        cardBg: '#FFFFFF',
        cardBorder: '#E5DDD8',
        titleColor: '#172a24',
        subtitleColor: '#5c7066',
        backArrowColor: '#467563',
        // Unit states
        unitSelectedBg: '#e2eee7',
        unitSelectedBorder: '#467563',
        unitUnselectedBg: '#ffffff',
        unitUnselectedBorder: '#d8e3dd',
        unitDesc: '#5c7066',
        checkSelectedBg: '#467563',
        checkSelectedTick: '#ffffff',
        checkUnselectedBorder: '#9aafa5',
        // Question Chips
        chipSelectedBg: '#467563',
        chipSelectedText: '#ffffff',
        chipSelectedTickBox: 'rgba(255, 255, 255, 0.15)',
        chipUnselectedBg: '#e2eee7',
        chipUnselectedBorder: '#c8d8cf',
        chipUnselectedText: '#172a24',
        // CTA
        buttonBg: '#467563',
        buttonText: '#ffffff',
        encouragementText: '#5c7066',
      };

  const toggleUnit = (unitId: number) => {
    Haptics.selectionAsync();
    setSelectedUnits((prev) => {
      if (prev.includes(unitId)) {
        // Keep at least one unit selected
        if (prev.length === 1) return prev;
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
            paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 6),
            paddingBottom: insets.bottom + 24,
          },
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainStack}>
          {/* Header Row */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  backgroundColor: isDark ? '#1a2822' : '#ffffff',
                  borderColor: isDark ? '#354b40' : '#d8e3dd',
                },
              ]}
              onPress={onBack}
              activeOpacity={0.75}
              accessibilityLabel="Back"
            >
              <Text style={[styles.backArrow, { color: colors.backArrowColor }]}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={[styles.backLabel, { color: colors.subtitleColor }]}>
                {backLabel}
              </Text>
              <Text style={[styles.pageTitle, { color: colors.titleColor }]}>
                {pageTitle}
              </Text>
            </View>
          </View>

          {/* Units Selection Card */}
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
              <Text style={[styles.cardTitle, { color: colors.titleColor }]}>
                Choose units to prepare
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.subtitleColor }]}>
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
                            borderWidth: 2,
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
                      <Text style={[styles.unitTitle, { color: colors.titleColor }]}>
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
                          styles.selectionBoxActive,
                          { backgroundColor: colors.checkSelectedBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.checkTick,
                            { color: colors.checkSelectedTick },
                          ]}
                        >
                          ✓
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.selectionBoxInactive,
                          {
                            backgroundColor: isDark ? '#1a2822' : '#ffffff',
                            borderColor: colors.checkUnselectedBorder,
                          },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Number of Questions / Test Length Card */}
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
              <Text style={[styles.cardTitle, { color: colors.titleColor }]}>
                Number of questions
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.subtitleColor }]}>
                Choose your test length
              </Text>
            </View>

            <View style={styles.chipsRow}>
              {[10, 20].map((count) => {
                const isSelected = questionCount === count;
                return (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.chip,
                      isSelected
                        ? [
                            styles.chipSelected,
                            { backgroundColor: colors.chipSelectedBg },
                          ]
                        : [
                            styles.chipUnselected,
                            {
                              backgroundColor: colors.chipUnselectedBg,
                              borderColor: colors.chipUnselectedBorder,
                            },
                          ],
                    ]}
                    onPress={() => handleSelectCount(count)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.chipTickSquare,
                          { backgroundColor: colors.chipSelectedTickBox },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipTickText,
                            { color: colors.chipSelectedText },
                          ]}
                        >
                          ✓
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected
                            ? colors.chipSelectedText
                            : colors.chipUnselectedText,
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

          {/* Start CTA Button */}
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.buttonBg }]}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={[styles.startButtonText, { color: colors.buttonText }]}>
              Start
            </Text>
          </TouchableOpacity>

          {/* Encouragement Footer */}
          <Text style={[styles.encouragement, { color: colors.encouragementText }]}>
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
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  mainStack: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  headerCopy: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  unitList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  unitItem: {
    width: '100%',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  unitTextContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  unitDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  selectionBoxActive: {
    height: 24,
    width: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTick: {
    fontSize: 13,
    fontWeight: '800',
  },
  selectionBoxInactive: {
    height: 24,
    width: 24,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chip: {
    height: 40,
    width: 98,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  chipSelected: {},
  chipUnselected: {
    borderWidth: 1,
  },
  chipTickSquare: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTickText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  encouragement: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 8,
  },
});
