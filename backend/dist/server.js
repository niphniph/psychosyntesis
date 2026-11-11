import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import { Database } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import { requireAdminSession, getAdminTokenCandidates } from './middleware/adminAuth.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'psychosynthesis_secret_key_123';
const ADMIN_ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN || 'gip_sec_admin_token_2026_913x99_a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1';
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Set up static uploads folder
const uploadsDir = path.join(__dirname, '..', 'uploads');
try {
    if (!fsSync.existsSync(uploadsDir)) {
        fsSync.mkdirSync(uploadsDir, { recursive: true });
    }
}
catch (err) {
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('დაშვებულია მხოლოდ JPEG, PNG, WEBP, GIF, SVG სურათები და PDF ფაილები.'));
        }
    }
});
// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);
// Activity Logger helper
const logActivity = async (action, entityType, details, entityId) => {
    try {
        const db = await Database.read();
        if (!db.activityLog)
            db.activityLog = [];
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
    }
    catch (err) {
        console.error('Activity logging failed:', err);
    }
};
const createAdminSession = async (userId) => {
    const db = await Database.read();
    if (!db.adminSessions)
        db.adminSessions = [];
    const now = new Date().toISOString();
    const sessionToken = 'session_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.adminSessions = db.adminSessions.filter(s => !s.expiresAt || s.expiresAt >= now);
    db.adminSessions.push({ token: sessionToken, userId, createdAt: now, expiresAt });
    await Database.write(db);
    return sessionToken;
};
const setAdminCookie = (res, sessionToken) => {
    res.cookie('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
    });
};
// Seed 3 administrator accounts if they don't exist (existing passwords are never reset)
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
            if (!exists) {
                const salt = await bcrypt.genSalt(10);
                db.users.push({
                    id: a.id,
                    username: a.username,
                    passwordHash: await bcrypt.hash('admin123', salt),
                    name: a.name,
                    role: 'admin'
                });
                modified = true;
            }
        }
        if (modified) {
            await Database.write(db);
            console.log('Missing administrator accounts created (default password: admin123 — change it in the admin panel)');
        }
    }
    catch (error) {
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
        const sessionToken = await createAdminSession();
        setAdminCookie(res, sessionToken);
        await logActivity('Admin Login', 'Auth', 'Admin entered via secret URL token');
        res.json({
            success: true,
            redirect: '/psychosynthesis/admin/dashboard',
            sessionToken
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Admin username/password login (accounts with role "admin")
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const identifier = String(username || '').trim().toLowerCase();
        if (!identifier || !password) {
            return res.status(400).json({ message: 'შეიყვანეთ მომხმარებელი და პაროლი' });
        }
        const db = await Database.read();
        const user = db.users.find(u => ((u.username && u.username.toLowerCase() === identifier) || (u.email && u.email.toLowerCase() === identifier)) &&
            u.role === 'admin' && u.status !== 'disabled');
        if (!user || !(await bcrypt.compare(String(password), user.passwordHash || ''))) {
            return res.status(401).json({ message: 'მომხმარებელი ან პაროლი არასწორია' });
        }
        const sessionToken = await createAdminSession(user.id);
        setAdminCookie(res, sessionToken);
        await logActivity('Admin Login', 'Auth', `${user.name} შევიდა ადმინ პანელში`, user.id);
        res.json({ success: true, sessionToken, user: { id: user.id, name: user.name, username: user.username } });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Admin Session Verification
app.get('/api/admin/auth/verify', requireAdminSession, async (req, res) => {
    const db = await Database.read();
    const user = db.users.find(u => u.id === req.adminUserId);
    res.json({
        success: true,
        authenticated: true,
        user: user ? { id: user.id, name: user.name, username: user.username } : null
    });
});
// Change the password of the logged-in admin
app.post('/api/admin/change-password', requireAdminSession, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (!req.adminUserId)
            return res.status(400).json({ message: 'ეს სესია მომხმარებელს არ უკავშირდება — შედით მომხმარებლით და პაროლით' });
        if (!newPassword || String(newPassword).length < 6)
            return res.status(400).json({ message: 'ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო' });
        const db = await Database.read();
        const user = db.users.find(u => u.id === req.adminUserId);
        if (!user || !(await bcrypt.compare(String(currentPassword || ''), user.passwordHash || ''))) {
            return res.status(400).json({ message: 'მიმდინარე პაროლი არასწორია' });
        }
        user.passwordHash = await bcrypt.hash(String(newPassword), await bcrypt.genSalt(10));
        await Database.write(db);
        await logActivity('Password Changed', 'Auth', `${user.name} შეცვალა პაროლი`, user.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'პაროლის შეცვლის შეცდომა' });
    }
});
// Admin Logout
app.post('/api/admin/logout', async (req, res) => {
    try {
        const candidates = getAdminTokenCandidates(req);
        if (candidates.length) {
            const db = await Database.read();
            db.adminSessions = (db.adminSessions || []).filter(s => !candidates.includes(s.token));
            await Database.write(db);
        }
        res.clearCookie('admin_session', { path: '/' });
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        const unreadInquiries = (db.inquiries || []).filter(i => i.status !== 'read').length;
        const pendingRegistrations = (db.registrations || []).filter(r => r.status === 'pending').length;
        res.json({
            totalUsers,
            publishedPosts,
            draftPosts,
            totalPages,
            recentActivity,
            recentRegistrations,
            unreadInquiries,
            pendingRegistrations
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching overview' });
    }
});
// 1. Posts Manager CRUD
app.get('/api/admin/posts', requireAdminSession, async (_req, res) => {
    try {
        const db = await Database.read();
        const posts = (db.posts || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching admin posts' });
    }
});
app.post('/api/admin/posts', requireAdminSession, async (req, res) => {
    try {
        const { title, slug, shortDescription, content, featuredImage, category, tags, author, status, featured, visibility, displayLocations, seoTitle, seoDescription } = req.body;
        if (!title)
            return res.status(400).json({ message: 'Title is required' });
        const db = await Database.read();
        if (!db.posts)
            db.posts = [];
        const autoSlug = (slug || title).toLowerCase().trim().replace(/[^\w\u0400-\u04FF\u10A0-\u10FF\s-]/g, '').replace(/\s+/g, '-');
        const newPost = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating post' });
    }
});
app.put('/api/admin/posts/:id', requireAdminSession, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = (db.posts || []).findIndex(p => p.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'Post not found' });
        const updated = {
            ...db.posts[idx],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        db.posts[idx] = updated;
        await Database.write(db);
        await logActivity('Post Updated', 'Post', `Updated post "${updated.title}"`, updated.id);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating post' });
    }
});
app.post('/api/admin/posts/:id/duplicate', requireAdminSession, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const original = (db.posts || []).find(p => p.id === id);
        if (!original)
            return res.status(404).json({ message: 'Post not found' });
        const duplicated = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error duplicating post' });
    }
});
app.delete('/api/admin/posts/:id', requireAdminSession, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = (db.posts || []).findIndex(p => p.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'Post not found' });
        const postTitle = db.posts[idx].title;
        db.posts.splice(idx, 1);
        await Database.write(db);
        await logActivity('Post Deleted', 'Post', `Deleted post "${postTitle}"`, String(id));
        res.json({ success: true, message: 'Post deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting post' });
    }
});
app.put('/api/admin/posts/reorder', requireAdminSession, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds))
            return res.status(400).json({ message: 'orderedIds array required' });
        const db = await Database.read();
        db.posts.forEach(p => {
            const idx = orderedIds.indexOf(p.id);
            if (idx !== -1)
                p.sortOrder = idx + 1;
        });
        await Database.write(db);
        await logActivity('Posts Reordered', 'Post', 'Updated display order for posts');
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'Error reordering posts' });
    }
});
// 2. Pages Manager CRUD
app.get('/api/admin/pages', requireAdminSession, async (_req, res) => {
    try {
        const db = await Database.read();
        res.json(db.pages || []);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching pages' });
    }
});
app.post('/api/admin/pages', requireAdminSession, async (req, res) => {
    try {
        const { title, slug, content, heroImage, seoTitle, seoDescription, status, navVisible } = req.body;
        if (!title || !slug)
            return res.status(400).json({ message: 'Title and slug required' });
        const db = await Database.read();
        if (!db.pages)
            db.pages = [];
        const cleanSlug = slug.toLowerCase().trim().replace(/[^\w-]/g, '');
        const newPage = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating page' });
    }
});
app.put('/api/admin/pages/:id', requireAdminSession, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = (db.pages || []).findIndex(p => p.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'Page not found' });
        const updated = {
            ...db.pages[idx],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        db.pages[idx] = updated;
        await Database.write(db);
        await logActivity('Page Updated', 'Page', `Updated page "${updated.title}"`, updated.id);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating page' });
    }
});
app.delete('/api/admin/pages/:id', requireAdminSession, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = (db.pages || []).findIndex(p => p.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'Page not found' });
        const pageTitle = db.pages[idx].title;
        db.pages.splice(idx, 1);
        await Database.write(db);
        await logActivity('Page Deleted', 'Page', `Deleted page "${pageTitle}"`, String(id));
        res.json({ success: true, message: 'Page deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting page' });
    }
});
// 3. Homepage Sections Manager
app.get('/api/admin/homepage-sections', requireAdminSession, async (_req, res) => {
    try {
        const db = await Database.read();
        const sections = (db.homepageSections || []).sort((a, b) => a.sortOrder - b.sortOrder);
        res.json(sections);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching sections' });
    }
});
app.put('/api/admin/homepage-sections', requireAdminSession, async (req, res) => {
    try {
        const { sections } = req.body;
        if (!Array.isArray(sections))
            return res.status(400).json({ message: 'Sections array required' });
        const db = await Database.read();
        db.homepageSections = sections;
        await Database.write(db);
        await logActivity('Homepage Updated', 'Homepage', 'Updated homepage layout and sections');
        res.json(db.homepageSections);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating homepage sections' });
    }
});
app.put('/api/admin/homepage-sections/reorder', requireAdminSession, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds))
            return res.status(400).json({ message: 'orderedIds array required' });
        const db = await Database.read();
        db.homepageSections.forEach(s => {
            const idx = orderedIds.indexOf(s.id);
            if (idx !== -1)
                s.sortOrder = idx + 1;
        });
        await Database.write(db);
        await logActivity('Homepage Reordered', 'Homepage', 'Reordered homepage sections');
        res.json(db.homepageSections);
    }
    catch (error) {
        res.status(500).json({ message: 'Error reordering sections' });
    }
});
// 4. Navigation Manager
app.get('/api/admin/navigation', requireAdminSession, async (_req, res) => {
    try {
        const db = await Database.read();
        const nav = (db.navigationItems || []).sort((a, b) => a.sortOrder - b.sortOrder);
        res.json(nav);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching navigation' });
    }
});
app.put('/api/admin/navigation', requireAdminSession, async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items))
            return res.status(400).json({ message: 'Items array required' });
        const db = await Database.read();
        db.navigationItems = items;
        await Database.write(db);
        await logActivity('Navigation Updated', 'Navigation', 'Updated header navigation menu items');
        res.json(db.navigationItems);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating navigation' });
    }
});
app.put('/api/admin/navigation/reorder', requireAdminSession, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds))
            return res.status(400).json({ message: 'orderedIds array required' });
        const db = await Database.read();
        db.navigationItems.forEach(n => {
            const idx = orderedIds.indexOf(n.id);
            if (idx !== -1)
                n.sortOrder = idx + 1;
        });
        await Database.write(db);
        await logActivity('Navigation Reordered', 'Navigation', 'Reordered menu items');
        res.json(db.navigationItems);
    }
    catch (error) {
        res.status(500).json({ message: 'Error reordering navigation' });
    }
});
// 5. Media Library Manager
app.get('/api/admin/media', requireAdminSession, async (_req, res) => {
    try {
        const db = await Database.read();
        res.json(db.media || []);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching media' });
    }
});
app.post('/api/admin/media/upload', requireAdminSession, (req, res, next) => {
    upload.single('image')(req, res, (err) => err ? res.status(400).json({ message: err.message || 'ატვირთვის შეცდომა' }) : next());
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const db = await Database.read();
        if (!db.media)
            db.media = [];
        const newMedia = {
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
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Media upload failed' });
    }
});
app.delete('/api/admin/media/:id', requireAdminSession, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = (db.media || []).findIndex(m => m.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'Media not found' });
        const mediaItem = db.media[idx];
        const filePath = path.join(uploadsDir, mediaItem.filename);
        try {
            if (fsSync.existsSync(filePath)) {
                fsSync.unlinkSync(filePath);
            }
        }
        catch (e) {
            console.error('Error unlinking file:', e);
        }
        db.media.splice(idx, 1);
        await Database.write(db);
        await logActivity('Media Deleted', 'Media', `Deleted image "${mediaItem.filename}"`, String(id));
        res.json({ success: true, message: 'Media deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting media' });
    }
});
app.put('/api/admin/media/:id', requireAdminSession, async (req, res) => {
    try {
        const db = await Database.read();
        const item = (db.media || []).find(m => m.id === req.params.id);
        if (!item)
            return res.status(404).json({ message: 'Media not found' });
        if (typeof req.body.altText === 'string')
            item.altText = req.body.altText;
        await Database.write(db);
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating media' });
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
            status: u.status || 'active',
            createdAt: u.createdAt || new Date().toISOString()
        }));
        res.json(safeUsers);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});
app.put('/api/admin/users/:id/status', requireAdminSession, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' | 'disabled'
        if (!['active', 'disabled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const db = await Database.read();
        const idx = (db.users || []).findIndex(u => u.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'User not found' });
        db.users[idx].status = status;
        await Database.write(db);
        await logActivity('User Status Changed', 'User', `User "${db.users[idx].name}" set to ${status}`, String(id));
        res.json({ id: db.users[idx].id, name: db.users[idx].name, status });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user status' });
    }
});
// 7. Activity Log
app.get('/api/admin/activity', requireAdminSession, async (_req, res) => {
    try {
        const db = await Database.read();
        res.json(db.activityLog || []);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching activity log' });
    }
});
// --- PUBLIC READ ENDPOINTS (CONNECTED TO DATABASE) ---
app.get('/api/courses', async (req, res) => {
    try {
        const db = await Database.read();
        res.json([...(db.courses || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }
    catch (error) {
        res.status(500).json({ message: 'კურსების წაკითხვის შეცდომა' });
    }
});
app.get('/api/resources', async (req, res) => {
    try {
        const db = await Database.read();
        res.json([...(db.resources || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }
    catch (error) {
        res.status(500).json({ message: 'ბიბლიოთეკის წაკითხვის შეცდომა' });
    }
});
app.get('/api/blogs', async (req, res) => {
    try {
        const db = await Database.read();
        res.json([...(db.blogs || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }
    catch (error) {
        res.status(500).json({ message: 'ბლოგების წაკითხვის შეცდომა' });
    }
});
app.get('/api/events', async (req, res) => {
    try {
        const db = await Database.read();
        res.json([...(db.events || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }
    catch (error) {
        res.status(500).json({ message: 'ღონისძიებების წაკითხვის შეცდომა' });
    }
});
app.get('/api/seo', async (req, res) => {
    try {
        const { path: pagePath } = req.query;
        const db = await Database.read();
        const setting = db.seoSettings.find(s => s.path === pagePath) || db.seoSettings.find(s => s.path === '/');
        res.json(setting);
    }
    catch (error) {
        res.status(500).json({ message: 'SEO პარამეტრების წაკითხვის შეცდომა' });
    }
});
app.get('/api/settings', async (req, res) => {
    try {
        const db = await Database.read();
        res.json(db.siteSettings);
    }
    catch (error) {
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
        const newInq = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'შეტყობინების გაგზავნის შეცდომა' });
    }
});
// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
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
        if (!db.users)
            db.users = [];
        const userExists = db.users.find(u => (u.username && u.username.toLowerCase() === cleanEmail) || (u.email && u.email.toLowerCase() === cleanEmail));
        if (userExists) {
            return res.status(409).json({
                code: 'USER_ALREADY_EXISTS',
                message: 'An account with this email already exists.'
            });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = {
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
    }
    catch (error) {
        res.status(500).json({
            code: 'INTERNAL_ERROR',
            message: 'The request could not be completed.'
        });
    }
});
app.post('/api/auth/login', async (req, res) => {
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
        if (!db.users)
            db.users = [];
        const user = db.users.find(u => (u.username && u.username.toLowerCase() === cleanEmail) ||
            (u.email && u.email.toLowerCase() === cleanEmail));
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
    }
    catch (error) {
        res.status(500).json({
            code: 'INTERNAL_ERROR',
            message: 'The request could not be completed.'
        });
    }
});
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: 'სერვერის შეცდომა პროფილის წაკითხვისას' });
    }
});
// --- SUBPERSONALITIES ROUTES ---
app.get('/api/subpersonalities', authenticateToken, async (req, res) => {
    try {
        const db = await Database.read();
        const userSubs = db.subpersonalities.filter(s => s.userId === req.userId);
        res.json(userSubs);
    }
    catch (error) {
        res.status(500).json({ message: 'ქვეპიროვნებების წაკითხვის შეცდომა' });
    }
});
app.post('/api/subpersonalities', authenticateToken, async (req, res) => {
    try {
        const { name, role, traits, needs, influence } = req.body;
        if (!name || !role) {
            return res.status(400).json({ message: 'სახელი და როლი აუცილებელია' });
        }
        const db = await Database.read();
        const newSub = {
            id: generateId(),
            userId: req.userId,
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
    }
    catch (error) {
        res.status(500).json({ message: 'ქვეპიროვნების შექმნის შეცდომა' });
    }
});
app.put('/api/subpersonalities/:id', authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: 'ქვეპიროვნების განახლების შეცდომა' });
    }
});
app.delete('/api/subpersonalities/:id', authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: 'ქვეპიროვნების წაშლის შეცდომა' });
    }
});
// --- MEDITATION LOGS ROUTES ---
app.get('/api/meditation-logs', authenticateToken, async (req, res) => {
    try {
        const db = await Database.read();
        const userLogs = db.meditationLogs.filter(l => l.userId === req.userId);
        res.json(userLogs);
    }
    catch (error) {
        res.status(500).json({ message: 'მედიტაციის ლოგების წაკითხვის შეცდომა' });
    }
});
app.post('/api/meditation-logs', authenticateToken, async (req, res) => {
    try {
        const { title, duration } = req.body;
        if (!title || !duration) {
            return res.status(400).json({ message: 'სათაური და ხანგრძლივობა სავალდებულოა' });
        }
        const db = await Database.read();
        const newLog = {
            id: generateId(),
            userId: req.userId,
            title,
            duration: Number(duration),
            createdAt: new Date().toISOString()
        };
        db.meditationLogs.push(newLog);
        await Database.write(db);
        res.status(201).json(newLog);
    }
    catch (error) {
        res.status(500).json({ message: 'მედიტაციის შენახვის შეცდომა' });
    }
});
// --- JOURNAL ENTRIES ROUTES ---
app.get('/api/journal', authenticateToken, async (req, res) => {
    try {
        const db = await Database.read();
        const userEntries = db.journalEntries.filter(e => e.userId === req.userId);
        res.json(userEntries);
    }
    catch (error) {
        res.status(500).json({ message: 'დღიურის ჩანაწერების წაკითხვის შეცდომა' });
    }
});
app.post('/api/journal', authenticateToken, async (req, res) => {
    try {
        const { section, content } = req.body;
        if (!section || !content) {
            return res.status(400).json({ message: 'სექცია და კონტენტი სავალდებულოა' });
        }
        const db = await Database.read();
        const newEntry = {
            id: generateId(),
            userId: req.userId,
            section,
            content,
            createdAt: new Date().toISOString()
        };
        db.journalEntries.push(newEntry);
        await Database.write(db);
        res.status(201).json(newEntry);
    }
    catch (error) {
        res.status(500).json({ message: 'დღიურის ჩანაწერი შენახვის შეცდომა' });
    }
});
// --- USER REQUEST COURSE REGISTRATION ---
app.post('/api/courses/:id/register', authenticateToken, async (req, res) => {
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
        const newReg = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'რეგისტრაციის მოთხოვნის გაგზავნის შეცდომა' });
    }
});
const stripMeta = (body) => {
    const { id: _id, ...rest } = body || {};
    return rest;
};
// Registers list/create/update/delete/reorder routes for a simple content collection
const registerCollectionRoutes = (key, label, requiredFields, defaults) => {
    const base = `/api/admin/${key}`;
    const list = (db) => db[key] || (db[key] = []);
    app.get(base, requireAdminSession, async (_req, res) => {
        try {
            const db = await Database.read();
            res.json([...list(db)].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
        }
        catch (error) {
            res.status(500).json({ message: `${label}: წაკითხვის შეცდომა` });
        }
    });
    app.put(`${base}/reorder`, requireAdminSession, async (req, res) => {
        try {
            const { orderedIds } = req.body;
            if (!Array.isArray(orderedIds))
                return res.status(400).json({ message: 'orderedIds array required' });
            const db = await Database.read();
            list(db).forEach(item => {
                const idx = orderedIds.indexOf(item.id);
                if (idx !== -1)
                    item.sortOrder = idx + 1;
            });
            await Database.write(db);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ message: `${label}: თანმიმდევრობის შენახვის შეცდომა` });
        }
    });
    app.post(base, requireAdminSession, async (req, res) => {
        try {
            const missing = requiredFields.filter(f => !req.body?.[f]);
            if (missing.length)
                return res.status(400).json({ message: `სავალდებულო ველები: ${missing.join(', ')}` });
            const db = await Database.read();
            const items = list(db);
            const newItem = {
                ...defaults(),
                ...stripMeta(req.body),
                id: generateId(),
                sortOrder: items.length + 1
            };
            items.push(newItem);
            await Database.write(db);
            await logActivity(`${label} Created`, label, `Created "${newItem.title}"`, newItem.id);
            res.status(201).json(newItem);
        }
        catch (error) {
            res.status(500).json({ message: `${label}: შექმნის შეცდომა` });
        }
    });
    app.put(`${base}/:id`, requireAdminSession, async (req, res) => {
        try {
            const db = await Database.read();
            const items = list(db);
            const idx = items.findIndex(i => i.id === req.params.id);
            if (idx === -1)
                return res.status(404).json({ message: `${label}: ჩანაწერი ვერ მოიძებნა` });
            items[idx] = { ...items[idx], ...stripMeta(req.body) };
            await Database.write(db);
            await logActivity(`${label} Updated`, label, `Updated "${items[idx].title}"`, items[idx].id);
            res.json(items[idx]);
        }
        catch (error) {
            res.status(500).json({ message: `${label}: განახლების შეცდომა` });
        }
    });
    app.delete(`${base}/:id`, requireAdminSession, async (req, res) => {
        try {
            const db = await Database.read();
            const items = list(db);
            const idx = items.findIndex(i => i.id === req.params.id);
            if (idx === -1)
                return res.status(404).json({ message: `${label}: ჩანაწერი ვერ მოიძებნა` });
            const [removed] = items.splice(idx, 1);
            await Database.write(db);
            await logActivity(`${label} Deleted`, label, `Deleted "${removed.title}"`, removed.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ message: `${label}: წაშლის შეცდომა` });
        }
    });
};
registerCollectionRoutes('courses', 'Course', ['title'], () => ({
    description: '', duration: '8 კვირა', category: 'აკადემიური', difficulty: 'დამწყები', modules: []
}));
registerCollectionRoutes('resources', 'Resource', ['title'], () => ({
    author: '', type: 'წიგნი', year: new Date().getFullYear().toString(), description: ''
}));
registerCollectionRoutes('blogs', 'Blog', ['title'], () => ({
    content: '', author: 'ინსტიტუტი', createdAt: new Date().toISOString()
}));
registerCollectionRoutes('events', 'Event', ['title'], () => ({
    date: '', time: '', location: 'ონლაინ', category: 'online'
}));
// Course Registrations Manager
app.get('/api/admin/registrations', requireAdminSession, async (_req, res) => {
    const db = await Database.read();
    res.json([...(db.registrations || [])].reverse());
});
app.put('/api/admin/registrations/:id', requireAdminSession, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'არასწორი სტატუსი' });
        }
        const db = await Database.read();
        const idx = db.registrations.findIndex(r => r.id === req.params.id);
        if (idx === -1)
            return res.status(404).json({ message: 'რეგისტრაცია ვერ მოიძებნა' });
        db.registrations[idx].status = status;
        await Database.write(db);
        await logActivity('Registration Updated', 'Registration', `${db.registrations[idx].userName} → ${status}`, db.registrations[idx].id);
        res.json(db.registrations[idx]);
    }
    catch (error) {
        res.status(500).json({ message: 'რეგისტრაციის სტატუსის შეცვლის შეცდომა' });
    }
});
app.delete('/api/admin/registrations/:id', requireAdminSession, async (req, res) => {
    try {
        const db = await Database.read();
        const idx = db.registrations.findIndex(r => r.id === req.params.id);
        if (idx === -1)
            return res.status(404).json({ message: 'რეგისტრაცია ვერ მოიძებნა' });
        db.registrations.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'რეგისტრაციის წაშლის შეცდომა' });
    }
});
// Inquiries / Messages Manager
app.get('/api/admin/inquiries', requireAdminSession, async (_req, res) => {
    const db = await Database.read();
    res.json([...(db.inquiries || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});
app.put('/api/admin/inquiries/:id', requireAdminSession, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['urgent', 'read', 'unread'].includes(status)) {
            return res.status(400).json({ message: 'არასწორი სტატუსი' });
        }
        const db = await Database.read();
        const idx = db.inquiries.findIndex(i => i.id === req.params.id);
        if (idx === -1)
            return res.status(404).json({ message: 'შეტყობინება ვერ მოიძებნა' });
        db.inquiries[idx].status = status;
        await Database.write(db);
        res.json(db.inquiries[idx]);
    }
    catch (error) {
        res.status(500).json({ message: 'შეტყობინების განახლების შეცდომა' });
    }
});
app.delete('/api/admin/inquiries/:id', requireAdminSession, async (req, res) => {
    try {
        const db = await Database.read();
        const idx = db.inquiries.findIndex(i => i.id === req.params.id);
        if (idx === -1)
            return res.status(404).json({ message: 'შეტყობინება ვერ მოიძებნა' });
        db.inquiries.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'შეტყობინების წაშლის შეცდომა' });
    }
});
// Users Manager (role toggle, delete)
app.put('/api/admin/users/:id', requireAdminSession, async (req, res) => {
    try {
        const id = String(req.params.id);
        const { role } = req.body;
        if (!['admin', 'user'].includes(role))
            return res.status(400).json({ message: 'არასწორი როლი' });
        if (id === req.adminUserId)
            return res.status(400).json({ message: 'საკუთარი როლის შეცვლა შეუძლებელია' });
        const db = await Database.read();
        const idx = db.users.findIndex(u => u.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });
        db.users[idx].role = role;
        await Database.write(db);
        await logActivity('User Role Changed', 'User', `User "${db.users[idx].name}" set to ${role}`, id);
        res.json({ id: db.users[idx].id, username: db.users[idx].username, name: db.users[idx].name, role: db.users[idx].role });
    }
    catch (error) {
        res.status(500).json({ message: 'მომხმარებლის განახლების შეცდომა' });
    }
});
app.delete('/api/admin/users/:id', requireAdminSession, async (req, res) => {
    try {
        const id = String(req.params.id);
        if (id === req.adminUserId)
            return res.status(400).json({ message: 'საკუთარი ანგარიშის წაშლა შეუძლებელია' });
        const db = await Database.read();
        const idx = db.users.findIndex(u => u.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });
        const [removed] = db.users.splice(idx, 1);
        await Database.write(db);
        await logActivity('User Deleted', 'User', `Deleted user "${removed.name}"`, id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'მომხმარებლის წაშლის შეცდომა' });
    }
});
// SEO Manager
app.get('/api/admin/seo', requireAdminSession, async (_req, res) => {
    const db = await Database.read();
    res.json(db.seoSettings || []);
});
app.put('/api/admin/seo', requireAdminSession, async (req, res) => {
    try {
        const { path: pagePath, title, description, keywords } = req.body;
        if (!pagePath)
            return res.status(400).json({ message: 'გვერდის მისამართი (path) აუცილებელია' });
        const db = await Database.read();
        const setting = {
            path: pagePath,
            title: title || '',
            description: description || '',
            keywords: keywords || ''
        };
        const idx = db.seoSettings.findIndex(s => s.path === pagePath);
        if (idx !== -1)
            db.seoSettings[idx] = setting;
        else
            db.seoSettings.push(setting);
        await Database.write(db);
        await logActivity('SEO Updated', 'SEO', `Updated SEO for ${pagePath}`);
        res.json(setting);
    }
    catch (error) {
        res.status(500).json({ message: 'SEO პარამეტრების შენახვის შეცდომა' });
    }
});
app.delete('/api/admin/seo', requireAdminSession, async (req, res) => {
    try {
        const pagePath = String(req.query.path || '');
        const db = await Database.read();
        db.seoSettings = db.seoSettings.filter(s => s.path !== pagePath);
        await Database.write(db);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'SEO ჩანაწერის წაშლის შეცდომა' });
    }
});
// Site Settings & Dynamic Texts Manager
app.get('/api/admin/settings', requireAdminSession, async (_req, res) => {
    const db = await Database.read();
    res.json(db.siteSettings);
});
app.put('/api/admin/settings', requireAdminSession, async (req, res) => {
    try {
        const db = await Database.read();
        const incoming = {};
        for (const [k, v] of Object.entries(req.body || {})) {
            if (typeof v === 'string')
                incoming[k] = v;
        }
        db.siteSettings = { ...db.siteSettings, ...incoming };
        await Database.write(db);
        await logActivity('Site Content Updated', 'Settings', `Updated ${Object.keys(incoming).length} site text/image fields`);
        res.json(db.siteSettings);
    }
    catch (error) {
        res.status(500).json({ message: 'საიტის პარამეტრების შენახვის შეცდომა' });
    }
});
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
