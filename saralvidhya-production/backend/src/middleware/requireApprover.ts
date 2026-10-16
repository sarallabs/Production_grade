import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './requireSession.js';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Middleware: restricts access to platform approvers/admins.
 * Accepts either a valid JWT with role='approver' or X-Admin-Key matching ADMIN_API_KEY.
 */
export async function requireApprover(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const adminKey = req.headers['x-admin-key'] as string;
  if (ADMIN_API_KEY && adminKey && safeCompare(adminKey, ADMIN_API_KEY)) {
    req.session = {
      tenantId: 'system',
      role: 'approver',
      sessionVersion: 1,
    };
    return next();
  }

  if (req.session && req.session.role === 'approver') {
    return next();
  }

  res.status(403).json({ error: 'Approver privileges required' });
}
