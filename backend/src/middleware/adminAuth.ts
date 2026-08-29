import { Request, Response, NextFunction } from 'express';
import { Database } from '../db.js';

export interface AdminRequest extends Request {
  adminSessionToken?: string;
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

export async function requireAdminSession(req: AdminRequest, res: Response, next: NextFunction) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const authHeader = Array.isArray(req.headers['authorization']) ? req.headers['authorization'][0] : req.headers['authorization'];
    const xAdminHeader = Array.isArray(req.headers['x-admin-token']) ? req.headers['x-admin-token'][0] : req.headers['x-admin-token'];
    const sessionToken = 
      cookies['admin_session'] || 
      (authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : xAdminHeader);

    if (!sessionToken) {
      // Security requirement: return 404 Not Found when unauthorized
      return res.status(404).json({ message: 'Not Found' });
    }

    const db = await Database.read();
    const session = db.adminSessions.find(s => s.token === sessionToken);

    if (!session) {
      return res.status(404).json({ message: 'Not Found' });
    }

    const now = new Date().toISOString();
    if (session.expiresAt && session.expiresAt < now) {
      // Remove expired session
      db.adminSessions = db.adminSessions.filter(s => s.token !== sessionToken);
      await Database.write(db);
      return res.status(404).json({ message: 'Not Found' });
    }

    req.adminSessionToken = sessionToken;
    next();
  } catch (error) {
    return res.status(404).json({ message: 'Not Found' });
  }
}
