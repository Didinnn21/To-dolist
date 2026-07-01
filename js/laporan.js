// ==========================================================================
// DZHIRASENA - LAPORAN KINERJA (LEADERBOARD + CHARTS)
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize DB & Layout
    await DB.init();
    if (!Auth.currentUser) return;
    Layout.init();

    // 2. Protect Route: Only Atasan and Admin can access
    const isAtasan = Auth.currentUser.role === "Atasan";
    const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
    if (!isAtasan && !isAdmin) {
        window.location.href = "user-dashboard.html";
        return;
    }

    // ── Chart instances (kept for destroy/re-render) ────────────────────────
    let chartTopPerformers = null;
    let chartCategory = null;
    let chartComparison = null;

    // ── Color Palette ───────────────────────────────────────────────────────
    const PALETTE = [
        "#2563EB", "#10B981", "#F59E0B", "#EF4444",
        "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
        "#F97316", "#6366F1"
    ];

    // ── Screen helpers ──────────────────────────────────────────────────────
    function isMobile()  { return window.innerWidth <= 600; }
    function isTablet()  { return window.innerWidth <= 1024; }

    // ── Detect dark mode ────────────────────────────────────────────────────
    function isDark() { return document.body.classList.contains("dark-theme"); }
    function gridColor()  { return isDark() ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"; }
    function textColor()  { return isDark() ? "#94A3B8" : "#475569"; }

    // ── Chart.js global defaults ────────────────────────────────────────────
    function applyChartDefaults() {
        Chart.defaults.color = textColor();
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 11;
    }

    // ── 3. Build analytics data ─────────────────────────────────────────────
    function buildData() {
        const employees = DB.users.filter(u =>
            u.role !== "Admin" && u.role !== "Atasan" && u.role !== "Project Manager"
        );

        let totalSelesai = 0;
        let totalBerjalan = 0;

        const leaderboardData = employees.map(emp => {
            const empTasks = DB.tasks.filter(t => {
                const assignedIds = DB._parseAssignees(t.assignedTo);
                return assignedIds.includes(emp.id);
            });
            const selesai  = empTasks.filter(t => t.status === "Completed").length;
            const berjalan = empTasks.filter(t => t.status !== "Completed").length;
            totalSelesai  += selesai;
            totalBerjalan += berjalan;
            return { ...emp, selesai, berjalan, total: empTasks.length };
        });

        leaderboardData.sort((a, b) => b.selesai - a.selesai);

        // Category counts (all tasks)
        const catCounts = {};
        DB.tasks.forEach(t => {
            const cat = t.category || "Lainnya";
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        return { leaderboardData, totalSelesai, totalBerjalan, catCounts, employees };
    }

    // ── 4. Render Chart 1: Top Performers (horizontal bar) ─────────────────
    function renderChartTopPerformers(data) {
        const ctx = document.getElementById("chart-top-performers");
        if (!ctx) return;

        const top    = data.leaderboardData.slice(0, isMobile() ? 5 : 7);
        const labels = top.map(d => isMobile() ? d.name.split(" ")[0] : d.name.split(" ").slice(0,2).join(" "));
        const values = top.map(d => d.selesai);
        const bgColors = top.map((_, i) => PALETTE[i % PALETTE.length]);

        if (chartTopPerformers) chartTopPerformers.destroy();
        chartTopPerformers = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Tugas Selesai",
                    data: values,
                    backgroundColor: bgColors,
                    borderRadius: 5,
                    borderSkipped: false,
                    maxBarThickness: isMobile() ? 24 : 32
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: 4 } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const emp = data.leaderboardData.find(d =>
                                    d.name.split(" ")[0] === items[0].label ||
                                    d.name.split(" ").slice(0,2).join(" ") === items[0].label
                                );
                                return emp ? emp.name : items[0].label;
                            },
                            label: (item) => ` ${item.raw} tugas selesai`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor() },
                        ticks: { precision: 0, color: textColor(), font: { size: isMobile() ? 9 : 11 } },
                        border: { display: false }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textColor(), font: { size: isMobile() ? 9 : 11 } },
                        border: { display: false }
                    }
                }
            }
        });
    }

    // ── 5. Render Chart 2: Category Distribution (doughnut) ────────────────
    function renderChartCategory(catCounts) {
        const ctx = document.getElementById("chart-category");
        if (!ctx) return;

        const maxItems = isMobile() ? 5 : 8;
        const entries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, maxItems);
        const labels  = entries.map(([k]) => k);
        const values  = entries.map(([, v]) => v);
        const total   = values.reduce((s, v) => s + v, 0);

        // Legend on bottom for mobile/tablet, right for desktop
        const legendPos = isMobile() ? "bottom" : "right";
        const legendBoxW = isMobile() ? 8 : 10;
        const legendPad  = isMobile() ? 8 : 12;

        if (chartCategory) chartCategory.destroy();
        chartCategory = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: PALETTE.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: isDark() ? "#1E293B" : "#FFFFFF",
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: isMobile() ? "60%" : "65%",
                plugins: {
                    legend: {
                        position: legendPos,
                        labels: {
                            boxWidth: legendBoxW,
                            padding: legendPad,
                            color: textColor(),
                            font: { size: isMobile() ? 9 : 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const pct = total > 0 ? Math.round((item.raw / total) * 100) : 0;
                                return ` ${item.label}: ${item.raw} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ── 6. Render Chart 3: Berjalan vs Selesai grouped bar ─────────────────
    function renderChartComparison(data) {
        const ctx = document.getElementById("chart-employee-comparison");
        if (!ctx) return;

        const maxEmp = isMobile() ? 6 : 10;
        const sorted = [...data.leaderboardData].sort((a, b) => b.total - a.total).slice(0, maxEmp);
        const labels = sorted.map(d => isMobile() ? d.name.split(" ")[0] : d.name.split(" ").slice(0,2).join(" "));

        if (chartComparison) chartComparison.destroy();
        chartComparison = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Berjalan",
                        data: sorted.map(d => d.berjalan),
                        backgroundColor: "#3B82F6",
                        borderRadius: 4,
                        borderSkipped: false,
                        maxBarThickness: isMobile() ? 20 : 28
                    },
                    {
                        label: "Selesai",
                        data: sorted.map(d => d.selesai),
                        backgroundColor: "#10B981",
                        borderRadius: 4,
                        borderSkipped: false,
                        maxBarThickness: isMobile() ? 20 : 28
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const emp = data.leaderboardData.find(d =>
                                    d.name.split(" ")[0] === items[0].label ||
                                    d.name.split(" ").slice(0,2).join(" ") === items[0].label
                                );
                                return emp ? emp.name : items[0].label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor(), font: { size: isMobile() ? 8 : 11 } },
                        border: { display: false }
                    },
                    y: {
                        grid: { color: gridColor() },
                        ticks: { precision: 0, color: textColor(), font: { size: isMobile() ? 8 : 11 } },
                        border: { display: false }
                    }
                }
            }
        });
    }

    // ── 7. Render Leaderboard table ─────────────────────────────────────────
    function renderLeaderboard(data) {
        const tbody = document.getElementById("leaderboard-list");
        if (!tbody) return;

        document.getElementById("metric-total-users").textContent = data.leaderboardData.length;
        document.getElementById("metric-total-completed").textContent = data.totalSelesai;
        document.getElementById("metric-total-running").textContent = data.totalBerjalan;

        if (data.leaderboardData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;">Tidak ada data karyawan.</td></tr>`;
            return;
        }

        let html = "";
        data.leaderboardData.forEach((d, index) => {
            let rankBadge = "";
            if (index === 0 && d.selesai > 0) rankBadge = "🥇";
            else if (index === 1 && d.selesai > 0) rankBadge = "🥈";
            else if (index === 2 && d.selesai > 0) rankBadge = "🥉";
            else rankBadge = `#${index + 1}`;

            // Mini progress bar in row
            const pct = d.total > 0 ? Math.round((d.selesai / d.total) * 100) : 0;

            html += `
                <tr onclick="window.showEmployeeDetails('${d.id}')" style="cursor: pointer;" class="hoverable-row" title="Klik untuk melihat detail tugas karyawan">
                    <td style="font-weight: bold; font-size: 16px;">${rankBadge}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="${d.avatar}" alt="${d.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                            <div>
                                <div class="table-user-name" style="font-weight: 600;">${d.name}</div>
                                <div class="table-user-email" style="font-size: 12px; color: var(--text-muted);">${d.email}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="tag tag-cat-generic">${d.role}</span></td>
                    <td style="text-align: center;">
                        <span style="font-weight: bold; color: var(--success); font-size: 16px;">${d.selesai}</span>
                        <div style="width: 60px; height: 4px; background: var(--bg-subtle); border-radius: 9999px; margin: 4px auto 0;">
                            <div style="height: 100%; width: ${pct}%; background: var(--success); border-radius: 9999px;"></div>
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: bold; color: var(--brand);">${d.berjalan}</td>
                    <td style="text-align: center; font-weight: bold; color: var(--text-secondary);">${d.total}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // ── 8. Main render ──────────────────────────────────────────────────────
    function renderAll() {
        applyChartDefaults();
        const data = buildData();
        renderLeaderboard(data);
        renderChartTopPerformers(data);
        renderChartCategory(data.catCounts);
        renderChartComparison(data);
    }

    renderAll();

    // Re-render on dark mode toggle
    new MutationObserver(() => renderAll())
        .observe(document.body, { attributeFilter: ["class"] });

    // Re-render on screen resize (orientation change, browser resize)
    // Debounced to avoid rapid re-renders
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => renderAll(), 250);
    });

    // Translate if language is English
    if (typeof Layout !== "undefined") {
        const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
        Layout.applyTranslation(savedLang);
    }

    // ── 9. Employee Detail Modal ────────────────────────────────────────────
    let employeeModal = document.getElementById("employee-detail-modal");
    if (!employeeModal) {
        employeeModal = document.createElement("div");
        employeeModal.id = "employee-detail-modal";
        employeeModal.className = "modal-overlay hidden";
        employeeModal.innerHTML = `
            <div class="modal-content modal-content-wide" style="max-width: 800px; max-height: 90vh; display: flex; flex-direction: column;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img id="emp-modal-avatar" src="" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <h3 id="emp-modal-name" style="margin:0; font-size: 18px;"></h3>
                            <div id="emp-modal-role" style="font-size: 13px; color: var(--text-muted); margin-top: 2px;"></div>
                        </div>
                    </div>
                    <button class="modal-close-btn" onclick="document.getElementById('employee-detail-modal').classList.add('hidden')">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div class="modal-body" style="overflow-y: auto; flex: 1; padding: 20px;">
                    <h4 style="margin-top: 0; margin-bottom: 16px; font-size: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">Daftar Tugas Karyawan</h4>
                    <div id="emp-modal-task-list" style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Tasks injected here -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(employeeModal);
        employeeModal.addEventListener("click", (e) => {
            if (e.target === employeeModal) employeeModal.classList.add("hidden");
        });
    }

    function formatWIB(dateStr) {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const options = {
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit",
                timeZone: "Asia/Jakarta", hour12: false
            };
            const formatter = new Intl.DateTimeFormat("id-ID", options);
            const parts = formatter.formatToParts(date);
            const day = parts.find(p => p.type === "day").value;
            const month = parts.find(p => p.type === "month").value;
            const year = parts.find(p => p.type === "year").value;
            const hour = parts.find(p => p.type === "hour").value;
            const minute = parts.find(p => p.type === "minute").value;
            return `${day}/${month}/${year} ${hour}:${minute} WIB`;
        } catch (e) {
            return dateStr;
        }
    }

    window.showEmployeeDetails = (empId) => {
        const emp = DB.users.find(u => u.id === empId);
        if (!emp) return;

        document.getElementById("emp-modal-avatar").src = emp.avatar;
        document.getElementById("emp-modal-name").textContent = emp.name;
        document.getElementById("emp-modal-role").textContent = emp.role;

        const empTasks = DB.tasks.filter(t => {
            const assignedIds = DB._parseAssignees(t.assignedTo);
            return assignedIds.includes(emp.id);
        });

        empTasks.sort((a, b) => {
            if (a.status === "In Progress" && b.status !== "In Progress") return -1;
            if (a.status !== "In Progress" && b.status === "In Progress") return 1;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        const taskListDiv = document.getElementById("emp-modal-task-list");
        if (empTasks.length === 0) {
            taskListDiv.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">Karyawan ini belum memiliki tugas.</div>`;
        } else {
            taskListDiv.innerHTML = empTasks.map(task => {
                const isRunning   = task.status === "In Progress";
                const isPaid      = task.status === "Paid";
                const isCompleted = task.status === "Completed";

                let statusBadge = "";
                if (isRunning)   statusBadge = `<span class="tag tag-status-running">Berjalan</span>`;
                else if (isCompleted) statusBadge = `<span class="tag tag-status-completed">Selesai</span>`;
                else if (isPaid) statusBadge = `<span class="tag" style="background-color: var(--success); color: white;">Sudah Dibayar</span>`;

                const prioClass = task.priority.toLowerCase();
                const progressUpdates = task.progressUpdates || [];
                let lastProgressHtml = "";
                if (progressUpdates.length > 0) {
                    const lastUpdate = progressUpdates[progressUpdates.length - 1];
                    const dateObj = new Date(lastUpdate.createdAt);
                    const formattedDate = dateObj.toLocaleDateString("id-ID", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                        timeZone: "Asia/Jakarta"
                    }).replace(/\./g, ":") + " WIB";
                    lastProgressHtml = `
                        <div style="margin-top: 12px; padding: 10px; background-color: var(--bg-subtle); border-radius: 6px; border-left: 3px solid var(--brand);">
                            <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-bottom: 4px; text-transform: uppercase;">Update Progress Terakhir (${formattedDate}):</div>
                            <div style="font-size: 13px; color: var(--text-primary); font-style: italic;">"${lastUpdate.text}"</div>
                        </div>
                    `;
                }

                return `
                    <div onclick="window.openTaskDetailModal('${task.id}')" class="hoverable-row"
                        style="padding: 16px; border: 1px solid var(--border); border-radius: var(--r-md);
                               background-color: var(--bg-card); cursor: pointer;
                               transition: transform 0.15s, box-shadow 0.15s;"
                        title="Klik untuk melihat detail penuh tugas ini">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <h5 style="margin: 0; font-size: 15px; color: var(--text-primary); font-weight: 600;">${task.title}</h5>
                            ${statusBadge}
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--text-secondary);">
                            <span>📅 Tenggat: <strong style="color: ${isRunning ? 'var(--danger)' : 'inherit'}">${formatWIB(task.deadline)}</strong></span>
                            <span>•</span>
                            <span>🏷️ <span class="tag tag-prio-${prioClass}" style="font-size: 11px;">${task.priority}</span></span>
                            <span>•</span>
                            <span>📂 ${task.category}</span>
                        </div>
                        ${lastProgressHtml}
                    </div>
                `;
            }).join("");
        }

        document.getElementById("employee-detail-modal").classList.remove("hidden");
    };
});
