import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
let sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  if (isProduction) {
    throw new Error(
      "[FATAL SECURITY] SESSION_SECRET environment variable is missing in production! Server refused to start."
    );
  }
  // Ephemeral cryptographic secret for development sessions to prevent static key reuse
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    "[DEV SECURITY] No SESSION_SECRET set in environment. Generated ephemeral session secret for local dev run."
  );
}

const FINAL_SECRET = sessionSecret;

export type UserRole = 'student' | 'publisher' | 'approver';

export interface SessionPayload {
  tenantId: string;
  role: UserRole;
  sessionVersion: number;
  sessionId?: string;
  userId?: string;
  email?: string;
  displayName?: string;
}

/**
 * Creates a signed JWT session token.
 */
export function createSessionToken(
  payload: SessionPayload,
  expiresIn: string = '7d'
): string {
  return jwt.sign(payload, FINAL_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Verifies a JWT session token and returns the decoded payload.
 * Throws an error if invalid or expired.
 */
export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, FINAL_SECRET) as SessionPayload;
}

/**
 * Parses cookies from a raw Cookie header string without requiring external middleware.
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    }
  }
  return out;
}

/**
 * Extracts the session JWT from Authorization: Bearer header or HttpOnly session cookie.
 */
export function extractSessionToken(req: Request, tenantId?: string): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  const cookies = parseCookies(req.headers.cookie);
  if (tenantId && cookies[`sv_session_${tenantId}`]) {
    return cookies[`sv_session_${tenantId}`];
  }
  if (cookies['sv_session']) {
    return cookies['sv_session'];
  }
  return null;
}

