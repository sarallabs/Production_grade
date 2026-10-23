import { QuickCheckQuestion } from '@/data/quickCheckData';

export interface StudySection {
  id: string;
  sectionNumber: number;
  title: string;
  shortTitle: string;
  content: string;
  readTimeMinutes: number;
  quickChecks: QuickCheckQuestion[];
}

function estimateReadingTime(text: string): number {
  const words = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*`_\[\]()!]/g, ' ')
    .trim()
    .split(/\s+/).length;
  const minutes = Math.ceil(words / 160);
  return Math.max(1, Math.min(12, minutes));
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
  } else if (cleaned.includes('&')) {
    cleaned = cleaned.split('&')[0].trim();
  }

  if (cleaned.length > 26) {
    cleaned = `${cleaned.slice(0, 24)}…`;
  }
  return cleaned || 'Section';
}

/**
 * Parses markdown into structured study sections and assigns corresponding Quick Check questions.
 */
export function parseMarkdownSections(
  rawMarkdown: string,
  quickChecks: QuickCheckQuestion[]
): StudySection[] {
  if (!rawMarkdown || rawMarkdown.trim().length === 0) return [];

  // Group quick check questions by module_id (e.g. M1, M2, M3)
  const qcByModule: Record<string, QuickCheckQuestion[]> = {};
  for (const q of quickChecks) {
    const modId = (q.module_id || 'M1').toUpperCase();
    if (!qcByModule[modId]) {
      qcByModule[modId] = [];
    }
    qcByModule[modId].push(q);
  }

  // Split markdown on H2 or H1 section markers
  const h2Parts = rawMarkdown.split(/(?=^##\s+)/m);
  let parts = h2Parts.length >= 2 ? h2Parts : rawMarkdown.split(/(?=^#\s+(?:[\u{1F300}-\u{1F9FF}\s]*\d+\.|\bModule\s*\d+))/imu);

  if (parts.length <= 1) {
    // Single contiguous section
    return [
      {
        id: 'sec-1',
        sectionNumber: 1,
        title: 'Chapter Study Notes',
        shortTitle: 'All Topics',
        content: rawMarkdown,
        readTimeMinutes: estimateReadingTime(rawMarkdown),
        quickChecks: quickChecks.length > 0 ? quickChecks : [],
      },
    ];
  }

  const sections: StudySection[] = [];
  const part0 = parts[0]?.trim() || '';
  const hasIntroInPart0 = !part0.startsWith('## ') && !part0.startsWith('# ');
  const startIndex = hasIntroInPart0 ? 1 : 0;
  const introContent = hasIntroInPart0 ? part0 : '';

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const headingMatch = part.match(/^#{1,3}\s+([^\n\r]+)/);
    const rawHeading = headingMatch ? headingMatch[1].trim() : `Section ${sections.length + 1}`;
    const cleanTitle = cleanHeadingText(rawHeading);
    const shortTitle = getShortTitle(rawHeading);

    // Extract module number (e.g. '1' from '1. Master System' or 'Module 2:')
    const modMatch = cleanTitle.match(/(?:Module\s*|Topic\s*|^)(\d+)/i);
    const secNum = modMatch ? parseInt(modMatch[1], 10) : sections.length + 1;
    const modKey = `M${secNum}`;

    let matchedQuestions = qcByModule[modKey] || [];
    if (matchedQuestions.length === 0) {
      // Fallback matching by sequential index
      const targetIdx = sections.length;
      if (quickChecks[targetIdx]) {
        matchedQuestions = [quickChecks[targetIdx]];
      } else if (quickChecks.length > 0) {
        matchedQuestions = [quickChecks[targetIdx % quickChecks.length]];
      }
    }

    let sectionBody = part;
    if (sections.length === 0 && introContent && introContent.length > 30) {
      sectionBody = `${introContent}\n\n---\n\n${part}`;
    }

    sections.push({
      id: `sec-${secNum}`,
      sectionNumber: secNum,
      title: cleanTitle,
      shortTitle: shortTitle || `Section ${secNum}`,
      content: sectionBody,
      readTimeMinutes: estimateReadingTime(sectionBody),
      quickChecks: matchedQuestions,
    });
  }

  return sections;
}
