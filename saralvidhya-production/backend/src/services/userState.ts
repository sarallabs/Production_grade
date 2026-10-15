import { firestore, getCatalog } from './registry.js';

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

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  font: 'sans',
  voice: 'female',
  language: 'en-IN',
  persona: 'intermediate',
  onboardingCompleted: false,
  questionnaireCompleted: false,
};

function chapterProgressDocId(tenantId: string, subjectId: string, chapterId: string): string {
  return `${tenantId}__${subjectId}__${chapterId}`;
}

function computeChapterCompletionPercent(
  completedTools: string[],
  completedVideoIds: string[],
  expectedToolCount = 5
): number {
  const uniqueTools = new Set(completedTools);
  if (completedVideoIds.length > 0) {
    uniqueTools.add('learn.videos');
  }
  const denom = Math.max(1, expectedToolCount);
  return Math.min(100, Math.round((uniqueTools.size / denom) * 100));
}

/**
 * Ensures the user profile document exists in Firestore upon login or state hydration.
 */
export async function ensureUserProfile(params: {
  userId: string;
  tenantId: string;
  role?: string;
  displayName?: string;
  email?: string;
  studentId?: string;
}): Promise<void> {
  const userRef = firestore.collection('users').doc(params.userId);
  const snap = await userRef.get();
  const now = new Date().toISOString();

  if (!snap.exists) {
    await userRef.set({
      userId: params.userId,
      tenantId: params.tenantId,
      role: params.role || 'student',
      displayName: params.displayName || 'Student',
      email: params.email || null,
      studentId: params.studentId || null,
      preferences: DEFAULT_PREFERENCES,
      lastActive: {},
      personaHistory: [{ persona: DEFAULT_PREFERENCES.persona, changedAt: now }],
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const updates: Record<string, any> = { updatedAt: now };
    if (params.displayName) updates.displayName = params.displayName;
    if (params.email) updates.email = params.email;
    if (params.studentId) updates.studentId = params.studentId;
    await userRef.set(updates, { merge: true });
  }
}

/**
 * Hydrates the complete user state for a tenant from Cloud Firestore.
 */
export async function getFullUserState(
  userId: string,
  tenantId: string
): Promise<CloudUserState> {
  const userRef = firestore.collection('users').doc(userId);
  const [userSnap, chProgressSnap, quizSnap, catalog] = await Promise.all([
    userRef.get(),
    userRef.collection('chapterProgress').where('tenantId', '==', tenantId).get(),
    userRef
      .collection('quizAttempts')
      .where('tenantId', '==', tenantId)
      .limit(100)
      .get(),
    getCatalog(tenantId).catch(() => ({ nodes: [], subjects: [] })),
  ]);

  const udata = userSnap.exists ? userSnap.data()! : {};
  const preferences: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...(udata.preferences || {}),
  };

  // Build map of catalog chapters per subject to calculate accurate completion percentages
  const catalogToolCounts = new Map<string, number>();
  const catalogChapterCounts = new Map<string, number>();
  for (const subj of catalog.subjects) {
    const chList = subj.chapters || [];
    catalogChapterCounts.set(subj.id, chList.length);
    for (const ch of chList) {
      const toolCount = ch.tools ? Object.keys(ch.tools).length : 5;
      catalogToolCounts.set(`${subj.id}:${ch.id}`, Math.max(1, toolCount));
    }
  }

  const progressBySubject: Record<string, SubjectProgressSummary> = {};
  let chaptersVisited = 0;
  let toolsCompleted = 0;
  let videosCompleted = 0;

  // Initialize subjects from catalog so progressBySubject always has entries for active subjects
  for (const subj of catalog.subjects) {
    progressBySubject[subj.id] = {
      subjectId: subj.id,
      completionPercent: 0,
      completedChaptersCount: 0,
      totalChaptersCount: subj.chapters?.length || 0,
      chapters: {},
    };
  }

  chProgressSnap.docs.forEach((doc) => {
    const d = doc.data();
    const sid = d.subjectId as string;
    const cid = d.chapterId as string;
    if (!sid || !cid) return;

    if (!progressBySubject[sid]) {
      progressBySubject[sid] = {
        subjectId: sid,
        completionPercent: 0,
        completedChaptersCount: 0,
        totalChaptersCount: catalogChapterCounts.get(sid) || 1,
        chapters: {},
      };
    }

    const completedTools: string[] = Array.isArray(d.completedTools) ? d.completedTools : [];
    const completedVideoIds: string[] = Array.isArray(d.completedVideoIds)
      ? d.completedVideoIds
      : [];
    const expectedTools = catalogToolCounts.get(`${sid}:${cid}`) || 5;
    const completionPercent = computeChapterCompletionPercent(
      completedTools,
      completedVideoIds,
      expectedTools
    );

    const chState: ChapterProgressState = {
      subjectId: sid,
      chapterId: cid,
      visited: Boolean(d.visited),
      visitCount: Number(d.visitCount || 0),
      lastVisitedAt: d.lastVisitedAt,
      completedTools,
      completedVideoIds,
      videoOpenCounts: d.videoOpenCounts || {},
      videoProgress: d.videoProgress || {},
      audioProgress: d.audioProgress || {},
      bestQuizScore: d.bestQuizScore,
      completionPercent,
    };

    progressBySubject[sid].chapters[cid] = chState;
    if (chState.visited) chaptersVisited += 1;
    toolsCompleted += completedTools.length;
    videosCompleted += completedVideoIds.length;
  });

  // Compute subject-level completion percentages
  for (const subjSummary of Object.values(progressBySubject)) {
    const chValues = Object.values(subjSummary.chapters);
    const totalChapters = Math.max(subjSummary.totalChaptersCount, chValues.length, 1);
    subjSummary.totalChaptersCount = totalChapters;
    subjSummary.completedChaptersCount = chValues.filter(
      (c) => c.completionPercent >= 80
    ).length;
    const sumPct = chValues.reduce((acc, c) => acc + c.completionPercent, 0);
    subjSummary.completionPercent = Math.min(100, Math.round(sumPct / totalChapters));
  }

  let totalQuizPct = 0;
  quizSnap.docs.forEach((q) => {
    const qd = q.data();
    totalQuizPct += Number(qd.percentage || 0);
  });
  const quizzesTaken = quizSnap.size;
  const averageQuizPercentage =
    quizzesTaken > 0 ? Math.round(totalQuizPct / quizzesTaken) : 0;

  return {
    user: {
      userId,
      tenantId,
      role: udata.role || 'student',
      displayName: udata.displayName || 'Student',
      email: udata.email || undefined,
      studentId: udata.studentId || undefined,
    },
    preferences,
    lastActive: udata.lastActive || {},
    progressBySubject,
    analyticsSummary: {
      chaptersVisited,
      toolsCompleted,
      videosCompleted,
      quizzesTaken,
      averageQuizPercentage,
      personaHistory: Array.isArray(udata.personaHistory) ? udata.personaHistory : [],
    },
  };
}

/**
 * Updates user preferences, profile fields, and persona history in Firestore.
 */
export async function updateUserPreferences(
  userId: string,
  tenantId: string,
  updates: Partial<UserPreferences> & {
    displayName?: string;
    email?: string;
    studentId?: string;
  }
): Promise<UserPreferences> {
  const userRef = firestore.collection('users').doc(userId);
  const snap = await userRef.get();
  const now = new Date().toISOString();
  const existing = snap.exists ? snap.data()! : {};
  const currentPrefs: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...(existing.preferences || {}),
  };

  const nextPrefs: UserPreferences = { ...currentPrefs };
  for (const key of [
    'theme',
    'font',
    'voice',
    'language',
    'persona',
    'onboardingCompleted',
    'questionnaireCompleted',
    'questionnaire',
    'geminiModel',
  ] as const) {
    if (updates[key] !== undefined) {
      (nextPrefs as any)[key] = updates[key];
    }
  }
  if (updates.clientState && typeof updates.clientState === 'object') {
    nextPrefs.clientState = {
      ...(currentPrefs.clientState || {}),
      ...updates.clientState,
    };
  }

  const docUpdate: Record<string, any> = {
    userId,
    tenantId,
    preferences: nextPrefs,
    updatedAt: now,
  };

  if (updates.displayName !== undefined) docUpdate.displayName = updates.displayName;
  if (updates.email !== undefined) docUpdate.email = updates.email;
  if (updates.studentId !== undefined) docUpdate.studentId = updates.studentId;

  if (updates.persona && updates.persona !== currentPrefs.persona) {
    const history = Array.isArray(existing.personaHistory) ? [...existing.personaHistory] : [];
    history.push({ persona: updates.persona, changedAt: now });
    docUpdate.personaHistory = history.slice(-50);
  }

  await userRef.set(docUpdate, { merge: true });
  return nextPrefs;
}

/**
 * Records a chapter visit, tool completion, or video open/completion in Firestore.
 */
export async function recordToolOrChapterProgress(
  userId: string,
  tenantId: string,
  payload: {
    subjectId: string;
    chapterId: string;
    visited?: boolean;
    completedTool?: string;
    completedVideoId?: string;
    openedVideoId?: string;
  }
): Promise<ChapterProgressState> {
  const { subjectId, chapterId } = payload;
  const userRef = firestore.collection('users').doc(userId);
  const docId = chapterProgressDocId(tenantId, subjectId, chapterId);
  const progRef = userRef.collection('chapterProgress').doc(docId);
  const now = new Date().toISOString();

  const snap = await progRef.get();
  const d = snap.exists ? snap.data()! : {};

  const completedTools = new Set<string>(Array.isArray(d.completedTools) ? d.completedTools : []);
  if (payload.completedTool) {
    completedTools.add(payload.completedTool);
  }

  const completedVideoIds = new Set<string>(
    Array.isArray(d.completedVideoIds) ? d.completedVideoIds : []
  );
  if (payload.completedVideoId) {
    completedVideoIds.add(payload.completedVideoId);
  }

  const videoOpenCounts: Record<string, number> = { ...(d.videoOpenCounts || {}) };
  if (payload.openedVideoId) {
    videoOpenCounts[payload.openedVideoId] = (videoOpenCounts[payload.openedVideoId] || 0) + 1;
    // Mirror guided-flow rule: opening a video >= 1 time or completing it marks it watched
    completedVideoIds.add(payload.openedVideoId);
  }

  const visitCount = Number(d.visitCount || 0) + (payload.visited ? 1 : 0);
  const visited = Boolean(d.visited || payload.visited || payload.completedTool || payload.completedVideoId);

  const toolsArr = [...completedTools];
  const vidsArr = [...completedVideoIds];
  const completionPercent = computeChapterCompletionPercent(toolsArr, vidsArr, 5);

  const updatedDoc = {
    tenantId,
    subjectId,
    chapterId,
    visited,
    visitCount: Math.max(1, visitCount),
    lastVisitedAt: now,
    completedTools: toolsArr,
    completedVideoIds: vidsArr,
    videoOpenCounts,
    videoProgress: d.videoProgress || {},
    audioProgress: d.audioProgress || {},
    bestQuizScore: d.bestQuizScore || null,
    completionPercent,
    updatedAt: now,
  };

  await Promise.all([
    progRef.set(updatedDoc, { merge: true }),
    userRef.set(
      {
        lastActive: {
          subjectId,
          chapterId,
          toolId: payload.completedTool || undefined,
          updatedAt: now,
        },
        updatedAt: now,
      },
      { merge: true }
    ),
  ]);

  return {
    subjectId,
    chapterId,
    visited,
    visitCount: updatedDoc.visitCount,
    lastVisitedAt: now,
    completedTools: toolsArr,
    completedVideoIds: vidsArr,
    videoOpenCounts,
    videoProgress: updatedDoc.videoProgress,
    audioProgress: updatedDoc.audioProgress,
    bestQuizScore: d.bestQuizScore,
    completionPercent,
  };
}

/**
 * Saves podcast/audio playback position and updates the user's global lastActive.podcast for ResumePodcastToast.
 */
export async function updateAudioPlaybackProgress(
  userId: string,
  tenantId: string,
  payload: {
    subjectId: string;
    chapterId: string;
    chapterNumber?: number;
    trackId: string;
    title?: string;
    chapterTitle?: string;
    currentTime: number;
    duration: number;
    completed?: boolean;
  }
): Promise<void> {
  const { subjectId, chapterId, trackId, currentTime, duration } = payload;
  const userRef = firestore.collection('users').doc(userId);
  const docId = chapterProgressDocId(tenantId, subjectId, chapterId);
  const progRef = userRef.collection('chapterProgress').doc(docId);
  const now = new Date().toISOString();

  const isCompleted =
    Boolean(payload.completed) || (duration > 0 && currentTime / duration >= 0.9);

  const snap = await progRef.get();
  const d = snap.exists ? snap.data()! : {};
  const audioProgress = { ...(d.audioProgress || {}) };
  audioProgress[trackId] = {
    currentTime,
    duration,
    completed: isCompleted || Boolean(audioProgress[trackId]?.completed),
    title: payload.title || audioProgress[trackId]?.title || trackId,
    updatedAt: now,
  };

  const completedTools = new Set<string>(Array.isArray(d.completedTools) ? d.completedTools : []);
  if (isCompleted) {
    completedTools.add('podcasts');
    completedTools.add('listen');
  }

  const lastPlayedPodcast: LastPlayedPodcast = {
    tenantId,
    subjectId,
    chapterId,
    chapterNumber: payload.chapterNumber,
    trackId,
    title: payload.title || trackId,
    chapterTitle: payload.chapterTitle,
    currentTime,
    duration,
    completed: isCompleted,
    updatedAt: now,
  };

  await Promise.all([
    progRef.set(
      {
        tenantId,
        subjectId,
        chapterId,
        visited: true,
        audioProgress,
        completedTools: [...completedTools],
        updatedAt: now,
      },
      { merge: true }
    ),
    userRef.set(
      {
        lastActive: {
          subjectId,
          chapterId,
          toolId: 'podcasts',
          podcast: lastPlayedPodcast,
          updatedAt: now,
        },
        updatedAt: now,
      },
      { merge: true }
    ),
  ]);
}

/**
 * Records a quiz or assessment attempt in Firestore and updates the chapter's best score.
 */
export async function recordQuizAttempt(
  userId: string,
  tenantId: string,
  payload: {
    subjectId: string;
    chapterId: string;
    quizType?: string;
    difficulty?: string;
    score: number;
    total: number;
    timeTakenSeconds?: number;
    answers?: any;
  }
): Promise<{ percentage: number; bestQuizScore: any }> {
  const { subjectId, chapterId, score, total } = payload;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const now = new Date().toISOString();

  const userRef = firestore.collection('users').doc(userId);
  const docId = chapterProgressDocId(tenantId, subjectId, chapterId);
  const progRef = userRef.collection('chapterProgress').doc(docId);

  const attemptRef = userRef.collection('quizAttempts').doc();
  const snap = await progRef.get();
  const d = snap.exists ? snap.data()! : {};

  const prevBest = d.bestQuizScore;
  const bestQuizScore =
    !prevBest || percentage >= (prevBest.percentage || 0)
      ? {
          score,
          total,
          percentage,
          difficulty: payload.difficulty || 'medium',
          updatedAt: now,
        }
      : prevBest;

  const completedTools = new Set<string>(Array.isArray(d.completedTools) ? d.completedTools : []);
  if (payload.quizType) {
    completedTools.add(payload.quizType);
  }
  completedTools.add('practice.mcq');

  await Promise.all([
    attemptRef.set({
      id: attemptRef.id,
      tenantId,
      subjectId,
      chapterId,
      quizType: payload.quizType || 'mcq',
      difficulty: payload.difficulty || 'medium',
      score,
      total,
      percentage,
      timeTakenSeconds: payload.timeTakenSeconds || 0,
      answers: payload.answers || null,
      createdAt: now,
    }),
    progRef.set(
      {
        tenantId,
        subjectId,
        chapterId,
        visited: true,
        bestQuizScore,
        completedTools: [...completedTools],
        updatedAt: now,
      },
      { merge: true }
    ),
  ]);

  return { percentage, bestQuizScore };
}
