// ==========================================================================
// DZHIRASENA - AUTHENTICATION (v4.0 - Express.js Backend)
// Semua request auth sekarang melewati Express API (/api/auth/*)
// JWT token disimpan di localStorage (lebih aman dari session mentah)
// ==========================================================================

const Auth = {
    currentUser: null,
    token: null,

    // ── INIT ────────────────────────────────────────────────────────────────
    async init() {
        const savedToken = localStorage.getItem('dzhirasena_token');
        if (!savedToken) {
            this.currentUser = null;
            this.token = null;
            this.protectRoutes();
            return;
        }

        // Load optimistically from local cache so the page renders instantly
        const cachedUser = localStorage.getItem('dzhirasena_user_cache');
        if (cachedUser) {
            try {
                this.currentUser = JSON.parse(cachedUser);
                this.token = savedToken;
            } catch (e) {
                // Ignore parse error, background verify will handle it
            }
        }

        // Run verification in the background (non-blocking)
        (async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${savedToken}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    this.token = savedToken;
                    this.currentUser = data.user;
                    localStorage.setItem('dzhirasena_user_cache', JSON.stringify(data.user));
                } else {
                    // Token expired or invalid -> clear session and redirect to login
                    this._clearSession();
                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.warn('Tidak dapat memverifikasi token (server mungkin offline):', err.message);
                // Keep local cache if server is offline
            }
            this.protectRoutes();
        })();

        this.protectRoutes();
    },

    // ── CLEAR SESSION ────────────────────────────────────────────────────────
    _clearSession() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('dzhirasena_token');
        localStorage.removeItem('dzhirasena_user_cache');
    },

    // ── PROTECT ROUTES ───────────────────────────────────────────────────────
    protectRoutes() {
        const path = window.location.pathname.toLowerCase();
        const isLoginPage = path === '/' || path.endsWith('/index.html') || path.endsWith('/');

        if (isLoginPage) {
            if (this.currentUser) {
                this.redirectToDashboard();
            }
        } else {
            if (!this.currentUser) {
                window.location.href = 'index.html';
                return;
            }

            const isAdmin = this.currentUser.role === 'Admin' || this.currentUser.role === 'Project Manager';
            const isAtasan = this.currentUser.role === 'Atasan';

            if (path.endsWith('/team.html') && !isAdmin) {
                window.location.href = 'admin-dashboard.html';
                return;
            }

            // Honor hanya untuk Atasan, PM, dan Admin — Staff di-redirect
            if (path.endsWith('/honor.html') && !isAtasan && !isAdmin) {
                window.location.href = 'user-dashboard.html';
                return;
            }

            if (path.endsWith('/admin-dashboard.html') && !isAdmin && !isAtasan) {
                window.location.href = 'user-dashboard.html';
                return;
            }

            const isUserPage = path.endsWith('/user-dashboard.html');
            if (isUserPage && (isAdmin || isAtasan)) {
                window.location.href = 'admin-dashboard.html';
                return;
            }
        }
    },

    // ── REDIRECT TO DASHBOARD ────────────────────────────────────────────────
    redirectToDashboard() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        const isAdmin = ['Admin', 'Project Manager', 'Atasan'].includes(this.currentUser.role);
        window.location.href = isAdmin ? 'admin-dashboard.html' : 'user-dashboard.html';
    },

    // ── LOGIN ────────────────────────────────────────────────────────────────
    async login(email, password) {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, message: data.error || 'Login gagal.' };
            }

            // Simpan JWT token dan data user
            this.token = data.token;
            this.currentUser = data.user;
            localStorage.setItem('dzhirasena_token', data.token);
            localStorage.setItem('dzhirasena_user_cache', JSON.stringify(data.user));

            // Hapus cache DB lama agar dashboard memuat data segar
            sessionStorage.removeItem('dzhirasena_db_cache');

            return { success: true, user: data.user };

        } catch (err) {
            console.error('Login error:', err);
            return { success: false, message: 'Tidak dapat terhubung ke server. Pastikan backend berjalan.' };
        }
    },

    // ── LOGOUT ───────────────────────────────────────────────────────────────
    async logout() {
        try {
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
            }
        } catch (err) {
            // Tidak perlu panic jika server tidak merespons saat logout
            console.warn('Logout server call failed:', err.message);
        } finally {
            this._clearSession();
            // Bersihkan DB cache
            sessionStorage.removeItem('dzhirasena_db_cache');
            window.location.href = 'index.html';
        }
    },

    // ── HELPER: Get auth header untuk semua API calls ─────────────────────
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
};

// Start initialization — simpan promise agar bisa di-await oleh DB.init()
document.addEventListener('DOMContentLoaded', () => {
    Auth._ready = Auth.init();
});
