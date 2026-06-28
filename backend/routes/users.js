// ==========================================================================
// DZHIRASENA - USERS ROUTES
// GET    /api/users
// POST   /api/users
// PUT    /api/users/:id
// PUT    /api/users/:id/status
// PUT    /api/users/:id/avatar
// DELETE /api/users/:id
// ==========================================================================

import express from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/users ────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('wf_users')
            .select('id, name, email, role, avatar, status')
            .order('name');

        if (error) throw error;
        res.json({ users: data || [] });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/users  (Admin only) ─────────────────────────────────────────
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { name, email, password, role, avatar } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi.' });
        }

        // Buat user di Supabase Auth menggunakan service role (bypass email confirmation)
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const { data, error } = await adminClient.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password,
            email_confirm: true,
            user_metadata: { name, role, avatar: avatar || '' }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Simpan/sinkronkan data user ke tabel public.wf_users agar langsung terdaftar di DB
        const { error: dbError } = await supabase
            .from('wf_users')
            .upsert({
                id: data.user.id,
                name,
                email: email.trim().toLowerCase(),
                role,
                avatar: avatar || '',
                status: 'Active',
                created_at: new Date().toISOString()
            });

        if (dbError) {
            console.error('Gagal menyimpan user ke wf_users:', dbError.message);
            // Tetap lanjut karena auth record sudah berhasil terbuat
        }

        res.status(201).json({
            success: true,
            user: {
                id: data.user.id,
                name,
                email: email.trim().toLowerCase(),
                role,
                avatar: avatar || '',
                status: 'Active'
            }
        });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/users/:id ────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const { name, role } = req.body;
        const isAdmin = ['Admin', 'Project Manager'].includes(req.user.role);

        // User hanya bisa edit diri sendiri, Admin bisa edit siapa saja
        if (req.params.id !== req.user.id && !isAdmin) {
            return res.status(403).json({ error: 'Tidak diizinkan mengubah data user lain.' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (role !== undefined && isAdmin) updateData.role = role; // hanya admin yang bisa ubah role

        const { data, error } = await supabase
            .from('wf_users')
            .update(updateData)
            .eq('id', req.params.id)
            .select('id, name, email, role, avatar, status')
            .single();

        if (error) throw error;
        res.json({ user: data });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/users/:id/password ───────────────────────────────────────────
router.put('/:id/password', requireAuth, async (req, res, next) => {
    try {
        const { password } = req.body;

        // Validasi: user hanya bisa ubah password diri sendiri
        if (req.params.id !== req.user.id) {
            return res.status(403).json({ error: 'Tidak diizinkan mengubah password user lain.' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
        }

        // Update password via Supabase Admin API (menggunakan service role)
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const { error } = await adminClient.auth.admin.updateUserById(req.params.id, { password });

        if (error) {
            // Fallback: coba dengan updateUser jika admin API tidak tersedia
            return res.status(400).json({ error: 'Gagal memperbarui kata sandi: ' + error.message });
        }

        res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/users/:id/status (Admin only) ────────────────────────────────
router.put('/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status || !['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({ error: 'Status tidak valid. Gunakan: Active atau Inactive' });
        }

        const { data, error } = await supabase
            .from('wf_users')
            .update({ status })
            .eq('id', req.params.id)
            .select('id, name, email, role, avatar, status')
            .single();

        if (error) throw error;
        res.json({ user: data });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/users/:id/avatar ─────────────────────────────────────────────
router.put('/:id/avatar', requireAuth, async (req, res, next) => {
    try {
        const { avatar } = req.body;
        if (!avatar) return res.status(400).json({ error: 'URL avatar wajib diisi.' });

        // User hanya bisa ubah avatar diri sendiri
        if (req.params.id !== req.user.id && !['Admin', 'Project Manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Tidak diizinkan.' });
        }

        const { data, error } = await supabase
            .from('wf_users')
            .update({ avatar })
            .eq('id', req.params.id)
            .select('id, name, email, role, avatar, status')
            .single();

        if (error) throw error;
        res.json({ user: data });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/users/:id (Admin only) ────────────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
        }

        const { error } = await supabase
            .from('wf_users')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'User berhasil dihapus.' });
    } catch (err) {
        next(err);
    }
});

export default router;
