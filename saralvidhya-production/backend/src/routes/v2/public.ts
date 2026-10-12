import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant.js';
import { getTenantAuth } from '../../services/registry.js';
import { createSessionToken } from '../../services/session.js';

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
 * Public tenant branding, theme, and feature flags.
 */
router.get('/:tenant', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({
    tenant: req.tenant,
  });
});

/**
 * POST /v2/t/:tenant/login
 * Shared institution password authentication.
 */
router.post(
  '/:tenant/login',
  loginLimiter,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    const { password } = req.body;
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
    const token = createSessionToken({
      tenantId: tenant.id,
      role: 'student',
      sessionVersion: auth.sessionVersion || 1,
      sessionId,
    });

    res.json({
      success: true,
      token,
      expiresIn: '7d',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        branding: tenant.branding,
      },
    });
  }
);

export default router;
