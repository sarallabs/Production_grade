import { createContext, useContext, useState, type ReactNode } from 'react';

export const FLOW_STEPS = ['welcome', 'youtube_links.md', 'podcast_script.md', 'flashcards', 'summary.md', 'detailed_view.md', 'assessment.md'] as const;
export type FlowStep = typeof FLOW_STEPS[number];

export const FOCUS_STEP_LABELS = new Proxy<Record<number, string>>({}, {
  get(target, prop) {
    if (typeof prop === 'symbol') return Reflect.get(target, prop);
    const index = Number(prop);
    if (isNaN(index)) return Reflect.get(target, prop);

    const isMoocs = sessionStorage.getItem('sv_moocs_mode') === 'true';
    const labels = isMoocs
      ? {
          0: 'Welcome',
          1: 'Videos',
          2: 'Podcasts',
          3: 'Flashcards',
          4: 'Quick Study',
          5: 'Detailed Study',
          6: 'Assessment',
        }
      : {
          0: 'Welcome',
          1: 'Quick Study',
          2: 'Detailed Study',
          3: 'Flashcards',
          4: 'Assessment',
        };
    return labels[index as keyof typeof labels];
  }
});

interface FocusModeState {
  isFocusModeActive: boolean;
  currentSubjectId: string;
  currentChapterNumber: number;
  currentStepIndex: number;
  returnUrl: string;
}

interface FocusModeContextType extends FocusModeState {
  flowSteps: typeof FLOW_STEPS;
  startFocusMode: (subjectId: string, chapterNumber: number, returnUrl: string) => void;
  nextStep: () => void;
  quitFocusMode: () => void;
}

const FocusModeContext = createContext<FocusModeContextType | null>(null);

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FocusModeState>({
    isFocusModeActive: false,
    currentSubjectId: '',
    currentChapterNumber: 0,
    currentStepIndex: 0,
    returnUrl: '/',
  });

  const isMooc = sessionStorage.getItem('sv_moocs_mode') === 'true';
  const flowSteps = isMooc
    ? ['welcome', 'youtube_links.md', 'podcast_script.md', 'flashcards', 'summary.md', 'detailed_view.md', 'assessment.md']
    : ['welcome', 'summary.md', 'detailed_view.md', 'flashcards', 'assessment.md'];

  function startFocusMode(subjectId: string, chapterNumber: number, returnUrl: string) {
    setState({
      isFocusModeActive: true,
      currentSubjectId: subjectId,
      currentChapterNumber: chapterNumber,
      currentStepIndex: 0,
      returnUrl,
    });
  }

  function nextStep() {
    setState(prev => ({ ...prev, currentStepIndex: prev.currentStepIndex + 1 }));
  }

  function quitFocusMode() {
    setState(prev => ({ ...prev, isFocusModeActive: false, currentStepIndex: 0 }));
  }

  return (
    <FocusModeContext.Provider
      value={{ ...state, flowSteps: flowSteps as any, startFocusMode, nextStep, quitFocusMode }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  const ctx = useContext(FocusModeContext);
  if (!ctx) throw new Error('useFocusMode must be used within FocusModeProvider');
  return ctx;
}
