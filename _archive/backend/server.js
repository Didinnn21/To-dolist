// ==========================================================================
// DZHIRASENA - EXPRESS.JS BACKEND SERVER (v1.0)
// Env variables dimuat via: node --env-file=backend/.env backend/server.js
// ==========================================================================

import express from 'express';
import cors from 'cors';

// Routes
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import categoriesRoutes from './routes/categories.js';
import honorRoutes from './routes/honor.js';
import uploadRoutes from './routes/upload.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',  // Vite kadang pakai port ini jika 5173 sudah terpakai
    'http://localhost:5175',
    'http://localhost:4173',  // Vite preview
    'http://localhost:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        // Izinkan request tanpa origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Izinkan semua localhost dengan port apapun (untuk development)
        const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
        if (isLocalhost || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── BODY PARSING ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── BASIC RATE LIMITING ────────────────────────────────────────────────────
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 150;

app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, start: now });
    } else {
        const record = requestCounts.get(ip);
        if (now - record.start > RATE_LIMIT_WINDOW) {
            record.count = 1;
            record.start = now;
        } else {
            record.count++;
            if (record.count > RATE_LIMIT_MAX) {
                return res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' });
            }
        }
    }
    next();
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Dzhirasena API Server berjalan',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ── ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/tasks',         tasksRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/categories',    categoriesRoutes);
app.use('/api/honor',         honorRoutes);
app.use('/api/upload',        uploadRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Endpoint tidak ditemukan: ${req.method} ${req.path}` });
});

// ── ERROR HANDLER ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── START ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🚀 Dzhirasena API Server               ║');
    console.log(`║   http://localhost:${PORT}                  ║`);
    console.log(`║   Mode: ${(process.env.NODE_ENV || 'development').padEnd(31)}║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});

export default app;
