import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './requireSession.js';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

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
  if (ADMIN_API_KEY && adminKey && adminKey === ADMIN_API_KEY) {
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
