/**
 * TypeScript Type Definitions for SaralVidhya Sectional Read Engine
 * =================================================================
 */

export type ReadMode = 'essentials' | 'indepth';
export type Persona = 'beginner' | 'intermediate' | 'advanced';
export type SectionStatus = 'completed' | 'active' | 'locked';

export interface SubtopicAnchor {
  anchorId: string;
  title: string;
}

export interface SectionSummary {
  sectionId: string;
  moduleId: string;
  order: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  status: SectionStatus;
  hasQuickCheck: boolean;
  isLocked: boolean;
  prerequisiteSectionId?: string;
  subtopics: SubtopicAnchor[];
}

export interface ReadManifest {
  chapter: string;
  subject: string;
  mode: ReadMode;
  persona: Persona;
  totalSections: number;
  chapterProgressPercent: number;
  resumedSectionId: string;
  resumedTimestamp: string;
  sections: SectionSummary[];
}

export interface DottedTerm {
  term: string;
  definition: string;
  examTip?: string;
}

export interface FigureHotspot {
  id: number;
  label: string;
  description: string;
  xPercent?: number;
  yPercent?: number;
}

export interface InteractiveFigure {
  figureNo: string;
  title: string;
  imageUrl: string;
  zoomable: boolean;
  caption?: string;
  hotspots?: FigureHotspot[];
}

export interface QuickCheckOption {
  key: string;
  text: string;
}

export interface QuickCheckQuestion {
  questionId: string;
  moduleId: string;
  type: string;
  promptType: string;
  stem: string;
  options: QuickCheckOption[];
}

export interface SectionAudioInfo {
  duration: string;
  streamUrl: string;
}

export interface SectionPayload {
  sectionId: string;
  moduleId: string;
  title: string;
  subtitle?: string;
  mode: ReadMode;
  persona: Persona;
  contentMarkdown: string;
  estimatedMinutes: number;
  audio?: SectionAudioInfo;
  dottedTerms: DottedTerm[];
  figures: InteractiveFigure[];
  quickCheck?: QuickCheckQuestion;
}

export interface QuickCheckEvaluationResult {
  isCorrect: boolean;
  correctKey: string;
  rationale: string;
  keyTakeaway?: string;
  unlockedNextSectionId?: string;
  nextSectionTitle?: string;
  chapterProgressPercent: number;
}

export interface UserReadProgressRecord {
  uid: string;
  university: string;
  subject: string;
  chapter: string;
  completedSections: string[];
  unlockedSections: string[];
  activeSectionId: string;
  lastReadAt: string;
  progressPercent: number;
  quickCheckHistory: Record<string, {
    passed: boolean;
    attempts: number;
    selectedKey: string;
    passedAt?: string;
  }>;
}
