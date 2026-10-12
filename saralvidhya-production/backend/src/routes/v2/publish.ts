import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireApprover } from '../../middleware/requireApprover.js';
import { AuthenticatedRequest } from '../../middleware/requireSession.js';
import {
  createPublishRequest,
  getPublishRequest,
  listPendingPublishRequests,
  approvePublishRequest,
  rejectPublishRequest,
  setTenantPassword,
  getTenant,
  markPublishRequestPending,
} from '../../services/registry.js';
import { getSignedUploadUrl, findMissingFiles } from '../../services/storage.js';
import { Firestore } from '@google-cloud/firestore';

const router = Router();
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'saralvidhya-production';
const firestore = new Firestore({ projectId: PROJECT_ID });

function publisherAllowed(req: AuthenticatedRequest): boolean {
  const publishKey = process.env.PUBLISH_API_KEY;
  const adminKey = process.env.ADMIN_API_KEY;
  if (!publishKey) return true; // not enforced until configured
  const provided = req.header('X-Publish-Key') || req.header('X-Admin-Key') || '';
  return provided === publishKey || (!!adminKey && provided === adminKey);
}

function guessContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    json: 'application/json', md: 'text/markdown', txt: 'text/plain',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    svg: 'image/svg+xml', webp: 'image/webp', m4a: 'audio/mp4', mp3: 'audio/mpeg',
    mp4: 'video/mp4', pdf: 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * POST /v2/publish/submit
 * Publisher registers a publish request. Returns signed PUT URLs for each file;
 * the publisher uploads to staging, then calls /requests/:id/complete.
 */
router.post('/submit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!publisherAllowed(req)) {
      return res.status(401).json({ error: 'Invalid or missing publisher key (X-Publish-Key)' });
    }
    const { tenantId, scope, files, submittedBy, diffSummary } = req.body;

    if (!tenantId || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'tenantId and non-empty files array are required' });
    }
    for (const f of files) {
      const p = String(f?.path || '');
      if (!p || p.startsWith('/') || p.split('/').includes('..')) {
        return res.status(400).json({ error: `Invalid file path: '${p}'` });
      }
    }

    let tenant = await getTenant(tenantId);
    if (!tenant) {
      // Auto-create tenant in 'pending' status so publishers don't need manual pre-registration
      const rawTenantConfig = req.body?.tenantConfig || {};
      const tenantRef = firestore.collection('tenants').doc(tenantId);
      const newTenantData: Record<string, any> = {
        name: rawTenantConfig.name || tenantId,
        shortName: rawTenantConfig.shortName || tenantId,
        status: 'pending',
        branding: rawTenantConfig.branding || { primaryColor: '#2563eb', appName: rawTenantConfig.name || tenantId },
        features: rawTenantConfig.features || {},
        hierarchy: rawTenantConfig.hierarchy || ['program', 'subject'],
        nodes: rawTenantConfig.nodes || [],
        storage: {
          bucket: process.env.GCS_BUCKET_NAME || 'saralvidhya-artifacts',
          prefix: tenantId,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        domains: [],
      };
      await tenantRef.set(newTenantData, { merge: true });
      tenant = await getTenant(tenantId);
    }

    const normalized = files.map((f: any) => ({
      path: String(f.path),
      stagingPath: '',
      size: f.size,
      contentType: f.contentType || guessContentType(String(f.path)),
    }));

    const requestId = await createPublishRequest(
      {
        tenantId,
        scope: scope || 'batch',
        diffSummary: diffSummary || {},
        files: normalized,
        submittedBy: submittedBy || 'sv-publisher',
      },
      'uploading'
    );

    const uploads = await Promise.all(
      normalized.map(async (f) => ({
        path: f.path,
        contentType: f.contentType,
        url: await getSignedUploadUrl(`staging/${requestId}/${f.path}`, f.contentType),
      }))
    );

    return res.status(201).json({
      requestId,
      status: 'uploading',
      uploads,
      message: `Upload ${uploads.length} file(s), then call POST /v2/publish/requests/${requestId}/complete.`,
    });
  } catch (error: any) {
    console.error('[Publish Submit Error]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /v2/publish/requests/:id/complete
 * Verifies every file reached staging, then marks the request pending approval.
 */
router.post('/requests/:id/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!publisherAllowed(req)) {
      return res.status(401).json({ error: 'Invalid or missing publisher key (X-Publish-Key)' });
    }
    const request = await getPublishRequest(req.params.id);
    if (!request) return res.status(404).json({ error: 'Publish request not found' });
    if (request.status !== 'uploading') {
      return res.status(409).json({ error: `Request is '${request.status}', not 'uploading'` });
    }
    const missing = await findMissingFiles(request.files.map((f) => `staging/${request.id}/${f.path}`));
    if (missing.length > 0) {
      return res.status(422).json({
        error: `${missing.length} file(s) not uploaded yet`,
        missing: missing.slice(0, 20).map((m) => m.replace(`staging/${request.id}/`, '')),
      });
    }
    await markPublishRequestPending(request.id);
    return res.json({ requestId: request.id, status: 'pending', message: 'Awaiting approval.' });
  } catch (error: any) {
    console.error('[Publish Complete Error]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});


/**
 * GET /v2/publish/requests
 * Lists all pending publish requests (Approver only).
 */
router.get('/requests', requireApprover, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await listPendingPublishRequests();
    return res.json({ requests });
  } catch (error: any) {
    console.error('[Publish List Error]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /v2/publish/requests/:id
 * Fetches a specific publish request details (Approver only).
 */
router.get('/requests/:id', requireApprover, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = await getPublishRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Publish request not found' });
    }
    return res.json({ request });
  } catch (error: any) {
    console.error('[Publish Detail Error]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /v2/publish/requests/:id/approve
 * Approves a publish request, promoting files from staging to live and updating the registry.
 */
router.post('/requests/:id/approve', requireApprover, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const approvedBy = req.body?.approvedBy || req.session?.role || 'admin';

    const result = await approvePublishRequest(id, approvedBy);

    return res.json({
      success: true,
      message: `Publish request ${id} approved successfully and promoted to live.`,
      generatedPassword: result.generatedPassword || undefined,
    });
  } catch (error: any) {
    console.error('[Publish Approve Error]', error);
    return res.status(500).json({ error: error.message || 'Approval failed' });
  }
});

/**
 * POST /v2/publish/requests/:id/reject
 * Rejects a publish request with a feedback note.
 */
router.post('/requests/:id/reject', requireApprover, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, decidedBy } = req.body || {};
    const approver = decidedBy || req.session?.role || 'admin';

    await rejectPublishRequest(id, approver, note);

    return res.json({
      success: true,
      message: `Publish request ${id} rejected.`,
    });
  } catch (error: any) {
    console.error('[Publish Reject Error]', error);
    return res.status(500).json({ error: error.message || 'Rejection failed' });
  }
});

/**
 * POST /v2/publish/set-password
 * Sets or updates the shared bcrypt password for a tenant.
 */
router.post('/set-password', requireApprover, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, password, hash } = req.body;
    if (!tenantId || (!password && !hash)) {
      return res.status(400).json({ error: 'tenantId and either password or hash are required' });
    }

    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: `Tenant '${tenantId}' not found.` });
    }

    const passwordHash = hash || (await bcrypt.hash(password, 10));
    const sessionVersion = await setTenantPassword(tenantId, passwordHash);

    return res.json({
      success: true,
      tenantId,
      sessionVersion,
      message: `Password updated and existing sessions invalidated for tenant ${tenantId}.`,
    });
  } catch (error: any) {
    console.error('[Publish Set-Password Error]', error);
    return res.status(500).json({ error: error.message || 'Password update failed' });
  }
});

/**
 * POST /v2/publish/register-tenant
 * Directly creates or updates tenant metadata and schema.
 */
router.post('/register-tenant', requireApprover, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, name, shortName, branding, features, hierarchy, storage, password } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }

    const tenantRef = firestore.collection('tenants').doc(id);
    const existing = await tenantRef.get();

    const tenantData: Record<string, any> = {
      name,
      shortName: shortName || name,
      status: 'active',
      branding: branding || { primaryColor: '#2563eb', appName: name },
      features: features || {},
      hierarchy: hierarchy || ['program', 'subject'],
      storage: storage || {
        bucket: 'saralvidhya-artifacts',
        prefix: `${id}`,
      },
      updatedAt: new Date().toISOString(),
    };

    if (!existing.exists) {
      tenantData.createdAt = new Date().toISOString();
      tenantData.domains = [];
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      tenantData.auth = {
        passwordHash,
        sessionVersion: 1,
        updatedAt: new Date().toISOString(),
      };
    }

    await tenantRef.set(tenantData, { merge: true });

    return res.json({
      success: true,
      tenantId: id,
      message: `Tenant '${id}' registered/updated successfully.`,
    });
  } catch (error: any) {
    console.error('[Publish Register-Tenant Error]', error);
    return res.status(500).json({ error: error.message || 'Tenant registration failed' });
  }
});

export default router;
