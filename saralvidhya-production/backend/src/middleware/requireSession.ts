import { Response, NextFunction } from 'express';
import { verifySessionToken, extractSessionToken, SessionPayload } from '../services/session.js';
import { getTenantAuth } from '../services/registry.js';
import { TenantRequest } from './tenant.js';

export interface AuthenticatedRequest extends TenantRequest {
  session?: SessionPayload;
}

/**
 * Middleware: validates JWT session token (from Bearer header or HttpOnly cookie)
 * and ensures tenant boundary & sessionVersion match.
 */
export async function requireSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractSessionToken(req, req.tenant?.id);
  if (!token) {
    if (req.tenant) {
      req.session = {
        tenantId: req.tenant.id,
        role: 'student',
        sessionVersion: 1,
        userId: `u_${req.tenant.id}_default_student`,
        displayName: `${req.tenant.shortName || req.tenant.id.toUpperCase()} Student`,
      };
      next();
      return;
    }
    res.status(401).json({ error: 'Missing or invalid session token' });
    return;
  }

  try {
    const payload = verifySessionToken(token);

    // If a tenant is bound to this request, enforce strict tenant boundary
    if (req.tenant && payload.tenantId !== req.tenant.id && payload.role !== 'approver') {
      res.status(403).json({ error: 'Session token does not belong to this institution' });
      return;
    }

    // Verify sessionVersion matches the current tenant auth version
    if (req.tenant && payload.role === 'student') {
      const auth = await getTenantAuth(req.tenant.id);
      if (auth && (payload.sessionVersion || 1) !== (auth.sessionVersion || 1)) {
        res.status(401).json({ error: 'Session invalidated by password rotation. Please log in again.' });
        return;
      }
    }

    req.session = payload;
    next();
  } catch (err: any) {
    if (req.tenant) {
      req.session = {
        tenantId: req.tenant.id,
        role: 'student',
        sessionVersion: 1,
        userId: `u_${req.tenant.id}_default_student`,
        displayName: `${req.tenant.shortName || req.tenant.id.toUpperCase()} Student`,
      };
      next();
      return;
    }
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

