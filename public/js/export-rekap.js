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

    // Format Priority Helper
    formatPriority(val) {
        if (!val) return 'Sedang';
        const isEn = (localStorage.getItem('dzhirasena_lang') === 'en');
        const v = String(val).trim().toLowerCase();
        if (v === 'high' || v === 'tinggi') return isEn ? 'High' : 'Tinggi';
        if (v === 'medium' || v === 'sedang') return isEn ? 'Medium' : 'Sedang';
        if (v === 'low' || v === 'rendah') return isEn ? 'Low' : 'Rendah';
        return val;
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

    // Build Word-compatible HTML string using pure tables (No flexbox)
    buildWordHtml(data) {
        const dateFormatted = this.formatDate(data.generatedAt);
        const timeFormatted = data.generatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        return `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <title>Rekapitulasi Laporan Lengkap Tim - Dzhirasena</title>
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>100</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #1e293b;
                    background-color: #ffffff;
                    margin: 0;
                    padding: 20px;
                }
                .company-header-table {
                    width: 100%;
                    border-bottom: 3px double #2563eb;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                }
                .company-title {
                    font-size: 22px;
                    font-weight: bold;
                    color: #2563eb;
                    margin: 0;
                }
                .report-subtitle {
                    font-size: 13px;
                    font-weight: bold;
                    color: #475569;
                    margin-top: 4px;
                }
                .meta-text {
                    font-size: 11px;
                    color: #64748b;
                    text-align: right;
                }
                .section-header {
                    font-size: 14px;
                    font-weight: bold;
                    color: #0f172a;
                    background-color: #f1f5f9;
                    padding: 8px 10px;
                    margin-top: 20px;
                    margin-bottom: 10px;
                    border-left: 4px solid #2563eb;
                }
                .metrics-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .metrics-table td {
                    width: 25%;
                    padding: 10px;
                    background-color: #f8fafc;
                    border: 1px solid #cbd5e1;
                    text-align: center;
                }
                .metric-label {
                    font-size: 10px;
                    font-weight: bold;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .metric-value {
                    font-size: 16px;
                    font-weight: bold;
                    color: #1e293b;
                    margin-top: 4px;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 11px;
                }
                .data-table th {
                    background-color: #e2e8f0;
                    color: #1e293b;
                    font-weight: bold;
                    padding: 8px;
                    border: 1px solid #cbd5e1;
                    text-align: left;
                }
                .data-table td {
                    padding: 8px;
                    border: 1px solid #e2e8f0;
                    vertical-align: middle;
                }
                .badge {
                    padding: 3px 6px;
                    font-weight: bold;
                    font-size: 10px;
                }
                .sign-table {
                    width: 100%;
                    margin-top: 40px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <table class="company-header-table">
                <tr>
                    <td style="border:none;">
                        <div class="company-title">DZHIRASENA MANAGEMENT</div>
                        <div class="report-subtitle">REKAPITULASI LAPORAN KINERJA, TUGAS & HONORARIUM (ALL ACCOUNTS)</div>
                    </td>
                    <td class="meta-text" style="border:none;">
                        <div>Tanggal Cetak: <strong>${dateFormatted} ${timeFormatted}</strong></div>
                        <div>Dicetak Oleh: <strong>${data.generatedBy} (Admin)</strong></div>
                    </td>
                </tr>
            </table>

            <div class="section-header">1. RINGKASAN EKSEKUTIF UTAMA</div>
            <table class="metrics-table">
                <tr>
                    <td>
                        <div class="metric-label">Total Akun Terdaftar</div>
                        <div class="metric-value" style="color:#2563eb;">${data.totalUsers} Akun (${data.totalStaff} Karyawan)</div>
                    </td>
                    <td>
                        <div class="metric-label">Total Tugas Keseluruhan</div>
                        <div class="metric-value">${data.totalTasks} Tugas</div>
                    </td>
                    <td>
                        <div class="metric-label">Tugas Selesai / Lunas</div>
                        <div class="metric-value" style="color:#16a34a;">${data.totalCompleted} Tugas</div>
                    </td>
                    <td>
                        <div class="metric-label">Total Honor & DP Terbayar</div>
                        <div class="metric-value" style="color:#16a34a;">${this.formatRupiah(data.totalHonorPaidout)}</div>
                    </td>
                </tr>
            </table>

            <div class="section-header">2. REKAPITULASI KINERJA PER KARYAWAN</div>
            <table class="data-table">
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
                        <tr ${i % 2 === 1 ? 'style="background-color:#f8fafc;"' : ''}>
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

            <div class="section-header">3. RINCIAN SELURUH TUGAS TIM</div>
            <table class="data-table">
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
                        let statusText = "🔄 Masih Proses";
                        let statusColor = "#d97706";
                        if (t.status === "Paid") {
                            statusText = "💵 Lunas";
                            statusColor = "#16a34a";
                        } else if (t.status === "Completed") {
                            statusText = "✅ Selesai";
                            statusColor = "#0284c7";
                        } else if (amt > 0) {
                            statusText = "💰 DP Terbayar";
                            statusColor = "#2563eb";
                        }

                        let terminBreakdown = '';
                        if (t.paymentHistory && t.paymentHistory.length > 0) {
                            terminBreakdown = `<br><span style="font-size:9px; color:#475569; font-weight:normal;">` +
                                t.paymentHistory.map(h => `Termin ${h.stage}: ${this.formatRupiah(h.amount)}`).join(' | ') +
                                `</span>`;
                        }

                        return `
                            <tr ${i % 2 === 1 ? 'style="background-color:#f8fafc;"' : ''}>
                                <td style="text-align:center;">${i + 1}</td>
                                <td><strong>${t.title}</strong></td>
                                <td>${t.category || 'General'}</td>
                                <td>${this.formatPriority(t.priority)}</td>
                                <td>${assigneeNames}</td>
                                <td style="text-align:center; font-weight:bold; color:${statusColor};">${statusText}</td>
                                <td style="text-align:right; font-weight:bold; color:${amt > 0 ? '#16a34a' : '#64748b'};">
                                    ${this.formatRupiah(amt)}${terminBreakdown}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <table class="sign-table">
                <tr>
                    <td style="width:50%; text-align:center; border:none;">
                        <div>Mengetahui,</div>
                        <div><strong>Atasan / Supervisor</strong></div>
                        <br><br><br><br>
                        <div>( ____________________ )</div>
                    </td>
                    <td style="width:50%; text-align:center; border:none;">
                        <div>Dibuat Oleh,</div>
                        <div><strong>Administrator System</strong></div>
                        <br><br><br><br>
                        <div>( <strong>${data.generatedBy}</strong> )</div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;
    },

    // ── 1. EXPORT TO WORD (.doc) ─────────────────────────────────────────────
    exportToWord() {
        if (!Auth.currentUser || Auth.currentUser.role !== "Admin") {
            if (window.showToast) window.showToast("Akses ditolak: Hanya Admin yang dapat mengunduh rekapan.", "error");
            return;
        }

        const data = this.getReportData();
        const htmlContent = this.buildWordHtml(data);

        // Save as .doc format with UTF-8 byte order mark to prevent MS Word recovery warning
        const blob = new Blob(['\ufeff', htmlContent], {
            type: 'application/msword;charset=utf-8'
        });

        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `Rekapan_Laporan_Lengkap_Dzhirasena_${dateStr}.doc`;

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
        const htmlContent = this.buildWordHtml(data);

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
                    📄 Export Word (.doc)
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
