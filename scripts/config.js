// ==========================================================================
// DZHIRASENA - FRONTEND CONFIG (v4.0)
// Supabase key SUDAH DIPINDAHKAN ke backend/.env (lebih aman!)
// Frontend tidak lagi mengakses Supabase secara langsung.
// Semua request data melewati Express.js backend di /api/*
// ==========================================================================

const CONFIG = {
    // API base URL (otomatis dihandle oleh Vite proxy → Express.js)
    API_URL: '/api',

    // Versi aplikasi
    VERSION: '4.0.0',
    APP_NAME: 'Dzhirasena'
};
