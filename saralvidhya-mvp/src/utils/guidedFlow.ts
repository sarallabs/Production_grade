import type { ToolId } from "@/components/ToolsMenu";
import { cloudStorage, syncToolProgressToCloud } from "@/context/CloudStateContext";

/**
 * Ordered study-tool sequence for MOOCs mode. A learner unlocks these one at a
 * time, in order. Display order in the rail is derived from this array, so the
 * lock order and the visual order can never drift apart.
 */
export const GUIDED_FLOW: ToolId[] = [
  "videos",
  "flashcards",
  "assessment",
  "summary",
  "detailed",
  "revision_flashcards",
  "mocktest",
  "pre_final_test",
];

export const GUIDED_LABELS: Record<string, string> = {
  videos: "Videos",
  flashcards: "Flashcards",
  summary: "Quick Study",
  key_takeaways: "Takeaways",
  study_plan: "Study Plan",
  detailed: "Detailed Study",
  assessment: "Assessments",
  mindmap: "Mindmap",
  foundation: "Foundation",
  revision_flashcards: "Revision Flashcards",
  mocktest: "Mock Test",
  pre_final_test: "Certification Exam",
};

export const GUIDED_ICONS: Record<string, string> = {
  videos: "🎥",
  flashcards: "🗂️",
  summary: "📖",
  key_takeaways: "🔑",
  study_plan: "📅",
  detailed: "📝",
  assessment: "🎯",
  mindmap: "🧠",
  revision_flashcards: "🃏",
  mocktest: "🏆",
  pre_final_test: "🎓",
};

/** Rail tools that sit outside the sequence and are never locked. */
export const SUPPLEMENTARY_TOOLS: ToolId[] = [];

const KEY = "sv_guided_progress";

type ProgressMap = Record<string, ToolId[]>;

function chapterKey(subjectId: string, chapterNumber: number, videoIndex?: number): string {
  const base = `${subjectId}_${chapterNumber}`;
  return videoIndex ? `${base}_v${videoIndex}` : base;
}

function readAll(): ProgressMap {
  try {
    const raw = cloudStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: ProgressMap): void {
  try {
    cloudStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* cloud sync is best-effort */
  }
}

export function getCompletedTools(
  subjectId: string,
  chapterNumber: number,
  videoIndex?: number,
): ToolId[] {
  const map = readAll();
  const rootKey = chapterKey(subjectId, chapterNumber);
  const rootCompleted = map[rootKey] ?? [];
  if (!videoIndex) return rootCompleted;
  const videoCompleted = map[chapterKey(subjectId, chapterNumber, videoIndex)] ?? [];
  return Array.from(new Set([...rootCompleted, ...videoCompleted]));
}

/** Records a tool as done in cloud state and returns the new completed list. */
export function markToolCompleted(
  subjectId: string,
  chapterNumber: number,
  tool: ToolId,
  videoIndex?: number,
): ToolId[] {
  const map = readAll();
  const key = chapterKey(subjectId, chapterNumber, videoIndex);
  const completed = map[key] ?? [];
  if (!completed.includes(tool)) {
    map[key] = [...completed, tool];
    writeAll(map);
  }
  const chapterId = `chapter_${String(chapterNumber).padStart(2, "0")}`;
  syncToolProgressToCloud({
    subjectId,
    chapterId,
    visited: true,
    completedTool: tool,
    ...(tool === "videos" && videoIndex ? { completedVideoId: `video_${videoIndex}` } : {}),
  });
  return map[key] ?? completed;
}

export function resetChapterProgress(subjectId: string, chapterNumber: number): void {
  const map = readAll();
  const base = chapterKey(subjectId, chapterNumber);
  for (const key of Object.keys(map)) {
    if (key === base || key.startsWith(`${base}_v`)) delete map[key];
  }
  writeAll(map);
}

export function getProgressIndex(completed: ToolId[], flow: ToolId[] = GUIDED_FLOW): number {
  let i = 0;
  while (i < flow.length && completed.includes(flow[i])) i++;
  return i;
}

export function isToolUnlocked(
  tool: ToolId,
  completed: ToolId[],
  flow: ToolId[] = GUIDED_FLOW,
): boolean {
  if (tool === "videos") {
    return true;
  }

  if (completed.includes("videos")) {
    return true;
  }

  const idx = flow.indexOf(tool);
  if (idx === -1) return true;

  if (
    [
      "podcasts",
      "summary",
      "detailed",
      "mindmap",
      "foundation",
      "course_offerings",
      "youtube_links",
      "podcast_script",
      "study_guide",
      "learning_path",
      "study_plan",
      "key_takeaways",
    ].includes(tool)
  ) {
    return true;
  }

  return idx <= getProgressIndex(completed, flow);
}

export const VIDEO_SCOPED_TOOLS: ToolId[] = [
  "flashcards",
  "assessment",
  "summary",
  "detailed",
  "revision_flashcards",
];

export const CHAPTER_EXAM_TOOLS: ToolId[] = ["mocktest", "pre_final_test", "qbank"];

export const VIDEO_FLOW: ToolId[] = [
  "videos",
  "flashcards",
  "assessment",
  "summary",
  "detailed",
  "revision_flashcards",
];

export function isVideoWatched(
  subjectId: string,
  chapterNumber: number,
  videoIndex: number,
): boolean {
  if (!videoIndex) return false;
  const map = readAll();
  const key = chapterKey(subjectId, chapterNumber, videoIndex);
  const videoCompleted = map[key] ?? [];
  return videoCompleted.includes("videos");
}

export function markVideoWatched(
  subjectId: string,
  chapterNumber: number,
  videoIndex: number,
): ToolId[] {
  return markToolCompleted(subjectId, chapterNumber, "videos", videoIndex);
}

export function isVideoPlayable(
  subjectId: string,
  chapterNumber: number,
  videoIndex: number,
): boolean {
  if (videoIndex <= 1) return true;
  return isVideoWatched(subjectId, chapterNumber, videoIndex - 1);
}

export function areAllVideosWatched(
  subjectId: string,
  chapterNumber: number,
  videoCount: number,
): boolean {
  if (videoCount <= 0) return false;
  for (let i = 1; i <= videoCount; i++) {
    if (!isVideoWatched(subjectId, chapterNumber, i)) return false;
  }
  return true;
}

export function isToolUnlockedForVideo(
  tool: ToolId,
  subjectId: string,
  chapterNumber: number,
  videoIndex: number,
  videoCount: number,
): boolean {
  if (tool === "videos") return true;
  if (CHAPTER_EXAM_TOOLS.includes(tool)) {
    return areAllVideosWatched(subjectId, chapterNumber, videoCount);
  }
  if (VIDEO_SCOPED_TOOLS.includes(tool)) {
    return isVideoWatched(subjectId, chapterNumber, videoIndex);
  }
  return true;
}

const SEGMENT_KEY = "sv_chapter_video_counts";

function readSegmentCounts(): Record<string, number> {
  try {
    const raw = cloudStorage.getItem(SEGMENT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function getChapterVideoCount(subjectId: string, chapterNumber: number): number {
  return readSegmentCounts()[chapterKey(subjectId, chapterNumber)] ?? 0;
}

export function setChapterVideoCount(
  subjectId: string,
  chapterNumber: number,
  count: number,
): void {
  const counts = readSegmentCounts();
  const key = chapterKey(subjectId, chapterNumber);
  if (counts[key] === count) return;
  counts[key] = count;
  try {
    cloudStorage.setItem(SEGMENT_KEY, JSON.stringify(counts));
  } catch {
    /* ignore */
  }
}

export function getResumeVideoIndex(
  subjectId: string,
  chapterNumber: number,
  videoCount: number,
): number {
  for (let i = 1; i <= videoCount; i++) {
    if (!isVideoWatched(subjectId, chapterNumber, i)) return i;
  }
  return Math.max(1, videoCount);
}

export function getResumeTool(completed: ToolId[], flow: ToolId[] = GUIDED_FLOW): ToolId {
  const idx = getProgressIndex(completed, flow);
  const tool = flow[Math.min(idx, flow.length - 1)];
  if (tool === "mocktest" || tool === "pre_final_test") {
    return flow[0];
  }
  return tool;
}

export function isChapterComplete(subjectId: string, chapterNumber: number): boolean {
  const videoCount = getChapterVideoCount(subjectId, chapterNumber);
  if (videoCount > 0) return areAllVideosWatched(subjectId, chapterNumber, videoCount);

  const completed = getCompletedTools(subjectId, chapterNumber);
  return completed.includes("assessment");
}

export function snapToQuarter(percent: number): number {
  const clamped = Math.max(0, Math.min(100, percent || 0));
  return Math.round(clamped / 25) * 25;
}

export function getUnlockedFrontierIndex(
  subjectId: string,
  orderedChapterNumbers: number[],
): number {
  for (let i = 0; i < orderedChapterNumbers.length; i++) {
    if (!isChapterComplete(subjectId, orderedChapterNumbers[i])) return i;
  }
  return Math.max(0, orderedChapterNumbers.length - 1);
}
