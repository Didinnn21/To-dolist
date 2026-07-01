// ==========================================================================
// DZHIRASENA - AUTHENTICATION (v5.0 - Direct Supabase, No Backend Required)
// Semua request auth langsung ke Supabase REST API (anon key)
// JWT = Supabase access_token yang disimpan di localStorage
// ==========================================================================

const SUPABASE_URL  = 'https://wrcenmpkawyovpsuwbaz.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyY2VubXBrYXd5b3Zwc3V3YmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzExNTgsImV4cCI6MjA5NzEwNzE1OH0.4gQMXu49zKleA9LAV8MsGFcKvVETiCrU-Mc-lAk5Vx4';

const Auth = {
    currentUser: null,
    token: null,       // Supabase access_token
    refreshToken: null,

    // ── HELPER: Supabase REST fetch ──────────────────────────────────────────
    async _sbFetch(path, options = {}) {
        const headers = {
            'apikey': SUPABASE_ANON,
            'Content-Type': 'application/json',
            ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
            ...(options.headers || {})
        };
        const res = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
        return res;
    },

    // ── GET AUTH HEADER (dipanggil oleh DB._fetch) ───────────────────────────
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    },

    // ── INIT ─────────────────────────────────────────────────────────────────
    async init() {
        const savedToken   = localStorage.getItem('dzhirasena_token');
        const savedRefresh = localStorage.getItem('dzhirasena_refresh_token');

        if (!savedToken) {
            this.currentUser = null;
            this.token = null;
            this.protectRoutes();
            return;
        }

        // Muat optimistis dari cache agar halaman langsung tampil
        const cachedUser = localStorage.getItem('dzhirasena_user_cache');
        if (cachedUser) {
            try {
                this.currentUser = JSON.parse(cachedUser);
                this.token = savedToken;
                this.refreshToken = savedRefresh;
            } catch (_) {}
        }

        // Verifikasi token di background (non-blocking)
        (async () => {
            try {
                // Coba pakai token yang tersimpan dulu
                this.token = savedToken;
                const profileRes = await this._sbFetch(
                    `/rest/v1/wf_users?id=eq.${encodeURIComponent(this._decodeUserId(savedToken))}&select=id,name,email,role,avatar,status,npwp,cv_url,portfolio_url,address,gender,bank_account,ktp_url`,
                    { headers: { 'Prefer': 'return=representation' } }
                );

                if (profileRes.ok) {
                    const profiles = await profileRes.json();
                    if (profiles && profiles.length > 0) {
                        this.currentUser = profiles[0];
                        localStorage.setItem('dzhirasena_user_cache', JSON.stringify(this.currentUser));
                    } else {
                        // Profil tidak ditemukan → coba refresh token
                        await this._tryRefreshToken(savedRefresh);
                    }
                } else if (profileRes.status === 401) {
                    // Token expired → coba refresh
                    const refreshed = await this._tryRefreshToken(savedRefresh);
                    if (!refreshed) {
                        this._clearSession();
                        window.location.href = '/';
                        return;
                    }
                } else {
                    // Error lain → keep cache (offline?)
                    console.warn('Tidak dapat memverifikasi token (server mungkin offline)');
                }
            } catch (err) {
                console.warn('Auth.init verify error:', err.message);
                // Keep cached user jika server offline
            }
            this.protectRoutes();
        })();

        this.protectRoutes();
    },

    // ── DECODE USER ID DARI JWT ───────────────────────────────────────────────
    _decodeUserId(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || '';
        } catch (_) {
            return '';
        }
    },

    // ── REFRESH TOKEN ─────────────────────────────────────────────────────────
    async _tryRefreshToken(refreshToken) {
        if (!refreshToken) return false;
        try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            if (!res.ok) return false;
            const data = await res.json();
            this.token = data.access_token;
            this.refreshToken = data.refresh_token;
            localStorage.setItem('dzhirasena_token', data.access_token);
            localStorage.setItem('dzhirasena_refresh_token', data.refresh_token);
            return true;
        } catch (_) {
            return false;
        }
    },

    // ── CLEAR SESSION ─────────────────────────────────────────────────────────
    _clearSession() {
        this.currentUser = null;
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('dzhirasena_token');
        localStorage.removeItem('dzhirasena_refresh_token');
        localStorage.removeItem('dzhirasena_user_cache');
    },

    // ── PROTECT ROUTES ────────────────────────────────────────────────────────
    protectRoutes() {
        const path = window.location.pathname.toLowerCase();
        const isLoginPage = path === '/' || path.endsWith('/index.html') || path.endsWith('/login') || path === '';

        if (isLoginPage) {
            if (this.currentUser) {
                this.redirectToDashboard();
            }
        } else {
            if (!this.currentUser) {
                window.location.href = '/';
                return;
            }

            const isAdmin  = this.currentUser.role === 'Admin' || this.currentUser.role === 'Project Manager';
            const isAtasan = this.currentUser.role === 'Atasan';

            if ((path.endsWith('/team') || path.endsWith('/team.html')) && !isAdmin) {
                window.location.href = '/admin-dashboard';
                return;
            }

            if ((path.endsWith('/honor') || path.endsWith('/honor.html')) && !isAtasan && !isAdmin) {
                window.location.href = '/user-dashboard';
                return;
            }

            if ((path.endsWith('/admin-dashboard') || path.endsWith('/admin-dashboard.html')) && !isAdmin && !isAtasan) {
                window.location.href = '/user-dashboard';
                return;
            }

            const isUserPage = path.endsWith('/user-dashboard') || path.endsWith('/user-dashboard.html');
            if (isUserPage && (isAdmin || isAtasan)) {
                window.location.href = '/admin-dashboard';
                return;
            }
        }
    },

    // ── REDIRECT TO DASHBOARD ─────────────────────────────────────────────────
    redirectToDashboard() {
        if (!this.currentUser) { window.location.href = '/'; return; }
        const isAdmin = ['Admin', 'Project Manager', 'Atasan'].includes(this.currentUser.role);
        window.location.href = isAdmin ? '/admin-dashboard' : '/user-dashboard';
    },

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    async login(email, password) {
        try {
            // 1. Autentikasi ke Supabase Auth
            const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password })
            });

            const authData = await authRes.json();

            if (!authRes.ok) {
                const errMsg = authData.error_description || authData.msg || authData.message || 'Login gagal.';
                // Terjemahkan pesan error Supabase ke Bahasa Indonesia
                if (errMsg.toLowerCase().includes('invalid login') || errMsg.toLowerCase().includes('invalid credentials')) {
                    return { success: false, message: 'Email atau Password salah!' };
                }
                if (errMsg.toLowerCase().includes('email not confirmed')) {
                    return { success: false, message: 'Email belum diverifikasi. Periksa inbox email Anda.' };
                }
                if (errMsg.toLowerCase().includes('too many') || errMsg.toLowerCase().includes('rate limit')) {
                    return { success: false, message: 'Terlalu banyak percobaan login. Tunggu beberapa menit sebelum mencoba lagi.' };
                }
                return { success: false, message: errMsg };
            }

            const accessToken  = authData.access_token;
            const refreshToken = authData.refresh_token;
            const userId       = authData.user.id;

            // 2. Ambil profil dari wf_users
            const profileRes = await fetch(
                `${SUPABASE_URL}/rest/v1/wf_users?id=eq.${userId}&select=id,name,email,role,avatar,status,npwp,cv_url,portfolio_url,address,gender,bank_account,ktp_url`,
                { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${accessToken}` } }
            );

            const profiles = await profileRes.json();
            const profile  = profiles[0];

            if (!profile) {
                // Fallback: buat profil minimal dari data Supabase Auth
                const fallback = {
                    id:     userId,
                    email:  authData.user.email,
                    name:   authData.user.user_metadata?.name || authData.user.email.split('@')[0],
                    role:   authData.user.user_metadata?.role || 'Staff',
                    avatar: authData.user.user_metadata?.avatar || '',
                    status: 'Active'
                };
                this.token        = accessToken;
                this.refreshToken = refreshToken;
                this.currentUser  = fallback;
                localStorage.setItem('dzhirasena_token',         accessToken);
                localStorage.setItem('dzhirasena_refresh_token', refreshToken);
                localStorage.setItem('dzhirasena_user_cache',    JSON.stringify(fallback));
                sessionStorage.removeItem('dzhirasena_db_cache');
                return { success: true, user: fallback };
            }

            // 3. Cek status akun
            if (profile.status !== 'Active') {
                return { success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi Admin.' };
            }

            // 4. Simpan sesi
            this.token        = accessToken;
            this.refreshToken = refreshToken;
            this.currentUser  = profile;
            localStorage.setItem('dzhirasena_token',         accessToken);
            localStorage.setItem('dzhirasena_refresh_token', refreshToken);
            localStorage.setItem('dzhirasena_user_cache',    JSON.stringify(profile));
            sessionStorage.removeItem('dzhirasena_db_cache');

            return { success: true, user: profile };

        } catch (err) {
            console.error('Login error:', err);
            return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
        }
    },

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    async logout() {
        try {
            if (this.token) {
                await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
                    method: 'POST',
                    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${this.token}` }
                }).catch(() => {}); // silently ignore
            }
        } finally {
            this._clearSession();
            sessionStorage.removeItem('dzhirasena_db_cache');
            window.location.href = '/';
        }
    }
};

// Start initialization
document.addEventListener('DOMContentLoaded', () => {
    Auth._ready = Auth.init();
});
