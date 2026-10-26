import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export const CLOUD_API_BASE =
  import.meta.env.VITE_API_BASE || 'https://saralvidhya-api-193782571555.asia-south1.run.app';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'sepia';
  font: 'sans' | 'serif' | 'mono' | 'dyslexic' | 'inter';
  voice: 'male' | 'female';
  language: string;
  persona: 'beginner' | 'intermediate' | 'advanced';
  onboardingCompleted: boolean;
  questionnaireCompleted: boolean;
  questionnaire?: Record<string, any>;
  geminiModel?: string;
  clientState?: Record<string, string>;
}

export interface LastPlayedPodcast {
  tenantId: string;
  subjectId: string;
  chapterId: string;
  chapterNumber?: number;
  trackId: string;
  title: string;
  chapterTitle?: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  updatedAt: string;
}

export interface ChapterProgressState {
  subjectId: string;
  chapterId: string;
  visited: boolean;
  visitCount: number;
  lastVisitedAt?: string;
  completedTools: string[];
  completedVideoIds: string[];
  videoOpenCounts: Record<string, number>;
  videoProgress: Record<
    string,
    { currentTime: number; duration: number; completed: boolean; updatedAt: string }
  >;
  audioProgress: Record<
    string,
    {
      currentTime: number;
      duration: number;
      completed: boolean;
      title?: string;
      updatedAt: string;
    }
  >;
  bestQuizScore?: {
    score: number;
    total: number;
    percentage: number;
    difficulty?: string;
    updatedAt: string;
  };
  completionPercent: number;
}

export interface SubjectProgressSummary {
  subjectId: string;
  completionPercent: number;
  completedChaptersCount: number;
  totalChaptersCount: number;
  chapters: Record<string, ChapterProgressState>;
}

export interface CloudUserState {
  user: {
    userId: string;
    tenantId: string;
    role: string;
    displayName: string;
    email?: string;
    studentId?: string;
  };
  preferences: UserPreferences;
  lastActive: {
    subjectId?: string;
    chapterId?: string;
    toolId?: string;
    podcast?: LastPlayedPodcast | null;
    updatedAt?: string;
  };
  progressBySubject: Record<string, SubjectProgressSummary>;
  analyticsSummary: {
    chaptersVisited: number;
    toolsCompleted: number;
    videosCompleted: number;
    quizzesTaken: number;
    averageQuizPercentage: number;
    personaHistory: Array<{ persona: string; changedAt: string }>;
  };
}

// ── Module-level Stateless Cloud Memory Store (Zero localStorage / sessionStorage) ──
const memoryKv = new Map<string, string>();
const listeners = new Set<() => void>();
let activeTenantIdInternal: string | null = null;
let activeTokenInternal: string | null = null;
let hydratedStateInternal: CloudUserState | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const pendingClientStateUpdates: Record<string, string> = {};

function readFirstPartyCookies(): Record<string, string> {
  if (typeof document === 'undefined' || !document.cookie) return {};
  const out: Record<string, string> = {};
  for (const part of document.cookie.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = decodeURIComponent(part.slice(0, idx).trim());
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      out[k] = v;
    }
  }
  return out;
}

function writeFirstPartyCookie(key: string, value: string, maxAgeSec = 7 * 24 * 3600) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

function deleteFirstPartyCookie(key: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
}

// Bootstrap in-memory session state from first-party cookies at module load time
(() => {
  const cookies = readFirstPartyCookies();
  for (const [k, v] of Object.entries(cookies)) {
    if (k.startsWith('sv_session_') && v) {
      memoryKv.set(k, v);
      const tid = k.replace(/^sv_session_/, '');
      if (!activeTenantIdInternal) {
        activeTenantIdInternal = tid;
        activeTokenInternal = v;
      }
      memoryKv.set('app_authenticated', 'true');
      if (!memoryKv.get('username')) {
        const displayName = `${tid.toUpperCase()} Student`;
        memoryKv.set('username', displayName);
        memoryKv.set(
          'saral_student_profile',
          JSON.stringify({ firstName: displayName, lastName: '', bypassed: true })
        );
        memoryKv.set('questionnaire_completed', 'true');
      }
    } else if ((k === 'current_tenant_id' || k === 'user_persona') && v) {
      memoryKv.set(k, v);
    }
  }
})();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  });
}

export function setCloudAuthContext(tenantId: string | null, token: string | null) {
  activeTenantIdInternal = tenantId;
  activeTokenInternal = token;
  if (tenantId) {
    memoryKv.set('current_tenant_id', tenantId);
    writeFirstPartyCookie('current_tenant_id', tenantId);
  }
  if (tenantId && token) {
    memoryKv.set(`sv_session_${tenantId}`, token);
    writeFirstPartyCookie(`sv_session_${tenantId}`, token);
    memoryKv.set('app_authenticated', 'true');
    if (!memoryKv.get('username')) {
      const displayName = `${tenantId.toUpperCase()} Student`;
      memoryKv.set('username', displayName);
      memoryKv.set(
        'saral_student_profile',
        JSON.stringify({ firstName: displayName, lastName: '', bypassed: true })
      );
      memoryKv.set('questionnaire_completed', 'true');
    }
  }
}

export function getCloudAuthToken(tenantId?: string | null): string | null {
  const tid = tenantId || activeTenantIdInternal;
  if (tid && memoryKv.has(`sv_session_${tid}`)) {
    return memoryKv.get(`sv_session_${tid}`) || null;
  }
  return activeTokenInternal;
}

export function hasValidCloudToken(tenantId?: string | null): boolean {
  const tok = getCloudAuthToken(tenantId);
  return Boolean(tok && !tok.startsWith('demo-token-') && tok.includes('.'));
}

export function getCloudAuthHeaders(tenantId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const tok = getCloudAuthToken(tenantId);
  if (tok) {
    headers['Authorization'] = `Bearer ${tok}`;
  }
  return headers;
}

let meEndpointsAvailable = true;
let inflightStatePromise: Promise<CloudUserState | null> | null = null;

function clearInvalidCloudToken(tid: string) {
  memoryKv.delete(`sv_session_${tid}`);
  deleteFirstPartyCookie(`sv_session_${tid}`);
  if (activeTenantIdInternal === tid) {
    activeTokenInternal = null;
  }
}

function scheduleCloudKvFlush() {
  if (!activeTenantIdInternal || !meEndpointsAvailable || !hasValidCloudToken(activeTenantIdInternal)) return;
  if (syncTimer) clearTimeout(syncTimer);
  const tid = activeTenantIdInternal;
  syncTimer = setTimeout(async () => {
    if (!hasValidCloudToken(tid)) return;
    const batch = { ...pendingClientStateUpdates };
    for (const k of Object.keys(pendingClientStateUpdates)) {
      delete pendingClientStateUpdates[k];
    }
    if (Object.keys(batch).length === 0) return;

    const payload: Record<string, any> = {
      clientState: batch,
    };

    if (batch.user_persona) {
      const p = batch.user_persona.toLowerCase();
      if (p === 'beginner' || p === 'intermediate' || p === 'advanced') {
        payload.persona = p;
      }
    }
    if (batch.onboarding_completed !== undefined) {
      payload.onboardingCompleted = batch.onboarding_completed === 'true';
    }
    if (batch.questionnaire_completed !== undefined) {
      payload.questionnaireCompleted = batch.questionnaire_completed === 'true';
    }
    if (batch.user_profile) {
      try {
        const prof = JSON.parse(batch.user_profile);
        if (prof.name) payload.displayName = prof.name;
        if (prof.email) payload.email = prof.email;
        if (prof.rollNumber || prof.studentId) payload.studentId = prof.rollNumber || prof.studentId;
      } catch {
        // ignore JSON error
      }
    }

    try {
      const res = await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/me/preferences`, {
        method: 'PATCH',
        headers: getCloudAuthHeaders(tid),
        body: JSON.stringify(payload),
      });
      if (res.status === 404) {
        meEndpointsAvailable = false;
      } else if (res.status === 401) {
        clearInvalidCloudToken(tid);
      }
    } catch {
      // Cloud sync is best-effort when offline
    }
  }, 250);
}

/**
 * Drop-in replacement for browser localStorage/sessionStorage backed by Cloud Run + Firestore.
 * Zero browser disk storage is used.
 */
export const cloudStorage = {
  get length(): number {
    return memoryKv.size;
  },
  key(index: number): string | null {
    return Array.from(memoryKv.keys())[index] ?? null;
  },
  getItem(key: string): string | null {
    return memoryKv.has(key) ? memoryKv.get(key)! : null;
  },
  setItem(key: string, value: string, skipRemoteSync = false): void {
    const strVal = String(value);
    const prev = memoryKv.get(key);
    memoryKv.set(key, strVal);
    if (key === 'current_tenant_id' || key === 'user_persona') {
      writeFirstPartyCookie(key, strVal);
    }
    if (
      !skipRemoteSync &&
      prev !== strVal &&
      !key.startsWith('sv_session_') &&
      !key.startsWith('tenant_cfg_') &&
      key !== 'saral_credentials'
    ) {
      pendingClientStateUpdates[key] = strVal;
      scheduleCloudKvFlush();
    }
    notifyListeners();
  },
  removeItem(key: string): void {
    memoryKv.delete(key);
    if (key.startsWith('sv_session_') || key === 'current_tenant_id' || key === 'user_persona') {
      deleteFirstPartyCookie(key);
    }
    if (!key.startsWith('sv_session_') && !key.startsWith('tenant_cfg_') && key !== 'saral_credentials') {
      pendingClientStateUpdates[key] = '';
      scheduleCloudKvFlush();
    }
    notifyListeners();
  },
  clear(): void {
    for (const k of memoryKv.keys()) {
      if (k.startsWith('sv_session_') || k === 'current_tenant_id' || k === 'user_persona') {
        deleteFirstPartyCookie(k);
      }
    }
    memoryKv.clear();
    notifyListeners();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getHydratedState(): CloudUserState | null {
    return hydratedStateInternal;
  },
};

/**
 * Hydrates in-memory KV keys from the structured CloudUserState returned by GET /v2/t/:tenant/me/state
 */
export function applyHydratedCloudState(state: CloudUserState) {
  hydratedStateInternal = state;

  // 1. Restore any saved clientState keys first
  if (state.preferences?.clientState && typeof state.preferences.clientState === 'object') {
    for (const [k, v] of Object.entries(state.preferences.clientState)) {
      if (typeof v === 'string' && v !== '') {
        memoryKv.set(k, v);
      }
    }
  }

  // 2. Hydrate canonical user & preference fields
  if (state.user?.userId) {
    memoryKv.set('app_user_id', state.user.userId);
  }
  if (state.user?.displayName) {
    const existingProf = memoryKv.get('user_profile');
    let profObj: Record<string, any> = {};
    if (existingProf) {
      try {
        profObj = JSON.parse(existingProf);
      } catch {
        profObj = {};
      }
    }
    memoryKv.set(
      'user_profile',
      JSON.stringify({
        ...profObj,
        name: state.user.displayName || profObj.name || 'Student',
        email: state.user.email || profObj.email || '',
        rollNumber: state.user.studentId || profObj.rollNumber || '',
      })
    );
  }
  if (state.preferences?.persona) {
    memoryKv.set('user_persona', state.preferences.persona);
  }
  if (state.preferences?.onboardingCompleted) {
    memoryKv.set('onboarding_completed', 'true');
  }
  if (state.preferences?.questionnaireCompleted) {
    memoryKv.set('questionnaire_completed', 'true');
  }

  // 3. Hydrate guided flow progress from progressBySubject
  if (state.progressBySubject) {
    let guidedMap: Record<string, string[]> = {};
    try {
      const rawGuided = memoryKv.get('sv_guided_progress');
      if (rawGuided) guidedMap = JSON.parse(rawGuided);
    } catch {
      guidedMap = {};
    }

    for (const [subjectId, subjSummary] of Object.entries(state.progressBySubject)) {
      for (const [chapterId, chProg] of Object.entries(subjSummary.chapters || {})) {
        const chNumMatch = chapterId.match(/(\d+)/);
        const chNum = chNumMatch ? Number(chNumMatch[1]) : 1;
        const baseKey = `${subjectId}_${chNum}`;
        const existingTools = new Set<string>(guidedMap[baseKey] || []);
        for (const t of chProg.completedTools || []) {
          existingTools.add(t);
        }
        if ((chProg.completedVideoIds || []).length > 0) {
          existingTools.add('videos');
        }
        if (existingTools.size > 0) {
          guidedMap[baseKey] = Array.from(existingTools);
        }
      }
    }
    memoryKv.set('sv_guided_progress', JSON.stringify(guidedMap));
  }

  // 4. Hydrate lastPlayedPodcast for ResumePodcastToast
  if (state.lastActive?.podcast && state.user?.userId) {
    const p = state.lastActive.podcast;
    const chNumMatch = p.chapterId.match(/(\d+)/);
    const chNum = p.chapterNumber || (chNumMatch ? Number(chNumMatch[1]) : 1);
    const globalPodcast = {
      userId: state.user.userId,
      lessonId: `${p.subjectId}_ch${chNum}_${p.trackId}`,
      subjectId: p.subjectId,
      chapterNumber: chNum,
      chapterName: p.chapterTitle || p.title || `Chapter ${chNum}`,
      persona: state.preferences?.persona || 'intermediate',
      track: p.trackId,
      currentTime: p.currentTime,
      updatedAt: new Date(p.updatedAt || Date.now()).getTime(),
      wasPaused: !p.completed && p.currentTime > 0,
    };
    memoryKv.set(`global_last_podcast_${state.user.userId}`, JSON.stringify(globalPodcast));
  }

  notifyListeners();
}

export async function syncToolProgressToCloud(payload: {
  tenantId?: string | null;
  subjectId: string;
  chapterId: string;
  visited?: boolean;
  completedTool?: string;
  completedVideoId?: string;
  openedVideoId?: string;
}): Promise<void> {
  const tid = payload.tenantId || activeTenantIdInternal;
  if (!tid || !hasValidCloudToken(tid)) return;
  try {
    if (meEndpointsAvailable) {
      const res = await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/me/progress/tool`, {
        method: 'POST',
        headers: getCloudAuthHeaders(tid),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        clearInvalidCloudToken(tid);
        return;
      }
      if (res.status !== 404) return;
      meEndpointsAvailable = false;
    }
    await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/progress`, {
      method: 'POST',
      headers: getCloudAuthHeaders(tid),
      body: JSON.stringify({
        subjectId: payload.subjectId,
        chapterId: payload.chapterId,
        tool: payload.completedTool || 'visit',
        data: payload,
      }),
    });
  } catch {
    // ignore network errors
  }
}

export async function syncAudioProgressToCloud(payload: {
  tenantId?: string | null;
  subjectId: string;
  chapterId: string;
  chapterNumber?: number;
  trackId: string;
  title?: string;
  chapterTitle?: string;
  currentTime: number;
  duration: number;
  completed?: boolean;
}): Promise<void> {
  const tid = payload.tenantId || activeTenantIdInternal;
  if (!tid || !hasValidCloudToken(tid)) return;
  try {
    if (meEndpointsAvailable) {
      const res = await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/me/progress/audio`, {
        method: 'PUT',
        headers: getCloudAuthHeaders(tid),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        clearInvalidCloudToken(tid);
        return;
      }
      if (res.status !== 404) return;
      meEndpointsAvailable = false;
    }
    await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/progress`, {
      method: 'POST',
      headers: getCloudAuthHeaders(tid),
      body: JSON.stringify({
        subjectId: payload.subjectId,
        chapterId: payload.chapterId,
        tool: 'audio',
        data: payload,
      }),
    });
  } catch {
    // ignore network errors
  }
}

export async function syncQuizScoreToCloud(payload: {
  tenantId?: string | null;
  subjectId: string;
  chapterId: string;
  quizType?: string;
  difficulty?: string;
  score: number;
  total: number;
  timeTakenSeconds?: number;
}): Promise<void> {
  const tid = payload.tenantId || activeTenantIdInternal;
  if (!tid || !hasValidCloudToken(tid)) return;
  try {
    if (meEndpointsAvailable) {
      const res = await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/me/progress/quiz`, {
        method: 'POST',
        headers: getCloudAuthHeaders(tid),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        clearInvalidCloudToken(tid);
        return;
      }
      if (res.status !== 404) return;
      meEndpointsAvailable = false;
    }
    await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/progress`, {
      method: 'POST',
      headers: getCloudAuthHeaders(tid),
      body: JSON.stringify({
        subjectId: payload.subjectId,
        chapterId: payload.chapterId,
        tool: 'quiz',
        data: payload,
      }),
    });
  } catch {
    // ignore network errors
  }
}

export interface CloudStateContextValue {
  cloudState: CloudUserState | null;
  isHydrated: boolean;
  refreshCloudState: (tenantIdOverride?: string | null) => Promise<CloudUserState | null>;
  updatePreferences: (
    updates: Partial<UserPreferences> & {
      displayName?: string;
      email?: string;
      studentId?: string;
    }
  ) => Promise<void>;
}

const CloudStateContext = createContext<CloudStateContextValue | undefined>(undefined);

export const CloudStateProvider: React.FC<{
  tenantId: string | null;
  token: string | null;
  children: React.ReactNode;
}> = ({ tenantId, token, children }) => {
  const [cloudState, setCloudState] = useState<CloudUserState | null>(hydratedStateInternal);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    setCloudAuthContext(tenantId, token);
  }, [tenantId, token]);

  const refreshCloudState = useCallback(
    async (tenantIdOverride?: string | null): Promise<CloudUserState | null> => {
      const tid = tenantIdOverride || tenantId || activeTenantIdInternal;
      if (!tid || !meEndpointsAvailable || !hasValidCloudToken(tid)) {
        setIsHydrated(true);
        return hydratedStateInternal;
      }
      if (inflightStatePromise) {
        return inflightStatePromise;
      }
      inflightStatePromise = (async () => {
        try {
          const res = await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/me/state`, {
            method: 'GET',
            headers: getCloudAuthHeaders(tid),
          });
          if (res.status === 404) {
            meEndpointsAvailable = false;
            setIsHydrated(true);
            return null;
          }
          if (res.status === 401) {
            clearInvalidCloudToken(tid);
            setIsHydrated(true);
            return null;
          }
          if (!res.ok) {
            setIsHydrated(true);
            return null;
          }
          const data = (await res.json()) as CloudUserState;
          applyHydratedCloudState(data);
          setCloudState(data);
          setIsHydrated(true);
          return data;
        } catch {
          setIsHydrated(true);
          return null;
        } finally {
          inflightStatePromise = null;
        }
      })();
      return inflightStatePromise;
    },
    [tenantId]
  );

  useEffect(() => {
    if (tenantId && token) {
      refreshCloudState(tenantId);
    } else {
      setIsHydrated(true);
    }
  }, [tenantId, token, refreshCloudState]);

  const updatePreferences = useCallback(
    async (
      updates: Partial<UserPreferences> & {
        displayName?: string;
        email?: string;
        studentId?: string;
      }
    ) => {
      const tid = tenantId || activeTenantIdInternal;
      if (!tid || !meEndpointsAvailable || !hasValidCloudToken(tid)) return;
      try {
        const res = await fetch(`${CLOUD_API_BASE}/v2/t/${tid}/me/preferences`, {
          method: 'PATCH',
          headers: getCloudAuthHeaders(tid),
          body: JSON.stringify(updates),
        });
        if (res.status === 404) {
          meEndpointsAvailable = false;
          return;
        }
        if (res.status === 401) {
          clearInvalidCloudToken(tid);
          return;
        }
        if (res.ok) {
          await refreshCloudState(tid);
        }
      } catch {
        // ignore
      }
    },
    [tenantId, refreshCloudState]
  );

  const value = useMemo<CloudStateContextValue>(
    () => ({
      cloudState,
      isHydrated,
      refreshCloudState,
      updatePreferences,
    }),
    [cloudState, isHydrated, refreshCloudState, updatePreferences]
  );

  return <CloudStateContext.Provider value={value}>{children}</CloudStateContext.Provider>;
};

export function useCloudState(): CloudStateContextValue {
  const ctx = useContext(CloudStateContext);
  if (!ctx) {
    return {
      cloudState: hydratedStateInternal,
      isHydrated: true,
      refreshCloudState: async () => hydratedStateInternal,
      updatePreferences: async () => {},
    };
  }
  return ctx;
}
