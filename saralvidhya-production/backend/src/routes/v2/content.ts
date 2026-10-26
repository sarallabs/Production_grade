import { Router, Response } from 'express';
import path from 'path';
import { tenantMiddleware } from '../../middleware/tenant.js';
import { requireSession, AuthenticatedRequest } from '../../middleware/requireSession.js';
import {
  getCatalog,
  getChapter,
  saveStudentProgress,
  getStudentProgress,
} from '../../services/registry.js';
import { getSignedUrlForFile } from '../../services/storage.js';
import {
  getFullUserState,
  updateUserPreferences,
  recordToolOrChapterProgress,
  updateAudioPlaybackProgress,
  recordQuizAttempt,
  getTenantLeaderboard,
} from '../../services/userState.js';
import { ingestAnalyticsBatch } from '../../services/analyticsService.js';

const router = Router();

// Apply tenant resolution and session requirement to all content routes
router.use('/:tenant', tenantMiddleware, requireSession);

function resolveUserId(req: AuthenticatedRequest): string {
  const tenantId = req.tenant?.id || req.session?.tenantId || 'default';
  if (req.session?.email && req.session?.userId) {
    return req.session.userId;
  }
  return `u_${tenantId}_default_student`;
}

/**
 * GET /v2/t/:tenant/catalog
 * Returns published subjects (with signed iconUrl & card metadata), chapter summaries (with signed heroImageUrl),
 * hierarchy nodes, and grouping structure for the tenant.
 */
router.get('/:tenant/catalog', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  try {
    const catalog = await getCatalog(tenant.id);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.json({
      tenantId: tenant.id,
      academicTerm: tenant.academicTerm,
      branding: tenant.branding,
      assets: tenant.assets,
      hierarchy: tenant.hierarchy,
      nodes: catalog.nodes,
      subjects: catalog.subjects,
    });
  } catch (err: any) {
    console.error(`[Content] Error loading catalog for '${tenant.id}':`, err);
    res.status(500).json({ error: 'Failed to retrieve course catalog' });
  }
});

/**
 * GET /v2/t/:tenant/subjects/:subjectId/chapters/:chapterId
 * Returns chapter metadata, signed hero/media URLs, videos[], topic outline, and signed URLs for all tool/media files.
 */
router.get(
  '/:tenant/subjects/:subjectId/chapters/:chapterId',
  async (req: AuthenticatedRequest, res: Response) => {
    const tenant = req.tenant!;
    const { subjectId, chapterId } = req.params;
    const versionQuery = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

    try {
      const chapter = await getChapter(tenant.id, subjectId, chapterId, versionQuery);
      if (!chapter) {
        res.status(404).json({ error: `Chapter '${chapterId}' not found in subject '${subjectId}'` });
        return;
      }

      const signedFiles: Record<string, string> = chapter.signedFiles || {};
      const chapterFiles: Record<string, string> = chapter.chapterFiles || {};

      res.setHeader('Cache-Control', 'private, max-age=60');
      res.json({
        chapter: {
          id: chapter.id,
          number: chapter.number,
          title: chapter.title,
          shortTitle: chapter.shortTitle,
          description: chapter.description,
          estimatedMinutes: chapter.estimatedMinutes,
          heroImageUrl: chapter.heroImageUrl,
          assets: chapter.assets,
          currentVersion: chapter.currentVersion,
          topics: chapter.topics || [],
          videos: chapter.videos || [],
          tools: chapter.tools || {},
        },
        files: signedFiles,
        chapterFiles,
      });
    } catch (err: any) {
      console.error(`[Content] Error loading chapter '${chapterId}':`, err);
      res.status(500).json({ error: 'Failed to load chapter content' });
    }
  }
);

/**
 * GET /v2/t/:tenant/signed-url
 * Returns a short-lived signed URL for an individual asset path within the tenant storage.
 */
router.get('/:tenant/signed-url', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const rawPath = ((req.query.path as string) || '').trim();

  if (!rawPath) {
    res.status(400).json({ error: 'File path query parameter is required' });
    return;
  }

  const normalizedPath = path.posix.normalize(rawPath.replace(/\\/g, '/'));

  // Prevent path traversal outside tenant prefix
  if (
    !normalizedPath ||
    normalizedPath === '.' ||
    normalizedPath.includes('..') ||
    normalizedPath.startsWith('/') ||
    normalizedPath.includes('\0')
  ) {
    res.status(400).json({ error: 'Invalid file path' });
    return;
  }

  const gcsPath = `${tenant.storage.prefix}/${normalizedPath}`;
  try {
    const signedUrl = await getSignedUrlForFile(gcsPath, 30);
    res.json({ signedUrl, expiresInMinutes: 30 });
  } catch (err: any) {
    console.error(`[Content] Failed signing URL for '${gcsPath}':`, err);
    res.status(500).json({ error: 'Could not generate signed download URL' });
  }
});

/**
 * GET /v2/t/:tenant/leaderboard
 * Returns the cloud-synced tenant leaderboard from Firestore user state & quiz scores.
 */
router.get('/:tenant/leaderboard', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const userId = resolveUserId(req);
  try {
    const leaderboard = await getTenantLeaderboard(tenant.id, userId);
    res.json({ tenantId: tenant.id, leaderboard });
  } catch (err: any) {
    console.error(`[Leaderboard] Failed loading leaderboard for '${tenant.id}':`, err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// ── Cloud-Native User State & Progress Endpoints (/v2/t/:tenant/me/*) ─────

/**
 * GET /v2/t/:tenant/me/state
 * Hydrates the complete user state (profile, preferences, guided flow, audio/video progress, quiz scores, analytics) from Firestore.
 */
router.get('/:tenant/me/state', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const userId = resolveUserId(req);
  try {
    const state = await getFullUserState(userId, tenant.id);
    res.json(state);
  } catch (err: any) {
    console.error(`[UserState] Failed hydrating state for '${userId}':`, err);
    res.status(500).json({ error: 'Failed to load user state' });
  }
});

/**
 * PATCH /v2/t/:tenant/me/preferences
 * Updates user preferences (theme, font, voice, language, persona, onboarding/questionnaire) or profile in Firestore.
 */
router.patch('/:tenant/me/preferences', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const userId = resolveUserId(req);
  try {
    const preferences = await updateUserPreferences(userId, tenant.id, req.body || {});
    res.json({ success: true, preferences });
  } catch (err: any) {
    console.error(`[UserState] Failed updating preferences for '${userId}':`, err);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

/**
 * POST /v2/t/:tenant/me/progress/tool
 * Records chapter visit, tool completion, or video watch status in Firestore.
 */
router.post('/:tenant/me/progress/tool', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const userId = resolveUserId(req);
  const { subjectId, chapterId, visited, completedTool, completedVideoId, openedVideoId } =
    req.body || {};

  if (!subjectId || !chapterId) {
    res.status(400).json({ error: 'subjectId and chapterId are required' });
    return;
  }

  try {
    const chapterProgress = await recordToolOrChapterProgress(userId, tenant.id, {
      subjectId,
      chapterId,
      visited,
      completedTool,
      completedVideoId,
      openedVideoId,
    });
    ingestAnalyticsBatch(
      tenant.id,
      [
        {
          eventType: completedTool
            ? 'tool.complete'
            : openedVideoId
            ? 'video.open'
            : completedVideoId
            ? 'video.complete'
            : 'chapter.visit',
          category: completedTool ? 'study_tool' : openedVideoId || completedVideoId ? 'media' : 'navigation',
          subjectId,
          chapterId,
          toolId: completedTool || (openedVideoId || completedVideoId ? 'videos' : undefined),
          status: 'completed',
        },
      ],
      {
        userId,
        sessionId: req.session?.sessionId,
        userEmail: req.session?.email,
        displayName: req.session?.displayName,
        userAgent: req.headers['user-agent'],
      }
    ).catch(() => {});
    res.json({ success: true, chapterProgress });
  } catch (err: any) {
    console.error(`[UserState] Failed recording tool progress for '${userId}':`, err);
    res.status(500).json({ error: 'Failed to record tool progress' });
  }
});

/**
 * PUT /v2/t/:tenant/me/progress/audio
 * Saves podcast/audio playback position and updates lastActive.podcast in Firestore.
 */
router.put('/:tenant/me/progress/audio', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const userId = resolveUserId(req);
  const {
    subjectId,
    chapterId,
    chapterNumber,
    trackId,
    title,
    chapterTitle,
    currentTime,
    duration,
    completed,
  } = req.body || {};

  if (!subjectId || !chapterId || !trackId) {
    res.status(400).json({ error: 'subjectId, chapterId, and trackId are required' });
    return;
  }

  try {
    await updateAudioPlaybackProgress(userId, tenant.id, {
      subjectId,
      chapterId,
      chapterNumber,
      trackId,
      title,
      chapterTitle,
      currentTime: Number(currentTime || 0),
      duration: Number(duration || 0),
      completed: Boolean(completed),
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[UserState] Failed updating audio progress for '${userId}':`, err);
    res.status(500).json({ error: 'Failed to update audio progress' });
  }
});

/**
 * POST /v2/t/:tenant/me/progress/quiz
 * Records a quiz/exam attempt and updates bestQuizScore in Firestore.
 */
router.post('/:tenant/me/progress/quiz', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const userId = resolveUserId(req);
  const { subjectId, chapterId, quizType, difficulty, score, total, timeTakenSeconds, answers } =
    req.body || {};

  if (!subjectId || !chapterId || typeof score !== 'number' || typeof total !== 'number') {
    res.status(400).json({ error: 'subjectId, chapterId, score, and total are required' });
    return;
  }

  try {
    const result = await recordQuizAttempt(userId, tenant.id, {
      subjectId,
      chapterId,
      quizType,
      difficulty,
      score,
      total,
      timeTakenSeconds,
      answers,
    });
    ingestAnalyticsBatch(
      tenant.id,
      [
        {
          eventType: 'quiz.submit',
          category: 'assessment',
          subjectId,
          chapterId,
          toolId: quizType || 'quiz',
          persona: difficulty,
          score,
          total,
          scorePct: result.percentage,
          durationMs: typeof timeTakenSeconds === 'number' ? timeTakenSeconds * 1000 : 0,
          status: 'completed',
        },
      ],
      {
        userId,
        sessionId: req.session?.sessionId,
        userEmail: req.session?.email,
        displayName: req.session?.displayName,
        userAgent: req.headers['user-agent'],
      }
    ).catch(() => {});
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error(`[UserState] Failed recording quiz attempt for '${userId}':`, err);
    res.status(500).json({ error: 'Failed to record quiz attempt' });
  }
});

// ── Legacy v2 Progress Routes (Preserved for Backwards Compatibility) ─────

/**
 * POST /v2/t/:tenant/progress
 * Saves student tool completion / audio listening progress.
 */
router.post('/:tenant/progress', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const userId = resolveUserId(req);
  const { subjectId, chapterId, tool, data } = req.body;

  if (!subjectId || !chapterId || !tool) {
    res.status(400).json({ error: 'subjectId, chapterId, and tool are required' });
    return;
  }

  try {
    await saveStudentProgress(userId, tenant.id, subjectId, chapterId, tool, data || {});
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Progress] Save failed:', err);
    res.status(500).json({ error: 'Failed to record student progress' });
  }
});

/**
 * GET /v2/t/:tenant/progress/:subjectId/:chapterId
 * Retrieves student tool progress for a given chapter.
 */
router.get(
  '/:tenant/progress/:subjectId/:chapterId',
  async (req: AuthenticatedRequest, res: Response) => {
    const tenant = req.tenant!;
    const userId = resolveUserId(req);
    const { subjectId, chapterId } = req.params;

    try {
      const progress = await getStudentProgress(userId, tenant.id, subjectId, chapterId);
      res.json({ progress });
    } catch (err: any) {
      console.error('[Progress] Fetch failed:', err);
      res.status(500).json({ error: 'Failed to retrieve progress' });
    }
  }
);

export default router;

