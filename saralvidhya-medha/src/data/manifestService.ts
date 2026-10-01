import universityConfig from '@/config/university_config.json';

export const BASE = '/generated_resources';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/assets` : 'http://localhost:8000/api/v1/assets';

/**
 * Subjects whose live study content is served by the FastAPI backend
 * (Supabase-backed).
 */
export const BACKEND_SUBJECTS = new Set<string>();

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

/** Maps the app's difficulty levels to the backend persona query values. */
export const LEVEL_TO_PERSONA: Record<DifficultyLevel, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const SESSION_KEY = 'sv_visible_boards';

export function getVisibleBoardIds(): string[] {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      // ignore
    }
  }
  return universityConfig.defaultVisibleBoards || [];
}

const DEFAULT_SUBJECT_PATHS: Record<string, string> = {
  neb_xii_biology: 'neb_nepal/class_12/biology',
};

/** Files that are NOT level-specific — same content for all difficulty levels. */
export const SHARED_RESOURCE_FILES = new Set([
  'learning_path.md',
  'podcast_script.md',
  'youtube_links.md',
  'course_offerings.md',
  'mindmap.md',       // lives at chapter root only
  'detailed_view.md', // lives at chapter root only
]);

/** Files whose content differs per difficulty level. */
export const LEVELED_RESOURCE_FILES = new Set([
  'summary.md',
  'study_guide.md',
  'question_bank.md',
  'flashcards',  // special key — loaded from flashcards.json in the level subfolder
]);

export interface Chapter {
  number: number;
  name: string;
  title?: string;
  dir?: string;
  completed?: string[];
  resourceCount?: number;
}

export interface Subject {
  id: string;
  name: string;
  path?: string;
  boardId?: string;
  boardName?: string;
  classId?: string;
  className?: string;
  chapters: Chapter[];
}

export interface Manifest {
  subjects: Subject[];
  resourceTabs: [string, string][];
}

export interface CatalogSubject {
  id: string;
  name: string;
  path: string;
  chapterNumbers?: number[];
}

export interface CatalogClass {
  id: string;
  name: string;
  subjects: CatalogSubject[];
}

export interface CatalogBoard {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  classes: CatalogClass[];
}

export interface Catalog {
  version: number;
  boards: CatalogBoard[];
}

/** Display tabs — leveled tabs first, then shared. */
export const DEFAULT_RESOURCE_TABS: [string, string][] = [
  ['summary.md', 'Quick Study'],
  ['study_guide.md', 'Study Guide'],
  ['deep_dive', 'Deep Dive'],
  ['question_bank.md', 'Question Bank'],
  ['flashcards', 'Flashcards'],
  ['mindmap.md', 'Mindmap'],
  ['learning_path.md', 'Learning Path'],
  ['detailed_view.md', 'Detailed Notes'],
  ['podcast_script.md', 'Podcast Script'],
  ['youtube_links.md', 'YouTube Links'],
  ['course_offerings.md', 'Course Info'],
];

let cachedManifest: Manifest | null = null;
let cachedCatalog: Catalog | null = null;

export async function getCatalog(): Promise<Catalog> {
  if (cachedCatalog) return cachedCatalog;
  const res = await fetch(`${BASE}/catalog.json`, { cache: 'no-cache' });
  if (!res.ok) {
    return { version: 1, boards: [] };
  }
  const data = (await res.json()) as Catalog;
  cachedCatalog = data;
  return data;
}

export async function getManifest(): Promise<Manifest> {
  if (cachedManifest) return cachedManifest;
  const res = await fetch(`${BASE}/manifest.json`, { cache: 'no-cache' });
  if (!res.ok) {
    return { subjects: [], resourceTabs: DEFAULT_RESOURCE_TABS };
  }
  const data = (await res.json()) as Manifest;
  cachedManifest = data;
  return data;
}

export function resolveSubjectId(id: string): string {
  if (!id) return '';
  const lower = id.toLowerCase();
  const aliases: Record<string, string> = {
    physics: 'anu_physics',
    characterization: 'anu_characterization',
    mba: 'management',
    msc: 'anu_physics',
  };
  return aliases[lower] || id;
}

export function getChapters(manifest: Manifest, subjectId: string): Chapter[] {
  const targetId = resolveSubjectId(subjectId);
  const subject = manifest.subjects.find((s) => s.id === targetId || s.id === subjectId);
  if (!subject?.chapters) return [];
  // Deduplicate by chapter number, prioritizing entries with resources
  const map = new Map<number, Chapter>();
  for (const ch of subject.chapters) {
    const existing = map.get(ch.number);
    if (!existing || ((ch.resourceCount ?? 0) > (existing.resourceCount ?? 0))) {
      map.set(ch.number, ch);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.number - b.number);
}

export function getSubject(manifest: Manifest, subjectId: string): Subject | undefined {
  const targetId = resolveSubjectId(subjectId);
  const sub = manifest.subjects.find((s) => s.id === targetId || s.id === subjectId);
  if (!sub) return undefined;
  return {
    ...sub,
    chapters: getChapters(manifest, targetId),
  };
}

export function getSubjectResourcePath(subjectId: string): string {
  const targetId = resolveSubjectId(subjectId);
  const manifestPath = cachedManifest?.subjects.find((s) => s.id === targetId || s.id === subjectId)?.path;
  if (manifestPath) return manifestPath;

  for (const board of cachedCatalog?.boards ?? []) {
    for (const klass of board.classes) {
      const subject = klass.subjects.find((s) => s.id === targetId || s.id === subjectId);
      if (subject) return subject.path;
    }
  }

  return DEFAULT_SUBJECT_PATHS[targetId] ?? DEFAULT_SUBJECT_PATHS[subjectId] ?? targetId;
}

export function getSubjectBaseUrl(subjectId: string): string {
  return `${BASE}/${getSubjectResourcePath(subjectId)}`;
}

export interface ChapterVideo {
  index: number;
  id: string;
  title: string;
  ytId: string;
  /** Directory name under the chapter dir holding this video's assets. */
  dir: string;
  topics?: string[];
  duration?: string;
}

const chapterVideosCache: Record<string, ChapterVideo[]> = {};

export async function getChapterVideos(
  subjectId: string,
  chapterNumber: number,
): Promise<ChapterVideo[]> {
  const key = `${subjectId}_${chapterNumber}`;
  if (key in chapterVideosCache) return chapterVideosCache[key];

  if (!cachedManifest) await getManifest();
  const url = `${getSubjectBaseUrl(subjectId)}/${getChapterDir(subjectId, chapterNumber)}/videos.json`;

  let videos: ChapterVideo[] = [];
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && !ct.includes('text/html')) {
      const parsed = JSON.parse(await res.text());
      if (Array.isArray(parsed?.videos)) {
        videos = (parsed.videos as ChapterVideo[])
          .filter((v) => v && typeof v.dir === 'string' && v.dir.length > 0)
          .sort((a, b) => a.index - b.index);
      }
    }
  } catch {
    // No registry, malformed JSON, or offline — treat the chapter as unsegmented.
  }

  chapterVideosCache[key] = videos;
  return videos;
}

export function getChapterDir(subjectId: string, chapterNumber: number): string {
  const subjectChapters = cachedManifest ? getChapters(cachedManifest, subjectId) : [];
  const chapter = subjectChapters.find((c) => c.number === chapterNumber);
  return chapter?.dir ?? `chapter_${String(chapterNumber).padStart(2, '0')}`;
}

export function getResourceTabs(manifest: Manifest): [string, string][] {
  const isMooc = sessionStorage.getItem('sv_moocs_mode') === 'true';
  if (isMooc) {
    return [
      ['youtube_links.md', 'YouTube Links'],
      ['podcast_script.md', 'Podcast Script'],
      ['flashcards', 'Flashcards'],
      ['summary.md', 'Quick Study'],
      ['detailed_view.md', 'Detailed Notes'],
      ['assessment.md', 'Assessment'],
      ['study_guide.md', 'Study Guide'],
      ['learning_path.md', 'Learning Path'],
      ['course_offerings.md', 'Course Info'],
    ];
  }
  return manifest.resourceTabs ?? DEFAULT_RESOURCE_TABS;
}

export interface CourseMeta {
  subtitle?: string;
  description?: string;
  discipline?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  instructor?: {
    name: string;
    title: string;
    avatar?: string;
  };
  durationHours?: number;
  credits?: number;
  language?: string;
  thumbnail?: string;
  accent?: string;
  tags?: string[];
  enrolled?: number;
  featured?: boolean;
}

export interface Course {
  id: string;
  name: string;
  path: string;
  boardId: string;
  boardName: string;
  boardShortName: string;
  classId: string;
  className: string;
  chapterCount: number;
  meta: CourseMeta;
}

let cachedCoursesJson: Record<string, CourseMeta> | null = null;

async function getCoursesMeta(): Promise<Record<string, CourseMeta>> {
  if (cachedCoursesJson) return cachedCoursesJson;
  try {
    const res = await fetch(`${BASE}/courses.json`, { cache: 'no-cache' });
    if (!res.ok) return {};
    const data = await res.json();
    cachedCoursesJson = data.courses || {};
    return cachedCoursesJson || {};
  } catch {
    return {};
  }
}

export async function getCourses(): Promise<Course[]> {
  const [catalog, manifest, metas] = await Promise.all([
    getCatalog(),
    getManifest(),
    getCoursesMeta(),
  ]);

  const courses: Course[] = [];
  const visibleIds = getVisibleBoardIds();

  for (const board of catalog.boards) {
    if (visibleIds.length > 0 && !visibleIds.includes(board.id)) {
      continue;
    }
    for (const klass of board.classes) {
      for (const subject of klass.subjects) {
        const manifestSubject = manifest.subjects.find((s) => s.id === subject.id);
        const chapterCount = manifestSubject?.chapters.length ?? subject.chapterNumbers?.length ?? 0;
        const meta = metas[subject.id];

        const defaultMeta: CourseMeta = {
          subtitle: `Learn about ${subject.name}`,
          description: `A comprehensive course on ${subject.name}.`,
          discipline: 'General',
          level: 'intermediate',
          instructor: {
            name: 'Faculty Member',
            title: 'Instructor',
          },
          durationHours: chapterCount > 0 ? chapterCount * 4 : 30,
          credits: 3,
          language: 'English',
          accent: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          tags: [],
          enrolled: 0,
          featured: false,
          ...meta,
        };

        courses.push({
          id: subject.id,
          name: subject.name,
          path: subject.path,
          boardId: board.id,
          boardName: board.name,
          boardShortName: board.shortName || board.name,
          classId: klass.id,
          className: klass.name,
          chapterCount,
          meta: defaultMeta,
        });
      }
    }
  }

  return courses;
}

export async function getCourseById(id: string): Promise<Course | null> {
  const courses = await getCourses();
  const found = courses.find((c) => c.id === id);
  if (found) return found;

  const aliases: Record<string, string> = {
    physics: 'anu_physics',
    characterization: 'anu_characterization',
    mba: 'management',
    msc: 'anu_physics',
  };
  const targetId = aliases[id?.toLowerCase()];
  if (targetId) {
    return courses.find((c) => c.id === targetId) || null;
  }
  return null;
}
