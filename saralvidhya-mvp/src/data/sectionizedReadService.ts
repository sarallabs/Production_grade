import { DifficultyLevel } from './manifestService';

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

/**
 * Calculates estimated reading time based on word count
 */
function estimateReadingTime(text: string): number {
  const words = text.replace(/<[^>]+>/g, ' ').replace(/data:image\/[^\s)]+/g, '').trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 180);
  return Math.max(2, Math.min(15, minutes));
}

/**
 * Extracts clean heading text without markdown syntax or leading emojis
 */
function cleanHeadingText(text: string): string {
  return text
    .replace(/^#+\s*/, '')
    .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '')
    .replace(/^[🎯📋🔍🎴🖼️\s]+/u, '')
    .trim();
}

/**
 * Extracts a concise short title for the sidebar list
 */
function getShortTitle(rawTitle: string): string {
  let cleaned = cleanHeadingText(rawTitle)
    .replace(/^Module\s*\d+\s*:\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .trim();

  // If title has a colon or dash, use the primary topic
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

async function fetchFirstValid(candidates: string[]): Promise<Response | null> {
  for (const c of candidates) {
    try {
      const cleanUrl = c.replace(/([^:])\/\//g, '$1/');
      const res = await fetch(cleanUrl);
      if (res.ok) return res;
    } catch {
      // try next
    }
  }
  return null;
}

const ANGRAU_CHAPTER_NAMES: Record<number, string> = {
  1: 'Insect Digestive System',
  2: 'Metamorphosis & Diapause',
  3: 'Weathering of Rocks and Minerals',
  4: 'Pollination, Pollinizers & Parthenocarpy',
};

// Bounded LRU cache: keeps only up to 4 most recently viewed chapters in memory (~10-15MB max)
const READ_CACHE_MAX_ENTRIES = 4;
const sectionizedReadCache = new Map<string, SectionizedChapterData>();

/**
 * Loads sectionized reading data and pairs it with Quick Check questions
 */
export async function getSectionizedReadData(
  subjectId: string,
  chapterNumber: number,
  track: 'quick' | 'detailed' = 'quick',
  persona: DifficultyLevel = 'intermediate'
): Promise<SectionizedChapterData | null> {
  const pStr = (persona as string) || 'intermediate';
  const normPersona = pStr === 'beginner' || pStr === 'easy' ? 'beginner' : pStr === 'advanced' || pStr === 'hard' ? 'advanced' : 'intermediate';

  // Instant in-memory cache lookup
  const cacheKey = `${subjectId || ''}:${chapterNumber}:${track}:${normPersona}`;
  if (sectionizedReadCache.has(cacheKey)) {
    const cached = sectionizedReadCache.get(cacheKey)!;
    // Move to end (most recently used)
    sectionizedReadCache.delete(cacheKey);
    sectionizedReadCache.set(cacheKey, cached);
    return cached;
  }

  const trackFolder = track === 'detailed' ? 'detailed_study' : 'quick_study';
  const trackFolderAlt = track === 'detailed' ? 'detailed' : 'quick';
  const baseUrl = import.meta.env.BASE_URL || '/';

  const normSub = (subjectId || '').toLowerCase();
  const isAngrau = normSub === 'ento_131' || normSub.includes('ento') || normSub.includes('angrau');
  const chDir = `chapter_${String(chapterNumber || 1).padStart(2, '0')}`;

  const mdCandidates: string[] = [];
  const qcCandidates: string[] = [];
  const studyJsonCandidates: string[] = [];

  if (isAngrau) {
    const subPaths = [
      `generated_resources/angrau/entomology/${chDir}`,
      `generated_resources/angrau/${chDir}`,
    ];
    for (const sp of subPaths) {
      mdCandidates.push(
        `${baseUrl}${sp}/learn/read/${trackFolder}/${normPersona}.md`,
        `${baseUrl}${sp}/read/${trackFolderAlt}/${normPersona}.md`,
        `${baseUrl}${sp}/read/${trackFolder}/${normPersona}.md`
      );
      qcCandidates.push(
        `${baseUrl}${sp}/learn/read/quick_check/${trackFolder}/${normPersona}.json`,
        `${baseUrl}${sp}/read/quick_check/${trackFolder}/${normPersona}.json`,
        `${baseUrl}${sp}/read/Quick Check/${trackFolder === 'detailed_study' ? 'Detailed_Study' : 'Quick_Study'}/${normPersona}.json`
      );
    }
  } else {
    const subPaths = [
      `generated_resources/mlrit/dbms/${chDir}`,
      `generated_resources/mlrit/dbms/chapter_01`,
    ];
    for (const sp of subPaths) {
      mdCandidates.push(
        `${baseUrl}${sp}/learn/read/${trackFolder}/${normPersona}.md`,
        `${baseUrl}${sp}/read/${trackFolder}/${normPersona}.md`
      );
      qcCandidates.push(
        `${baseUrl}${sp}/learn/read/quick_check/${trackFolder}/${normPersona}.json`,
        `${baseUrl}${sp}/read/quick_check/${trackFolder}/${normPersona}.json`
      );
      studyJsonCandidates.push(
        `${baseUrl}${sp}/learn/read/${trackFolder}/${normPersona}.json`,
        `${baseUrl}${sp}/read/${trackFolder}/${normPersona}.json`
      );
    }
  }

  try {
    const [mdRes, qcRes, studyJsonRes] = await Promise.all([
      fetchFirstValid(mdCandidates),
      fetchFirstValid(qcCandidates),
      studyJsonCandidates.length ? fetchFirstValid(studyJsonCandidates) : Promise.resolve(null),
    ]);

    if (!mdRes || !mdRes.ok) {
      console.warn('[sectionizedReadService] Failed to fetch markdown for', subjectId, chapterNumber, mdCandidates);
      return null;
    }

    const markdown = await mdRes.text();
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
        if (Array.isArray(sData.verbatim_definitions_preserved)) definitions = sData.verbatim_definitions_preserved;
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

    // Split markdown by section headers (## or # with number/module, or standard ##)
    let rawParts = markdown.split(/(?=^#{1,2}\s+(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*\d+\.|\bModule\s*\d+|\bUnit\s*\d+))/miu);
    if (rawParts.length <= 1) {
      rawParts = markdown.split(/(?=^##\s+)/m);
    }
    const sections: ReadSection[] = [];

    // Check if Part 0 has meaningful text (Intro / Overview)
    const part0 = rawParts[0]?.trim() || '';
    const mainTitleMatch = part0.match(/^#\s+(.+)$/m);
    const fallbackChapterTitle = isAngrau && ANGRAU_CHAPTER_NAMES[chapterNumber] ? ANGRAU_CHAPTER_NAMES[chapterNumber] : 'Chapter Study Guide';
    const chapterTitle = mainTitleMatch ? mainTitleMatch[1].trim() : fallbackChapterTitle;

    // If Part 0 has body text besides just the # Title, treat it as Section 0
    const part0Body = part0.replace(/^#\s+[^\n]+(\r?\n)*/, '').trim();
    if (part0Body.length > 50) {
      sections.push({
        id: 'sec-overview',
        sectionNumber: 0,
        title: 'Architectural Blueprint & Regional Partitioning',
        shortTitle: 'Overview',
        subtitle: 'Foundational concepts and curriculum overview',
        readTimeMinutes: estimateReadingTime(part0Body),
        content: part0,
        quickCheck: undefined,
      });
    }

    // Process parts starting from index 1 (or 0 if part0 was empty)
    const startIndex = 1;
    for (let i = startIndex; i < rawParts.length; i++) {
      const part = rawParts[i].trim();
      if (!part) continue;

      const firstLineMatch = part.match(/^#{1,2}\s+([^\n\r]+)/);
      const rawHeading = firstLineMatch ? firstLineMatch[1].trim() : `Section ${i}`;
      const cleanTitle = cleanHeadingText(rawHeading);
      const shortTitle = getShortTitle(rawHeading);

      // Determine module match (M1 to M6)
      let matchedQuestion: QuickCheckQuestion | undefined;
      const cleanHead = cleanHeadingText(rawHeading);
      const modMatch = cleanHead.match(/Module\s*(\d+)/i) || cleanHead.match(/^(\d+)\./) || cleanHead.match(/\bTopic\s*(\d+)/i);
      let secNumber = sections.length + 1;
      if (modMatch) {
        const modNum = parseInt(modMatch[1], 10);
        secNumber = modNum;
        matchedQuestion = questions.find(q => q.module_id === `M${modNum}`) || questions[modNum - 1];
      } else if (questions[i - 1]) {
        matchedQuestion = questions[i - 1];
      }

      // Extract subtitle if present
      const subtitleMatch = part.match(/^(?:#{1,2}[^\n]+\n+)([A-Z][^\n.]+—[^\n]+)/m);
      const subtitle = subtitleMatch ? subtitleMatch[1].trim() : undefined;

      sections.push({
        id: `sec-${i}`,
        sectionNumber: secNumber,
        title: cleanTitle,
        shortTitle,
        subtitle,
        readTimeMinutes: estimateReadingTime(part),
        content: part,
        quickCheck: matchedQuestion,
      });
    }

    if (!modules.length) {
      modules = sections
        .filter(s => s.sectionNumber > 0)
        .map(s => ({
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

    // Store in bounded LRU cache (evict oldest if over capacity)
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

