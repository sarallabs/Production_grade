import { storage } from '@/utils/storage';
import { GCS_API_BASE, fetchWithTimeout } from '@/services/contentService';

export interface QuickCheckOption {
  key: string;
  text: string;
  is_correct?: boolean;
}

export interface QuickCheckQuestion {
  module_id: string;
  module_title: string;
  type?: string;
  prompt_type?: string;
  stem: string;
  options: QuickCheckOption[];
  correct_answer: string;
  rationale: string;
  bloom_level?: string;
}

export interface SectionQuickCheckMap {
  [moduleId: string]: QuickCheckQuestion[];
}

/**
 * Quick Check Bank is pure API driven.
 */
export const FALLBACK_QUICK_CHECK_BANK: Record<number, QuickCheckQuestion[]> = {};

/**
 * Fetches Quick Check questions purely from Cloud Run API endpoint with storage cache.
 */
export async function fetchQuickCheckQuestions(
  chapterNumber: number,
  track: 'quick' | 'detailed' = 'quick',
  persona: string = 'intermediate',
  signal?: AbortSignal
): Promise<QuickCheckQuestion[]> {
  const cacheKey = `quick_check_api_${chapterNumber}_${track}_${persona}`;
  const chNum = chapterNumber < 10 ? `0${chapterNumber}` : `${chapterNumber}`;
  const trackFolder = track === 'detailed' ? 'detailed' : 'quick';
  const normPersona =
    persona === 'beginner' || persona === 'easy'
      ? 'beginner'
      : persona === 'advanced' || persona === 'hard'
      ? 'advanced'
      : 'intermediate';

  const endpoint = `${GCS_API_BASE}/api/content/angrau/entomology/chapter_${chNum}/read/quick_check/${trackFolder}/${normPersona}.json`;

  try {
    const res = await fetchWithTimeout(endpoint, 8000, signal);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        await storage.setItem(cacheKey, data.questions);
        return data.questions;
      }
    }
  } catch (err) {
    console.warn(`[QuickCheckService] Error fetching questions for chapter ${chapterNumber}:`, err);
  }

  // Pure API fallback: previously cached questions from storage
  const cached = await storage.getItem<QuickCheckQuestion[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  return [];
}

/**
 * Groups an array of Quick Check questions by section / module ID (e.g. M1, M2, M3).
 */
export function groupQuestionsByModule(
  questions: QuickCheckQuestion[]
): SectionQuickCheckMap {
  const map: SectionQuickCheckMap = {};
  for (const q of questions) {
    const modId = q.module_id || 'M1';
    if (!map[modId]) {
      map[modId] = [];
    }
    map[modId].push(q);
  }
  return map;
}
