// ==========================================================================
// DZHIRASENA - HONOR PAYMENT ROUTES  (BUG FIX: sebelumnya tidak sync ke DB)
// GET  /api/honor
// POST /api/honor/pay
// ==========================================================================

import express from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireAdmin, requireAdminOrAtasan } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/honor ────────────────────────────────────────────────────────
// Ambil semua riwayat pembayaran honor dari Supabase
router.get('/', requireAuth, async (req, res, next) => {
    try {
        // Coba ambil dari tabel wf_honor_payments (buat jika belum ada)
        const { data, error } = await supabase
            .from('wf_honor_payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Tabel belum ada di Supabase — kembalikan array kosong
            console.warn('Tabel wf_honor_payments belum ada di Supabase:', error.message);
            return res.json({ honorPayments: [] });
        }

        res.json({ honorPayments: data || [] });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/honor/pay  (Admin & Atasan) ────────────────────────────────
// Proses pembayaran honor + update status task menjadi "Paid" di Supabase
router.post('/pay', requireAuth, requireAdminOrAtasan, async (req, res, next) => {
    try {
        const { employeeId, employeeName, amount, taskIds } = req.body;

        if (!employeeId || !amount || !taskIds || taskIds.length === 0) {
            return res.status(400).json({ error: 'employeeId, amount, dan taskIds wajib diisi.' });
        }

        // 1. Update status menjadi "Paid" dan simpan honor_amount masing-masing task di Supabase
        if (req.body.taskAmounts) {
            const { taskAmounts } = req.body;
            for (const taskId of taskIds) {
                const taskAmount = Number(taskAmounts[taskId]) || 0;
                const { error: taskError } = await supabase
                    .from('wf_tasks')
                    .update({ status: 'Paid', honor_amount: taskAmount })
                    .eq('id', taskId);

                if (taskError) throw taskError;
            }
        } else {
            // Fallback: jika pemanggilan dari sistem lama tanpa rincian per-tugas
            const { error: taskError } = await supabase
                .from('wf_tasks')
                .update({ status: 'Paid' })
                .in('id', taskIds);

            if (taskError) throw taskError;
        }

        // 2. Simpan record pembayaran honor
        const honorRecord = {
            id: `honor-${Date.now()}`,
            employee_id: employeeId,
            employee_name: employeeName,
            amount: Number(amount),
            task_count: taskIds.length,
            task_ids: JSON.stringify(taskIds),
            paid_by: req.user.id,
            created_at: new Date().toISOString()
        };

        // Coba insert ke tabel wf_honor_payments
        const { data, error: honorError } = await supabase
            .from('wf_honor_payments')
            .insert([honorRecord])
            .select()
            .single();

        if (honorError) {
            // Jika tabel belum ada, tetap kembalikan sukses (task sudah di-update)
            console.warn('Gagal menyimpan honor record (tabel mungkin belum ada):', honorError.message);
            return res.json({
                success: true,
                message: `Honor Rp${Number(amount).toLocaleString()} untuk ${employeeName} berhasil dicatat. (Honor archive belum tersedia)`,
                updatedTaskIds: taskIds
            });
        }

        res.json({
            success: true,
            message: `Honor Rp${Number(amount).toLocaleString()} untuk ${employeeName} berhasil dibayarkan.`,
            honorRecord: data,
            updatedTaskIds: taskIds
        });
    } catch (err) {
        next(err);
    }
});

export default router;
