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

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  content,
  subjectId,
  subjectName,
  chapterNumber,
  chapterName,
  onSwitchTool,
}) => {
  const storageKeyCompleted = `sv_sp_done_${subjectId}_ch${chapterNumber}`;

  const parsed = useMemo(
    () => parseStudyPlanContent(content, chapterName),
    [content, chapterName]
  );

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = cloudStorage.getItem(storageKeyCompleted);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);

  useEffect(() => {
    try {
      const savedDone = cloudStorage.getItem(storageKeyCompleted);
      setCompletedTasks(savedDone ? JSON.parse(savedDone) : {});
    } catch {}
    setSelectedDayNum(1);
  }, [storageKeyCompleted]);

  const activeBlueprint = useMemo(
    () =>
      parsed.blueprints.find((b) => b.days.length === 5) ||
      parsed.blueprints[0] ||
      null,
    [parsed.blueprints]
  );

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

  // Split title into main header and subtitle if formatted like "DBMS UNIT - I — Database System Concepts..."
  const { headerTitle, headerSubtitle } = useMemo(() => {
    const raw = parsed.title || "";
    const dashParts = raw.split(/\s+[—–]\s+|\s+-\s+(?=[A-Z])/);
    if (dashParts.length >= 2 && dashParts[0].trim().length <= 32) {
      return {
        headerTitle: dashParts[0].trim(),
        headerSubtitle: dashParts.slice(1).join(" — ").trim(),
      };
    }
    if (subjectName && chapterName) {
      return {
        headerTitle: `${subjectName.toUpperCase()} - CH ${chapterNumber}`,
        headerSubtitle: chapterName,
      };
    }
    return {
      headerTitle: raw,
      headerSubtitle: chapterName || parsed.subtitle || "Structured daily study plan",
    };
  }, [parsed.title, parsed.subtitle, subjectName, chapterNumber, chapterName]);

  // Focus areas for the "Study plan overview" card
  const focusAreas = useMemo(() => {
    if (!activeBlueprint) return [];
    const lowerTitle = `${parsed.title} ${headerSubtitle}`.toLowerCase();
    if (lowerTitle.includes("dbms") || lowerTitle.includes("database")) {
      return [
        "Compare file systems and DBMS.",
        "Understand 3-level schema architecture.",
        "Apply conceptual design and relational modeling.",
        "Practice SQL queries and normalization.",
      ];
    }
    return activeBlueprint.days.slice(0, 4).map((d) => {
      const cleanTopic = d.title
        .replace(/^(Module|Day|Unit|Part)\s*\d+\s*[—–:-]\s*/i, "")
        .trim();
      return `Master ${cleanTopic.charAt(0).toLowerCase() + cleanTopic.slice(1)}.`;
    });
  }, [activeBlueprint, parsed.title, headerSubtitle]);

  if (!activeBlueprint) {
    return (
      <div style={{ maxWidth: "1040px", margin: "0 auto", padding: "12px 16px" }}>
        <MarkdownView content={content} />
      </div>
    );
  }

  const numDays = activeBlueprint.days.length || 5;
  const avgDailyMins = Math.round(activeBlueprint.totalMinutes / numDays);

  const dayDoneCount = selectedDayPlan
    ? selectedDayPlan.tasks.filter((t) => completedTasks[t.id]).length
    : 0;
  const dayTotalCount = selectedDayPlan ? selectedDayPlan.tasks.length : 0;
  const dayPct = dayTotalCount > 0 ? Math.round((dayDoneCount / dayTotalCount) * 100) : 0;

  return (
    <div
      style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "4px 6px 36px",
        fontFamily: "inherit",
        color: G.dark,
      }}
    >
      {/* ── Top Summary Bar ── */}
      <div
        style={{
          background: G.white,
          border: `1px solid ${G.cardBorder}`,
          borderRadius: "16px",
          padding: "14px 20px",
          marginBottom: "18px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          boxShadow: "0 1px 3px rgba(45, 62, 54, 0.03)",
        }}
      >
        {/* Left: Grid Icon + Two-line Title/Subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "240px", flex: "1 1 auto" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#E8F1EC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: G.primary,
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "1.02rem",
                fontWeight: 800,
                color: "#1E2D26",
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
              }}
            >
              {headerTitle}
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 500,
                color: G.mutedText,
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {headerSubtitle}
            </div>
          </div>
        </div>

        {/* Center: Total Minutes Pill */}
        <div
          style={{
            background: "#E8F1EC",
            color: "#263B31",
            fontWeight: 700,
            fontSize: "0.8rem",
            padding: "7px 16px",
            borderRadius: "999px",
            whiteSpace: "nowrap",
          }}
        >
          {activeBlueprint.totalMinutes} mins total
        </div>

        {/* Right: Tasks Complete Progress Box */}
        <div
          style={{
            background: "#EEF5F1",
            border: `1px solid ${G.paleBorder}`,
            borderRadius: "12px",
            padding: "8px 14px",
            minWidth: "200px",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#1E2D26",
              marginBottom: "6px",
            }}
          >
            {blueprintStats.doneTasks} / {blueprintStats.totalTasks} tasks complete
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                flex: 1,
                height: "6px",
                borderRadius: "999px",
                background: "#D7E4DC",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${blueprintStats.pct}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background: G.primary,
                  transition: "width 0.25s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: G.mutedText,
                minWidth: "26px",
                textAlign: "right",
              }}
            >
              {blueprintStats.pct}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Template Layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "330px minmax(0, 1fr)",
          gap: "18px",
          alignItems: "start",
        }}
        className="sp-days-split-grid"
      >
        {/* ── LEFT COLUMN: Study Plan Overview + Study Days ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Card 1: Study plan overview */}
          <div
            style={{
              background: G.white,
              borderRadius: "18px",
              border: `1px solid ${G.cardBorder}`,
              padding: "20px",
              boxShadow: "0 1px 3px rgba(45, 62, 54, 0.03)",
            }}
          >
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#1E2D26",
                marginBottom: "4px",
              }}
            >
              Study plan overview
            </div>
            <div
              style={{
                fontSize: "0.76rem",
                color: G.mutedText,
                marginBottom: "16px",
                lineHeight: 1.4,
              }}
            >
              Quick context and focus areas for this {numDays}-day plan.
            </div>

            {/* 3 Stat Mini-Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.15fr 1fr 0.9fr",
                gap: "8px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  background: "#EAF2ED",
                  borderRadius: "12px",
                  padding: "10px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: G.primary,
                    marginBottom: "4px",
                  }}
                >
                  TOTAL TIME
                </div>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#1E2D26",
                    lineHeight: 1.2,
                  }}
                >
                  {activeBlueprint.totalMinutes} min
                </div>
                <div style={{ fontSize: "0.68rem", color: G.mutedText, marginTop: "3px" }}>
                  {avgDailyMins} min/day
                </div>
              </div>

              <div
                style={{
                  background: "#EAF2ED",
                  borderRadius: "12px",
                  padding: "10px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: G.primary,
                    marginBottom: "4px",
                  }}
                >
                  TOTAL TASKS
                </div>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#1E2D26",
                    lineHeight: 1.2,
                  }}
                >
                  {blueprintStats.totalTasks}
                </div>
                <div style={{ fontSize: "0.68rem", color: G.mutedText, marginTop: "3px" }}>
                  Across {numDays} days
                </div>
              </div>

              <div
                style={{
                  background: "#EAF2ED",
                  borderRadius: "12px",
                  padding: "10px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: G.primary,
                    marginBottom: "4px",
                  }}
                >
                  MODULES
                </div>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#1E2D26",
                    lineHeight: 1.2,
                  }}
                >
                  {numDays}
                </div>
                <div style={{ fontSize: "0.68rem", color: G.mutedText, marginTop: "3px" }}>
                  Core topics
                </div>
              </div>
            </div>

            {/* FOCUS AREAS */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: G.primary,
                  marginBottom: "10px",
                }}
              >
                FOCUS AREAS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {focusAreas.map((area, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "9px",
                      fontSize: "0.78rem",
                      color: "#2C3E35",
                      lineHeight: 1.35,
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: G.primary,
                        marginTop: "5px",
                        flexShrink: 0,
                      }}
                    />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* STUDY TIP Box */}
            <div
              style={{
                background: "#E8F1EC",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: G.primary,
                  marginBottom: "4px",
                }}
              >
                STUDY TIP
              </div>
              <div
                style={{
                  fontSize: "0.76rem",
                  color: "#2C3E35",
                  lineHeight: 1.4,
                }}
              >
                Start each day with the mindmap, then move to takeaways, video, and assessment.
              </div>
            </div>
          </div>

          {/* Card 2: Study days */}
          <div
            style={{
              background: G.white,
              borderRadius: "18px",
              border: `1px solid ${G.cardBorder}`,
              padding: "20px",
              boxShadow: "0 1px 3px rgba(45, 62, 54, 0.03)",
            }}
          >
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#1E2D26",
                marginBottom: "2px",
              }}
            >
              Study days
            </div>
            <div
              style={{
                fontSize: "0.76rem",
                color: G.mutedText,
                marginBottom: "14px",
              }}
            >
              {numDays}-day plan · {avgDailyMins} min/day
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeBlueprint.days.map((d) => {
                const isSelected = selectedDayPlan?.dayNumber === d.dayNumber;
                const doneCount = d.tasks.filter((t) => completedTasks[t.id]).length;
                const isDone = d.tasks.length > 0 && doneCount === d.tasks.length;
                const shortTitle =
                  d.title.length > 34 && d.title.includes(" & ")
                    ? d.title.split(" & ")[0]
                    : d.title;

                return (
                  <button
                    key={d.dayNumber}
                    type="button"
                    onClick={() => setSelectedDayNum(d.dayNumber)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "11px 12px",
                      borderRadius: "12px",
                      border: isSelected
                        ? `1.5px solid ${G.primary}`
                        : `1px solid ${G.cardBorder}`,
                      background: isSelected ? "#EEF5F1" : G.white,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          background: isDone
                            ? G.mid
                            : isSelected
                            ? "#2B4438"
                            : "#E6EFE9",
                          color: isDone || isSelected ? G.white : "#2B4438",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? "✓" : `D${d.dayNumber}`}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "#1E2D26",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {shortTitle}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: G.mutedText, marginTop: "2px" }}>
                          {doneCount}/{d.tasks.length} tasks
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.74rem",
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
        </div>

        {/* ── RIGHT COLUMN: Selected Day Agenda Card ── */}
        {selectedDayPlan && (
          <div
            style={{
              background: G.white,
              borderRadius: "18px",
              border: `1px solid ${G.cardBorder}`,
              padding: "24px 28px",
              boxShadow: "0 1px 3px rgba(45, 62, 54, 0.03)",
            }}
          >
            {/* Top Header Row of Right Card */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span
                    style={{
                      background: "#E8F1EC",
                      color: G.primary,
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: "999px",
                    }}
                  >
                    DAY {selectedDayPlan.dayNumber} OF {numDays}
                  </span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 500, color: G.mutedText }}>
                    {selectedDayPlan.totalMinutes} minutes
                  </span>
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.3rem",
                    fontWeight: 800,
                    color: "#1E2D26",
                    letterSpacing: "-0.015em",
                  }}
                >
                  {selectedDayPlan.title}
                </h2>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  disabled={selectedDayPlan.dayNumber <= 1}
                  onClick={() => setSelectedDayNum((n) => Math.max(1, n - 1))}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "999px",
                    border: `1px solid ${G.cardBorder}`,
                    background: G.white,
                    color: selectedDayPlan.dayNumber <= 1 ? "#B8C7BE" : "#1E2D26",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: selectedDayPlan.dayNumber <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ‹ Prev
                </button>
                <button
                  type="button"
                  disabled={selectedDayPlan.dayNumber >= numDays}
                  onClick={() => setSelectedDayNum((n) => Math.min(numDays, n + 1))}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "999px",
                    border: `1px solid ${G.cardBorder}`,
                    background: G.white,
                    color: selectedDayPlan.dayNumber >= numDays ? "#B8C7BE" : "#1E2D26",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: selectedDayPlan.dayNumber >= numDays ? "not-allowed" : "pointer",
                  }}
                >
                  Next ›
                </button>
                <button
                  type="button"
                  onClick={() => toggleEntireDay(selectedDayPlan)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "999px",
                    border: "1px solid #2B4438",
                    background: selectedDayPlan.tasks.every((t) => completedTasks[t.id])
                      ? "#E8F1EC"
                      : "#2B4438",
                    color: selectedDayPlan.tasks.every((t) => completedTasks[t.id])
                      ? "#2B4438"
                      : G.white,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  {selectedDayPlan.tasks.every((t) => completedTasks[t.id])
                    ? "Completed ✓"
                    : "Mark day done"}
                </button>
              </div>
            </div>

            {/* TODAY'S PROGRESS Banner */}
            <div
              style={{
                background: "#EAF2ED",
                borderRadius: "12px",
                padding: "14px 18px",
                marginBottom: "18px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: G.primary,
                    marginBottom: "3px",
                  }}
                >
                  TODAY&apos;S PROGRESS
                </div>
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "#1E2D26",
                  }}
                >
                  {dayDoneCount} of {dayTotalCount} tasks completed
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "200px" }}>
                <div
                  style={{
                    flex: 1,
                    width: "160px",
                    height: "6px",
                    borderRadius: "999px",
                    background: "#D5E2D9",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${dayPct}%`,
                      height: "100%",
                      borderRadius: "999px",
                      background: "#2B4438",
                      transition: "width 0.25s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: G.mutedText,
                    minWidth: "28px",
                    textAlign: "right",
                  }}
                >
                  {dayPct}%
                </span>
              </div>
            </div>

            {/* Task Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                        gap: "16px",
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: `1px solid ${isDone ? G.paleBorder : G.cardBorder}`,
                        background: isDone ? G.subtleBg : G.white,
                        flexWrap: "wrap",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: "1 1 280px" }}>
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          style={{
                            marginTop: "3px",
                            width: "20px",
                            height: "20px",
                            borderRadius: "6px",
                            border: isDone ? "none" : `1.5px solid ${G.paleBorder}`,
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
                          <div
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: isDone ? G.mutedText : "#1E2D26",
                              textDecoration: isDone ? "line-through" : "none",
                              marginBottom: "6px",
                            }}
                          >
                            {task.title}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "2px 9px",
                                borderRadius: "999px",
                                background: "#E8F1EC",
                                color: G.primary,
                              }}
                            >
                              {meta.label}
                            </span>
                            <span
                              style={{
                                fontSize: "0.74rem",
                                color: G.mutedText,
                                fontWeight: 500,
                              }}
                            >
                              {String(Math.floor(startMin / 60)).padStart(2, "0")}:
                              {String(startMin % 60).padStart(2, "0")} ({task.durationMins}m)
                            </span>
                          </div>

                          <div style={{ fontSize: "0.8rem", color: G.mutedText, lineHeight: 1.45 }}>
                            {task.description}
                          </div>
                        </div>
                      </div>

                      {onSwitchTool && task.toolTarget && (
                        <button
                          type="button"
                          onClick={() => onSwitchTool(task.toolTarget!)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "10px",
                            border: `1px solid ${G.paleBorder}`,
                            background: "#E8F1EC",
                            color: "#263B31",
                            fontSize: "0.78rem",
                            fontWeight: 700,
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

            {/* Bottom Study Tip Banner */}
            <div
              style={{
                background: "#EAF2ED",
                borderRadius: "12px",
                padding: "14px 18px",
                marginTop: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: G.primary,
                  marginBottom: "4px",
                }}
              >
                Study tip
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#1E2D26",
                  lineHeight: 1.4,
                }}
              >
                Start with the mindmap, review the key takeaways, then test your understanding with the quiz.
              </div>
            </div>

            {/* Footer Caption */}
            <div
              style={{
                fontSize: "0.74rem",
                color: G.mutedText,
                marginTop: "14px",
              }}
            >
              Daily plan · {selectedDayPlan.totalMinutes} minutes
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 920px) {
          .sp-days-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudyPlanView;

