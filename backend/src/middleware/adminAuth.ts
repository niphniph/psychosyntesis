import { Request, Response, NextFunction } from 'express';
import { Database } from '../db.js';

export interface AdminRequest extends Request {
  adminSessionToken?: string;
  adminUserId?: string;
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      list[name] = decodeURIComponent(val);
    }
  });
  return list;
}

// Collect every place an admin session token may arrive from. The public site also sends
// a user JWT in the Authorization header, so we must not stop at the first candidate.
export function getAdminTokenCandidates(req: Request): string[] {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = Array.isArray(req.headers['authorization']) ? req.headers['authorization'][0] : req.headers['authorization'];
  const xAdminHeader = Array.isArray(req.headers['x-admin-token']) ? req.headers['x-admin-token'][0] : req.headers['x-admin-token'];
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  return [xAdminHeader, cookies['admin_session'], bearer].filter((t): t is string => !!t);
}

export async function requireAdminSession(req: AdminRequest, res: Response, next: NextFunction) {
  try {
    const candidates = getAdminTokenCandidates(req);
    if (candidates.length === 0) {
      // Security requirement: return 404 Not Found when unauthorized
      return res.status(404).json({ message: 'Not Found' });
    }

    const db = await Database.read();
    const now = new Date().toISOString();
    const session = db.adminSessions.find(s => candidates.includes(s.token) && (!s.expiresAt || s.expiresAt >= now));

    if (!session) {
      const expired = db.adminSessions.filter(s => s.expiresAt && s.expiresAt < now);
      if (expired.length > 0) {
        db.adminSessions = db.adminSessions.filter(s => !s.expiresAt || s.expiresAt >= now);
        await Database.write(db);
      }
      return res.status(404).json({ message: 'Not Found' });
    }

    req.adminSessionToken = session.token;
    req.adminUserId = session.userId;
    next();
  } catch (error) {
    return res.status(404).json({ message: 'Not Found' });
  }
}
