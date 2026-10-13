export type ToolCategory = 'read' | 'learn' | 'practice' | 'prepare' | 'listen' | 'assist';

export interface ToolDefinition {
  id: string;
  label: string;
  category: ToolCategory;
  iconName: string;
  description?: string;
  supportedPersonas?: string[];
  supportedDifficulties?: string[];
}

export const STANDARD_TOOL_REGISTRY: Record<string, ToolDefinition> = {
  'read.quick': {
    id: 'read.quick',
    label: 'Quick Read',
    category: 'read',
    iconName: 'BookOpen',
    description: 'Concise summary and core concepts',
  },
  'read.detailed': {
    id: 'read.detailed',
    label: 'Detailed Read',
    category: 'read',
    iconName: 'FileText',
    description: 'In-depth textbook explanations and derivations',
  },
  'read.key_takeaways': {
    id: 'read.key_takeaways',
    label: 'Key Takeaways',
    category: 'read',
    iconName: 'ListChecks',
    description: 'High-yield points and exam takeaways',
  },
  'learn.mindmap': {
    id: 'learn.mindmap',
    label: 'Interactive Mindmap',
    category: 'learn',
    iconName: 'GitFork',
    description: 'Hierarchical visual breakdown of chapter topics',
  },
  'learn.study_plan': {
    id: 'learn.study_plan',
    label: 'Study Plan',
    category: 'learn',
    iconName: 'Calendar',
    description: 'Recommended daily revision schedule',
  },
  'practice.flashcards': {
    id: 'practice.flashcards',
    label: 'Flashcards',
    category: 'practice',
    iconName: 'Layers',
    description: 'Active recall and spaced repetition cards',
  },
  'practice.mcq': {
    id: 'practice.mcq',
    label: 'Multiple Choice Questions',
    category: 'practice',
    iconName: 'CheckSquare',
    description: 'Single-answer objective questions by difficulty',
  },
  'practice.msq': {
    id: 'practice.msq',
    label: 'Multiple Select Questions',
    category: 'practice',
    iconName: 'CheckCircle2',
    description: 'Advanced multiple-correct problem sets',
  },
  'practice.question_bank': {
    id: 'practice.question_bank',
    label: 'Question Bank',
    category: 'practice',
    iconName: 'HelpCircle',
    description: 'Comprehensive repository of subject questions',
  },
  'prepare.previous_year': {
    id: 'prepare.previous_year',
    label: 'Previous Year Questions',
    category: 'prepare',
    iconName: 'Award',
    description: 'Past university and board examination papers',
  },
  'prepare.pre_final_exam': {
    id: 'prepare.pre_final_exam',
    label: 'Pre-Final Exam',
    category: 'prepare',
    iconName: 'FileSpreadsheet',
    description: 'Simulated midterm and descriptive pre-finals',
  },
  'prepare.certification_exam': {
    id: 'prepare.certification_exam',
    label: 'Certification Exam',
    category: 'prepare',
    iconName: 'Medal',
    description: 'Final certification and mock assessment',
  },
  'podcasts': {
    id: 'podcasts',
    label: 'Audio Podcasts',
    category: 'listen',
    iconName: 'Headphones',
    description: 'Audio summaries and microcast explanations',
  },
  'ask': {
    id: 'ask',
    label: 'Ask AI Assistant',
    category: 'assist',
    iconName: 'MessageSquare',
    description: 'Contextual AI tutor for doubts and explanations',
  },
};

/**
 * Resolves a tool key or alias to its standardized definition.
 */
export function resolveToolDefinition(toolKey: string): ToolDefinition {
  if (STANDARD_TOOL_REGISTRY[toolKey]) {
    return STANDARD_TOOL_REGISTRY[toolKey];
  }

  // Fallbacks for legacy/shorthand keys
  const mapping: Record<string, string> = {
    summary: 'read.quick',
    deep_dive: 'read.detailed',
    mindmap: 'learn.mindmap',
    flashcards: 'practice.flashcards',
    mcqs: 'practice.mcq',
    msqs: 'practice.msq',
    pyq: 'prepare.previous_year',
    podcast: 'podcasts',
  };

  const resolvedKey = mapping[toolKey] || 'read.quick';
  return (
    STANDARD_TOOL_REGISTRY[resolvedKey] || {
      id: toolKey,
      label: toolKey.replace(/[_.]/g, ' ').toUpperCase(),
      category: 'read',
      iconName: 'FileText',
    }
  );
}
