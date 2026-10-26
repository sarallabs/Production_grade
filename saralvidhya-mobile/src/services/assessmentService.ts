export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  isMultipleSelect: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  options: string[];
  correctAnswers: number[]; // indices of correct options
  explanation: string;
}

/**
 * Assessment questions are pure API driven.
 */
export const SAMPLE_ASSESSMENT_QUESTIONS: Record<number, AssessmentQuestion[]> = {};
