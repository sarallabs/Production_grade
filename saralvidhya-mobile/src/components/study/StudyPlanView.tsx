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

export interface StudyPlanTask {
  id: string;
  title: string;
  category: string;
  duration: string;
  actionLabel: string;
  completed?: boolean;
  type: 'mindmap' | 'review' | 'video' | 'quiz';
}

export const DEFAULT_STUDY_TASKS: StudyPlanTask[] = [
  {
    id: 'task_1',
    title: 'Mindmaps (L0-L1)',
    category: 'Mindmap',
    duration: '10m',
    actionLabel: 'Open →',
    type: 'mindmap',
  },
  {
    id: 'task_2',
    title: 'Key Takeaways',
    category: 'Review',
    duration: '15m',
    actionLabel: 'Open →',
    type: 'review',
  },
  {
    id: 'task_3',
    title: 'Video Script (Part 1)',
    category: 'Video',
    duration: '20m',
    actionLabel: 'Watch →',
    type: 'video',
  },
  {
    id: 'task_4',
    title: 'Easy MCQ Quiz',
    category: 'Quiz',
    duration: '15m',
    actionLabel: 'Start →',
    type: 'quiz',
  },
];

interface StudyPlanViewProps {
  unitCode?: string;
  unitName?: string;
  subjectName?: string;
  totalMins?: number;
  totalTasksCount?: number;
  modulesCount?: number;
  currentDay?: number;
  totalDays?: number;
  startDate?: string;
  onOpenTask?: (task: StudyPlanTask) => void;
  onBack?: () => void;
}

export default function StudyPlanView({
  unitCode = 'ENTO 131 · UNIT I',
  unitName = 'Insect Digestive System & Anatomy',
  subjectName = 'Entomology',
  totalMins = 300,
  totalTasksCount = 18,
  modulesCount = 5,
  currentDay = 1,
  totalDays = 5,
  startDate = '15 Oct 2026',
  onOpenTask,
  onBack,
}: StudyPlanViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [tasks, setTasks] = useState<StudyPlanTask[]>(DEFAULT_STUDY_TASKS);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});

  const completedTodayCount = tasks.filter((t) => completedTaskIds[t.id]).length;
  const todayProgressPercent = Math.round((completedTodayCount / tasks.length) * 100);
  const overallDoneCount = completedTodayCount;
  const overallProgressPercent = Math.round((overallDoneCount / totalTasksCount) * 100);

  // Exact color palettes from Figma DevMode CSS exports
  const colors = isDark
    ? {
        screenBg: '#2D3E36',
        cardBg: '#1E2B24',
        cardBorder: '#3D5449',
        cardSecondaryBg: '#253B30',
        primaryText: '#e8f2ee',
        secondaryText: '#8fa39a',
        accentGreen: '#7ba88b',
        progressTrack: '#3D5449',
        progressFill: '#7ba88b',
        buttonPrimaryBg: '#355847',
        buttonPrimaryText: '#ffffff',
        actionBtnBg: '#253B30',
        actionBtnBorder: '#3D5449',
        actionBtnText: '#7ba88b',
        checkboxBorder: '#3D5449',
        checkboxCheckedBg: '#355847',
      }
    : {
        screenBg: '#FFF6F1',
        cardBg: '#FFFFFF',
        cardBorder: '#E5DDD8',
        cardSecondaryBg: '#eaf2ed',
        primaryText: '#24382f',
        secondaryText: '#66786e',
        accentGreen: '#477562',
        progressTrack: '#d7e3dc',
        progressFill: '#477562',
        buttonPrimaryBg: '#355847',
        buttonPrimaryText: '#ffffff',
        actionBtnBg: '#eaf2ed',
        actionBtnBorder: '#d7e3dc',
        actionBtnText: '#477562',
        checkboxBorder: '#d7e3dc',
        checkboxCheckedBg: '#477562',
      };

  const toggleTaskCompleted = (taskId: string) => {
    Haptics.selectionAsync();
    setCompletedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleMarkModuleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated: Record<string, boolean> = {};
    tasks.forEach((t) => {
      updated[t.id] = true;
    });
    setCompletedTaskIds(updated);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.screenBg }]}
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
        {/* Top Header Row with Icon & Titles */}
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.cardSecondaryBg,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={[styles.backArrowText, { color: colors.accentGreen }]}>←</Text>
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: colors.cardSecondaryBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.iconBoxSymbol, { color: colors.accentGreen }]}>▦</Text>
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.unitCodeTitle, { color: colors.primaryText }]}>
              {unitCode}
            </Text>
            <Text style={[styles.unitNameSub, { color: colors.secondaryText }]}>
              {unitName}
            </Text>
          </View>
        </View>

        {/* Overall Progress Banner Card */}
        <View
          style={[
            styles.overallCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.overallLeft}>
            <Text style={[styles.minsTotalText, { color: colors.primaryText }]}>
              {totalMins} mins total
            </Text>
            <Text style={[styles.startDateText, { color: colors.secondaryText }]}>
              Start · {startDate}
            </Text>
          </View>

          <View style={styles.overallRight}>
            <Text style={[styles.doneFractionText, { color: colors.primaryText }]}>
              {overallDoneCount} / {totalTasksCount} done
            </Text>
            <View style={[styles.overallTrack, { backgroundColor: colors.progressTrack }]}>
              <View
                style={[
                  styles.overallFill,
                  {
                    backgroundColor: colors.progressFill,
                    width: `${Math.max(4, overallProgressPercent)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Study Plan Overview Heading */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            Study plan overview
          </Text>
          <Text style={[styles.sectionSub, { color: colors.secondaryText }]}>
            {totalDays}-day {subjectName} learning plan
          </Text>
        </View>

        {/* 3 Summary Stat Cards: Total Time | Total Tasks | Modules */}
        <View style={styles.statCardsRow}>
          {/* Card 1: Total Time */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardSecondaryBg },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.accentGreen }]}>
              TOTAL TIME
            </Text>
            <Text style={[styles.statValue, { color: colors.primaryText }]}>
              {totalMins} min
            </Text>
            <Text style={[styles.statSub, { color: colors.secondaryText }]}>
              {Math.round(totalMins / totalDays)} min/day
            </Text>
          </View>

          {/* Card 2: Total Tasks */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardSecondaryBg },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.accentGreen }]}>
              TOTAL TASKS
            </Text>
            <Text style={[styles.statValue, { color: colors.primaryText }]}>
              {totalTasksCount}
            </Text>
            <Text style={[styles.statSub, { color: colors.secondaryText }]}>
              Across {totalDays} days
            </Text>
          </View>

          {/* Card 3: Modules */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardSecondaryBg },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.accentGreen }]}>
              MODULES
            </Text>
            <Text style={[styles.statValue, { color: colors.primaryText }]}>
              {modulesCount}
            </Text>
            <Text style={[styles.statSub, { color: colors.secondaryText }]}>
              Core topics
            </Text>
          </View>
        </View>

        {/* Study Focus Card */}
        <View
          style={[
            styles.studyFocusCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.focusHeaderRow}>
            <Text style={[styles.focusCardTitle, { color: colors.primaryText }]}>
              Study focus
            </Text>
            <View
              style={[
                styles.dayPill,
                { backgroundColor: colors.cardSecondaryBg },
              ]}
            >
              <Text style={[styles.dayPillText, { color: colors.accentGreen }]}>
                Day {currentDay}
              </Text>
            </View>
          </View>

          <Text style={[styles.focusDesc, { color: colors.secondaryText }]}>
            Focus on the core concepts first, then reinforce with review and practice.
          </Text>

          <View style={styles.focusPillsRow}>
            <View
              style={[
                styles.focusSubPill,
                { backgroundColor: colors.cardSecondaryBg },
              ]}
            >
              <Text style={[styles.focusSubPillLabel, { color: colors.accentGreen }]}>
                FOCUS
              </Text>
              <Text style={[styles.focusSubPillValue, { color: colors.primaryText }]}>
                Concepts
              </Text>
            </View>

            <View
              style={[
                styles.focusSubPill,
                { backgroundColor: colors.cardSecondaryBg },
              ]}
            >
              <Text style={[styles.focusSubPillLabel, { color: colors.accentGreen }]}>
                REVIEW
              </Text>
              <Text style={[styles.focusSubPillValue, { color: colors.primaryText }]}>
                15 min
              </Text>
            </View>

            <View
              style={[
                styles.focusSubPill,
                { backgroundColor: colors.cardSecondaryBg },
              ]}
            >
              <Text style={[styles.focusSubPillLabel, { color: colors.accentGreen }]}>
                PRACTICE
              </Text>
              <Text style={[styles.focusSubPillValue, { color: colors.primaryText }]}>
                Quiz
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Section Header */}
        <View style={styles.todayHeader}>
          <Text style={[styles.todayTitle, { color: colors.primaryText }]}>
            Today · Day {currentDay} of {totalDays}
          </Text>
          <Text style={[styles.todaySub, { color: colors.secondaryText }]}>
            Thu, Oct 15  ·  60 minutes
          </Text>
        </View>

        {/* Current Module Banner */}
        <View
          style={[
            styles.moduleCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.moduleTextWrap}>
            <Text style={[styles.moduleLabel, { color: colors.accentGreen }]}>
              Module 1
            </Text>
            <Text style={[styles.moduleName, { color: colors.primaryText }]}>
              Database Fundamentals
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.markDoneButton,
              { backgroundColor: colors.buttonPrimaryBg },
            ]}
            onPress={handleMarkModuleDone}
            activeOpacity={0.8}
          >
            <Text style={[styles.markDoneText, { color: colors.buttonPrimaryText }]}>
              Mark done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Progress Banner */}
        <View
          style={[
            styles.todayProgressBanner,
            { backgroundColor: colors.cardSecondaryBg },
          ]}
        >
          <Text style={[styles.todayProgressLabel, { color: colors.accentGreen }]}>
            TODAY'S PROGRESS
          </Text>

          <View style={styles.todayProgressRow}>
            <Text style={[styles.todayTasksText, { color: colors.primaryText }]}>
              {completedTodayCount} of {tasks.length} tasks completed
            </Text>
            <Text style={[styles.todayPercentText, { color: colors.secondaryText }]}>
              {todayProgressPercent}%
            </Text>
          </View>

          <View style={[styles.todayTrack, { backgroundColor: colors.progressTrack }]}>
            <View
              style={[
                styles.todayFill,
                {
                  backgroundColor: colors.progressFill,
                  width: `${todayProgressPercent}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* 4 Daily Tasks Checklist */}
        <View style={styles.tasksList}>
          {tasks.map((task) => {
            const isCompleted = !!completedTaskIds[task.id];
            return (
              <View
                key={task.id}
                style={[
                  styles.taskItemCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                {/* Interactive Checkbox */}
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    isCompleted
                      ? {
                          backgroundColor: colors.checkboxCheckedBg,
                          borderColor: colors.checkboxCheckedBg,
                        }
                      : {
                          backgroundColor: colors.cardBg,
                          borderColor: colors.checkboxBorder,
                        },
                  ]}
                  onPress={() => toggleTaskCompleted(task.id)}
                  activeOpacity={0.7}
                >
                  {isCompleted && (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  )}
                </TouchableOpacity>

                {/* Title & Duration */}
                <View style={styles.taskTextContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: colors.primaryText,
                        textDecorationLine: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.6 : 1,
                      },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <Text style={[styles.taskSub, { color: colors.secondaryText }]}>
                    {task.category} · {task.duration}
                  </Text>
                </View>

                {/* Open / Watch / Start CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.taskActionBtn,
                    {
                      backgroundColor: colors.actionBtnBg,
                      borderColor: colors.actionBtnBorder,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (onOpenTask) onOpenTask(task);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.taskActionText, { color: colors.actionBtnText }]}>
                    {task.actionLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowText: {
    fontSize: 18,
    fontWeight: '700',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSymbol: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTextWrap: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  unitCodeTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  unitNameSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  overallCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallLeft: {
    flexDirection: 'column',
    gap: 3,
  },
  minsTotalText: {
    fontSize: 11,
    fontWeight: '700',
  },
  startDateText: {
    fontSize: 10,
    fontWeight: '500',
  },
  overallRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 5,
  },
  doneFractionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overallTrack: {
    width: 120,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  statCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'column',
    gap: 3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 9,
    fontWeight: '500',
  },
  studyFocusCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'column',
    gap: 8,
  },
  focusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  dayPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  focusDesc: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  focusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  focusSubPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'column',
    gap: 2,
  },
  focusSubPillLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  focusSubPillValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  todayHeader: {
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
  },
  todayTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  todaySub: {
    fontSize: 11,
    fontWeight: '500',
  },
  moduleCard: {
    width: '100%',
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleTextWrap: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  moduleLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '700',
  },
  markDoneButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDoneText: {
    fontSize: 11,
    fontWeight: '700',
  },
  todayProgressBanner: {
    borderRadius: 11,
    padding: 12,
    flexDirection: 'column',
    gap: 6,
  },
  todayProgressLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  todayProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayTasksText: {
    fontSize: 11,
    fontWeight: '700',
  },
  todayPercentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  todayTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  todayFill: {
    height: '100%',
    borderRadius: 2,
  },
  tasksList: {
    flexDirection: 'column',
    gap: 8,
  },
  taskItemCard: {
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTextContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  taskSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  taskActionBtn: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskActionText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
