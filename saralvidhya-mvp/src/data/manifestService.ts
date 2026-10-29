import universityConfig from '@/config/university_config.json';
import { registryClient, type ChapterResponse } from './registryClient';
import { detectTenantId, getFallbackTenantId, getCloudPublicImageUrl } from '../tenant/TenantProvider';
import { cloudStorage } from '../context/CloudStateContext';
import { registerCloudGlossaryTerms } from './glossaryTerms';
export const BASE = '/generated_resources';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/assets`
  : '';

/**
 * Cloud Run backend base URL (GCS-backed canonical content).
 */
export const GCS_API_BASE =
  import.meta.env.VITE_GCS_API_BASE ||
  import.meta.env.VITE_API_BASE ||
  'https://saralvidhya-api-193782571555.asia-south1.run.app';

/**
 * Dynamically populated map of subjectId -> "{tenantId}/{subjectId}" from university_config.json and Cloud Run v2 catalog.
 * Zero hardcoded tenant or subject literals in source code.
 */
const initialCloudRoutes = ((universityConfig as any).cloudSubjectRoutes || {}) as Record<
  string,
  string
>;
export const GCS_SUBJECT_MAP: Record<string, string> = { ...initialCloudRoutes };

export const LOCAL_SUBJECT_MAP: Record<string, string> = {
  ...(((universityConfig as any).localSubjectRoutes || {}) as Record<string, string>),
};

/**
 * Subject IDs whose content is served by the GCS Cloud Run backend.
 */
export const GCS_BACKEND_SUBJECTS = new Set<string>(Object.keys(GCS_SUBJECT_MAP));

export const BACKEND_SUBJECTS = new Set<string>();

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

export const LEVEL_TO_PERSONA: Record<DifficultyLevel, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const SESSION_KEY = 'sv_visible_boards';

export function getRegistryTenantId(): string | null {
  return detectTenantId();
}

export function getVisibleBoardIds(): string[] {
  const aliases = ((universityConfig as any).boardTenantAliases || {}) as Record<string, string>;
  const regTenant = getRegistryTenantId();
  if (regTenant) {
    const mapped = aliases[regTenant];
    return mapped && mapped !== regTenant ? [regTenant, mapped] : [regTenant];
  }
  const raw = cloudStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      // ignore
    }
  }
  const envBoards = import.meta.env.VITE_VISIBLE_BOARDS;
  if (envBoards) {
    return envBoards
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return universityConfig.defaultVisibleBoards || [];
}

/** Files that are NOT level-specific — same content for all difficulty levels. */
export const SHARED_RESOURCE_FILES = new Set([
  'learning_path.md',
  'podcast_script.md',
  'youtube_links.md',
  'course_offerings.md',
  'mindmap.md',
  'detailed_view.md',
  'study_plan.md',
  'key_takeaways.md',
]);

/** Files whose content differs per difficulty level. */
export const LEVELED_RESOURCE_FILES = new Set([
  'summary.md',
  'study_guide.md',
  'question_bank.md',
  'flashcards',
]);

export interface Chapter {
  number: number;
  name: string;
  title?: string;
  shortTitle?: string;
  description?: string;
  estimatedMinutes?: number;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  mindmapImageUrl?: string;
  dir?: string;
  completed?: string[];
  resourceCount?: number;
  topics?: Array<{
    id: string;
    label: string;
    order: number;
    topicNum?: number;
    subtopics?: string[];
    estimatedMinutes?: number;
  }>;
  videos?: Array<{
    id: string;
    title: string;
    provider?: 'youtube' | 'gcs' | 'external';
    videoId?: string;
    gcsPath?: string;
    url?: string;
    videoUrl?: string;
    thumbnail?: string;
    thumbnailUrl?: string;
    duration?: string;
    durationSeconds?: number;
    topics?: string[];
    order?: number;
  }>;
  tools?: Record<string, any>;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  subtitle?: string;
  programLabel?: string;
  description?: string;
  credits?: number;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  cardStyle?: {
    accentColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
    badgeText?: string;
  };
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
  code?: string;
  subtitle?: string;
  programLabel?: string;
  description?: string;
  credits?: number;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  cardStyle?: {
    accentColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
    badgeText?: string;
  };
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
  academicTerm?: string;
  logo?: string;
  logoUrl?: string;
  classes: CatalogClass[];
}

export interface Catalog {
  version: number;
  boards: CatalogBoard[];
}

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

// ── Registry overlay (multi-tenant, published via sv-publish) ───────────
interface RegistryOverlay {
  board: CatalogBoard;
  subjects: Subject[];
}
const registryOverlays: Record<string, RegistryOverlay> = {};
const overlayPromises: Record<string, Promise<RegistryOverlay | null>> = {};
const chapterDataCache: Record<string, Promise<ChapterResponse | null>> = {};

function buildOverlay(
  tenantId: string,
  data: Awaited<ReturnType<typeof registryClient.getCatalog>>
): RegistryOverlay {
  let tenantName = tenantId;
  let shortName = tenantId;
  let academicTerm: string | undefined;
  let logoUrl: string | undefined;
  let defaultProgramLabel: string | undefined;
  try {
    const cfg = JSON.parse(cloudStorage.getItem(`tenant_cfg_${tenantId}`) || '{}');
    tenantName = cfg.name || tenantId;
    shortName = cfg.shortName || tenantName;
    academicTerm = cfg.academicTerm;
    logoUrl = cfg.logoUrl || cfg.branding?.logoUrl || cfg.assets?.logoUrl;
    defaultProgramLabel = cfg.branding?.programLabel;
  } catch {
    // ignore
  }

  const nodeName = new Map<string, string>(
    data.nodes.map((n: any) => [n.id, n.name || n.label || n.id])
  );
  const classes = new Map<string, CatalogClass>();
  const subjects: Subject[] = [];

  for (const s of data.subjects as any[]) {
    const path = `${tenantId}/${s.id}`;
    GCS_SUBJECT_MAP[s.id] = path;
    GCS_BACKEND_SUBJECTS.add(s.id);
    if (s.code) {
      const codeSlug = String(s.code).toLowerCase().replace(/[^a-z0-9]+/g, '_');
      GCS_SUBJECT_MAP[codeSlug] = path;
      GCS_BACKEND_SUBJECTS.add(codeSlug);
    }

    const classId = s.parentNodeId || 'courses';
    const className =
      (s.parentNodeId && nodeName.get(s.parentNodeId)) ||
      s.programLabel ||
      s.subtitle ||
      defaultProgramLabel ||
      'Courses';
    if (!classes.has(classId)) {
      classes.set(classId, { id: classId, name: className, subjects: [] });
    }

    const resolveRawDbUrl = (raw?: string, chId?: string): string | undefined => {
      if (!raw || typeof raw !== 'string') return undefined;
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:')
      ) {
        return trimmed;
      }
      if (trimmed.startsWith('/api/')) {
        return `${GCS_API_BASE}${trimmed}`;
      }
      if (trimmed.startsWith('gs://')) {
        const withoutGs = trimmed.replace(/^gs:\/\/[^\/]+\//, '');
        return `${GCS_API_BASE}/api/content/${withoutGs}`;
      }
      if (trimmed.startsWith(`${tenantId}/`)) {
        return `${GCS_API_BASE}/api/content/${trimmed}`;
      }
      if (trimmed.includes('/') && !trimmed.startsWith('/')) {
        return chId
          ? `${GCS_API_BASE}/api/content/${path}/${chId}/${trimmed}`
          : `${GCS_API_BASE}/api/content/${path}/${trimmed}`;
      }
      return trimmed;
    };

    const chapters: Chapter[] = ((s.chapters || []) as any[])
      .filter((c) => typeof c.number === 'number' && c.number > 0)
      .map((c) => ({
      number: c.number,
      name: c.title,
      title: c.title,
      shortTitle: c.shortTitle,
      description: c.description,
      estimatedMinutes: c.estimatedMinutes,
      heroImageUrl: resolveRawDbUrl(
        c.heroImageUrl ||
          c.assets?.heroImageUrl ||
          c.assets?.heroImage ||
          c.thumbnailUrl ||
          c.assets?.thumbnailUrl ||
          c.assets?.thumbnail,
        c.id
      ),
      thumbnailUrl: resolveRawDbUrl(
        c.thumbnailUrl || c.assets?.thumbnailUrl || c.assets?.thumbnail,
        c.id
      ),
      mindmapImageUrl: resolveRawDbUrl(
        c.mindmapImageUrl || c.assets?.mindmapImageUrl || c.assets?.mindmapImage,
        c.id
      ),
      dir: c.id,
      completed: c.tools ? Object.keys(c.tools) : [],
      resourceCount: c.tools ? Object.keys(c.tools).length : 7,
      topics: c.topics,
      videos: c.videos,
      tools: c.tools,
    }));

    const resolvedIconUrl = resolveRawDbUrl(
      s.iconUrl ||
        s.assets?.iconUrl ||
        s.assets?.icon ||
        s.iconBlob ||
        s.thumbnailUrl ||
        s.assets?.thumbnailUrl ||
        s.assets?.thumbnail ||
        s.bannerUrl ||
        s.assets?.bannerUrl ||
        s.assets?.banner
    );
    const resolvedBannerUrl = resolveRawDbUrl(
      s.bannerUrl || s.assets?.bannerUrl || s.assets?.banner
    );
    const resolvedThumbUrl = resolveRawDbUrl(
      s.thumbnailUrl || s.assets?.thumbnailUrl || s.assets?.thumbnail
    );

    classes.get(classId)!.subjects.push({
      id: s.id,
      name: s.name,
      code: s.code,
      subtitle: s.subtitle || s.programLabel || className,
      programLabel: s.programLabel || s.subtitle || className,
      description: s.description,
      credits: s.credits,
      iconUrl: resolvedIconUrl,
      bannerUrl: resolvedBannerUrl,
      thumbnailUrl: resolvedThumbUrl,
      cardStyle: s.cardStyle,
      path,
      chapterNumbers: chapters.map((c) => c.number),
    });

    subjects.push({
      id: s.id,
      name: s.name,
      code: s.code,
      subtitle: s.subtitle || s.programLabel || className,
      programLabel: s.programLabel || s.subtitle || className,
      description: s.description,
      credits: s.credits,
      iconUrl: resolvedIconUrl,
      bannerUrl: resolvedBannerUrl,
      thumbnailUrl: resolvedThumbUrl,
      cardStyle: s.cardStyle,
      path,
      boardId: tenantId,
      boardName: tenantName,
      classId,
      className,
      chapters,
    });
  }

  return {
    board: {
      id: tenantId,
      name: tenantName,
      shortName,
      academicTerm,
      logo: logoUrl,
      logoUrl,
      classes: [...classes.values()],
    },
    subjects,
  };
}

async function loadRegistryOverlay(): Promise<RegistryOverlay | null> {
  const tenantId = getRegistryTenantId();
  if (!tenantId) return null;
  if (registryOverlays[tenantId]) return registryOverlays[tenantId];
  if (!overlayPromises[tenantId]) {
    overlayPromises[tenantId] = registryClient
      .getCatalog(tenantId)
      .then((data) => {
        const overlay = buildOverlay(tenantId, data);
        registryOverlays[tenantId] = overlay;
        return overlay;
      })
      .catch((err) => {
        console.warn('[manifestService] Registry catalog unavailable:', err?.message);
        return null;
      })
      .finally(() => {
        delete overlayPromises[tenantId];
      });
  }
  return overlayPromises[tenantId];
}

const resolvedChapterDataCache: Record<string, ChapterResponse | null> = {};

/**
 * Fetches and caches the v2 ChapterResponse (with signed GCS file URLs) for a chapter.
 */
export async function getRegistryChapterData(
  subjectId: string,
  chapterNumber: number
): Promise<ChapterResponse | null> {
  const tenantId = getRegistryTenantId();
  if (!tenantId || !subjectId) return null;
  await loadRegistryOverlay();
  const normSub = resolveSubjectId(subjectId);
  const chDir = getChapterDir(normSub, chapterNumber);
  const key = `${tenantId}:${normSub}:${chDir}`;
  if (!(key in chapterDataCache)) {
    chapterDataCache[key] = registryClient
      .getChapter(tenantId, normSub, chDir)
      .then((res) => {
        resolvedChapterDataCache[key] = res;
        if (res?.chapter) {
          const chAny = res.chapter as any;
          if (chAny.definitions) registerCloudGlossaryTerms(chAny.definitions);
          if (chAny.glossary) registerCloudGlossaryTerms(chAny.glossary);
        }
        const defUrl = res?.files?.['definitions.json'] || res?.files?.['glossary.json'];
        if (defUrl) {
          fetch(defUrl)
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              if (json) {
                registerCloudGlossaryTerms(json.definitions || json.terms || json);
              }
            })
            .catch(() => {});
        }
        return res;
      })
      .catch(() => {
        resolvedChapterDataCache[key] = null;
        return null;
      });
  }
  return chapterDataCache[key];
}

/**
 * Synchronously resolves a relative asset path from the cached chapter response if loaded,
 * or triggers background chapter resolution and returns null so callers can fall back cleanly.
 */
export function resolveAssetUrl(
  subjectId: string,
  chapterNumber: number,
  relativePath: string
): string | null {
  const tenantId = getRegistryTenantId();
  if (!tenantId || !subjectId || !relativePath) return null;
  const normSub = resolveSubjectId(subjectId);
  const chDir = getChapterDir(normSub, chapterNumber);
  const key = `${tenantId}:${normSub}:${chDir}`;
  const cached = resolvedChapterDataCache[key];
  if (!cached) {
    void getRegistryChapterData(subjectId, chapterNumber);
    return null;
  }
  const cleanRel = relativePath.replace(/^\/+/, '');
  return cached.files?.[cleanRel] || null;
}

/**
 * Resolves any image/asset URL (from Registry DB, catalog.json, manifest.json, or local public fallback)
 * into a browser-loadable URL, prioritizing Google Cloud signed URLs and Cloud Run /api/content routes.
 */
export function resolveCloudImageSrc(
  rawUrl: string | undefined,
  subjectId?: string,
  chapterNumber?: number
): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/')) {
    return `${GCS_API_BASE}${trimmed}`;
  }

  if (trimmed.startsWith('gs://')) {
    const withoutGs = trimmed.replace(/^gs:\/\/[^\/]+\//, '');
    return `${GCS_API_BASE}/api/content/${withoutGs}`;
  }

  const globalPublicSigned = getCloudPublicImageUrl(trimmed);
  if (globalPublicSigned && globalPublicSigned !== trimmed && globalPublicSigned.startsWith('http')) {
    return globalPublicSigned;
  }
  if (subjectId && typeof chapterNumber === 'number') {
    const signed = resolveAssetUrl(subjectId, chapterNumber, trimmed);
    if (signed) return signed;
  }

  const base = import.meta.env.BASE_URL || '/';
  return `${base}${trimmed.replace(/^\//, '')}`;
}

/**
 * Queries the v2 Chapter Registry endpoint for a chapter's DB-driven hero/thumbnail image and metadata.
 */
export async function resolveChapterHeroFromRegistry(
  subjectId: string,
  chapterNumber: number
): Promise<{
  title?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  topics?: any[];
} | null> {
  try {
    const reg = await getRegistryChapterData(subjectId, chapterNumber);
    if (!reg) return null;
    const ch = reg.chapter;
    const files = reg.files || {};

    const candidateFileKeys = [
      'hero.png',
      'hero.jpg',
      'hero.webp',
      'cover.png',
      'cover.jpg',
      'cover.webp',
      'thumbnail.png',
      'thumbnail.jpg',
      'banner.png',
      'assets/hero.png',
      'assets/cover.png',
      'assets/thumbnail.png',
      'images/hero.png',
      'images/cover.png',
    ];
    let signedHeroFromFiles: string | undefined;
    for (const k of candidateFileKeys) {
      if (files[k]) {
        signedHeroFromFiles = files[k];
        break;
      }
    }
    if (!signedHeroFromFiles) {
      const matchedKey = Object.keys(files).find((k) =>
        /(?:^|\/)(?:hero|cover|banner|chapter_hero|thumbnail)\.(?:png|jpe?g|webp|svg)$/i.test(k)
      );
      if (matchedKey) {
        signedHeroFromFiles = files[matchedKey];
      }
    }

    const rawHero =
      ch?.heroImageUrl ||
      ch?.assets?.heroImageUrl ||
      ch?.assets?.heroImage ||
      signedHeroFromFiles ||
      ch?.thumbnailUrl ||
      ch?.assets?.thumbnailUrl ||
      ch?.assets?.thumbnail;

    const rawThumb =
      ch?.thumbnailUrl ||
      ch?.assets?.thumbnailUrl ||
      ch?.assets?.thumbnail ||
      signedHeroFromFiles;

    return {
      title: ch?.title || (ch as any)?.name,
      heroImageUrl: resolveCloudImageSrc(rawHero, subjectId, chapterNumber),
      thumbnailUrl: resolveCloudImageSrc(rawThumb, subjectId, chapterNumber),
      description: ch?.description,
      topics: ch?.topics,
    };
  } catch {
    return null;
  }
}

export async function getCatalog(): Promise<Catalog> {
  const regTenant = getRegistryTenantId();
  const overlay = await loadRegistryOverlay();

  let base: Catalog = cachedCatalog || { version: 1, boards: [] };
  if (!cachedCatalog) {
    try {
      const cloudMan = await registryClient.getCloudManifest(regTenant || getFallbackTenantId());
      if (cloudMan?.catalog?.boards) {
        base = cloudMan.catalog as Catalog;
        cachedCatalog = base;
      }
      if (cloudMan?.manifest?.subjects && !cachedManifest) {
        cachedManifest = cloudMan.manifest as Manifest;
      }
    } catch {
      try {
        const res = await fetch(`${BASE}/catalog.json`, { cache: 'no-cache' });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && !ct.includes('text/html')) {
          base = (await res.json()) as Catalog;
          cachedCatalog = base;
        }
      } catch {
        // Cloud-native mode works without local /generated_resources/catalog.json
      }
    }
  }
  // Helper to enrich an overlay board with missing subject/board metadata from base catalog.json
  const enrichOverlayBoard = (ovBoard: CatalogBoard): CatalogBoard => {
    const baseBoard = base.boards.find(
      (b) => b.id === ovBoard.id || b.id.startsWith(`${ovBoard.id}_`)
    );
    if (!baseBoard) return ovBoard;
    const baseSubjectsById = new Map<string, CatalogSubject>();
    for (const cls of baseBoard.classes) {
      for (const sub of cls.subjects) {
        baseSubjectsById.set(sub.id.toLowerCase(), sub);
        if (sub.name) {
          baseSubjectsById.set(sub.name.toLowerCase().trim(), sub);
        }
        if (sub.code) {
          baseSubjectsById.set(sub.code.toLowerCase().replace(/[^a-z0-9]+/g, '_'), sub);
        }
      }
    }
    return {
      ...ovBoard,
      logo: ovBoard.logo || baseBoard.logo,
      logoUrl: ovBoard.logoUrl || baseBoard.logoUrl,
      academicTerm: ovBoard.academicTerm || baseBoard.academicTerm,
      classes: ovBoard.classes.map((cls) => ({
        ...cls,
        subjects: cls.subjects.map((sub) => {
          const codeKey = sub.code ? sub.code.toLowerCase().replace(/[^a-z0-9]+/g, '_') : '';
          const nameKey = sub.name ? sub.name.toLowerCase().trim() : '';
          const match =
            baseSubjectsById.get(sub.id.toLowerCase()) ||
            (codeKey ? baseSubjectsById.get(codeKey) : undefined) ||
            (nameKey ? baseSubjectsById.get(nameKey) : undefined);
          if (!match) return sub;
          return {
            ...match,
            ...sub,
            iconUrl: sub.iconUrl || match.iconUrl,
            bannerUrl: sub.bannerUrl || match.bannerUrl,
            thumbnailUrl: sub.thumbnailUrl || match.thumbnailUrl,
            subtitle: sub.subtitle || match.subtitle,
            programLabel: sub.programLabel || match.programLabel,
            description: sub.description || match.description,
            cardStyle: sub.cardStyle || match.cardStyle,
          };
        }),
      })),
    };
  };

  if (regTenant) {
    if (overlay?.board) {
      return { version: 1, boards: [enrichOverlayBoard(overlay.board)] };
    }
    const matched = base.boards.filter(
      (b) => b.id === regTenant || b.id.startsWith(`${regTenant}_`)
    );
    if (matched.length > 0) {
      return { version: 1, boards: matched };
    }
  }

  if (!overlay) return base;
  const enrichedBoard = enrichOverlayBoard(overlay.board);
  return {
    ...base,
    boards: [
      ...base.boards.filter(
        (b) => b.id !== enrichedBoard.id && !b.id.startsWith(`${enrichedBoard.id}_`)
      ),
      enrichedBoard,
    ],
  };
}

export async function getManifest(): Promise<Manifest> {
  const regTenant = getRegistryTenantId();
  const overlay = await loadRegistryOverlay();

  let base: Manifest = cachedManifest || { subjects: [], resourceTabs: DEFAULT_RESOURCE_TABS };
  if (!cachedManifest) {
    try {
      const cloudMan = await registryClient.getCloudManifest(regTenant || getFallbackTenantId());
      if (cloudMan?.manifest?.subjects) {
        base = cloudMan.manifest as Manifest;
        cachedManifest = base;
      }
      if (cloudMan?.catalog?.boards && !cachedCatalog) {
        cachedCatalog = cloudMan.catalog as Catalog;
      }
    } catch {
      try {
        const res = await fetch(`${BASE}/manifest.json`, { cache: 'no-cache' });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && !ct.includes('text/html')) {
          base = (await res.json()) as Manifest;
          cachedManifest = base;
        }
      } catch {
        // Cloud-native mode works without local /generated_resources/manifest.json
      }
    }
  }
  // Enrich overlay subjects & chapters with fallback metadata from base manifest.json
  const enrichOverlaySubjects = (ovSubjects: Subject[]): Subject[] => {
    return ovSubjects.map((ovSub) => {
      const ovCode = ovSub.code ? ovSub.code.toLowerCase().replace(/[^a-z0-9]+/g, '_') : '';
      const baseSub = base.subjects.find(
        (bs) =>
          bs.id.toLowerCase() === ovSub.id.toLowerCase() ||
          (ovCode && bs.id.toLowerCase() === ovCode) ||
          (bs.code && bs.code.toLowerCase().replace(/[^a-z0-9]+/g, '_') === ovSub.id.toLowerCase())
      );
      if (!baseSub) return ovSub;

      const enrichedChapters: Chapter[] = ovSub.chapters.map((ovCh) => {
        const baseCh = baseSub.chapters.find((bc) => bc.number === ovCh.number);
        if (!baseCh) return ovCh;
        return {
          ...baseCh,
          ...ovCh,
          shortTitle: ovCh.shortTitle || baseCh.shortTitle,
          description: ovCh.description || baseCh.description,
          heroImageUrl: ovCh.heroImageUrl || baseCh.heroImageUrl,
          thumbnailUrl: ovCh.thumbnailUrl || baseCh.thumbnailUrl,
          mindmapImageUrl: ovCh.mindmapImageUrl || baseCh.mindmapImageUrl,
          topics: ovCh.topics && ovCh.topics.length > 0 ? ovCh.topics : baseCh.topics,
          videos: ovCh.videos && ovCh.videos.length > 0 ? ovCh.videos : baseCh.videos,
        };
      });

      return {
        ...baseSub,
        ...ovSub,
        iconUrl: ovSub.iconUrl || baseSub.iconUrl,
        bannerUrl: ovSub.bannerUrl || baseSub.bannerUrl,
        thumbnailUrl: ovSub.thumbnailUrl || baseSub.thumbnailUrl,
        subtitle: ovSub.subtitle || baseSub.subtitle,
        programLabel: ovSub.programLabel || baseSub.programLabel,
        description: ovSub.description || baseSub.description,
        cardStyle: ovSub.cardStyle || baseSub.cardStyle,
        chapters: enrichedChapters,
      };
    });
  };

  if (regTenant && overlay?.subjects && overlay.subjects.length > 0) {
    return { ...base, subjects: enrichOverlaySubjects(overlay.subjects) };
  }
  if (!overlay) return base;
  const enrichedOverlaySubjects = enrichOverlaySubjects(overlay.subjects);
  const ids = new Set(enrichedOverlaySubjects.map((s) => s.id));
  const merged: Manifest = {
    ...base,
    subjects: [...base.subjects.filter((s) => !ids.has(s.id)), ...enrichedOverlaySubjects],
  };
  cachedManifest = merged;
  return merged;
}

export function resolveSubjectId(id: string): string {
  if (!id) return '';
  const lower = id.toLowerCase();
  const regTenant = getRegistryTenantId();
  if (regTenant && registryOverlays[regTenant]) {
    const subjects = registryOverlays[regTenant].subjects;
    const exact = subjects.find((s) => s.id.toLowerCase() === lower);
    if (exact) return exact.id;
    const byCode = subjects.find(
      (s) =>
        s.code &&
        s.code.toLowerCase().replace(/[^a-z0-9]+/g, '_') === lower.replace(/[^a-z0-9]+/g, '_')
    );
    if (byCode) return byCode.id;
    const byPrefix = subjects.find(
      (s) => s.id.toLowerCase().startsWith(lower.slice(0, 4)) || lower.startsWith(s.id.toLowerCase().slice(0, 4))
    );
    if (byPrefix) return byPrefix.id;
  }
  return id;
}

export function getChapters(manifest: Manifest, subjectId: string): Chapter[] {
  const targetId = resolveSubjectId(subjectId);
  const subject = manifest.subjects.find((s) => s.id === targetId || s.id === subjectId);
  if (!subject?.chapters) return [];

  const map = new Map<number, Chapter>();
  for (const ch of subject.chapters) {
    if (!ch.number || ch.number <= 0) continue;
    const existing = map.get(ch.number);
    if (!existing || (ch.resourceCount ?? 0) > (existing.resourceCount ?? 0)) {
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
  if (GCS_SUBJECT_MAP[targetId]) return GCS_SUBJECT_MAP[targetId];
  if (GCS_SUBJECT_MAP[subjectId]) return GCS_SUBJECT_MAP[subjectId];

  const regTenant = getRegistryTenantId();
  if (regTenant) {
    return `${regTenant}/${targetId}`;
  }

  const manifestPath = cachedManifest?.subjects.find(
    (s) => s.id === targetId || s.id === subjectId
  )?.path;
  if (manifestPath) return manifestPath;

  for (const board of cachedCatalog?.boards ?? []) {
    for (const klass of board.classes) {
      const subject = klass.subjects.find((s) => s.id === targetId || s.id === subjectId);
      if (subject) return subject.path;
    }
  }

  return targetId;
}

export function getLocalSubjectBaseUrl(subjectId: string): string {
  const targetId = resolveSubjectId(subjectId);
  if (LOCAL_SUBJECT_MAP[targetId]) return `${BASE}/${LOCAL_SUBJECT_MAP[targetId]}`;
  if (LOCAL_SUBJECT_MAP[subjectId]) return `${BASE}/${LOCAL_SUBJECT_MAP[subjectId]}`;
  const manifestPath = cachedManifest?.subjects.find(
    (s) => s.id === targetId || s.id === subjectId
  )?.path;
  if (manifestPath) return `${BASE}/${manifestPath}`;
  return `${BASE}/${getSubjectResourcePath(subjectId)}`;
}

export function getSubjectBaseUrl(subjectId: string): string {
  const targetId = resolveSubjectId(subjectId);
  if (GCS_BACKEND_SUBJECTS.has(targetId) || GCS_BACKEND_SUBJECTS.has(subjectId)) {
    const mapped = GCS_SUBJECT_MAP[targetId] || GCS_SUBJECT_MAP[subjectId];
    return `${GCS_API_BASE}/api/content/${mapped}`;
  }
  const regTenant = getRegistryTenantId();
  if (regTenant) {
    return `${GCS_API_BASE}/api/content/${regTenant}/${targetId}`;
  }
  return `${BASE}/${getSubjectResourcePath(subjectId)}`;
}

export interface ChapterVideo {
  index: number;
  id: string;
  title: string;
  ytId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  dir: string;
  topics?: string[];
  duration?: string;
}

const chapterVideosCache: Record<string, ChapterVideo[]> = {};

export async function getChapterVideos(
  subjectId: string,
  chapterNumber: number
): Promise<ChapterVideo[]> {
  const normSubject = resolveSubjectId(subjectId) || subjectId;
  const key = `${normSubject}_${chapterNumber}`;
  if (key in chapterVideosCache) return chapterVideosCache[key];

  const regTenant = getRegistryTenantId();
  if (regTenant && registryOverlays[regTenant]) {
    const sub = registryOverlays[regTenant].subjects.find(
      (s) => s.id === normSubject || s.id === subjectId
    );
    const ch = sub?.chapters.find((c) => c.number === chapterNumber);
    if (ch?.videos && ch.videos.length > 0) {
      const mapped = ch.videos.map((v, idx) => {
        const rawThumb = String(v.thumbnailUrl || v.thumbnail || '').trim();
        const isHeroThumb = !rawThumb || /\/hero\.|\/cover\./i.test(rawThumb);
        return {
          index: v.order ?? idx + 1,
          id: v.id || `video_${idx + 1}`,
          title: v.title || `Video ${idx + 1}`,
          ytId: v.videoId || '',
          videoUrl: v.videoUrl || v.url,
          thumbnailUrl: !isHeroThumb
            ? rawThumb
            : v.videoId
              ? `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`
              : undefined,
          dir: v.id || `video_${idx + 1}`,
          topics: v.topics,
          duration: v.duration,
        };
      });
      chapterVideosCache[key] = mapped;
      return mapped;
    }
  }

  if (GCS_BACKEND_SUBJECTS.has(subjectId) || GCS_BACKEND_SUBJECTS.has(normSubject)) {
    chapterVideosCache[key] = [];
    return [];
  }
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
    // treat as unsegmented
  }

  chapterVideosCache[key] = videos;
  return videos;
}

export function getChapterDir(subjectId: string, chapterNumber: number): string {
  const regTenant = getRegistryTenantId();
  if (regTenant && registryOverlays[regTenant]) {
    const sub = registryOverlays[regTenant].subjects.find(
      (s) => s.id === subjectId || s.id === resolveSubjectId(subjectId)
    );
    const ch = sub?.chapters.find((c) => c.number === chapterNumber);
    if (ch?.dir) return ch.dir;
  }
  const subjectChapters = cachedManifest ? getChapters(cachedManifest, subjectId) : [];
  const chapter = subjectChapters.find((c) => c.number === chapterNumber);
  return chapter?.dir ?? `chapter_${String(chapterNumber).padStart(2, '0')}`;
}

export function getResourceTabs(manifest: Manifest): [string, string][] {
  const isMooc = cloudStorage.getItem('sv_moocs_mode') === 'true';
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
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) return {};
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
        const chapterCount =
          manifestSubject?.chapters.length ?? subject.chapterNumbers?.length ?? 0;
        const meta = metas[subject.id];

        const defaultMeta: CourseMeta = {
          subtitle: subject.subtitle || `Learn about ${subject.name}`,
          description: subject.description || `A comprehensive course on ${subject.name}.`,
          discipline: subject.programLabel || 'General',
          level: 'intermediate',
          instructor: {
            name: 'Faculty Member',
            title: 'Instructor',
          },
          durationHours: chapterCount > 0 ? chapterCount * 4 : 30,
          credits: subject.credits || 3,
          language: 'English',
          thumbnail: subject.iconUrl || subject.thumbnailUrl,
          accent: subject.cardStyle?.accentColor || 'linear-gradient(135deg, #7c3aed, #ec4899)',
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
  const targetId = resolveSubjectId(id);
  return courses.find((c) => c.id === id || c.id === targetId) || null;
}
