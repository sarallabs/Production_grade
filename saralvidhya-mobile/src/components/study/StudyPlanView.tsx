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
import { useAuth, PersonaType } from '@/context/AuthContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { fetchStudyPlan } from '@/services/contentService';
import { storage } from '@/utils/storage';

const PERSONA_BEGINNER = require('@/assets/images/personas/persona_beginner.png');
const PERSONA_INTERMEDIATE = require('@/assets/images/personas/persona_intermediate.png');
const PERSONA_ADVANCED = require('@/assets/images/personas/persona_advanced.png');

export type PaceLevel = PersonaType; // 'beginner' | 'intermediate' | 'advanced'

export type StudyTaskCategory =
  | 'podcasts'
  | 'videos'
  | 'mindmap'
  | 'summary'
  | 'detailed'
  | 'key_takeaways'
  | 'flashcards'
  | 'assessment'
  | 'qbank'
  | 'prep_exam'
  | 'general';

export interface StudyPlanTask {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: StudyTaskCategory;
  duration: string;
  durationMins: number;
  actionLabel: string;
  completed?: boolean;
  type:
    | 'listen'
    | 'video'
    | 'mindmap'
    | 'review'
    | 'detailed'
    | 'takeaways'
    | 'flashcard'
    | 'quiz'
    | 'qbank'
    | 'prep_exam';
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

interface ParsedStudyPlan {
  title: string;
  subtitle: string;
  blueprints: StudyBlueprint[];
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const PACE_META: Record<
  PaceLevel,
  { label: string; tagline: string; icon: any }
> = {
  beginner: {
    label: 'Beginner',
    tagline: 'foundation-first',
    icon: PERSONA_BEGINNER,
  },
  intermediate: {
    label: 'Intermediate',
    tagline: 'balanced depth',
    icon: PERSONA_INTERMEDIATE,
  },
  advanced: {
    label: 'Advanced',
    tagline: 'in-depth & drill',
    icon: PERSONA_ADVANCED,
  },
};

function formatTargetDate(startDate: Date, addDays: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + Math.max(0, addDays));
  const wk = WEEKDAY_SHORT[d.getDay()];
  const mo = MONTH_SHORT[d.getMonth()];
  const dayNum = d.getDate();
  return `${wk}, ${mo} ${dayNum}`;
}

function getWeekdayForDayOffset(startDate: Date, offsetDays: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + Math.max(0, offsetDays));
  return WEEKDAY_SHORT[d.getDay()];
}

function cleanMarkdownLinks(raw: string): string {
  return (raw || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\$\\to\$|\\to\b|→/g, '→')
    .trim();
}

function parseMinutesFromText(text: string, fallback: number = 10): number {
  const m =
    text.match(/\((\d+)\s*(?:m|min|mins|minutes)\)/i) ||
    text.match(/(\d+)\s*(?:m|min|mins|minutes)\b/i);
  return m ? parseInt(m[1], 10) : fallback;
}

function cleanDayTopicTitle(rawTitle: string): string {
  return cleanMarkdownLinks(rawTitle)
    .replace(/^Day\s+\d+\s*[:—–-]\s*/i, '')
    .replace(/\(\d+\s*(?:m|min|mins|minutes)\)/gi, '')
    .replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*·\s*/i, '')
    .replace(/\*+/g, '')
    .trim();
}

function detectCategoryAndTool(text: string): {
  category: StudyTaskCategory;
  type: StudyPlanTask['type'];
  toolTarget: string;
} {
  const lower = (text || '').toLowerCase();
  if (
    lower.includes('podcast') ||
    lower.includes('microcast') ||
    lower.includes('listen') ||
    lower.includes('audio')
  ) {
    return { category: 'podcasts', type: 'listen', toolTarget: 'podcasts' };
  }
  if (lower.includes('video') || lower.includes('watch') || lower.includes('lecture')) {
    return { category: 'videos', type: 'video', toolTarget: 'videos' };
  }
  if (lower.includes('mindmap') || lower.includes('mind map') || lower.includes('diagram') || lower.includes('infographic')) {
    return { category: 'mindmap', type: 'mindmap', toolTarget: 'mindmap' };
  }
  if (lower.includes('key takeaway') || lower.includes('takeaway') || lower.includes('glossary')) {
    return { category: 'key_takeaways', type: 'takeaways', toolTarget: 'key_takeaways' };
  }
  if (lower.includes('flashcard')) {
    return { category: 'flashcards', type: 'flashcard', toolTarget: 'flashcards' };
  }
  if (lower.includes('question bank') || lower.includes('qbank') || lower.includes('2-mark') || lower.includes('5-mark')) {
    return { category: 'qbank', type: 'qbank', toolTarget: 'qbank' };
  }
  if (
    lower.includes('mock test') ||
    lower.includes('mock exam') ||
    lower.includes('pre-final') ||
    lower.includes('certification exam') ||
    lower.includes('preparation exam') ||
    lower.includes('final exam')
  ) {
    return { category: 'prep_exam', type: 'prep_exam', toolTarget: 'prep_exam' };
  }
  if (
    lower.includes('mcq') ||
    lower.includes('msq') ||
    lower.includes('quiz') ||
    lower.includes('match the following') ||
    lower.includes('assessment')
  ) {
    return { category: 'assessment', type: 'quiz', toolTarget: 'assessment' };
  }
  if (
    lower.includes('detailed study') ||
    lower.includes('detailed summary') ||
    lower.includes('in-depth') ||
    lower.includes('deep dive')
  ) {
    return { category: 'detailed', type: 'detailed', toolTarget: 'detailed' };
  }
  if (
    lower.includes('quick study') ||
    lower.includes('quick summary') ||
    lower.includes('essentials') ||
    lower.includes('summary')
  ) {
    return { category: 'summary', type: 'review', toolTarget: 'summary' };
  }
  return { category: 'summary', type: 'review', toolTarget: 'summary' };
}

function getCategoryDefaultDescription(
  category: StudyTaskCategory,
  title: string
): string {
  switch (category) {
    case 'podcasts':
      return 'Audio walkthrough';
    case 'videos':
      return 'Concept video';
    case 'summary':
      return 'Essentials Read';
    case 'detailed':
      return 'In-depth Read';
    case 'flashcards':
      return 'Recall practice';
    case 'mindmap':
      return 'Visual hierarchy';
    case 'key_takeaways':
      return 'High-yield summary';
    case 'assessment':
      return 'Self-check quiz';
    case 'qbank':
      return 'Structured practice';
    case 'prep_exam':
      return 'Timed mock test';
    default:
      return title || 'Essential resource';
  }
}

export function formatTaskDisplayLabels(task: StudyPlanTask): {
  primary: string;
  secondary: string;
} {
  const rawTitle = cleanMarkdownLinks(task.title)
    .replace(/\(\d+\s*(?:m|min|mins|minutes)\)/gi, '')
    .trim();

  const splitDot = rawTitle.split(/\s*[·•—–-]\s*/);
  if (splitDot.length >= 2 && splitDot[0].length <= 24) {
    return {
      primary: splitDot[0].trim(),
      secondary: splitDot.slice(1).join(' · ').trim(),
    };
  }

  switch (task.category) {
    case 'podcasts':
      return { primary: 'Listen', secondary: 'Audio walkthrough' };
    case 'videos':
      return { primary: 'Watch', secondary: 'Concept video' };
    case 'summary':
      return { primary: 'Quick Study', secondary: 'Essentials Read' };
    case 'detailed':
      return { primary: 'Detailed Study', secondary: 'In-depth Read' };
    case 'flashcards':
      return { primary: 'Flashcards', secondary: 'Recall practice' };
    case 'mindmap':
      return { primary: 'Mindmap', secondary: 'Visual hierarchy' };
    case 'key_takeaways':
      return { primary: 'Takeaways', secondary: 'High-yield summary' };
    case 'assessment':
      return { primary: 'Assessment', secondary: 'Self-check quiz' };
    case 'qbank':
      return { primary: 'Question Bank', secondary: 'Structured practice' };
    case 'prep_exam':
      return { primary: 'Exam Prep.', secondary: 'Timed mock test' };
    default:
      return {
        primary: rawTitle || 'Study Session',
        secondary:
          task.description && task.description !== rawTitle
            ? task.description
            : 'Essential resource',
      };
  }
}

function makeTaskItem(params: {
  id: string;
  title: string;
  description?: string;
  durationMins: number;
  category?: StudyTaskCategory;
  type?: StudyPlanTask['type'];
  toolTarget?: string;
}): StudyPlanTask {
  const detected = detectCategoryAndTool(params.title);
  const category = params.category || detected.category;
  const type = params.type || detected.type;
  const toolTarget = params.toolTarget || detected.toolTarget;
  const description =
    params.description || getCategoryDefaultDescription(category, params.title);

  const temporaryTask: StudyPlanTask = {
    id: params.id,
    title: params.title,
    description,
    subtitle: description,
    category,
    duration: `${params.durationMins} min`,
    durationMins: params.durationMins,
    actionLabel: 'Open →',
    type,
    toolTarget,
  };
  const labels = formatTaskDisplayLabels(temporaryTask);
  return {
    ...temporaryTask,
    title: labels.primary,
    subtitle: labels.secondary || description,
  };
}

function parseArrowSequenceIntoTasks(
  seqText: string,
  dayNumber: number,
  blueprintId: string,
  fallbackTotalMins: number
): StudyPlanTask[] {
  const rawParts = (seqText || '')
    .replace(/\$\\to\$/g, '→')
    .replace(/\\to\b/g, '→')
    .split(/\s*(?:→|\+)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawParts.length === 0) return [];

  const defaultPerTask = Math.max(5, Math.round(fallbackTotalMins / rawParts.length));

  return rawParts.map((part, idx) => {
    const cleaned = cleanMarkdownLinks(part);
    const minsMatch = cleaned.match(/\((\d+)\s*(?:m|min|mins|minutes)\)/i);
    const durationMins = minsMatch ? parseInt(minsMatch[1], 10) : defaultPerTask;
    const titleWithoutTime = cleaned
      .replace(/\(\d+\s*(?:m|min|mins|minutes)\)/gi, '')
      .replace(/^[-*•]\s*/, '')
      .trim();

    return makeTaskItem({
      id: `${blueprintId}-d${dayNumber}-t${idx + 1}`,
      title: titleWithoutTime || `Session ${idx + 1}`,
      durationMins,
    });
  });
}

function ensureRichDayTasks(
  day: StudyDayPlan,
  blueprintId: string
): StudyDayPlan {
  const existing = day.tasks || [];
  if (existing.length >= 4) {
    const total =
      existing.reduce((acc, t) => acc + t.durationMins, 0) || day.totalMinutes || 45;
    return {
      ...day,
      totalMinutes: total,
    };
  }

  const hasCategory = (cat: StudyTaskCategory) =>
    existing.some((t) => t.category === cat);

  const enriched: StudyPlanTask[] = [];
  if (!hasCategory('podcasts')) {
    enriched.push(
      makeTaskItem({
        id: `${blueprintId}-d${day.dayNumber}-listen`,
        title: 'Listen',
        description: 'Audio walkthrough',
        durationMins: 6,
        category: 'podcasts',
        type: 'listen',
        toolTarget: 'podcasts',
      })
    );
  }
  if (!hasCategory('videos')) {
    enriched.push(
      makeTaskItem({
        id: `${blueprintId}-d${day.dayNumber}-watch`,
        title: 'Watch',
        description: 'Concept video',
        durationMins: 9,
        category: 'videos',
        type: 'video',
        toolTarget: 'videos',
      })
    );
  }

  for (const t of existing) {
    enriched.push(t);
  }

  if (!hasCategory('summary')) {
    enriched.push(
      makeTaskItem({
        id: `${blueprintId}-d${day.dayNumber}-quick`,
        title: 'Quick Study',
        description: 'Essentials Read',
        durationMins: 8,
        category: 'summary',
        type: 'review',
        toolTarget: 'summary',
      })
    );
  }
  if (!hasCategory('detailed')) {
    enriched.push(
      makeTaskItem({
        id: `${blueprintId}-d${day.dayNumber}-detailed`,
        title: 'Detailed Study',
        description: 'In-depth Read',
        durationMins: 15,
        category: 'detailed',
        type: 'detailed',
        toolTarget: 'detailed',
      })
    );
  }
  if (!hasCategory('flashcards')) {
    enriched.push(
      makeTaskItem({
        id: `${blueprintId}-d${day.dayNumber}-flashcards`,
        title: 'Flashcards',
        description: 'Recall practice',
        durationMins: 7,
        category: 'flashcards',
        type: 'flashcard',
        toolTarget: 'flashcards',
      })
    );
  }

  const reindexed = enriched.map((t, idx) => ({
    ...t,
    id: `${blueprintId}-d${day.dayNumber}-t${idx + 1}`,
  }));
  const totalMinutes = reindexed.reduce((acc, t) => acc + t.durationMins, 0);

  return {
    ...day,
    totalMinutes,
    tasks: reindexed,
  };
}

function synthesizePaceBlueprint(
  sourceDays: StudyDayPlan[],
  targetDaysCount: number,
  pace: PaceLevel,
  tagline: string
): StudyBlueprint {
  const bpId = `bp-${pace}`;
  if (sourceDays.length === 0) {
    return {
      id: bpId,
      pace,
      name: pace.charAt(0).toUpperCase() + pace.slice(1),
      badge: `${targetDaysCount}d`,
      subtitle: `${targetDaysCount}-day plan · ${tagline}`,
      totalMinutes: 0,
      days: [],
    };
  }

  if (sourceDays.length === targetDaysCount) {
    const clonedDays = sourceDays.map((d, idx) => {
      const dayNumber = idx + 1;
      const tasks = d.tasks.map((t, tIdx) => ({
        ...t,
        id: `${bpId}-d${dayNumber}-t${tIdx + 1}`,
      }));
      return ensureRichDayTasks(
        {
          dayNumber,
          title: cleanDayTopicTitle(d.title),
          subtopic: d.subtopic,
          totalMinutes: tasks.reduce((s, t) => s + t.durationMins, 0) || d.totalMinutes,
          tasks,
        },
        bpId
      );
    });
    const totalMinutes = clonedDays.reduce((s, d) => s + d.totalMinutes, 0);
    const avgDaily = Math.round(totalMinutes / Math.max(1, clonedDays.length));
    return {
      id: bpId,
      pace,
      name: pace.charAt(0).toUpperCase() + pace.slice(1),
      badge: `${clonedDays.length}d`,
      subtitle: `${clonedDays.length}-day plan · ~${avgDaily} min/day · ${tagline}`,
      totalMinutes,
      days: clonedDays,
    };
  }

  const resultDays: StudyDayPlan[] = [];
  for (let i = 0; i < targetDaysCount; i++) {
    const startIdx = Math.floor((i * sourceDays.length) / targetDaysCount);
    const endIdx = Math.max(
      startIdx + 1,
      Math.floor(((i + 1) * sourceDays.length) / targetDaysCount)
    );
    const slice = sourceDays.slice(startIdx, endIdx);
    const primarySource = slice[0] || sourceDays[Math.min(i, sourceDays.length - 1)];

    const combinedTitle =
      slice.length > 1
        ? slice
            .map((s) => cleanDayTopicTitle(s.title))
            .filter(Boolean)
            .slice(0, 2)
            .join(' & ')
        : cleanDayTopicTitle(primarySource.title);

    const mergedTasks: StudyPlanTask[] = [];
    const seenCategories = new Set<string>();
    for (const sDay of slice) {
      for (const t of sDay.tasks) {
        const key = `${t.category}:${t.title}`;
        if (!seenCategories.has(key)) {
          seenCategories.add(key);
          mergedTasks.push({
            ...t,
            id: `${bpId}-d${i + 1}-t${mergedTasks.length + 1}`,
          });
        }
      }
    }

    resultDays.push(
      ensureRichDayTasks(
        {
          dayNumber: i + 1,
          title: combinedTitle || `Module ${i + 1}`,
          totalMinutes:
            mergedTasks.reduce((acc, t) => acc + t.durationMins, 0) || 45,
          tasks: mergedTasks,
        },
        bpId
      )
    );
  }

  const totalMinutes = resultDays.reduce((s, d) => s + d.totalMinutes, 0);
  const avgDaily = Math.round(totalMinutes / Math.max(1, resultDays.length));

  return {
    id: bpId,
    pace,
    name: pace.charAt(0).toUpperCase() + pace.slice(1),
    badge: `${resultDays.length}d`,
    subtitle: `${resultDays.length}-day plan · ~${avgDaily} min/day · ${tagline}`,
    totalMinutes,
    days: resultDays,
  };
}

function getFallbackChapterDays(chapterNumber: number, fallbackChapterName?: string): StudyDayPlan[] {
  const CHAPTER_TOPICS: Record<number, string[]> = {
    1: [
      'Three Primary Regions & Histological Wall Layers',
      'Foregut Mechanics, Cibarium & Salivary Glands',
      'Proventriculus Specializations & Cardiac Valve',
      'Midgut Cytology, Enterocytes & Gastric Caeca',
      'Goblet Cells, V-ATPase & Bt Cry Toxin Lysis',
      'Peritrophic Membrane & Enzyme Compartmentalization',
      'Hindgut Anatomy & Malpighian Tubule Filtration',
      'Cryptonephric System & 6 Rectal Pads',
      'Specialized Adaptations: Sap Filter Chamber',
      'Termite Paunch Symbionts & Synthesis Review',
    ],
    2: [
      'Morphogenesis & Four Developmental Stages',
      'Ametabolous & Hemimetabolous Development',
      'Holometabolous Development & Endopterygota',
      'Immature Larval Classifications (Eruciform to Vermiform)',
      'Pupal Classifications (Exarate, Obtect, Coarctate)',
      'Hypermetamorphosis & Triungulin Life Cycle',
      'Endocrine Regulation: PTTH & Prothoracic Ecdysone',
      'Corpora Allata & Juvenile Hormone Titer Shifts',
      'Diapause vs Quiescence & Photoperiodic Clocks',
      'Seasonal Pest Carryover & IPM Synthesis',
    ],
    3: [
      'Weathering Definition & Regolith vs True Soil',
      'Three Universal Modes: Physical, Chemical, Biological',
      'Lithological Permeability & Mineral Resistance',
      'Diurnal Thermal Stresses & Onion-Skin Exfoliation',
      'Frost Wedging & Cryofracturing (9% Ice Expansion)',
      'Fluvial Hydraulics, Wave Action & Glacial Grinding',
      'Eolian Wind Saltation & Mushroom Rock Genesis',
      'Biological Agents: Root Wedging & Fauna Pedoturbation',
      'Microbial Symbiosis, Lichens & Organic Acid Chelation',
      'Specific Surface Area Scaling & Soil Genesis Review',
    ],
    4: [
      'Floral Reproductive Morphology & Pollination Stages',
      'Double Fertilization & Post-Pollination Physiology',
      'Self-Pollination (Autogamy) & Cleistogamy Adaptations',
      'Cross-Pollination (Allogamy), Dicliny & Dichogamy',
      'Herkogamy, Heterostyly & Genetic Self-Incompatibility',
      'Abiotic Vectors (Anemophily & Hydrophily)',
      'Biotic Entomophily & Melittophily (Honeybee Foraging)',
      'Orchard Pollinizer Layout (1:3, 1:8 & Quincunx Designs)',
      'Vegetative & Stimulative Parthenocarpy Mechanisms',
      'Stenospermocarpy & PGR Auxin/Gibberellin Sprays',
    ],
  };

  const topics = CHAPTER_TOPICS[chapterNumber] || CHAPTER_TOPICS[1];
  const bpId = 'bp-fallback';
  return topics.map((topic, idx) =>
    ensureRichDayTasks(
      {
        dayNumber: idx + 1,
        title: topic || `${fallbackChapterName || 'Chapter'} · Module ${idx + 1}`,
        totalMinutes: 50,
        tasks: [],
      },
      bpId
    )
  );
}

function normalizeToThreePaceBlueprints(
  rawBlueprints: StudyBlueprint[],
  chapterNumber: number = 1,
  fallbackChapterName?: string
): StudyBlueprint[] {
  if (rawBlueprints.length === 0) {
    const fallbackDays = getFallbackChapterDays(chapterNumber, fallbackChapterName);
    return [
      synthesizePaceBlueprint(fallbackDays, 10, 'beginner', 'foundation-first'),
      synthesizePaceBlueprint(fallbackDays, 7, 'intermediate', 'balanced depth'),
      synthesizePaceBlueprint(fallbackDays, 4, 'advanced', 'in-depth & drill'),
    ];
  }

  // Sort raw blueprints by day count descending (mirrors web app logic)
  const sorted = [...rawBlueprints].sort((a, b) => b.days.length - a.days.length);
  const longestDays = sorted[0].days;
  const shortestDays = sorted[sorted.length - 1].days;

  const beginnerCount = Math.max(5, longestDays.length);
  const intermediateCount = Math.max(3, beginnerCount - 1);
  const advancedCount = Math.max(2, beginnerCount - 2);

  const findMatching = (count: number) =>
    rawBlueprints.find((b) => b.days.length === count)?.days;

  const beginnerBp = synthesizePaceBlueprint(
    findMatching(beginnerCount) || longestDays,
    beginnerCount,
    'beginner',
    'foundation-first'
  );
  const intermediateBp = synthesizePaceBlueprint(
    findMatching(intermediateCount) || longestDays,
    intermediateCount,
    'intermediate',
    'balanced depth'
  );
  const advancedBp = synthesizePaceBlueprint(
    findMatching(advancedCount) || shortestDays,
    advancedCount,
    'advanced',
    'in-depth & drill'
  );

  return [beginnerBp, intermediateBp, advancedBp];
}

export function parseStudyPlanContent(
  rawContent: string,
  chapterNumber: number = 1,
  fallbackChapterName?: string
): ParsedStudyPlan {
  const trimmed = (rawContent || '').trim();
  const defaultTitle = (fallbackChapterName || 'Chapter Study Plan')
    .replace(/^Chapter\s*\d+\s*[:—–-]\s*/i, '')
    .trim();

  if (!trimmed || trimmed.length < 60) {
    return {
      title: defaultTitle,
      subtitle: '',
      blueprints: normalizeToThreePaceBlueprints([], chapterNumber, defaultTitle),
    };
  }

  // 1. Check JSON format (handles both schedule[] and steps[] schemas)
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      if (data && data.blueprints && typeof data.blueprints === 'object') {
        const rawBlueprints: StudyBlueprint[] = Object.entries(data.blueprints).map(
          ([bpKey, bpVal]: [string, any], bpIdx) => {
            const rawDays: any[] = Array.isArray(bpVal.days) ? bpVal.days : [];
            const days: StudyDayPlan[] = rawDays.map((d: any, dIdx: number) => {
              const dayNum = Number(d.day) || dIdx + 1;
              const rawSched: any[] = Array.isArray(d.schedule)
                ? d.schedule
                : Array.isArray(d.steps)
                ? d.steps
                : [];
              const tasks: StudyPlanTask[] = rawSched.map((s: any, sIdx: number) => {
                const resTitle = String(s.resource || `Session ${sIdx + 1}`);
                const durationMins =
                  Number(s.duration_minutes || s.duration_mins) || 10;
                return makeTaskItem({
                  id: `${bpKey}-d${dayNum}-t${sIdx + 1}`,
                  title: resTitle,
                  description: s.activity ? String(s.activity) : undefined,
                  durationMins,
                });
              });
              const totalMinutes =
                Number(d.daily_budget_minutes || d.total_mins) ||
                tasks.reduce((acc, t) => acc + t.durationMins, 0) ||
                45;
              return {
                dayNumber: dayNum,
                title: cleanDayTopicTitle(String(d.topic || `Day ${dayNum} Study Module`)),
                totalMinutes,
                tasks,
              };
            });

            const totalMins =
              Number(bpVal.total_time_mins) ||
              days.reduce((acc, d) => acc + d.totalMinutes, 0);

            const pace: PaceLevel =
              bpIdx === 0 ? 'beginner' : bpIdx === 1 ? 'intermediate' : 'advanced';

            return {
              id: bpKey || `bp-${bpIdx + 1}`,
              pace,
              name: bpKey,
              badge: `${days.length}d`,
              subtitle: String(bpVal.target_persona || ''),
              totalMinutes: totalMins,
              days,
            };
          }
        );

        return {
          title: String(data.title || defaultTitle).replace(/^Study Plan:\s*/i, ''),
          subtitle: String(data.topic || data.course || ''),
          blueprints: normalizeToThreePaceBlueprints(
            rawBlueprints,
            chapterNumber,
            defaultTitle
          ),
        };
      }
    } catch {
      // Fall through to markdown parser
    }
  }

  // 2. Parse Markdown format by H2 sections (mirrors web app StudyPlanView)
  const lines = trimmed.split(/\r?\n/);
  let title = defaultTitle;
  let subtitle = '';
  const rawBlueprints: StudyBlueprint[] = [];

  interface RawH2Section {
    heading: string;
    bodyLines: string[];
  }
  const h2Sections: RawH2Section[] = [];
  let currentH2: RawH2Section | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!currentH2 && trimmedLine.startsWith('# ')) {
      title = trimmedLine
        .replace(/^#\s+/, '')
        .replace(/^Study Plan:\s*/i, '')
        .replace(/\*+/g, '')
        .trim();
      continue;
    }
    if (!currentH2 && trimmedLine.startsWith('>')) {
      const cleanQuote = trimmedLine
        .replace(/^>\s*/, '')
        .replace(/\*\*/g, '')
        .trim();
      subtitle = subtitle ? `${subtitle} · ${cleanQuote}` : cleanQuote;
      continue;
    }
    const h2Match = trimmedLine.match(/^##\s+(.+)$/);
    if (h2Match) {
      currentH2 = {
        heading: h2Match[1].trim(),
        bodyLines: [],
      };
      h2Sections.push(currentH2);
      continue;
    }
    if (currentH2) {
      currentH2.bodyLines.push(line);
    }
  }

  h2Sections.forEach((sec) => {
    const bodyText = sec.bodyLines.join('\n').trim();
    const headingClean = sec.heading
      .replace(/^[🏛️🧭⚡📖🏃🚀📅🎯🗺️\d.]+\s*/, '')
      .trim();

    const hasDayTable = /\|\s*\*?\*?Day\s+\d+\*?\*?\s*\|/i.test(bodyText);
    const hasDaySubheadings = /^###\s+Day\s+\d+/im.test(bodyText);

    if (hasDayTable) {
      const bpId = `bp-${rawBlueprints.length + 1}`;
      const days: StudyDayPlan[] = [];
      let descSubtitle = '';

      for (const line of sec.bodyLines) {
        const t = line.trim();
        if (!t || t === '---') continue;
        if (!t.startsWith('|')) {
          if (!descSubtitle && !t.startsWith('#')) {
            descSubtitle = t.replace(/:\s*$/, '');
          }
          continue;
        }
        const cells = t
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        if (cells.length >= 3) {
          const dayMatch = cells[0].match(/Day\s+(\d+)/i);
          if (dayMatch) {
            const dayNum = parseInt(dayMatch[1], 10);
            const topicTitle = cleanDayTopicTitle(cells[1]);
            const pathCell = cells[2];
            const timeCell = cells[3] || '45m';
            const totalMinutes = parseMinutesFromText(timeCell, 45);
            const tasks = parseArrowSequenceIntoTasks(
              pathCell,
              dayNum,
              bpId,
              totalMinutes
            );
            days.push({
              dayNumber: dayNum,
              title: topicTitle,
              totalMinutes,
              tasks,
            });
          }
        }
      }

      if (days.length > 0) {
        const totalMins = days.reduce((acc, d) => acc + d.totalMinutes, 0);
        rawBlueprints.push({
          id: bpId,
          pace: 'beginner',
          name: headingClean,
          badge: `${days.length}d`,
          subtitle: descSubtitle || headingClean,
          totalMinutes: totalMins,
          days,
        });
      }
    } else if (hasDaySubheadings) {
      const bpId = `bp-${rawBlueprints.length + 1}`;
      const days: StudyDayPlan[] = [];
      let currentDay: StudyDayPlan | null = null;

      for (const line of sec.bodyLines) {
        const t = line.trim();
        if (!t || t === '---') continue;

        const dayHeaderMatch = t.match(/^###\s+Day\s+(\d+)\s*[:—-]\s*(.+)$/i);
        if (dayHeaderMatch) {
          const dayNum = parseInt(dayHeaderMatch[1], 10);
          currentDay = {
            dayNumber: dayNum,
            title: cleanDayTopicTitle(dayHeaderMatch[2].replace(/\*+/g, '').trim()),
            totalMinutes: 0,
            tasks: [],
          };
          days.push(currentDay);
          continue;
        }

        const bulletMatch = t.match(/^[-*+]\s+(.+)$/);
        if (bulletMatch && currentDay) {
          const rawItem = bulletMatch[1].trim();
          const durationMins = parseMinutesFromText(rawItem, 10);
          const parts = rawItem.split(/\s+[—–-]\s+/);
          const leftPart = cleanMarkdownLinks(parts[0] || rawItem)
            .replace(/\(\d+\s*(?:m|min|mins|minutes)\)/gi, '')
            .trim();
          const rightPart = parts.slice(1).join(' — ').trim();

          currentDay.tasks.push(
            makeTaskItem({
              id: `${bpId}-d${currentDay.dayNumber}-t${currentDay.tasks.length + 1}`,
              title: leftPart,
              description: rightPart || undefined,
              durationMins,
            })
          );
          currentDay.totalMinutes += durationMins;
        }
      }

      if (days.length > 0) {
        const totalMins = days.reduce((acc, d) => acc + d.totalMinutes, 0);
        rawBlueprints.push({
          id: bpId,
          pace: 'beginner',
          name: headingClean,
          badge: `${days.length}d`,
          subtitle: headingClean,
          totalMinutes: totalMins,
          days,
        });
      }
    }
  });

  return {
    title,
    subtitle,
    blueprints: normalizeToThreePaceBlueprints(
      rawBlueprints,
      chapterNumber,
      defaultTitle
    ),
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
  completedResources?: string[];
  persona?: PaceLevel;
  onChangePersona?: (persona: PaceLevel) => void;
  onMarkModuleCompleted?: () => void;
  onOpenTask?: (task: StudyPlanTask) => void;
  onBack?: () => void;
  hideHeader?: boolean;
}

export default function StudyPlanView({
  subjectId = 'ento_131',
  chapterNumber = 1,
  chapterTitle = 'Insect Digestive System',
  subjectName = 'Entomology',
  persona: propPersona,
  onChangePersona,
  onMarkModuleCompleted,
  onOpenTask,
}: StudyPlanViewProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { persona: authPersona, updatePersona } = useAuth();
  const { isTablet } = useDeviceLayout();

  const effectivePersona: PaceLevel = propPersona || authPersona || 'beginner';

  const [activePace, setActivePace] = useState<PaceLevel>(effectivePersona);
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});
  const [planStartIso, setPlanStartIso] = useState<string>(() => new Date().toISOString());
  const [replanNotice, setReplanNotice] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Keep activePace synchronized with global AuthContext persona
  useEffect(() => {
    if (effectivePersona && effectivePersona !== activePace) {
      setActivePace(effectivePersona);
    }
  }, [effectivePersona]);

  // Storage keys matching web app convention
  const storageProgressKey = `sv_study_plan_progress_${subjectId}_ch${chapterNumber}`;
  const replanKey = `sv_study_plan_start_${subjectId}_ch${chapterNumber}`;

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      storage.getItem<Record<string, boolean>>(storageProgressKey),
      storage.getItem<string>(replanKey),
    ]).then(([savedProgress, savedStart]) => {
      if (!isMounted) return;
      if (savedProgress && typeof savedProgress === 'object') {
        setCompletedTaskIds(savedProgress);
      } else {
        setCompletedTaskIds({});
      }
      if (savedStart && typeof savedStart === 'string') {
        setPlanStartIso(savedStart);
      } else {
        const nowIso = new Date().toISOString();
        setPlanStartIso(nowIso);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [storageProgressKey, replanKey]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    fetchStudyPlan(subjectId, chapterNumber, controller.signal)
      .then((markdown) => {
        if (isMounted) {
          setRawContent(markdown || '');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('[StudyPlanView] Error fetching study plan:', err);
        }
        if (isMounted) {
          setRawContent('');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [subjectId, chapterNumber]);

  const parsed = useMemo(
    () => parseStudyPlanContent(rawContent, chapterNumber, chapterTitle),
    [rawContent, chapterNumber, chapterTitle]
  );

  const activeBlueprint = useMemo(() => {
    return (
      parsed.blueprints.find((b) => b.pace === activePace) ||
      parsed.blueprints[0]
    );
  }, [parsed.blueprints, activePace]);

  const days = activeBlueprint?.days || [];

  // Ensure selectedDayNum is valid when switching pace/chapter
  useEffect(() => {
    if (days.length > 0) {
      const exists = days.some((d) => d.dayNumber === selectedDayNum);
      if (!exists) {
        setSelectedDayNum(days[0].dayNumber);
      }
    }
  }, [days, selectedDayNum]);

  const planStartDate = useMemo(() => {
    const d = new Date(planStartIso);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [planStartIso]);

  // Overall blueprint progress
  const allBlueprintTasks = useMemo(
    () => days.flatMap((d) => d.tasks),
    [days]
  );
  const totalPlanTasksCount = allBlueprintTasks.length;
  const overallDoneCount = allBlueprintTasks.filter(
    (t) => Boolean(completedTaskIds[t.id])
  ).length;
  const overallProgressPercent =
    totalPlanTasksCount > 0
      ? Math.round((overallDoneCount / totalPlanTasksCount) * 100)
      : 0;

  // Determine the active "Continue Day" (first day with uncompleted tasks, or Day 1)
  const currentActiveDay = useMemo(() => {
    return (
      days.find((d) => d.tasks.some((t) => !completedTaskIds[t.id])) ||
      days[0]
    );
  }, [days, completedTaskIds]);

  const remainingActiveDayTasks = useMemo(() => {
    return (currentActiveDay?.tasks || []).filter((t) => !completedTaskIds[t.id]);
  }, [currentActiveDay, completedTaskIds]);

  const upNextTask =
    remainingActiveDayTasks[0] || currentActiveDay?.tasks[0] || null;

  const currentDayPlan = useMemo(() => {
    return (
      days.find((d) => d.dayNumber === selectedDayNum) ||
      currentActiveDay ||
      days[0]
    );
  }, [days, selectedDayNum, currentActiveDay]);

  const currentDayTasks = currentDayPlan?.tasks || [];
  const dayDoneCount = currentDayTasks.filter((t) =>
    Boolean(completedTaskIds[t.id])
  ).length;
  const dayTotalCount = currentDayTasks.length;
  const dayTotalMins = currentDayPlan?.totalMinutes || 50;

  const firstUncompletedInSelectedDay = currentDayTasks.find(
    (t) => !completedTaskIds[t.id]
  );

  const avgDailyMins = Math.max(
    15,
    Math.round((activeBlueprint?.totalMinutes || 250) / Math.max(1, days.length))
  );

  const finishDateLabel = formatTargetDate(
    planStartDate,
    Math.max(0, days.length - 1)
  );

  const handleSelectPace = (pace: PaceLevel) => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    setActivePace(pace);
    updatePersona(pace).catch(() => {});
    onChangePersona?.(pace);
  };

  const toggleTask = (taskId: string) => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    setCompletedTaskIds((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      storage.setItem(storageProgressKey, next).catch(() => {});

      const allDoneNow =
        allBlueprintTasks.length > 0 &&
        allBlueprintTasks.every((t) => Boolean(next[t.id]));
      if (allDoneNow) {
        onMarkModuleCompleted?.();
      }
      return next;
    });
  };

  const handleReplanFromToday = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
    const nowIso = new Date().toISOString();
    setPlanStartIso(nowIso);
    storage.setItem(replanKey, nowIso).catch(() => {});
    setReplanNotice('Schedule updated — remaining tasks reshuffled starting today.');
    setTimeout(() => setReplanNotice(null), 3500);
  };

  const handleOpenTask = (task: StudyPlanTask) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}

    if (onOpenTask) {
      onOpenTask(task);
      return;
    }

    const chStr = String(chapterNumber);
    switch (task.category) {
      case 'podcasts':
        router.push({
          pathname: '/(tabs)/learn',
          params: { segment: 'listen', mode: 'quick', chapter: chStr },
        });
        break;
      case 'videos':
        router.push({
          pathname: '/(tabs)/learn',
          params: { segment: 'watch', chapter: chStr },
        });
        break;
      case 'mindmap':
        router.push({
          pathname: '/(tabs)/resources',
          params: { segment: 'mindmaps', chapter: chStr },
        });
        break;
      case 'key_takeaways':
        router.push({
          pathname: '/(tabs)/resources',
          params: { segment: 'key_takeaways', chapter: chStr },
        });
        break;
      case 'detailed':
        router.push({
          pathname: '/(tabs)/learn',
          params: { segment: 'read', readMode: 'in_depth', chapter: chStr },
        });
        break;
      case 'summary':
        router.push({
          pathname: '/(tabs)/learn',
          params: { segment: 'read', readMode: 'essentials', chapter: chStr },
        });
        break;
      case 'flashcards':
        router.push({
          pathname: '/(tabs)/practice',
          params: { part: 'revise', chapter: chStr },
        });
        break;
      case 'assessment':
        router.push({
          pathname: '/(tabs)/practice',
          params: { part: 'assessments', chapter: chStr },
        });
        break;
      case 'qbank':
        router.push({
          pathname: '/(tabs)/practice',
          params: { part: 'question_bank', chapter: chStr },
        });
        break;
      case 'prep_exam':
        router.push({
          pathname: '/(tabs)/prepare',
          params: { segment: 'prep_exam', chapter: chStr },
        });
        break;
      default:
        router.push({
          pathname: '/(tabs)/learn',
          params: { segment: 'read', readMode: 'essentials', chapter: chStr },
        });
        break;
    }
  };

  const handleContinue = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    if (currentActiveDay && currentActiveDay.dayNumber !== selectedDayNum) {
      setSelectedDayNum(currentActiveDay.dayNumber);
    }

    if (upNextTask) {
      handleOpenTask(upNextTask);
    }
  };

  // Theme tokens
  const screenBg = isDark ? '#16221C' : '#FAF8F3';
  const cardBg = isDark ? '#1E2D25' : '#FFFFFF';
  const cardBorder = isDark ? '#2E4438' : '#ECE8E2';
  const textDark = isDark ? '#F1F6F3' : '#18221D';
  const textMuted = isDark ? '#8DA697' : '#718277';
  const activeDayPillBg = isDark ? '#35291E' : '#FAF2EB';
  const activeDayPillBorder = isDark ? '#C88A5A' : '#C88A5A';
  const activeDayPillText = isDark ? '#F5C198' : '#8C532B';
  const activeDayPillSub = isDark ? '#DFC4AE' : '#945E37';
  const activeTaskCardBorder = isDark ? '#C88A5A' : '#C88A5A';
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
          paddingTop: 14,
          paddingBottom: insets.bottom + 36,
        },
        isTablet && styles.tabletContainer,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. THREE PERSONA ICONS ONLY (Synced with Global Persona) ── */}
      <View style={styles.milestonesRow}>
        {(['beginner', 'intermediate', 'advanced'] as PaceLevel[]).map((paceKey) => {
          const meta = PACE_META[paceKey];
          const isActive = activePace === paceKey;

          return (
            <TouchableOpacity
              key={paceKey}
              style={[
                styles.personaIconBtn,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? '#2D2210'
                      : '#FFFBEB'
                    : isDark
                    ? '#17241D'
                    : '#FEFEFE',
                  borderColor: isActive
                    ? '#D97706'
                    : isDark
                    ? '#2E4438'
                    : '#E2E8F0',
                },
                isActive && styles.personaIconBtnActive,
              ]}
              onPress={() => handleSelectPace(paceKey)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Persona: ${meta.label}`}
            >
              <Image
                source={meta.icon}
                style={[
                  styles.personaIconImg,
                  !isActive && { opacity: 0.8 },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Re-plan toast notice */}
      {replanNotice && (
        <View
          style={[
            styles.replanBanner,
            {
              backgroundColor: isDark ? '#21352A' : '#F1F5F3',
              borderColor: isDark ? '#3B5849' : '#C5D9CD',
            },
          ]}
        >
          <Text
            style={[
              styles.replanBannerText,
              { color: isDark ? '#A7F3D0' : '#2E4A3B' },
            ]}
          >
            ✓ {replanNotice}
          </Text>
        </View>
      )}

      {/* ── 2. SECTION LABEL: YOUR STUDY PLAN ── */}
      <View style={styles.eyebrowRow}>
        <Text style={[styles.eyebrowTitle, { color: textMuted }]}>
          YOUR STUDY PLAN · {PACE_META[activePace].label.toUpperCase()}
        </Text>
        <Text style={[styles.eyebrowMeta, { color: textMuted }]}>
          {days.length} days · ~{avgDailyMins}m/day
        </Text>
      </View>

      {/* ── 3. DAY SELECTOR ROW: [ D1 Today ] [ D2 Thu ] [ D3 Fri ] ... ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScrollRow}
      >
        {days.map((d, idx) => {
          const dayNumber = d.dayNumber || idx + 1;
          const isSelected = dayNumber === currentDayPlan?.dayNumber;
          const isToday = dayNumber === currentActiveDay?.dayNumber;
          const dayDone = d.tasks.length > 0 && d.tasks.every((t) => Boolean(completedTaskIds[t.id]));
          const dayPillTitle = `D${dayNumber}`;
          const dayPillSub = isToday
            ? 'Today'
            : getWeekdayForDayOffset(planStartDate, idx);

          return (
            <TouchableOpacity
              key={`day_${dayNumber}`}
              style={[
                styles.dayPill,
                {
                  backgroundColor: isSelected ? activeDayPillBg : cardBg,
                  borderColor: isSelected
                    ? activeDayPillBorder
                    : dayDone
                    ? '#22C55E'
                    : cardBorder,
                  borderWidth: isSelected ? 1.8 : 1.2,
                },
              ]}
              onPress={() => {
                try {
                  Haptics.selectionAsync().catch(() => {});
                } catch {}
                setSelectedDayNum(dayNumber);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.dayPillTopRow}>
                <Text
                  style={[
                    styles.dayPillTitle,
                    { color: isSelected ? activeDayPillText : textDark },
                  ]}
                >
                  {dayPillTitle}
                </Text>
                {dayDone && (
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color="#22C55E"
                    style={{ marginLeft: 2 }}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.dayPillSub,
                  {
                    color: isSelected
                      ? activeDayPillSub
                      : isToday
                      ? '#B46530'
                      : textMuted,
                    fontWeight: isToday ? '800' : '600',
                  },
                ]}
              >
                {dayPillSub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── 4. CURRENT DAY TITLE & STATS HEADER ── */}
      <View style={styles.dayHeaderRow}>
        <View style={styles.dayHeaderLeft}>
          <Text style={[styles.dayTitleText, { color: textDark }]} numberOfLines={2}>
            {`Day ${currentDayPlan?.dayNumber || 1} · ${cleanDayTopicTitle(
              currentDayPlan?.title || chapterTitle
            )}`}
          </Text>
          <Text style={[styles.daySubtopicText, { color: textMuted }]}>
            {`${PACE_META[activePace].label} track · ${dayDoneCount} of ${dayTotalCount} completed`}
          </Text>
        </View>

        <Text style={[styles.dayDoneStatsText, { color: textMuted }]}>
          {`${dayDoneCount}/${dayTotalCount} done · ~${dayTotalMins} min`}
        </Text>
      </View>

      {/* ── 5. TASK CARDS LIST ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={forestGreen} />
          <Text style={[styles.loadingText, { color: textMuted }]}>
            Loading study tasks...
          </Text>
        </View>
      ) : (
        <View style={styles.tasksList}>
          {currentDayTasks.map((task) => {
            const isChecked = Boolean(completedTaskIds[task.id]);
            const isUpNext =
              firstUncompletedInSelectedDay?.id === task.id && !isChecked;
            const labels = formatTaskDisplayLabels(task);

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: isUpNext
                      ? isDark
                        ? '#25211B'
                        : '#FCF9F5'
                      : cardBg,
                    borderColor: isUpNext ? activeTaskCardBorder : cardBorder,
                    borderWidth: isUpNext ? 1.8 : 1.2,
                  },
                ]}
              >
                {/* Square Rounded Checkbox */}
                <TouchableOpacity
                  style={[
                    styles.checkboxSquare,
                    {
                      borderColor: isChecked
                        ? forestGreen
                        : isDark
                        ? '#465F51'
                        : '#C5BEB3',
                      backgroundColor: isChecked ? forestGreen : 'transparent',
                    },
                  ]}
                  onPress={() => toggleTask(task.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.75}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  accessibilityLabel={`Mark ${labels.primary} complete`}
                >
                  {isChecked && (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                {/* Task Details (Tapping also toggles completion like web app) */}
                <TouchableOpacity
                  style={styles.taskTextCol}
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.taskTitleRow}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: textDark },
                        isChecked && styles.taskTitleCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {labels.primary}
                    </Text>
                    {isUpNext && (
                      <View style={styles.upNextBadge}>
                        <Text style={styles.upNextBadgeText}>UP NEXT</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.taskSubtitle,
                      { color: textMuted },
                      isChecked && { opacity: 0.6 },
                    ]}
                    numberOfLines={1}
                  >
                    {labels.secondary || task.subtitle || 'Essential resource'}
                  </Text>
                </TouchableOpacity>

                {/* Duration & Open Button */}
                <View style={styles.taskActionCol}>
                  <Text style={[styles.durationText, { color: textMuted }]}>
                    {`${task.durationMins} min`}
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

      {/* ── 6. BOTTOM PROGRESS SUMMARY & CONTINUE/REPLAN CARD ── */}
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
            {parsed.title || chapterTitle}
          </Text>
          <Text style={[styles.summaryPercentText, { color: textDark }]}>
            {`${overallProgressPercent}%`}
          </Text>
        </View>

        <Text style={[styles.summarySub, { color: textMuted }]}>
          {`${days.length}-day plan · ~${avgDailyMins} min/day · Target: ${finishDateLabel}`}
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
                width: `${Math.max(
                  overallProgressPercent > 0 ? 4 : 0,
                  overallProgressPercent
                )}%`,
              },
            ]}
          />
        </View>

        {upNextTask && (
          <Text style={[styles.upNextSummaryText, { color: textMuted }]}>
            {`Up next: ${formatTaskDisplayLabels(upNextTask).primary} (${upNextTask.durationMins}m) · ${PACE_META[activePace].label} Persona`}
          </Text>
        )}

        {/* Bottom Actions Row */}
        <View style={styles.summaryBottomRow}>
          <View>
            <Text style={[styles.tasksDoneText, { color: textMuted }]}>
              {`${overallDoneCount}/${totalPlanTasksCount} tasks done`}
            </Text>
            <TouchableOpacity
              onPress={handleReplanFromToday}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.replanBtn}
            >
              <Text style={[styles.replanBtnText, { color: textMuted }]}>
                ↻ Re-plan schedule
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: forestGreen }]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>
              {overallDoneCount > 0
                ? `Resume Day ${currentActiveDay?.dayNumber || 1} →`
                : `Continue Day ${currentActiveDay?.dayNumber || 1} →`}
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
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  /* 1. Personas (Icons Only) */
  milestonesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 16,
  },
  personaIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  personaIconBtnActive: {
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
    ...Platform.select({
      ios: {
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  personaIconImg: {
    width: 32,
    height: 32,
  },

  replanBanner: {
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  replanBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* 2. Eyebrow */
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  eyebrowTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  eyebrowMeta: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* 3. Days Selector */
  daysScrollRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
    marginBottom: 20,
  },
  dayPill: {
    minWidth: 62,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dayPillTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayPillTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  dayPillSub: {
    fontSize: 11,
    marginTop: 2,
  },

  /* 4. Day Info Header */
  dayHeaderRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayTitleText: {
    fontSize: 18.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  daySubtopicText: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 3,
  },
  dayDoneStatsText: {
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 3,
  },

  /* 5. Tasks List */
  tasksList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
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
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.65,
  },
  upNextBadge: {
    backgroundColor: '#F5E4D3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  upNextBadgeText: {
    color: '#B46530',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  taskSubtitle: {
    fontSize: 12,
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
    fontWeight: '600',
  },
  openPillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  openPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* 6. Bottom Summary Card */
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
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  summaryPercentText: {
    fontSize: 16,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 3,
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
  upNextSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  tasksDoneText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  replanBtn: {
    marginTop: 4,
  },
  replanBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  continueButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  continueButtonText: {
    fontSize: 13,
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
