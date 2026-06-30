// ==========================================================================
// DZHIRASENA - AUTH ROUTES
// POST /api/auth/login
// POST /api/auth/logout
// GET  /api/auth/me
// ==========================================================================

import express from 'express';
import { supabase, supabaseAuth } from '../supabase.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi.' });
        }

        // 1. Login via Supabase Auth — WAJIB pakai supabaseAuth (anon key)
        // Service role key tidak bisa dipakai untuk signInWithPassword
        const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
        });

        if (error) {
            let msg = 'Email atau Password salah!';
            if (error.message.includes('Email not confirmed')) msg = 'Email belum diverifikasi!';
            if (error.message.includes('Invalid login credentials')) msg = 'Email atau Password salah!';
            if (error.message.toLowerCase().includes('too many requests') ||
                error.message.toLowerCase().includes('rate limit') ||
                error.status === 429) {
                msg = 'Terlalu banyak percobaan login. Tunggu beberapa menit sebelum mencoba lagi.';
                return res.status(429).json({ error: msg });
            }
            return res.status(401).json({ error: msg });
        }

        // 2. Ambil data user lengkap dari wf_users
        const { data: userRecord, error: userError } = await supabase
            .from('wf_users')
            .select('id, name, email, role, avatar, status, npwp, cv_url, portfolio_url, address, gender, bank_account, ktp_url')
            .eq('id', data.session.user.id)
            .single();

        if (userError || !userRecord) {
            // Fallback ke data dari Supabase Auth
            const fallbackUser = {
                id: data.session.user.id,
                email: data.session.user.email,
                name: data.session.user.user_metadata?.name || 'User Baru',
                role: data.session.user.user_metadata?.role || 'Staff',
                avatar: data.session.user.user_metadata?.avatar || '',
                status: 'Active'
            };
            const token = generateToken(fallbackUser);
            return res.json({ success: true, token, user: fallbackUser });
        }

        // 3. Cek status akun
        if (userRecord.status !== 'Active') {
            await supabaseAuth.auth.signOut();
            return res.status(403).json({ error: 'Hubungi Admin, akun Anda telah dinonaktifkan!' });
        }

        // 4. Generate JWT token (berisi id, email, name, role)
        const token = generateToken(userRecord);

        // 5. Sign out dari Supabase Auth session (kita pakai JWT sendiri)
        // Ini opsional — kita bisa tetap pakai session Supabase jika mau
        // await supabase.auth.signOut();

        res.json({
            success: true,
            token,
            user: {
                id: userRecord.id,
                name: userRecord.name,
                email: userRecord.email,
                role: userRecord.role,
                avatar: userRecord.avatar,
                status: userRecord.status,
                npwp: userRecord.npwp || '',
                cv_url: userRecord.cv_url || '',
                portfolio_url: userRecord.portfolio_url || '',
                address: userRecord.address || '',
                gender: userRecord.gender || '',
                bank_account: userRecord.bank_account || '',
                ktp_url: userRecord.ktp_url || ''
            }
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        // Data user ada di req.user (dari JWT)
        // Fetch fresh dari database untuk memastikan data terbaru
        const { data: userRecord, error } = await supabase
            .from('wf_users')
            .select('id, name, email, role, avatar, status, npwp, cv_url, portfolio_url, address, gender, bank_account, ktp_url')
            .eq('id', req.user.id)
            .single();

        if (error || !userRecord) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }

        if (userRecord.status !== 'Active') {
            return res.status(403).json({ error: 'Akun telah dinonaktifkan.' });
        }

        res.json({ user: userRecord });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
    // JWT adalah stateless — logout hanya berarti client hapus tokennya
    // Tidak ada yang perlu dilakukan di server untuk basic JWT
    res.json({ success: true, message: 'Logout berhasil.' });
});

export default router;
