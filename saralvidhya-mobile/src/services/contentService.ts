import { storage } from '@/utils/storage';
import { SAMPLE_STUDY_CONTENT } from '@/data/sampleStudyContent';
import { SAMPLE_FLASHCARDS, Flashcard } from '@/data/sampleFlashcards';

export const GCS_API_BASE = 'https://saralvidhya-api-193782571555.asia-south1.run.app';

export interface MindmapNode {
  id: string;
  title: string;
  depth: number;
  bloomLevel?: string;
  children: MindmapNode[];
  details?: string[];
}

export interface MindmapData {
  title: string;
  subject: string;
  chapter: number;
  rawMermaid: string;
  rootNode: MindmapNode;
}

/**
 * Normalizes chapter number to 2-digit format (e.g., 1 -> 'chapter_01')
 */
export function formatChapterDir(chNum: number): string {
  return `chapter_${chNum < 10 ? '0' : ''}${chNum}`;
}


const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Reusable fetch wrapper with configurable timeout and external AbortSignal chaining.
 */
export async function fetchWithTimeout(
  url: string,
  ms: number = DEFAULT_TIMEOUT_MS,
  externalSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${ms}ms`));
  }, ms);

  let onExternalAbort: (() => void) | undefined;
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      onExternalAbort = () => controller.abort();
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal && onExternalAbort) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * Helper to check whether an error was caused by an intentional abort/cancellation
 */
function isAbortError(err: any, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  const msg = String(err.message || err).toLowerCase();
  return msg.includes('abort') || msg.includes('cancel');
}

/**
 * Fetches Quick Study Guide markdown with cache & fallback
 */
export async function fetchQuickStudyGuide(
  subjectId: string,
  chapterNum: number,
  persona: string = 'intermediate',
  signal?: AbortSignal
): Promise<string> {
  const cacheKey = `study_quick_${subjectId}_${chapterNum}_${persona}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/read/quick?persona=${persona}`;

  try {
    const res = await fetchWithTimeout(url, 15000, signal);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 50) {
        await storage.setItem(cacheKey, text);
        return text;
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] API fetch failed for Quick Study: ${err?.message || err}`);
    }
  }

  // Fallback to local cache
  const cached = await storage.getItem<string>(cacheKey);
  if (cached) return cached;

  // Fallback to embedded sample
  return (
    SAMPLE_STUDY_CONTENT[chapterNum]?.summary ||
    SAMPLE_STUDY_CONTENT[1]?.summary ||
    '# Quick Study Guide\n\nContent is being generated for this chapter.'
  );
}

/**
 * Fetches Detailed Notes markdown with cache & fallback
 */
export async function fetchDetailedNotes(
  subjectId: string,
  chapterNum: number,
  persona: string = 'intermediate',
  signal?: AbortSignal
): Promise<string> {
  const cacheKey = `study_detailed_${subjectId}_${chapterNum}_${persona}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/read/detailed?persona=${persona}`;

  try {
    const res = await fetchWithTimeout(url, 15000, signal);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 50) {
        await storage.setItem(cacheKey, text);
        return text;
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] API fetch failed for Detailed Notes: ${err?.message || err}`);
    }
  }

  // Fallback to local cache
  const cached = await storage.getItem<string>(cacheKey);
  if (cached) return cached;

  // Fallback to embedded sample
  return (
    SAMPLE_STUDY_CONTENT[chapterNum]?.detailed ||
    SAMPLE_STUDY_CONTENT[1]?.detailed ||
    '# Detailed Notes\n\nFull syllabus coverage being compiled for this chapter.'
  );
}

/**
 * Fetches real ANGRAU Flashcards with questions, answers, and infographics
 */
export async function fetchFlashcards(
  subjectId: string,
  chapterNum: number,
  persona: string = 'intermediate',
  signal?: AbortSignal
): Promise<Flashcard[]> {
  const cacheKey = `flashcards_${subjectId}_${chapterNum}_${persona}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/practice/flashcards?persona=${persona}`;

  try {
    const res = await fetchWithTimeout(url, 15000, signal);

    if (res.ok) {
      const data = await res.json();
      const rawCards = Array.isArray(data) ? data : data.flashcards || data.cards || [];

      if (rawCards.length > 0) {
        const formatted: Flashcard[] = rawCards.map((c: any, idx: number) => {
          let img = c.infographicUrl || c.infographic || c.image;
          if (img && !img.startsWith('http') && !img.startsWith('data:')) {
            img = `${GCS_API_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
          }

          return {
            id: c.id || `card_${chapterNum}_${idx + 1}`,
            front: c.front || c.question || c.term || 'Key Concept',
            back: c.back || c.answer || c.definition || 'Detailed explanation',
            category: c.category || c.topic || 'ANGRAU Entomology',
            hint: c.hint || undefined,
            infographicUrl: img || undefined,
          };
        });

        await storage.setItem(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] API fetch failed for Flashcards: ${err?.message || err}`);
    }
  }

  // Fallback to local cache
  const cached = await storage.getItem<Flashcard[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  // Fallback to sample flashcards
  return SAMPLE_FLASHCARDS[chapterNum] || SAMPLE_FLASHCARDS[1] || [];
}

/**
 * Fetches Mindmap raw markdown/mermaid string and parses it into tree structure
 */
export async function fetchMindmap(
  subjectId: string,
  chapterNum: number,
  signal?: AbortSignal
): Promise<MindmapData> {
  const cacheKey = `mindmap_${subjectId}_${chapterNum}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/learn/mindmap`;

  let raw = '';
  try {
    const res = await fetchWithTimeout(url, 15000, signal);

    if (res.ok) {
      raw = await res.text();
      if (raw && raw.trim().length > 50) {
        await storage.setItem(cacheKey, raw);
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] API fetch failed for Mindmap: ${err?.message || err}`);
    }
  }

  if (!raw) {
    const cached = await storage.getItem<string>(cacheKey);
    if (cached) raw = cached;
  }

  if (raw && (raw.trim().startsWith('{') || raw.trim().startsWith('['))) {
    try {
      const json = JSON.parse(raw);
      if (json && (json.children || json.title || json.name)) {
        return parseJsonMindmap(json, chapterNum);
      }
    } catch {
      // fallback to mermaid
    }
  }

  return parseMermaidMindmap(raw, chapterNum);
}

/**
 * Parses JSON Mindmap schema returned by the API
 */
export function parseJsonMindmap(json: any, chapterNum: number): MindmapData {
  const rootTitle = json.title || json.name || `Chapter ${chapterNum} Mindmap`;

  const formatNode = (node: any, depth: number = 0): MindmapNode => {
    let details: string[] = [];
    if (Array.isArray(node.details)) {
      details = node.details.filter(Boolean).map(String);
    } else if (typeof node.description === 'string' && node.description.trim()) {
      details = [node.description.trim()];
    }

    return {
      id: String(node.id || `node_${Math.random().toString(36).slice(2, 9)}`),
      title: String(node.title || node.name || 'Topic'),
      depth,
      bloomLevel: node.bloomLevel || node.bloom_level,
      children: Array.isArray(node.children) ? node.children.map((c: any) => formatNode(c, depth + 1)) : [],
      details,
    };
  };

  const rootChildren = Array.isArray(json.children)
    ? json.children.map((c: any) => formatNode(c, 1))
    : [];

  return {
    title: rootTitle,
    subject: 'Fundamentals of Entomology (ENTO 131)',
    chapter: chapterNum,
    rawMermaid: typeof json.mindmap === 'string' ? json.mindmap : '',
    rootNode: {
      id: String(json.id || 'root'),
      title: rootTitle,
      depth: 0,
      children: rootChildren,
    },
  };
}

/**
 * Parses Mermaid Mindmap syntax into structured interactive nodes
 */
export function parseMermaidMindmap(raw: string, chapterNum: number): MindmapData {
  if (!raw || raw.trim().length === 0) {
    return getDefaultMindmapData(chapterNum);
  }

  const lines = raw.split('\n');
  let inMermaid = false;
  let rootTitle = `Insect Digestive System (Chapter ${chapterNum})`;
  const branches: MindmapNode[] = [];
  let currentBranch: MindmapNode | null = null;
  let currentSubBranch: MindmapNode | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.includes('```mermaid')) {
      inMermaid = true;
      continue;
    }
    if (line.includes('```') && inMermaid) {
      inMermaid = false;
      continue;
    }

    if (!inMermaid && line.startsWith('title:')) {
      rootTitle = line.replace(/title:\s*["']?/, '').replace(/["']?$/, '');
    }

    if (inMermaid) {
      if (line.startsWith('root((')) {
        const match = line.match(/root\(\((.+?)\)\)/);
        if (match) rootTitle = match[1];
        continue;
      }

      // Check indentation for depth
      const indent = rawLine.search(/\S|$/);

      // Branch 1 (Level 1 branch, like (Three Primary Regions) or (Physiology))
      if (line.startsWith('(') && line.endsWith(')')) {
        const text = line.slice(1, -1);
        if (indent <= 6) {
          currentBranch = {
            id: `b_${branches.length + 1}`,
            title: text,
            depth: 1,
            children: [],
            details: [],
          };
          branches.push(currentBranch);
          currentSubBranch = null;
        } else if (currentBranch) {
          currentSubBranch = {
            id: `sub_${currentBranch.id}_${currentBranch.children.length + 1}`,
            title: text,
            depth: 2,
            children: [],
            details: [],
          };
          currentBranch.children.push(currentSubBranch);
        }
      } else if (line.startsWith('[') && line.endsWith(']')) {
        // Leaf topic node
        const text = line.slice(1, -1);
        if (currentSubBranch) {
          currentSubBranch.details?.push(text);
        } else if (currentBranch) {
          currentBranch.details?.push(text);
        }
      }
    }
  }

  if (branches.length === 0) {
    return getDefaultMindmapData(chapterNum);
  }

  return {
    title: rootTitle,
    subject: 'Fundamentals of Entomology (ENTO 131)',
    chapter: chapterNum,
    rawMermaid: raw,
    rootNode: {
      id: 'root',
      title: rootTitle,
      depth: 0,
      children: branches,
    },
  };
}

/**
 * Fallback mindmap data for offline or non-parsed state
 */
function getDefaultMindmapData(chapterNum: number): MindmapData {
  return {
    title: `Chapter ${chapterNum}: Structural Organization & Physiology`,
    subject: 'Fundamentals of Entomology',
    chapter: chapterNum,
    rawMermaid: '',
    rootNode: {
      id: 'root',
      title: 'Insect Digestive System & Alimentary Canal',
      depth: 0,
      children: [
        {
          id: 'b_1',
          title: 'Foregut (Stomodaeum)',
          depth: 1,
          bloomLevel: 'L-1 Remembering',
          children: [
            {
              id: 'sub_1_1',
              title: 'Embryology & Cuticle',
              depth: 2,
              children: [],
              details: [
                'Ectodermal origin with cuticular intima',
                'Intima sheds during each nymphal/larval ecdysis',
              ],
            },
            {
              id: 'sub_1_2',
              title: 'Key Organs',
              depth: 2,
              children: [],
              details: [
                'Pharynx: Muscle-powered sucking pump',
                'Esophagus: Straight transport conduit to crop',
                'Crop: Distensible food reservoir for ingestion',
                'Proventriculus: 6 cuticular teeth for mastication',
              ],
            },
          ],
          details: ['Ingestion, food storage, and mechanical maceration'],
        },
        {
          id: 'b_2',
          title: 'Midgut (Mesenteron / Ventriculus)',
          depth: 1,
          bloomLevel: 'L-2 Understanding',
          children: [
            {
              id: 'sub_2_1',
              title: 'Cellular Architecture',
              depth: 2,
              children: [],
              details: [
                'Endodermal embryonic origin (naked epithelium)',
                'Columnar epithelial cells with microvilli',
                'Regenerative nidi cells replace worn epithelium',
              ],
            },
            {
              id: 'sub_2_2',
              title: 'Peritrophic Membrane',
              depth: 2,
              children: [],
              details: [
                'Chitin-protein porous meshwork envelope',
                'Protects epithelial microvilli from mechanical abrasion',
                'Acts as ultrafilter against bacterial invasion',
              ],
            },
          ],
          details: ['Enzymatic digestion, amylase/protease secretion & nutrient absorption'],
        },
        {
          id: 'b_3',
          title: 'Hindgut (Proctodaeum)',
          depth: 1,
          bloomLevel: 'L-3 Application',
          children: [
            {
              id: 'sub_3_1',
              title: 'Regional Anatomy',
              depth: 2,
              children: [],
              details: [
                'Ectodermal origin lined with thin cuticular intima',
                'Subdivided into Ileum, Colon, and Rectum',
              ],
            },
            {
              id: 'sub_3_2',
              title: 'Osmoregulation & Excretion',
              depth: 2,
              children: [],
              details: [
                'Malpighian tubules insert at midgut-hindgut junction',
                'Rectal pads/papillae reabsorb water and electrolytes',
                'Ensures terrestrial survival without desiccation',
              ],
            },
          ],
          details: ['Water recovery, electrolyte conservation & fecal pellet formation'],
        },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Videos
// ─────────────────────────────────────────────────────────────

export interface ChapterVideo {
  index: number;
  title: string;
  ytId: string;
  topics?: string[];
  duration?: string;
}

const DEFAULT_TOPICS = [
  'Key conceptual overview & core principles',
  'Structural anatomy and physiological pathways',
  'Specialized adaptations and functional dynamics',
  'Synthesis of key takeaways and summary points',
];

/** Curated videos (mirrors the web VideosView) used as an offline/last-resort fallback. */
const CURATED_VIDEOS: Record<number, ChapterVideo[]> = {
  1: [
    {
      index: 1,
      title: 'Insects Digestive System',
      ytId: 'Ioa25iYy53g',
      duration: '10:15 min',
      topics: [
        'Anatomy of the Insect Alimentary Canal: Foregut, Midgut & Hindgut',
        'Stomodaeal Specializations: Pharynx, Crop, and Proventriculus (Gizzard)',
        'Mesenteron Physiology: Secretory Epithelium & Peritrophic Membrane',
        'Proctodaeum & Excretion: Malpighian Tubules & Water Reabsorption',
        'Enzymatic Digestion & Nutritional Adaptations in Insects',
      ],
    },
  ],
  3: [
    {
      index: 1,
      title: 'Weathering of Rocks and Minerals',
      ytId: 'UMJFfCFFF4M',
      duration: '11:45 min',
      topics: [
        'Foundations of Weathering & Regolith-Saprolite Boundary Dynamics',
        'Physical Weathering: Hydraulic Forces, Frost Wedging & Exfoliation',
        'Chemical Weathering: Hydrolysis, Hydration, Carbonation, Oxidation & Reduction',
        'Biological Agents: Pioneer Lichens, Microbial Geochemistry & Root Wedging',
        "Goldich Mineral Weathering Stability Series vs Bowen's Reaction Series",
      ],
    },
  ],
  4: [
    {
      index: 1,
      title: 'Pollination, Pollinizers & Parthenocarpy in Fruit Crops',
      ytId: 'elWWuKv5b9Q',
      duration: '14:20 min',
      topics: [
        'Floral Biology Architecture & Angiosperm Double Fertilization',
        'Self-Pollination (Autogamy): Homogamy, Cleistogamy & Chasmogamy',
        'Cross-Pollination (Allogamy) & Self-Incompatibility (GSI vs SSI)',
        'Pollinizer Cultivar Proportion & Orchard Planting Geometry',
        'Parthenocarpy: Vegetative, Stimulative & Stenospermocarpy Mechanisms',
      ],
    },
  ],
};

const YT_ID_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/g;

/** Extracts unique YouTube IDs from arbitrary markdown/text. */
export function extractYouTubeIds(text: string): string[] {
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(YT_ID_REGEX.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (!ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

/**
 * Fetches the list of videos for a chapter.
 * Order: videos.json (API) → youtube_links.md (API) → local cache → curated fallback.
 */
export async function fetchChapterVideos(
  subjectId: string,
  chapterNum: number,
  signal?: AbortSignal
): Promise<ChapterVideo[]> {
  const cacheKey = `study_videos_${subjectId}_${chapterNum}`;
  const chDir = formatChapterDir(chapterNum);
  const base = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}`;
  const curated = CURATED_VIDEOS[chapterNum] ?? [];

  // 1. videos.json registry
  try {
    const res = await fetchWithTimeout(`${base}/videos.json`, 10000, signal);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && !ct.includes('text/html')) {
      const parsed = JSON.parse(await res.text());
      if (Array.isArray(parsed?.videos)) {
        const list: ChapterVideo[] = parsed.videos
          .filter((v: any) => v && typeof v.ytId === 'string' && v.ytId.length === 11)
          .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0))
          .map((v: any, i: number) => ({
            index: v.index ?? i + 1,
            title: v.title || `Video Lecture Part ${i + 1}`,
            ytId: v.ytId,
            topics: v.topics,
            duration: v.duration,
          }));
        if (list.length > 0) {
          await storage.setItem(cacheKey, list);
          return list;
        }
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] videos.json fetch failed: ${err?.message || err}`);
    }
  }

  // 2. youtube_links.md
  try {
    const res = await fetchWithTimeout(`${base}/youtube_links.md`, 10000, signal);
    if (res.ok) {
      const ids = extractYouTubeIds(await res.text());
      if (ids.length > 0) {
        const list: ChapterVideo[] = ids.map((id, i) => {
          const known = Object.values(CURATED_VIDEOS).flat().find((v) => v.ytId === id);
          return {
            index: i + 1,
            title: known?.title || `Video Lecture Part ${i + 1}`,
            ytId: id,
            topics: known?.topics || DEFAULT_TOPICS,
            duration: known?.duration,
          };
        });
        await storage.setItem(cacheKey, list);
        return list;
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] youtube_links.md fetch failed: ${err?.message || err}`);
    }
  }

  // 3. Local cache
  const cached = await storage.getItem<ChapterVideo[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  // 4. Curated fallback (default to chapter 1 video so the screen is never empty)
  return curated.length > 0 ? curated : CURATED_VIDEOS[1];
}

/** Watched-video persistence (local only). */
const watchedKey = (subjectId: string, chapterNum: number) =>
  `study_videos_watched_${subjectId}_${chapterNum}`;

export async function getWatchedVideos(subjectId: string, chapterNum: number): Promise<string[]> {
  return (await storage.getItem<string[]>(watchedKey(subjectId, chapterNum))) ?? [];
}

export async function markVideoWatched(
  subjectId: string,
  chapterNum: number,
  ytId: string
): Promise<string[]> {
  const current = await getWatchedVideos(subjectId, chapterNum);
  if (current.includes(ytId)) return current;
  const next = [...current, ytId];
  await storage.setItem(watchedKey(subjectId, chapterNum), next);
  return next;
}

// ─────────────────────────────────────────────────────────────
// Question Bank (2M, 5M, 10M questions assigned by teachers)
// ─────────────────────────────────────────────────────────────

export type MarkType = '2M' | '5M' | '10M';

export interface TeacherQuestion {
  id: number | string;
  numberFormatted: string;
  question: string;
  assignedBy: string;
  chapter: string;
  answers: Record<MarkType, string>;
  teacherTip: string;
  bloomLevel?: string;
  difficulty?: string;
  topicId?: string;
  mindmapPath?: string;
}

const PILLAR_TITLES: Record<string, string> = {
  pillar_1_nomenclature: 'Introduction & Nomenclature',
  pillar_2_mechanisms_and_kinetics: 'Mechanisms & Kinetics',
  pillar_3_comparative_matrix: 'Comparative Matrix',
  pillar_4_agronomic_applications: 'Agronomic Applications',
  pillar_4_enterprise_applications: 'Enterprise Applications & Production Case Study',
  pillar_5_diagnostic_synthesis: 'Diagnostic Synthesis',
};

/** Converts the nested essay_answer_10mark JSON object (or string/array) into formatted readable answer text. */
export function formatTenMarkAnswer(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join('\n\n');
  if (typeof raw !== 'object') return String(raw);

  const getPillarTitle = (k: string) => {
    return (
      PILLAR_TITLES[k] ||
      k
        .replace(/^pillar_\d+_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  const parts: string[] = [];
  const rubric = raw.marking_rubric;
  if (rubric && typeof rubric === 'object') {
    const rows = Object.entries(rubric)
      .filter(([k]) => k !== 'total_marks')
      .map(([k, v]) => `• ${getPillarTitle(k)}: ${v}`);
    const total = rubric.total_marks ? `[Total Marks: ${rubric.total_marks}]` : '';
    parts.push(`Marking Scheme:\n${rows.join('\n')}${total ? '\n' + total : ''}`);
  }

  for (const [key, value] of Object.entries(raw)) {
    if (key === 'marking_rubric' || typeof value !== 'string' || !value.trim()) continue;
    const title = getPillarTitle(key);
    parts.push(`${title}:\n${value}`);
  }

  return parts.join('\n\n');
}

/**
 * Fetches dynamic Question Bank questions for a chapter
 */
export async function fetchQuestionBank(
  subjectId: string,
  chapterNum: number,
  chapterTitle?: string,
  signal?: AbortSignal
): Promise<TeacherQuestion[]> {
  const cacheKey = `question_bank_${subjectId}_${chapterNum}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/practice/question_bank`;

  try {
    const res = await fetchWithTimeout(url, 15000, signal);
    if (res.ok) {
      const data = await res.json();
      const rawQuestions = Array.isArray(data) ? data : data.questions || [];

      if (rawQuestions.length > 0) {
        const formatted: TeacherQuestion[] = rawQuestions.map((q: any, idx: number) => {
          const num = idx + 1;
          const numFormatted = num < 10 ? `0${num}` : `${num}`;

          const shortAns = q.short_answer_2mark || q.answers?.['2M'] || q.shortAnswer || '2-mark answer available in syllabus notes.';
          const longAns = Array.isArray(q.long_answer_5mark_points)
            ? q.long_answer_5mark_points.join('\n\n')
            : (q.long_answer_5mark_points || q.answers?.['5M'] || q.longAnswer || '5-mark structured points available in detailed study guide.');
          const tenAns = q.essay_answer_10mark
            ? formatTenMarkAnswer(q.essay_answer_10mark)
            : (q.answers?.['10M'] || q.tenMarkAnswer || '10-mark comprehensive synthesis available in detailed syllabus.');

          const tip = q.teacher_tip ||
            (q.diagram_ref ? `Diagram Focus: ${q.diagram_ref}` :
            (q.bloom_level ? `Bloom Level: ${q.bloom_level} · University Exam High-Yield Question` : 'Vital ANGRAU exam concept. Focus on key nomenclature and diagram labels.'));

          const faculty = q.assigned_by || (idx % 2 === 0 ? 'Prof. C. Srinivasa Rao (Dept. of Entomology)' : 'Dr. V. K. Sharma (Senior Faculty)');

          return {
            id: q.id || `qb_${chapterNum}_${num}`,
            numberFormatted: numFormatted,
            question: q.question || q.stem || `Question ${num}`,
            assignedBy: faculty,
            chapter: chapterTitle ? `Chapter ${chapterNum} · ${chapterTitle}` : `Chapter ${chapterNum}`,
            answers: {
              '2M': shortAns,
              '5M': longAns,
              '10M': tenAns,
            },
            teacherTip: tip,
            bloomLevel: q.bloom_level,
            difficulty: q.difficulty,
            topicId: q.topic_id,
            mindmapPath: q.mindmap_path,
          };
        });

        await storage.setItem(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] API fetch failed for Question Bank: ${err?.message || err}`);
    }
  }

  // Fallback to cache
  const cached = await storage.getItem<TeacherQuestion[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  return [];
}

// ─────────────────────────────────────────────────────────────
// Mock Test / Assessment Questions (50 MCQ questions per chapter)
// ─────────────────────────────────────────────────────────────

export interface AssessmentQuestion {
  id: string;
  question: string;
  isMultipleSelect: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  options: string[];
  correctAnswers: number[]; // indices of correct options
  explanation: string;
}

export interface ExamQuestion {
  id: number;
  part: string;
  marks: string;
  taxonomy: string;
  topicTitle: string;
  questionText: string;
  guidanceText?: string;
}

/**
 * Fetches dynamic Mock Test questions for Assessments and Preparation Exams
 */
export async function fetchMockTest(
  subjectId: string,
  chapterNum: number,
  signal?: AbortSignal
): Promise<{
  assessmentQuestions: AssessmentQuestion[];
  examQuestions: ExamQuestion[];
}> {
  const cacheKey = `mock_test_${subjectId}_${chapterNum}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/practice/mock_test`;

  try {
    const res = await fetchWithTimeout(url, 15000, signal);
    if (res.ok) {
      const data = await res.json();
      const rawQuestions = Array.isArray(data) ? data : data.questions || [];

      if (rawQuestions.length > 0) {
        const optionKeys = ['A', 'B', 'C', 'D'];

        const assessmentQuestions: AssessmentQuestion[] = rawQuestions.map((q: any, idx: number) => {
          let opts: string[] = [];
          if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
            opts = optionKeys.map((k) => q.options[k]).filter(Boolean);
          } else if (Array.isArray(q.options)) {
            opts = q.options;
          } else {
            opts = ['Option A', 'Option B', 'Option C', 'Option D'];
          }

          let correctIndices: number[] = [0];
          if (typeof q.correct_answer === 'string') {
            const letter = q.correct_answer.trim().toUpperCase();
            const foundIdx = optionKeys.indexOf(letter);
            if (foundIdx !== -1) correctIndices = [foundIdx];
          } else if (typeof q.correct_answer === 'number') {
            correctIndices = [q.correct_answer];
          } else if (Array.isArray(q.correct_answer)) {
            correctIndices = q.correct_answer.map((ans: any) =>
              typeof ans === 'string' ? optionKeys.indexOf(ans.toUpperCase()) : Number(ans)
            ).filter((i: number) => i >= 0);
          }

          const diff: 'Easy' | 'Medium' | 'Hard' =
            q.bloom_level === 'Analyze' || q.bloom_level === 'Evaluate' ? 'Hard' :
            q.bloom_level === 'Apply' ? 'Medium' : 'Easy';

          return {
            id: q.id || `mock_${chapterNum}_${idx + 1}`,
            question: q.question || q.stem || `Question ${idx + 1}`,
            isMultipleSelect: correctIndices.length > 1,
            difficulty: diff,
            options: opts,
            correctAnswers: correctIndices,
            explanation: q.rationale || q.explanation || 'Refer to the detailed chapter notes for full explanation.',
          };
        });

        const examQuestions: ExamQuestion[] = rawQuestions.map((q: any, idx: number) => {
          const num = q.number || idx + 1;
          const isShort = idx < 25;
          return {
            id: num,
            part: isShort ? 'PART A · SHORT ANSWER' : 'PART B · ESSAY QUESTION',
            marks: isShort ? '★ 2 marks' : '★ 5 marks',
            taxonomy: q.bloom_level || (isShort ? 'Remembering' : 'Analyzing'),
            topicTitle: q.topic || `Concept ${num}`,
            questionText: q.question || q.stem || `Question ${num}`,
            guidanceText: q.rationale || (isShort ? 'Be clear and concise · 2 marks' : 'Provide detailed functional summary · 5 marks'),
          };
        });

        const result = { assessmentQuestions, examQuestions };
        await storage.setItem(cacheKey, result);
        return result;
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] API fetch failed for Mock Test: ${err?.message || err}`);
    }
  }

  // Fallback to cache
  const cached = await storage.getItem<{
    assessmentQuestions: AssessmentQuestion[];
    examQuestions: ExamQuestion[];
  }>(cacheKey);
  if (cached && cached.assessmentQuestions?.length > 0) return cached;

  return { assessmentQuestions: [], examQuestions: [] };
}

// ─────────────────────────────────────────────────────────────
// Key Takeaways & Study Plan
// ─────────────────────────────────────────────────────────────

/**
 * Fetches dynamic single-page revision Key Takeaways markdown
 */
export async function fetchKeyTakeaways(
  subjectId: string,
  chapterNum: number,
  signal?: AbortSignal
): Promise<string> {
  const cacheKey = `key_takeaways_${subjectId}_${chapterNum}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/read/key_takeaways`;

  try {
    const res = await fetchWithTimeout(url, 15000, signal);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 50) {
        await storage.setItem(cacheKey, text);
        return text;
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] API fetch failed for Key Takeaways: ${err?.message || err}`);
    }
  }

  const cached = await storage.getItem<string>(cacheKey);
  if (cached) return cached;

  return `# Key Takeaways (Chapter ${chapterNum})\n\nComprehensive revision sheet is being compiled for this chapter.`;
}

/**
 * Fetches dynamic day-by-day Study Plan markdown
 */
export async function fetchStudyPlan(
  subjectId: string,
  chapterNum: number,
  signal?: AbortSignal
): Promise<string> {
  const cacheKey = `study_plan_${subjectId}_${chapterNum}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/learn/study_plan`;

  try {
    const res = await fetchWithTimeout(url, 15000, signal);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 50) {
        await storage.setItem(cacheKey, text);
        return text;
      }
    }
  } catch (err: any) {
    if (!isAbortError(err, signal)) {
      console.warn(`[ContentService] API fetch failed for Study Plan: ${err?.message || err}`);
    }
  }

  const cached = await storage.getItem<string>(cacheKey);
  if (cached) return cached;

  return `# Study Plan (Chapter ${chapterNum})\n\nStructured study modules and tasks are being compiled for this chapter.`;
}
