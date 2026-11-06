import type { ToolId } from "@/components/ToolsMenu";

/**
 * Ordered study-tool sequence for MOOCs mode. A learner unlocks these one at a
 * time, in order. Display order in the rail is derived from this array, so the
 * lock order and the visual order can never drift apart.
 */
export const GUIDED_FLOW: ToolId[] = [
  "videos",
  "summary",
  "detailed",
  "flashcards",
  "assessment",
  "revision_flashcards",
  "mocktest",
  "pre_final_test",
];

export const GUIDED_LABELS: Record<string, string> = {
  videos: "Videos",
  flashcards: "Flashcards",
  summary: "Quick Study",
  detailed: "Detailed Study",
  assessment: "Assessments",
  mindmap: "Mindmap",
  revision_flashcards: "Revision Flashcards",
  mocktest: "Mock Test",
  pre_final_test: "Certification Exam",
};

export const GUIDED_ICONS: Record<string, string> = {
  videos: "🎥",
  flashcards: "🗂️",
  summary: "📖",
  detailed: "📝",
  assessment: "🎯",
  mindmap: "🧠",
  revision_flashcards: "🃏",
  mocktest: "🏆",
  pre_final_test: "🎓",
};

/** Rail tools that sit outside the sequence and are never locked. */
export const SUPPLEMENTARY_TOOLS: ToolId[] = [];

/**
 * Durable per-chapter progress. Deliberately NOT stored in `saral_analytics`:
 * that key is an event log capped at 500 entries which evicts the oldest
 * events, so progress written there would vanish for an active learner and
 * silently re-lock tools they had already finished.
 */
const KEY = "sv_guided_progress";

type ProgressMap = Record<string, ToolId[]>;

/**
 * Progress bucket for a chapter, or for one video within a segmented chapter.
 *
 * Segmented chapters get a `_v<n>` suffix so each video keeps its own tool
 * completions. Unsuffixed keys are left exactly as they were, so progress
 * recorded before per-video gating existed still reads back correctly.
 */
function chapterKey(subjectId: string, chapterNumber: number, videoIndex?: number): string {
  const base = `${subjectId}_${chapterNumber}`;
  return videoIndex ? `${base}_v${videoIndex}` : base;
}

function readAll(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: ProgressMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage full or unavailable — progress is best-effort */
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

/** Records a tool as done and returns the new completed list. */
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
  return map[key] ?? completed;
}

export function resetChapterProgress(subjectId: string, chapterNumber: number): void {
  const map = readAll();
  const base = chapterKey(subjectId, chapterNumber);
  // Also clear the `_v<n>` buckets, or a "restart chapter" would leave every
  // video still marked watched and every tool still unlocked.
  for (const key of Object.keys(map)) {
    if (key === base || key.startsWith(`${base}_v`)) delete map[key];
  }
  writeAll(map);
}

/**
 * How many leading tools of the flow are complete. Uses the contiguous prefix
 * rather than set membership, so a stray completion can never unlock a later
 * step that its predecessors haven't earned.
 */
export function getProgressIndex(completed: ToolId[], flow: ToolId[] = GUIDED_FLOW): number {
  let i = 0;
  while (i < flow.length && completed.includes(flow[i])) i++;
  return i;
}

/** Every completed step, plus exactly the next one. Supplementary tools always. */
export function isToolUnlocked(
  tool: ToolId,
  completed: ToolId[],
  flow: ToolId[] = GUIDED_FLOW,
): boolean {
  if (tool === "videos") {
    return true;
  }

  // Once videos are watched, every tool in the chapter is automatically enabled!
  if (completed.includes("videos")) {
    return true;
  }

  const idx = flow.indexOf(tool);
  if (idx === -1) return true;

  if (["podcasts", "summary", "detailed", "mindmap", "course_offerings", "youtube_links", "podcast_script", "study_guide", "learning_path"].includes(tool)) {
    return true;
  }

  return idx <= getProgressIndex(completed, flow);
}

/* ------------------------------------------------------------------------- *
 * Per-video gating (segmented chapters)
 *
 * A chapter is "segmented" when it ships a videos.json — see getChapterVideos.
 * Its learn tools belong to a specific video and unlock only once that video
 * has been watched. The exams assess the whole unit, so they wait for all of
 * them. Everything below is inert for unsegmented chapters, which keep using
 * isToolUnlocked unchanged.
 * ------------------------------------------------------------------------- */

/** Tools that belong to a single video and unlock with it. */
export const VIDEO_SCOPED_TOOLS: ToolId[] = [
  "flashcards",
  "assessment",
  "summary",
  "detailed",
  "revision_flashcards",
];

/** Tools that assess the whole chapter and wait for every video. */
export const CHAPTER_EXAM_TOOLS: ToolId[] = ["mocktest", "pre_final_test", "qbank"];

/** The loop a learner walks for each video, in order. */
export const VIDEO_FLOW: ToolId[] = [
  "videos",
  "summary",
  "detailed",
  "flashcards",
  "assessment",
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

/** Records a video as watched and unlocks its learn tools. */
export function markVideoWatched(
  subjectId: string,
  chapterNumber: number,
  videoIndex: number,
): ToolId[] {
  return markToolCompleted(subjectId, chapterNumber, "videos", videoIndex);
}

/** Videos open in sequence: the first one, then whatever follows a watched video. */
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

/**
 * Whether `tool` is available while studying video `videoIndex`.
 *
 * Learn tools are deliberately *not* chained to one another: a learner may skip
 * flashcards and still reach the assessment. Watching the video is the only
 * gate, which is what makes "skip them and move on to the next video" work.
 */
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
  // Mindmap, Ask, PYQ, SWOT, leaderboard and friends stay open, as before.
  return true;
}

/**
 * How many videos each chapter is split into, keyed `<subjectId>_<chapter>`.
 *
 * The registry itself is fetched asynchronously (videos.json), but chapter-level
 * gating — `isChapterComplete`, and the chapter list that depends on it — is
 * synchronous and runs in places that never load it. Caching the count when it
 * is discovered lets those callers stay synchronous. A chapter that has never
 * been opened simply reads as unsegmented, which is also the correct answer for
 * the frontier: an unvisited chapter is not complete either way.
 */
const SEGMENT_KEY = "sv_chapter_video_counts";

function readSegmentCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEGMENT_KEY);
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
    localStorage.setItem(SEGMENT_KEY, JSON.stringify(counts));
  } catch {
    /* storage full or unavailable — gating falls back to the unsegmented rule */
  }
}

/** First unwatched video — where a returning learner resumes a segmented chapter. */
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

/** First incomplete step — where a returning learner should land. */
export function getResumeTool(completed: ToolId[], flow: ToolId[] = GUIDED_FLOW): ToolId {
  const idx = getProgressIndex(completed, flow);
  const tool = flow[Math.min(idx, flow.length - 1)];
  if (tool === "mocktest" || tool === "pre_final_test") {
    return flow[0];
  }
  return tool;
}

/**
 * Whether a chapter counts as finished for the purpose of unlocking the next one.
 *
 * Segmented chapters key this on every video being watched, not on the
 * assessment. Their learn tools are explicitly skippable, so requiring the
 * assessment would let a learner who skipped it — exactly as the flow invites —
 * strand themselves with the next chapter locked forever.
 *
 * Chapter-level gating is built on the same durable progress store as the
 * tool-level gating above, so the two can never disagree.
 */
export function isChapterComplete(subjectId: string, chapterNumber: number): boolean {
  const videoCount = getChapterVideoCount(subjectId, chapterNumber);
  if (videoCount > 0) return areAllVideosWatched(subjectId, chapterNumber, videoCount);

  const completed = getCompletedTools(subjectId, chapterNumber);
  return completed.includes("assessment");
}

/**
 * Index of the current (frontier) chapter in display order: the first chapter whose
 * predecessors are not all complete. Every chapter at index <= frontier is unlocked;
 * anything after it is locked. The first chapter is always unlocked, so an empty list
 * or a fully-completed subject both clamp into range.
 */
export function getUnlockedFrontierIndex(
  subjectId: string,
  orderedChapterNumbers: number[],
): number {
  // Unit-based locking decoupled: all chapters are always unlocked.
  return Math.max(0, orderedChapterNumbers.length - 1);
}
