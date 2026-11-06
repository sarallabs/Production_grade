/**
 * Topics to be covered for each chapter, extracted from mindmap top-level branches.
 * Used in the Study Plan / Study Table view.
 */

export interface ChapterTopics {
  subject: string;
  chapterNumber: number;
  topics: string[];
}

export const CHAPTER_TOPICS: ChapterTopics[] = [
  // ── NEB Nepal - Class 12 Biology ──────────────────────
  {
    subject: 'neb_xii_biology',
    chapterNumber: 6,
    topics: [
      'History & Fundamentals of Histology',
      'Epithelial Tissue',
      'Connective Tissue',
      'Muscular Tissue',
      'Nervous Tissue',
    ],
  },
];

export function getTopicsForChapter(subject: string, chapterNumber: number): string[] {
  const normSub = subject?.toLowerCase() === 'entomology' ? 'ento_131' : subject;
  const entry = CHAPTER_TOPICS.find(
    (ct) => (ct.subject === normSub || ct.subject === subject) && ct.chapterNumber === chapterNumber,
  );
  return entry?.topics ?? [];
}
