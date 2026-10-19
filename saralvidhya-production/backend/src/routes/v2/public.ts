import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant.js';
import { getTenantAuth } from '../../services/registry.js';
import { createSessionToken } from '../../services/session.js';
import { ensureUserProfile } from '../../services/userState.js';

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
  res.json({
    tenant: req.tenant,
  });
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

export default router;

