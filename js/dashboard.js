// ==========================================================================
// DZHIRASENA - DASHBOARD LOGIC (ADMIN & USER SHARED LOGIC) v3.0
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize DB & Layout
    await DB.init();
    if (!Auth.currentUser) return;
    Layout.init();

    // 2. Local State variables
    const taskFilterCategory = document.getElementById("task-filter-category");
    const filterSortBtn = document.getElementById("filter-sort-btn");
    const addTaskForm = document.getElementById("add-task-form");

    const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
    const isAtasan = Auth.currentUser.role === "Atasan";
    
    if (isAtasan) {
        const addTaskCard = document.querySelector(".add-task-card");
        if (addTaskCard) addTaskCard.style.display = "none";
    }

    // Set Dashboard title dynamically
    const dashboardTitle = document.querySelector(".view-title");
    if (dashboardTitle) {
        if (isAtasan) {
            dashboardTitle.textContent = "Dashboard Kerja (Atasan)";
        } else if (isAdmin) {
            dashboardTitle.textContent = "Dashboard Kerja (Admin)";
        }
    }

    // Set Default deadline value
    const deadlineInput = document.getElementById("task-deadline");
    if (deadlineInput) {
        deadlineInput.value = new Date().toISOString().split('T')[0];
    }

    // Toggle Jurnal fields for desktop add task form
    const taskCatInput = document.getElementById("task-category");
    const journalFields = document.getElementById("journal-fields");
    if (taskCatInput && journalFields) {
        const toggleFields = () => {
            if (taskCatInput.value && taskCatInput.value.toLowerCase() === "jurnal") {
                journalFields.classList.remove("hidden");
            } else {
                journalFields.classList.add("hidden");
                const u = document.getElementById("task-username");
                const p = document.getElementById("task-password");
                if (u) u.value = "";
                if (p) p.value = "";
            }
        };
        taskCatInput.addEventListener("input", toggleFields);
        taskCatInput.addEventListener("change", toggleFields);
    }

    // Render operations
    window.renderDashboardTasks = () => {
        const listContainer = document.getElementById("dashboard-task-list");
        if (!listContainer) return;

        const catFilter = taskFilterCategory ? taskFilterCategory.value : "all";
        let filteredTasks = [...DB.tasks];

        // RBAC Check: Employees only see their own tasks (single assignee)
        if (!isAdmin && !isAtasan) {
            filteredTasks = filteredTasks.filter(t => {
                const assignee = typeof t.assignedTo === 'string' ? t.assignedTo : (Array.isArray(t.assignedTo) ? t.assignedTo[0] : '');
                return assignee === Auth.currentUser.id;
            });
        }

        // Apply Category Filter
        if (catFilter !== "all") {
            filteredTasks = filteredTasks.filter(t => t.category === catFilter);
        }

        // Sort by Date (newest first by default)
        filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (filteredTasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state-card" style="padding: 30px; margin: 10px auto; max-width: 100%;">
                    <p>Tidak ada aktivitas tugas yang cocok.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filteredTasks.map(createTaskCardHtml).join("");

        // Translate dynamically inserted content
        const lang = localStorage.getItem("dzhirasena_lang") || "id";
        if (window.Layout && window.Layout.applyTranslation) {
            window.Layout.applyTranslation(lang, listContainer);
        }
    };

    window.updateStats = () => {
        let filteredTasks = [...DB.tasks];

        // RBAC Check: Employees only compute stats for themselves (single assignee)
        if (!isAdmin && !isAtasan) {
            filteredTasks = filteredTasks.filter(t => {
                const assignee = typeof t.assignedTo === 'string' ? t.assignedTo : (Array.isArray(t.assignedTo) ? t.assignedTo[0] : '');
                return assignee === Auth.currentUser.id;
            });
        }

        const total = filteredTasks.length;
        const running = filteredTasks.filter(t => t.status === "In Progress").length;
        const completed = filteredTasks.filter(t => t.status === "Completed").length;
        const overdue = filteredTasks.filter(t => {
            const today = new Date().toISOString().split('T')[0];
            return t.status !== "Completed" && t.deadline < today;
        }).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Update UI stats elements
        const statTotal = document.getElementById("stat-total-tasks");
        const statRunning = document.getElementById("stat-running-tasks");
        const statCompleted = document.getElementById("stat-completed-tasks");
        const percentageBadge = document.getElementById("completed-percentage-badge");

        if (statTotal) statTotal.textContent = total;
        if (statRunning) statRunning.textContent = running;
        if (statCompleted) statCompleted.textContent = completed;
        if (percentageBadge) percentageBadge.textContent = `${percentage}%`;

        // Update Weekly Progress elements
        const weeklyBar = document.getElementById("weekly-progress-bar");
        const weeklyPercent = document.getElementById("weekly-progress-percent");
        const weeklyCompletedCount = document.getElementById("weekly-completed-count");

        if (weeklyBar) weeklyBar.style.width = `${percentage}%`;
        if (weeklyPercent) weeklyPercent.textContent = `${percentage}%`;
        if (weeklyCompletedCount) weeklyCompletedCount.textContent = completed;

        // Update mini progress bars on metric cards
        const miniBarTotal = document.getElementById("mini-bar-total");
        const miniBarRunning = document.getElementById("mini-bar-running");
        const miniBarCompleted = document.getElementById("mini-bar-completed");

        if (miniBarTotal) miniBarTotal.style.width = total > 0 ? "100%" : "0%";
        if (miniBarRunning) miniBarRunning.style.width = total > 0 ? `${Math.round((running / total) * 100)}%` : "0%";
        if (miniBarCompleted) miniBarCompleted.style.width = `${percentage}%`;

        // Update overdue badge
        const overdueEl = document.getElementById("stat-overdue-count");
        if (overdueEl) overdueEl.textContent = overdue;

        // Store for modal
        window._dashStats = { total, running, completed, overdue, percentage, filteredTasks };

        // Render team workload widget if visible
        renderTeamWorkload();
    };

    function renderTeamWorkload() {
        const listContainer = document.getElementById("team-workload-list");
        if (!listContainer) return;

        const employees = DB.users.filter(u => u.role !== "Admin" && u.role !== "Project Manager" && u.role !== "Atasan");

        let workloadHtml = "";
        if (employees.length === 0) {
            workloadHtml = `
                <div style="text-align: center; color: var(--text-tertiary); font-size: 0.8125rem; padding: 16px 0;">
                    Tidak ada anggota tim.
                </div>
            `;
        } else {
            employees.forEach((u, index) => {
                const userTasks = DB.tasks.filter(t => {
                    const assignee = typeof t.assignedTo === 'string' ? t.assignedTo : (Array.isArray(t.assignedTo) ? t.assignedTo[0] : '');
                    return assignee === u.id;
                });
                const activeCount = userTasks.filter(t => t.status === "In Progress").length;
                const completedCount = userTasks.filter(t => t.status === "Completed").length;

                workloadHtml += `
                    <div class="team-workload-item">
                        <div class="team-workload-user-info">
                            <img class="team-workload-avatar" src="${u.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'}" alt="${u.name}">
                            <div class="team-workload-meta">
                                <span class="team-workload-name">${u.name}</span>
                                <span class="team-workload-role">${u.role}</span>
                            </div>
                        </div>
                        <div class="team-workload-badges">
                            <span class="workload-badge active" title="Tugas Berjalan">${activeCount} Berjalan</span>
                            <span class="workload-badge completed" title="Tugas Selesai">${completedCount} Selesai</span>
                        </div>
                    </div>
                `;
            });
        }
        listContainer.innerHTML = workloadHtml;

        // Translate dynamically inserted content
        const lang = localStorage.getItem("dzhirasena_lang") || "id";
        if (window.Layout && window.Layout.applyTranslation) {
            window.Layout.applyTranslation(lang, listContainer);
        }
    }


    // Helper: Build single assignee avatar
    function buildAssigneeAvatar(assignedTo) {
        const assigneeId = typeof assignedTo === 'string' ? assignedTo : (Array.isArray(assignedTo) ? assignedTo[0] : '');
        const user = DB.users.find(u => u.id === assigneeId) || { name: 'Tidak Dikenal', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' };
        return `<div class="assignee-avatar" title="${user.name}"><img src="${user.avatar}" alt="${user.name}"></div>`;
    }

    // Helper functions
    function createTaskCardHtml(task) {
        const { description: cleanDesc, username, password } = DB.parseJournalCredentials(task.description);
        const assigneeId = typeof task.assignedTo === 'string' ? task.assignedTo : (Array.isArray(task.assignedTo) ? task.assignedTo[0] : '');
        const assignee = DB.users.find(u => u.id === assigneeId) || { name: "Tidak Dikenal", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" };
        const priorityClass = task.priority.toLowerCase();
        const isCompleted = task.status === "Completed" ? "completed" : "";

        let deadlineLabelClass = "";
        let deadlineLabelText = formatDate(task.deadline);

        if (task.status !== "Completed") {
            const todayStr = new Date().toISOString().split('T')[0];
            if (task.deadline < todayStr) {
                deadlineLabelClass = "text-danger font-bold";
                deadlineLabelText = `Terlewat: ${formatDate(task.deadline)}`;
            } else if (task.deadline === todayStr) {
                deadlineLabelClass = "text-warning font-bold";
                deadlineLabelText = "Hari ini";
            }
        } else {
            deadlineLabelText = "Selesai";
        }

        const isTaskCompleted = task.status === "Completed" || task.status === "Paid";
        const canEdit = isAdmin || (task.createdBy === Auth.currentUser.id && !isTaskCompleted);
        const canDelete = isAdmin || task.createdBy === Auth.currentUser.id;
        const progressCount = (task.progressUpdates || []).length;
        const attachCount = (task.attachments || []).length;
        // Hanya assignee yang bisa mencentang tugas sebagai selesai
        const isAssignee = Auth.currentUser.id === assigneeId;
        const canComplete = isAssignee && !isTaskCompleted;
        const checkBtnStyle = (!isAssignee && !isTaskCompleted) 
            ? 'opacity: 0.35; cursor: not-allowed; pointer-events: none; title="Hanya penanggungjawab yang dapat menyelesaikan tugas"' 
            : '';

        // Render latest progress update if exists
        let lastProgressHtml = "";
        if (progressCount > 0) {
            const lastUpdate = task.progressUpdates[task.progressUpdates.length - 1];
            const dateObj = new Date(lastUpdate.createdAt);
            const formattedDate = dateObj.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: "Asia/Jakarta" }).replace(/\./g, ":") + " WIB";
            lastProgressHtml = `
                <div class="task-last-progress" style="margin-top: 10px; padding: 8px 12px; background-color: rgba(0, 0, 0, 0.02); border-left: 3px solid var(--primary-color); border-radius: 4px; font-size: 0.8125rem; line-height: 1.4;">
                    <span style="font-weight: 600; color: var(--text-secondary); display: block; font-size: 0.75rem; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">Update Progress (${lastUpdate.userName} - ${formattedDate}):</span>
                    <span style="color: var(--text-color); font-style: italic;">"${lastUpdate.text}"</span>
                </div>
            `;
        }

        return `
            <div class="task-card prio-${priorityClass} ${isCompleted}" data-task-id="${task.id}">
                <div class="task-checkbox-col">
                    <div class="task-card-check check-task-btn" data-task-id="${task.id}" 
                        style="${checkBtnStyle}"
                        title="${!isAssignee && !isTaskCompleted ? 'Hanya penanggungjawab yang dapat menyelesaikan tugas ini' : isTaskCompleted ? 'Tugas telah selesai' : 'Tandai selesai'}">
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>
                
                <div class="task-content-col open-task-detail-btn" data-task-id="${task.id}" style="cursor:pointer;">
                    <div class="task-tags-row">
                        <span class="tag tag-prio-${priorityClass}">Prioritas ${task.priority}</span>
                        <span class="tag tag-cat-generic">${task.category}</span>
                        <span class="tag tag-status-${task.status === 'Completed' ? 'completed' : 'running'}">${task.status === 'Completed' ? 'Selesai' : 'Berjalan'}</span>
                        ${(username || password) ? `<span class="tag" style="background-color: #6366f1; color: white; display: inline-flex; align-items: center; gap: 4px;">
                            <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2.5" fill="none" style="margin-right: 2px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Kredensial
                        </span>` : ''}
                    </div>
                    <h4 class="task-title">${task.title}</h4>
                    <p class="task-desc">${cleanDesc || "Tidak ada deskripsi."}</p>
                    ${lastProgressHtml}
                    
                    <div class="task-meta-row" style="margin-top: 12px;">
                        <div class="task-meta-item ${deadlineLabelClass}">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span>${deadlineLabelText}</span>
                        </div>
                        <div class="task-meta-item">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                            <span>${assignee.name}</span>
                        </div>
                        ${progressCount > 0 ? `<div class="task-meta-item" title="${progressCount} Laporan Progress"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><span>${progressCount}</span></div>` : ''}
                        ${attachCount > 0 ? `<div class="task-meta-item"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg><span>${attachCount}</span></div>` : ''}
                    </div>
                </div>
                
                <div class="task-assignee-col" title="Ditugaskan kepada: ${assignee.name}">
                    ${buildAssigneeAvatar(task.assignedTo)}
                </div>
                
                <div class="task-actions">
                    ${canEdit ? `
                    <button class="action-btn-info edit-task-btn" data-task-id="${task.id}" title="Edit Tugas" style="margin-right: 6px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    ` : ''}
                    ${canDelete ? `
                    <button class="action-btn-danger delete-task-btn" data-task-id="${task.id}" title="Hapus Tugas">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
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

    // Toggle Task status handler
    async function handleToggleTaskStatus(taskId) {
        const task = DB.tasks.find(t => t.id === taskId);
        if (!task) return;

        const isTaskCompleted = task.status === "Completed" || task.status === "Paid";
        const assigneeId = typeof task.assignedTo === 'string' ? task.assignedTo : (Array.isArray(task.assignedTo) ? task.assignedTo[0] : '');

        if (isTaskCompleted) {
            // Hanya Admin yang bisa membalikkan status dari Selesai → Berjalan
            if (!isAdmin) {
                window.showToast("Hanya Admin yang dapat mengubah status tugas yang telah selesai!", "error");
                return;
            }
        } else {
            // Hanya assignee (penanggungjawab) yang bisa menyelesaikan tugas
            if (Auth.currentUser.id !== assigneeId) {
                window.showToast("Hanya penanggungjawab tugas yang dapat menyelesaikan tugas ini!", "error");
                return;
            }
        }

        const nextStatus = task.status === "Completed" ? "In Progress" : "Completed";
        await DB.updateTaskStatus(taskId, nextStatus);

        // Notify admin & relevant users on completion
        if (nextStatus === "Completed") {
            const admins = DB.users.filter(u => u.role === "Admin" || u.role === "Project Manager" || u.role === "Atasan");
            for (const admin of admins) {
                if (admin.id !== Auth.currentUser.id) {
                    await DB.addNotification(admin.id, `${Auth.currentUser.name} menyelesaikan tugas: "${task.title}".`, "task_completed");
                }
            }
        }

        renderDashboardTasks();
        updateStats();
        window.showToast(`Status tugas "${task.title}" diperbarui.`, "success");
    }

    // Delete Task handler
    async function handleDeleteTask(taskId) {
        const task = DB.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (!isAdmin && task.createdBy !== Auth.currentUser.id) {
            window.showToast("Anda tidak memiliki izin menghapus tugas ini!", "error");
            return;
        }

        if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
            await DB.deleteTask(taskId);
            renderDashboardTasks();
            updateStats();
            window.showToast("Tugas berhasil dihapus.", "success");
        }
    }

    // Progress Detail Modal
    window.openProgressModal = (type) => {
        const modal = document.getElementById("progress-detail-modal");
        if (!modal || !window._dashStats) return;

        const { total, running, completed, overdue, percentage, filteredTasks } = window._dashStats;
        const modalTitle = document.getElementById("progress-modal-title");
        const modalBody = document.getElementById("progress-modal-body");

        let title = "Detail Progress";
        let bodyHtml = "";

        if (type === "total") {
            title = "📋 Semua Tugas";
            bodyHtml = `
                <div class="progress-summary-row">
                    <div class="progress-stat-box blue"><span>${total}</span><small>Total Tugas</small></div>
                    <div class="progress-stat-box orange"><span>${running}</span><small>Berjalan</small></div>
                    <div class="progress-stat-box green"><span>${completed}</span><small>Selesai</small></div>
                    <div class="progress-stat-box red"><span>${overdue}</span><small>Terlambat</small></div>
                </div>
                <div class="progress-bar-detail-wrap">
                    <div class="progress-bar-container"><div class="progress-bar-fill" style="width:${percentage}%"></div></div>
                    <span>${percentage}% selesai</span>
                </div>
            `;
        } else if (type === "running") {
            title = "⏳ Tugas Sedang Berjalan";
            const runningTasks = filteredTasks.filter(t => t.status === "In Progress");
            bodyHtml = renderTaskMiniList(runningTasks, "running");
        } else if (type === "completed") {
            title = "✅ Tugas Selesai";
            const completedTasks = filteredTasks.filter(t => t.status === "Completed");
            bodyHtml = renderTaskMiniList(completedTasks, "completed");
        }

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) {
            modalBody.innerHTML = bodyHtml;
            const lang = localStorage.getItem("dzhirasena_lang") || "id";
            if (window.Layout && window.Layout.applyTranslation) {
                window.Layout.applyTranslation(lang, modalBody);
            }
        }
        modal.classList.remove("hidden");
    };

    function renderTaskMiniList(tasks, statusClass) {
        if (tasks.length === 0) return `<p style="text-align:center; color:var(--text-muted); padding: 20px;">Tidak ada tugas.</p>`;
        return tasks.map(task => {
            const assigneeId = typeof task.assignedTo === 'string' ? task.assignedTo : (Array.isArray(task.assignedTo) ? task.assignedTo[0] : '');
            const u = DB.users.find(u => u.id === assigneeId);
            const name = u ? u.name : "?";
            const pClass = task.priority.toLowerCase();
            return `
                <div class="progress-task-item prio-left-${pClass}">
                    <div class="progress-task-info">
                        <span class="progress-task-title">${task.title}</span>
                        <div class="progress-task-meta">
                            <span class="meta-icon-item" title="Kategori">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                ${task.category}
                            </span>
                            <span class="meta-icon-item" title="Deadline">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                ${formatDate(task.deadline)}
                            </span>
                            <span class="meta-icon-item" title="Ditugaskan Ke">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                ${name}
                            </span>
                        </div>
                    </div>
                    <span class="tag tag-prio-${pClass}" style="font-size:10px;">${task.priority}</span>
                </div>
            `;
        }).join("");
    }

    // Submit Task handler
    if (addTaskForm) {
        addTaskForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("task-name").value.trim();
            const description = document.getElementById("task-desc").value.trim();
            const category = document.getElementById("task-category").value;
            const deadline = document.getElementById("task-deadline").value;

            const isJournal = category && category.toLowerCase() === "jurnal";
            let finalDesc = description;
            if (isJournal) {
                const u = document.getElementById("task-username").value.trim();
                const p = document.getElementById("task-password").value.trim();
                finalDesc = DB.formatJournalDescription(description, u, p);
            }

            // Single assignee from select
            let assignedTo;
            const singleSelect = document.getElementById("task-assignee");
            assignedTo = singleSelect ? singleSelect.value : Auth.currentUser.id;

            if (!isAdmin) {
                assignedTo = Auth.currentUser.id;
            }

            let priority = "Tinggi";
            const checkedPrio = document.querySelector('input[name="priority"]:checked');
            if (checkedPrio) priority = checkedPrio.value;

            // Handle File Uploads
            const fileInput = document.getElementById("task-files");
            let uploadedAttachments = [];

            if (fileInput && fileInput.files.length > 0) {
                // Show loading state on button
                const submitBtn = addTaskForm.querySelector('button[type="submit"]');
                const origText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px;"></span> Mengunggah...';
                submitBtn.disabled = true;

                uploadedAttachments = await DB.uploadFiles(fileInput.files);

                submitBtn.innerHTML = origText;
                submitBtn.disabled = false;
            }

            const newTask = {
                id: `tsk-${Date.now()}`,
                title,
                description: finalDesc,
                category,
                deadline,
                priority,
                assignedTo,
                createdBy: Auth.currentUser.id,
                status: "In Progress",
                createdAt: new Date().toISOString().split('T')[0],
                attachments: uploadedAttachments
            };

            await DB.addTask(newTask);

            // Notify single assignee
            if (assignedTo && assignedTo !== Auth.currentUser.id) {
                await DB.addNotification(assignedTo, `Tugas baru "${title}" telah ditugaskan kepada Anda oleh ${Auth.currentUser.name}.`, "task_added");
            }

            e.target.reset();
            const journalFields = document.getElementById("journal-fields");
            if (journalFields) journalFields.classList.add("hidden");
            deadlineInput.value = new Date().toISOString().split('T')[0];

            renderDashboardTasks();
            updateStats();
            window.showToast("Tugas baru berhasil ditambahkan!", "success");
        });
    }

    // Dynamic Filter Categories
    if (taskFilterCategory) {
        taskFilterCategory.addEventListener("change", renderDashboardTasks);
    }

    // Sort Button
    if (filterSortBtn) {
        filterSortBtn.addEventListener("click", () => {
            const isAscending = filterSortBtn.getAttribute("data-sort") === "asc";
            DB.tasks.sort((a, b) => {
                const dateA = new Date(a.deadline);
                const dateB = new Date(b.deadline);
                return isAscending ? dateA - dateB : dateB - dateA;
            });
            filterSortBtn.setAttribute("data-sort", isAscending ? "desc" : "asc");
            window.showToast(`Daftar tugas diurutkan berdasarkan tanggal ${isAscending ? 'terdekat' : 'terjauh'}.`, "info");
            renderDashboardTasks();
        });
    }

    // Metric card click handlers (progress detail)
    document.addEventListener("click", (e) => {
        const metricCard = e.target.closest(".metric-card[data-progress-type]");
        if (metricCard) {
            openProgressModal(metricCard.getAttribute("data-progress-type"));
            return;
        }

        const progressWidget = e.target.closest(".progress-widget-card");
        if (progressWidget) {
            openProgressModal("total");
            return;
        }
    });

    // Scoped Click delegations
    document.addEventListener("click", (e) => {
        const checkBtn = e.target.closest(".check-task-btn");
        if (checkBtn) {
            e.stopPropagation();
            handleToggleTaskStatus(checkBtn.getAttribute("data-task-id"));
            return;
        }

        const taskDetailBtn = e.target.closest(".open-task-detail-btn");
        if (taskDetailBtn) {
            e.stopPropagation();
            window.openTaskDetailModal(taskDetailBtn.getAttribute("data-task-id"));
            return;
        }

        const deleteBtn = e.target.closest(".delete-task-btn");
        if (deleteBtn) {
            e.stopPropagation();
            handleDeleteTask(deleteBtn.getAttribute("data-task-id"));
            return;
        }

        const editBtn = e.target.closest(".edit-task-btn");
        if (editBtn) {
            e.stopPropagation();
            window.openEditTaskModal(editBtn.getAttribute("data-task-id"));
            return;
        }
    });

    // 3. Initial Rendering calls
    renderDashboardTasks();
    updateStats();
});
