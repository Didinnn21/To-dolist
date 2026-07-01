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

        const npwpInput = document.getElementById("settings-npwp-input");
        if (npwpInput) npwpInput.value = user.npwp || "";

        const bankAccountInput = document.getElementById("settings-bank-account-input");
        if (bankAccountInput) bankAccountInput.value = user.bank_account || "";

        const portfolioInput = document.getElementById("settings-portfolio-input");
        if (portfolioInput) portfolioInput.value = user.portfolio_url || "";

        const genderSelect = document.getElementById("settings-gender-select");
        if (genderSelect) genderSelect.value = user.gender || "";

        const addressTextarea = document.getElementById("settings-address-textarea");
        if (addressTextarea) addressTextarea.value = user.address || "";

        const cvFileInfo = document.getElementById("cv-file-info");
        const cvPreviewContainer = document.getElementById("cv-preview-container");
        const cvPreviewLink = document.getElementById("cv-preview-link");

        if (user.cv_url) {
            if (cvFileInfo) {
                const fileName = user.cv_url.split('/').pop();
                cvFileInfo.textContent = decodeURIComponent(fileName);
            }
            if (cvPreviewContainer) cvPreviewContainer.style.display = "block";
            if (cvPreviewLink) cvPreviewLink.href = user.cv_url;
        } else {
            if (cvFileInfo) cvFileInfo.textContent = "Belum ada file diunggah";
            if (cvPreviewContainer) cvPreviewContainer.style.display = "none";
        }

        const ktpFileInfo = document.getElementById("ktp-file-info");
        const ktpPreviewContainer = document.getElementById("ktp-preview-container");
        const ktpPreviewLink = document.getElementById("ktp-preview-link");

        if (user.ktp_url) {
            if (ktpFileInfo) {
                const fileName = user.ktp_url.split('/').pop();
                ktpFileInfo.textContent = decodeURIComponent(fileName);
            }
            if (ktpPreviewContainer) ktpPreviewContainer.style.display = "block";
            if (ktpPreviewLink) ktpPreviewLink.href = user.ktp_url;
        } else {
            if (ktpFileInfo) ktpFileInfo.textContent = "Belum ada file diunggah";
            if (ktpPreviewContainer) ktpPreviewContainer.style.display = "none";
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

    // CV Upload Logic
    const cvFileInput = document.getElementById("cv-file-input");
    const cvFileInfo = document.getElementById("cv-file-info");
    const cvPreviewContainer = document.getElementById("cv-preview-container");
    const cvPreviewLink = document.getElementById("cv-preview-link");
    let uploadedCvUrl = Auth.currentUser ? Auth.currentUser.cv_url || "" : "";

    if (cvFileInput) {
        cvFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    if (window.showToast) window.showToast("Ukuran file terlalu besar! Maksimal 10MB.", "error");
                    else alert("Ukuran file terlalu besar! Maksimal 10MB.");
                    return;
                }

                if (cvFileInfo) cvFileInfo.textContent = "Mengunggah...";

                try {
                    const uploaded = await DB.uploadFiles([file]);
                    if (uploaded && uploaded.length > 0) {
                        uploadedCvUrl = uploaded[0].url;
                        if (cvFileInfo) cvFileInfo.textContent = file.name;
                        if (cvPreviewContainer) cvPreviewContainer.style.display = "block";
                        if (cvPreviewLink) cvPreviewLink.href = uploadedCvUrl;
                        if (window.showToast) window.showToast("CV berhasil diunggah! Silakan klik 'Simpan Perubahan Profil' untuk menyimpan data.", "success");
                    } else {
                        if (cvFileInfo) cvFileInfo.textContent = "Gagal mengunggah file";
                        if (window.showToast) window.showToast("Gagal mengunggah CV.", "error");
                    }
                } catch (err) {
                    console.error("Gagal unggah CV:", err);
                    if (cvFileInfo) cvFileInfo.textContent = "Error";
                    if (window.showToast) window.showToast("Gagal mengunggah CV: " + err.message, "error");
                }
            }
        });
    }

    // KTP Upload Logic
    const ktpFileInput = document.getElementById("ktp-file-input");
    const ktpFileInfo = document.getElementById("ktp-file-info");
    const ktpPreviewContainer = document.getElementById("ktp-preview-container");
    const ktpPreviewLink = document.getElementById("ktp-preview-link");
    let uploadedKtpUrl = Auth.currentUser ? Auth.currentUser.ktp_url || "" : "";

    if (ktpFileInput) {
        ktpFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    if (window.showToast) window.showToast("Ukuran file terlalu besar! Maksimal 10MB.", "error");
                    else alert("Ukuran file terlalu besar! Maksimal 10MB.");
                    return;
                }

                if (ktpFileInfo) ktpFileInfo.textContent = "Mengunggah...";

                try {
                    const uploaded = await DB.uploadFiles([file]);
                    if (uploaded && uploaded.length > 0) {
                        uploadedKtpUrl = uploaded[0].url;
                        if (ktpFileInfo) ktpFileInfo.textContent = file.name;
                        if (ktpPreviewContainer) ktpPreviewContainer.style.display = "block";
                        if (ktpPreviewLink) ktpPreviewLink.href = uploadedKtpUrl;
                        if (window.showToast) window.showToast("Foto KTP berhasil diunggah! Silakan klik 'Simpan Perubahan Profil' untuk menyimpan data.", "success");
                    } else {
                        if (ktpFileInfo) ktpFileInfo.textContent = "Gagal mengunggah file";
                        if (window.showToast) window.showToast("Gagal mengunggah Foto KTP.", "error");
                    }
                } catch (err) {
                    console.error("Gagal unggah KTP:", err);
                    if (ktpFileInfo) ktpFileInfo.textContent = "Error";
                    if (window.showToast) window.showToast("Gagal mengunggah Foto KTP: " + err.message, "error");
                }
            }
        });
    }

    // Save Profile Logic
    const btnSaveProfile = document.getElementById("btn-save-profile");
    const nameInput = document.getElementById("settings-name-input");
    const npwpInput = document.getElementById("settings-npwp-input");
    const bankAccountInput = document.getElementById("settings-bank-account-input");
    const portfolioInput = document.getElementById("settings-portfolio-input");
    const genderSelect = document.getElementById("settings-gender-select");
    const addressTextarea = document.getElementById("settings-address-textarea");

    if (btnSaveProfile && nameInput) {
        btnSaveProfile.addEventListener("click", async () => {
            const newName = nameInput.value.trim();
            const newNpwp = npwpInput ? npwpInput.value.trim() : "";
            const newBankAccount = bankAccountInput ? bankAccountInput.value.trim() : "";
            const newPortfolio = portfolioInput ? portfolioInput.value.trim() : "";
            const newGender = genderSelect ? genderSelect.value : "";
            const newAddress = addressTextarea ? addressTextarea.value.trim() : "";

            if (!newName) {
                if (window.showToast) window.showToast("Nama tidak boleh kosong!", "error");
                else alert("Nama tidak boleh kosong!");
                return;
            }

            btnSaveProfile.innerText = "Menyimpan...";
            btnSaveProfile.disabled = true;

            try {
                const currentUser = Auth.currentUser;
                if (currentUser) {
                    const profileData = {
                        name: newName,
                        npwp: newNpwp,
                        bank_account: newBankAccount,
                        portfolio_url: newPortfolio,
                        gender: newGender,
                        address: newAddress,
                        cv_url: uploadedCvUrl,
                        ktp_url: uploadedKtpUrl
                    };

                    const updatedUser = await DB.updateUserProfile(currentUser.id, profileData);
                    
                    // Sync Auth.currentUser and cache
                    Object.assign(currentUser, updatedUser);
                    localStorage.setItem("dzhirasena_user_cache", JSON.stringify(currentUser));

                    // Update UI elements
                    const nameText = document.getElementById("settings-name");
                    if (nameText) nameText.textContent = currentUser.name;

                    const sidebarName = document.querySelector(".profile-info h4");
                    if (sidebarName) sidebarName.textContent = currentUser.name;

                    const dropdownName = document.querySelector("#profile-dropdown strong");
                    if (dropdownName) dropdownName.textContent = currentUser.name;

                    if (window.showToast) window.showToast("Profil berhasil diperbarui!", "success");
                }
            } catch (err) {
                console.error("Gagal memperbarui profil:", err);
                if (window.showToast) window.showToast("Gagal memperbarui profil: " + err.message, "error");
            } finally {
                btnSaveProfile.innerText = "Simpan Perubahan Profil";
                btnSaveProfile.disabled = false;
            }
        });

        const handleEnterKey = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                btnSaveProfile.click();
            }
        };
        nameInput.addEventListener("keydown", handleEnterKey);
        if (npwpInput) npwpInput.addEventListener("keydown", handleEnterKey);
        if (bankAccountInput) bankAccountInput.addEventListener("keydown", handleEnterKey);
        if (portfolioInput) portfolioInput.addEventListener("keydown", handleEnterKey);
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
