// ==========================================================================
// DZHIRASENA - ARCHIVE PAGE INITIALIZATION
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // Initialize DB & Layout
    await DB.init();
    if (!Auth.currentUser) return;
    Layout.init();

    const archiveList = document.getElementById("archive-tasks-list");
    const emptyState = document.querySelector(".empty-state-card");
    
    let currentPage = 1;
    const itemsPerPage = 10;

    // Untuk Atasan: cache honor payments dari API
    let honorPaymentsCache = [];

    const renderArchiveTasks = async () => {
        if (!archiveList) return;

        const isAtasan = Auth.currentUser.role === "Atasan";
        const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";

        // Reset title/subtitle for all users
        document.querySelector(".view-title").textContent = "Arsip Tugas Selesai";
        document.querySelector(".view-subtitle").textContent = "Semua tugas yang telah diselesaikan oleh karyawan.";
        if (emptyState) {
            emptyState.querySelector("h3").textContent = "Belum Ada Tugas Diarsipkan";
            emptyState.querySelector("p").textContent = "Semua tugas yang telah diselesaikan akan otomatis diarsipkan di sini.";
        }

        itemsToRender = DB.tasks.filter(t => t.status === "Completed");

        // Employees only see their own completed tasks or tasks they created (Admin and Atasan see all)
        if (!isAdmin && !isAtasan) {
            itemsToRender = itemsToRender.filter(t => {
                const assigneeId = typeof t.assignedTo === 'string' ? t.assignedTo : (Array.isArray(t.assignedTo) ? t.assignedTo[0] : '');
                return assigneeId === Auth.currentUser.id || t.createdBy === Auth.currentUser.id;
            });
        }
        // Sort tasks by date (newest first)
        itemsToRender.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (itemsToRender.length === 0) {
            if (emptyState) emptyState.classList.remove("hidden");
            archiveList.innerHTML = "";
            document.getElementById("archive-pagination-container").classList.add("hidden");
            return;
        }

        if (emptyState) emptyState.classList.add("hidden");

        // Pagination Logic
        const totalPages = Math.ceil(itemsToRender.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedItems = itemsToRender.slice(startIndex, startIndex + itemsPerPage);

        archiveList.innerHTML = paginatedItems.map(item => {
            // Render Normal Task Card
            const assignee = DB.users.find(u => u.id === item.assignedTo) || { name: "Tidak Dikenal", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" };
            const priorityClass = item.priority.toLowerCase();
            const canDelete = (Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager") || item.createdBy === Auth.currentUser.id;

            return `
                <div class="task-card prio-${priorityClass} completed" data-task-id="${item.id}">
                    <div class="task-checkbox-col">
                        <div class="task-card-check check-task-btn" data-task-id="${item.id}">
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div class="task-content-col">
                        <div class="task-title">${item.title}</div>
                        <div class="task-meta">
                            <span>Kategori: ${item.category}</span>
                            <span>•</span>
                            <span>Deadline: ${item.deadline}</span>
                            <span>•</span>
                            <span>Prioritas: ${item.priority}</span>
                        </div>
                        <div class="task-assignee-avatar">
                            <img src="${assignee.avatar}" alt="${assignee.name}" title="Ditugaskan kepada: ${assignee.name}">
                        </div>
                    </div>
                    <div class="task-actions-col">
                        ${canDelete ? `
                        <button class="action-btn-icon delete-task-btn" data-task-id="${item.id}" title="Hapus Permanen">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#ef4444" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join("");

        // Render Pagination UI
        const paginationContainer = document.getElementById("archive-pagination-container");
        if (totalPages > 1) {
            paginationContainer.classList.remove("hidden");
            let paginationHtml = `
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changeArchivePage(${currentPage - 1})">Prev</button>
            `;
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="window.changeArchivePage(${i})">${i}</button>
                `;
            }
            paginationHtml += `
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changeArchivePage(${currentPage + 1})">Next</button>
            `;
            paginationContainer.innerHTML = paginationHtml;
        } else {
            paginationContainer.classList.add("hidden");
        }

        const lang = localStorage.getItem("dzhirasena_lang") || "id";
        if (window.Layout && window.Layout.applyTranslation) {
            window.Layout.applyTranslation(lang, archiveList);
        }
    };

    window.changeArchivePage = async (pageNumber) => {
        currentPage = pageNumber;
        await renderArchiveTasks();
        // Optional: scroll back to top of the list container when page changes
        const container = document.getElementById("archive-tasks-list");
        if (container) container.scrollTop = 0;
    };

    // Toggle Task Status (to restore from completed to in progress)
    async function handleToggleTaskStatus(taskId) {
        const task = DB.tasks.find(t => t.id === taskId);
        if (!task) return;

        const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
        if (!isAdmin) {
            window.showToast("Hanya Admin yang dapat mengubah status tugas yang telah selesai!", "error");
            return;
        }

        const nextStatus = "In Progress";
        await DB.updateTaskStatus(taskId, nextStatus);

        renderArchiveTasks();
        window.showToast(`Status tugas "${task.title}" dikembalikan ke Berjalan.`, "success");
    }

    // Delete Task handler
    async function handleDeleteTask(taskId) {
        const task = DB.tasks.find(t => t.id === taskId);
        if (!task) return;

        const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
        if (!isAdmin && task.createdBy !== Auth.currentUser.id) {
            window.showToast("Anda tidak memiliki izin menghapus tugas ini!", "error");
            return;
        }

        if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
            await DB.deleteTask(taskId);
            renderArchiveTasks();
            window.showToast("Tugas berhasil dihapus.", "success");
        }
    }

    // Scoped Click delegations
    document.addEventListener("click", (e) => {
        const checkBtn = e.target.closest(".check-task-btn");
        if (checkBtn) {
            e.stopPropagation();
            handleToggleTaskStatus(checkBtn.getAttribute("data-task-id"));
            return;
        }

        const taskContent = e.target.closest(".click-task-content");
        if (taskContent) {
            e.stopPropagation();
            handleToggleTaskStatus(taskContent.getAttribute("data-task-id"));
            return;
        }

        const deleteBtn = e.target.closest(".delete-task-btn");
        if (deleteBtn) {
            e.stopPropagation();
            handleDeleteTask(deleteBtn.getAttribute("data-task-id"));
            return;
        }
    });

    await renderArchiveTasks();
});
