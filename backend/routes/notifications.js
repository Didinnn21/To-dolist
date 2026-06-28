// ==========================================================================
// DZHIRASENA - NOTIFICATIONS ROUTES
// GET  /api/notifications
// PUT  /api/notifications/:id/read
// PUT  /api/notifications/read-all
// POST /api/notifications
// ==========================================================================

import express from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/notifications ────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('wf_notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) throw error;

        const notifications = (data || []).map(n => ({
            id: n.id,
            userId: n.user_id,
            message: n.message,
            type: n.type,
            timestamp: n.timestamp,
            isRead: n.is_read
        }));

        res.json({ notifications });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/notifications ───────────────────────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { userId, message, type } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ error: 'userId dan message wajib diisi.' });
        }

        const newNotif = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            message,
            type: type || 'info',
            timestamp: new Date().toISOString(),
            is_read: false
        };

        const { data, error } = await supabase
            .from('wf_notifications')
            .insert([newNotif])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            notification: {
                id: data.id,
                userId: data.user_id,
                message: data.message,
                type: data.type,
                timestamp: data.timestamp,
                isRead: data.is_read
            }
        });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/notifications/read-all ──────────────────────────────────────
router.put('/read-all', requireAuth, async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('wf_notifications')
            .update({ is_read: true })
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca.' });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/notifications/:id/read ──────────────────────────────────────
router.put('/:id/read', requireAuth, async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('wf_notifications')
            .update({ is_read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id); // pastikan hanya notif milik user sendiri

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
