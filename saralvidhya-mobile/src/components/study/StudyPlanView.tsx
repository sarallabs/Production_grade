import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { fetchStudyPlan } from '@/services/contentService';
import { storage } from '@/utils/storage';

const TREE_LOGO = require('@/assets/images/saral-tree.png');
const PERSONA_BEGINNER = require('@/assets/images/personas/persona_beginner.png');
const PERSONA_INTERMEDIATE = require('@/assets/images/personas/persona_intermediate.png');
const PERSONA_ADVANCED = require('@/assets/images/personas/persona_advanced.png');

export type PaceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface StudyPlanTask {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  duration: string;
  durationMins: number;
  actionLabel: string;
  completed?: boolean;
  type: 'listen' | 'video' | 'mindmap' | 'review' | 'detailed' | 'flashcard' | 'quiz';
  toolTarget?: string;
}

export interface StudyDayPlan {
  dayNumber: number;
  title: string;
  subtopic?: string;
  totalMinutes: number;
  tasks: StudyPlanTask[];
}

export interface StudyBlueprint {
  id: string;
  pace: PaceLevel;
  name: string;
  badge: string;
  subtitle: string;
  totalMinutes: number;
  days: StudyDayPlan[];
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekdayForDayOffset(startDate: Date, offsetDays: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + Math.max(0, offsetDays));
  return WEEKDAY_SHORT[d.getDay()];
}

function detectTaskType(text: string): {
  type: StudyPlanTask['type'];
  category: string;
  toolTarget: string;
  primary: string;
  secondary: string;
} {
  const lower = text.toLowerCase();
  if (lower.includes('listen') || lower.includes('podcast') || lower.includes('microcast') || lower.includes('audio')) {
    return { type: 'listen', category: 'podcasts', toolTarget: 'podcasts', primary: 'Listen', secondary: 'Audio walkthrough' };
  }
  if (lower.includes('watch') || lower.includes('video') || lower.includes('lecture')) {
    return { type: 'video', category: 'videos', toolTarget: 'videos', primary: 'Watch', secondary: 'Concept video' };
  }
  if (lower.includes('mindmap') || lower.includes('mind map') || lower.includes('diagram')) {
    return { type: 'mindmap', category: 'mindmap', toolTarget: 'mindmap', primary: 'Mindmap', secondary: 'Visual hierarchy' };
  }
  if (lower.includes('detailed') || lower.includes('in-depth') || lower.includes('deep dive')) {
    return { type: 'detailed', category: 'detailed', toolTarget: 'detailed', primary: 'Detailed Study', secondary: 'In-depth Read' };
  }
  if (lower.includes('quick') || lower.includes('summary') || lower.includes('essentials')) {
    return { type: 'review', category: 'summary', toolTarget: 'summary', primary: 'Quick Study', secondary: 'Essentials Read' };
  }
  if (lower.includes('flashcard')) {
    return { type: 'flashcard', category: 'flashcards', toolTarget: 'flashcards', primary: 'Flashcards', secondary: 'Recall practice' };
  }
  if (lower.includes('quiz') || lower.includes('mcq') || lower.includes('msq') || lower.includes('assessment')) {
    return { type: 'quiz', category: 'assessment', toolTarget: 'assessment', primary: 'Assessment', secondary: 'Self-check quiz' };
  }
  return { type: 'review', category: 'summary', toolTarget: 'summary', primary: 'Quick Study', secondary: 'Essentials Read' };
}

function parseMinutesFromText(text: string, fallback: number = 10): number {
  const m =
    text.match(/\((\d+)\s*(?:m|min|mins|minutes)\)/i) ||
    text.match(/(\d+)\s*(?:m|min|mins|minutes)\b/i);
  return m ? parseInt(m[1], 10) : fallback;
}

function ensureRichDayTasks(
  dayNumber: number,
  dayTitle: string,
  rawTasks: Partial<StudyPlanTask>[] = []
): StudyDayPlan {
  const categoryOrder: StudyPlanTask['type'][] = [
    'listen',
    'video',
    'mindmap',
    'review',
    'detailed',
    'flashcard',
  ];

  const defaultMeta: Record<StudyPlanTask['type'], { title: string; subtitle: string; mins: number }> = {
    listen: { title: 'Listen', subtitle: 'Audio walkthrough', mins: 6 },
    video: { title: 'Watch', subtitle: 'Concept video', mins: 9 },
    mindmap: { title: 'Mindmap', subtitle: 'Visual hierarchy', mins: 10 },
    review: { title: 'Quick Study', subtitle: 'Essentials Read', mins: 10 },
    detailed: { title: 'Detailed Study', subtitle: 'In-depth Read', mins: 15 },
    flashcard: { title: 'Flashcards', subtitle: 'Recall practice', mins: 7 },
    quiz: { title: 'Assessment', subtitle: 'Self-check quiz', mins: 12 },
  };

  const tasksMap = new Map<StudyPlanTask['type'], StudyPlanTask>();

  for (const raw of rawTasks) {
    if (!raw.title) continue;
    const detected = detectTaskType(raw.title);
    const durationMins = raw.durationMins || parseMinutesFromText(raw.duration || '', defaultMeta[detected.type]?.mins || 10);
    const task: StudyPlanTask = {
      id: raw.id || `d${dayNumber}_${detected.type}`,
      title: detected.primary,
      subtitle: raw.subtitle || detected.secondary,
      category: detected.category,
      duration: `${durationMins} min`,
      durationMins,
      actionLabel: 'Open →',
      type: detected.type,
      toolTarget: detected.toolTarget,
    };
    tasksMap.set(detected.type, task);
  }

  // Ensure all 6 multimodal core cards exist to match the exact rich study plan UI
  const finalTasks: StudyPlanTask[] = [];
  for (const type of categoryOrder) {
    if (tasksMap.has(type)) {
      finalTasks.push(tasksMap.get(type)!);
    } else {
      const meta = defaultMeta[type];
      finalTasks.push({
        id: `d${dayNumber}_${type}`,
        title: meta.title,
        subtitle: meta.subtitle,
        category: type === 'listen' ? 'podcasts' : type === 'video' ? 'videos' : type === 'mindmap' ? 'mindmap' : type === 'detailed' ? 'detailed' : type === 'flashcard' ? 'flashcards' : 'summary',
        duration: `${meta.mins} min`,
        durationMins: meta.mins,
        actionLabel: 'Open →',
        type,
        toolTarget: type === 'listen' ? 'podcasts' : type === 'video' ? 'videos' : type === 'mindmap' ? 'mindmap' : type === 'detailed' ? 'detailed' : type === 'flashcard' ? 'flashcards' : 'summary',
      });
    }
  }

  const totalMinutes = finalTasks.reduce((acc, t) => acc + t.durationMins, 0);

  return {
    dayNumber,
    title: dayTitle || `Module ${dayNumber}`,
    subtopic: dayNumber === 1 ? 'Developmental stages' : dayNumber === 2 ? 'Histological anatomy' : dayNumber === 3 ? 'Peritrophic physiology' : 'Integrated revision',
    totalMinutes,
    tasks: finalTasks,
  };
}

function parseMarkdownStudyPlan(
  rawMarkdown: string,
  chapterTitle: string
): { blueprints: Record<PaceLevel, StudyBlueprint>; title: string } {
  const cleanTitle = (chapterTitle || 'Morphogenesis').replace(/^chapter\s*\d+\s*[-:·]?\s*/i, '').trim();

  // Default day titles
  const defaultDayTitles = [
    'Morphogenesis',
    'Wall Histology & Epithelium',
    'Enzyme Secretions & Osmoregulation',
    'Malpighian Tubules & Cryptonephry',
    'Specialized Adaptations',
    'Foregut Architecture',
    'Midgut Cytology',
    'Filter Chamber & Symbionts',
    'Comparative Morphology',
    'Physiological Control Mechanisms',
    'Integrated Exam Drills',
    'High-Yield Concept Synthesis',
    'Mastery & Final Review',
  ];

  const parsedDays: StudyDayPlan[] = [];

  if (rawMarkdown && rawMarkdown.length > 50) {
    const lines = rawMarkdown.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && /Day\s+\d+/i.test(trimmed)) {
        const cells = trimmed
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length >= 3) {
          const dayMatch = cells[0].match(/Day\s+(\d+)/i);
          if (dayMatch) {
            const dayNum = parseInt(dayMatch[1], 10);
            const topic = cells[1].replace(/[\*\_\[\]]/g, '').trim();
            const pathText = cells[2] || '';
            const rawParts = pathText
              .replace(/\$\\to\$/g, '→')
              .replace(/\\to\b/g, '→')
              .split(/\s*(?:→|\+)\s*/)
              .map((s) => s.trim())
              .filter(Boolean);

            const rawTasks: Partial<StudyPlanTask>[] = rawParts.map((part, pIdx) => {
              const cleaned = part.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[\*\_]/g, '').trim();
              const mins = parseMinutesFromText(cleaned, 10);
              return {
                id: `d${dayNum}_t${pIdx + 1}`,
                title: cleaned,
                durationMins: mins,
              };
            });

            parsedDays.push(ensureRichDayTasks(dayNum, topic || defaultDayTitles[dayNum - 1] || `Module ${dayNum}`, rawTasks));
          }
        }
      }
    }
  }

  // Synthesize the 3 standard blueprints (matching user's 13-day plan in screenshot)
  const buildBlueprint = (pace: PaceLevel, count: number, name: string, tagline: string): StudyBlueprint => {
    const days: StudyDayPlan[] = [];
    for (let i = 0; i < count; i++) {
      const dayNum = i + 1;
      const existing = parsedDays[i];
      if (existing) {
        days.push({
          ...existing,
          dayNumber: dayNum,
        });
      } else {
        const topic = defaultDayTitles[i] || `${cleanTitle} · Part ${dayNum}`;
        days.push(ensureRichDayTasks(dayNum, topic));
      }
    }
    const totalMinutes = days.reduce((acc, d) => acc + d.totalMinutes, 0);
    return {
      id: `bp_${pace}`,
      pace,
      name,
      badge: `${count}d`,
      subtitle: `${count}-day plan · ~${Math.round(totalMinutes / count)} min/day`,
      totalMinutes,
      days,
    };
  };

  return {
    title: cleanTitle,
    blueprints: {
      beginner: buildBlueprint('beginner', 13, 'Comprehensive', '50 min/day'),
      intermediate: buildBlueprint('intermediate', 9, 'Balanced', '55 min/day'),
      advanced: buildBlueprint('advanced', 5, 'Crash Course', '65 min/day'),
    },
  };
}

export interface StudyPlanViewProps {
  subjectId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  unitCode?: string;
  unitName?: string;
  subjectName?: string;
  totalChapters?: number;
  totalMins?: number;
  totalTasksCount?: number;
  modulesCount?: number;
  currentDay?: number;
  totalDays?: number;
  startDate?: string;
  completedResources?: string[];
  onMarkModuleCompleted?: () => void;
  onOpenTask?: (task: StudyPlanTask) => void;
  onBack?: () => void;
  hideHeader?: boolean;
}

export default function StudyPlanView({
  subjectId = 'entomology',
  chapterNumber = 1,
  chapterTitle = 'Morphogenesis',
  subjectName = 'Entomology',
  onOpenTask,
  onBack,
}: StudyPlanViewProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [activePace, setActivePace] = useState<PaceLevel>('beginner');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});
  const [studyPlanData, setStudyPlanData] = useState<{
    blueprints: Record<PaceLevel, StudyBlueprint>;
    title: string;
  }>(() => parseMarkdownStudyPlan('', chapterTitle));
  const [isLoading, setIsLoading] = useState(true);

  // Storage key for persisting completed tasks across app launches
  const storageProgressKey = `sv_study_plan_tasks_${subjectId}_${chapterNumber}`;

  useEffect(() => {
    storage.getItem<Record<string, boolean>>(storageProgressKey).then((saved) => {
      if (saved && typeof saved === 'object') {
        setCompletedTaskIds(saved);
      }
    });
  }, [storageProgressKey]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    fetchStudyPlan(subjectId, chapterNumber, controller.signal)
      .then((markdown) => {
        if (isMounted) {
          const parsed = parseMarkdownStudyPlan(markdown || '', chapterTitle);
          setStudyPlanData(parsed);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('[StudyPlanView] Error fetching study plan:', err);
        }
        if (isMounted) {
          setStudyPlanData(parseMarkdownStudyPlan('', chapterTitle));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [subjectId, chapterNumber, chapterTitle]);

  const activeBlueprint = studyPlanData.blueprints[activePace];
  const days = activeBlueprint?.days || [];
  const currentDayPlan = days[selectedDayIndex] || days[0];

  const today = useMemo(() => new Date(), []);

  // Compute stats for current day
  const currentDayTasks = currentDayPlan?.tasks || [];
  const dayDoneCount = currentDayTasks.filter((t) => completedTaskIds[t.id]).length;
  const dayTotalCount = currentDayTasks.length;
  const dayTotalMins = currentDayPlan?.totalMinutes || 57;

  // Compute stats for overall blueprint
  const allBlueprintTasks = useMemo(() => {
    const list: StudyPlanTask[] = [];
    days.forEach((d) => list.push(...d.tasks));
    return list;
  }, [days]);

  const totalPlanTasksCount = allBlueprintTasks.length || 70;
  const overallDoneCount = allBlueprintTasks.filter((t) => completedTaskIds[t.id]).length;
  const overallProgressPercent = totalPlanTasksCount > 0
    ? Math.round((overallDoneCount / totalPlanTasksCount) * 100)
    : 0;

  const toggleTask = (taskId: string) => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    setCompletedTaskIds((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      storage.setItem(storageProgressKey, next).catch(() => {});
      return next;
    });
  };

  const handleContinue = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    // Find the first incomplete task for current day
    const firstIncomplete = currentDayTasks.find((t) => !completedTaskIds[t.id]);
    if (firstIncomplete) {
      handleOpenTask(firstIncomplete);
    } else if (selectedDayIndex < days.length - 1) {
      // Advance to next day
      setSelectedDayIndex((prev) => prev + 1);
    }
  };

  const handleOpenTask = (task: StudyPlanTask) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}

    if (onOpenTask) {
      onOpenTask(task);
      return;
    }

    // Default intelligent fallbacks routing based on task type
    const chStr = chapterNumber.toString();
    switch (task.type) {
      case 'listen':
        router.push('/listen');
        break;
      case 'video':
        router.push({ pathname: '/(tabs)/learn', params: { segment: 'watch', chapter: chStr } });
        break;
      case 'mindmap':
        router.push({ pathname: '/(tabs)/learn', params: { segment: 'mindmap', chapter: chStr } });
        break;
      case 'review':
        router.push({ pathname: '/(tabs)/learn', params: { segment: 'read', chapter: chStr } });
        break;
      case 'detailed':
        router.push({ pathname: '/(tabs)/learn', params: { segment: 'detailed', chapter: chStr } });
        break;
      case 'flashcard':
        router.push({ pathname: '/(tabs)/practice', params: { segment: 'flashcards', chapter: chStr } });
        break;
      case 'quiz':
        router.push({ pathname: '/(tabs)/practice', params: { segment: 'mock', chapter: chStr } });
        break;
      default:
        router.push({ pathname: '/(tabs)/learn', params: { segment: 'read', chapter: chStr } });
        break;
    }
  };

  // Color tokens tailored to matching the exact uploaded UI design
  const screenBg = isDark ? '#16221C' : '#FAF8F3';
  const cardBg = isDark ? '#1E2D25' : '#FFFFFF';
  const cardBorder = isDark ? '#2E4438' : '#ECE8E2';
  const textDark = isDark ? '#F1F6F3' : '#18221D';
  const textMuted = isDark ? '#8DA697' : '#718277';
  const activeDayPillBg = isDark ? '#35291E' : '#FAF2EB';
  const activeDayPillBorder = isDark ? '#8B5B3B' : '#DFC4AE';
  const activeDayPillText = isDark ? '#F5C198' : '#8C532B';
  const activeDayPillSub = isDark ? '#DFC4AE' : '#945E37';
  const activeTaskCardBorder = isDark ? '#8B5B3B' : '#DFC4AE';
  const openBtnBg = isDark ? '#2B2219' : '#F7F0E8';
  const openBtnBorder = isDark ? '#594130' : '#E8DDD3';
  const openBtnText = isDark ? '#E8B68E' : '#18221D';
  const forestGreen = '#3B5849';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: screenBg }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: Math.max(insets.top + 6, 16),
          paddingBottom: insets.bottom + 36,
        },
        isTablet && styles.tabletContainer,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. TOP BRAND HEADER: TREE LOGO & USER AVATAR (A) ── */}
      <View style={styles.topBrandRow}>
        <View style={styles.brandLeft}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={textDark} />
            </TouchableOpacity>
          )}
          <Image source={TREE_LOGO} style={styles.treeLogo} resizeMode="contain" />
          <Text style={[styles.brandTitle, { color: textDark }]}>Saral Vidhya</Text>
        </View>

        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarLetter}>A</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. THREE BOOK MILESTONE / PERSONA CARDS (Centered) ── */}
      <View style={styles.milestonesRow}>
        {/* Beginner */}
        <TouchableOpacity
          style={[
            styles.milestoneCard,
            {
              backgroundColor: activePace === 'beginner' ? (isDark ? '#263C30' : '#D4E2D8') : cardBg,
              borderColor: activePace === 'beginner' ? (isDark ? '#4D755D' : '#ADC5B4') : cardBorder,
            },
          ]}
          onPress={() => {
            try {
              Haptics.selectionAsync().catch(() => {});
            } catch {}
            setActivePace('beginner');
            setSelectedDayIndex(0);
          }}
          activeOpacity={0.85}
        >
          <Image source={PERSONA_BEGINNER} style={styles.milestoneIcon} resizeMode="contain" />
        </TouchableOpacity>

        {/* Intermediate */}
        <TouchableOpacity
          style={[
            styles.milestoneCard,
            {
              backgroundColor: activePace === 'intermediate' ? (isDark ? '#263C30' : '#D4E2D8') : cardBg,
              borderColor: activePace === 'intermediate' ? (isDark ? '#4D755D' : '#ADC5B4') : cardBorder,
            },
          ]}
          onPress={() => {
            try {
              Haptics.selectionAsync().catch(() => {});
            } catch {}
            setActivePace('intermediate');
            setSelectedDayIndex(0);
          }}
          activeOpacity={0.85}
        >
          <Image source={PERSONA_INTERMEDIATE} style={styles.milestoneIcon} resizeMode="contain" />
        </TouchableOpacity>

        {/* Advanced */}
        <TouchableOpacity
          style={[
            styles.milestoneCard,
            {
              backgroundColor: activePace === 'advanced' ? (isDark ? '#263C30' : '#D4E2D8') : cardBg,
              borderColor: activePace === 'advanced' ? (isDark ? '#4D755D' : '#ADC5B4') : cardBorder,
            },
          ]}
          onPress={() => {
            try {
              Haptics.selectionAsync().catch(() => {});
            } catch {}
            setActivePace('advanced');
            setSelectedDayIndex(0);
          }}
          activeOpacity={0.85}
        >
          <Image source={PERSONA_ADVANCED} style={styles.milestoneIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* ── 3. SECTION LABEL: YOUR STUDY PLAN ── */}
      <Text style={[styles.eyebrowTitle, { color: textMuted }]}>YOUR STUDY PLAN</Text>

      {/* ── 4. DAY SELECTOR ROW: [ D1 Today ] [ D2 Thu ] [ D3 Fri ] ... ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScrollRow}
      >
        {days.map((d, idx) => {
          const isSelected = idx === selectedDayIndex;
          const dayNumber = d.dayNumber || idx + 1;
          const dayPillTitle = `D${dayNumber}`;
          const dayPillSub = idx === 0 ? 'Today' : getWeekdayForDayOffset(today, idx);

          return (
            <TouchableOpacity
              key={`day_${idx}`}
              style={[
                styles.dayPill,
                {
                  backgroundColor: isSelected ? activeDayPillBg : cardBg,
                  borderColor: isSelected ? activeDayPillBorder : cardBorder,
                  borderWidth: isSelected ? 1.8 : 1.2,
                },
              ]}
              onPress={() => {
                try {
                  Haptics.selectionAsync().catch(() => {});
                } catch {}
                setSelectedDayIndex(idx);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayPillTitle,
                  { color: isSelected ? activeDayPillText : textDark },
                ]}
              >
                {dayPillTitle}
              </Text>
              <Text
                style={[
                  styles.dayPillSub,
                  { color: isSelected ? activeDayPillSub : textMuted },
                ]}
              >
                {dayPillSub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── 5. CURRENT DAY TITLE & STATS HEADER ── */}
      <View style={styles.dayHeaderRow}>
        <View style={styles.dayHeaderLeft}>
          <Text style={[styles.dayTitleText, { color: textDark }]} numberOfLines={1}>
            {`Day ${currentDayPlan?.dayNumber || 1} · ${currentDayPlan?.title || 'Morphogenesis'}`}
          </Text>
          <Text style={[styles.daySubtopicText, { color: textMuted }]}>
            {currentDayPlan?.subtopic || 'Developmental stages'}
          </Text>
        </View>

        <Text style={[styles.dayDoneStatsText, { color: textMuted }]}>
          {`${dayDoneCount}/${dayTotalCount} done · ~${dayTotalMins} min`}
        </Text>
      </View>

      {/* ── 6. TASK CARDS LIST ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={forestGreen} />
          <Text style={[styles.loadingText, { color: textMuted }]}>
            Loading study tasks...
          </Text>
        </View>
      ) : (
        <View style={styles.tasksList}>
          {currentDayTasks.map((task, tIdx) => {
            const isChecked = Boolean(completedTaskIds[task.id]);
            // First task or first uncompleted task has the subtle active border
            const isActiveCard = tIdx === 0 && !isChecked;

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: isActiveCard ? activeTaskCardBorder : cardBorder,
                    borderWidth: isActiveCard ? 1.8 : 1.2,
                  },
                ]}
              >
                {/* Square Rounded Checkbox */}
                <TouchableOpacity
                  style={[
                    styles.checkboxSquare,
                    {
                      borderColor: isChecked ? forestGreen : (isDark ? '#465F51' : '#D0D9D3'),
                      backgroundColor: isChecked ? forestGreen : 'transparent',
                    },
                  ]}
                  onPress={() => toggleTask(task.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.75}
                >
                  {isChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </TouchableOpacity>

                {/* Task Details */}
                <View style={styles.taskTextCol}>
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: textDark },
                      isChecked && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  <Text style={[styles.taskSubtitle, { color: textMuted }]}>
                    {task.subtitle || 'Essential resource'}
                  </Text>
                </View>

                {/* Duration & Open Button */}
                <View style={styles.taskActionCol}>
                  <Text style={[styles.durationText, { color: textMuted }]}>
                    {task.duration}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.openPillBtn,
                      {
                        backgroundColor: openBtnBg,
                        borderColor: openBtnBorder,
                      },
                    ]}
                    onPress={() => handleOpenTask(task)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.openPillBtnText, { color: openBtnText }]}>
                      Open →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── 7. BOTTOM PROGRESS SUMMARY CARD ── */}
      <View
        style={[
          styles.bottomSummaryCard,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
        ]}
      >
        <View style={styles.summaryTopRow}>
          <Text style={[styles.summaryTitle, { color: textDark }]} numberOfLines={1}>
            {studyPlanData.title || 'Metamorphosis & Diapause'}
          </Text>
          <Text style={[styles.summaryPercentText, { color: textDark }]}>
            {`${overallProgressPercent}%`}
          </Text>
        </View>

        <Text style={[styles.summarySub, { color: textMuted }]}>
          {activeBlueprint?.subtitle || '13-day plan · ~50 min/day'}
        </Text>

        {/* Progress Track */}
        <View
          style={[
            styles.summaryTrack,
            { backgroundColor: isDark ? '#283B30' : '#EFEAE3' },
          ]}
        >
          <View
            style={[
              styles.summaryFill,
              {
                backgroundColor: forestGreen,
                width: `${Math.max(overallProgressPercent > 0 ? 4 : 0, overallProgressPercent)}%`,
              },
            ]}
          />
        </View>

        {/* Bottom Actions Row */}
        <View style={styles.summaryBottomRow}>
          <Text style={[styles.tasksDoneText, { color: textMuted }]}>
            {`${overallDoneCount}/${totalPlanTasksCount} tasks done`}
          </Text>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: forestGreen }]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>
              {`Continue Day ${currentDayPlan?.dayNumber || 1} →`}
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 0,
  },
  tabletContainer: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  /* 1. Top Brand Header */
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    marginRight: 4,
    padding: 4,
  },
  treeLogo: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    fontSize: 18.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5EDE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: '#345744',
  },

  /* 2. Milestones / Personas */
  milestonesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 22,
  },
  milestoneCard: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  milestoneIcon: {
    width: 38,
    height: 38,
  },

  /* 3. Eyebrow */
  eyebrowTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  /* 4. Days Selector */
  daysScrollRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
    marginBottom: 22,
  },
  dayPill: {
    width: 62,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dayPillTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  dayPillSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },

  /* 5. Day Info Header */
  dayHeaderRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayTitleText: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  daySubtopicText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 3,
  },
  dayDoneStatsText: {
    fontSize: 12.5,
    fontWeight: '600',
    paddingTop: 3,
  },

  /* 6. Tasks List */
  tasksList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  checkboxSquare: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTextCol: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.65,
  },
  taskSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  taskActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  openPillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  openPillBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* 7. Bottom Summary Card */
  bottomSummaryCard: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    flex: 1,
  },
  summaryPercentText: {
    fontSize: 15,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 12,
  },
  summaryTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  summaryFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  tasksDoneText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  continueButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  continueButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Loading State */
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
