import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant.js';
import { getTenantAuth } from '../../services/registry.js';
import { createSessionToken, extractSessionToken, verifySessionToken } from '../../services/session.js';
import { ensureUserProfile } from '../../services/userState.js';
import {
  getGlobalPlatformConfig,
  getCloudManifestAndCatalog,
  getCloudPracticeBank,
} from '../../services/platformConfigService.js';
import {
  ingestAnalyticsBatch,
  getTenantAnalyticsDashboardData,
} from '../../services/analyticsService.js';

const router = Router();

// Rate limiter: 10 attempts per 15 minutes per IP for tenant login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * GET /v2/t/:tenant
 * Public tenant branding, signed asset URLs, theme, and feature flags.
 */
router.get('/:tenant', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  const tenant = req.tenant!;
  const platformConfig = await getGlobalPlatformConfig().catch(() => null);
  const mergedTenant = platformConfig
    ? {
        ...tenant,
        uiCopy: { ...(platformConfig.uiCopy || {}), ...(tenant.uiCopy || {}) },
        translations: {
          en: {
            ...(platformConfig.translations?.en || {}),
            ...(tenant.translations?.en || {}),
          },
          te: {
            ...(platformConfig.translations?.te || {}),
            ...(tenant.translations?.te || {}),
          },
          hi: {
            ...(platformConfig.translations?.hi || {}),
            ...(tenant.translations?.hi || {}),
          },
        },
        assets: {
          ...(platformConfig.assets || {}),
          ...(tenant.assets || {}),
        },
      }
    : tenant;
  res.json({
    tenant: mergedTenant,
    platformConfig,
  });
});

/**
 * GET /v2/t/:tenant/platform-config
 * Returns DB-driven global + tenant UI copy, translations, global asset signed URLs, and subject routing.
 */
router.get('/:tenant/platform-config', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  const tenant = req.tenant!;
  const platformConfig = await getGlobalPlatformConfig();
  res.json({
    tenantId: tenant.id,
    platformConfig,
    tenantUiCopy: tenant.uiCopy || {},
    tenantTranslations: tenant.translations || {},
  });
});

/**
 * GET /v2/t/:tenant/cloud-manifest
 * Returns DB-driven manifest and catalog from Firestore platformConfig/manifest & platformConfig/catalog.
 */
router.get('/:tenant/cloud-manifest', tenantMiddleware, async (_req: TenantRequest, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  const data = await getCloudManifestAndCatalog();
  res.json(data);
});

/**
 * GET /v2/t/:tenant/practice-fallback
 * Returns DB-driven mock test and PYQ question banks from Firestore.
 */
router.get('/:tenant/practice-fallback', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  const tenant = req.tenant!;
  const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;
  const bank = await getCloudPracticeBank(tenant.id, subjectId);
  res.json(bank);
});

/**
 * POST /v2/t/:tenant/login
 * Shared institution password authentication + optional student identity.
 * Sets HttpOnly session cookies and returns JWT token + user profile.
 */
router.post(
  '/:tenant/login',
  loginLimiter,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    const { password, email, studentId, displayName, userKey } = req.body || {};
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const tenant = req.tenant!;
    const auth = await getTenantAuth(tenant.id);

    if (!auth || !auth.passwordHash) {
      res.status(403).json({ error: 'Authentication is not configured for this institution' });
      return;
    }

    const isMatch = await bcrypt.compare(password, auth.passwordHash);
    if (!isMatch) {
      ingestAnalyticsBatch(
        tenant.id,
        [
          {
            eventType: 'auth.login_failure',
            category: 'auth',
            status: 'failure',
            label: 'Incorrect password',
            metadata: { email: email || null, studentId: studentId || null },
          },
        ],
        {
          userEmail: email ? String(email).trim() : undefined,
          displayName: displayName ? String(displayName).trim() : undefined,
          userAgent: req.headers['user-agent'],
        }
      ).catch(() => {});
      res.status(401).json({ error: 'Incorrect password' });
      return;
    }

    const sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // Derive deterministic userId if email, studentId, or userKey is provided; otherwise scope to unique sessionId
    const rawIdentity = (email || studentId || userKey || displayName || '')
      .toString()
      .trim()
      .toLowerCase();
    const userId = rawIdentity
      ? `u_${tenant.id}_${crypto.createHash('sha256').update(rawIdentity).digest('hex').slice(0, 16)}`
      : `u_${tenant.id}_${sessionId.replace(/^s_/, '').slice(0, 16)}`;

    const token = createSessionToken({
      tenantId: tenant.id,
      role: 'student',
      sessionVersion: auth.sessionVersion || 1,
      sessionId,
      userId,
      email: email ? String(email).trim() : undefined,
      displayName: displayName ? String(displayName).trim() : undefined,
    });

    await ensureUserProfile({
      userId,
      tenantId: tenant.id,
      role: 'student',
      displayName: displayName ? String(displayName).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      studentId: studentId ? String(studentId).trim() : undefined,
    }).catch((err) => console.warn('[Login] Failed to ensure user profile:', err));
    ingestAnalyticsBatch(
      tenant.id,
      [
        {
          eventType: 'auth.login_success',
          category: 'auth',
          status: 'success',
          label: 'Institution login succeeded',
        },
      ],
      {
        userId,
        sessionId,
        userEmail: email ? String(email).trim() : undefined,
        displayName: displayName ? String(displayName).trim() : undefined,
        userAgent: req.headers['user-agent'],
      }
    ).catch(() => {});

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
    res.cookie(`sv_session_${tenant.id}`, token, cookieOpts);
    res.cookie('sv_session', token, cookieOpts);

    res.json({
      success: true,
      token,
      userId,
      expiresIn: '7d',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        shortName: tenant.shortName,
        academicTerm: tenant.academicTerm,
        branding: tenant.branding,
        assets: tenant.assets,
      },
    });
  }
);

/**
 * POST /v2/t/:tenant/logout
 * Clears HttpOnly session cookies for the tenant.
 */
router.post('/:tenant/logout', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenant = req.tenant!;
  const isProd = process.env.NODE_ENV === 'production';
  const clearOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
  res.clearCookie(`sv_session_${tenant.id}`, clearOpts);
  res.clearCookie('sv_session', clearOpts);
  res.json({ success: true });
});

/**
 * POST /v2/t/:tenant/events/batch
 * High-throughput telemetry ingestion endpoint (supports both pre-login & authenticated student events).
 * Persists events to Firestore `tenants/{tenantId}/analyticsEvents` and emits structured JSON logs to GCP Cloud Logging.
 */
router.post('/:tenant/events/batch', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenant = req.tenant!;
  const { events, sessionId: bodySessionId, userId: bodyUserId, userEmail, displayName, path: clientPath } =
    req.body || {};

  let resolvedUserId = bodyUserId ? String(bodyUserId) : undefined;
  let resolvedSessionId = bodySessionId ? String(bodySessionId) : undefined;
  let resolvedEmail = userEmail ? String(userEmail) : undefined;
  let resolvedName = displayName ? String(displayName) : undefined;

  const rawToken = extractSessionToken(req, tenant.id);
  if (rawToken) {
    try {
      const decoded = verifySessionToken(rawToken);
      if (decoded.tenantId === tenant.id) {
        resolvedUserId = decoded.userId || resolvedUserId;
        resolvedSessionId = decoded.sessionId || resolvedSessionId;
        resolvedEmail = decoded.email || resolvedEmail;
        resolvedName = decoded.displayName || resolvedName;
      }
    } catch {
      // Allow pre-auth / expired-token telemetry events through
    }
  }

  try {
    const result = await ingestAnalyticsBatch(
      tenant.id,
      Array.isArray(events) ? events : [],
      {
        userId: resolvedUserId,
        sessionId: resolvedSessionId,
        userEmail: resolvedEmail,
        displayName: resolvedName,
        path: clientPath ? String(clientPath) : undefined,
        userAgent: req.headers['user-agent'],
      }
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error(`[Analytics] Batch ingest failed for '${tenant.id}':`, err);
    res.status(500).json({ error: 'Failed to ingest analytics events' });
  }
});

/**
 * GET /v2/t/:tenant/analytics/summary
 * Returns real-time DB-driven analytics rollups, active sessions, and recent events from Firestore.
 */
router.get('/:tenant/analytics/summary', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const tenant = req.tenant!;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
  try {
    const summary = await getTenantAnalyticsDashboardData(tenant.id, limit);
    res.json(summary);
  } catch (err: any) {
    console.error(`[Analytics] Summary query failed for '${tenant.id}':`, err);
    res.status(500).json({ error: 'Failed to load analytics summary' });
  }
});
export default router;

