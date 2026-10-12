import jwt from 'jsonwebtoken';

const SESSION_SECRET = process.env.SESSION_SECRET || 'saralvidhya-default-dev-secret-key-replace-in-production-2026';

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
  return jwt.sign(payload, SESSION_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Verifies a JWT session token and returns the decoded payload.
 * Throws an error if invalid or expired.
 */
export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, SESSION_SECRET) as SessionPayload;
}
