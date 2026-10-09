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

/**
 * Fetches Quick Study Guide markdown with cache & fallback
 */
export async function fetchQuickStudyGuide(
  subjectId: string,
  chapterNum: number,
  persona: string = 'intermediate'
): Promise<string> {
  const cacheKey = `study_quick_${subjectId}_${chapterNum}_${persona}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/read/quick?persona=${persona}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 50) {
        await storage.setItem(cacheKey, text);
        return text;
      }
    }
  } catch (err) {
    console.warn(`[ContentService] API fetch failed for Quick Study: ${err}`);
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
  persona: string = 'intermediate'
): Promise<string> {
  const cacheKey = `study_detailed_${subjectId}_${chapterNum}_${persona}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/read/detailed?persona=${persona}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 50) {
        await storage.setItem(cacheKey, text);
        return text;
      }
    }
  } catch (err) {
    console.warn(`[ContentService] API fetch failed for Detailed Notes: ${err}`);
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
  persona: string = 'intermediate'
): Promise<Flashcard[]> {
  const cacheKey = `flashcards_${subjectId}_${chapterNum}_${persona}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/practice/flashcards?persona=${persona}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

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
  } catch (err) {
    console.warn(`[ContentService] API fetch failed for Flashcards: ${err}`);
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
  chapterNum: number
): Promise<MindmapData> {
  const cacheKey = `mindmap_${subjectId}_${chapterNum}`;
  const chDir = formatChapterDir(chapterNum);
  const url = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/learn/mindmap`;

  let raw = '';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      raw = await res.text();
      if (raw && raw.trim().length > 50) {
        await storage.setItem(cacheKey, raw);
      }
    }
  } catch (err) {
    console.warn(`[ContentService] API fetch failed for Mindmap: ${err}`);
  }

  if (!raw) {
    const cached = await storage.getItem<string>(cacheKey);
    if (cached) raw = cached;
  }

  return parseMermaidMindmap(raw, chapterNum);
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
