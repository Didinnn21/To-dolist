// ==========================================================================
// DZHIRASENA - EXPORT REKAPITULASI LAPORAN (WORD & PDF) - ADMIN ONLY
// Modul untuk mengekspor rekapitulasi data lengkap seluruh akun tim
// ==========================================================================

const ExportRekap = {
    // Format Currency Helper
    formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka || 0);
    },

    // Format Date Helper
    formatDate(dateStr) {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },

    // Gather all comprehensive data across the system
    getReportData() {
        const users = DB.users || [];
        const tasks = DB.tasks || [];

        const staffUsers = users.filter(u => u.role !== "Admin" && u.role !== "Atasan" && u.role !== "Project Manager");
        
        let totalCompleted = 0;
        let totalRunning = 0;
        let totalPaid = 0;
        let totalHonorPaidout = 0;

        tasks.forEach(t => {
            const amt = Number(t.honorAmount) || 0;
            totalHonorPaidout += amt;
            if (t.status === "Completed") totalCompleted++;
            else if (t.status === "Paid") {
                totalCompleted++;
                totalPaid++;
            } else totalRunning++;
        });

        // Map employee performance data
        const employeeData = staffUsers.map(emp => {
            const empTasks = tasks.filter(t => {
                const assignedIds = DB._parseAssignees(t.assignedTo);
                return assignedIds.includes(emp.id);
            });

            const completed = empTasks.filter(t => t.status === "Completed" || t.status === "Paid").length;
            const running = empTasks.filter(t => t.status === "In Progress" || t.status === "Pending" || t.status === "Todo").length;
            let honorAmt = 0;
            empTasks.forEach(t => { honorAmt += Number(t.honorAmount) || 0; });

            return {
                id: emp.id,
                name: emp.name,
                email: emp.email,
                role: emp.role,
                totalTasks: empTasks.length,
                completed,
                running,
                honorAmt
            };
        });

        return {
            users,
            staffUsers,
            tasks,
            totalUsers: users.length,
            totalStaff: staffUsers.length,
            totalTasks: tasks.length,
            totalCompleted,
            totalRunning,
            totalPaid,
            totalHonorPaidout,
            employeeData,
            generatedAt: new Date(),
            generatedBy: Auth.currentUser ? Auth.currentUser.name : "Admin"
        };
    },

    // Build standard clean HTML report string
    buildHtmlReport(data) {
        const dateFormatted = this.formatDate(data.generatedAt);
        const timeFormatted = data.generatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Rekapitulasi Laporan Lengkap Tim - Dzhirasena</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        color: #1e293b;
                        background: #ffffff;
                        line-height: 1.5;
                        margin: 0;
                        padding: 24px;
                    }
                    .report-header {
                        border-bottom: 3px double #2563eb;
                        padding-bottom: 16px;
                        margin-bottom: 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    .company-title {
                        font-size: 24px;
                        font-weight: 800;
                        color: #2563eb;
                        letter-spacing: -0.5px;
                        margin: 0;
                    }
                    .report-subtitle {
                        font-size: 14px;
                        font-weight: 700;
                        color: #475569;
                        margin: 4px 0 0 0;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .report-meta {
                        font-size: 11px;
                        color: #64748b;
                        text-align: right;
                    }
                    .section-title {
                        font-size: 15px;
                        font-weight: 700;
                        color: #0f172a;
                        margin: 24px 0 12px 0;
                        padding-bottom: 6px;
                        border-bottom: 1.5px solid #e2e8f0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .metrics-grid {
                        display: table;
                        width: 100%;
                        margin-bottom: 20px;
                    }
                    .metric-box {
                        display: table-cell;
                        width: 25%;
                        padding: 12px;
                        background: #f8fafc;
                        border: 1px solid #cbd5e1;
                        border-radius: 6px;
                        text-align: center;
                    }
                    .metric-box-title {
                        font-size: 10px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .metric-box-val {
                        font-size: 18px;
                        font-weight: 800;
                        color: #1e293b;
                        margin-top: 4px;
                    }
                    .val-blue { color: #2563eb; }
                    .val-green { color: #16a34a; }
                    .val-orange { color: #d97706; }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 24px;
                        font-size: 12px;
                    }
                    th {
                        background: #f1f5f9;
                        color: #334155;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: 10px;
                        letter-spacing: 0.5px;
                        padding: 8px 10px;
                        border: 1px solid #cbd5e1;
                        text-align: left;
                    }
                    td {
                        padding: 8px 10px;
                        border: 1px solid #e2e8f0;
                        vertical-align: middle;
                    }
                    tr:nth-child(even) { background: #f8fafc; }
                    
                    .badge {
                        display: inline-block;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: 700;
                    }
                    .badge-proses { background: #fef3c7; color: #b45309; }
                    .badge-dp { background: #eff6ff; color: #1d4ed8; }
                    .badge-selesai { background: #e0f2fe; color: #0369a1; }
                    .badge-lunas { background: #dcfce7; color: #15803d; }
                    
                    .footer-sign {
                        margin-top: 40px;
                        display: flex;
                        justify-content: space-between;
                        page-break-inside: avoid;
                    }
                    .sign-box {
                        width: 200px;
                        text-align: center;
                        font-size: 12px;
                    }
                    .sign-space {
                        height: 60px;
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <div>
                        <h1 class="company-title">DZHIRASENA MANAGEMENT</h1>
                        <div class="report-subtitle">REKAPITULASI LAPORAN KINERJA, TUGAS & HONORARIUM (ALL ACCOUNTS)</div>
                    </div>
                    <div class="report-meta">
                        <div>Tanggal Cetak: <strong>${dateFormatted} ${timeFormatted}</strong></div>
                        <div>Dicetak Oleh: <strong>${data.generatedBy} (Admin)</strong></div>
                    </div>
                </div>

                <div class="section-title">📊 1. RINGKASAN EKSEKUTIF UTAMA</div>
                <div class="metrics-grid">
                    <div class="metric-box">
                        <div class="metric-box-title">Total Akun Terdaftar</div>
                        <div class="metric-box-val val-blue">${data.totalUsers} Akun (${data.totalStaff} Karyawan)</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-box-title">Total Tugas Keseluruhan</div>
                        <div class="metric-box-val">${data.totalTasks} Tugas</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-box-title">Tugas Selesai / Lunas</div>
                        <div class="metric-box-val val-green">${data.totalCompleted} Tugas</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-box-title">Total Honor & DP Terbayar</div>
                        <div class="metric-box-val val-green">${this.formatRupiah(data.totalHonorPaidout)}</div>
                    </div>
                </div>

                <div class="section-title">👥 2. REKAPITULASI KINERJA PER KARYAWAN</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width:30px; text-align:center;">No</th>
                            <th>Nama Karyawan</th>
                            <th>Email</th>
                            <th>Role / Jabatan</th>
                            <th style="text-align:center;">Total Tugas</th>
                            <th style="text-align:center;">Selesai</th>
                            <th style="text-align:center;">Masih Proses</th>
                            <th style="text-align:right;">Total Honor/DP Dibayar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.employeeData.map((emp, i) => `
                            <tr>
                                <td style="text-align:center;">${i + 1}</td>
                                <td><strong>${emp.name}</strong></td>
                                <td>${emp.email}</td>
                                <td>${emp.role}</td>
                                <td style="text-align:center;">${emp.totalTasks}</td>
                                <td style="text-align:center; font-weight:bold; color:#16a34a;">${emp.completed}</td>
                                <td style="text-align:center; font-weight:bold; color:#d97706;">${emp.running}</td>
                                <td style="text-align:right; font-weight:bold; color:#16a34a;">${this.formatRupiah(emp.honorAmt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="section-title">📋 3. RINCIAN SELURUH TUGAS TIM</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width:30px; text-align:center;">No</th>
                            <th>Judul Tugas</th>
                            <th>Kategori</th>
                            <th>Prioritas</th>
                            <th>Penanggung Jawab</th>
                            <th style="text-align:center;">Status Tugas</th>
                            <th style="text-align:right;">Nominal Honor / DP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.tasks.map((t, i) => {
                            const assignees = DB._parseAssignees(t.assignedTo);
                            const assigneeNames = assignees.map(id => {
                                const u = DB.users.find(usr => usr.id === id);
                                return u ? u.name : id;
                            }).join(', ') || '-';

                            const amt = Number(t.honorAmount) || 0;
                            let statusBadge = `<span class="badge badge-proses">🔄 Masih Proses</span>`;
                            if (t.status === "Paid") {
                                statusBadge = `<span class="badge badge-lunas">💵 Lunas</span>`;
                            } else if (t.status === "Completed") {
                                statusBadge = `<span class="badge badge-selesai">✅ Selesai</span>`;
                            } else if (amt > 0) {
                                statusBadge = `<span class="badge badge-dp">💰 DP Terbayar</span>`;
                            }

                            return `
                                <tr>
                                    <td style="text-align:center;">${i + 1}</td>
                                    <td><strong>${t.title}</strong></td>
                                    <td>${t.category || 'General'}</td>
                                    <td>${t.priority}</td>
                                    <td>${assigneeNames}</td>
                                    <td style="text-align:center;">${statusBadge}</td>
                                    <td style="text-align:right; font-weight:bold; color:${amt > 0 ? '#16a34a' : '#64748b'};">${this.formatRupiah(amt)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <div class="footer-sign">
                    <div class="sign-box">
                        <div>Mengetahui,</div>
                        <div><strong>Atasan / Supervisor</strong></div>
                        <div class="sign-space"></div>
                        <div>( ____________________ )</div>
                    </div>
                    <div class="sign-box">
                        <div>Dibuat Oleh,</div>
                        <div><strong>Administrator System</strong></div>
                        <div class="sign-space"></div>
                        <div>( <strong>${data.generatedBy}</strong> )</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    },

    // ── 1. EXPORT TO WORD (.docx) ─────────────────────────────────────────────
    exportToWord() {
        if (!Auth.currentUser || Auth.currentUser.role !== "Admin") {
            if (window.showToast) window.showToast("Akses ditolak: Hanya Admin yang dapat mengunduh rekapan.", "error");
            return;
        }

        const data = this.getReportData();
        const htmlContent = this.buildHtmlReport(data);

        // Standard Office HTML format that MS Word opens directly as a docx document
        const wordDocument = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Rekapan Laporan Lengkap</title>
                <!--[if gte mso 9]>
                <xml>
                <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
                </xml>
                <![endif]-->
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', wordDocument], {
            type: 'application/msword'
        });

        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `Rekapan_Laporan_Lengkap_Dzhirasena_${dateStr}.docx`;

        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        if (window.showToast) window.showToast(`Rekapan laporan Word (${fileName}) berhasil diunduh.`, 'success');
    },

    // ── 2. EXPORT TO PDF (.pdf) ──────────────────────────────────────────────
    exportToPdf() {
        if (!Auth.currentUser || Auth.currentUser.role !== "Admin") {
            if (window.showToast) window.showToast("Akses ditolak: Hanya Admin yang dapat mengunduh rekapan.", "error");
            return;
        }

        const data = this.getReportData();
        const htmlContent = this.buildHtmlReport(data);

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            if (window.showToast) window.showToast("Gagal membuka jendela cetak. Izinkan pop-up di browser Anda.", "error");
            return;
        }

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Trigger print after resources load
        printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 300);
        };

        if (window.showToast) window.showToast("Jendela cetak PDF berhasil dibuka. Silakan pilih 'Simpan sebagai PDF'.", 'info');
    },

    // Render Admin Export Button Bar into container element
    renderExportButtons(containerId) {
        if (!Auth.currentUser || Auth.currentUser.role !== "Admin") return;

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Export Rekapan (Admin):</span>
                <button class="btn btn-secondary btn-sm" id="btn-export-word" style="border-color: #2563eb; color: #2563eb; font-weight: 600; padding: 6px 12px; gap: 5px;">
                    📄 Export Word (.docx)
                </button>
                <button class="btn btn-primary btn-sm" id="btn-export-pdf" style="background: #2563eb; font-weight: 600; padding: 6px 12px; gap: 5px;">
                    📑 Export PDF
                </button>
            </div>
        `;

        const btnWord = container.querySelector("#btn-export-word");
        const btnPdf = container.querySelector("#btn-export-pdf");

        if (btnWord) btnWord.addEventListener("click", () => this.exportToWord());
        if (btnPdf) btnPdf.addEventListener("click", () => this.exportToPdf());
    }
};
