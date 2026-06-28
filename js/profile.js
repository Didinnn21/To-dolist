// ==========================================================================
// DZHIRASENA - USER PROFILE SETTINGS LOGIC
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize DB & Layout Layout
    await DB.init();
    if (!Auth.currentUser) return;
    Layout.init();

    // Render profile stats and settings
    const renderProfileSettings = () => {
        const user = Auth.currentUser;
        if (!user) return;

        const avatarImg = document.getElementById("settings-avatar-img");
        const nameText = document.getElementById("settings-name");
        const emailText = document.getElementById("settings-email");
        const roleBadge = document.getElementById("settings-role-badge");

        if (avatarImg) avatarImg.src = user.avatar;
        if (nameText) nameText.textContent = user.name;
        const nameInput = document.getElementById("settings-name-input");
        if (nameInput) nameInput.value = user.name;
        if (emailText) emailText.textContent = user.email;
        if (roleBadge) {
            roleBadge.textContent = user.role;
            // Clear prior role class names
            roleBadge.className = "role-badge";
            if (user.role === "Admin") roleBadge.classList.add("role-admin");
            else if (user.role === "Project Manager") roleBadge.classList.add("role-pm");
            else roleBadge.classList.add("role-staff");
        }
    };

    // Change Avatar logic
    const fileInput = document.getElementById("avatar-file-input");
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                // Check size (e.g. limit to 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    if (typeof Layout !== 'undefined' && typeof Layout.showToast === 'function') {
                        Layout.showToast("Ukuran gambar terlalu besar! Maksimal 2MB.", "error");
                    } else {
                        alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
                    }
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64Url = event.target.result;
                    const currentUser = Auth.currentUser;
                    if (currentUser) {
                        currentUser.avatar = base64Url;
                        await DB.updateUserAvatar(currentUser.id, base64Url);
                        // Auth.currentUser dan cache sudah diupdate oleh DB.updateUserAvatar
                        localStorage.setItem("dzhirasena_user_cache", JSON.stringify(currentUser));

                        const avatarImg = document.getElementById("settings-avatar-img");
                        if (avatarImg) avatarImg.src = base64Url;

                        // Re-initialize layout sidebar/header avatars
                        Layout.init();

                        if (typeof Layout !== 'undefined' && typeof Layout.showToast === 'function') {
                            Layout.showToast("Avatar berhasil diperbarui!", "success");
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Save Name logic
    const btnSaveName = document.getElementById("btn-save-name");
    const nameInput = document.getElementById("settings-name-input");
    if (btnSaveName && nameInput) {
        btnSaveName.addEventListener("click", async () => {
            const newName = nameInput.value.trim();
            if (!newName) {
                if (window.showToast) {
                    window.showToast("Nama tidak boleh kosong!", "error");
                } else {
                    alert("Nama tidak boleh kosong!");
                }
                return;
            }

            const currentUser = Auth.currentUser;
            if (currentUser) {
                currentUser.name = newName;
                await DB.updateUserName(currentUser.id, newName);
                // Update cache dengan key yang benar
                localStorage.setItem("dzhirasena_user_cache", JSON.stringify(currentUser));

                // Update UI text labels in real-time
                const nameText = document.getElementById("settings-name");
                if (nameText) nameText.textContent = newName;

                const sidebarName = document.querySelector(".profile-info h4");
                if (sidebarName) sidebarName.textContent = newName;

                const dropdownName = document.querySelector("#profile-dropdown strong");
                if (dropdownName) dropdownName.textContent = newName;

                if (window.showToast) {
                    window.showToast("Nama berhasil diperbarui!", "success");
                }
            }
        });

        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                btnSaveName.click();
            }
        });
    }

    // Toggle Password Visibility
    const togglePasswordBtn = document.getElementById("toggle-password-visibility");
    const passwordInput = document.getElementById("settings-password-input");
    const iconShow = document.getElementById("icon-show-password");
    const iconHide = document.getElementById("icon-hide-password");

    if (togglePasswordBtn && passwordInput && iconShow && iconHide) {
        togglePasswordBtn.addEventListener("click", () => {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                iconShow.style.display = "none";
                iconHide.style.display = "block";
            } else {
                passwordInput.type = "password";
                iconShow.style.display = "block";
                iconHide.style.display = "none";
            }
        });
    }

    // Save Password logic
    const btnSavePassword = document.getElementById("btn-save-password");
    // passwordInput already defined above
    if (btnSavePassword && passwordInput) {
        btnSavePassword.addEventListener("click", async () => {
            const newPassword = passwordInput.value;
            if (newPassword.length < 6) {
                if (window.showToast) window.showToast("Kata sandi minimal 6 karakter!", "error");
                else alert("Kata sandi minimal 6 karakter!");
                return;
            }

            btnSavePassword.innerText = "Memperbarui...";
            btnSavePassword.disabled = true;

            try {
                const currentUser = Auth.currentUser;
                await DB.updateUserPassword(currentUser.id, newPassword);
                if (window.showToast) window.showToast("Kata sandi berhasil diperbarui!", "success");
                passwordInput.value = "";
            } catch (err) {
                const msg = err.message || "Gagal memperbarui kata sandi.";
                if (window.showToast) window.showToast("Gagal memperbarui sandi: " + msg, "error");
                else alert("Gagal memperbarui sandi: " + msg);
            } finally {
                btnSavePassword.innerText = "Perbarui Sandi";
                btnSavePassword.disabled = false;
            }
        });

        passwordInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                btnSavePassword.click();
            }
        });
    }

    // Language selector logic
    const langSelect = document.getElementById("settings-lang-select");
    if (langSelect) {
        const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
        langSelect.value = savedLang;

        langSelect.addEventListener("change", (e) => {
            const selectedLang = e.target.value;
            localStorage.setItem("dzhirasena_lang", selectedLang);
            window.location.reload();
        });
    }

    // Theme selector logic
    const themeSelect = document.getElementById("settings-theme-select");
    if (themeSelect) {
        const savedTheme = localStorage.getItem("dzhirasena_theme") || "light";
        themeSelect.value = savedTheme;

        themeSelect.addEventListener("change", (e) => {
            const selectedTheme = e.target.value;
            localStorage.setItem("dzhirasena_theme", selectedTheme);
            if (selectedTheme === "dark") {
                document.body.classList.add("dark-theme");
            } else {
                document.body.classList.remove("dark-theme");
            }
            window.showToast("Tema tampilan berhasil diperbarui!", "success");
        });
    }

    // Logout trigger (Mobile specific action button)
    const btnLogoutMobile = document.getElementById("btn-logout-mobile");
    if (btnLogoutMobile) {
        btnLogoutMobile.addEventListener("click", (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    // Render settings
    renderProfileSettings();
});
