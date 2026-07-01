// ==========================================================================
// DZHIRASENA - LAPORAN HONOR (Read-Only Paid Tasks Recap)
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize DB & Layout
    await DB.init();
    if (!Auth.currentUser) return;
    Layout.init();

    const userSearchInput = document.getElementById("honor-user-search");
    if (userSearchInput) {
        userSearchInput.addEventListener("input", () => {
            renderLaporanHonor();
        });
    }

    // 2. Protect Route: Hanya Atasan, Admin, dan PM yang boleh akses honor
    const isAtasan = Auth.currentUser.role === "Atasan";
    const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
    if (!isAtasan && !isAdmin) {
        window.location.href = "/user-dashboard";
        return;
    }

    // Format Currency Helper
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
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

    // Update overall payout across all employees (read-only sum of Paid tasks)
    window.updateTotalPayout = () => {
        let total = 0;
        DB.tasks.forEach(t => {
            if (t.status === "Paid") {
                total += t.honorAmount || 0;
            }
        });
        const payoutEl = document.getElementById("total-payout");
        if (payoutEl) {
            payoutEl.textContent = `Total Dibayar: ${formatRupiah(total)}`;
        }
    };

    // Main render function
    function renderLaporanHonor() {
        const tbody = document.getElementById("honor-list");
        if (!tbody) return;

        // Filter out Admins, PMs, and Atasan (only employees/staff are eligible for honorarium)
        let employees = DB.users.filter(u => u.role !== "Admin" && u.role !== "Atasan" && u.role !== "Project Manager");

        // Filter berdasarkan pencarian nama
        const searchQuery = userSearchInput ? userSearchInput.value.trim().toLowerCase() : "";
        if (searchQuery) {
            employees = employees.filter(emp => emp.name.toLowerCase().includes(searchQuery));
        }

        // Calculate paid tasks metrics per employee
        const honorData = employees.map(emp => {
            const empTasks = DB.tasks.filter(t => {
                const assignedIds = DB._parseAssignees(t.assignedTo);
                return assignedIds.includes(emp.id);
            });

            // Filter status tugas 'Paid'
            const taskCount = empTasks.filter(t => t.status === "Paid").length;

            // Hitung akumulasi honor yang sudah dibayar
            let accumulatedHonor = 0;
            empTasks.forEach(t => {
                if (t.status === "Paid") {
                    accumulatedHonor += t.honorAmount || 0;
                }
            });

            return {
                ...emp,
                taskCount,
                accumulatedHonor
            };
        });

        if (honorData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px;">Tidak ada data karyawan.</td></tr>`;
            return;
        }

        let html = "";
        honorData.forEach(data => {
            const tasksForEmp = DB.tasks.filter(t => {
                const assignedIds = DB._parseAssignees(t.assignedTo);
                return assignedIds.includes(data.id) && t.status === "Paid";
            });

            const hasTasks = data.taskCount > 0;

            html += `
                <tr class="employee-row" data-employee-id="${data.id}" style="border-bottom: 1px solid var(--border-color);">
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
                            <img src="${data.avatar}" alt="${data.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">
                            <div>
                                <div class="table-user-name" style="font-weight: 600; color: var(--text-dark);">${data.name}</div>
                                <div class="table-user-email" style="font-size: 12px; color: var(--text-muted);">${data.role}</div>
                            </div>
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: bold; color: var(--brand); font-size: 16px;">${data.taskCount}</td>
                    <td style="text-align: right; font-weight: bold; color: var(--text-dark); font-size: 14px;">${formatRupiah(data.accumulatedHonor)}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-secondary btn-sm toggle-tasks-btn" data-employee-id="${data.id}" data-count="${data.taskCount}" ${!hasTasks ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            Tampilkan Tugas (${data.taskCount})
                        </button>
                    </td>
                </tr>
                <tr class="tasks-expand-row hidden" id="tasks-row-${data.id}" style="background: var(--bg-card);">
                    <td colspan="4" style="padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
                        <div class="expand-tasks-container" style="border-left: 3px solid var(--brand); padding-left: 16px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--text-dark);">Tugas yang Sudah Dibayar: ${data.name}</h4>
                            <div class="expand-tasks-list" style="display: flex; flex-direction: column; gap: 10px;">
                                ${tasksForEmp.map(t => `
                                    <div class="expand-task-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-app); box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                        <div style="flex: 1; min-width: 0; margin-right: 16px;">
                                            <div style="font-weight: 600; font-size: 13.5px; color: var(--text-dark); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.title}</div>
                                            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                                                <span class="tag tag-cat-generic" style="font-size: 10px; padding: 2px 6px; background: var(--primary-light); color: var(--primary-color); font-weight: 600;">${t.category || 'General'}</span>
                                                <span class="tag tag-prio-${t.priority.toLowerCase()}" style="font-size: 10px; padding: 2px 6px;">${t.priority}</span>
                                                <span style="font-size: 11px; color: var(--text-muted);">Status: <strong style="color:var(--success);">Paid</strong></span>
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <span style="font-weight: 700; color: var(--success); font-size: 14.5px;">${formatRupiah(t.honorAmount || 0)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-color);">
                                <div style="font-weight: 700; font-size: 13.5px; color: var(--text-dark);">Total Terbayar: <span style="color: var(--success);">${formatRupiah(data.accumulatedHonor)}</span></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        window.updateTotalPayout();
    }

    // Attach click listener for toggling tasks lists
    document.addEventListener("click", (e) => {
        const toggleBtn = e.target.closest(".toggle-tasks-btn");
        if (toggleBtn) {
            e.stopPropagation();
            const empId = toggleBtn.getAttribute("data-employee-id");
            const count = toggleBtn.getAttribute("data-count");
            const targetRow = document.getElementById(`tasks-row-${empId}`);
            
            if (targetRow) {
                const isOpening = targetRow.classList.contains("hidden");
                
                if (isOpening) {
                    const allEmployeeRows = document.querySelectorAll(".employee-row");
                    allEmployeeRows.forEach(row => {
                        if (row.getAttribute("data-employee-id") !== empId) {
                            row.classList.add("hidden");
                        }
                    });
                    
                    const allTasksRows = document.querySelectorAll(".tasks-expand-row");
                    allTasksRows.forEach(row => {
                        if (row.id !== `tasks-row-${empId}`) {
                            row.classList.add("hidden");
                        }
                    });
                    
                    targetRow.classList.remove("hidden");
                    toggleBtn.textContent = "Sembunyikan Tugas (Tampilkan Semua)";
                    toggleBtn.classList.add("active");
                } else {
                    const allEmployeeRows = document.querySelectorAll(".employee-row");
                    allEmployeeRows.forEach(row => {
                        row.classList.remove("hidden");
                    });
                    
                    targetRow.classList.add("hidden");
                    toggleBtn.textContent = `Tampilkan Tugas (${count})`;
                    toggleBtn.classList.remove("active");
                }
            }
        }
    });

    renderLaporanHonor();

    // Trigger language translation to format layout titles if English
    if (typeof Layout !== 'undefined') {
        const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
        Layout.applyTranslation(savedLang);
    }
});
