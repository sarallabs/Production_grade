import { firestore } from './registry.js';

export interface AnalyticsEventInput {
  eventId?: string;
  eventType: string;
  category?: 'auth' | 'navigation' | 'study_tool' | 'media' | 'assessment' | 'ai' | 'system' | string;
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
  status?: 'success' | 'failure' | 'started' | 'completed' | 'abandoned' | string;
  label?: string;
  metadata?: Record<string, any>;
  clientTimestamp?: string;
}

export interface AnalyticsClientContext {
  userId?: string;
  sessionId?: string;
  userEmail?: string;
  displayName?: string;
  userAgent?: string;
  ipHash?: string;
  path?: string;
  referrer?: string;
  screen?: string;
}

/**
 * Emits a structured JSON log entry to stdout for GCP Cloud Logging & Cloud Monitoring Log-Based Metrics.
 */
export function emitCloudMonitoringEvent(
  tenantId: string,
  event: AnalyticsEventInput,
  ctx: AnalyticsClientContext
): void {
  const now = new Date().toISOString();
  const category =
    event.category ||
    (event.eventType.startsWith('auth.')
      ? 'auth'
      : event.eventType.startsWith('tool.')
      ? 'study_tool'
      : event.eventType.startsWith('quiz.') || event.eventType.startsWith('mock_test.') || event.eventType.startsWith('pyq.')
      ? 'assessment'
      : event.eventType.startsWith('video.') || event.eventType.startsWith('audio.')
      ? 'media'
      : event.eventType.startsWith('ai_')
      ? 'ai'
      : 'navigation');

  const structuredLog = {
    severity: event.status === 'failure' ? 'WARNING' : 'INFO',
    message: `[SV_ANALYTICS] ${tenantId} | ${event.eventType} | user=${ctx.userId || 'anon'} | sub=${event.subjectId || '-'} | ch=${event.chapterId || '-'} | tool=${event.toolId || '-'}`,
    logType: 'SV_ANALYTICS_EVENT',
    tenantId,
    userId: ctx.userId || 'anonymous',
    sessionId: ctx.sessionId || 'no_session',
    userEmail: ctx.userEmail || null,
    displayName: ctx.displayName || null,
    eventType: event.eventType,
    category,
    subjectId: event.subjectId || null,
    chapterId: event.chapterId || null,
    chapterNumber: typeof event.chapterNumber === 'number' ? event.chapterNumber : null,
    toolId: event.toolId || null,
    persona: event.persona || null,
    track: event.track || null,
    durationMs: typeof event.durationMs === 'number' ? event.durationMs : 0,
    score: typeof event.score === 'number' ? event.score : null,
    total: typeof event.total === 'number' ? event.total : null,
    scorePct: typeof event.scorePct === 'number' ? event.scorePct : null,
    status: event.status || 'success',
    label: event.label || null,
    path: ctx.path || null,
    metadata: event.metadata || {},
    clientTimestamp: event.clientTimestamp || now,
    serverTimestamp: now,
  };

  // Cloud Run automatically parses single-line JSON on stdout into jsonPayload
  console.log(JSON.stringify(structuredLog));
}

/**
 * Persists a batch of analytics events to Firestore (`tenants/{tenantId}/analyticsEvents`
 * and `tenants/{tenantId}/analyticsSessions/{sessionId}`) and emits each to GCP Cloud Logging.
 */
export async function ingestAnalyticsBatch(
  tenantId: string,
  events: AnalyticsEventInput[],
  ctx: AnalyticsClientContext
): Promise<{ ingested: number }> {
  if (!Array.isArray(events) || events.length === 0) {
    return { ingested: 0 };
  }

  const boundedEvents = events.slice(0, 50);
  const now = new Date().toISOString();
  const tenantRef = firestore.collection('tenants').doc(tenantId);
  const eventsCol = tenantRef.collection('analyticsEvents');
  const batch = firestore.batch();

  const sessionId = ctx.sessionId || `sess_${ctx.userId || 'anon'}_${ now.slice(0, 10) }`;
  const sessionRef = tenantRef.collection('analyticsSessions').doc(sessionId);

  let toolOpensDelta = 0;
  let chapterViewsDelta = 0;
  let quizSubmitsDelta = 0;
  let loginSuccessDelta = 0;
  let loginFailDelta = 0;
  let totalDurationDeltaMs = 0;
  let lastEventType = '';
  let lastSubjectId: string | undefined;
  let lastChapterId: string | undefined;
  let lastToolId: string | undefined;

  for (let i = 0; i < boundedEvents.length; i++) {
    const ev = boundedEvents[i];
    if (!ev || !ev.eventType) continue;

    // 1. Emit structured log for GCP Cloud Logging & Cloud Monitoring
    emitCloudMonitoringEvent(tenantId, ev, ctx);

    // 2. Queue Firestore document write
    const evId =
      ev.eventId ||
      `ev_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 8)}`;
    const docRef = eventsCol.doc(evId);

    const category =
      ev.category ||
      (ev.eventType.startsWith('auth.')
        ? 'auth'
        : ev.eventType.startsWith('tool.')
        ? 'study_tool'
        : ev.eventType.startsWith('quiz.') || ev.eventType.startsWith('mock_test.') || ev.eventType.startsWith('pyq.')
        ? 'assessment'
        : ev.eventType.startsWith('video.') || ev.eventType.startsWith('audio.')
        ? 'media'
        : ev.eventType.startsWith('ai_')
        ? 'ai'
        : 'navigation');

    batch.set(
      docRef,
      {
        eventId: evId,
        tenantId,
        userId: ctx.userId || 'anonymous',
        sessionId,
        userEmail: ctx.userEmail || null,
        displayName: ctx.displayName || null,
        eventType: ev.eventType,
        category,
        subjectId: ev.subjectId || null,
        chapterId: ev.chapterId || null,
        chapterNumber: typeof ev.chapterNumber === 'number' ? ev.chapterNumber : null,
        toolId: ev.toolId || null,
        persona: ev.persona || null,
        track: ev.track || null,
        durationMs: typeof ev.durationMs === 'number' ? ev.durationMs : 0,
        score: typeof ev.score === 'number' ? ev.score : null,
        total: typeof ev.total === 'number' ? ev.total : null,
        scorePct: typeof ev.scorePct === 'number' ? ev.scorePct : null,
        status: ev.status || 'success',
        label: ev.label || null,
        path: ctx.path || null,
        userAgent: ctx.userAgent || null,
        metadata: ev.metadata || {},
        clientTimestamp: ev.clientTimestamp || now,
        createdAt: now,
      },
      { merge: true }
    );

    lastEventType = ev.eventType;
    if (ev.subjectId) lastSubjectId = ev.subjectId;
    if (ev.chapterId) lastChapterId = ev.chapterId;
    if (ev.toolId) lastToolId = ev.toolId;
    if (typeof ev.durationMs === 'number' && ev.durationMs > 0) {
      totalDurationDeltaMs += ev.durationMs;
    }

    if (ev.eventType === 'tool.open' || ev.eventType === 'study.tool_open') toolOpensDelta++;
    if (ev.eventType === 'chapter.select' || ev.eventType === 'chapter.visit') chapterViewsDelta++;
    if (ev.eventType === 'quiz.submit' || ev.eventType === 'mock_test.submit') quizSubmitsDelta++;
    if (ev.eventType === 'auth.login_success') loginSuccessDelta++;
    if (ev.eventType === 'auth.login_failure') loginFailDelta++;
  }

  const sessionUpdate: Record<string, any> = {
    sessionId,
    tenantId,
    userId: ctx.userId || 'anonymous',
    userEmail: ctx.userEmail || null,
    displayName: ctx.displayName || null,
    lastEventType,
    lastActiveAt: now,
    updatedAt: now,
  };
  if (lastSubjectId) sessionUpdate.lastSubjectId = lastSubjectId;
  if (lastChapterId) sessionUpdate.lastChapterId = lastChapterId;
  if (lastToolId) sessionUpdate.lastToolId = lastToolId;
  if (ctx.userAgent) sessionUpdate.userAgent = ctx.userAgent;

  batch.set(sessionRef, sessionUpdate, { merge: true });

  await batch.commit().catch((err) => {
    console.warn(`[Analytics] Firestore batch commit warning for '${tenantId}':`, err);
  });

  // Update aggregate counters on tenant analytics summary doc (non-blocking)
  if (
    toolOpensDelta > 0 ||
    chapterViewsDelta > 0 ||
    quizSubmitsDelta > 0 ||
    loginSuccessDelta > 0 ||
    loginFailDelta > 0 ||
    boundedEvents.length > 0
  ) {
    const FieldValue = (await import('@google-cloud/firestore')).FieldValue;
    const summaryRef = tenantRef.collection('analyticsRollups').doc('realtime');
    summaryRef
      .set(
        {
          tenantId,
          totalEvents: FieldValue.increment(boundedEvents.length),
          toolOpens: FieldValue.increment(toolOpensDelta),
          chapterViews: FieldValue.increment(chapterViewsDelta),
          quizSubmissions: FieldValue.increment(quizSubmitsDelta),
          loginSuccesses: FieldValue.increment(loginSuccessDelta),
          loginFailures: FieldValue.increment(loginFailDelta),
          totalDurationMs: FieldValue.increment(totalDurationDeltaMs),
          lastEventAt: now,
          lastEventType,
        },
        { merge: true }
      )
      .catch(() => {});
  }

  return { ingested: boundedEvents.length };
}

/**
 * Returns DB-driven analytics summary and recent event stream for a tenant from Firestore.
 */
export async function getTenantAnalyticsDashboardData(
  tenantId: string,
  limit = 100
): Promise<Record<string, any>> {
  const tenantRef = firestore.collection('tenants').doc(tenantId);
  const [rollupSnap, recentEventsSnap, recentSessionsSnap] = await Promise.all([
    tenantRef.collection('analyticsRollups').doc('realtime').get(),
    tenantRef
      .collection('analyticsEvents')
      .orderBy('createdAt', 'desc')
      .limit(Math.min(limit, 250))
      .get()
      .catch(() => null),
    tenantRef
      .collection('analyticsSessions')
      .orderBy('lastActiveAt', 'desc')
      .limit(50)
      .get()
      .catch(() => null),
  ]);

  const rollup = rollupSnap.exists ? rollupSnap.data()! : {};
  const recentEvents = recentEventsSnap
    ? recentEventsSnap.docs.map((d) => d.data())
    : [];
  const activeSessions = recentSessionsSnap
    ? recentSessionsSnap.docs.map((d) => d.data())
    : [];

  // Compute breakdowns by eventType, toolId, subjectId, and persona from recent events
  const byEventType: Record<string, number> = {};
  const byTool: Record<string, number> = {};
  const bySubject: Record<string, number> = {};
  const byPersona: Record<string, number> = {};

  for (const ev of recentEvents) {
    const et = String(ev.eventType || 'unknown');
    byEventType[et] = (byEventType[et] || 0) + 1;
    if (ev.toolId) {
      byTool[String(ev.toolId)] = (byTool[String(ev.toolId)] || 0) + 1;
    }
    if (ev.subjectId) {
      bySubject[String(ev.subjectId)] = (bySubject[String(ev.subjectId)] || 0) + 1;
    }
    if (ev.persona) {
      byPersona[String(ev.persona)] = (byPersona[String(ev.persona)] || 0) + 1;
    }
  }

  return {
    tenantId,
    rollup,
    breakdowns: {
      byEventType,
      byTool,
      bySubject,
      byPersona,
    },
    activeSessionsCount: activeSessions.length,
    activeSessions: activeSessions.slice(0, 20),
    recentEvents: recentEvents.slice(0, 50),
  };
}
