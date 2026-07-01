// ==========================================================================
// DZHIRASENA - SISTEM HONOR (Per-Task Input & Payment)
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize DB & Layout
    await DB.init();
    if (!Auth.currentUser) return;
    Layout.init();

    const userSearchInput = document.getElementById("honor-user-search");
    if (userSearchInput) {
        userSearchInput.addEventListener("input", () => {
            renderHonor();
        });
    }

    // 2. Protect Route: Hanya Atasan, Admin, dan PM yang boleh akses honor
    const isAtasan = Auth.currentUser.role === "Atasan";
    const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
    if (!isAtasan && !isAdmin) {
        window.location.href = "user-dashboard.html";
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

    // Update individual employee total based on their task inputs
    window.updateEmployeeTotal = (empId) => {
        let total = 0;
        const inputs = document.querySelectorAll(`.task-honor-input[data-employee-id="${empId}"]`);
        inputs.forEach(input => {
            total += parseInt(input.value) || 0;
        });

        // Update employee-specific previews
        const previewCell = document.getElementById(`emp-total-preview-${empId}`);
        const accumulatedSpan = document.getElementById(`emp-total-accumulated-${empId}`);
        
        if (previewCell) previewCell.textContent = formatRupiah(total);
        if (accumulatedSpan) accumulatedSpan.textContent = formatRupiah(total);

        // Update overall total payout on page header
        window.updateTotalPayout();
    };

    // Update overall payout across all employees
    window.updateTotalPayout = () => {
        let total = 0;
        const inputs = document.querySelectorAll('.task-honor-input');
        inputs.forEach(input => {
            total += parseInt(input.value) || 0;
        });
        const payoutEl = document.getElementById("total-payout");
        if (payoutEl) {
            payoutEl.textContent = `Total Payout: ${formatRupiah(total)}`;
        }
    };

    // Pay a single task individually
    window.paySingleTask = async (empId, empName, taskId) => {
        const input = document.getElementById('honor-input-' + taskId);
        const amount = parseInt(input.value) || 0;

        if (amount <= 0) {
            window.showToast("Silakan masukkan nominal honor tugas yang valid (lebih dari 0).", "error");
            return;
        }

        const task = DB.tasks.find(t => t.id === taskId);
        const taskTitle = task ? task.title : 'Tugas';

        if (confirm(`Apakah Anda yakin ingin membayarkan honor sebesar Rp ${amount.toLocaleString('id-ID')} untuk tugas "${taskTitle}" kepada ${empName}?`)) {
            const taskAmounts = { [taskId]: amount };
            const success = await DB.saveHonorPayment(empId, empName, amount, [taskId], taskAmounts);
            if (success) {
                renderHonor(); // Refresh the table
            }
        }
    };

    // Pay all tasks with inputted amounts > 0 for a specific employee
    window.payAllTasksForEmployee = async (empId, empName, taskIds) => {
        const taskAmounts = {};
        const activeTaskIds = [];
        let totalAmount = 0;

        taskIds.forEach(taskId => {
            const input = document.getElementById('honor-input-' + taskId);
            const amount = parseInt(input.value) || 0;
            if (amount > 0) {
                taskAmounts[taskId] = amount;
                activeTaskIds.push(taskId);
                totalAmount += amount;
            }
        });

        if (activeTaskIds.length === 0) {
            window.showToast("Harap masukkan nominal honor minimal untuk salah satu tugas.", "error");
            return;
        }

        if (confirm(`Apakah Anda yakin ingin membayarkan total honor sebesar Rp ${totalAmount.toLocaleString('id-ID')} untuk ${activeTaskIds.length} tugas kepada ${empName}?`)) {
            const success = await DB.saveHonorPayment(empId, empName, totalAmount, activeTaskIds, taskAmounts);
            if (success) {
                renderHonor(); // Refresh the table
            }
        }
    };

    // Main render function
    function renderHonor() {
        const tbody = document.getElementById("honor-list");
        if (!tbody) return;

        // Filter out Admins, PMs, and Atasan (only employees/staff are eligible for honorarium)
        let employees = DB.users.filter(u => u.role !== "Admin" && u.role !== "Atasan" && u.role !== "Project Manager");

        // Filter berdasarkan pencarian nama
        const searchQuery = userSearchInput ? userSearchInput.value.trim().toLowerCase() : "";
        if (searchQuery) {
            employees = employees.filter(emp => emp.name.toLowerCase().includes(searchQuery));
        }

        // Calculate completed tasks metrics per employee
        const honorData = employees.map(emp => {
            const empTasks = DB.tasks.filter(t => {
                const assignedIds = DB._parseAssignees(t.assignedTo);
                return assignedIds.includes(emp.id);
            });

            const selesai = empTasks.filter(t => t.status === "Completed").length;

            return {
                ...emp,
                selesai
            };
        });

        if (honorData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px;">Tidak ada data karyawan.</td></tr>`;
            return;
        }

        let html = "";
        honorData.forEach(data => {
            const completedTasksForEmp = DB.tasks.filter(t => {
                const assignedIds = DB._parseAssignees(t.assignedTo);
                return assignedIds.includes(data.id) && t.status === "Completed";
            });

            const isPayable = data.selesai > 0;

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
                    <td style="text-align: center; font-weight: bold; color: var(--success); font-size: 16px;">${data.selesai}</td>
                    <td style="text-align: right; font-weight: bold; color: var(--text-dark); font-size: 14px;" id="emp-total-preview-${data.id}">Rp0</td>
                    <td style="text-align: center;">
                        <button class="btn btn-secondary btn-sm toggle-tasks-btn" data-employee-id="${data.id}" data-count="${data.selesai}" ${!isPayable ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            Tampilkan Tugas (${data.selesai})
                        </button>
                    </td>
                </tr>
                <tr class="tasks-expand-row hidden" id="tasks-row-${data.id}" style="background: var(--bg-card);">
                    <td colspan="4" style="padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
                        <div class="expand-tasks-container" style="border-left: 3px solid var(--brand); padding-left: 16px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--text-dark);">Tugas Selesai: ${data.name}</h4>
                            <div class="expand-tasks-list" style="display: flex; flex-direction: column; gap: 10px;">
                                ${completedTasksForEmp.map(t => `
                                    <div class="expand-task-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-app); box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                        <div style="flex: 1; min-width: 0; margin-right: 16px;">
                                            <div style="font-weight: 600; font-size: 13.5px; color: var(--text-dark); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.title}</div>
                                            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                                                <span class="tag tag-cat-generic" style="font-size: 10px; padding: 2px 6px; background: var(--primary-light); color: var(--primary-color); font-weight: 600;">${t.category || 'General'}</span>
                                                <span class="tag tag-prio-${t.priority.toLowerCase()}" style="font-size: 10px; padding: 2px 6px;">${t.priority}</span>
                                                <span style="font-size: 11px; color: var(--text-muted);">Selesai pada: ${formatDate(t.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <input type="number" id="honor-input-${t.id}" class="honor-amount-input input task-honor-input" data-employee-id="${data.id}" placeholder="Nominal (Rp)" value="" min="0" oninput="window.updateEmployeeTotal('${data.id}')" style="width: 130px; text-align: right; font-weight: bold; padding: 6px 12px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-card); outline: none;">
                                            <button class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size: 12px;" onclick="window.paySingleTask('${data.id}', '${data.name}', '${t.id}')">Bayar</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-color);">
                                <div style="font-weight: 700; font-size: 13.5px; color: var(--text-dark);">Total Terinput: <span id="emp-total-accumulated-${data.id}" style="color: var(--success);">Rp0</span></div>
                                <button class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 12px;" onclick='window.payAllTasksForEmployee("${data.id}", "${data.name}", ${JSON.stringify(completedTasksForEmp.map(t => t.id))})'>Bayar Semua</button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        window.updateTotalPayout();
    }

    // Attach click listener for toggling completed tasks lists
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

    renderHonor();

    // Trigger language translation to format layout titles if English
    if (typeof Layout !== 'undefined') {
        const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
        Layout.applyTranslation(savedLang);
    }
});
