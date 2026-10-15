import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
  email?: string;
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
