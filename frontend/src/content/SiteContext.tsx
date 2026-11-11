import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';
import { contentDefaults } from './schema';

export interface NavItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  isVisible: boolean;
  sortOrder: number;
  parentId?: string;
}

interface SiteContextValue {
  settings: Record<string, string>;
  /** Text/image value for a content key, falling back to the schema default */
  t: (key: string, fallback?: string) => string;
  /** Splits a multi-line content value into its non-empty lines */
  lines: (key: string) => string[];
  nav: NavItem[];
  /** Navigate to an admin-entered link: "/founder", "/#about", "/my-page", "https://..." */
  go: (url?: string) => void;
  refresh: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | null>(null);

// Built-in pages of the single-page app; any other path is treated as a CMS page slug
export const BUILT_IN_PAGES = ['home', 'founder', 'academic', 'events', 'practice', 'workspace', 'login'];

export interface ResolvedLink {
  external?: string;
  page?: string;
  hash?: string;
}

export const resolveLink = (url?: string): ResolvedLink => {
  const raw = (url || '').trim();
  if (!raw) return { page: 'home' };
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return { external: raw };

  const [pathPart, hash] = raw.split('#');
  const path = pathPart.replace(/^\/+|\/+$/g, '').replace(/^psychosynthesis\/?/, '');
  if (!path) return { page: 'home', hash };

  const [first, second] = path.split('/');
  if (BUILT_IN_PAGES.includes(first)) return { page: first, hash };
  if ((first === 'post' || first === 'article') && second) return { page: `post-${second}`, hash };
  if (first === 'blog' && second) return { page: `blog-${second}`, hash };
  if (first === 'page' && second) return { page: `custom-${second}`, hash };
  return { page: `custom-${first}`, hash };
};

export const SiteProvider: React.FC<{
  onNavigate: (page: string, scrollToId?: string) => void;
  children: React.ReactNode;
}> = ({ onNavigate, children }) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [nav, setNav] = useState<NavItem[]>([]);

  const refresh = useCallback(async () => {
    const [settingsRes, navRes] = await Promise.allSettled([api.get('/settings'), api.get('/navigation')]);
    if (settingsRes.status === 'fulfilled' && settingsRes.value.data && typeof settingsRes.value.data === 'object' && !Array.isArray(settingsRes.value.data)) {
      setSettings(settingsRes.value.data);
    }
    if (navRes.status === 'fulfilled' && Array.isArray(navRes.value.data)) {
      setNav(navRes.value.data);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const t = useCallback((key: string, fallback?: string) => {
    // A saved value wins even when empty, so admins can deliberately hide a text
    const v = settings[key];
    if (typeof v === 'string') return v;
    return contentDefaults[key] ?? fallback ?? '';
  }, [settings]);

  const lines = useCallback((key: string) => t(key).split('\n').map(l => l.trim()).filter(Boolean), [t]);

  const go = useCallback((url?: string) => {
    const link = resolveLink(url);
    if (link.external) {
      window.open(link.external, '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigate(link.page || 'home', link.hash);
  }, [onNavigate]);

  return (
    <SiteContext.Provider value={{ settings, t, lines, nav, go, refresh }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
};
