// ==========================================================================
// DZHIRASENA - JWT AUTH MIDDLEWARE
// ==========================================================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_this';

/**
 * Middleware: Verifikasi JWT token dari header Authorization
 * Wajib dipakai di semua route yang butuh login
 */
export function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    // Fallback: baca token dari query parameter jika header kosong (untuk download link langsung)
    if (!token && req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, name, role }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Sesi telah berakhir. Silakan login kembali.' });
        }
        return res.status(403).json({ error: 'Token tidak valid.' });
    }
}

/**
 * Middleware: Hanya Admin dan Project Manager yang boleh akses
 */
export function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Belum terautentikasi.' });
    
    const adminRoles = ['Admin', 'Project Manager'];
    if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Akses ditolak. Hanya Admin yang diizinkan.' });
    }
    next();
}

/**
 * Middleware: Admin, Project Manager, atau Atasan yang boleh akses
 */
export function requireAdminOrAtasan(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Belum terautentikasi.' });
    
    const allowedRoles = ['Admin', 'Project Manager', 'Atasan'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Akses ditolak.' });
    }
    next();
}

/**
 * Generate JWT token
 */
export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}
