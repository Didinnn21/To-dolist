// ==========================================================================
// DZHIRASENA - TEAM MANAGEMENT LOGIC (ADMIN ONLY)
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize DB & Layout Layout
    await DB.init();
    if (!Auth.currentUser) return;
    Layout.init();

    const userTableBody = document.getElementById("user-table-body");

    window.renderTeamManagement = () => {
        if (!userTableBody) return;

        // User stats computations
        const totalUsers = DB.users.length;
        const activeUsers = DB.users.filter(u => u.status === "Active").length;
        const adminCount = DB.users.filter(u => u.role === "Admin" || u.role === "Project Manager").length;

        const statTotal = document.getElementById("stat-total-users");
        const statActive = document.getElementById("stat-active-users");
        const statAdmin = document.getElementById("stat-admin-users");

        if (statTotal) statTotal.textContent = totalUsers;
        if (statActive) statActive.textContent = activeUsers;
        if (statAdmin) statAdmin.textContent = adminCount;

        let rowsHtml = "";

        DB.users.forEach(u => {
            const roleClass = u.role === "Admin" ? "role-admin" : (u.role === "Project Manager" ? "role-pm" : "role-staff");
            const statusClass = u.status === "Active" ? "status-active" : "status-inactive";
            const isActiveChecked = u.status === "Active" ? "checked" : "";
            const isSelf = u.id === Auth.currentUser.id;

            rowsHtml += `
                <tr data-user-id="${u.id}">
                    <td>
                        <div class="table-user-info">
                            <img src="${u.avatar}" alt="${u.name}" class="table-user-avatar">
                            <div class="table-user-meta">
                                <span class="table-user-name">${u.name} ${isSelf ? '<strong>(Anda)</strong>' : ''}</span>
                                <span class="table-user-email">${u.email}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="role-badge ${roleClass}">${u.role}</span>
                    </td>
                    <td>
                        <div class="status-row-indicator ${statusClass}">
                            <label class="switch">
                                <input type="checkbox" ${isActiveChecked} ${isSelf ? 'disabled' : ''} class="user-status-toggle" data-user-id="${u.id}">
                                <span class="slider"></span>
                            </label>
                            <span>${u.status}</span>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="action-btn-primary btn-edit-user" data-user-id="${u.id}" title="Edit User">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="action-btn-danger btn-delete-user" ${isSelf ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} data-user-id="${u.id}" title="Hapus User">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        userTableBody.innerHTML = rowsHtml;

        const lang = localStorage.getItem("dzhirasena_lang") || "id";
        if (window.Layout && window.Layout.applyTranslation) {
            window.Layout.applyTranslation(lang, userTableBody);
        }
    };

    // Toggle User active state
    async function toggleUserStatus(userId) {
        if (userId === Auth.currentUser.id) return;

        const user = DB.users.find(u => u.id === userId);
        if (!user) return;

        const nextStatus = user.status === "Active" ? "Inactive" : "Active";
        await DB.updateUserStatus(userId, nextStatus);

        renderTeamManagement();
        Layout.hydrateAssigneeDropdowns();
        window.showToast(`Status pengguna "${user.name}" diubah menjadi ${nextStatus}.`, "success");
    }

    // Delete User
    async function deleteUser(userId) {
        if (userId === Auth.currentUser.id) return;

        if (confirm("Apakah Anda yakin ingin menghapus pengguna ini? Semua tugas yang ditugaskan kepada mereka akan tetap ada namun ditandai sebagai pemilik yang dihapus.")) {
            await DB.deleteUser(userId);
            renderTeamManagement();
            Layout.hydrateAssigneeDropdowns();
            window.showToast("Pengguna berhasil dihapus dari sistem.", "success");
        }
    }

    // Add status toggle and delete event delegation on table body
    if (userTableBody) {
        userTableBody.addEventListener("change", (e) => {
            const toggle = e.target.closest(".user-status-toggle");
            if (toggle) {
                const userId = toggle.getAttribute("data-user-id");
                if (userId) {
                    toggleUserStatus(userId);
                }
            }
        });

        userTableBody.addEventListener("click", (e) => {
            const deleteBtn = e.target.closest(".btn-delete-user");
            if (deleteBtn) {
                e.stopPropagation();
                const userId = deleteBtn.getAttribute("data-user-id");
                if (userId) {
                    deleteUser(userId);
                }
                return;
            }

            const editBtn = e.target.closest(".btn-edit-user");
            if (editBtn) {
                e.stopPropagation();
                const userId = editBtn.getAttribute("data-user-id");
                if (userId) {
                    showEditUserModal(userId);
                }
                return;
            }

            // Ignore status toggle triggers
            if (e.target.closest(".user-status-toggle") || e.target.closest(".switch") || e.target.closest(".slider")) {
                return;
            }

            const row = e.target.closest("tr");
            if (row) {
                const userId = row.getAttribute("data-user-id");
                if (userId) {
                    showUserDetailModal(userId);
                }
            }
        });
    }

    // Append User Detail Modal HTML to body dynamically
    const createDetailModal = () => {
        if (document.getElementById("user-detail-modal")) return;

        const modalDiv = document.createElement("div");
        modalDiv.id = "user-detail-modal";
        modalDiv.className = "modal-overlay hidden";
        modalDiv.innerHTML = `
            <div class="modal-content" style="max-width: 580px;">
                <div class="modal-header">
                    <h3>Detail Pengguna</h3>
                    <button class="modal-close-btn" id="close-user-detail-modal">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div style="padding: 24px;">
                    <!-- Profile Section -->
                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
                        <img id="detail-user-avatar" src="" alt="Avatar" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
                        <div>
                            <h4 id="detail-user-name" style="font-size: 18px; font-weight: 700; margin: 0 0 4px 0;"></h4>
                            <p id="detail-user-email" style="color: var(--text-muted); margin: 0 0 8px 0; font-size: 13px;"></p>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span id="detail-user-role" class="role-badge"></span>
                                <span id="detail-user-status" style="font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 12px;"></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tasks Section -->
                    <div>
                        <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--text-dark);">Tugas yang Ditugaskan</h4>
                        <div id="detail-user-tasks-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 220px; overflow-y: auto; padding-right: 4px;">
                            <!-- Hydrated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="btn-close-detail-modal">Tutup</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);

        // Attach close listeners
        const closeModal = () => modalDiv.classList.add("hidden");
        document.getElementById("close-user-detail-modal").addEventListener("click", closeModal);
        document.getElementById("btn-close-detail-modal").addEventListener("click", closeModal);
    };

    function showUserDetailModal(userId) {
        createDetailModal();

        const user = DB.users.find(u => u.id === userId);
        if (!user) return;

        // Set profile info
        document.getElementById("detail-user-avatar").src = user.avatar;
        document.getElementById("detail-user-name").textContent = user.name;
        document.getElementById("detail-user-email").textContent = user.email;

        // Set Role Badge class & text
        const roleBadge = document.getElementById("detail-user-role");
        roleBadge.textContent = user.role;
        roleBadge.className = "role-badge";
        if (user.role === "Admin") roleBadge.classList.add("role-admin");
        else if (user.role === "Project Manager") roleBadge.classList.add("role-pm");
        else roleBadge.classList.add("role-staff");

        // Set Status Text & style
        const statusText = document.getElementById("detail-user-status");
        statusText.textContent = user.status;
        if (user.status === "Active") {
            statusText.style.backgroundColor = "var(--success-bg)";
            statusText.style.color = "var(--success)";
        } else {
            statusText.style.backgroundColor = "#F1F5F9";
            statusText.style.color = "var(--text-muted)";
        }

        // Hydrate Tasks
        const tasksList = document.getElementById("detail-user-tasks-list");
        const userTasks = DB.tasks.filter(t => {
            const assigned = t.assignedTo;
            if (Array.isArray(assigned)) return assigned.includes(userId);
            return assigned === userId;
        });


        if (userTasks.length === 0) {
            tasksList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 20px 0;">Belum ada tugas yang ditugaskan kepada karyawan ini.</p>`;
        } else {
            tasksList.innerHTML = userTasks.map(t => {
                const prioClass = t.priority === "Tinggi" ? "tag-prio-tinggi" : (t.priority === "Sedang" ? "tag-prio-sedang" : "tag-prio-rendah");
                const statusColor = t.status === "Completed" ? "var(--success)" : "var(--primary-color)";
                const statusBg = t.status === "Completed" ? "var(--success-bg)" : "var(--primary-light)";

                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); background: #F8FAFC;">
                        <div style="min-width: 0; flex: 1; margin-right: 12px;">
                            <h5 style="font-size: 13px; font-weight: 600; margin: 0 0 4px 0; word-break: break-word; color: var(--text-dark);">${t.title}</h5>
                            <span style="font-size: 11px; color: var(--text-muted);">Deadline: ${formatDate(t.deadline)}</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="tag ${prioClass}">${t.priority}</span>
                            <span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 12px; background: ${statusBg}; color: ${statusColor};">${t.status === 'Completed' ? 'Selesai' : 'Berjalan'}</span>
                        </div>
                    </div>
                `;
            }).join("");
        }

        const lang = localStorage.getItem("dzhirasena_lang") || "id";
        if (window.Layout && window.Layout.applyTranslation) {
            window.Layout.applyTranslation(lang, tasksList);
        }

        // Show Modal
        document.getElementById("user-detail-modal").classList.remove("hidden");
    }

    function formatDate(dateStr) {
        if (!dateStr) return "";
        const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
        const isEn = savedLang === "en";
        const monthsId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const months = isEn ? monthsEn : monthsId;
        const d = new Date(dateStr);
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    function showEditUserModal(userId) {
        const user = DB.users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById("edit-user-id").value = user.id;
        document.getElementById("edit-user-name").value = user.name;
        document.getElementById("edit-user-role").value = user.role;

        document.getElementById("edit-user-modal").classList.remove("hidden");
    }

    const closeEditModalBtn = document.getElementById("btn-close-edit-user");
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener("click", () => {
            document.getElementById("edit-user-modal").classList.add("hidden");
        });
    }

    // Close edit user modal juga jika klik di luar modal-content
    const editUserModal = document.getElementById("edit-user-modal");
    if (editUserModal) {
        editUserModal.addEventListener("click", (e) => {
            if (e.target === editUserModal) {
                editUserModal.classList.add("hidden");
            }
        });
    }

    const editUserForm = document.getElementById("edit-user-form");
    if (editUserForm) {
        editUserForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const userId = document.getElementById("edit-user-id").value;
            const newName = document.getElementById("edit-user-name").value;
            const newRole = document.getElementById("edit-user-role").value;

            if (!userId || !newName || !newRole) return;

            const submitBtn = editUserForm.querySelector("button[type='submit']");
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Menyimpan...";
            submitBtn.disabled = true;

            try {
                await DB.updateUserRoleAndName(userId, newName, newRole);
                document.getElementById("edit-user-modal").classList.add("hidden");
                renderTeamManagement();
                if (window.showToast) window.showToast("Data pengguna berhasil diperbarui!", "success");
            } catch (err) {
                if (window.showToast) window.showToast("Gagal memperbarui pengguna", "error");
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    window.renderCategoriesList = () => {
        const listContainer = document.getElementById("category-list");
        if (!listContainer) return;

        const categories = DB.categories || [];
        if (categories.length === 0) {
            listContainer.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 20px 0;">Belum ada kategori.</p>`;
            return;
        }

        listContainer.innerHTML = categories.map(c => `
            <div class="category-item" data-cat-id="${c.id}">
                <span>${c.name}</span>
                <button class="category-item-delete" data-cat-id="${c.id}" title="Hapus Kategori">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `).join("");

        const lang = localStorage.getItem("dzhirasena_lang") || "id";
        if (window.Layout && window.Layout.applyTranslation) {
            window.Layout.applyTranslation(lang, listContainer);
        }
    };

    // Category Forms submit handler
    const addCategoryForm = document.getElementById("add-category-form");
    if (addCategoryForm) {
        addCategoryForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const inputName = document.getElementById("new-category-name");
            const name = inputName.value.trim();
            if (!name) return;

            // Duplicate validation check
            const exists = DB.categories.some(c => c.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                window.showToast("Kategori tersebut sudah terdaftar!", "error");
                return;
            }

            const newCategory = {
                id: `cat-${Date.now()}`,
                name
            };

            await DB.addCategory(newCategory);
            inputName.value = "";

            renderCategoriesList();
            Layout.hydrateCategoryDropdowns();
            window.showToast(`Kategori "${name}" berhasil ditambahkan!`, "success");
        });
    }

    // Category List click event delegation (for delete button)
    const categoryList = document.getElementById("category-list");
    if (categoryList) {
        categoryList.addEventListener("click", async (e) => {
            const deleteBtn = e.target.closest(".category-item-delete");
            if (deleteBtn) {
                e.stopPropagation();
                const catId = deleteBtn.getAttribute("data-cat-id");
                const cat = DB.categories.find(c => c.id === catId);
                if (!cat) return;

                if (confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.name}"? Tugas yang menggunakan kategori ini tidak akan otomatis terhapus.`)) {
                    await DB.deleteCategory(catId);
                    renderCategoriesList();
                    Layout.hydrateCategoryDropdowns();
                    window.showToast(`Kategori "${cat.name}" berhasil dihapus.`, "success");
                }
            }
        });
    }

    // Render team user list and categories
    renderTeamManagement();
    renderCategoriesList();
});
