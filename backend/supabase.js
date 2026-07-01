// ==========================================================================
// DZHIRASENA - SUPABASE CLIENT (Server-side, aman)
// ==========================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.SUPABASE_URL;
const anonKey      = process.env.SUPABASE_ANON_KEY;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
    console.error('❌ FATAL: SUPABASE_URL atau SUPABASE_ANON_KEY tidak ditemukan di .env!');
    process.exit(1);
}

// Client utama untuk operasi DB dan Storage (pakai service role agar bypass RLS)
// Service role key aman dipakai di server — JANGAN dikirim ke frontend
export const supabase = createClient(supabaseUrl, serviceKey || anonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

// Client khusus untuk Supabase Auth (signIn, signUp, dll)
// WAJIB pakai anon key — service role key tidak bisa dipakai untuk auth user
export const supabaseAuth = createClient(supabaseUrl, anonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});
