import { QuickCheckQuestion } from '@/data/quickCheckData';

export interface StudySection {
  id: string;
  sectionNumber: number;
  title: string;
  shortTitle: string;
  content: string;
  readTimeMinutes: number;
  quickChecks: QuickCheckQuestion[];
  hasInfographic?: boolean;
  examBadge?: string;
  subBulletBadge?: string;
}

// ANGRAU & University Past Year Exam Questions (PYQ) metadata per chapter & module
const CHAPTER_EXAM_BADGES: Record<
  number,
  Record<number, { full: string; short: string; hasInfographic?: boolean }>
> = {
  1: {
    1: {
      full: 'Asked in 2023 & 2024',
      short: "asked '23 '24",
      hasInfographic: true,
    },
    2: {
      full: 'Asked in 2022 & 2023',
      short: "asked '22 '23",
      hasInfographic: false,
    },
    3: {
      full: 'Asked in 2023',
      short: "asked '23",
      hasInfographic: false,
    },
    4: {
      full: 'Asked in 2021 & 2024',
      short: "asked '21 '24",
      hasInfographic: false,
    },
    5: {
      full: 'Asked in 2022',
      short: "asked '22",
      hasInfographic: false,
    },
  },
  2: {
    1: {
      full: 'Asked in 2023 & 2024',
      short: "asked '23 '24",
      hasInfographic: true,
    },
    2: {
      full: 'Asked in 2022',
      short: "asked '22",
      hasInfographic: false,
    },
    3: {
      full: 'Asked in 2023',
      short: "asked '23",
      hasInfographic: false,
    },
    4: {
      full: 'Asked in 2024',
      short: "asked '24",
      hasInfographic: false,
    },
  },
  3: {
    1: {
      full: 'Asked in 2023 & 2024',
      short: "asked '23 '24",
      hasInfographic: true,
    },
    2: {
      full: 'Asked in 2022',
      short: "asked '22",
      hasInfographic: false,
    },
    3: {
      full: 'Asked in 2023',
      short: "asked '23",
      hasInfographic: false,
    },
    4: {
      full: 'Asked in 2024',
      short: "asked '24",
      hasInfographic: false,
    },
  },
  4: {
    1: {
      full: 'Asked in 2023 & 2024',
      short: "asked '23 '24",
      hasInfographic: true,
    },
    2: {
      full: 'Asked in 2023',
      short: "asked '23",
      hasInfographic: false,
    },
    3: {
      full: 'Asked in 2022 & 2024',
      short: "asked '22 '24",
      hasInfographic: false,
    },
  },
};

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
  quickChecks: QuickCheckQuestion[],
  chapterNumber: number = 1
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

  // Split markdown on H2 section markers
  const h2Parts = rawMarkdown.split(/(?=^##\s+)/m);
  let topicParts: string[] = [];

  if (h2Parts.length >= 2) {
    // Document contains H2 topic sections. Filter out preamble that doesn't start with ##
    topicParts = h2Parts.filter((p) => p.trim().startsWith('## '));
  } else {
    // Check for H1 topic/module sections
    const h1Parts = rawMarkdown.split(/(?=^#\s+(?:[\u{1F300}-\u{1F9FF}\s]*\d+\.|\bModule\s*\d+|\bTopic\s*\d+))/imu);
    topicParts = h1Parts.filter((p) =>
      /^#\s+(?:[\u{1F300}-\u{1F9FF}\s]*\d+\.|\bModule\s*\d+|\bTopic\s*\d+)/iu.test(p.trim())
    );
  }

  // Fallback if no structured topic headings found
  if (topicParts.length === 0) {
    topicParts = rawMarkdown.trim() ? [rawMarkdown.trim()] : [];
  }

  if (topicParts.length <= 1) {
    const badgeInfo = CHAPTER_EXAM_BADGES[chapterNumber]?.[1] || {
      full: 'Asked in 2023 & 2024',
      short: "asked '23 '24",
      hasInfographic: false,
    };

    const firstHeadingMatch = rawMarkdown.match(/^#{1,3}\s+([^\n\r]+)/);
    let singleContent = rawMarkdown;
    let singleTitle = 'Architectural Blueprint & Regional Partitioning';
    if (firstHeadingMatch) {
      singleTitle = cleanHeadingText(firstHeadingMatch[1].trim());
      singleContent = rawMarkdown.replace(/^#{1,3}\s+[^\n\r]+(?:\r?\n)*/, '').trim();
    }

    return [
      {
        id: 'sec-1',
        sectionNumber: 1,
        title: singleTitle,
        shortTitle: 'Blueprint',
        content: singleContent,
        readTimeMinutes: estimateReadingTime(singleContent),
        quickChecks: quickChecks.length > 0 ? quickChecks : [],
        hasInfographic: false,
        examBadge: badgeInfo.full,
        subBulletBadge: badgeInfo.short,
      },
    ];
  }

  const sections: StudySection[] = [];

  for (let i = 0; i < topicParts.length; i++) {
    const part = topicParts[i].trim();
    if (!part) continue;

    const headingMatch = part.match(/^#{1,3}\s+([^\n\r]+)/);
    const rawHeading = headingMatch ? headingMatch[1].trim() : `Section ${sections.length + 1}`;
    const cleanTitle = cleanHeadingText(rawHeading);
    const shortTitle = getShortTitle(rawHeading);

    // Strip leading heading line from markdown content so it is not duplicated below the section header
    let cleanContent = part;
    if (headingMatch) {
      cleanContent = part.replace(/^#{1,3}\s+[^\n\r]+(?:\r?\n)*/, '').trim();
    }

    const seqIndex = sections.length + 1;
    // Extract module number (e.g. '1' from '1. Master System' or 'Module 2:')
    const modMatch = cleanTitle.match(/(?:Module\s*|Topic\s*|^)(\d+)/i);
    const extractedNum = modMatch ? parseInt(modMatch[1], 10) : seqIndex;
    const secNum = !isNaN(extractedNum) && extractedNum > 0 ? extractedNum : seqIndex;
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

    const badgeInfo = CHAPTER_EXAM_BADGES[chapterNumber]?.[secNum] || {
      full: secNum === 1 ? 'Asked in 2023 & 2024' : undefined,
      short: secNum === 1 ? "asked '23 '24" : undefined,
      hasInfographic: false,
    };

    sections.push({
      id: `sec-${seqIndex}-${secNum}`,
      sectionNumber: secNum,
      title: cleanTitle,
      shortTitle: shortTitle || `Section ${seqIndex}`,
      content: cleanContent,
      readTimeMinutes: estimateReadingTime(cleanContent),
      quickChecks: matchedQuestions,
      hasInfographic: badgeInfo.hasInfographic,
      examBadge: badgeInfo.full,
      subBulletBadge: badgeInfo.short,
    });
  }

  return sections;
}
