// ==========================================================================
// DZHIRASENA - CATEGORIES ROUTES
// GET    /api/categories
// POST   /api/categories
// DELETE /api/categories/:id
// ==========================================================================

import express from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/categories ───────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('wf_categories')
            .select('*')
            .order('name');

        if (error) throw error;
        res.json({ categories: data || [] });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/categories (Admin only) ─────────────────────────────────────
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
        }

        const newCategory = {
            id: `cat-${Date.now()}`,
            name: name.trim()
        };

        const { data, error } = await supabase
            .from('wf_categories')
            .insert([newCategory])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ category: data });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/categories/:id (Admin only) ───────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('wf_categories')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Kategori berhasil dihapus.' });
    } catch (err) {
        next(err);
    }
});

export default router;
