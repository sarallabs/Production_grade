/**
 * analytics.ts
 * Cloud-backed learning analytics tracker synced via CloudStateContext to Cloud Run + Firestore.
 * Zero browser storage (localStorage/sessionStorage) is used.
 */
import {
  cloudStorage,
  syncToolProgressToCloud,
  syncQuizScoreToCloud,
} from '@/context/CloudStateContext';
import { getFallbackTenantId } from '@/tenant/TenantProvider';
import { registryClient } from '@/data/registryClient';

const SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
let eventBuffer: any[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function flushAnalyticsEvents(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (eventBuffer.length === 0) return;
  const batchToSend = [...eventBuffer];
  eventBuffer = [];
  const tenantId = getFallbackTenantId();
  const userId = cloudStorage.getItem('app_user_id') || undefined;
  const displayName = cloudStorage.getItem('username') || undefined;
  registryClient
    .sendAnalyticsBatch(tenantId, {
      events: batchToSend,
      sessionId: SESSION_ID,
      userId,
      displayName,
      path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
    })
    .catch(() => {});
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushAnalyticsEvents();
    }
  });
  window.addEventListener('pagehide', () => {
    flushAnalyticsEvents();
  });
}

export function trackCloudEvent(
  eventType: string,
  payload: {
    category?: string;
    subjectId?: string;
    chapterId?: string;
    chapterNumber?: number;
    toolId?: string;
    persona?: string;
    track?: string;
    durationMs?: number;
    score?: number;
    total?: number;
    scorePct?: number;
    status?: string;
    label?: string;
    metadata?: Record<string, any>;
  } = {},
  flushImmediately = false
): void {
  eventBuffer.push({
    eventId: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    eventType,
    ...payload,
    clientTimestamp: new Date().toISOString(),
  });
  if (flushImmediately || eventBuffer.length >= 10) {
    flushAnalyticsEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushAnalyticsEvents();
    }, 3500);
  }
}

export function trackAuthEvent(
  eventType:
    | 'auth.login_view'
    | 'auth.password_focus'
    | 'auth.login_attempt'
    | 'auth.login_success'
    | 'auth.login_failure'
    | 'auth.board_select',
  metadata?: Record<string, any>,
  status: 'started' | 'success' | 'failure' = 'success'
): void {
  trackCloudEvent(
    eventType,
    {
      category: 'auth',
      status,
      label: eventType,
      metadata,
    },
    true
  );
}

export interface ChapterVisit {
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  chapterName: string;
  timestamp: string;
}

export interface ToolEvent {
  tool: string;
  subjectId: string;
  chapterNumber: number;
  chapterName: string;
  timestamp: string;
}

export interface QuizRecord {
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  chapterName: string;
  score: number;
  total: number;
  timestamp: string;
}

export interface PersonaChange {
  from: string;
  to: string;
  timestamp: string;
}

export interface AnalyticsData {
  chapterVisits: ChapterVisit[];
  toolEvents: ToolEvent[];
  quizRecords: QuizRecord[];
  personaHistory: PersonaChange[];
}

const KEY = 'saral_analytics';
const MAX_EVENTS = 500;

function load(): AnalyticsData {
  try {
    const raw = cloudStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AnalyticsData;
  } catch {
    /* ignore */
  }
  return { chapterVisits: [], toolEvents: [], quizRecords: [], personaHistory: [] };
}

function save(data: AnalyticsData) {
  data.chapterVisits = data.chapterVisits.slice(-MAX_EVENTS);
  data.toolEvents = data.toolEvents.slice(-MAX_EVENTS);
  data.quizRecords = data.quizRecords.slice(-MAX_EVENTS);
  data.personaHistory = data.personaHistory.slice(-100);
  try {
    cloudStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function trackChapterVisit(visit: Omit<ChapterVisit, 'timestamp'>) {
  const data = load();
  data.chapterVisits.push({ ...visit, timestamp: new Date().toISOString() });
  save(data);
  const chapterId = `chapter_${String(visit.chapterNumber).padStart(2, '0')}`;
  syncToolProgressToCloud({
    subjectId: visit.subjectId,
    chapterId,
    visited: true,
  });
  trackCloudEvent(
    'chapter.select',
    {
      category: 'navigation',
      subjectId: visit.subjectId,
      chapterId,
      chapterNumber: visit.chapterNumber,
      label: visit.chapterName,
      metadata: { subjectName: visit.subjectName },
    },
    true
  );
}

export function trackToolUsage(event: Omit<ToolEvent, 'timestamp'>) {
  const data = load();
  data.toolEvents.push({ ...event, timestamp: new Date().toISOString() });
  save(data);
  const chapterId = `chapter_${String(event.chapterNumber).padStart(2, '0')}`;
  syncToolProgressToCloud({
    subjectId: event.subjectId,
    chapterId,
    visited: true,
    completedTool: event.tool,
  });
  trackCloudEvent(
    'tool.open',
    {
      category: 'study_tool',
      subjectId: event.subjectId,
      chapterId,
      chapterNumber: event.chapterNumber,
      toolId: event.tool,
      label: `${event.tool} in ${event.chapterName}`,
    },
    true
  );
}

export function trackQuiz(record: Omit<QuizRecord, 'timestamp'>) {
  const data = load();
  data.quizRecords.push({ ...record, timestamp: new Date().toISOString() });
  save(data);
  const chapterId = `chapter_${String(record.chapterNumber).padStart(2, '0')}`;
  syncQuizScoreToCloud({
    subjectId: record.subjectId,
    chapterId,
    score: record.score,
    total: record.total,
  });
  trackCloudEvent(
    'quiz.submit',
    {
      category: 'assessment',
      subjectId: record.subjectId,
      chapterId,
      chapterNumber: record.chapterNumber,
      toolId: 'quiz',
      score: record.score,
      total: record.total,
      scorePct: record.total > 0 ? Math.round((record.score / record.total) * 100) : 0,
      status: 'completed',
      label: record.chapterName,
    },
    true
  );
}

export function trackPersonaChange(from: string, to: string) {
  if (from === to) return;
  const data = load();
  data.personaHistory.push({ from, to, timestamp: new Date().toISOString() });
  save(data);
  trackCloudEvent(
    'persona.switch',
    {
      category: 'study_tool',
      persona: to,
      label: `${from} -> ${to}`,
      metadata: { from, to },
    },
    true
  );
}

export function getAnalytics(): AnalyticsData {
  return load();
}

export function getVisitedChapterNumbersForSubject(subjectId: string): Set<number> {
  const data = load();
  const cleanId = (id?: string) => (id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = cleanId(subjectId);

  const set = new Set<number>();

  data.chapterVisits.forEach((visit) => {
    const v = cleanId(visit.subjectId);
    if (v === target || (target && v && (target.startsWith(v) || v.startsWith(target)))) {
      if (typeof visit.chapterNumber === 'number') {
        set.add(visit.chapterNumber);
      }
    }
  });

  // Also include chapters visited in hydrated CloudUserState
  const hydrated = cloudStorage.getHydratedState();
  if (hydrated?.progressBySubject) {
    for (const [sid, subj] of Object.entries(hydrated.progressBySubject)) {
      const sClean = cleanId(sid);
      if (sClean === target || (target && sClean && (target.startsWith(sClean) || sClean.startsWith(target)))) {
        for (const [cid, ch] of Object.entries(subj.chapters || {})) {
          if (ch.visited) {
            const m = cid.match(/(\d+)/);
            if (m) set.add(Number(m[1]));
          }
        }
      }
    }
  }

  try {
    const raw = cloudStorage.getItem('completed_chapters');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (typeof item === 'number') set.add(item);
          else if (item && typeof item === 'object' && cleanId(item.subjectId) === target) {
            set.add(Number(item.chapterNumber));
          }
        });
      } else if (typeof parsed === 'object') {
        const subList = parsed[subjectId];
        if (Array.isArray(subList)) {
          subList.forEach((n: any) => set.add(Number(n)));
        }
      }
    }
  } catch {
    /* ignore */
  }

  return set;
}

export function getUniqueVisitedChaptersForSubject(subjectId: string): number {
  return getVisitedChapterNumbersForSubject(subjectId).size;
}

export function getUniqueVisitedChaptersOverall() {
  const data = load();
  return new Set(data.chapterVisits.map((visit) => `${visit.subjectId}_${visit.chapterNumber}`))
    .size;
}

/** Rough % for a chapter from distinct tools used in Study Table (capped at denom). */
export function getChapterToolCoveragePercent(
  subjectId: string,
  chapterNumber: number,
  denom: number
): number {
  const hydrated = cloudStorage.getHydratedState();
  const chId = `chapter_${String(chapterNumber).padStart(2, '0')}`;
  const cloudChapter = hydrated?.progressBySubject?.[subjectId]?.chapters?.[chId];
  if (cloudChapter && typeof cloudChapter.completionPercent === 'number' && cloudChapter.completionPercent > 0) {
    return cloudChapter.completionPercent;
  }

  const data = load();
  const used = new Set(
    data.toolEvents
      .filter((e) => e.subjectId === subjectId && e.chapterNumber === chapterNumber)
      .map((e) => e.tool)
  ).size;
  const d = Math.max(1, denom);
  return Math.min(100, Math.round((used / d) * 100));
}

export function clearAnalytics() {
  cloudStorage.removeItem(KEY);
}
