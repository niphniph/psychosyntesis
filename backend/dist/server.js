import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Database } from './db.js';
import { authenticateToken } from './middleware/auth.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'psychosynthesis_secret_key_123';
app.use(cors());
app.use(express.json());
// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);
// Admin validation middleware
const requireAdmin = async (req, res, next) => {
    try {
        const db = await Database.read();
        const user = db.users.find(u => u.id === req.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'წვდომა უარყოფილია (საჭიროა ადმინისტრატორის უფლებები)' });
        }
        next();
    }
    catch (error) {
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
            }
            else {
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
    }
    catch (error) {
        console.error('Error seeding administrator accounts:', error);
    }
};
seedAdmin();
// --- PUBLIC READ ENDPOINTS (CONNECTED TO DATABASE) ---
app.get('/api/courses', async (req, res) => {
    try {
        const db = await Database.read();
        res.json(db.courses);
    }
    catch (error) {
        res.status(500).json({ message: 'კურსების წაკითხვის შეცდომა' });
    }
});
app.get('/api/resources', async (req, res) => {
    try {
        const db = await Database.read();
        res.json(db.resources);
    }
    catch (error) {
        res.status(500).json({ message: 'ბიბლიოთეკის წაკითხვის შეცდომა' });
    }
});
app.get('/api/blogs', async (req, res) => {
    try {
        const db = await Database.read();
        res.json(db.blogs);
    }
    catch (error) {
        res.status(500).json({ message: 'ბლოგების წაკითხვის შეცდომა' });
    }
});
app.get('/api/events', async (req, res) => {
    try {
        const db = await Database.read();
        res.json(db.events);
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
// --- ADMIN CMS ENDPOINTS (PROTECTED BY AUTH & ROLE) ---
// 1. Course Management CRUD
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
    const db = await Database.read();
    res.json(db.courses);
});
app.post('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, duration, category, difficulty, modules } = req.body;
        if (!title || !description)
            return res.status(400).json({ message: 'სათაური და აღწერა სავალდებულოა' });
        const db = await Database.read();
        const newCourse = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'კურსის შექმნის შეცდომა' });
    }
});
app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, duration, category, difficulty, modules } = req.body;
        const db = await Database.read();
        const idx = db.courses.findIndex(c => c.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'კურსი ვერ მოიძებნა' });
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
    }
    catch (error) {
        res.status(500).json({ message: 'კურსის განახლების შეცდომა' });
    }
});
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = db.courses.findIndex(c => c.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'კურსი ვერ მოიძებნა' });
        db.courses.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true, message: 'კურსი წაიშალა' });
    }
    catch (error) {
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
        if (!title || !author)
            return res.status(400).json({ message: 'სათაური და ავტორი სავალდებულოა' });
        const db = await Database.read();
        const newRes = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'რესურსის შექმნის შეცდომა' });
    }
});
app.put('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, type, year, description } = req.body;
        const db = await Database.read();
        const idx = db.resources.findIndex(r => r.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'რესურსი ვერ მოიძებნა' });
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
    }
    catch (error) {
        res.status(500).json({ message: 'რესურსის განახლების შეცდომა' });
    }
});
app.delete('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = db.resources.findIndex(r => r.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'რესურსი ვერ მოიძებნა' });
        db.resources.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true, message: 'რესურსი წაიშალა' });
    }
    catch (error) {
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
        if (!title || !content)
            return res.status(400).json({ message: 'სათაური და კონტენტი სავალდებულოა' });
        const db = await Database.read();
        const newBlog = {
            id: generateId(),
            title,
            content,
            author: author || 'ინსტიტუტი',
            createdAt: new Date().toISOString()
        };
        db.blogs.push(newBlog);
        await Database.write(db);
        res.status(201).json(newBlog);
    }
    catch (error) {
        res.status(500).json({ message: 'ბლოგის შექმნის შეცდომა' });
    }
});
app.put('/api/admin/blogs/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, author } = req.body;
        const db = await Database.read();
        const idx = db.blogs.findIndex(b => b.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'ბლოგი ვერ მოიძებნა' });
        db.blogs[idx] = {
            ...db.blogs[idx],
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
            ...(author !== undefined && { author })
        };
        await Database.write(db);
        res.json(db.blogs[idx]);
    }
    catch (error) {
        res.status(500).json({ message: 'ბლოგის განახლების შეცდომა' });
    }
});
app.delete('/api/admin/blogs/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = db.blogs.findIndex(b => b.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'ბლოგი ვერ მოიძებნა' });
        db.blogs.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true, message: 'ბლოგი წაიშალა' });
    }
    catch (error) {
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
        if (!title || !date || !time)
            return res.status(400).json({ message: 'ყველა ველი სავალდებულოა' });
        const db = await Database.read();
        const newEvent = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'ღონისძიების შექმნის შეცდომა' });
    }
});
app.put('/api/admin/events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, date, time, location, category } = req.body;
        const db = await Database.read();
        const idx = db.events.findIndex(e => e.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'ღონისძიება ვერ მოიძებნა' });
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
    }
    catch (error) {
        res.status(500).json({ message: 'ღონისძიების განახლების შეცდომა' });
    }
});
app.delete('/api/admin/events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = db.events.findIndex(e => e.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'ღონისძიება ვერ მოიძებნა' });
        db.events.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true, message: 'ღონისძიება წაიშალა' });
    }
    catch (error) {
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
        if (idx === -1)
            return res.status(404).json({ message: 'რეგისტრაცია ვერ მოიძებნა' });
        db.registrations[idx].status = status;
        await Database.write(db);
        res.json(db.registrations[idx]);
    }
    catch (error) {
        res.status(500).json({ message: 'რეგისტრაციის სტატუსის შეცვლის შეცდომა' });
    }
});
app.delete('/api/admin/registrations/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = db.registrations.findIndex(r => r.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'რეგისტრაცია ვერ მოიძებნა' });
        db.registrations.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true, message: 'რეგისტრაცია წაიშალა' });
    }
    catch (error) {
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
app.delete('/api/admin/inquiries/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await Database.read();
        const idx = db.inquiries.findIndex(i => i.id === id);
        if (idx === -1)
            return res.status(404).json({ message: 'შეტყობინება ვერ მოიძებნა' });
        db.inquiries.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true, message: 'შეტყობინება წაიშალა' });
    }
    catch (error) {
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
        if (idx === -1)
            return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });
        db.users[idx].role = role;
        await Database.write(db);
        res.json({ id: db.users[idx].id, username: db.users[idx].username, name: db.users[idx].name, role: db.users[idx].role });
    }
    catch (error) {
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
        if (idx === -1)
            return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });
        db.users.splice(idx, 1);
        await Database.write(db);
        res.json({ success: true, message: 'მომხმარებელი წაიშალა' });
    }
    catch (error) {
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
        if (!pagePath)
            return res.status(400).json({ message: 'გვერდის მისამართი (path) აუცილებელია' });
        const db = await Database.read();
        const idx = db.seoSettings.findIndex(s => s.path === pagePath);
        const setting = {
            path: pagePath,
            title: title || '',
            description: description || '',
            keywords: keywords || ''
        };
        if (idx !== -1) {
            db.seoSettings[idx] = setting;
        }
        else {
            db.seoSettings.push(setting);
        }
        await Database.write(db);
        res.json(setting);
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ message: 'საიტის პარამეტრების შენახვის შეცდომა' });
    }
});
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
