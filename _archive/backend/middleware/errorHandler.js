// ==========================================================================
// DZHIRASENA - GLOBAL ERROR HANDLER MIDDLEWARE
// ==========================================================================

/**
 * Centralized error handler - selalu taruh di paling bawah app.use()
 */
export function errorHandler(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

    // CORS Error
    if (err.message && err.message.startsWith('CORS blocked')) {
        return res.status(403).json({ error: err.message });
    }

    // Supabase / Database Error
    if (err.code && (err.code.startsWith('PGRST') || err.code.startsWith('22'))) {
        return res.status(400).json({ error: 'Kesalahan database: ' + err.message });
    }

    // Default: Internal Server Error
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Terjadi kesalahan pada server.'
        : err.message || 'Internal Server Error';

    res.status(statusCode).json({ error: message });
}
