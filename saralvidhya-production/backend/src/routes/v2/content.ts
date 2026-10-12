import { Router, Response } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.js';
import { requireSession, AuthenticatedRequest } from '../../middleware/requireSession.js';
import {
  getCatalog,
  getChapter,
  saveStudentProgress,
  getStudentProgress,
} from '../../services/registry.js';
import { getSignedUrlForFile } from '../../services/storage.js';

const router = Router();

// Apply tenant resolution and session requirement to all content routes
router.use('/:tenant', tenantMiddleware, requireSession);

/**
 * GET /v2/t/:tenant/catalog
 * Returns published subjects, hierarchy nodes, and grouping structure for the tenant.
 */
router.get('/:tenant/catalog', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  try {
    const catalog = await getCatalog(tenant.id);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.json({
      tenantId: tenant.id,
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
 * Returns chapter metadata, topic outline, and manifest of tool files.
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

      // Generate signed URLs for files in this chapter version
      const signedFiles: Record<string, string> = {};
      if (chapter.files) {
        const fileKeys = Object.keys(chapter.files);
        const signedPromises = fileKeys.map(async (key) => {
          const fileEntry = chapter.files![key];
          // GCS path is {tenant.storage.prefix}/{fileEntry.path}
          const gcsPath = `${tenant.storage.prefix}/${fileEntry.path.replace(/^\/+/, '')}`;
          try {
            signedFiles[key] = await getSignedUrlForFile(gcsPath, 60); // 60 mins signed URL
          } catch (e) {
            console.warn(`[Content] Failed signing URL for ${gcsPath}:`, e);
          }
        });
        await Promise.all(signedPromises);
      }

      res.setHeader('Cache-Control', 'private, max-age=60');
      res.json({
        chapter: {
          id: chapter.id,
          number: chapter.number,
          title: chapter.title,
          currentVersion: chapter.currentVersion,
          topics: chapter.topics,
          tools: chapter.tools,
        },
        files: signedFiles,
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
  const filePath = (req.query.path as string || '').trim();

  if (!filePath) {
    res.status(400).json({ error: 'File path query parameter is required' });
    return;
  }

  // Prevent path traversal outside tenant prefix
  if (filePath.includes('..') || filePath.startsWith('/')) {
    res.status(400).json({ error: 'Invalid file path' });
    return;
  }

  const gcsPath = `${tenant.storage.prefix}/${filePath}`;
  try {
    const signedUrl = await getSignedUrlForFile(gcsPath, 30);
    res.json({ signedUrl, expiresInMinutes: 30 });
  } catch (err: any) {
    console.error(`[Content] Failed signing URL for '${gcsPath}':`, err);
    res.status(500).json({ error: 'Could not generate signed download URL' });
  }
});

/**
 * POST /v2/t/:tenant/progress
 * Saves student tool completion / audio listening progress.
 */
router.post('/:tenant/progress', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = req.tenant!;
  const sessionId = req.session?.sessionId || 'anon';
  const { subjectId, chapterId, tool, data } = req.body;

  if (!subjectId || !chapterId || !tool) {
    res.status(400).json({ error: 'subjectId, chapterId, and tool are required' });
    return;
  }

  try {
    await saveStudentProgress(sessionId, tenant.id, subjectId, chapterId, tool, data || {});
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
    const sessionId = req.session?.sessionId || 'anon';
    const { subjectId, chapterId } = req.params;

    try {
      const progress = await getStudentProgress(sessionId, tenant.id, subjectId, chapterId);
      res.json({ progress });
    } catch (err: any) {
      console.error('[Progress] Fetch failed:', err);
      res.status(500).json({ error: 'Failed to retrieve progress' });
    }
  }
);

export default router;
