import universityConfig from '@/config/university_config.json';

export const BASE = '/generated_resources';
export const CLOUD_API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  'https://saralvidhya-api-193782571555.asia-south1.run.app';
export const MOOCS_TENANT_ID =
  (import.meta as any).env?.VITE_TENANT_ID || 'anu';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/assets`
  : 'http://localhost:8000/api/v1/assets';

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
  description?: string;
  objectives?: string[];
  outcome?: string;
  previewVideoUrl?: string;
  videos?: ChapterVideo[];
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
let cachedCoursesJson: Record<string, CourseMeta> | null = null;
let cachedFileIndexSet: Set<string> | null = null;
let cloudHydrationPromise: Promise<void> | null = null;

// ── High-Speed In-Memory Text & JSON Fetch Cache ──────────────────────────
const textFetchCache = new Map<string, Promise<string | null>>();

export function fetchCachedText(url: string): Promise<string | null> {
  const existing = textFetchCache.get(url);
  if (existing) return existing;

  const p = (async () => {
    try {
      const res = await fetch(url, { cache: 'default' });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) return null;
      return await res.text();
    } catch {
      return null;
    }
  })();

  textFetchCache.set(url, p);
  return p;
}

/**
 * Normalizes a URL like `/generated_resources/Nagarjuna_University/...` into
 * the relative path key stored in `fileIndex` (`Nagarjuna_University/...`).
 */
function toIndexRelPath(url: string): string {
  const clean = url.split('?')[0];
  const prefix = `${BASE}/`;
  const idx = clean.indexOf(prefix);
  const rel = idx >= 0 ? clean.slice(idx + prefix.length) : clean.replace(/^\/+/, '');
  try {
    return decodeURIComponent(rel);
  } catch {
    return rel;
  }
}

/**
 * Filters a list of candidate URLs down to ONLY the URLs that exist in the
 * DB-driven `fileIndex` (O(1) lookup, eliminating waterfall 404 requests).
 * Falls back to the full list if the index hasn't loaded or has no match.
 */
export function filterIndexedCandidates(urls: string[]): string[] {
  if (!cachedFileIndexSet || cachedFileIndexSet.size === 0) return urls;
  const matched = urls.filter((u) => cachedFileIndexSet!.has(toIndexRelPath(u)));
  return matched.length > 0 ? matched : [];
}

const HIDDEN_SUBJECT_IDS = new Set<string>(['anu_characterization']);

const SUBJECT_DISPLAY_ORDER: Record<string, number> = {
  mp_ob: 1,
  management: 2,
  anu_physics: 3,
};

export function getSubjectDisplayOrder(subjectId: string): number {
  return SUBJECT_DISPLAY_ORDER[subjectId] ?? Number.MAX_SAFE_INTEGER;
}

function sanitizeCatalog(cat: Catalog): Catalog {
  return {
    ...cat,
    boards: (cat.boards || []).map((b) => ({
      ...b,
      classes: (b.classes || [])
        .map((kl) => ({
          ...kl,
          subjects: (kl.subjects || [])
            .filter((s) => !HIDDEN_SUBJECT_IDS.has(s.id))
            .sort((a, b) => getSubjectDisplayOrder(a.id) - getSubjectDisplayOrder(b.id)),
        }))
        .filter((kl) => kl.subjects.length > 0),
    })),
  };
}

function sanitizeManifest(m: Manifest): Manifest {
  return {
    ...m,
    subjects: (m.subjects || []).filter((s) => !HIDDEN_SUBJECT_IDS.has(s.id)),
  };
}

function sanitizeCoursesMeta(metas: Record<string, CourseMeta>): Record<string, CourseMeta> {
  const next: Record<string, CourseMeta> = {};
  for (const [k, v] of Object.entries(metas || {})) {
    if (!HIDDEN_SUBJECT_IDS.has(k)) next[k] = v;
  }
  return next;
}

function mergeCourseMetaWithSeed(
  dbMeta: CourseMeta | undefined,
  seedMeta: CourseMeta | undefined,
): CourseMeta {
  if (!dbMeta) return { ...(seedMeta || {}) };
  if (!seedMeta) return { ...dbMeta };
  const hasV2DbFields = Boolean(
    dbMeta.code ||
      dbMeta.regulation ||
      dbMeta.semester ||
      dbMeta.structureCode ||
      dbMeta.evaluation ||
      typeof dbMeta.hoursPerWeek === 'number',
  );
  const seedHasV2Fields = Boolean(
    seedMeta.code ||
      seedMeta.regulation ||
      seedMeta.semester ||
      seedMeta.structureCode ||
      seedMeta.evaluation ||
      typeof seedMeta.hoursPerWeek === 'number',
  );
  const merged: CourseMeta = {
    ...seedMeta,
    ...dbMeta,
    instructor:
      dbMeta.instructor?.name
        ? dbMeta.instructor
        : seedMeta.instructor,
    tags: dbMeta.tags && dbMeta.tags.length > 0 ? dbMeta.tags : seedMeta.tags,
    aliases: dbMeta.aliases && dbMeta.aliases.length > 0 ? dbMeta.aliases : seedMeta.aliases,
    units: {
      ...(seedMeta.units || {}),
      ...(dbMeta.units || {}),
    },
  };
  // Before Firestore is backfilled with v2 academic metadata, adopt seed v2 credits/order
  if (!hasV2DbFields && seedHasV2Fields) {
    if (typeof seedMeta.credits === 'number') merged.credits = seedMeta.credits;
    if (typeof seedMeta.order === 'number') merged.order = seedMeta.order;
  }
  return merged;
}

function buildPortalFromDbCatalog(
  dbCatalog: any,
  fallbackManifest: Manifest | null,
  seedCourses: Record<string, CourseMeta>,
): {
  catalog: Catalog;
  manifest: Manifest;
  courses: Record<string, CourseMeta>;
} | null {
  const rawSubjects: any[] = Array.isArray(dbCatalog?.subjects) ? dbCatalog.subjects : [];
  const activeSubjects = rawSubjects.filter(
    (s) => s && s.id && s.status !== 'archived' && !HIDDEN_SUBJECT_IDS.has(s.id),
  );
  if (activeSubjects.length === 0) return null;

  const boardMap = new Map<string, CatalogBoard>();
  const manifestSubjects: Subject[] = [];
  const coursesMap: Record<string, CourseMeta> = {};

  const sortedSubjects = [...activeSubjects].sort((a, b) => {
    const seedA = seedCourses[a.id];
    const seedB = seedCourses[b.id];
    const aHasV2 = Boolean(a.code || a.evaluation || a.semester);
    const bHasV2 = Boolean(b.code || b.evaluation || b.semester);
    const ordA =
      (aHasV2 ? a.order : seedA?.order ?? a.order) ?? getSubjectDisplayOrder(a.id);
    const ordB =
      (bHasV2 ? b.order : seedB?.order ?? b.order) ?? getSubjectDisplayOrder(b.id);
    return ordA - ordB;
  });

  for (const s of sortedSubjects) {
    const sid = String(s.id);
    const seedMeta = seedCourses[sid];
    const fallbackSub = fallbackManifest?.subjects?.find((fs) => fs.id === sid);
    const boardId = s.boardId || fallbackSub?.boardId || 'anu_university';
    const boardName = s.boardName || fallbackSub?.boardName || 'Acharya Nagarjuna University';
    const boardShortName = s.boardShortName || 'ANU';
    const classId = s.programId || s.classId || fallbackSub?.classId || 'general';
    const className = s.programName || s.className || fallbackSub?.className || s.programLabel || 'Courses';
    const subPath = s.path || fallbackSub?.path || sid;

    let board = boardMap.get(boardId);
    if (!board) {
      board = {
        id: boardId,
        name: boardName,
        shortName: boardShortName,
        logo: dbCatalog?.branding?.logoUrl || '/logo-anu.webp',
        classes: [],
      };
      boardMap.set(boardId, board);
    }
    let klass = board.classes.find((c) => c.id === classId);
    if (!klass) {
      klass = { id: classId, name: className, subjects: [] };
      board.classes.push(klass);
    }

    const dbChapters: any[] = Array.isArray(s.chapters) ? s.chapters : [];
    const mergedChapters: Chapter[] = (dbChapters.length > 0 ? dbChapters : fallbackSub?.chapters || []).map(
      (ch: any) => {
        const chNum = Number(ch.number || 0);
        const fbCh = fallbackSub?.chapters?.find((c) => c.number === chNum);
        const seedUnit = seedMeta?.units?.[String(chNum)];
        const completed =
          Array.isArray(ch.completed) && ch.completed.length > 0
            ? ch.completed
            : fbCh?.completed || [];
        const resourceCount =
          typeof ch.resourceCount === 'number' && ch.resourceCount > 0
            ? ch.resourceCount
            : fbCh?.resourceCount ?? completed.length;
        return {
          number: chNum,
          name: ch.shortTitle || ch.name || fbCh?.name || ch.title || `Unit ${chNum}`,
          title: ch.title || seedUnit?.title || fbCh?.title || ch.name || `Unit ${chNum}`,
          description: ch.description || seedUnit?.description,
          objectives:
            Array.isArray(ch.objectives) && ch.objectives.length > 0
              ? ch.objectives
              : seedUnit?.objectives,
          outcome: ch.outcome || seedUnit?.outcome,
          previewVideoUrl: ch.previewVideoUrl || seedUnit?.previewVideoUrl,
          videos:
            Array.isArray(ch.videos) && ch.videos.length > 0
              ? ch.videos
              : seedUnit?.videos,
          dir: ch.dir || fbCh?.dir,
          completed,
          resourceCount,
        };
      },
    );

    klass.subjects.push({
      id: sid,
      name: s.name || fallbackSub?.name || sid,
      path: subPath,
      chapterNumbers: mergedChapters.map((c) => c.number),
    });

    manifestSubjects.push({
      id: sid,
      name: s.name || fallbackSub?.name || sid,
      path: subPath,
      boardId,
      boardName,
      classId,
      className,
      chapters: mergedChapters,
    });

    const rawFac = s.faculty || s.instructor;
    const dbCourseMeta: CourseMeta = {
      officialTitle: s.officialTitle,
      code: s.code,
      regulation: s.regulation,
      semester: s.semester,
      structureCode: s.structureCode,
      structureLabel: s.structureLabel,
      subtitle: s.subtitle,
      description: s.description,
      discipline: s.discipline,
      level: s.level,
      instructor: rawFac?.name
        ? {
            name: rawFac.name,
            title: rawFac.title || '',
            department: rawFac.department,
            avatar: rawFac.avatarUrl || rawFac.avatar,
          }
        : undefined,
      durationHours: typeof s.durationHours === 'number' ? s.durationHours : undefined,
      hoursPerWeek: typeof s.hoursPerWeek === 'number' ? s.hoursPerWeek : undefined,
      credits: typeof s.credits === 'number' ? s.credits : undefined,
      evaluation: s.evaluation,
      language: s.language,
      courseOutcomes: Array.isArray(s.courseOutcomes) ? s.courseOutcomes : undefined,
      prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites : undefined,
      textbooks: Array.isArray(s.textbooks) ? s.textbooks : undefined,
      thumbnail: s.assets?.thumbnailUrl || s.thumbnail || s.bannerUrl || s.iconUrl,
      accent: s.cardStyle?.gradient || s.accent,
      tags: Array.isArray(s.tags) ? s.tags : undefined,
      aliases: Array.isArray(s.aliases) ? s.aliases : undefined,
      enrolled: typeof s.enrolled === 'number' ? s.enrolled : undefined,
      featured: typeof s.featured === 'boolean' ? s.featured : undefined,
      order: typeof s.order === 'number' ? s.order : undefined,
    };

    coursesMap[sid] = mergeCourseMetaWithSeed(dbCourseMeta, seedMeta);
  }

  return {
    catalog: sanitizeCatalog({ version: 2, boards: Array.from(boardMap.values()) }),
    manifest: sanitizeManifest({
      subjects: manifestSubjects,
      resourceTabs: fallbackManifest?.resourceTabs || DEFAULT_RESOURCE_TABS,
    }),
    courses: sanitizeCoursesMeta(coursesMap),
  };
}

export function clearMoocsCatalogCache(): void {
  cachedCatalog = null;
  cachedManifest = null;
  cachedCoursesJson = null;
  cloudHydrationPromise = null;
  try {
    sessionStorage.removeItem('sv_moocs_cloud_portal_v2');
    sessionStorage.removeItem('sv_medha_cloud_portal_v2');
    sessionStorage.removeItem('sv_medha_cloud_portal_v1');
  } catch {
    // ignore
  }
}

/**
 * Hydrates `catalog`, `manifest`, `courses`, and `fileIndex` from the
 * normalized Firestore-backed Cloud Run catalog endpoint (`/v2/t/:tenant/catalog`),
 * falling back cleanly to `/v2/t/:tenant` and local generated resources when offline.
 */
export function hydrateMoocsCloudConfig(): Promise<void> {
  if (cloudHydrationPromise) return cloudHydrationPromise;

  cloudHydrationPromise = (async () => {
    // 1. Try instant hydration from sessionStorage cache first
    try {
      const cachedRaw = sessionStorage.getItem('sv_moocs_cloud_portal_v2');
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (parsed.catalog?.boards?.length) cachedCatalog = sanitizeCatalog(parsed.catalog);
        if (parsed.manifest?.subjects?.length) cachedManifest = sanitizeManifest(parsed.manifest);
        if (parsed.courses) cachedCoursesJson = sanitizeCoursesMeta(parsed.courses);
        if (Array.isArray(parsed.fileIndex) && parsed.fileIndex.length > 0) {
          cachedFileIndexSet = new Set<string>(parsed.fileIndex);
        }
      }
    } catch {
      // ignore storage parse error
    }

    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('sv_moocs_token') || localStorage.getItem('sv_medha_token')
        : null;
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    // 2. Load local index/seed + Cloud Run `/v2/t/:tenant/catalog` & `/v2/t/:tenant` in parallel
    const localIndexPromise = fetch(`${BASE}/file-index.json`, { cache: 'default' })
      .then((r) => (r.ok ? r.json() : null))
      .then((idxData) => {
        if (Array.isArray(idxData?.files)) {
          if (!cachedFileIndexSet) {
            cachedFileIndexSet = new Set<string>(idxData.files);
          } else {
            for (const f of idxData.files) cachedFileIndexSet.add(f);
          }
        }
      })
      .catch(() => {});

    const localSeedCoursesPromise: Promise<Record<string, CourseMeta>> = fetch(
      `${BASE}/courses.json`,
      { cache: 'no-cache' },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => sanitizeCoursesMeta((d?.courses || {}) as Record<string, CourseMeta>))
      .catch(() => ({}));

    const localManifestPromise: Promise<Manifest | null> = fetch(`${BASE}/manifest.json`, {
      cache: 'default',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.subjects ? sanitizeManifest(d as Manifest) : null))
      .catch(() => null);

    const dbCatalogPromise = fetch(`${CLOUD_API_BASE}/v2/t/${MOOCS_TENANT_ID}/catalog`, {
      cache: 'default',
      credentials: 'include',
      headers: authHeaders,
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const tenantPortalPromise = fetch(`${CLOUD_API_BASE}/v2/t/${MOOCS_TENANT_ID}`, {
      cache: 'default',
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const [, seedCourses, localManifest, dbCatalog, tenantPayload] = await Promise.all([
      localIndexPromise,
      localSeedCoursesPromise,
      localManifestPromise,
      dbCatalogPromise,
      tenantPortalPromise,
    ]);

    const portal = tenantPayload?.tenant?.uiCopy?.moocsPortal || tenantPayload?.tenant?.uiCopy?.medhaPortal;
    if (Array.isArray(portal?.fileIndex)) {
      if (!cachedFileIndexSet) {
        cachedFileIndexSet = new Set<string>(portal.fileIndex);
      } else {
        for (const f of portal.fileIndex) cachedFileIndexSet.add(f);
      }
    }

    let portalManifest: Manifest | null = localManifest;
    if (portal?.manifest?.subjects?.length) {
      const rawTabs = portal.manifest.resourceTabs || DEFAULT_RESOURCE_TABS;
      const normalizedTabs: [string, string][] = rawTabs.map((t: any) =>
        Array.isArray(t) ? [t[0], t[1]] : [t.file, t.label],
      );
      portalManifest = sanitizeManifest({
        ...portal.manifest,
        resourceTabs: normalizedTabs,
      } as Manifest);
    }

    const fromDb = buildPortalFromDbCatalog(dbCatalog, portalManifest, seedCourses);
    if (fromDb) {
      cachedCatalog = fromDb.catalog;
      cachedManifest = fromDb.manifest;
      cachedCoursesJson = fromDb.courses;
    } else if (portal) {
      if (portal.catalog?.boards?.length) {
        cachedCatalog = sanitizeCatalog(portal.catalog as Catalog);
      }
      if (portalManifest) {
        cachedManifest = portalManifest;
      }
      const portalCourses = sanitizeCoursesMeta(
        (portal.courses || {}) as Record<string, CourseMeta>,
      );
      const mergedCourses: Record<string, CourseMeta> = {};
      const allIds = new Set([...Object.keys(seedCourses), ...Object.keys(portalCourses)]);
      for (const id of allIds) {
        mergedCourses[id] = mergeCourseMetaWithSeed(portalCourses[id], seedCourses[id]);
      }
      cachedCoursesJson = mergedCourses;
    } else if (Object.keys(seedCourses).length > 0) {
      cachedCoursesJson = seedCourses;
      if (localManifest) cachedManifest = localManifest;
    }

    if (cachedCatalog || cachedManifest || cachedCoursesJson) {
      try {
        sessionStorage.setItem(
          'sv_moocs_cloud_portal_v2',
          JSON.stringify({
            catalog: cachedCatalog,
            manifest: cachedManifest,
            courses: cachedCoursesJson,
            fileIndex: portal?.fileIndex || [],
          }),
        );
      } catch {
        // ignore quota errors
      }
    }
  })();

  return cloudHydrationPromise;
}

export async function getCatalog(): Promise<Catalog> {
  if (cachedCatalog) return cachedCatalog;
  await hydrateMoocsCloudConfig();
  if (cachedCatalog) return cachedCatalog;
  try {
    const res = await fetch(`${BASE}/catalog.json`, { cache: 'default' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) {
      return { version: 1, boards: [] };
    }
    const data = (await res.json()) as Catalog;
    cachedCatalog = sanitizeCatalog(data);
    return cachedCatalog;
  } catch {
    return { version: 1, boards: [] };
  }
}

export async function getManifest(): Promise<Manifest> {
  if (cachedManifest) return cachedManifest;
  await hydrateMoocsCloudConfig();
  if (cachedManifest) return cachedManifest;
  try {
    const res = await fetch(`${BASE}/manifest.json`, { cache: 'default' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) {
      return { subjects: [], resourceTabs: DEFAULT_RESOURCE_TABS };
    }
    const data = (await res.json()) as Manifest;
    cachedManifest = sanitizeManifest(data);
    return cachedManifest;
  } catch {
    return { subjects: [], resourceTabs: DEFAULT_RESOURCE_TABS };
  }
}

export function resolveSubjectId(id: string): string {
  if (!id) return '';
  const lower = id.toLowerCase();
  if (cachedCoursesJson) {
    if (cachedCoursesJson[id]) return id;
    for (const [subId, meta] of Object.entries(cachedCoursesJson)) {
      if (subId.toLowerCase() === lower) return subId;
      if (meta.code && meta.code.toLowerCase() === lower) return subId;
      if (meta.aliases?.some((a) => a.toLowerCase() === lower)) return subId;
    }
  }
  const fallbackAliases: Record<string, string> = {
    physics: 'anu_physics',
    mba: 'management',
    msc: 'anu_physics',
    mpob: 'mp_ob',
  };
  return fallbackAliases[lower] || id;
}

export function getChapters(manifest: Manifest, subjectId: string): Chapter[] {
  const targetId = resolveSubjectId(subjectId);
  const subject = manifest.subjects.find((s) => s.id === targetId || s.id === subjectId);
  if (!subject?.chapters) return [];
  const unitMetaMap = cachedCoursesJson?.[subject.id]?.units || {};
  // Deduplicate by chapter number, prioritizing entries with resources
  const map = new Map<number, Chapter>();
  for (const ch of subject.chapters) {
    const existing = map.get(ch.number);
    if (!existing || ((ch.resourceCount ?? 0) > (existing.resourceCount ?? 0))) {
      const uMeta = unitMetaMap[String(ch.number)];
      map.set(ch.number, {
        ...ch,
        title: ch.title || uMeta?.title || ch.name,
        description: ch.description || uMeta?.description,
        objectives: ch.objectives && ch.objectives.length > 0 ? ch.objectives : uMeta?.objectives,
        outcome: ch.outcome || uMeta?.outcome,
        previewVideoUrl: ch.previewVideoUrl || uMeta?.previewVideoUrl,
        videos: ch.videos && ch.videos.length > 0 ? ch.videos : uMeta?.videos,
      });
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

export interface VideoTimestampSegment {
  title: string;
  startSec: number;
  endSec?: number;
}

export interface VideoClipItem {
  id?: string;
  title: string;
  ytId: string;
  duration?: string;
  durationSec?: number;
  thumbnailUrl?: string;
  actLabel?: string;
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
  thumbnailUrl?: string;
  timestamps?: VideoTimestampSegment[];
  clips?: VideoClipItem[];
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

  // Fast O(1) index check before hitting the network
  const candidates = filterIndexedCandidates([url]);
  if (cachedFileIndexSet && cachedFileIndexSet.size > 0 && candidates.length === 0) {
    chapterVideosCache[key] = [];
    return [];
  }

  let videos: ChapterVideo[] = [];
  try {
    const text = await fetchCachedText(url);
    if (text) {
      const parsed = JSON.parse(text);
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

export interface CourseEvaluationScheme {
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  internalLabel?: string;
  externalLabel?: string;
}

export interface UnitSyllabusMeta {
  title?: string;
  description?: string;
  objectives?: string[];
  outcome?: string;
  previewVideoUrl?: string;
  videos?: ChapterVideo[];
}

export interface CourseMeta {
  officialTitle?: string;
  code?: string;
  regulation?: string;
  semester?: string;
  structureCode?: string;
  structureLabel?: string;
  subtitle?: string;
  description?: string;
  discipline?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  instructor?: {
    name: string;
    title: string;
    department?: string;
    avatar?: string;
  };
  durationHours?: number;
  hoursPerWeek?: number;
  credits?: number;
  evaluation?: CourseEvaluationScheme;
  language?: string;
  courseOutcomes?: string[];
  prerequisites?: string[];
  textbooks?: string[];
  thumbnail?: string;
  accent?: string;
  tags?: string[];
  aliases?: string[];
  enrolled?: number;
  featured?: boolean;
  order?: number;
  units?: Record<string, UnitSyllabusMeta>;
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

async function getCoursesMeta(): Promise<Record<string, CourseMeta>> {
  if (cachedCoursesJson) return cachedCoursesJson;
  await hydrateMoocsCloudConfig();
  if (cachedCoursesJson) return cachedCoursesJson;
  try {
    const res = await fetch(`${BASE}/courses.json`, { cache: 'default' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) return {};
    const data = await res.json();
    cachedCoursesJson = sanitizeCoursesMeta(data.courses || {});
    return cachedCoursesJson || {};
  } catch {
    return {};
  }
}

export async function getCourses(): Promise<Course[]> {
  await hydrateMoocsCloudConfig();
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
        if (HIDDEN_SUBJECT_IDS.has(subject.id)) continue;
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
          accent: 'linear-gradient(135deg, #546C60, #3E584B)',
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

  courses.sort(
    (a, b) =>
      (a.meta.order ?? getSubjectDisplayOrder(a.id)) -
      (b.meta.order ?? getSubjectDisplayOrder(b.id)),
  );

  return courses;
}

export async function getCourseById(id: string): Promise<Course | null> {
  const courses = await getCourses();
  const found = courses.find((c) => c.id === id);
  if (found) return found;

  const lower = (id || '').toLowerCase();
  const byAliasOrCode = courses.find(
    (c) =>
      c.id.toLowerCase() === lower ||
      c.meta.code?.toLowerCase() === lower ||
      c.meta.aliases?.some((a) => a.toLowerCase() === lower),
  );
  return byAliasOrCode || null;
}
