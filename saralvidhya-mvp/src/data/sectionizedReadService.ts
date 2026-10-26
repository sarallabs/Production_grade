import {
  DifficultyLevel,
  getManifest,
  getChapters,
  getRegistryChapterData,
  getSubjectBaseUrl,
  getLocalSubjectBaseUrl,
  getChapterDir,
} from './manifestService';
import {
  extractInlineDataImages,
  stripInlineImageTokens,
} from '@/utils/inlineImageStore';

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

export function estimateReadingTime(text: string): number {
  const words = stripInlineImageTokens(text || '')
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/).length;
  const minutes = Math.ceil(words / 180);
  return Math.max(2, Math.min(15, minutes));
}

function cleanPlainText(raw: string): string {
  return stripInlineImageTokens(raw || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_`~#>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateStatement(text: string, maxLen = 145): string {
  const cleaned = cleanPlainText(text).replace(/^[-•:–—\s]+/, '').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const cut = cleaned.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:\s]+$/, '') + '…';
}

/**
 * Generates 3 context-specific QuickCheckQuestion items directly from a mindmap
 * artifact's title and markdown content when pre-authored JSON quick checks are absent.
 */
export function generateQuickCheckQuestionsFromMarkdown(
  title: string,
  markdown: string,
  moduleId = 'M1'
): QuickCheckQuestion[] {
  const cleanTitle = cleanHeadingText(title || 'Topic Overview') || 'Topic Overview';
  const rawLines = (markdown || '')
    .replace(/```[\s\S]*?```/g, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('![') && !l.startsWith('|---'));

  // 1. Extract bolded term -> definition pairs
  const termPairs: Array<{ term: string; def: string }> = [];
  for (const line of rawLines) {
    const m = line.match(
      /^(?:[-*•]|\d+\.)?\s*\*\*([^*]{3,65})\*\*\s*(?::|—|–|-|\bis\b|\bare\b|\brefers to\b|\bmeans\b)\s*(.{20,240})/i
    );
    if (m) {
      const term = cleanPlainText(m[1]).replace(/[:—–-]+$/, '').trim();
      const def = truncateStatement(m[2], 145);
      if (
        term &&
        def.length >= 20 &&
        !term.toLowerCase().includes('marking scheme') &&
        !termPairs.some((p) => p.term.toLowerCase() === term.toLowerCase())
      ) {
        termPairs.push({ term, def });
      }
    }
  }

  // 2. Extract informative sentences & bullet points
  const keyStatements: Array<{ subheading: string; statement: string }> = [];
  let currentSubheading = cleanTitle;
  for (const line of rawLines) {
    const hMatch = line.match(/^#{1,4}\s+(.+)/);
    if (hMatch) {
      const h = cleanHeadingText(hMatch[1]);
      if (h && h.length >= 3 && h.length <= 70) currentSubheading = h;
      continue;
    }
    if (line.startsWith('|')) continue;
    const cleaned = truncateStatement(line.replace(/^(?:[-*•]|\d+\.)\s*/, ''), 145);
    if (
      cleaned.length >= 35 &&
      cleaned.length <= 150 &&
      !cleaned.endsWith('?') &&
      !keyStatements.some((s) => s.statement.toLowerCase() === cleaned.toLowerCase())
    ) {
      keyStatements.push({ subheading: currentSubheading, statement: cleaned });
    }
  }

  const genericDistractorPool = [
    `It operates independently of ${cleanTitle} and has no functional role in this process.`,
    `It only occurs under artificial laboratory conditions and never in standard ${cleanTitle} systems.`,
    `It reverses the primary mechanism of ${cleanTitle} by eliminating all structural components.`,
    `It is an obsolete classification that has been completely replaced by unrelated external factors.`,
    `It restricts ${cleanTitle} to a single static state without any regulatory or structural interaction.`,
    `It bypasses all intermediate stages of ${cleanTitle} and produces no measurable outcome.`,
  ];

  const buildOptions = (
    correctText: string,
    candidateDistractors: string[],
    seed: number
  ): { options: QuickCheckOption[]; correctKey: string } => {
    const keys = ['A', 'B', 'C', 'D'];
    const distinctDistractors: string[] = [];
    for (const d of [...candidateDistractors, ...genericDistractorPool]) {
      const cleanD = truncateStatement(d, 145);
      if (
        cleanD &&
        cleanD.toLowerCase() !== correctText.toLowerCase() &&
        !distinctDistractors.some((existing) => existing.toLowerCase() === cleanD.toLowerCase())
      ) {
        distinctDistractors.push(cleanD);
      }
      if (distinctDistractors.length >= 3) break;
    }
    while (distinctDistractors.length < 3) {
      distinctDistractors.push(genericDistractorPool[distinctDistractors.length % genericDistractorPool.length]);
    }

    const correctIdx = Math.abs(seed) % 4;
    const options: QuickCheckOption[] = [];
    let dIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        options.push({ key: keys[i], text: correctText, is_correct: true });
      } else {
        options.push({ key: keys[i], text: distinctDistractors[dIdx++], is_correct: false });
      }
    }
    return { options, correctKey: keys[correctIdx] };
  };

  const hashSeed = cleanTitle.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const questions: QuickCheckQuestion[] = [];

  // Use termPairs first (up to 2), then keyStatements to reach 3 questions
  for (let i = 0; i < Math.min(2, termPairs.length); i++) {
    const pair = termPairs[i];
    const otherDefs = termPairs
      .filter((_, idx) => idx !== i)
      .map((p) => p.def)
      .concat(keyStatements.slice(0, 3).map((s) => s.statement));
    const { options, correctKey } = buildOptions(pair.def, otherDefs, hashSeed + i);
    questions.push({
      module_id: moduleId,
      module_title: cleanTitle,
      type: 'mcq',
      prompt_type: 'concept_check',
      stem: `In the context of ${cleanTitle}, which of the following best describes "${pair.term}"?`,
      options,
      correct_answer: correctKey,
      rationale: `In ${cleanTitle}, **${pair.term}** is defined as: ${pair.def}`,
    });
  }

  let stmtIdx = 0;
  while (questions.length < 3 && stmtIdx < keyStatements.length) {
    const item = keyStatements[stmtIdx++];
    // Avoid duplicating a statement already used as a term definition
    if (questions.some((q) => q.options.some((o) => o.is_correct && o.text === item.statement))) {
      continue;
    }
    const { options, correctKey } = buildOptions(
      item.statement,
      genericDistractorPool.slice(questions.length),
      hashSeed + questions.length + stmtIdx
    );
    const focusLabel =
      item.subheading && item.subheading.toLowerCase() !== cleanTitle.toLowerCase()
        ? `${item.subheading} (${cleanTitle})`
        : cleanTitle;
    questions.push({
      module_id: moduleId,
      module_title: cleanTitle,
      type: 'mcq',
      prompt_type: 'concept_check',
      stem:
        questions.length === 0
          ? `Which of the following is a key concept or principle of ${focusLabel}?`
          : questions.length === 1
          ? `According to the notes on ${focusLabel}, which statement is accurate?`
          : `Which of the following accurately summarizes a key takeaway from ${focusLabel}?`,
      options,
      correct_answer: correctKey,
      rationale: `As explained in the notes on ${focusLabel}: ${item.statement}`,
    });
  }

  // Fallback if the markdown was extremely brief
  while (questions.length < 3) {
    const qNum = questions.length + 1;
    const fallbackCorrect =
      qNum === 1
        ? `${cleanTitle} provides the foundational structure, mechanisms, and principles covered in this topic.`
        : qNum === 2
        ? `Understanding the core components and relationships within ${cleanTitle} is essential for applying this concept accurately.`
        : `${cleanTitle} integrates key terminology, functional pathways, and practical applications within the chapter.`;
    const { options, correctKey } = buildOptions(fallbackCorrect, genericDistractorPool, hashSeed + qNum);
    questions.push({
      module_id: moduleId,
      module_title: cleanTitle,
      type: 'mcq',
      prompt_type: 'concept_check',
      stem: `Which statement best reflects the core focus of ${cleanTitle} (Check ${qNum})?`,
      options,
      correct_answer: correctKey,
      rationale: fallbackCorrect,
    });
  }

  return questions;
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

const READ_CACHE_MAX_ENTRIES = 12;
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

    let markdown = extractInlineDataImages(await mdRes.text());
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

      if (matchedQuestions.length === 0) {
        matchedQuestions = generateQuickCheckQuestionsFromMarkdown(
          cleanTitle,
          sectionBody,
          `M${secNumber}`
        );
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
