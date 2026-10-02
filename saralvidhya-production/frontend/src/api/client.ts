/**
 * SaralVidhya Production API Client
 * ===================================
 * Single source of truth for all backend communication.
 * All fetch calls go through here — never call fetch() directly in components.
 *
 * Backend: https://saralvidhya-api-193782571555.asia-south1.run.app
 *
 * Canonical GCS schema (mirrored by API routes):
 *   chapter/metadata.json
 *   chapter/read/quick/{persona}.md          → GET /read/quick?persona=beginner
 *   chapter/read/detailed/{persona}.md       → GET /read/detailed?persona=beginner
 *   chapter/read/key_takeaways.md            → GET /read/key_takeaways
 *   chapter/read/glossary.md                 → GET /read/glossary
 *   chapter/learn/mindmap.json               → GET /learn/mindmap
 *   chapter/learn/mindmap.png                → GET /learn/mindmap.png
 *   chapter/learn/study_plan.md              → GET /learn/study_plan
 *   chapter/practice/flashcards/{persona}.json → GET /practice/flashcards?persona=beginner
 *   chapter/practice/mcq/{difficulty}.json   → GET /practice/mcq?difficulty=easy
 *   chapter/practice/msq/{difficulty}.json   → GET /practice/msq?difficulty=medium
 *   chapter/practice/mock_test.json          → GET /practice/mock_test
 *   chapter/practice/question_bank.json      → GET /practice/question_bank
 *   chapter/prepare/pre_final_exam.json      → GET /prepare/pre_final_exam
 *   chapter/prepare/certification_exam.json  → GET /prepare/certification_exam
 *   chapter/prepare/mock_test.json           → GET /prepare/mock_test
 *   chapter/podcasts/microcast_01.m4a        → URL (audio element streams directly)
 *   chapter/podcasts/microcast_01.md         → GET /podcasts/microcast_01.md
 *   chapter/podcasts/short_podcast.m4a       → URL
 *   chapter/podcasts/long_podcast.m4a        → URL
 */

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://saralvidhya-api-193782571555.asia-south1.run.app';

export type Persona   = 'beginner' | 'intermediate' | 'advanced';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ReadType  = 'quick' | 'detailed' | 'key_takeaways' | 'glossary';
export type LearnAsset = 'mindmap' | 'mindmap.png' | 'study_plan';
export type PracticeType = 'flashcards' | 'mcq' | 'msq' | 'mock_test' | 'question_bank';
export type PrepareFile = 'pre_final_exam' | 'certification_exam' | 'mock_test' | 'previous_year';

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  // Temporarily return empty token until auth is wired up.
  // When auth is ready: import { auth } from '../services/firebase'
  // and return auth.currentUser?.getIdToken() ?? ''
  return '';
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error || `API error ${res.status}`);
  }
  return res;
}

// ── Base path builder ─────────────────────────────────────────────────────────

function contentBase(university: string, subject: string, chapter: string): string {
  return `/api/content/${university}/${subject}/${chapter}`;
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function fetchChapterMetadata(
  university: string,
  subject: string,
  chapter: string,
): Promise<Record<string, unknown>> {
  const res = await apiFetch(`${contentBase(university, subject, chapter)}/metadata`);
  return res.json();
}

// ── READ section ─────────────────────────────────────────────────────────────

/**
 * Fetch quick summary or detailed notes for a persona.
 * @param type 'quick' | 'detailed'
 * @param persona 'beginner' | 'intermediate' | 'advanced'
 * @returns Markdown string
 */
export async function fetchReadContent(
  university: string,
  subject: string,
  chapter: string,
  type: 'quick' | 'detailed',
  persona: Persona,
): Promise<string> {
  const res = await apiFetch(
    `${contentBase(university, subject, chapter)}/read/${type}?persona=${persona}`,
  );
  return res.text();
}

/**
 * Fetch a shared read resource (no persona).
 * @param type 'key_takeaways' | 'glossary'
 */
export async function fetchReadShared(
  university: string,
  subject: string,
  chapter: string,
  type: 'key_takeaways' | 'glossary',
): Promise<string> {
  const res = await apiFetch(
    `${contentBase(university, subject, chapter)}/read/${type}`,
  );
  return res.text();
}

// ── LEARN section ─────────────────────────────────────────────────────────────

/**
 * Fetch learn asset. For 'mindmap' returns JSON string, for 'study_plan' returns Markdown.
 * @param asset 'mindmap' | 'study_plan'
 */
export async function fetchLearnContent(
  university: string,
  subject: string,
  chapter: string,
  asset: Exclude<LearnAsset, 'mindmap.png'>,
): Promise<string> {
  const res = await apiFetch(
    `${contentBase(university, subject, chapter)}/learn/${asset}`,
  );
  return res.text();
}

/**
 * Returns the URL for the mindmap PNG image (use in <img src>).
 */
export function getMindmapPngUrl(
  university: string,
  subject: string,
  chapter: string,
): string {
  return `${API_BASE}${contentBase(university, subject, chapter)}/learn/mindmap.png`;
}

// ── PRACTICE section ──────────────────────────────────────────────────────────

/**
 * Fetch flashcards for a specific persona.
 * Returns parsed JSON array of flashcard objects.
 */
export async function fetchFlashcards(
  university: string,
  subject: string,
  chapter: string,
  persona: Persona,
): Promise<unknown[]> {
  const res = await apiFetch(
    `${contentBase(university, subject, chapter)}/practice/flashcards?persona=${persona}`,
  );
  const data = await res.json();
  return Array.isArray(data) ? data : (data as any)?.flashcards ?? [];
}

/**
 * Fetch MCQ or MSQ questions for a difficulty level.
 * Returns parsed JSON.
 */
export async function fetchQuestions(
  university: string,
  subject: string,
  chapter: string,
  type: 'mcq' | 'msq',
  difficulty: Difficulty,
): Promise<unknown> {
  const res = await apiFetch(
    `${contentBase(university, subject, chapter)}/practice/${type}?difficulty=${difficulty}`,
  );
  return res.json();
}

/**
 * Fetch mock test or question bank (shared, no persona/difficulty).
 */
export async function fetchPracticeShared(
  university: string,
  subject: string,
  chapter: string,
  type: 'mock_test' | 'question_bank',
): Promise<unknown> {
  const res = await apiFetch(
    `${contentBase(university, subject, chapter)}/practice/${type}`,
  );
  return res.json();
}

// ── PREPARE section ───────────────────────────────────────────────────────────

/**
 * Fetch a preparation exam file.
 * @param file 'pre_final_exam' | 'certification_exam' | 'mock_test' | 'previous_year'
 */
export async function fetchPrepareContent(
  university: string,
  subject: string,
  chapter: string,
  file: PrepareFile,
): Promise<unknown> {
  const res = await apiFetch(
    `${contentBase(university, subject, chapter)}/prepare/${file}`,
  );
  return res.json();
}

// ── PODCASTS section ──────────────────────────────────────────────────────────

/**
 * Returns the streaming URL for a podcast audio file.
 * Use directly in <audio src={url}> — the browser handles byte-range streaming.
 *
 * @param file 'microcast_01.m4a' | 'microcast_02.m4a' | 'short_podcast.m4a' | 'long_podcast.m4a'
 */
export function getPodcastUrl(
  university: string,
  subject: string,
  chapter: string,
  file: string,
): string {
  return `${API_BASE}${contentBase(university, subject, chapter)}/podcasts/${file}`;
}

/**
 * Returns URLs for all microcasts in a chapter.
 * count = how many microcasts the chapter has (from metadata).
 */
export function getMicrocastUrls(
  university: string,
  subject: string,
  chapter: string,
  count: number,
): Array<{ audio: string; transcript: string; index: number }> {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    const base = `${API_BASE}${contentBase(university, subject, chapter)}/podcasts`;
    return {
      index: i + 1,
      audio:      `${base}/microcast_${n}.m4a`,
      transcript: `${base}/microcast_${n}.md`,
    };
  });
}

/**
 * Fetch a podcast transcript (.md) as text.
 * @param file e.g. 'microcast_01.md' | 'short_podcast.md' | 'long_podcast.md'
 */
export async function fetchPodcastTranscript(
  university: string,
  subject: string,
  chapter: string,
  file: string,
): Promise<string> {
  const res = await apiFetch(
    `${contentBase(university, subject, chapter)}/podcasts/${file}`,
  );
  return res.text();
}

// ── Gemini (AI Ask) ───────────────────────────────────────────────────────────

export async function askGemini(
  question: string,
  context: string,
  persona: Persona,
): Promise<{ answer: string }> {
  const res = await apiFetch('/api/gemini/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context, level: persona }),
  });
  return res.json();
}

// ── Users / Progress ──────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<Record<string, unknown>> {
  const res = await apiFetch('/api/users/profile');
  return res.json();
}

export async function saveUserProfile(profile: {
  name: string;
  university: string;
  subject: string;
  persona: Persona;
}): Promise<void> {
  await apiFetch('/api/users/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}

export async function saveProgress(data: {
  university: string;
  subject: string;
  chapter: string;
  persona: Persona;
  section: 'read' | 'learn' | 'practice' | 'prepare' | 'podcasts';
  tool: string;
  completed: boolean;
}): Promise<void> {
  await apiFetch('/api/users/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ── Assessment ────────────────────────────────────────────────────────────────

export async function submitAssessment(data: {
  university: string;
  subject: string;
  chapter: string;
  persona: Persona;
  section: 'practice' | 'prepare';
  tool: PracticeType;
  difficulty?: Difficulty;
  score: number;
  total: number;
  answers: unknown[];
}): Promise<{ saved: boolean; score: number }> {
  const res = await apiFetch('/api/assessment/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps UI-level strings to canonical persona values.
 * Use this to normalise whatever the MVP stored in user state.
 */
export function toPersona(level: string): Persona {
  const map: Record<string, Persona> = {
    beginner: 'beginner', easy: 'beginner', starter: 'beginner',
    intermediate: 'intermediate', medium: 'intermediate',
    advanced: 'advanced', hard: 'advanced', expert: 'advanced',
  };
  return map[level?.toLowerCase()] ?? 'intermediate';
}

/**
 * Maps UI-level strings to canonical difficulty values.
 */
export function toDifficulty(level: string): Difficulty {
  const map: Record<string, Difficulty> = {
    easy: 'easy', beginner: 'easy', simple: 'easy',
    medium: 'medium', intermediate: 'medium',
    hard: 'hard', advanced: 'hard', difficult: 'hard',
  };
  return map[level?.toLowerCase()] ?? 'medium';
}
