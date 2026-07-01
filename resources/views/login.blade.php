<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dzhirasena - Login</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
</head>

<body>
    <script>if (localStorage.getItem('dzhirasena_theme') === 'dark') document.body.classList.add('dark-theme');</script>

    <!-- Toast Notification Container -->
    <div id="toast-container" class="toast-container"></div>

    <!-- ========================================== -->
    <!-- 1. LOGIN SCREEN -->
    <!-- ========================================== -->
    <div id="login-screen" class="login-screen">
        <div class="login-container">
            <div class="login-logo text-center">
                <div class="logo-icon mx-auto">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                        <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                        <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                        <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                        <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                    </svg>
                </div>
                <h2>Dzhirasena</h2>
            </div>

            <div class="login-card">
                <div class="login-header">
                    <h3>Selamat Datang</h3>
                    <p>Silakan masukkan kredensial Anda untuk melanjutkan.</p>
                </div>

                <form id="login-form">
                    <div class="form-group">
                        <label for="login-email">Alamat Email</label>
                        <div class="input-wrapper">
                            <svg class="input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
                                stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z">
                                </path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <input type="email" id="login-email" placeholder="name@company.com" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="label-row">
                            <label for="login-password">Kata Sandi</label>
                            <a href="#" class="forgot-link" id="forgot-password-btn">Lupa Password?</a>
                        </div>
                        <div class="input-wrapper">
                            <svg class="input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
                                stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input type="password" id="login-password" placeholder="••••••••" required>
                            <button type="button" class="toggle-password" id="toggle-password-btn">
                                <svg id="eye-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
                                    stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="form-options">
                        <label class="checkbox-container">
                            <input type="checkbox" id="remember-me">
                            <span class="checkmark"></span>
                            Ingat Saya
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">
                        <span>Masuk</span>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2"
                            fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12,5 19,12 12,6"></polyline>
                        </svg>
                    </button>
                </form>

            </div>

            <div class="login-footer">
                <p>Belum memiliki akun? <a href="#" id="contact-admin-btn">Hubungi Admin</a></p>
                <div class="footer-meta">
                    <span class="status-indicator-green"></span> Systems Operational
                    <span style="margin: 0 8px;">|</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"
                        style="display:inline-block; vertical-align:middle; margin-right:2px;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg> SSO Protected
                </div>
                <p class="copyright">&copy; 2026 Dzhirasena. PROFESSIONAL PRODUCTIVITY SUITE.</p>
            </div>
        </div>
    </div>

    <!-- Contact Admin Info Modal -->
    <div id="contact-admin-modal" class="modal-overlay hidden">
        <div class="modal-content text-center">
            <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                <h3 style="width: 100%; font-size: 20px;">Hubungi Administrator</h3>
            </div>
            <div style="padding: 24px;">
                <div
                    style="width: 64px; height: 64px; background: #EEF4FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="#0a52c6" stroke-width="2" fill="none">
                        <path
                            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z">
                        </path>
                    </svg>
                </div>
                <p style="color: var(--text-muted); margin-bottom: 24px;">Untuk keamanan sistem, pendaftaran akun baru
                    hanya dapat dilakukan oleh Admin HRD atau Manajer Proyek. Silakan hubungi:</p>
                <div
                    style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="font-weight: 600; margin-bottom: 8px;">Admin (Didin)</p>
                    <p style="color: var(--primary-color); font-weight: 500;">admin@dzhirasena.com</p>
                    <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">+6285159120040</p>
                </div>
                <button type="button" class="btn btn-primary btn-block" id="close-contact-admin-btn">Mengerti</button>
            </div>
        </div>
    </div>

    <!-- Shared App logic -->
    <script src="{{ asset('js/db.js') }}"></script>
    <script src="{{ asset('js/auth.js') }}"></script>

    <!-- Page Logic -->
    <script src="{{ asset('js/login.js') }}"></script>
</body>

</html>