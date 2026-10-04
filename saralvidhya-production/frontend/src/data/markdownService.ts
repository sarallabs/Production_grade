import { 
  BASE, 
  API_BASE_URL, 
  BACKEND_SUBJECTS, 
  LEVEL_TO_PERSONA, 
  DifficultyLevel, 
  getManifest,
  getChapterDir,
  getSubjectBaseUrl,
  SHARED_RESOURCE_FILES 
} from './manifestService';

export interface BackendStudyGuide {
  quick_study: string;
  detailed_notes: string;
}

const studyGuideCache: Record<string, BackendStudyGuide | null> = {};

/** Fetches (and caches) the backend study guide for a subject + persona. */
export async function fetchBackendStudyGuide(
  subject: string,
  level: DifficultyLevel,
): Promise<BackendStudyGuide | null> {
  const persona = LEVEL_TO_PERSONA[level] || 'Intermediate';
  const key = `${subject}:${persona}`;
  if (key in studyGuideCache) return studyGuideCache[key];
  try {
    const res = await fetch(`${API_BASE_URL}/folders/${subject}/study-guides?persona=${persona}`);
    if (res.ok) {
      const data = (await res.json()) as BackendStudyGuide;
      studyGuideCache[key] = data;
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch study guide from API', e);
  }
  studyGuideCache[key] = null;
  return null;
}

/** Asset trees that live inside a video's directory in a segmented chapter. */
const VIDEO_SCOPED_PREFIXES = ['Learn/', 'Prepare/', 'Examination/'];

export function getResourceFileCandidates(
  resourceName: string,
  level: string = 'intermediate',
  videoDir?: string,
): string[] {
  const assessmentLevel = level === 'beginner' ? 'easy' : level === 'advanced' ? 'hard' : 'medium';

  const aliases: Record<string, string[]> = {
    'summary.md': [
      `Learn/Quick_Summary/quick_summary_${level}.md`,
      `Read/Quick_Summary/quick_summary_${level}.md`,
      `Reading/Quick Study/quick_summary_${level}.md`,
      'summary.md'
    ],
    'key_takeaways.md': [
      `Reading/Key Takeaways/key_takeaways.md`,
      `Read/Key Takeaways/key_takeaways.md`,
      `Reading/key_takeaways.md`,
      'key_takeaways.md'
    ],
    'mindmap.md': [
      'Learn/Mindmaps/mindmap.md',
      'Learn/Mindmaps/mindmap.json',
      'mindmap.md',
      'mindmap.json'
    ],
    'podcast_script.md': ['podcast_script.md', 'long_podcast.md', 'short_podcast.md'],
    'youtube_links.md': ['youtube_links.md', 'video_script.md'],
    'assessment.md': [
      `Learn/Assessments/MCQ/mcq_${assessmentLevel}.md`,
      'assessment.md', 'quiz.md', 'question_bank.md'
    ],
    'quiz.md': [
      `Learn/Assessments/MCQ/mcq_${assessmentLevel}.md`,
      'quiz.md', 'question_bank.md'
    ],
    'detailed_view.md': [
      `Learn/Detailed_Summary/detailed_summary_${level}.md`,
      `Read/Detailed_Summary/detailed_summary_${level}.md`,
      `Reading/Detailed Study/detailed_summary_${level}.md`,
      'detailed_view.md', 'Detailed Notes'
    ],
    'question_bank.md': [
      'question_bank.md',
      'Practice/Question Bank/question_bank.md',
      'Practice/Question Bank/questions.md',
      'Prepare/Question_Bank/question_bank.md',
      `Prepare/Question_Bank/MCQ/mcq_prep_${assessmentLevel}.md`,
      `Practice/Assessments/MCQ/mcq_${assessmentLevel}.md`,
      `Practice/Assessments/MCQ/${assessmentLevel}_mcq_10.md`,
      'mcq.md',
      'quiz.md'
    ]
  };
  const candidates = aliases[resourceName] ?? [resourceName];
  if (!videoDir) return candidates;

  const scoped = candidates
    .filter((c) => VIDEO_SCOPED_PREFIXES.some((p) => c.startsWith(p)))
    .map((c) => `${videoDir}/${c}`);
  return [...scoped, ...candidates];
}

export function escapeMermaidLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function mindmapJsonToMermaid(text: string): string {
  const root = JSON.parse(text);
  const lines = ['```mermaid', 'mindmap'];

  const visit = (node: any, depth = 1) => {
    const rawLabel = String(node?.name ?? node?.label ?? 'Topic').replace(/\\s+/g, ' ').trim();
    const label = escapeMermaidLabel(rawLabel);
    const indent = '  '.repeat(depth);
    lines.push(depth === 1 ? `${indent}root(("${label}"))` : `${indent}${label}`);
    for (const child of node?.children ?? []) {
      visit(child, depth + 1);
    }
  };

  visit(root);
  lines.push('```');
  return lines.join('\\n');
}

/**
 * Truncates a mermaid mindmap to only show `maxLevels` deep (0-indexed).
 *  maxLevels = 2  →  keeps root (level 0) + direct children (level 1) only.
 *
 * Works on:
 *  - Raw mermaid text starting with "mindmap"
 *  - Markdown strings containing one or more ```mermaid blocks
 */
export function truncateMindmapToLevels(input: string, maxLevels = 2): string {
  const processMermaid = (mermaidText: string): string => {
    const lines = mermaidText.split('\n');
    const out: string[] = [];

    // Find the first content line after "mindmap" to determine root indent
    const mmIdx = lines.findIndex(l => l.trim() === 'mindmap');
    if (mmIdx === -1) return mermaidText; // not a mindmap block

    out.push(lines[mmIdx]); // push "mindmap"

    // Detect root indentation (first non-empty line after "mindmap")
    let rootIndent = -1;
    for (let i = mmIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim() === '') continue;
      rootIndent = l.length - l.trimStart().length;
      break;
    }
    if (rootIndent === -1) return mermaidText;

    // Detect indent unit from the first level-1 child
    let indentUnit = 2; // fallback
    for (let i = mmIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim() === '') continue;
      const curIndent = l.length - l.trimStart().length;
      if (curIndent > rootIndent) {
        indentUnit = curIndent - rootIndent;
        break;
      }
    }

    for (let i = mmIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim() === '') continue;
      const indent = l.length - l.trimStart().length;
      const level = Math.round((indent - rootIndent) / indentUnit);
      // level 0 = root node, level 1 = direct children → keep both
      if (level < maxLevels) {
        out.push(l);
      }
    }
    return out.join('\n');
  };

  // Handle markdown files that wrap the mermaid in a ```mermaid code fence
  if (input.includes('```mermaid')) {
    return input.replace(/```mermaid([\s\S]*?)```/g, (_match, body) => {
      // body already contains the full mermaid content (including "mindmap" keyword)
      // do NOT prepend "mindmap" again — that shifts all levels up by one
      const processed = processMermaid(body);
      return '```mermaid\n' + processed + '\n```';
    });
  }

  // Raw mermaid text (no code fence)
  return processMermaid(input);
}

export function getResourceContentUrl(
  subject: string,
  chapterNumber: number,
  resourceName: string,
  level: DifficultyLevel = 'intermediate',
): string {
  const chDir = getChapterDir(subject, chapterNumber);
  const subjectBase = getSubjectBaseUrl(subject);
  const isShared = SHARED_RESOURCE_FILES.has(resourceName);
  if (isShared) {
    return `${subjectBase}/${chDir}/${resourceName}`;
  }
  return `${subjectBase}/${chDir}/${level}/${resourceName}`;
}

export function cleanAiPreamble(text: string): string {
  const preamblePatterns = [
    /^here is (a |an )?(standard|beginner|advanced|intermediate|easy|detailed|brief|short|long)?[-\s\w]*?(summary|guide|overview|explanation|analysis|notes|answer|question bank|study guide|flashcard|podcast script|mindmap|learning path)[^\n]*:\s*\n*/im,
    /^here are (some |the )?(standard|beginner|advanced|intermediate|easy|detailed|brief|short|long)?[-\s\w]*?(flashcards?|questions?|notes?|answers?|summaries|guides?)[^\n]*:\s*\n*/im,
    /^below is (a |an )?[^\n]*:\s*\n*/im,
    /^the following is (a |an )?[^\n]*:\s*\n*/im,
    /^this is (a |an )?[^\n]*:\s*\n*/im,
    /^i('ve| have) (created|prepared|written|generated)[^\n]*:\s*\n*/im,
    /^sure[,!]?[^\n]*:\s*\n*/im,
    /^certainly[,!]?[^\n]*:\s*\n*/im,
    /^of course[,!]?[^\n]*:\s*\n*/im,
    /^.*?(?:Persona:|Word\s+count:).*?(?:D_target|D_max)[^\n]*\n*(?:-{3,})?\n*/img,
  ];

  let cleaned = text.trim();
  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  return cleaned;
}

export function resolveRelativeUrl(baseUrl: string, relativePath: string): string {
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('/')) {
    return relativePath;
  }
  const baseParts = baseUrl.substring(0, baseUrl.lastIndexOf('/')).split('/');
  const relParts = relativePath.split('/');
  for (const part of relParts) {
    if (part === '.' || !part) continue;
    if (part === '..') {
      if (baseParts.length > 0) baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }
  return baseParts.join('/');
}

export async function getResourceContent(
  subject: string,
  chapterNumber: number,
  resourceName: string,
  level: DifficultyLevel = 'intermediate',
  videoDir?: string,
): Promise<string> {
  await getManifest();
  const chDir = getChapterDir(subject, chapterNumber);
  const subjectBase = getSubjectBaseUrl(subject);

  if (
    BACKEND_SUBJECTS.has(subject) &&
    (resourceName === 'summary.md' || resourceName === 'detailed_view.md')
  ) {
    const guide = await fetchBackendStudyGuide(subject, level);
    const text = resourceName === 'summary.md' ? guide?.quick_study : guide?.detailed_notes;
    if (text && text.trim()) return cleanAiPreamble(text);
  }

  const tryFetch = async (url: string, fileName: string): Promise<string | null> => {
    try {
      const fetchUrl = import.meta.env.DEV ? `${url}?t=${Date.now()}` : url;
      const res = await fetch(fetchUrl, { cache: 'no-cache' });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) return null;
      let text = await res.text();
      if (fileName === 'mindmap.json') {
        return text;
      }
      
      let isFirstImage = true;
      text = text.replace(/!\[(.*?)\]\((?!http|\/|data:)(.*?)\)/g, (match, alt, relPath) => {
        const lowerAlt = alt.toLowerCase();
        const lowerRel = relPath.toLowerCase();

        const parts = lowerRel.split('/');
        let isTopMindmapOverview = false;
        if (parts.length >= 2) {
          const fileName = parts[parts.length - 1].replace(/\.(png|jpg|jpeg|svg)$/, '');
          if (
            fileName === 'marketing_mind_map' ||
            fileName === 'global_marketing' ||
            fileName === 'service_marketing' ||
            fileName.startsWith('pillar_001')
          ) {
            isTopMindmapOverview = true;
          }
        }
        if (
          isFirstImage ||
          isTopMindmapOverview ||
          lowerAlt.includes('mindmap overview') ||
          lowerAlt.includes('mind map') ||
          lowerAlt.endsWith('mindmap')
        ) {
          if (resourceName === 'summary.md' || resourceName === 'detailed_view.md') {
            isFirstImage = false;
            return ''; 
          }
        }

        return `![${alt}](${resolveRelativeUrl(url, relPath)})`;
      });
      return cleanAiPreamble(text);
    } catch {
      return null;
    }
  };

  for (const fileName of getResourceFileCandidates(resourceName, level, videoDir)) {
    const leveledResult = await tryFetch(`${subjectBase}/${chDir}/${level}/${fileName}`, fileName);
    if (leveledResult !== null) return leveledResult;

    const rootResult = await tryFetch(`${subjectBase}/${chDir}/${fileName}`, fileName);
    if (rootResult !== null) return rootResult;
  }

  return `Content not available.`;
}

export interface MastermindsMindmapEntry {
  prefix: string;
  folder?: string;
  baseTemplate?: string;
}

export const MASTERMINDS_MINDMAP_MAP: Record<string, Record<number, MastermindsMindmapEntry>> = {
  advanced_financial_management: {
    1:  { folder: 'derivate_futures', prefix: 'futures' },
    2:  { folder: 'options',          prefix: 'options' },
    15: { folder: 'mutual_funds',     prefix: 'mutual_funds' },
  },
  management: {
    1: { prefix: 'ch1', baseTemplate: 'anu/chapter_1/{level}' },
    2: { prefix: 'ch2', baseTemplate: 'anu/chapter_2/{level}' },
  },
  anu_physics: {
    4: { prefix: 'aqm_ch4', baseTemplate: 'chapter_04/{level}' },
  },
  anu_characterization: {
    5: { prefix: 'characterization', baseTemplate: 'chapter_05/{level}' },
  },
};

export function mmBase(base: string, entry: MastermindsMindmapEntry, level: DifficultyLevel): string {
  if (entry.baseTemplate) {
    return `${base}/${entry.baseTemplate.replace('{level}', level)}`;
  }
  return `${base}/mindmaps-masterminds/mindmaps/${entry.folder}/${level}`;
}

export function getMastermindsConceptUrl(
  subjectId: string,
  chapterNumber: number,
  level: DifficultyLevel,
  nodeId: string,
): string | null {
  const entry = MASTERMINDS_MINDMAP_MAP[subjectId]?.[chapterNumber];
  if (!entry) return null;
  const base = getSubjectBaseUrl(subjectId);
  const root = mmBase(base, entry, level);

  if (nodeId.startsWith('concept_')) {
    const n = nodeId.slice('concept_'.length);
    return `${root}/concept_${entry.prefix}_${n}.md`;
  }
  if (nodeId.startsWith('subtopic_')) {
    const id = nodeId.slice('subtopic_'.length);
    return `${root}/subtopic_${entry.prefix}_${id}.md`;
  }
  if (nodeId.startsWith('topic_')) {
    const id = nodeId.slice('topic_'.length);
    return `${root}/topic_${entry.prefix}_${id}.md`;
  }
  return `${root}/index.md`;
}

export function getMastermindsDeepDiveUrl(
  subjectId: string,
  chapterNumber: number,
  level: DifficultyLevel,
  conceptN: string,
): string | null {
  const entry = MASTERMINDS_MINDMAP_MAP[subjectId]?.[chapterNumber];
  if (!entry) return null;
  const base = getSubjectBaseUrl(subjectId);
  const root = mmBase(base, entry, level);
  return `${root}/deep_dive_${entry.prefix}_${conceptN}.md`;
}

export function getDeepDiveToolUrl(subjectId: string, chapterNumber: number): string | null {
  const root = `${BASE}/Deep Dive_Detailed view`;
  if (subjectId === 'anu_physics' && chapterNumber === 4) {
    return `${root}/physics/quantum_mechanics_qed_deep_dive_chap4.md`;
  }
  if (subjectId === 'anu_characterization' && chapterNumber === 5) {
    return `${root}/physics/material_characterization_deep_dive_chap5.md`;
  }
  if (subjectId === 'management') {
    if (chapterNumber === 1) return `${root}/mba/Nagarjun_MBA_cahp1.md`;
    if (chapterNumber === 2) return `${root}/mba/Nagarjun_MBA_chap2_crm.md`;
  }

  return null;
}
