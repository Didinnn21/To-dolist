// ==========================================================================
// DZHIRASENA - ALL TASKS VIEW & FILTERING LOGIC v3.0
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize DB & Layout
    await DB.init();
    if (!Auth.currentUser) return;
    Layout.init();

    // 2. DOM references
    const listSearch = document.getElementById("task-list-search");
    const filterStatus = document.getElementById("filter-task-status");
    const filterAssignee = document.getElementById("filter-task-assignee");
    const filterPrio = document.getElementById("filter-task-priority");

    // Check for global search query redirection from other pages
    const redirectedSearch = sessionStorage.getItem("global_search_query");
    if (redirectedSearch && listSearch) {
        listSearch.value = redirectedSearch;
        sessionStorage.removeItem("global_search_query");
    }

    // Hydrate Assignee Filter and Hide for regular Employees
    const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
    const isAtasan = Auth.currentUser.role === "Atasan";
    
    if (!isAdmin && filterAssignee) {
        const parentGroup = filterAssignee.closest(".toolbar-select") || filterAssignee;
        parentGroup.style.display = "none";
    }

    if (isAtasan) {
        const btnShowAdd = document.getElementById("btn-show-add-task-modal");
        if (btnShowAdd) btnShowAdd.style.display = "none";
    }

    // Helper: Single assignee avatar
    function buildAssigneeAvatar(assignedTo) {
        const assigneeId = typeof assignedTo === 'string' ? assignedTo : (Array.isArray(assignedTo) ? assignedTo[0] : '');
        const user = DB.users.find(u => u.id === assigneeId) || { name: 'Tidak Dikenal', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' };
        return `<div class="assignee-avatar" title="${user.name}"><img src="${user.avatar}" alt="${user.name}"></div>`;
    }

    // Task Card HTML Generator
    function createTaskCardHtml(task) {
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

        const isAtasan = Auth.currentUser.role === "Atasan";
        const isTaskCompleted = task.status === "Completed" || task.status === "Paid";
        const canEdit = !isAtasan && (isAdmin || (task.createdBy === Auth.currentUser.id && !isTaskCompleted));
        const canDelete = isAdmin || task.createdBy === Auth.currentUser.id;
        const progressCount = (task.progressUpdates || []).length;
        const attachCount = (task.attachments || []).length;
        // Hanya assignee yang bisa mencentang tugas sebagai selesai
        const isAssignee = Auth.currentUser.id === assigneeId;
        const checkBtnStyle = (!isAssignee && !isTaskCompleted)
            ? 'opacity: 0.35; cursor: not-allowed; pointer-events: none;'
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
                    </div>
                    <h4 class="task-title">${task.title}</h4>
                    <p class="task-desc">${task.description || "Tidak ada deskripsi."}</p>
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

    window.renderAllTasks = () => {
        const listContainer = document.getElementById("all-tasks-list");
        if (!listContainer) return;

        const searchVal = listSearch ? listSearch.value.trim().toLowerCase() : "";
        const statusVal = filterStatus ? filterStatus.value : "all";
        const assigneeVal = filterAssignee ? filterAssignee.value : "all";
        const priorityVal = filterPrio ? filterPrio.value : "all";

        let filtered = [...DB.tasks];

        // RBAC validation: Employees only see their own tasks (single assignee)
        if (!isAdmin) {
            filtered = filtered.filter(t => {
                const assigneeId = typeof t.assignedTo === 'string' ? t.assignedTo : (Array.isArray(t.assignedTo) ? t.assignedTo[0] : '');
                return assigneeId === Auth.currentUser.id;
            });
        } else {
            // Admins can filter by assignee
            if (assigneeVal !== "all") {
                filtered = filtered.filter(t => {
                    const assigneeId = typeof t.assignedTo === 'string' ? t.assignedTo : (Array.isArray(t.assignedTo) ? t.assignedTo[0] : '');
                    return assigneeId === assigneeVal;
                });
            }
        }

        // Status Filter
        if (statusVal === "running") {
            filtered = filtered.filter(t => t.status === "In Progress");
        } else if (statusVal === "completed") {
            filtered = filtered.filter(t => t.status === "Completed");
        }

        // Priority Filter
        if (priorityVal !== "all") {
            filtered = filtered.filter(t => t.priority === priorityVal);
        }

        // Search text Filter
        if (searchVal) {
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(searchVal) ||
                (t.description && t.description.toLowerCase().includes(searchVal))
            );
        }

        // Sort by Date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state-card">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" width="48" height="48" stroke="#6b7280" stroke-width="1.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <h3>Tugas Tidak Ditemukan</h3>
                    <p>Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map(createTaskCardHtml).join("");

        // Translate dynamically inserted content
        const lang = localStorage.getItem("dzhirasena_lang") || "id";
        if (window.Layout && window.Layout.applyTranslation) {
            window.Layout.applyTranslation(lang, listContainer);
        }

        if (typeof Layout !== 'undefined') {
            const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
            Layout.applyTranslation(savedLang);
        }
    };

    // Toggle Task Status
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

        // Notify Admin, PM, dan Atasan saat tugas diselesaikan
        if (nextStatus === "Completed") {
            const admins = DB.users.filter(u => u.role === "Admin" || u.role === "Project Manager" || u.role === "Atasan");
            for (const admin of admins) {
                if (admin.id !== Auth.currentUser.id) {
                    await DB.addNotification(admin.id, `${Auth.currentUser.name} menyelesaikan tugas: "${task.title}".`, "task_completed");
                }
            }
        }

        renderAllTasks();
        window.showToast(`Status tugas "${task.title}" diperbarui.`, "success");
    }

    // Delete Task
    async function handleDeleteTask(taskId) {
        const task = DB.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (!isAdmin && task.createdBy !== Auth.currentUser.id) {
            window.showToast("Anda tidak memiliki izin menghapus tugas ini!", "error");
            return;
        }

        if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
            await DB.deleteTask(taskId);
            renderAllTasks();
            window.showToast("Tugas berhasil dihapus.", "success");
        }
    }

    // Attach filters event listeners
    if (listSearch) listSearch.addEventListener("input", renderAllTasks);
    if (filterStatus) filterStatus.addEventListener("change", renderAllTasks);
    if (filterAssignee) filterAssignee.addEventListener("change", renderAllTasks);
    if (filterPrio) filterPrio.addEventListener("change", renderAllTasks);

    // Dynamic checks, deletions, and detail event delegation
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

    // Render tasks list
    renderAllTasks();
});
