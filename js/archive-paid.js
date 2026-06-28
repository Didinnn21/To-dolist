// ==========================================================================
// DZHIRASENA - ARCHIVE PAID TASKS PAGE INITIALIZATION
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

    const renderArchiveTasks = async () => {
        if (!archiveList) return;

        const isAtasan = Auth.currentUser.role === "Atasan";
        const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";

        // Reset title/subtitle
        document.querySelector(".view-title").textContent = "Arsip Tugas Terbayar";
        document.querySelector(".view-subtitle").textContent = "Semua tugas yang telah selesai dan berhasil dibayarkan honornya.";
        if (emptyState) {
            emptyState.querySelector("h3").textContent = "Belum Ada Tugas Terbayar";
            emptyState.querySelector("p").textContent = "Tugas yang telah dibayarkan honornya akan otomatis diarsipkan di sini.";
        }

        // Filter tasks with status "Paid"
        let itemsToRender = DB.tasks.filter(t => t.status === "Paid");

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
                <div class="task-card prio-${priorityClass} completed" data-task-id="${item.id}" style="border-left: 4px solid var(--success) !important;">
                    <div class="task-checkbox-col">
                        <div class="task-card-check check-task-btn active" data-task-id="${item.id}" style="background:var(--success); border-color:var(--success); cursor:default;">
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div class="task-content-col" style="cursor: pointer;" onclick="Layout.showTaskDetails('${item.id}')">
                        <div class="task-title" style="text-decoration: none; color: var(--text-dark);">${item.title}</div>
                        <div class="task-meta" style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                            <span class="tag tag-cat-generic" style="font-size: 10px; padding: 2px 6px; background: var(--primary-light); color: var(--primary-color); font-weight: 600;">${item.category || 'General'}</span>
                            <span class="tag tag-prio-${item.priority.toLowerCase()}" style="font-size: 10px; padding: 2px 6px;">${item.priority}</span>
                            <span style="font-size: 11px; color: var(--text-muted);">Selesai pada: ${formatDate(item.createdAt)}</span>
                            <span class="badge-paid-honor" style="font-size: 11px; font-weight: 700; color: var(--success); background: rgba(34, 197, 94, 0.1); padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                                💵 Terbayar: Rp${(item.honorAmount || 0).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div class="task-assignee-avatar" style="margin-top: 10px;">
                            <img src="${assignee.avatar}" alt="${assignee.name}" title="Ditugaskan kepada: ${assignee.name}" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--border-color);">
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

        renderPagination(totalPages);
    };

    // Helper: Format Date
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

    const renderPagination = (totalPages) => {
        const pagContainer = document.getElementById("archive-pagination-container");
        if (!pagContainer) return;

        if (totalPages <= 1) {
            pagContainer.classList.add("hidden");
            return;
        }

        pagContainer.classList.remove("hidden");
        let pagHtml = `
            <button class="pagination-btn" id="prev-page-btn" ${currentPage === 1 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span class="pagination-info">Halaman ${currentPage} dari ${totalPages}</span>
            <button class="pagination-btn" id="next-page-btn" ${currentPage === totalPages ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 12 12 9 6"></polyline></svg>
            </button>
        `;

        pagContainer.innerHTML = pagHtml;

        document.getElementById("prev-page-btn").addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderArchiveTasks();
            }
        });

        document.getElementById("next-page-btn").addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderArchiveTasks();
            }
        });
    };

    // Event listener for delete button (permanen)
    document.addEventListener("click", async (e) => {
        const deleteBtn = e.target.closest(".delete-task-btn");
        if (deleteBtn) {
            e.stopPropagation();
            const taskId = deleteBtn.getAttribute("data-task-id");
            if (confirm("Apakah Anda yakin ingin menghapus tugas ini secara permanen?")) {
                await DB.deleteTask(taskId);
                renderArchiveTasks();
            }
        }
    });

    renderArchiveTasks();
});
