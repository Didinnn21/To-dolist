// ==========================================================================
// DZHIRASENA - FILE UPLOAD ROUTE
// POST /api/upload
// Upload file ke Supabase Storage dari sisi server (aman)
// ==========================================================================

import express from 'express';
import multer from 'multer';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Multer: simpan file di memory (buffer), bukan di disk
// Maksimum ukuran file: 10MB
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        // Tipe file yang diizinkan
        const allowedMimes = [
            // Gambar
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            // Dokumen
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            // Teks
            'text/plain', 'text/csv',
            // Arsip
            'application/zip', 'application/x-rar-compressed'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipe file tidak diizinkan: ${file.mimetype}`));
        }
    }
});

// ── POST /api/upload ──────────────────────────────────────────────────────
// Upload satu atau lebih file ke Supabase Storage
router.post('/', requireAuth, upload.array('files', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
        }

        const uploadedFiles = [];
        const errors = [];

        for (const file of req.files) {
            const ext = file.originalname.split('.').pop().toLowerCase();
            const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${ext}`;

            try {
                // Upload file buffer ke Supabase Storage
                const { data, error } = await supabase.storage
                    .from('task_attachments')
                    .upload(safeName, file.buffer, {
                        contentType: file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    console.error(`Gagal upload ${file.originalname}:`, error.message);
                    errors.push({ name: file.originalname, error: error.message });
                    continue;
                }

                // Ambil public URL
                const { data: urlData } = supabase.storage
                    .from('task_attachments')
                    .getPublicUrl(safeName);

                if (urlData && urlData.publicUrl) {
                    uploadedFiles.push({
                        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                        name: file.originalname,
                        url: urlData.publicUrl,
                        type: file.mimetype,
                        size: file.size
                    });
                }
            } catch (err) {
                console.error(`Error saat upload ${file.originalname}:`, err.message);
                errors.push({ name: file.originalname, error: err.message });
            }
        }

        if (uploadedFiles.length === 0 && errors.length > 0) {
            return res.status(500).json({
                error: 'Semua file gagal diunggah.',
                details: errors
            });
        }

        res.json({
            success: true,
            uploaded: uploadedFiles,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        // Handle multer errors (file size, type, dll)
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Ukuran file terlalu besar. Maksimum 10MB per file.' });
        }
        next(err);
    }
});

// ── DELETE /api/upload ────────────────────────────────────────────────────
// Hapus file dari Supabase Storage berdasarkan nama file
router.delete('/', requireAuth, async (req, res, next) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL file wajib diisi.' });

        // Ekstrak nama file dari URL Supabase Storage
        // Format: https://xxx.supabase.co/storage/v1/object/public/task_attachments/filename.ext
        const parts = url.split('/task_attachments/');
        if (parts.length < 2) {
            return res.status(400).json({ error: 'URL file tidak valid.' });
        }
        const fileName = parts[1].split('?')[0]; // hapus query string jika ada

        const { error } = await supabase.storage
            .from('task_attachments')
            .remove([fileName]);

        if (error) {
            console.warn('Gagal hapus file dari storage:', error.message);
            // Tetap kembalikan sukses agar task tetap bisa di-update
        }

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/upload/download ──────────────────────────────────────────────
// Proxy download file dari Supabase Storage
// Memastikan file terunduh dengan benar (content-type & disposition tepat)
router.get('/download', requireAuth, async (req, res, next) => {
    try {
        const { url, name } = req.query;
        if (!url) return res.status(400).json({ error: 'URL file wajib disertakan.' });

        // Ekstrak path file dari URL Supabase Storage
        const parts = url.split('/task_attachments/');
        if (parts.length < 2) {
            return res.status(400).json({ error: 'URL file tidak valid.' });
        }
        const filePath = decodeURIComponent(parts[1].split('?')[0]);

        // Download file dari Supabase Storage
        const { data, error } = await supabase.storage
            .from('task_attachments')
            .download(filePath);

        if (error || !data) {
            console.error('Gagal download dari storage:', error?.message);
            return res.status(404).json({ error: 'File tidak ditemukan di storage.' });
        }

        // Konversi Blob ke Buffer
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Set header yang benar agar file tidak corrupt
        const fileName = name || filePath.split('/').pop();
        const contentType = data.type || 'application/octet-stream';
        
        // RFC 5987 standard for content disposition header
        const safeFallbackName = fileName.replace(/[^\x20-\x7E]/g, '_');
        const encodedName = encodeURIComponent(fileName).replace(/['()]/g, escape);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${safeFallbackName}"; filename*=UTF-8''${encodedName}`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'private, max-age=3600');

        res.send(buffer);
    } catch (err) {
        next(err);
    }
});

export default router;
