import React, { useState, useMemo, useEffect } from "react";
import MarkdownView from "../MarkdownView";
import { cloudStorage } from "@/context/CloudStateContext";
import type { ToolId } from "../ToolsMenu";

// ── Saral Vidhya Muted Sage Palette ─────────────────────────────────────────
const G = {
  dark: "#2D3E36",
  primary: "#365345",
  mid: "#4F7B64",
  mutedText: "#5A6E63",
  light: "#7BA88B",
  pale: "#EEF5F1",
  paleControl: "#EDF3EE",
  paleBorder: "#D5E2D9",
  cardBorder: "#E2EBE5",
  subtleBg: "#F7FAF8",
  white: "#FFFFFF",
} as const;

export interface StudyPlanViewProps {
  content: string;
  subjectId: string;
  subjectName?: string;
  chapterNumber: number;
  chapterName?: string;
  isPurpleTheme?: boolean;
  onSwitchTool?: (tool: ToolId) => void;
}

export interface StudyTaskItem {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  category:
    | "mindmap"
    | "summary"
    | "detailed"
    | "key_takeaways"
    | "flashcards"
    | "assessment"
    | "qbank"
    | "prep_exam"
    | "videos"
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
  extraMarkdownSections: { title: string; content: string }[];
}

function detectCategoryAndTool(text: string): {
  category: StudyTaskItem["category"];
  toolTarget?: ToolId;
} {
  const lower = text.toLowerCase();
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
  if (lower.includes("video")) {
    return { category: "videos", toolTarget: "videos" };
  }
  if (lower.includes("detailed study") || lower.includes("detailed summary")) {
    return { category: "detailed", toolTarget: "detailed" };
  }
  if (lower.includes("quick study") || lower.includes("quick summary")) {
    return { category: "summary", toolTarget: "summary" };
  }
  return { category: "general" };
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
  return m ? parseInt(m[1], 10) : 15;
}

function getCategoryDefaultDescription(
  category: StudyTaskItem["category"],
  title: string
): string {
  switch (category) {
    case "mindmap":
      return "Visual hierarchy exploration & structural mental mapping";
    case "summary":
      return "Core concept orientation & high-level synthesis";
    case "detailed":
      return "Deep-dive academic reading, mechanisms & diagrams";
    case "key_takeaways":
      return "Rapid 5-minute high-yield definitions & exam invariants";
    case "flashcards":
      return "Spaced-repetition active recall & terminology drill";
    case "assessment":
      return "Formative self-check quiz to verify conceptual mastery";
    case "qbank":
      return "Structured 2M, 5M & 10M university model answer practice";
    case "prep_exam":
      return "Timed examination simulation & summative readiness check";
    case "videos":
      return "Guided visual lecture walkthrough & conceptual animation";
    default:
      return `Focused study activity: ${title}`;
  }
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

function parseStudyPlanContent(rawContent: string, fallbackChapterName?: string): ParsedStudyPlan {
  const trimmed = (rawContent || "").trim();
  const defaultTitle = fallbackChapterName || "Study Plan";

  if (!trimmed) {
    return {
      title: defaultTitle,
      subtitle: "Structured daily learning schedule and milestone tracker.",
      blueprints: [],
      extraMarkdownSections: [],
    };
  }

  // 1. Check JSON format
  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed);
      if (data && data.blueprints && typeof data.blueprints === "object") {
        const blueprints: StudyBlueprint[] = Object.entries(data.blueprints).map(
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
                  description: String(s.activity || getCategoryDefaultDescription(category, resTitle)),
                  durationMins: Number(s.duration_minutes) || 15,
                  category,
                  toolTarget,
                };
              });
              const totalMinutes =
                Number(d.daily_budget_minutes) ||
                tasks.reduce((acc, t) => acc + t.durationMins, 0) ||
                60;
              return {
                dayNumber: dayNum,
                title: String(d.topic || `Day ${dayNum} Study Module`),
                totalMinutes,
                tasks,
              };
            });

            const totalMins =
              Number(bpVal.total_time_mins) ||
              days.reduce((acc, d) => acc + d.totalMinutes, 0);

            const niceName =
              bpKey === "5_day_standard"
                ? `${days.length}-Day Standard`
                : bpKey === "2_day_fast_track"
                ? `${days.length}-Day Fast-Track`
                : bpKey
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());

            return {
              id: bpKey || `bp-${bpIdx + 1}`,
              name: niceName,
              badge: `${days.length}d`,
              subtitle: String(bpVal.target_persona || `${bpVal.daily_time_budget_mins || 60} mins / day`),
              totalMinutes: totalMins,
              days,
            };
          }
        );

        return {
          title: String(data.title || defaultTitle).replace(/^Study Plan:\s*/i, ""),
          subtitle: String(data.course || data.topic || "Structured daily schedule"),
          blueprints,
          extraMarkdownSections: [],
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
  const blueprints: StudyBlueprint[] = [];
  const extraMarkdownSections: { title: string; content: string }[] = [];

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
      const bpId = `bp-${blueprints.length + 1}`;
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
            const topicTitle = cleanMarkdownLinks(cells[1]);
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
        const shortNameMatch = headingClean.match(/Blueprint\s*\d+\s*:\s*([^(]+)/i);
        const displayName = shortNameMatch
          ? shortNameMatch[1].trim()
          : headingClean.replace(/\(.*\)$/, "").trim();

        blueprints.push({
          id: bpId,
          name: displayName,
          badge: `${days.length}d`,
          subtitle: descSubtitle || headingClean,
          totalMinutes: totalMins,
          days,
        });
      }
    } else if (hasDaySubheadings) {
      const bpId = `bp-${blueprints.length + 1}`;
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
            title: dayHeaderMatch[2].replace(/\*+/g, "").trim(),
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
        blueprints.push({
          id: bpId,
          name: headingClean
            .replace(/^\d+\.\s*/, "")
            .replace(/\(.*\)$/, "")
            .replace(/Undergraduate\s+/i, "")
            .trim(),
          badge: `${days.length}d`,
          subtitle: headingClean,
          totalMinutes: totalMins,
          days,
        });
      }
    } else if (bodyText && !bodyText.includes("```mermaid")) {
      extraMarkdownSections.push({
        title: sec.heading.replace(/\*+/g, "").trim(),
        content: bodyText.replace(/\[([^\]]+)\]\(file:\/\/[^)]+\)/g, "**$1**"),
      });
    }
  });

  return {
    title,
    subtitle: subtitle || "Structured daily learning schedule",
    blueprints,
    extraMarkdownSections,
  };
}

// Consistent subtle sage tags for task categories (no loud multi-colored badges)
const CATEGORY_META: Record<
  StudyTaskItem["category"],
  { label: string; actionLabel: string }
> = {
  mindmap: { label: "Mindmap", actionLabel: "Open Mindmap" },
  summary: { label: "Essentials Read", actionLabel: "Open Read" },
  detailed: { label: "In-depth Read", actionLabel: "Open Read" },
  key_takeaways: { label: "Key Takeaways", actionLabel: "Open Takeaways" },
  flashcards: { label: "Flashcards", actionLabel: "Open Revise" },
  assessment: { label: "Assessment", actionLabel: "Start Quiz" },
  qbank: { label: "Question Bank", actionLabel: "Open Q-Bank" },
  prep_exam: { label: "Preparation Exam", actionLabel: "Open Exam" },
  videos: { label: "Video Lecture", actionLabel: "Open Watch" },
  general: { label: "Study Session", actionLabel: "Open Tool" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, daysOffset: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + daysOffset);
  return d;
}

function parseDateKey(key: string): Date {
  const parts = key.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  content,
  subjectId,
  chapterNumber,
  chapterName,
  onSwitchTool,
}) => {
  const storageKeyCompleted = `sv_sp_done_${subjectId}_ch${chapterNumber}`;
  const storageKeyStartDate = `sv_sp_start_${subjectId}_ch${chapterNumber}`;

  const parsed = useMemo(
    () => parseStudyPlanContent(content, chapterName),
    [content, chapterName]
  );

  const [startDateStr, setStartDateStr] = useState<string>(() => {
    try {
      const saved = cloudStorage.getItem(storageKeyStartDate);
      if (saved) return saved;
    } catch {}
    return toDateKey(new Date());
  });

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = cloudStorage.getItem(storageKeyCompleted);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);

  const startDate = useMemo(() => parseDateKey(startDateStr), [startDateStr]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    () => new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  );

  useEffect(() => {
    try {
      const savedDone = cloudStorage.getItem(storageKeyCompleted);
      setCompletedTasks(savedDone ? JSON.parse(savedDone) : {});
      const savedStart = cloudStorage.getItem(storageKeyStartDate);
      if (savedStart) {
        setStartDateStr(savedStart);
        const dt = parseDateKey(savedStart);
        setCalendarMonth(new Date(dt.getFullYear(), dt.getMonth(), 1));
      }
    } catch {}
    setSelectedDayNum(1);
  }, [storageKeyCompleted, storageKeyStartDate]);

  const activeBlueprint = useMemo(
    () =>
      parsed.blueprints.find((b) => b.days.length === 5) ||
      parsed.blueprints[0] ||
      null,
    [parsed.blueprints]
  );

  const handleStartDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    setStartDateStr(newDateStr);
    const dt = parseDateKey(newDateStr);
    setCalendarMonth(new Date(dt.getFullYear(), dt.getMonth(), 1));
    try {
      cloudStorage.setItem(storageKeyStartDate, newDateStr);
    } catch {}
  };

  const saveCompleted = (next: Record<string, boolean>) => {
    setCompletedTasks(next);
    try {
      cloudStorage.setItem(storageKeyCompleted, JSON.stringify(next));
    } catch {}
  };

  const toggleTask = (taskId: string) => {
    saveCompleted({ ...completedTasks, [taskId]: !completedTasks[taskId] });
  };

  const toggleEntireDay = (dayPlan: StudyDayPlan) => {
    const allDone = dayPlan.tasks.every((t) => completedTasks[t.id]);
    const next = { ...completedTasks };
    dayPlan.tasks.forEach((t) => {
      next[t.id] = !allDone;
    });
    saveCompleted(next);
  };

  const dateToDayPlanMap = useMemo(() => {
    const map: Record<string, StudyDayPlan> = {};
    if (!activeBlueprint) return map;
    activeBlueprint.days.forEach((d) => {
      const dateObj = addDays(startDate, d.dayNumber - 1);
      map[toDateKey(dateObj)] = d;
    });
    return map;
  }, [activeBlueprint, startDate]);

  const blueprintStats = useMemo(() => {
    if (!activeBlueprint) return { totalTasks: 0, doneTasks: 0, pct: 0, completedDays: 0 };
    const allTasks = activeBlueprint.days.flatMap((d) => d.tasks);
    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter((t) => completedTasks[t.id]).length;
    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const completedDays = activeBlueprint.days.filter(
      (d) => d.tasks.length > 0 && d.tasks.every((t) => completedTasks[t.id])
    ).length;
    return { totalTasks, doneTasks, pct, completedDays };
  }, [activeBlueprint, completedTasks]);

  const selectedDayPlan = useMemo(() => {
    if (!activeBlueprint) return null;
    return (
      activeBlueprint.days.find((d) => d.dayNumber === selectedDayNum) ||
      activeBlueprint.days[0] ||
      null
    );
  }, [activeBlueprint, selectedDayNum]);

  const calendarGridDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      dateKey: string;
      inCurrentMonth: boolean;
      dayOfMonth: number;
    }[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        date: d,
        dateKey: toDateKey(d),
        inCurrentMonth: false,
        dayOfMonth: d.getDate(),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({
        date: d,
        dateKey: toDateKey(d),
        inCurrentMonth: true,
        dayOfMonth: day,
      });
    }

    const totalNeeded = cells.length > 35 ? 42 : 35;
    let nextDay = 1;
    while (cells.length < totalNeeded) {
      const d = new Date(year, month + 1, nextDay++);
      cells.push({
        date: d,
        dateKey: toDateKey(d),
        inCurrentMonth: false,
        dayOfMonth: d.getDate(),
      });
    }

    return cells;
  }, [calendarMonth]);

  const todayKey = toDateKey(new Date());

  if (!activeBlueprint) {
    return (
      <div style={{ maxWidth: "1040px", margin: "0 auto", padding: "12px 16px" }}>
        <MarkdownView content={content} />
      </div>
    );
  }

  const selectedDayDate = addDays(startDate, (selectedDayPlan?.dayNumber || 1) - 1);

  return (
    <div
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 4px 32px",
        fontFamily: "inherit",
        color: G.dark,
      }}
    >
      {/* ── Slim, Single-Row Top Header Bar ── */}
      <div
        style={{
          background: G.white,
          border: `1px solid ${G.paleBorder}`,
          borderRadius: "12px",
          padding: "8px 14px",
          marginBottom: "14px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          boxShadow: "0 1px 3px rgba(45, 62, 54, 0.04)",
        }}
      >
        {/* Left: Title & Compact Summary */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "220px", flex: "1 1 auto" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: G.pale,
              border: `1px solid ${G.paleBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: G.primary,
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: G.dark,
                letterSpacing: "-0.01em",
              }}
            >
              {parsed.title}
            </span>
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 600,
                color: G.mutedText,
                background: G.subtleBg,
                border: `1px solid ${G.cardBorder}`,
                padding: "2px 8px",
                borderRadius: "999px",
              }}
            >
              {activeBlueprint.totalMinutes} mins total
            </span>
          </div>
        </div>

        {/* Right: Start Date & Progress Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: G.subtleBg,
              border: `1px solid ${G.paleBorder}`,
              borderRadius: "8px",
              padding: "4px 9px",
              fontSize: "0.75rem",
              color: G.mutedText,
              fontWeight: 600,
            }}
          >
            <span>Start:</span>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => handleStartDateChange(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                color: G.dark,
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "inherit",
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: G.pale,
              border: `1px solid ${G.paleBorder}`,
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: G.primary,
            }}
          >
            <span>
              {blueprintStats.doneTasks}/{blueprintStats.totalTasks} Done
            </span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{blueprintStats.pct}%</span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Split View: Calendar (Left) + Daily Schedule (Right) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(310px, 370px) minmax(0, 1fr)",
          gap: "16px",
          alignItems: "start",
        }}
        className="sp-calendar-split-grid"
      >
          {/* ── LEFT COLUMN: Calendar Grid + Day List ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                background: G.white,
                borderRadius: "12px",
                border: `1px solid ${G.cardBorder}`,
                padding: "14px 16px",
              }}
            >
              {/* Month Navigation Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: G.dark }}>
                  {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                      )
                    }
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      border: `1px solid ${G.cardBorder}`,
                      background: G.subtleBg,
                      cursor: "pointer",
                      fontWeight: 600,
                      color: G.dark,
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarMonth(
                        new Date(startDate.getFullYear(), startDate.getMonth(), 1)
                      );
                      setSelectedDayNum(1);
                    }}
                    style={{
                      padding: "2px 8px",
                      height: "26px",
                      borderRadius: "6px",
                      border: `1px solid ${G.cardBorder}`,
                      background: G.subtleBg,
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: G.dark,
                    }}
                  >
                    Day 1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                      )
                    }
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      border: `1px solid ${G.cardBorder}`,
                      background: G.subtleBg,
                      cursor: "pointer",
                      fontWeight: 600,
                      color: G.dark,
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "4px",
                  marginBottom: "4px",
                }}
              >
                {WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    style={{
                      textAlign: "center",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: G.mutedText,
                      padding: "2px 0",
                    }}
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* 7-Col Calendar Days Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "4px",
                }}
              >
                {calendarGridDays.map((cell) => {
                  const studyDay = dateToDayPlanMap[cell.dateKey];
                  const isSelected =
                    studyDay && selectedDayPlan?.dayNumber === studyDay.dayNumber;
                  const isToday = cell.dateKey === todayKey;
                  const doneCount = studyDay
                    ? studyDay.tasks.filter((t) => completedTasks[t.id]).length
                    : 0;
                  const isDayComplete =
                    studyDay && studyDay.tasks.length > 0 && doneCount === studyDay.tasks.length;

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      disabled={!studyDay}
                      onClick={() => {
                        if (studyDay) {
                          setSelectedDayNum(studyDay.dayNumber);
                        }
                      }}
                      title={
                        studyDay
                          ? `Day ${studyDay.dayNumber}: ${studyDay.title} (${studyDay.totalMinutes} mins)`
                          : cell.dateKey
                      }
                      style={{
                        minHeight: "46px",
                        borderRadius: "8px",
                        padding: "4px 2px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: studyDay ? "pointer" : "default",
                        fontFamily: "inherit",
                        border: isSelected
                          ? `1.5px solid ${G.primary}`
                          : studyDay
                          ? `1px solid ${G.paleBorder}`
                          : isToday
                          ? `1px dashed ${G.light}`
                          : "1px solid transparent",
                        background: isSelected
                          ? G.primary
                          : isDayComplete
                          ? "#e6f4ea"
                          : studyDay
                          ? G.pale
                          : cell.inCurrentMonth
                          ? G.subtleBg
                          : G.white,
                        opacity: cell.inCurrentMonth || studyDay ? 1 : 0.35,
                        transition: "all 0.14s ease",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: studyDay || isToday ? 700 : 500,
                          color: isSelected ? G.white : G.dark,
                        }}
                      >
                        {cell.dayOfMonth}
                      </span>

                      {studyDay ? (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "4px",
                            background: isSelected
                              ? "rgba(255,255,255,0.2)"
                              : isDayComplete
                              ? G.mid
                              : G.white,
                            color: isSelected || isDayComplete ? G.white : G.primary,
                          }}
                        >
                          {isDayComplete ? `D${studyDay.dayNumber} ✓` : `D${studyDay.dayNumber}`}
                        </span>
                      ) : (
                        <span style={{ height: "14px" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Study Days Quick List */}
            <div
              style={{
                background: G.white,
                borderRadius: "12px",
                border: `1px solid ${G.cardBorder}`,
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "320px",
                overflowY: "auto",
              }}
            >
              {activeBlueprint.days.map((d) => {
                const isSelected = selectedDayPlan?.dayNumber === d.dayNumber;
                const dDate = addDays(startDate, d.dayNumber - 1);
                const doneCount = d.tasks.filter((t) => completedTasks[t.id]).length;
                const isDone = d.tasks.length > 0 && doneCount === d.tasks.length;

                return (
                  <button
                    key={d.dayNumber}
                    type="button"
                    onClick={() => {
                      setSelectedDayNum(d.dayNumber);
                      setCalendarMonth(new Date(dDate.getFullYear(), dDate.getMonth(), 1));
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: isSelected
                        ? `1px solid ${G.primary}`
                        : `1px solid ${G.cardBorder}`,
                      background: isSelected ? G.pale : G.white,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.14s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: isDone ? G.mid : isSelected ? G.primary : G.subtleBg,
                          color: isDone || isSelected ? G.white : G.dark,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? "✓" : `D${d.dayNumber}`}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: G.dark,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {d.title}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: G.mutedText }}>
                          {formatShortDate(dDate)} · {doneCount}/{d.tasks.length} done
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: G.mutedText,
                        flexShrink: 0,
                      }}
                    >
                      {d.totalMinutes}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Selected Day Agenda ── */}
          {selectedDayPlan && (
            <div
              style={{
                background: G.white,
                borderRadius: "12px",
                border: `1px solid ${G.cardBorder}`,
                overflow: "hidden",
              }}
            >
              {/* Slim Day Header */}
              <div
                style={{
                  padding: "14px 20px",
                  background: G.subtleBg,
                  borderBottom: `1px solid ${G.cardBorder}`,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span
                      style={{
                        background: G.pale,
                        color: G.primary,
                        border: `1px solid ${G.paleBorder}`,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      Day {selectedDayPlan.dayNumber} of {activeBlueprint.days.length}
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 500, color: G.mutedText }}>
                      {formatLongDate(selectedDayDate)} · {selectedDayPlan.totalMinutes} mins
                    </span>
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: G.dark,
                    }}
                  >
                    {selectedDayPlan.title}
                  </h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    disabled={selectedDayPlan.dayNumber <= 1}
                    onClick={() => setSelectedDayNum((n) => Math.max(1, n - 1))}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "7px",
                      border: `1px solid ${G.cardBorder}`,
                      background: G.white,
                      color: selectedDayPlan.dayNumber <= 1 ? "#cbd5e1" : G.dark,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      cursor: selectedDayPlan.dayNumber <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    ‹ Prev
                  </button>
                  <button
                    type="button"
                    disabled={selectedDayPlan.dayNumber >= activeBlueprint.days.length}
                    onClick={() =>
                      setSelectedDayNum((n) => Math.min(activeBlueprint.days.length, n + 1))
                    }
                    style={{
                      padding: "5px 10px",
                      borderRadius: "7px",
                      border: `1px solid ${G.cardBorder}`,
                      background: G.white,
                      color:
                        selectedDayPlan.dayNumber >= activeBlueprint.days.length
                          ? "#cbd5e1"
                          : G.dark,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      cursor:
                        selectedDayPlan.dayNumber >= activeBlueprint.days.length
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Next ›
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleEntireDay(selectedDayPlan)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "7px",
                      border: `1px solid ${G.primary}`,
                      background: selectedDayPlan.tasks.every((t) => completedTasks[t.id])
                        ? G.pale
                        : G.primary,
                      color: selectedDayPlan.tasks.every((t) => completedTasks[t.id])
                        ? G.primary
                        : G.white,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    {selectedDayPlan.tasks.every((t) => completedTasks[t.id])
                      ? "Completed ✓"
                      : "Mark Day Done"}
                  </button>
                </div>
              </div>

              {/* Session Rows */}
              <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {(() => {
                  let runningMins = 0;
                  return selectedDayPlan.tasks.map((task) => {
                    const startMin = runningMins;
                    runningMins += task.durationMins;

                    const isDone = Boolean(completedTasks[task.id]);
                    const meta = CATEGORY_META[task.category] || CATEGORY_META.general;

                    return (
                      <div
                        key={task.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "14px",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          border: `1px solid ${isDone ? G.paleBorder : G.cardBorder}`,
                          background: isDone ? G.subtleBg : G.white,
                          flexWrap: "wrap",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: "1 1 280px" }}>
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            style={{
                              marginTop: "2px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "5px",
                              border: isDone ? "none" : `1.5px solid ${G.light}`,
                              background: isDone ? G.mid : G.white,
                              color: G.white,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {isDone ? "✓" : ""}
                          </button>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontSize: "0.88rem",
                                  fontWeight: 600,
                                  color: isDone ? G.mutedText : G.dark,
                                  textDecoration: isDone ? "line-through" : "none",
                                }}
                              >
                                {task.title}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 600,
                                  padding: "1px 7px",
                                  borderRadius: "4px",
                                  background: G.pale,
                                  color: G.primary,
                                }}
                              >
                                {meta.label}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: G.mutedText,
                                  fontWeight: 500,
                                }}
                              >
                                {String(Math.floor(startMin / 60)).padStart(2, "0")}:
                                {String(startMin % 60).padStart(2, "0")} ({task.durationMins}m)
                              </span>
                            </div>

                            <div style={{ fontSize: "0.78rem", color: G.mutedText, lineHeight: 1.4 }}>
                              {task.description}
                            </div>
                          </div>
                        </div>

                        {onSwitchTool && task.toolTarget && (
                          <button
                            type="button"
                            onClick={() => onSwitchTool(task.toolTarget!)}
                            style={{
                              padding: "5px 11px",
                              borderRadius: "7px",
                              border: `1px solid ${G.paleBorder}`,
                              background: G.pale,
                              color: G.primary,
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {meta.actionLabel} →
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
      </div>

      <style>{`
        @media (max-width: 920px) {
          .sp-calendar-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudyPlanView;
