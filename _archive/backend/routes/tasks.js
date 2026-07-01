// ==========================================================================
// DZHIRASENA - TASKS ROUTES
// GET    /api/tasks
// GET    /api/tasks/:id
// POST   /api/tasks
// PUT    /api/tasks/:id
// DELETE /api/tasks/:id
// PUT    /api/tasks/:id/status
// POST   /api/tasks/:id/progress
// ==========================================================================

import express from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper: parse assignedTo selalu array
function parseAssignees(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
        return [String(val)];
    }
}

// Helper: map Supabase task row ke format frontend
function mapTask(t) {
    return {
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        deadline: t.deadline,
        priority: t.priority,
        assignedTo: parseAssignees(t.assigned_to),
        createdBy: t.created_by || null,
        status: t.status,
        createdAt: t.created_at,
        honorAmount: t.honor_amount || 0,
        attachments: (() => {
            try { return t.attachments ? JSON.parse(t.attachments) : []; }
            catch { return []; }
        })(),
        progressUpdates: (() => {
            try { return t.progress_updates ? JSON.parse(t.progress_updates) : []; }
            catch { return []; }
        })()
    };
}

// ── GET /api/tasks ────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('wf_tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ tasks: (data || []).map(mapTask) });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/tasks/:id ────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('wf_tasks')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
        res.json({ task: mapTask(data) });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/tasks ───────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { title, description, category, deadline, priority, assignedTo, attachments } = req.body;

        if (!title || !deadline || !priority) {
            return res.status(400).json({ error: 'Judul, deadline, dan prioritas wajib diisi.' });
        }

        const newTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            title,
            description: description || '',
            category: category || '',
            deadline,
            priority,
            assigned_to: JSON.stringify(parseAssignees(assignedTo)),
            created_by: req.user.id,
            status: 'In Progress',
            created_at: new Date().toISOString()
        };

        if (attachments && attachments.length > 0) {
            newTask.attachments = JSON.stringify(attachments);
        }

        const { data, error } = await supabase.from('wf_tasks').insert([newTask]).select().single();
        if (error) throw error;

        res.status(201).json({ task: mapTask(data) });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const { title, description, category, deadline, priority, assignedTo, attachments } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (deadline !== undefined) updateData.deadline = deadline;
        if (priority !== undefined) updateData.priority = priority;
        if (assignedTo !== undefined) updateData.assigned_to = JSON.stringify(parseAssignees(assignedTo));
        if (attachments !== undefined) updateData.attachments = JSON.stringify(attachments);

        const { data, error } = await supabase
            .from('wf_tasks')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ task: mapTask(data) });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/tasks/:id/status ─────────────────────────────────────────────
router.put('/:id/status', requireAuth, async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Todo', 'In Progress', 'Completed', 'Paid'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status tidak valid. Gunakan: ${validStatuses.join(', ')}` });
        }

        // Fetch task dulu untuk validasi
        const { data: task, error: fetchErr } = await supabase
            .from('wf_tasks')
            .select('id, status, assigned_to')
            .eq('id', req.params.id)
            .single();

        if (fetchErr || !task) {
            return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
        }

        const isAdminOrPM = ['Admin', 'Project Manager'].includes(req.user.role);
        const currentStatus = task.status;
        const assignees = parseAssignees(task.assigned_to);
        const isAssignee = assignees.includes(req.user.id);
        const isCompleted = currentStatus === 'Completed' || currentStatus === 'Paid';

        // Aturan RBAC:
        // 1. Membalikkan dari Completed/Paid → hanya Admin/PM
        if (isCompleted && !isAdminOrPM) {
            return res.status(403).json({
                error: 'Hanya Admin atau Project Manager yang dapat mengubah status tugas yang telah selesai.'
            });
        }

        // 2. Menandai sebagai Completed → hanya assignee
        if (!isCompleted && status === 'Completed' && !isAssignee) {
            return res.status(403).json({
                error: 'Hanya penanggungjawab tugas yang dapat menandai tugas sebagai selesai.'
            });
        }

        // 3. Menandai sebagai Paid → hanya Admin/PM
        if (status === 'Paid' && !isAdminOrPM) {
            return res.status(403).json({
                error: 'Hanya Admin atau Project Manager yang dapat menandai tugas sebagai dibayar.'
            });
        }

        const { data, error } = await supabase
            .from('wf_tasks')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ task: mapTask(data) });
    } catch (err) {
        next(err);
    }
});


// ── POST /api/tasks/:id/progress ──────────────────────────────────────────
router.post('/:id/progress', requireAuth, async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Teks progress update wajib diisi.' });
        }

        // Fetch current task
        const { data: task, error: fetchErr } = await supabase
            .from('wf_tasks')
            .select('progress_updates')
            .eq('id', req.params.id)
            .single();

        if (fetchErr || !task) return res.status(404).json({ error: 'Tugas tidak ditemukan.' });

        let progressUpdates = [];
        try { progressUpdates = task.progress_updates ? JSON.parse(task.progress_updates) : []; }
        catch { progressUpdates = []; }

        const newUpdate = {
            id: `upd-${Date.now()}`,
            userId: req.user.id,
            userName: req.user.name,
            text: text.trim(),
            createdAt: new Date().toISOString()
        };
        progressUpdates.push(newUpdate);

        const { error: updateErr } = await supabase
            .from('wf_tasks')
            .update({ progress_updates: JSON.stringify(progressUpdates) })
            .eq('id', req.params.id);

        if (updateErr) throw updateErr;
        res.status(201).json({ progressUpdate: newUpdate });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/tasks/:id/progress/:progressId ────────────────────────────
router.delete('/:id/progress/:progressId', requireAuth, async (req, res, next) => {
    try {
        const { id, progressId } = req.params;

        const { data: task, error: fetchErr } = await supabase
            .from('wf_tasks')
            .select('progress_updates')
            .eq('id', id)
            .single();

        if (fetchErr || !task) return res.status(404).json({ error: 'Tugas tidak ditemukan.' });

        let progressUpdates = [];
        try { progressUpdates = task.progress_updates ? JSON.parse(task.progress_updates) : []; }
        catch { progressUpdates = []; }

        const updateIndex = progressUpdates.findIndex(upd => upd.id === progressId);
        if (updateIndex === -1) {
            return res.status(404).json({ error: 'Progress update tidak ditemukan.' });
        }

        // Verify authorization: author or Admin/Project Manager
        const targetUpdate = progressUpdates[updateIndex];
        const isAdmin = ['Admin', 'Project Manager'].includes(req.user.role);
        if (targetUpdate.userId !== req.user.id && !isAdmin) {
            return res.status(403).json({ error: 'Akses ditolak. Anda tidak berhak menghapus progress ini.' });
        }

        progressUpdates.splice(updateIndex, 1);

        const { error: updateErr } = await supabase
            .from('wf_tasks')
            .update({ progress_updates: JSON.stringify(progressUpdates) })
            .eq('id', id);

        if (updateErr) throw updateErr;
        res.json({ success: true, progressUpdates });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        // Hapus komentar terkait dulu
        await supabase.from('wf_comments').delete().eq('task_id', req.params.id).catch(() => {});

        const { error } = await supabase
            .from('wf_tasks')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Tugas berhasil dihapus.' });
    } catch (err) {
        next(err);
    }
});

export default router;
