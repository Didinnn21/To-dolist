// ==========================================================================
// DZHIRASENA - LOGIN SCREEN INTERACTION LOGIC
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // Apply dark mode if chosen
    const savedTheme = localStorage.getItem("dzhirasena_theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
    } else {
        document.body.classList.remove("dark-theme");
    }

    // Halaman login tidak perlu load database (data dimuat setelah login berhasil)
    // DB.init() tidak dipanggil di sini untuk mencegah reload loop


    const loginForm = document.getElementById("login-form");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");

    // Toast alert triggers inside index.html layout (loaded natively)
    const showLocalToast = (msg, type = "info") => {
        const toastContainer = document.getElementById("toast-container");
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;

        let iconSvg = "";
        if (type === "success") {
            iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#10b981" stroke-width="2.5" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        } else if (type === "error") {
            iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#EF4444" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#0A52C6" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `
            ${iconSvg}
            <span class="toast-message">${msg}</span>
        `;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(50px)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Form submission
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = loginEmail.value;
            const password = loginPassword.value;

            // Show loading state (optional UX improvement)
            const submitBtn = loginForm.querySelector("button[type='submit']");
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Memproses...";
            submitBtn.disabled = true;

            const res = await Auth.login(email, password);

            submitBtn.innerText = originalText;
            submitBtn.disabled = false;

            if (res.success) {
                showLocalToast(`Selamat datang kembali, ${res.user.name || res.user.email}!`, "success");
                setTimeout(() => {
                    Auth.redirectToDashboard();
                }, 800);
            } else {
                // Terjemahkan pesan error Supabase ke Bahasa Indonesia
                let msg = res.message || "Login gagal.";
                if (msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("rate limit")) {
                    msg = "Terlalu banyak percobaan login. Tunggu beberapa menit sebelum mencoba lagi.";
                } else if (msg.toLowerCase().includes("email not confirmed")) {
                    msg = "Email belum diverifikasi. Periksa inbox email Anda.";
                } else if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("salah")) {
                    msg = "Email atau password salah. Periksa kembali dan coba lagi.";
                } else if (msg.toLowerCase().includes("disabled") || msg.toLowerCase().includes("dinonaktifkan")) {
                    msg = "Akun Anda telah dinonaktifkan. Hubungi Admin.";
                } else if (msg.toLowerCase().includes("server") || msg.toLowerCase().includes("terhubung")) {
                    msg = "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.";
                }
                showLocalToast(msg, "error");
            }
        });
    }

    // Toggle Password Visibility
    const togglePassBtn = document.getElementById("toggle-password-btn");
    if (togglePassBtn) {
        togglePassBtn.addEventListener("click", () => {
            const type = loginPassword.getAttribute("type") === "password" ? "text" : "password";
            loginPassword.setAttribute("type", type);
            const eyeIcon = document.getElementById("eye-icon");
            if (type === "text") {
                eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
            } else {
                eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
            }
        });
    }

    // Contact Admin Dialog popup
    const contactAdminBtn = document.getElementById("contact-admin-btn");
    const contactAdminModal = document.getElementById("contact-admin-modal");
    if (contactAdminBtn && contactAdminModal) {
        contactAdminBtn.addEventListener("click", (e) => {
            e.preventDefault();
            contactAdminModal.classList.remove("hidden");
        });
        document.getElementById("close-contact-admin-btn").addEventListener("click", () => {
            contactAdminModal.classList.add("hidden");
        });
    }
});
