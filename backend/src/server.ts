import express, { Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import { 
  Database, User, Subpersonality, MeditationLog, JournalEntry, 
  Course, LibraryResource, Blog, Event, Inquiry, Registration, 
  SeoSetting, Post, Page, HomepageSection, NavigationItem, 
  MediaItem, ActivityLogItem, AdminSession 
} from './db.js';
import { authenticateToken, AuthenticatedRequest } from './middleware/auth.js';
import { requireAdminSession, parseCookies, AdminRequest } from './middleware/adminAuth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'psychosynthesis_secret_key_123';
const ADMIN_ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN || 'gip_sec_admin_token_2026_913x99_a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1';

app.use(cors());
app.use(express.json());

// Set up static uploads folder
const uploadsDir = path.join(__dirname, '..', 'uploads');
try {
  if (!fsSync.existsSync(uploadsDir)) {
    fsSync.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create uploads directory:', err);
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage for Media Uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed.'));
    }
  }
});

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Activity Logger helper
const logActivity = async (action: string, entityType: string, details: string, entityId?: string) => {
  try {
    const db = await Database.read();
    if (!db.activityLog) db.activityLog = [];
    db.activityLog.unshift({
      id: generateId(),
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    });
    if (db.activityLog.length > 300) {
      db.activityLog = db.activityLog.slice(0, 300);
    }
    await Database.write(db);
  } catch (err) {
    console.error('Activity logging failed:', err);
  }
};

// Admin validation middleware
const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const db = await Database.read();
    const user = db.users.find(u => u.id === req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'წვდომა უარყოფილია (საჭიროა ადმინისტრატორის უფლებები)' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'ადმინისტრატორის შემოწმების შეცდომა' });
  }
};

// Seed 3 administrator accounts if they don't exist or ensure credentials
const seedAdmin = async () => {
  try {
    const db = await Database.read();
    const adminsToSeed = [
      { id: 'admin-1-id', username: 'admin', name: 'Dr. Elene Kvantaliani (Chief Admin)' },
      { id: 'admin-2-id', username: 'admin2', name: 'Dr. K. Abashidze (Senior Editor)' },
      { id: 'admin-3-id', username: 'admin3', name: 'Nino Kapanadze (Project Director)' }
    ];

    let modified = false;
    for (const a of adminsToSeed) {
      const exists = db.users.find(u => u.username && u.username.toLowerCase() === a.username.toLowerCase());
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      if (!exists) {
        db.users.push({
          id: a.id,
          username: a.username,
          passwordHash,
          name: a.name,
          role: 'admin'
        });
        modified = true;
      } else {
        const isMatch = await bcrypt.compare('admin123', exists.passwordHash || '');
        if (!isMatch || exists.role !== 'admin') {
          exists.role = 'admin';
          exists.passwordHash = passwordHash;
          modified = true;
        }
      }
    }

    if (modified) {
      await Database.write(db);
      console.log('3 Administrator accounts verified: admin, admin2, admin3 (password: admin123)');
    }
  } catch (error) {
    console.error('Error seeding administrator accounts:', error);
  }
};

seedAdmin();

// --- SECRET ADMIN ACCESS & SESSION ENDPOINTS ---

// Secret Admin Access URL Handler (e.g. /api/admin/access/:token)
app.get('/api/admin/access/:token', async (req, res) => {
  const { token } = req.params;

  if (!token || token !== ADMIN_ACCESS_TOKEN) {
    // Security Requirement: Return 404 Not Found if token is invalid
    return res.status(404).json({ message: 'Not Found' });
  }

  try {
    const db = await Database.read();
    if (!db.adminSessions) db.adminSessions = [];

    const sessionToken = 'session_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.adminSessions.push({
      token: sessionToken,
      createdAt: new Date().toISOString(),
      expiresAt
    });

    await Database.write(db);

    res.cookie('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    await logActivity('Admin Login', 'Auth', 'Admin entered via secret URL token');

    res.json({
      success: true,
      redirect: '/psychosynthesis/admin/dashboard',
      sessionToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Admin Session Verification
app.get('/api/admin/auth/verify', requireAdminSession, (req: AdminRequest, res: Response) => {
  res.json({ success: true, authenticated: true, sessionToken: req.adminSessionToken });
});

// Admin Logout
app.post('/api/admin/logout', async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const authHeader = Array.isArray(req.headers['authorization']) ? req.headers['authorization'][0] : req.headers['authorization'];
    const sessionToken = cookies['admin_session'] || (authHeader?.split(' ')[1]);

    if (sessionToken) {
      const db = await Database.read();
      db.adminSessions = (db.adminSessions || []).filter(s => s.token !== sessionToken);
      await Database.write(db);
    }

    res.clearCookie('admin_session', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
});

// --- PUBLIC CMS ENDPOINTS ---

// Public Posts Endpoint (filters out drafts and hidden posts)
app.get('/api/posts', async (req, res) => {
  try {
    const { location, category, search, featured } = req.query;
    const db = await Database.read();
    let posts = (db.posts || []).filter(p => p.status === 'published');

    if (location) {
      const locStr = String(location).toLowerCase();
      posts = posts.filter(p => p.displayLocations && p.displayLocations.some(l => l.toLowerCase() === locStr || l.toLowerCase().includes(locStr)));
    }
    if (category) {
      posts = posts.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (featured === 'true') {
      posts = posts.filter(p => p.featured);
    }
    if (search) {
      const q = String(search).toLowerCase();
      posts = posts.filter(p => p.title.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q));
    }

    posts.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Public Single Post Endpoint
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = await Database.read();
    const post = (db.posts || []).find(p => (p.slug === slug || p.id === slug) && p.status === 'published');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post' });
  }
});

// Public Pages Endpoint (by slug)
app.get('/api/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = await Database.read();
    const page = (db.pages || []).find(p => p.slug === slug && p.status === 'published');
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching page' });
  }
});

// Public Homepage Sections Endpoint
app.get('/api/homepage-sections', async (req, res) => {
  try {
    const db = await Database.read();
    const sections = (db.homepageSections || [])
      .filter(s => s.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching homepage sections' });
  }
});

// Public Navigation Endpoint
app.get('/api/navigation', async (req, res) => {
  try {
    const db = await Database.read();
    const nav = (db.navigationItems || [])
      .filter(n => n.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(nav);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching navigation' });
  }
});

// --- CMS ADMIN ENDPOINTS (PROTECTED BY ADMIN SESSION) ---

// Dashboard Overview Statistics
app.get('/api/admin/cms-overview', requireAdminSession, async (_req, res) => {
  try {
    const db = await Database.read();
    const totalUsers = (db.users || []).length;
    const publishedPosts = (db.posts || []).filter(p => p.status === 'published').length;
    const draftPosts = (db.posts || []).filter(p => p.status === 'draft').length;
    const totalPages = (db.pages || []).length;
    const recentActivity = (db.activityLog || []).slice(0, 10);
    const recentRegistrations = (db.registrations || []).slice(-5).reverse();

    res.json({
      totalUsers,
      publishedPosts,
      draftPosts,
      totalPages,
      recentActivity,
      recentRegistrations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overview' });
  }
});

// 1. Posts Manager CRUD
app.get('/api/admin/posts', requireAdminSession, async (_req, res) => {
  try {
    const db = await Database.read();
    const posts = (db.posts || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin posts' });
  }
});

app.post('/api/admin/posts', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { title, slug, shortDescription, content, featuredImage, category, tags, author, status, featured, visibility, displayLocations, seoTitle, seoDescription } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const db = await Database.read();
    if (!db.posts) db.posts = [];

    const autoSlug = (slug || title).toLowerCase().trim().replace(/[^\w\u0400-\u04FF\u10A0-\u10FF\s-]/g, '').replace(/\s+/g, '-');
    const newPost: Post = {
      id: generateId(),
      title,
      slug: autoSlug || generateId(),
      shortDescription: shortDescription || '',
      content: content || '',
      featuredImage: featuredImage || '',
      category: category || 'General',
      tags: Array.isArray(tags) ? tags : [],
      author: author || 'Admin',
      publishDate: new Date().toISOString(),
      status: status || 'draft',
      featured: !!featured,
      visibility: visibility || 'public',
      displayLocations: Array.isArray(displayLocations) ? displayLocations : ['articles'],
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || shortDescription || '',
      sortOrder: db.posts.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.posts.push(newPost);
    await Database.write(db);
    await logActivity('Post Created', 'Post', `Created post "${title}"`, newPost.id);

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post' });
  }
});

app.put('/api/admin/posts/:id', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = (db.posts || []).findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Post not found' });

    const updated = {
      ...db.posts[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    db.posts[idx] = updated;
    await Database.write(db);
    await logActivity('Post Updated', 'Post', `Updated post "${updated.title}"`, updated.id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating post' });
  }
});

app.post('/api/admin/posts/:id/duplicate', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const original = (db.posts || []).find(p => p.id === id);
    if (!original) return res.status(404).json({ message: 'Post not found' });

    const duplicated: Post = {
      ...original,
      id: generateId(),
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.posts.push(duplicated);
    await Database.write(db);
    await logActivity('Post Duplicated', 'Post', `Duplicated post "${original.title}"`, duplicated.id);

    res.status(201).json(duplicated);
  } catch (error) {
    res.status(500).json({ message: 'Error duplicating post' });
  }
});

app.delete('/api/admin/posts/:id', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = (db.posts || []).findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Post not found' });

    const postTitle = db.posts[idx].title;
    db.posts.splice(idx, 1);
    await Database.write(db);
    await logActivity('Post Deleted', 'Post', `Deleted post "${postTitle}"`, String(id));

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
});

app.put('/api/admin/posts/reorder', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds array required' });

    const db = await Database.read();
    db.posts.forEach(p => {
      const idx = orderedIds.indexOf(p.id);
      if (idx !== -1) p.sortOrder = idx + 1;
    });

    await Database.write(db);
    await logActivity('Posts Reordered', 'Post', 'Updated display order for posts');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error reordering posts' });
  }
});

// 2. Pages Manager CRUD
app.get('/api/admin/pages', requireAdminSession, async (_req, res) => {
  try {
    const db = await Database.read();
    res.json(db.pages || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pages' });
  }
});

app.post('/api/admin/pages', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { title, slug, content, heroImage, seoTitle, seoDescription, status, navVisible } = req.body;
    if (!title || !slug) return res.status(400).json({ message: 'Title and slug required' });

    const db = await Database.read();
    if (!db.pages) db.pages = [];

    const cleanSlug = slug.toLowerCase().trim().replace(/[^\w-]/g, '');
    const newPage: Page = {
      id: generateId(),
      title,
      slug: cleanSlug,
      content: content || '',
      heroImage: heroImage || '',
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || '',
      status: status || 'draft',
      navVisible: navVisible !== undefined ? !!navVisible : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.pages.push(newPage);
    await Database.write(db);
    await logActivity('Page Created', 'Page', `Created page "${title}" (${cleanSlug})`, newPage.id);

    res.status(201).json(newPage);
  } catch (error) {
    res.status(500).json({ message: 'Error creating page' });
  }
});

app.put('/api/admin/pages/:id', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = (db.pages || []).findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Page not found' });

    const updated = {
      ...db.pages[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    db.pages[idx] = updated;
    await Database.write(db);
    await logActivity('Page Updated', 'Page', `Updated page "${updated.title}"`, updated.id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating page' });
  }
});

app.delete('/api/admin/pages/:id', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = (db.pages || []).findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Page not found' });

    const pageTitle = db.pages[idx].title;
    db.pages.splice(idx, 1);
    await Database.write(db);
    await logActivity('Page Deleted', 'Page', `Deleted page "${pageTitle}"`, String(id));

    res.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting page' });
  }
});

// 3. Homepage Sections Manager
app.get('/api/admin/homepage-sections', requireAdminSession, async (_req, res) => {
  try {
    const db = await Database.read();
    const sections = (db.homepageSections || []).sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sections' });
  }
});

app.put('/api/admin/homepage-sections', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) return res.status(400).json({ message: 'Sections array required' });

    const db = await Database.read();
    db.homepageSections = sections;
    await Database.write(db);
    await logActivity('Homepage Updated', 'Homepage', 'Updated homepage layout and sections');

    res.json(db.homepageSections);
  } catch (error) {
    res.status(500).json({ message: 'Error updating homepage sections' });
  }
});

app.put('/api/admin/homepage-sections/reorder', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds array required' });

    const db = await Database.read();
    db.homepageSections.forEach(s => {
      const idx = orderedIds.indexOf(s.id);
      if (idx !== -1) s.sortOrder = idx + 1;
    });

    await Database.write(db);
    await logActivity('Homepage Reordered', 'Homepage', 'Reordered homepage sections');

    res.json(db.homepageSections);
  } catch (error) {
    res.status(500).json({ message: 'Error reordering sections' });
  }
});

// 4. Navigation Manager
app.get('/api/admin/navigation', requireAdminSession, async (_req, res) => {
  try {
    const db = await Database.read();
    const nav = (db.navigationItems || []).sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(nav);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching navigation' });
  }
});

app.put('/api/admin/navigation', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Items array required' });

    const db = await Database.read();
    db.navigationItems = items;
    await Database.write(db);
    await logActivity('Navigation Updated', 'Navigation', 'Updated header navigation menu items');

    res.json(db.navigationItems);
  } catch (error) {
    res.status(500).json({ message: 'Error updating navigation' });
  }
});

app.put('/api/admin/navigation/reorder', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds array required' });

    const db = await Database.read();
    db.navigationItems.forEach(n => {
      const idx = orderedIds.indexOf(n.id);
      if (idx !== -1) n.sortOrder = idx + 1;
    });

    await Database.write(db);
    await logActivity('Navigation Reordered', 'Navigation', 'Reordered menu items');

    res.json(db.navigationItems);
  } catch (error) {
    res.status(500).json({ message: 'Error reordering navigation' });
  }
});

// 5. Media Library Manager
app.get('/api/admin/media', requireAdminSession, async (_req, res) => {
  try {
    const db = await Database.read();
    res.json(db.media || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching media' });
  }
});

app.post('/api/admin/media/upload', requireAdminSession, upload.single('image'), async (req: AdminRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const db = await Database.read();
    if (!db.media) db.media = [];

    const newMedia: MediaItem = {
      id: generateId(),
      filename: req.file.filename,
      url: fileUrl,
      mimeType: req.file.mimetype,
      size: req.file.size,
      altText: req.body.altText || req.file.originalname,
      createdAt: new Date().toISOString()
    };

    db.media.unshift(newMedia);
    await Database.write(db);
    await logActivity('Media Uploaded', 'Media', `Uploaded image "${req.file.filename}"`, newMedia.id);

    res.status(201).json(newMedia);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Media upload failed' });
  }
});

app.delete('/api/admin/media/:id', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = (db.media || []).findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Media not found' });

    const mediaItem = db.media[idx];
    const filePath = path.join(uploadsDir, mediaItem.filename);
    try {
      if (fsSync.existsSync(filePath)) {
        fsSync.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error unlinking file:', e);
    }

    db.media.splice(idx, 1);
    await Database.write(db);
    await logActivity('Media Deleted', 'Media', `Deleted image "${mediaItem.filename}"`, String(id));

    res.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting media' });
  }
});

// 6. User Management (No passwords exposed)
app.get('/api/admin/users', requireAdminSession, async (_req, res) => {
  try {
    const db = await Database.read();
    const safeUsers = (db.users || []).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email || u.username,
      name: u.name,
      role: u.role || 'user',
      status: (u as any).status || 'active',
      createdAt: (u as any).createdAt || new Date().toISOString()
    }));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.put('/api/admin/users/:id/status', requireAdminSession, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'disabled'
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const db = await Database.read();
    const idx = (db.users || []).findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });

    (db.users[idx] as any).status = status;
    await Database.write(db);
    await logActivity('User Status Changed', 'User', `User "${db.users[idx].name}" set to ${status}`, String(id));

    res.json({ id: db.users[idx].id, name: db.users[idx].name, status });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// 7. Activity Log
app.get('/api/admin/activity', requireAdminSession, async (_req, res) => {
  try {
    const db = await Database.read();
    res.json(db.activityLog || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity log' });
  }
});

// --- PUBLIC READ ENDPOINTS (CONNECTED TO DATABASE) ---

app.get('/api/courses', async (req, res) => {
  try {
    const db = await Database.read();
    res.json(db.courses);
  } catch (error) {
    res.status(500).json({ message: 'კურსების წაკითხვის შეცდომა' });
  }
});

app.get('/api/resources', async (req, res) => {
  try {
    const db = await Database.read();
    res.json(db.resources);
  } catch (error) {
    res.status(500).json({ message: 'ბიბლიოთეკის წაკითხვის შეცდომა' });
  }
});

app.get('/api/blogs', async (req, res) => {
  try {
    const db = await Database.read();
    res.json(db.blogs);
  } catch (error) {
    res.status(500).json({ message: 'ბლოგების წაკითხვის შეცდომა' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const db = await Database.read();
    res.json(db.events);
  } catch (error) {
    res.status(500).json({ message: 'ღონისძიებების წაკითხვის შეცდომა' });
  }
});

app.get('/api/seo', async (req, res) => {
  try {
    const { path: pagePath } = req.query;
    const db = await Database.read();
    const setting = db.seoSettings.find(s => s.path === pagePath) || db.seoSettings.find(s => s.path === '/');
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'SEO პარამეტრების წაკითხვის შეცდომა' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const db = await Database.read();
    res.json(db.siteSettings);
  } catch (error) {
    res.status(500).json({ message: 'საიტის პარამეტრების წაკითხვის შეცდომა' });
  }
});

// Submit user inquiry (public contact form)
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'გთხოვთ შეავსოთ ყველა ველი' });
    }

    const db = await Database.read();
    const newInq: Inquiry = {
      id: generateId(),
      name,
      email,
      message,
      status: 'unread',
      createdAt: new Date().toISOString()
    };

    db.inquiries.push(newInq);
    await Database.write(db);
    res.status(201).json(newInq);
  } catch (error) {
    res.status(500).json({ message: 'შეტყობინების გაგზავნის შეცდომა' });
  }
});

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/register', async (req: express.Request, res: Response) => {
  try {
    const { username, email, password, name } = req.body;
    const cleanEmail = (email || username || '').trim().toLowerCase();
    const cleanName = (name || username || '').trim();

    if (!cleanEmail || !password || !cleanName) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Email, password, and name are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters.'
      });
    }

    const db = await Database.read();
    if (!db.users) db.users = [];

    const userExists = db.users.find(u => (u.username && u.username.toLowerCase() === cleanEmail) || (u.email && u.email.toLowerCase() === cleanEmail));
    if (userExists) {
      return res.status(409).json({
        code: 'USER_ALREADY_EXISTS',
        message: 'An account with this email already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: generateId(),
      username: cleanEmail,
      email: cleanEmail,
      passwordHash,
      name: cleanName,
      role: 'user'
    };

    db.users.push(newUser);
    await Database.write(db);

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: cleanEmail,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'The request could not be completed.'
    });
  }
});

app.post('/api/auth/login', async (req: express.Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const cleanEmail = (email || username || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.'
      });
    }

    const db = await Database.read();
    if (!db.users) db.users = [];

    const user = db.users.find(u => 
      (u.username && u.username.toLowerCase() === cleanEmail) || 
      (u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (!user) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password is incorrect.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password is incorrect.'
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || user.username,
        name: user.name,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'The request could not be completed.'
    });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await Database.read();
    const user = db.users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role || 'user'
    });
  } catch (error) {
    res.status(500).json({ message: 'სერვერის შეცდომა პროფილის წაკითხვისას' });
  }
});

// --- SUBPERSONALITIES ROUTES ---

app.get('/api/subpersonalities', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await Database.read();
    const userSubs = db.subpersonalities.filter(s => s.userId === req.userId);
    res.json(userSubs);
  } catch (error) {
    res.status(500).json({ message: 'ქვეპიროვნებების წაკითხვის შეცდომა' });
  }
});

app.post('/api/subpersonalities', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, role, traits, needs, influence } = req.body;
    if (!name || !role) {
      return res.status(400).json({ message: 'სახელი და როლი აუცილებელია' });
    }

    const db = await Database.read();
    const newSub: Subpersonality = {
      id: generateId(),
      userId: req.userId!,
      name,
      role,
      traits: Array.isArray(traits) ? traits : [],
      needs: Array.isArray(needs) ? needs : [],
      influence: typeof influence === 'number' ? influence : 50,
      createdAt: new Date().toISOString()
    };

    db.subpersonalities.push(newSub);
    await Database.write(db);

    res.status(201).json(newSub);
  } catch (error) {
    res.status(500).json({ message: 'ქვეპიროვნების შექმნის შეცდომა' });
  }
});

app.put('/api/subpersonalities/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, traits, needs, influence } = req.body;

    const db = await Database.read();
    const subIdx = db.subpersonalities.findIndex(s => s.id === id && s.userId === req.userId);
    
    if (subIdx === -1) {
      return res.status(404).json({ message: 'ქვეპიროვნება ვერ მოიძებნა ან წვდომა უარყოფილია' });
    }

    const updatedSub = {
      ...db.subpersonalities[subIdx],
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(traits !== undefined && { traits }),
      ...(needs !== undefined && { needs }),
      ...(influence !== undefined && { influence })
    };

    db.subpersonalities[subIdx] = updatedSub;
    await Database.write(db);

    res.json(updatedSub);
  } catch (error) {
    res.status(500).json({ message: 'ქვეპიროვნების განახლების შეცდომა' });
  }
});

app.delete('/api/subpersonalities/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const subIdx = db.subpersonalities.findIndex(s => s.id === id && s.userId === req.userId);

    if (subIdx === -1) {
      return res.status(404).json({ message: 'ქვეპიროვნება ვერ მოიძებნა ან წვდომა უარყოფილია' });
    }

    db.subpersonalities.splice(subIdx, 1);
    await Database.write(db);

    res.json({ success: true, message: 'ქვეპიროვნება წარმატებით წაიშალა' });
  } catch (error) {
    res.status(500).json({ message: 'ქვეპიროვნების წაშლის შეცდომა' });
  }
});

// --- MEDITATION LOGS ROUTES ---

app.get('/api/meditation-logs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await Database.read();
    const userLogs = db.meditationLogs.filter(l => l.userId === req.userId);
    res.json(userLogs);
  } catch (error) {
    res.status(500).json({ message: 'მედიტაციის ლოგების წაკითხვის შეცდომა' });
  }
});

app.post('/api/meditation-logs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, duration } = req.body;
    if (!title || !duration) {
      return res.status(400).json({ message: 'სათაური და ხანგრძლივობა სავალდებულოა' });
    }

    const db = await Database.read();
    const newLog: MeditationLog = {
      id: generateId(),
      userId: req.userId!,
      title,
      duration: Number(duration),
      createdAt: new Date().toISOString()
    };

    db.meditationLogs.push(newLog);
    await Database.write(db);

    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ message: 'მედიტაციის შენახვის შეცდომა' });
  }
});

// --- JOURNAL ENTRIES ROUTES ---

app.get('/api/journal', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await Database.read();
    const userEntries = db.journalEntries.filter(e => e.userId === req.userId);
    res.json(userEntries);
  } catch (error) {
    res.status(500).json({ message: 'დღიურის ჩანაწერების წაკითხვის შეცდომა' });
  }
});

app.post('/api/journal', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { section, content } = req.body;
    if (!section || !content) {
      return res.status(400).json({ message: 'სექცია და კონტენტი სავალდებულოა' });
    }

    const db = await Database.read();
    const newEntry: JournalEntry = {
      id: generateId(),
      userId: req.userId!,
      section,
      content,
      createdAt: new Date().toISOString()
    };

    db.journalEntries.push(newEntry);
    await Database.write(db);

    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ message: 'დღიურის ჩანაწერი შენახვის შეცდომა' });
  }
});

// --- USER REQUEST COURSE REGISTRATION ---

app.post('/api/courses/:id/register', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const course = db.courses.find(c => c.id === id);
    const user = db.users.find(u => u.id === req.userId);

    if (!course) {
      return res.status(404).json({ message: 'კურსი ვერ მოიძებნა' });
    }
    if (!user) {
      return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });
    }

    // Check if registration already exists
    const regExists = db.registrations.find(r => r.userId === req.userId && r.courseId === id);
    if (regExists) {
      return res.status(400).json({ message: 'თქვენ უკვე გაგზავნილი გაქვთ მოთხოვნა ამ კურსზე' });
    }

    const newReg: Registration = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      courseId: course.id,
      courseTitle: course.title,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.registrations.push(newReg);
    await Database.write(db);

    res.status(201).json(newReg);
  } catch (error) {
    res.status(500).json({ message: 'რეგისტრაციის მოთხოვნის გაგზავნის შეცდომა' });
  }
});

// --- ADMIN CMS ENDPOINTS (PROTECTED BY AUTH & ROLE) ---

// 1. Course Management CRUD
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  res.json(db.courses);
});

app.post('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, duration, category, difficulty, modules } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'სათაური და აღწერა სავალდებულოა' });

    const db = await Database.read();
    const newCourse: Course = {
      id: generateId(),
      title,
      description,
      duration: duration || '8 კვირა',
      category: category || 'აკადემიური',
      difficulty: difficulty || 'დამწყები',
      modules: Array.isArray(modules) ? modules : []
    };

    db.courses.push(newCourse);
    await Database.write(db);
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: 'კურსის შექმნის შეცდომა' });
  }
});

app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration, category, difficulty, modules } = req.body;
    const db = await Database.read();
    const idx = db.courses.findIndex(c => c.id === id);

    if (idx === -1) return res.status(404).json({ message: 'კურსი ვერ მოიძებნა' });

    db.courses[idx] = {
      ...db.courses[idx],
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(duration !== undefined && { duration }),
      ...(category !== undefined && { category }),
      ...(difficulty !== undefined && { difficulty }),
      ...(modules !== undefined && { modules })
    };

    await Database.write(db);
    res.json(db.courses[idx]);
  } catch (error) {
    res.status(500).json({ message: 'კურსის განახლების შეცდომა' });
  }
});

app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = db.courses.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ message: 'კურსი ვერ მოიძებნა' });

    db.courses.splice(idx, 1);
    await Database.write(db);
    res.json({ success: true, message: 'კურსი წაიშალა' });
  } catch (error) {
    res.status(500).json({ message: 'კურსის წაშლის შეცდომა' });
  }
});

// 2. Resource (Library) CRUD
app.get('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  res.json(db.resources);
});

app.post('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, author, type, year, description } = req.body;
    if (!title || !author) return res.status(400).json({ message: 'სათაური და ავტორი სავალდებულოა' });

    const db = await Database.read();
    const newRes: LibraryResource = {
      id: generateId(),
      title,
      author,
      type: type || 'წიგნი',
      year: year || new Date().getFullYear().toString(),
      description: description || ''
    };

    db.resources.push(newRes);
    await Database.write(db);
    res.status(201).json(newRes);
  } catch (error) {
    res.status(500).json({ message: 'რესურსის შექმნის შეცდომა' });
  }
});

app.put('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, type, year, description } = req.body;
    const db = await Database.read();
    const idx = db.resources.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ message: 'რესურსი ვერ მოიძებნა' });

    db.resources[idx] = {
      ...db.resources[idx],
      ...(title !== undefined && { title }),
      ...(author !== undefined && { author }),
      ...(type !== undefined && { type }),
      ...(year !== undefined && { year }),
      ...(description !== undefined && { description })
    };

    await Database.write(db);
    res.json(db.resources[idx]);
  } catch (error) {
    res.status(500).json({ message: 'რესურსის განახლების შეცდომა' });
  }
});

app.delete('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = db.resources.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ message: 'რესურსი ვერ მოიძებნა' });

    db.resources.splice(idx, 1);
    await Database.write(db);
    res.json({ success: true, message: 'რესურსი წაიშალა' });
  } catch (error) {
    res.status(500).json({ message: 'რესურსის წაშლის შეცდომა' });
  }
});

// 3. Blog Management CRUD
app.get('/api/admin/blogs', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  res.json(db.blogs);
});

app.post('/api/admin/blogs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'სათაური და კონტენტი სავალდებულოა' });

    const db = await Database.read();
    const newBlog: Blog = {
      id: generateId(),
      title,
      content,
      author: author || 'ინსტიტუტი',
      createdAt: new Date().toISOString()
    };

    db.blogs.push(newBlog);
    await Database.write(db);
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ message: 'ბლოგის შექმნის შეცდომა' });
  }
});

app.put('/api/admin/blogs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author } = req.body;
    const db = await Database.read();
    const idx = db.blogs.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ message: 'ბლოგი ვერ მოიძებნა' });

    db.blogs[idx] = {
      ...db.blogs[idx],
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(author !== undefined && { author })
    };

    await Database.write(db);
    res.json(db.blogs[idx]);
  } catch (error) {
    res.status(500).json({ message: 'ბლოგის განახლების შეცდომა' });
  }
});

app.delete('/api/admin/blogs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = db.blogs.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ message: 'ბლოგი ვერ მოიძებნა' });

    db.blogs.splice(idx, 1);
    await Database.write(db);
    res.json({ success: true, message: 'ბლოგი წაიშალა' });
  } catch (error) {
    res.status(500).json({ message: 'ბლოგის წაშლის შეცდომა' });
  }
});

// 4. Event Scheduler CRUD
app.get('/api/admin/events', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  res.json(db.events);
});

app.post('/api/admin/events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, date, time, location, category } = req.body;
    if (!title || !date || !time) return res.status(400).json({ message: 'ყველა ველი სავალდებულოა' });

    const db = await Database.read();
    const newEvent: Event = {
      id: generateId(),
      title,
      date,
      time,
      location: location || 'ონლაინ',
      category: category === 'onsite' ? 'onsite' : 'online'
    };

    db.events.push(newEvent);
    await Database.write(db);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'ღონისძიების შექმნის შეცდომა' });
  }
});

app.put('/api/admin/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, time, location, category } = req.body;
    const db = await Database.read();
    const idx = db.events.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ message: 'ღონისძიება ვერ მოიძებნა' });

    db.events[idx] = {
      ...db.events[idx],
      ...(title !== undefined && { title }),
      ...(date !== undefined && { date }),
      ...(time !== undefined && { time }),
      ...(location !== undefined && { location }),
      ...(category !== undefined && { category })
    };

    await Database.write(db);
    res.json(db.events[idx]);
  } catch (error) {
    res.status(500).json({ message: 'ღონისძიების განახლების შეცდომა' });
  }
});

app.delete('/api/admin/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = db.events.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ message: 'ღონისძიება ვერ მოიძებნა' });

    db.events.splice(idx, 1);
    await Database.write(db);
    res.json({ success: true, message: 'ღონისძიება წაიშალა' });
  } catch (error) {
    res.status(500).json({ message: 'ღონისძიების წაშლის შეცდომა' });
  }
});

// 5. Course Registrations Manager
app.get('/api/admin/registrations', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  res.json(db.registrations);
});

app.put('/api/admin/registrations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'pending'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'არასწორი სტატუსი' });
    }

    const db = await Database.read();
    const idx = db.registrations.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ message: 'რეგისტრაცია ვერ მოიძებნა' });

    db.registrations[idx].status = status;
    await Database.write(db);
    res.json(db.registrations[idx]);
  } catch (error) {
    res.status(500).json({ message: 'რეგისტრაციის სტატუსის შეცვლის შეცდომა' });
  }
});

app.delete('/api/admin/registrations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = db.registrations.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ message: 'რეგისტრაცია ვერ მოიძებნა' });

    db.registrations.splice(idx, 1);
    await Database.write(db);
    res.json({ success: true, message: 'რეგისტრაცია წაიშალა' });
  } catch (error) {
    res.status(500).json({ message: 'რეგისტრაციის წაშლის შეცდომა' });
  }
});

// 6. Inquiries/Messages Manager
app.get('/api/admin/inquiries', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  res.json(db.inquiries);
});

app.put('/api/admin/inquiries/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'urgent' | 'read' | 'unread'
    const db = await Database.read();
    const idx = db.inquiries.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ message: 'შეტყობინება ვერ მოიძებნა' });

    db.inquiries[idx].status = status;
    await Database.write(db);
    res.json(db.inquiries[idx]);
  } catch (error) {
    res.status(500).json({ message: 'შეტყობინების განახლების შეცდომა' });
  }
});

app.delete('/api/admin/inquiries/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await Database.read();
    const idx = db.inquiries.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ message: 'შეტყობინება ვერ მოიძებნა' });

    db.inquiries.splice(idx, 1);
    await Database.write(db);
    res.json({ success: true, message: 'შეტყობინება წაიშალა' });
  } catch (error) {
    res.status(500).json({ message: 'შეტყობინების წაშლის შეცდომა' });
  }
});

// 7. Users Manager (role toggle, delete)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  // Filter out password hashes for security!
  const safeUsers = db.users.map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role || 'user'
  }));
  res.json(safeUsers);
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'admin' | 'user'
    
    if (id === 'admin-user-id') {
      return res.status(400).json({ message: 'სუპერ ადმინისტრატორის უფლებების შეცვლა შეუძლებელია' });
    }

    const db = await Database.read();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });

    db.users[idx].role = role;
    await Database.write(db);
    res.json({ id: db.users[idx].id, username: db.users[idx].username, name: db.users[idx].name, role: db.users[idx].role });
  } catch (error) {
    res.status(500).json({ message: 'მომხმარებლის განახლების შეცდომა' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'admin-user-id') {
      return res.status(400).json({ message: 'სუპერ ადმინისტრატორის წაშლა შეუძლებელია' });
    }

    const db = await Database.read();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });

    db.users.splice(idx, 1);
    await Database.write(db);
    res.json({ success: true, message: 'მომხმარებელი წაიშალა' });
  } catch (error) {
    res.status(500).json({ message: 'მომხმარებლის წაშლის შეცდომა' });
  }
});

// 8. SEO Manager
app.get('/api/admin/seo', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  res.json(db.seoSettings);
});

app.put('/api/admin/seo', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { path: pagePath, title, description, keywords } = req.body;
    if (!pagePath) return res.status(400).json({ message: 'გვერდის მისამართი (path) აუცილებელია' });

    const db = await Database.read();
    const idx = db.seoSettings.findIndex(s => s.path === pagePath);

    const setting: SeoSetting = {
      path: pagePath,
      title: title || '',
      description: description || '',
      keywords: keywords || ''
    };

    if (idx !== -1) {
      db.seoSettings[idx] = setting;
    } else {
      db.seoSettings.push(setting);
    }

    await Database.write(db);
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'SEO პარამეტრების შენახვის შეცდომა' });
  }
});

// 9. Site Settings & Dynamic Texts Manager
app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  const db = await Database.read();
  res.json(db.siteSettings);
});

app.put('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await Database.read();
    db.siteSettings = { ...db.siteSettings, ...req.body };
    await Database.write(db);
    res.json(db.siteSettings);
  } catch (error) {
    res.status(500).json({ message: 'საიტის პარამეტრების შენახვის შეცდომა' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
