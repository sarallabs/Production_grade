export type QuestionType =
  | 'mcq'
  | 'msq'
  | 'true_false'
  | 'fill_blanks'
  | 'match_following'
  | 'sequencing'
  | 'labelling'
  | 'descriptive'
  | 'short_answer'
  | 'long_answer';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  q: string;
  explanation: string;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  answer: number; // index of correct option
}

export interface MSQQuestion extends BaseQuestion {
  type: 'msq';
  options: string[];
  answer: number[]; // indices of correct options
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  answer: boolean; // true = True, false = False
}

export interface FillBlanksQuestion extends BaseQuestion {
  type: 'fill_blanks';
  // Question text should contain blanks like "[blank]" or "___"
  correctAnswers: string[]; // Answers in order of appearance
}

export interface MatchFollowingQuestion extends BaseQuestion {
  type: 'match_following';
  leftItems: string[];
  rightItems: string[]; // Shuffled for display
  correctPairs: Record<string, string>; // leftItem -> rightItem
}

export interface SequencingQuestion extends BaseQuestion {
  type: 'sequencing';
  items: string[]; // Shuffled items
  correctOrder: string[]; // Correct sorted order
}

export interface LabellingQuestion extends BaseQuestion {
  type: 'labelling';
  imageUrl: string;
  labels: {
    id: string;
    x: number; // percentage from left (0-100)
    y: number; // percentage from top (0-100)
    correctText: string;
    options: string[]; // choices for label dropdown
  }[];
}

export interface DescriptiveQuestion extends BaseQuestion {
  type: 'descriptive' | 'short_answer' | 'long_answer';
  section?: string;
  sectionName?: string;
  marks?: number;
  bloomLevel?: string;
  mindmapPath?: string;
  modelAnswer?: string;
  rubric?: { marks: string; desc: string }[];
  keywords?: string[];
  hasAsciiDiagram?: boolean;
}

export type AssessmentQuestion =
  | MCQQuestion
  | MSQQuestion
  | TrueFalseQuestion
  | FillBlanksQuestion
  | MatchFollowingQuestion
  | SequencingQuestion
  | LabellingQuestion
  | DescriptiveQuestion;

