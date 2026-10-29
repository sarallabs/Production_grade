import React, { useState, useMemo, useEffect } from "react";
import { cloudStorage } from "@/context/CloudStateContext";
import type { ToolId } from "../ToolsMenu";

export type PaceLevel = "beginner" | "intermediate" | "advanced";

export interface StudyPlanViewProps {
  content: string;
  subjectId: string;
  subjectName?: string;
  chapterNumber: number;
  chapterName?: string;
  isPurpleTheme?: boolean;
  persona?: PaceLevel;
  onChangePersona?: (persona: PaceLevel) => void;
  onSwitchTool?: (tool: ToolId) => void;
}

export interface StudyTaskItem {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  category:
    | "podcasts"
    | "videos"
    | "mindmap"
    | "summary"
    | "detailed"
    | "key_takeaways"
    | "flashcards"
    | "assessment"
    | "qbank"
    | "prep_exam"
    | "general";
  toolTarget?: ToolId;
}

export interface StudyDayPlan {
  dayNumber: number;
  title: string;
  totalMinutes: number;
  tasks: StudyTaskItem[];
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

function detectCategoryAndTool(text: string): {
  category: StudyTaskItem["category"];
  toolTarget?: ToolId;
} {
  const lower = text.toLowerCase();
  if (
    lower.includes("podcast") ||
    lower.includes("microcast") ||
    lower.includes("listen") ||
    lower.includes("audio")
  ) {
    return { category: "podcasts", toolTarget: "podcasts" };
  }
  if (lower.includes("video") || lower.includes("watch") || lower.includes("lecture")) {
    return { category: "videos", toolTarget: "videos" };
  }
  if (lower.includes("mindmap") || lower.includes("mind map")) {
    return { category: "mindmap", toolTarget: "mindmap" };
  }
  if (lower.includes("key takeaway") || lower.includes("takeaway")) {
    return { category: "key_takeaways", toolTarget: "key_takeaways" };
  }
  if (lower.includes("flashcard")) {
    return { category: "flashcards", toolTarget: "flashcards" };
  }
  if (lower.includes("question bank") || lower.includes("qbank")) {
    return { category: "qbank", toolTarget: "qbank" };
  }
  if (
    lower.includes("mock test") ||
    lower.includes("pre-final") ||
    lower.includes("certification exam") ||
    lower.includes("preparation exam") ||
    lower.includes("final exam")
  ) {
    return { category: "prep_exam", toolTarget: "prep_exam" };
  }
  if (
    lower.includes("mcq") ||
    lower.includes("msq") ||
    lower.includes("quiz") ||
    lower.includes("match the following") ||
    lower.includes("assessment")
  ) {
    return { category: "assessment", toolTarget: "assessment" };
  }
  if (
    lower.includes("detailed study") ||
    lower.includes("detailed summary") ||
    lower.includes("in-depth") ||
    lower.includes("deep dive")
  ) {
    return { category: "detailed", toolTarget: "detailed" };
  }
  if (
    lower.includes("quick study") ||
    lower.includes("quick summary") ||
    lower.includes("essentials") ||
    lower.includes("summary")
  ) {
    return { category: "summary", toolTarget: "summary" };
  }
  return { category: "summary", toolTarget: "summary" };
}

function cleanMarkdownLinks(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\$\\to\$|→/g, "→")
    .trim();
}

function parseMinutesFromText(text: string): number {
  const m =
    text.match(/\((\d+)\s*(?:m|min|mins|minutes)\)/i) ||
    text.match(/(\d+)\s*(?:m|min|mins|minutes)\b/i);
  return m ? parseInt(m[1], 10) : 10;
}

function getCategoryDefaultDescription(
  category: StudyTaskItem["category"],
  title: string
): string {
  switch (category) {
    case "podcasts":
      return "audio walkthrough";
    case "videos":
      return "concept video";
    case "summary":
      return "Essentials Read";
    case "detailed":
      return "In-depth Read";
    case "flashcards":
      return "";
    case "mindmap":
      return "visual concept map";
    case "key_takeaways":
      return "high-yield revision";
    case "assessment":
      return "concept check quiz";
    case "qbank":
      return "exam answer practice";
    case "prep_exam":
      return "timed mock test";
    default:
      return title;
  }
}

export function formatTaskDisplayLabels(task: StudyTaskItem): {
  primary: string;
  secondary: string;
} {
  const rawTitle = cleanMarkdownLinks(task.title)
    .replace(/\(\d+\s*(?:m|min|mins|minutes)\)/gi, "")
    .trim();

  // Check if title already has "Primary · Secondary" or "Primary — Secondary"
  const splitDot = rawTitle.split(/\s*[·•—–-]\s*/);
  if (splitDot.length >= 2 && splitDot[0].length <= 24) {
    return {
      primary: splitDot[0].trim(),
      secondary: splitDot.slice(1).join(" · ").trim(),
    };
  }

  switch (task.category) {
    case "podcasts":
      return { primary: "Listen", secondary: "audio walkthrough" };
    case "videos":
      return { primary: "Watch", secondary: "concept video" };
    case "summary":
      return { primary: "Quick Study", secondary: "Essentials Read" };
    case "detailed":
      return { primary: "Detailed Study", secondary: "In-depth Read" };
    case "flashcards":
      return { primary: "Flashcards", secondary: "" };
    case "mindmap":
      return { primary: "Mindmap", secondary: "visual hierarchy" };
    case "key_takeaways":
      return { primary: "Takeaways", secondary: "high-yield summary" };
    case "assessment":
      return { primary: "Assessment", secondary: "self-check quiz" };
    case "qbank":
      return { primary: "Question Bank", secondary: "structured practice" };
    case "prep_exam":
      return { primary: "Exam Prep.", secondary: "mock test" };
    default:
      return {
        primary: rawTitle || "Study Session",
        secondary: task.description && task.description !== rawTitle ? task.description : "",
      };
  }
}

function cleanDayTopicTitle(rawTitle: string): string {
  return cleanMarkdownLinks(rawTitle)
    .replace(/^Day\s+\d+\s*[:—–-]\s*/i, "")
    .replace(/\(\d+\s*(?:m|min|mins|minutes)\)/gi, "")
    .replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*·\s*/i, "")
    .trim();
}

function parseArrowSequenceIntoTasks(
  seqText: string,
  dayNumber: number,
  blueprintId: string,
  fallbackTotalMins: number
): StudyTaskItem[] {
  const rawParts = seqText
    .replace(/\$\\to\$/g, "→")
    .replace(/\\to\b/g, "→")
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
      .replace(/\(\d+\s*(?:m|min|mins|minutes)\)/gi, "")
      .replace(/^[-*•]\s*/, "")
      .trim();

    const { category, toolTarget } = detectCategoryAndTool(titleWithoutTime);
    const description = getCategoryDefaultDescription(category, titleWithoutTime);

    return {
      id: `${blueprintId}-d${dayNumber}-t${idx + 1}`,
      title: titleWithoutTime || `Session ${idx + 1}`,
      description,
      durationMins,
      category,
      toolTarget,
    };
  });
}

function ensureRichDayTasks(
  day: StudyDayPlan,
  blueprintId: string
): StudyDayPlan {
  // Ensure every day has a well-structured multimodal sequence if the DB row had very few or generic tasks
  const existing = day.tasks || [];
  if (existing.length >= 4) {
    const total = existing.reduce((acc, t) => acc + t.durationMins, 0) || day.totalMinutes || 45;
    return {
      ...day,
      totalMinutes: total,
    };
  }

  // Build multimodal sequence around the DB day's tasks while keeping all DB tasks intact
  const hasCategory = (cat: StudyTaskItem["category"]) =>
    existing.some((t) => t.category === cat);

  const enriched: StudyTaskItem[] = [];
  if (!hasCategory("podcasts")) {
    enriched.push({
      id: `${blueprintId}-d${day.dayNumber}-listen`,
      title: "Listen",
      description: "audio walkthrough",
      durationMins: 6,
      category: "podcasts",
      toolTarget: "podcasts",
    });
  }
  if (!hasCategory("videos")) {
    enriched.push({
      id: `${blueprintId}-d${day.dayNumber}-watch`,
      title: "Watch",
      description: "concept video",
      durationMins: 9,
      category: "videos",
      toolTarget: "videos",
    });
  }

  for (const t of existing) {
    enriched.push(t);
  }

  if (!hasCategory("summary")) {
    enriched.push({
      id: `${blueprintId}-d${day.dayNumber}-quick`,
      title: "Quick Study",
      description: "Essentials Read",
      durationMins: 8,
      category: "summary",
      toolTarget: "summary",
    });
  }
  if (!hasCategory("detailed")) {
    enriched.push({
      id: `${blueprintId}-d${day.dayNumber}-detailed`,
      title: "Detailed Study",
      description: "In-depth Read",
      durationMins: 15,
      category: "detailed",
      toolTarget: "detailed",
    });
  }
  if (!hasCategory("flashcards")) {
    enriched.push({
      id: `${blueprintId}-d${day.dayNumber}-flashcards`,
      title: "Flashcards",
      description: "",
      durationMins: 7,
      category: "flashcards",
      toolTarget: "flashcards",
    });
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
      subtitle: `${targetDaysCount} days · ${tagline}`,
      totalMinutes: 0,
      days: [],
    };
  }

  // If source already has exact number of days, clone and re-id
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
          totalMinutes: tasks.reduce((s, t) => s + t.durationMins, 0) || d.totalMinutes,
          tasks,
        },
        bpId
      );
    });
    return {
      id: bpId,
      pace,
      name: pace.charAt(0).toUpperCase() + pace.slice(1),
      badge: `${clonedDays.length}d`,
      subtitle: `${clonedDays.length} days · ${tagline}`,
      totalMinutes: clonedDays.reduce((s, d) => s + d.totalMinutes, 0),
      days: clonedDays,
    };
  }

  // Partition or expand sourceDays into targetDaysCount preserving DB topics & tasks
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
            .join(" & ")
        : cleanDayTopicTitle(primarySource.title);

    // Gather unique tasks by category/title so merged days stay clean and realistic
    const mergedTasks: StudyTaskItem[] = [];
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
          totalMinutes: mergedTasks.reduce((acc, t) => acc + t.durationMins, 0) || 45,
          tasks: mergedTasks,
        },
        bpId
      )
    );
  }

  return {
    id: bpId,
    pace,
    name: pace.charAt(0).toUpperCase() + pace.slice(1),
    badge: `${resultDays.length}d`,
    subtitle: `${resultDays.length} days · ${tagline}`,
    totalMinutes: resultDays.reduce((s, d) => s + d.totalMinutes, 0),
    days: resultDays,
  };
}

function normalizeToThreePaceBlueprints(rawBlueprints: StudyBlueprint[]): StudyBlueprint[] {
  if (rawBlueprints.length === 0) return [];

  // Sort raw blueprints by day count descending (e.g., 5-day first, then shorter fast-track plans)
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
    "beginner",
    "foundation-first"
  );
  const intermediateBp = synthesizePaceBlueprint(
    findMatching(intermediateCount) || longestDays,
    intermediateCount,
    "intermediate",
    "balanced depth"
  );
  const advancedBp = synthesizePaceBlueprint(
    findMatching(advancedCount) || shortestDays,
    advancedCount,
    "advanced",
    "in-depth & drill"
  );

  return [beginnerBp, intermediateBp, advancedBp];
}

function parseStudyPlanContent(rawContent: string, fallbackChapterName?: string): ParsedStudyPlan {
  const trimmed = (rawContent || "").trim();
  const defaultTitle = fallbackChapterName || "Study Plan";

  if (!trimmed) {
    return {
      title: defaultTitle,
      subtitle: "",
      blueprints: [],
    };
  }

  // 1. Check JSON format
  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed);
      if (data && data.blueprints && typeof data.blueprints === "object") {
        const rawBlueprints: StudyBlueprint[] = Object.entries(data.blueprints).map(
          ([bpKey, bpVal]: [string, any], bpIdx) => {
            const rawDays: any[] = Array.isArray(bpVal.days) ? bpVal.days : [];
            const days: StudyDayPlan[] = rawDays.map((d: any, dIdx: number) => {
              const dayNum = Number(d.day) || dIdx + 1;
              const rawSched: any[] = Array.isArray(d.schedule) ? d.schedule : [];
              const tasks: StudyTaskItem[] = rawSched.map((s: any, sIdx: number) => {
                const resTitle = String(s.resource || `Session ${sIdx + 1}`);
                const { category, toolTarget } = detectCategoryAndTool(resTitle);
                return {
                  id: `${bpKey}-d${dayNum}-t${sIdx + 1}`,
                  title: resTitle,
                  description: String(
                    s.activity || getCategoryDefaultDescription(category, resTitle)
                  ),
                  durationMins: Number(s.duration_minutes) || 10,
                  category,
                  toolTarget,
                };
              });
              const totalMinutes =
                Number(d.daily_budget_minutes) ||
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
              bpIdx === 0 ? "beginner" : bpIdx === 1 ? "intermediate" : "advanced";

            return {
              id: bpKey || `bp-${bpIdx + 1}`,
              pace,
              name: bpKey,
              badge: `${days.length}d`,
              subtitle: String(bpVal.target_persona || ""),
              totalMinutes: totalMins,
              days,
            };
          }
        );

        return {
          title: String(data.title || defaultTitle).replace(/^Study Plan:\s*/i, ""),
          subtitle: String(data.topic || data.course || ""),
          blueprints: normalizeToThreePaceBlueprints(rawBlueprints),
        };
      }
    } catch {
      // Fall through to markdown parser
    }
  }

  // 2. Parse Markdown format
  const lines = trimmed.split(/\r?\n/);
  let title = defaultTitle;
  let subtitle = "";
  const rawBlueprints: StudyBlueprint[] = [];

  interface RawH2Section {
    heading: string;
    bodyLines: string[];
  }
  const h2Sections: RawH2Section[] = [];
  let currentH2: RawH2Section | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!currentH2 && trimmedLine.startsWith("# ")) {
      title = trimmedLine
        .replace(/^#\s+/, "")
        .replace(/^Study Plan:\s*/i, "")
        .replace(/\*+/g, "")
        .trim();
      continue;
    }
    if (!currentH2 && trimmedLine.startsWith(">")) {
      const cleanQuote = trimmedLine
        .replace(/^>\s*/, "")
        .replace(/\*\*/g, "")
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
    const bodyText = sec.bodyLines.join("\n").trim();
    const headingClean = sec.heading.replace(/^[🏛️🧭⚡📖🏃🚀📅\d.]+\s*/, "").trim();

    const hasDayTable = /\|\s*\*?\*?Day\s+\d+\*?\*?\s*\|/i.test(bodyText);
    const hasDaySubheadings = /^###\s+Day\s+\d+/im.test(bodyText);

    if (hasDayTable) {
      const bpId = `bp-${rawBlueprints.length + 1}`;
      const days: StudyDayPlan[] = [];
      let descSubtitle = "";

      for (const line of sec.bodyLines) {
        const t = line.trim();
        if (!t || t === "---") continue;
        if (!t.startsWith("|")) {
          if (!descSubtitle && !t.startsWith("#")) {
            descSubtitle = t.replace(/:\s*$/, "");
          }
          continue;
        }
        const cells = t
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        if (cells.length >= 3) {
          const dayMatch = cells[0].match(/Day\s+(\d+)/i);
          if (dayMatch) {
            const dayNum = parseInt(dayMatch[1], 10);
            const topicTitle = cleanDayTopicTitle(cells[1]);
            const pathCell = cells[2];
            const timeCell = cells[3] || "45m";
            const totalMinutes = parseMinutesFromText(timeCell);
            const tasks = parseArrowSequenceIntoTasks(pathCell, dayNum, bpId, totalMinutes);
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
          pace: "beginner",
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
        if (!t || t === "---") continue;

        const dayHeaderMatch = t.match(/^###\s+Day\s+(\d+)\s*[:—-]\s*(.+)$/i);
        if (dayHeaderMatch) {
          const dayNum = parseInt(dayHeaderMatch[1], 10);
          currentDay = {
            dayNumber: dayNum,
            title: cleanDayTopicTitle(dayHeaderMatch[2].replace(/\*+/g, "").trim()),
            totalMinutes: 0,
            tasks: [],
          };
          days.push(currentDay);
          continue;
        }

        const bulletMatch = t.match(/^[-*+]\s+(.+)$/);
        if (bulletMatch && currentDay) {
          const rawItem = bulletMatch[1].trim();
          const durationMins = parseMinutesFromText(rawItem);
          const parts = rawItem.split(/\s+[—–-]\s+/);
          const leftPart = cleanMarkdownLinks(parts[0] || rawItem)
            .replace(/\(\d+\s*(?:m|min|mins|minutes)\)/gi, "")
            .trim();
          const rightPart = parts.slice(1).join(" — ").trim();
          const { category, toolTarget } = detectCategoryAndTool(leftPart);

          currentDay.tasks.push({
            id: `${bpId}-d${currentDay.dayNumber}-t${currentDay.tasks.length + 1}`,
            title: leftPart,
            description: rightPart || getCategoryDefaultDescription(category, leftPart),
            durationMins,
            category,
            toolTarget,
          });
          currentDay.totalMinutes += durationMins;
        }
      }

      if (days.length > 0) {
        const totalMins = days.reduce((acc, d) => acc + d.totalMinutes, 0);
        rawBlueprints.push({
          id: bpId,
          pace: "beginner",
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
    blueprints: normalizeToThreePaceBlueprints(rawBlueprints),
  };
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

const PACE_META: Record<
  PaceLevel,
  { label: string; tagline: string; img: string }
> = {
  beginner: {
    label: "Beginner",
    tagline: "foundation-first",
    img: "personas/beginner.png",
  },
  intermediate: {
    label: "Intermediate",
    tagline: "balanced depth",
    img: "personas/intermediate.png",
  },
  advanced: {
    label: "Advanced",
    tagline: "in-depth & drill",
    img: "personas/advanced.png",
  },
};

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  content,
  subjectId,
  subjectName,
  chapterNumber,
  chapterName,
  persona = "beginner",
  onChangePersona,
  onSwitchTool,
}) => {
  const parsed = useMemo(
    () => parseStudyPlanContent(content, chapterName),
    [content, chapterName]
  );

  const storageKey = `sv_study_plan_progress_${subjectId}_ch${chapterNumber}`;
  const replanKey = `sv_study_plan_start_${subjectId}_ch${chapterNumber}`;
  const dayKey = `sv_study_plan_day_${subjectId}_ch${chapterNumber}`;

  const [activePace, setActivePace] = useState<PaceLevel>(persona || "beginner");
  const [selectedDayNum, setSelectedDayNum] = useState<number>(() => {
    try {
      const savedDay = cloudStorage.getItem(dayKey);
      const parsedDay = savedDay ? parseInt(savedDay, 10) : NaN;
      return Number.isFinite(parsedDay) && parsedDay >= 1 ? parsedDay : 1;
    } catch {
      return 1;
    }
  });
  const [showReplanInfo, setShowReplanInfo] = useState<boolean>(false);
  const [replanNotice, setReplanNotice] = useState<string | null>(null);

  useEffect(() => {
    if (persona && persona !== activePace) {
      setActivePace(persona);
    }
  }, [persona]);

  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = cloudStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [planStartIso, setPlanStartIso] = useState<string>(() => {
    try {
      const saved = cloudStorage.getItem(replanKey);
      return saved || new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  });

  useEffect(() => {
    const syncFromCloud = () => {
      try {
        const saved = cloudStorage.getItem(storageKey);
        if (saved) {
          setCompletedTaskIds(JSON.parse(saved));
        } else {
          setCompletedTaskIds((prev) => (Object.keys(prev).length === 0 ? prev : {}));
        }
      } catch {}
      try {
        const savedStart = cloudStorage.getItem(replanKey);
        if (savedStart) setPlanStartIso(savedStart);
      } catch {}
      try {
        const savedDay = cloudStorage.getItem(dayKey);
        const parsedDay = savedDay ? parseInt(savedDay, 10) : NaN;
        if (Number.isFinite(parsedDay) && parsedDay >= 1) {
          setSelectedDayNum(parsedDay);
        }
      } catch {}
    };
    syncFromCloud();
    return cloudStorage.subscribe(syncFromCloud);
  }, [storageKey, replanKey, dayKey]);

  useEffect(() => {
    try {
      cloudStorage.setItem(dayKey, String(selectedDayNum));
    } catch {}
  }, [dayKey, selectedDayNum]);
  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try {
        cloudStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleSelectPace = (pace: PaceLevel) => {
    setActivePace(pace);
    onChangePersona?.(pace);
  };

  const handleReplanFromToday = () => {
    const nowIso = new Date().toISOString();
    setPlanStartIso(nowIso);
    try {
      cloudStorage.setItem(replanKey, nowIso);
    } catch {
      // Ignore storage errors
    }
    setReplanNotice("Schedule updated — remaining tasks reshuffled starting today.");
    setTimeout(() => setReplanNotice(null), 3500);
  };

  const activeBlueprint = useMemo(() => {
    return (
      parsed.blueprints.find((b) => b.pace === activePace) ||
      parsed.blueprints[0] ||
      null
    );
  }, [parsed.blueprints, activePace]);

  useEffect(() => {
    if (activeBlueprint && activeBlueprint.days.length > 0) {
      const exists = activeBlueprint.days.some((d) => d.dayNumber === selectedDayNum);
      if (!exists) {
        setSelectedDayNum(activeBlueprint.days[0].dayNumber);
      }
    }
  }, [activeBlueprint, selectedDayNum]);

  if (!activeBlueprint || activeBlueprint.days.length === 0) {
    return (
      <div
        style={{
          minHeight: "100%",
          background: '#F8F5EE',
          padding: "32px",
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          color: "#1E2822",
        }}
      >
        <div
          style={{
            maxWidth: "880px",
            margin: "0 auto",
            background: "#FFFFFF",
            border: "1px solid #E6E0D4",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
            color: "#6E766E",
          }}
        >
          No study plan data found for this chapter.
        </div>
      </div>
    );
  }

  // Compute overall blueprint progress
  const allBlueprintTasks = activeBlueprint.days.flatMap((d) => d.tasks);
  const totalTasksCount = allBlueprintTasks.length;
  const completedTasksCount = allBlueprintTasks.filter((t) => !!completedTaskIds[t.id]).length;
  const progressPct =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Determine the active "Continue Day" (first day with uncompleted tasks, or Day 1)
  const currentActiveDay =
    activeBlueprint.days.find((d) => d.tasks.some((t) => !completedTaskIds[t.id])) ||
    activeBlueprint.days[0];

  const remainingActiveDayTasks = currentActiveDay.tasks.filter(
    (t) => !completedTaskIds[t.id]
  );
  const remainingActiveDayMins = remainingActiveDayTasks.reduce(
    (acc, t) => acc + t.durationMins,
    0
  );
  const upNextTask = remainingActiveDayTasks[0] || currentActiveDay.tasks[0] || null;

  const selectedDayPlan =
    activeBlueprint.days.find((d) => d.dayNumber === selectedDayNum) ||
    currentActiveDay;

  const selectedDayDoneCount = selectedDayPlan.tasks.filter(
    (t) => !!completedTaskIds[t.id]
  ).length;
  const firstUncompletedInSelectedDay = selectedDayPlan.tasks.find(
    (t) => !completedTaskIds[t.id]
  );

  // Compute header title & subtitle from DB and props
  const avgDailyMins = Math.max(
    15,
    Math.round(activeBlueprint.totalMinutes / Math.max(1, activeBlueprint.days.length))
  );

  const headerTitle = useMemo(() => {
    const codeMatch = parsed.title.match(/^([A-Z]{3,6}\s*\d{2,3})/i);
    if (codeMatch) {
      return `${codeMatch[1].toUpperCase()} — CH ${chapterNumber}`;
    }
    if (subjectName) {
      return `${subjectName} — CH ${chapterNumber}`;
    }
    return `CH ${chapterNumber} — ${chapterName || parsed.title}`;
  }, [parsed.title, subjectName, chapterNumber, chapterName]);

  const headerChapterTitle = useMemo(() => {
    const raw = (chapterName || parsed.title || "")
      .replace(/^Study Plan:\s*/i, "")
      .replace(/^[A-Z]{3,6}\s*\d{2,3}\s*[:—–-]\s*/i, "")
      .trim();
    return raw || "Chapter Study Plan";
  }, [chapterName, parsed.title]);

  const planStartDate = useMemo(() => {
    const d = new Date(planStartIso);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [planStartIso]);

  const finishDateLabel = formatTargetDate(
    planStartDate,
    activeBlueprint.days.length - 1
  );

  const circleSize = 136;
  const circleStroke = 9;
  const circleRadius = (circleSize - circleStroke) / 2;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleDashOffset =
    circleCircumference - (Math.min(100, Math.max(0, progressPct)) / 100) * circleCircumference;

  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        background: "#F8F5EE",
        padding: "12px 20px 36px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        color: "#1E2822",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", margin: "0 auto" }}>
        {/* 1. TOP PERSONA / PACE BAR */}
        <div
          className="sp-pace-cards-row"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            marginBottom: "14px",
          }}
        >
          {(["beginner", "intermediate", "advanced"] as PaceLevel[]).map((paceKey) => {
            const meta = PACE_META[paceKey];
            const isActive = activePace === paceKey;
            return (
              <button
                key={paceKey}
                type="button"
                onClick={() => handleSelectPace(paceKey)}
                title={meta.label}
                style={{
                  minWidth: "60px",
                  height: "54px",
                  borderRadius: "11px",
                  padding: "3px 8px 4px",
                  border: isActive ? "2px solid #7C8F6A" : "2px solid transparent",
                  background: isActive ? "#F5F8F2" : "transparent",
                  boxShadow: isActive ? "0 3px 10px rgba(84, 108, 96, 0.20)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  overflow: "visible",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  boxSizing: "border-box",
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}${meta.img}`}
                  alt={meta.label}
                  style={{
                    width: "34px",
                    height: "34px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    padding: 0,
                    boxSizing: "border-box",
                    filter: isActive
                      ? "grayscale(0) opacity(1) drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      : "grayscale(0.15) opacity(0.78)",
                    transform: isActive ? "scale(1.06)" : "scale(1)",
                    transition: "filter 0.2s ease, transform 0.2s ease",
                  }}
                />
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? "#1E2822" : "#64748B",
                    lineHeight: 1.1,
                    letterSpacing: "0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {replanNotice && (
          <div
            style={{
              background: "#F1F5F3",
              border: "1px solid #C5D9CD",
              color: "#2E4A3B",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            ✓ {replanNotice}
          </div>
        )}

        {/* 2. FULL-WIDTH 3-COLUMN GRID: STUDY DAYS (LEFT) | DAY TASKS (MIDDLE) | PROGRESS & RESUME CARD (RIGHT) */}
        <div
          className="sp-days-split-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "290px minmax(0, 1fr) 280px",
            gap: "16px",
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN: DAY-WISE PLANNER (STUDY DAYS) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E0D4",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "10.5px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#7A807A",
                textTransform: "uppercase",
                marginBottom: "10px",
                paddingLeft: "2px",
              }}
            >
              STUDY DAYS
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeBlueprint.days.map((day, idx) => {
                const isSelected = day.dayNumber === selectedDayPlan.dayNumber;
                const isToday = day.dayNumber === currentActiveDay.dayNumber;
                const weekdayPrefix = getWeekdayForDayOffset(planStartDate, idx);
                const cleanTopic = cleanDayTopicTitle(day.title);

                return (
                  <button
                    key={day.dayNumber}
                    type="button"
                    onClick={() => setSelectedDayNum(day.dayNumber)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      background: isSelected ? "#F3F6F1" : "#FFFFFF",
                      border: isSelected
                        ? "1.5px solid #7C8F6A"
                        : "1px solid #E6E0D4",
                      boxShadow: isSelected
                        ? "0 3px 10px rgba(84, 108, 96, 0.14)"
                        : "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.16s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: isSelected ? "#546C60" : "#EAE6DF",
                          color: isSelected ? "#FFFFFF" : "#49524C",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        D{day.dayNumber}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        {isToday && (
                          <div
                            style={{
                              fontSize: "9.5px",
                              fontWeight: 800,
                              color: "#4A6356",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              marginBottom: "1px",
                            }}
                          >
                            TODAY
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#1E2822",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {isToday ? cleanTopic : `${weekdayPrefix} · ${cleanTopic}`}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: isSelected ? "#4A6356" : "#7A807A",
                            marginTop: "1px",
                          }}
                        >
                          {day.tasks.length} tasks
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6E766E",
                        flexShrink: 0,
                      }}
                    >
                      {day.totalMinutes}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MIDDLE COLUMN: DAY N TASKS BODY */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E0D4",
              borderRadius: "16px",
              padding: "20px 22px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#1E2822",
                  }}
                >
                  Day {selectedDayPlan.dayNumber} · {cleanDayTopicTitle(selectedDayPlan.title)}
                </div>
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "#7A807A",
                  flexShrink: 0,
                }}
              >
                {selectedDayDoneCount} of {selectedDayPlan.tasks.length} done · ~
                {selectedDayPlan.totalMinutes} min
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedDayPlan.tasks.map((task) => {
                const isDone = !!completedTaskIds[task.id];
                const isUpNext =
                  firstUncompletedInSelectedDay?.id === task.id && !isDone;
                const labels = formatTaskDisplayLabels(task);

                return (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                      padding: "13px 16px",
                      borderRadius: "12px",
                      background: isUpNext
                        ? "#F4F7F3"
                        : isDone
                        ? "#FAF9F6"
                        : "#FFFFFF",
                      border: isUpNext
                        ? "1.5px solid #7C8F6A"
                        : "1px solid #E6E0D4",
                      boxShadow: isUpNext
                        ? "0 2px 10px rgba(84, 108, 96, 0.12)"
                        : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <button
                        type="button"
                        aria-label={`Mark ${labels.primary} complete`}
                        onClick={() => toggleTask(task.id)}
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "5px",
                          border: isDone
                            ? "1.5px solid #546C60"
                            : "1.5px solid #BFC8C1",
                          background: isDone ? "#546C60" : "#FFFFFF",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                          padding: 0,
                        }}
                      >
                        {isDone && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      <div
                        onClick={() => toggleTask(task.id)}
                        style={{
                          fontSize: "13.5px",
                          color: "#1E2822",
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.6 : 1,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#1E2822" }}>
                          {labels.primary}
                        </span>
                        {labels.secondary && (
                          <span style={{ fontWeight: 400, color: "#6E766E" }}>
                            {" "}
                            · {labels.secondary}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexShrink: 0,
                      }}
                    >
                      {isUpNext && (
                        <span
                          style={{
                            background: "#E4ECE3",
                            color: "#3F594C",
                            border: "1px solid #C2D4C0",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          UP NEXT
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#6E766E",
                          minWidth: "42px",
                          textAlign: "right",
                        }}
                      >
                        {task.durationMins} min
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (task.toolTarget && onSwitchTool) {
                            onSwitchTool(task.toolTarget);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#546C60";
                          e.currentTarget.style.color = "#FFFFFF";
                          e.currentTarget.style.borderColor = "#546C60";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(84, 108, 96, 0.22)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isUpNext ? "#EBF1EA" : "#FAF8F4";
                          e.currentTarget.style.color = isUpNext ? "#2D4438" : "#1E2822";
                          e.currentTarget.style.borderColor = isUpNext ? "#7C8F6A" : "#DCE3DA";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        style={{
                          background: isUpNext ? "#EBF1EA" : "#FAF8F4",
                          border: isUpNext ? "1px solid #7C8F6A" : "1px solid #DCE3DA",
                          borderRadius: "999px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: isUpNext ? "#2D4438" : "#1E2822",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.16s ease",
                        }}
                      >
                        Open →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: UNIFIED SUBTLE PROGRESS CIRCLE + METADATA + CONTINUE/RESUME CARD */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E0D4",
              borderRadius: "16px",
              padding: "22px 20px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "sticky",
              top: "14px",
              boxShadow: "0 2px 10px rgba(30, 40, 34, 0.03)",
            }}
          >
            {/* Subtle Header Title */}
            <div
              style={{
                fontSize: "14.5px",
                fontWeight: 700,
                color: "#1E2822",
                lineHeight: 1.35,
                marginBottom: "3px",
              }}
            >
              {headerChapterTitle}
            </div>
            <div
              style={{
                fontSize: "11.5px",
                fontWeight: 500,
                color: "#7A807A",
                marginBottom: "18px",
              }}
            >
              {activeBlueprint.days.length}-day plan · ~{avgDailyMins} min/day
            </div>

            {/* Big Circular Progress Ring with Percentage in Center */}
            <div
              style={{
                position: "relative",
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <svg
                width={circleSize}
                height={circleSize}
                viewBox={`0 0 ${circleSize} ${circleSize}`}
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={circleRadius}
                  fill="none"
                  stroke="#EFECE5"
                  strokeWidth={circleStroke}
                />
                <circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={circleRadius}
                  fill="none"
                  stroke="#546C60"
                  strokeWidth={circleStroke}
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={circleDashOffset}
                  style={{ transition: "stroke-dashoffset 0.45s cubic-bezier(0.22, 1, 0.36, 1)" }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#1E2822",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {progressPct}%
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "#8A928C",
                    marginTop: "4px",
                  }}
                >
                  completed
                </span>
              </div>
            </div>

            {/* Subtle Metadata Below Circle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginBottom: "18px",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {completedTasksCount} of {totalTasksCount} tasks done
              </div>
              {upNextTask && (
                <div
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 500,
                    color: "#7A807A",
                  }}
                >
                  Up next: {formatTaskDisplayLabels(upNextTask).primary} ({upNextTask.durationMins}m)
                </div>
              )}
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#8A928C",
                }}
              >
                Target: {finishDateLabel}
              </div>
            </div>

            {/* Continue / Resume Day Button at Bottom */}
            <button
              type="button"
              onClick={() => {
                setSelectedDayNum(currentActiveDay.dayNumber);
                if (upNextTask?.toolTarget && onSwitchTool) {
                  onSwitchTool(upNextTask.toolTarget);
                }
              }}
              style={{
                width: "100%",
                background: "#546C60",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "11px",
                padding: "11px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(84, 108, 96, 0.2)",
                transition: "all 0.18s ease",
              }}
            >
              <span>
                {completedTasksCount > 0
                  ? `Resume Day ${currentActiveDay.dayNumber} →`
                  : `Continue Day ${currentActiveDay.dayNumber} →`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleReplanFromToday}
              style={{
                marginTop: "10px",
                background: "none",
                border: "none",
                padding: "2px 6px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#8A928C",
                cursor: "pointer",
              }}
              title="Reset schedule start date to today while keeping completed tasks"
            >
              ↻ Re-plan schedule
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .sp-days-split-grid {
            grid-template-columns: 1fr !important;
          }
          .sp-pace-cards-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudyPlanView;

