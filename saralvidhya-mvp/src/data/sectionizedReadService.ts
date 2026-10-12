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
 * Extracts a concise short title for the sidebar list
 */
function getShortTitle(rawTitle: string): string {
  let cleaned = rawTitle
    .replace(/^#+\s*/, '')
    .replace(/^Module\s*\d+\s*:\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^[🎯📋🔍🎴]\s*/, '')
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
  const trackFolder = track === 'detailed' ? 'detailed_study' : 'quick_study';
  const baseUrl = import.meta.env.BASE_URL || '/';

  // Path to local files in public/generated_resources/
  const mdUrl = `${baseUrl}generated_resources/mlrit/dbms/chapter_01/learn/read/${trackFolder}/${normPersona}.md`.replace(/\/\//g, '/');
  const qcUrl = `${baseUrl}generated_resources/mlrit/dbms/chapter_01/learn/read/quick_check/${trackFolder}/${normPersona}.json`.replace(/\/\//g, '/');
  const studyJsonUrl = `${baseUrl}generated_resources/mlrit/dbms/chapter_01/learn/read/${trackFolder}/${normPersona}.json`.replace(/\/\//g, '/');

  try {
    const [mdRes, qcRes, studyJsonRes] = await Promise.all([
      fetch(mdUrl),
      fetch(qcUrl).catch(() => null),
      fetch(studyJsonUrl).catch(() => null),
    ]);

    if (!mdRes.ok) {
      console.warn('[sectionizedReadService] Failed to fetch markdown', mdUrl, mdRes.status);
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

    // Split markdown into sections by top-level `## `
    const rawParts = markdown.split(/(?=^##\s+)/m);
    const sections: ReadSection[] = [];

    // Check if Part 0 has meaningful text (Intro / Overview)
    const part0 = rawParts[0]?.trim() || '';
    const mainTitleMatch = part0.match(/^#\s+(.+)$/m);
    const chapterTitle = mainTitleMatch ? mainTitleMatch[1].trim() : 'Chapter Study Guide';

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

      const firstLineMatch = part.match(/^##\s+([^\n\r]+)/);
      const rawHeading = firstLineMatch ? firstLineMatch[1].trim() : `Section ${i}`;
      const cleanTitle = rawHeading.replace(/^[🎯📋🔍🎴]\s*/, '').trim();
      const shortTitle = getShortTitle(rawHeading);

      // Determine module match (M1 to M6)
      let matchedQuestion: QuickCheckQuestion | undefined;
      const modMatch = rawHeading.match(/Module\s*(\d+)/i) || rawHeading.match(/^(\d+)\./);
      let secNumber = sections.length + 1;
      if (modMatch) {
        const modNum = parseInt(modMatch[1], 10);
        secNumber = modNum;
        matchedQuestion = questions.find(q => q.module_id === `M${modNum}`) || questions[modNum - 1];
      }

      // Extract subtitle if present
      const subtitleMatch = part.match(/^(?:##[^\n]+\n+)([A-Z][^\n.]+—[^\n]+)/m);
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

    return {
      chapterTitle,
      track,
      persona: normPersona,
      sections,
      modules,
      figures,
      definitions,
    };
  } catch (e) {
    console.error('[sectionizedReadService] Error building sectionized data', e);
    return null;
  }
}
