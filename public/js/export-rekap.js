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
                    font-family: 'Segoe UI', Arial, sans-serif;
                    color: #0f172a;
                    background-color: #ffffff;
                    margin: 0;
                    padding: 24px;
                    font-size: 11px;
                    line-height: 1.5;
                }
                .company-header-table {
                    width: 100%;
                    border-bottom: 3px solid #1e40af;
                    margin-bottom: 24px;
                    padding-bottom: 14px;
                }
                .company-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: #1e40af;
                    letter-spacing: 0.5px;
                    margin: 0;
                }
                .report-subtitle {
                    font-size: 12px;
                    font-weight: 700;
                    color: #475569;
                    margin-top: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .meta-card {
                    background-color: #f8fafc;
                    border: 1px solid #cbd5e1;
                    padding: 8px 14px;
                    font-size: 11px;
                    color: #334155;
                    border-radius: 4px;
                }
                .section-header {
                    font-size: 13px;
                    font-weight: bold;
                    color: #ffffff;
                    background-color: #1e293b;
                    padding: 8px 12px;
                    margin-top: 24px;
                    margin-bottom: 12px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .metrics-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 8px 0;
                    margin-bottom: 24px;
                }
                .metrics-card {
                    padding: 12px;
                    background-color: #f8fafc;
                    border: 1px solid #cbd5e1;
                    border-top: 4px solid #1e40af;
                    text-align: center;
                }
                .metric-label {
                    font-size: 9.5px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .metric-value {
                    font-size: 17px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-top: 6px;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 24px;
                    font-size: 11px;
                }
                .data-table th {
                    background-color: #334155;
                    color: #ffffff;
                    font-weight: 700;
                    padding: 9px 10px;
                    border: 1px solid #334155;
                    text-align: left;
                    font-size: 10.5px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .data-table td {
                    padding: 9px 10px;
                    border: 1px solid #e2e8f0;
                    vertical-align: middle;
                }
                .badge-paid {
                    color: #15803d;
                    background-color: #dcfce7;
                    padding: 3px 8px;
                    font-weight: bold;
                    border-radius: 4px;
                    font-size: 10px;
                }
                .badge-completed {
                    color: #0369a1;
                    background-color: #e0f2fe;
                    padding: 3px 8px;
                    font-weight: bold;
                    border-radius: 4px;
                    font-size: 10px;
                }
                .badge-process {
                    color: #b45309;
                    background-color: #fef3c7;
                    padding: 3px 8px;
                    font-weight: bold;
                    border-radius: 4px;
                    font-size: 10px;
                }
                .badge-termin {
                    color: #1d4ed8;
                    background-color: #eff6ff;
                    padding: 3px 8px;
                    font-weight: bold;
                    border-radius: 4px;
                    font-size: 10px;
                }
                .termin-history-box {
                    margin-top: 4px;
                    padding-top: 4px;
                    border-top: 1px dashed #cbd5e1;
                    font-size: 9.5px;
                    color: #475569;
                }
                .sign-table {
                    width: 100%;
                    margin-top: 50px;
                    font-size: 11px;
                }
            </style>
        </head>
        <body>
            <table class="company-header-table">
                <tr>
                    <td style="border:none; vertical-align:middle;">
                        <div class="company-title">DZHIRASENA MANAGEMENT</div>
                        <div class="report-subtitle">Laporan Rekapitulasi Kinerja, Tugas & Honorarium Tim</div>
                    </td>
                    <td style="border:none; width:260px; vertical-align:middle;">
                        <div class="meta-card">
                            <div>Tanggal Cetak: <strong>${dateFormatted} ${timeFormatted}</strong></div>
                            <div>Dicetak Oleh: <strong>${data.generatedBy} (Admin)</strong></div>
                            <div>Status Dokumen: <strong>Resmi / Official</strong></div>
                        </div>
                    </td>
                </tr>
            </table>

            <div class="section-header">1. Ringkasan Eksekutif Utama</div>
            <table class="metrics-table">
                <tr>
                    <td class="metrics-card">
                        <div class="metric-label">Total Akun Terdaftar</div>
                        <div class="metric-value" style="color:#1e40af;">${data.totalUsers} Akun</div>
                        <div style="font-size:9.5px; color:#64748b; margin-top:2px;">(${data.totalStaff} Karyawan Staff)</div>
                    </td>
                    <td class="metrics-card">
                        <div class="metric-label">Total Tugas Keseluruhan</div>
                        <div class="metric-value">${data.totalTasks} Tugas</div>
                        <div style="font-size:9.5px; color:#64748b; margin-top:2px;">(Seluruh Tim)</div>
                    </td>
                    <td class="metrics-card">
                        <div class="metric-label">Tugas Selesai / Lunas</div>
                        <div class="metric-value" style="color:#16a34a;">${data.totalCompleted} Tugas</div>
                        <div style="font-size:9.5px; color:#16a34a; margin-top:2px;">(${data.totalTasks > 0 ? Math.round((data.totalCompleted / data.totalTasks) * 100) : 0}% Tingkat Penyelesaian)</div>
                    </td>
                    <td class="metrics-card">
                        <div class="metric-label">Total Honor Terbayar</div>
                        <div class="metric-value" style="color:#16a34a;">${this.formatRupiah(data.totalHonorPaidout)}</div>
                        <div style="font-size:9.5px; color:#16a34a; margin-top:2px;">(Akumulasi Pembayaran)</div>
                    </td>
                </tr>
            </table>

            <div class="section-header">2. Rekapitulasi Kinerja Per Karyawan</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:30px; text-align:center;">No</th>
                        <th>Nama Karyawan</th>
                        <th>Email</th>
                        <th>Role / Jabatan</th>
                        <th style="text-align:center;">Total Tugas</th>
                        <th style="text-align:center;">Selesai / Lunas</th>
                        <th style="text-align:center;">Masih Proses</th>
                        <th style="text-align:right;">Total Honor Dibayar</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.employeeData.map((emp, i) => `
                        <tr ${i % 2 === 1 ? 'style="background-color:#f8fafc;"' : ''}>
                            <td style="text-align:center; font-weight:bold;">${i + 1}</td>
                            <td><strong>${emp.name}</strong></td>
                            <td style="color:#475569;">${emp.email}</td>
                            <td><span style="background:#e2e8f0; padding:2px 6px; border-radius:3px; font-weight:600; font-size:10px;">${emp.role}</span></td>
                            <td style="text-align:center; font-weight:bold;">${emp.totalTasks}</td>
                            <td style="text-align:center; font-weight:bold; color:#16a34a;">${emp.completed}</td>
                            <td style="text-align:center; font-weight:bold; color:#d97706;">${emp.running}</td>
                            <td style="text-align:right; font-weight:bold; color:#16a34a;">${this.formatRupiah(emp.honorAmt)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="section-header">3. Rincian Seluruh Tugas & Riwayat Pembayaran Honor</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:30px; text-align:center;">No</th>
                        <th>Judul Tugas & Kategori</th>
                        <th style="text-align:center;">Prioritas</th>
                        <th>Penanggung Jawab</th>
                        <th style="text-align:center;">Status Tugas</th>
                        <th style="text-align:right;">Nominal & Riwayat Honor</th>
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
                        let statusBadge = `<span class="badge-process">🔄 Masih Proses</span>`;
                        if (t.status === "Paid") {
                            statusBadge = `<span class="badge-paid">💵 Lunas</span>`;
                        } else if (t.status === "Completed") {
                            statusBadge = `<span class="badge-completed">✅ Selesai</span>`;
                        } else if (amt > 0) {
                            statusBadge = `<span class="badge-termin">💰 Termin Terbayar</span>`;
                        }

                        let historyHtml = '';
                        if (t.paymentHistory && t.paymentHistory.length > 0) {
                            historyHtml = `<div class="termin-history-box">` +
                                t.paymentHistory.map(h => `• ${h.note || ('Termin ' + h.stage)}: ${this.formatRupiah(h.amount)}`).join('<br>') +
                                `</div>`;
                        }

                        return `
                            <tr ${i % 2 === 1 ? 'style="background-color:#f8fafc;"' : ''}>
                                <td style="text-align:center; font-weight:bold;">${i + 1}</td>
                                <td>
                                    <strong>${t.title}</strong>
                                    <div style="font-size:9.5px; color:#64748b; margin-top:2px;">Kategori: ${t.category || 'General'}</div>
                                </td>
                                <td style="text-align:center;">
                                    <span style="font-weight:600; font-size:10px;">${this.formatPriority(t.priority)}</span>
                                </td>
                                <td><strong>${assigneeNames}</strong></td>
                                <td style="text-align:center;">${statusBadge}</td>
                                <td style="text-align:right;">
                                    <div style="font-weight:bold; color:${amt > 0 ? '#16a34a' : '#64748b'}; font-size:11.5px;">${this.formatRupiah(amt)}</div>
                                    ${historyHtml}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <br>
            <table class="sign-table">
                <tr>
                    <td style="width:50%; text-align:center; border:none;">
                        <div>Mengetahui,</div>
                        <div style="font-weight:bold; margin-top:2px;">Atasan / Supervisor</div>
                        <br><br><br><br>
                        <div>( ____________________ )</div>
                    </td>
                    <td style="width:50%; text-align:center; border:none;">
                        <div>Dibuat Oleh,</div>
                        <div style="font-weight:bold; margin-top:2px;">Administrator System</div>
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
