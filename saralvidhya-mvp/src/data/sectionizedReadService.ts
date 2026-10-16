import {
  DifficultyLevel,
  getManifest,
  getChapters,
  getRegistryChapterData,
  getSubjectBaseUrl,
  getLocalSubjectBaseUrl,
  getChapterDir,
} from './manifestService';

export interface QuickCheckOption {
  key: string;
  text: string;
  is_correct: boolean;
}

export interface QuickCheckQuestion {
  module_id: string;
  module_title: string;
  type: string;
  prompt_type: string;
  stem: string;
  options: QuickCheckOption[];
  correct_answer: string;
  rationale: string;
  bloom_level?: string;
  alteration_type?: string;
}

export interface CourseModuleInfo {
  module: number;
  title: string;
  shortTitle: string;
  sectionNumber: number;
  visuals?: string[];
}

export interface ReadFigure {
  figure_no: string;
  title: string;
  module: string;
  image_tag?: string;
}

export interface ReadSection {
  id: string;
  sectionNumber: number;
  title: string;
  shortTitle: string;
  subtitle?: string;
  readTimeMinutes: number;
  content: string;
  quickCheck?: QuickCheckQuestion;
  quickChecks?: QuickCheckQuestion[];
}

export interface SectionizedChapterData {
  chapterTitle: string;
  track: 'quick' | 'detailed';
  persona: string;
  sections: ReadSection[];
  modules?: CourseModuleInfo[];
  figures?: ReadFigure[];
  definitions?: string[];
}

function estimateReadingTime(text: string): number {
  const words = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/data:image\/[^\s)]+/g, '')
    .trim()
    .split(/\s+/).length;
  const minutes = Math.ceil(words / 180);
  return Math.max(2, Math.min(15, minutes));
}

function cleanHeadingText(text: string): string {
  return text
    .replace(/^#+\s*/, '')
    .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '')
    .replace(/^[🎯📋🔍🎴🖼️\s]+/u, '')
    .trim();
}

function getShortTitle(rawTitle: string): string {
  let cleaned = cleanHeadingText(rawTitle)
    .replace(/^Module\s*\d+\s*:\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .trim();

  if (cleaned.includes(':')) {
    cleaned = cleaned.split(':')[0].trim();
  } else if (cleaned.includes('—')) {
    cleaned = cleaned.split('—')[0].trim();
  }

  if (cleaned.length > 28) {
    cleaned = `${cleaned.slice(0, 26)}…`;
  }
  return cleaned;
}

async function fetchFirstValid(
  candidates: string[],
  expectJson = false
): Promise<Response | null> {
  for (const c of candidates) {
    if (!c) continue;
    try {
      const cleanUrl = c.startsWith('http') ? c : c.replace(/([^:])\/\//g, '$1/');
      const res = await fetch(cleanUrl);
      if (!res.ok) continue;
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('text/html')) continue;
      const bodyPeek = (await res.clone().text()).trim();
      if (
        !bodyPeek ||
        bodyPeek.startsWith('<!DOCTYPE') ||
        bodyPeek.startsWith('<html') ||
        bodyPeek.startsWith('<script')
      ) {
        continue;
      }
      if (expectJson && !bodyPeek.startsWith('{') && !bodyPeek.startsWith('[')) {
        continue;
      }
      return res;
    } catch {
      // try next
    }
  }
  return null;
}

const READ_CACHE_MAX_ENTRIES = 6;
const sectionizedReadCache = new Map<string, SectionizedChapterData>();

export function getCachedSectionizedReadDataSync(
  subjectId: string,
  chapterNumber: number,
  track: 'quick' | 'detailed' = 'quick',
  persona: DifficultyLevel = 'intermediate'
): SectionizedChapterData | null {
  const pStr = (persona as string) || 'intermediate';
  const normPersona =
    pStr === 'beginner' || pStr === 'easy'
      ? 'beginner'
      : pStr === 'advanced' || pStr === 'hard'
      ? 'advanced'
      : 'intermediate';
  const cacheKey = `v3:${subjectId || ''}:${chapterNumber}:${track}:${normPersona}`;
  return sectionizedReadCache.get(cacheKey) || null;
}

/**
 * Loads sectionized reading data and pairs it with Quick Check questions using v2 signed URLs
 * and Cloud Run API endpoints (with zero hardcoded tenant/subject paths).
 */
export async function getSectionizedReadData(
  subjectId: string,
  chapterNumber: number,
  track: 'quick' | 'detailed' = 'quick',
  persona: DifficultyLevel = 'intermediate'
): Promise<SectionizedChapterData | null> {
  const pStr = (persona as string) || 'intermediate';
  const normPersona =
    pStr === 'beginner' || pStr === 'easy'
      ? 'beginner'
      : pStr === 'advanced' || pStr === 'hard'
      ? 'advanced'
      : 'intermediate';

  const cacheKey = `v3:${subjectId || ''}:${chapterNumber}:${track}:${normPersona}`;
  if (sectionizedReadCache.has(cacheKey)) {
    const cached = sectionizedReadCache.get(cacheKey)!;
    sectionizedReadCache.delete(cacheKey);
    sectionizedReadCache.set(cacheKey, cached);
    return cached;
  }

  const [manifest, regCh] = await Promise.all([
    getManifest(),
    getRegistryChapterData(subjectId, chapterNumber),
  ]);
  const manifestChapter = getChapters(manifest, subjectId).find((c) => c.number === chapterNumber);

  const trackFolder = track === 'detailed' ? 'detailed_study' : 'quick_study';
  const trackFolderAlt = track === 'detailed' ? 'detailed' : 'quick';

  const mdCandidates: string[] = [];
  const qcCandidates: string[] = [];
  const studyJsonCandidates: string[] = [];

  // 1. Primary Cloud-Native Path: V4 Signed URLs from v2 Registry Chapter files
  const files = regCh?.files || {};
  const hasCloudFileMap = Object.keys(files).length > 0;
  const registryChapterTitle =
    regCh?.chapter?.title || manifestChapter?.title || manifestChapter?.name;

  const subjectBase = getSubjectBaseUrl(subjectId);
  const localBase = getLocalSubjectBaseUrl(subjectId);
  const chDir = getChapterDir(subjectId, chapterNumber);
  const canonicalChDir = `chapter_${String(chapterNumber).padStart(2, '0')}`;
  const lowerSub = (subjectId || '').toLowerCase();
  const explicitLocalBase =
    lowerSub.includes('dbms')
      ? '/generated_resources/mlrit/dbms'
      : lowerSub.includes('ento') || lowerSub.includes('hort') || lowerSub.includes('ssac')
      ? '/generated_resources/angrau/entomology'
      : localBase;

  const mdKeys = [
    `read/${trackFolderAlt}/${normPersona}.md`,
    `learn/read/${trackFolder}/${normPersona}.md`,
    `read/${trackFolder}/${normPersona}.md`,
  ];
  for (const k of mdKeys) {
    if (files[k]) mdCandidates.push(files[k]);
  }

  const qcKeys = [
    `read/quick_check/${trackFolderAlt}/${normPersona}.json`,
    `learn/read/quick_check/${trackFolder}/${normPersona}.json`,
    `read/quick_check/${trackFolder}/${normPersona}.json`,
  ];
  for (const k of qcKeys) {
    if (files[k]) qcCandidates.push(files[k]);
  }

  const studyJsonKeys = [
    `read/${trackFolderAlt}/${normPersona}.json`,
    `learn/read/${trackFolder}/${normPersona}.json`,
    `read/${trackFolder}/${normPersona}.json`,
  ];
  for (const k of studyJsonKeys) {
    if (files[k]) studyJsonCandidates.push(files[k]);
  }

  // 2. Fallback relative to dynamic Cloud Run subjectBase and static localBase
  mdCandidates.push(
    `${subjectBase}/${chDir}/read/${trackFolderAlt}?persona=${normPersona}`,
    `${subjectBase}/${chDir}/read/${trackFolderAlt}/${normPersona}.md`,
    `${subjectBase}/${chDir}/learn/read/${trackFolder}/${normPersona}.md`,
    `${subjectBase}/${chDir}/read/${trackFolder}/${normPersona}.md`,
    `${localBase}/${chDir}/read/${trackFolderAlt}/${normPersona}.md`,
    `${localBase}/${chDir}/learn/read/${trackFolder}/${normPersona}.md`,
    `${localBase}/${chDir}/learn/read/${trackFolderAlt}/${normPersona}.md`
  );
  qcCandidates.push(
    `${subjectBase}/${canonicalChDir}/read/quick_check/${trackFolderAlt}/${normPersona}.json?v=4qc3`,
    `${subjectBase}/${canonicalChDir}/read/quick_check/${trackFolder}/${normPersona}.json?v=4qc3`,
    `${subjectBase}/${chDir}/read/quick_check/${trackFolderAlt}/${normPersona}.json?v=4qc3`,
    `${subjectBase}/${chDir}/learn/read/quick_check/${trackFolder}/${normPersona}.json?v=4qc3`,
    `${explicitLocalBase}/${canonicalChDir}/read/quick_check/${trackFolderAlt}/${normPersona}.json?v=4qc3`,
    `${explicitLocalBase}/${canonicalChDir}/learn/read/quick_check/${trackFolder}/${normPersona}.json?v=4qc3`,
    `${explicitLocalBase}/${canonicalChDir}/read/quick_check/${trackFolder}/${normPersona}.json?v=4qc3`,
    `${localBase}/${chDir}/read/quick_check/${trackFolderAlt}/${normPersona}.json?v=4qc3`,
    `${localBase}/${chDir}/learn/read/quick_check/${trackFolder}/${normPersona}.json?v=4qc3`,
    `${localBase}/${chDir}/read/quick_check/${trackFolder}/${normPersona}.json?v=4qc3`,
    `${localBase}/${canonicalChDir}/learn/read/quick_check/${trackFolder}/${normPersona}.json?v=4qc3`,
    `${localBase}/${chDir}/learn/read/quick_check/${trackFolderAlt}/${normPersona}.json?v=4qc3`
  );
  if (!hasCloudFileMap) {
    studyJsonCandidates.push(
      `${subjectBase}/${chDir}/read/${trackFolderAlt}/${normPersona}.json`,
      `${subjectBase}/${chDir}/learn/read/${trackFolder}/${normPersona}.json`,
      `${localBase}/${chDir}/learn/read/${trackFolder}/${normPersona}.json`,
      `${localBase}/${chDir}/learn/read/${trackFolderAlt}/${normPersona}.json`
    );
  }

  try {
    const [mdRes, qcRes, studyJsonRes] = await Promise.all([
      fetchFirstValid(mdCandidates, false),
      fetchFirstValid(qcCandidates, true),
      studyJsonCandidates.length
        ? fetchFirstValid(studyJsonCandidates, true)
        : Promise.resolve(null),
    ]);

    if (!mdRes || !mdRes.ok) {
      console.warn(
        '[sectionizedReadService] Failed to fetch markdown for',
        subjectId,
        chapterNumber
      );
      return null;
    }

    let markdown = await mdRes.text();
    // Rewrite relative image paths (../../extracted_images/X or ../Mindmaps/X) to Cloud Run subjectBase
    markdown = markdown.replace(
      /!\[([^\]]*)\]\(\.\.\/\.\.\/([^)]+)\)/g,
      (_, alt, path) => `![${alt}](${subjectBase}/${chDir}/${path})`
    );
    markdown = markdown.replace(
      /!\[([^\]]*)\]\(\.\.\/([^)]+)\)/g,
      (_, alt, path) => `![${alt}](${subjectBase}/${chDir}/${path})`
    );

    let questions: QuickCheckQuestion[] = [];
    let figures: ReadFigure[] = [];
    let definitions: string[] = [];

    if (qcRes && qcRes.ok) {
      try {
        const qcData = await qcRes.json();
        questions = Array.isArray(qcData.questions) ? qcData.questions : [];
      } catch (err) {
        console.warn('[sectionizedReadService] Failed to parse quick check JSON', err);
      }
    }

    let modules: CourseModuleInfo[] = [];
    if (studyJsonRes && studyJsonRes.ok) {
      try {
        const sData = await studyJsonRes.json();
        if (Array.isArray(sData.figures)) figures = sData.figures;
        if (Array.isArray(sData.verbatim_definitions_preserved)) {
          definitions = sData.verbatim_definitions_preserved;
        }
        if (Array.isArray(sData.sections)) {
          modules = sData.sections.map((m: any) => ({
            module: m.module,
            title: m.title,
            shortTitle: getShortTitle(m.title),
            sectionNumber: m.module,
            visuals: m.visuals || [],
          }));
        }
      } catch (err) {
        console.warn('[sectionizedReadService] Failed to parse study JSON', err);
      }
    }

    // Prefer single-# numbered headings when a document uses # 1. ... for top-level modules
    const h1Parts = markdown.split(
      /(?=^#\s+(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*\d+\.(?!\d)|\bModule\s*\d+|\bUnit\s*\d+))/imu
    );
    let rawParts =
      h1Parts.length >= 4
        ? h1Parts
        : markdown.split(
            /(?=^#{1,2}\s+(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*\d+\.(?!\d)|\bModule\s*\d+|\bUnit\s*\d+))/imu
          );
    if (rawParts.length <= 1) {
      rawParts = markdown.split(/(?=^##\s+)/m);
    }
    const sections: ReadSection[] = [];

    const part0 = rawParts[0]?.trim() || '';
    const mainTitleMatch = part0.match(/^#\s+(.+)$/m);
    const fallbackChapterTitle = registryChapterTitle || `Chapter ${chapterNumber}`;
    const chapterTitle = mainTitleMatch ? mainTitleMatch[1].trim() : fallbackChapterTitle;

    // Clean any top-level chapter title from part0Body so it can be prepended to Section 1 without repeating
    const part0Body = part0
      .replace(/^#\s+[^\n\r]+(\r?\n)*/, '')
      .replace(/^#{1,2}\s+/gm, '### ')
      .trim();

    const startIndex = 1;
    for (let i = startIndex; i < rawParts.length; i++) {
      const part = rawParts[i].trim();
      if (!part) continue;

      const firstLineMatch = part.match(/^#{1,2}\s+([^\n\r]+)/);
      const rawHeading = firstLineMatch ? firstLineMatch[1].trim() : `Section ${i}`;
      const cleanTitle = cleanHeadingText(rawHeading);
      const shortTitle = getShortTitle(rawHeading);

      let matchedQuestions: QuickCheckQuestion[] = [];
      const cleanHead = cleanHeadingText(rawHeading);
      const modMatch =
        cleanHead.match(/Module\s*(\d+)/i) ||
        cleanHead.match(/^(\d+)\./) ||
        cleanHead.match(/\bTopic\s*(\d+)/i);
      let secNumber = sections.length + 1;
      if (modMatch) {
        const modNum = parseInt(modMatch[1], 10);
        secNumber = modNum;
        matchedQuestions = questions.filter((q) => q.module_id === `M${modNum}`);
        if (matchedQuestions.length === 0 && questions[modNum - 1]) {
          matchedQuestions = [questions[modNum - 1]];
        }
      } else {
        matchedQuestions = questions.filter((q) => q.module_id === `M${i}`);
        if (matchedQuestions.length === 0 && questions[i - 1]) {
          matchedQuestions = [questions[i - 1]];
        }
      }

      const subtitleMatch = part.match(/^(?:#{1,2}[^\n]+\n+)([A-Z][^\n.]+—[^\n]+)/m);
      const subtitle = subtitleMatch ? subtitleMatch[1].trim() : undefined;

      // Strip the leading section heading (and optional extracted subtitle) from content so it never repeats
      let sectionBody = part.replace(/^#{1,2}\s+[^\n\r]+(\r?\n)*/, '').trim();
      if (subtitle && sectionBody.startsWith(subtitle)) {
        sectionBody = sectionBody.slice(subtitle.length).trim();
      }
      if (i === startIndex && part0Body.length > 50) {
        sectionBody = `${part0Body}\n\n---\n\n${sectionBody}`;
      }

      sections.push({
        id: `sec-${i}`,
        sectionNumber: secNumber,
        title: cleanTitle,
        shortTitle,
        subtitle,
        readTimeMinutes: estimateReadingTime(sectionBody),
        content: sectionBody,
        quickCheck: matchedQuestions[0],
        quickChecks: matchedQuestions,
      });
    }

    if (!modules.length) {
      modules = sections
        .filter((s) => s.sectionNumber > 0)
        .map((s) => ({
          module: s.sectionNumber,
          title: s.title,
          shortTitle: s.shortTitle,
          sectionNumber: s.sectionNumber,
        }));
    }

    const result: SectionizedChapterData = {
      chapterTitle,
      track,
      persona: normPersona,
      sections,
      modules,
      figures,
      definitions,
    };

    if (sectionizedReadCache.size >= READ_CACHE_MAX_ENTRIES) {
      const oldestKey = sectionizedReadCache.keys().next().value;
      if (oldestKey) sectionizedReadCache.delete(oldestKey);
    }
    sectionizedReadCache.set(cacheKey, result);

    return result;
  } catch (e) {
    console.error('[sectionizedReadService] Error building sectionized data', e);
    return null;
  }
}
