<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Kinerja - Dzhirasena</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
    <style>
        /* ────────────────────────────────────────────────
           LAPORAN PAGE – LOCAL STYLES
        ──────────────────────────────────────────────── */

        /* Grid: 2 cols desktop, 1 col mobile */
        #charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
            /* Critical: prevents grid children from overflowing */
            min-width: 0;
        }
        #charts-grid > * {
            /* Each cell must NOT expand beyond its column */
            min-width: 0;
            overflow: hidden;
        }
        .chart-card-wide { grid-column: span 2; }

        @media (max-width: 1024px) {
            #charts-grid { grid-template-columns: 1fr; gap: 12px; }
            .chart-card-wide { grid-column: span 1; }
        }

        /* Chart card shell */
        .chart-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--r-lg);
            box-shadow: var(--shadow-xs);
            padding: 16px;
            /* Do NOT use overflow:hidden here — breaks Chart.js sizing */
            overflow: visible;
        }

        /* Chart wrapper: explicit height so Chart.js can size itself */
        .chart-wrap {
            position: relative;
            width: 100%;
            height: 260px;
            /* Contain the canvas */
            overflow: hidden;
        }
        .chart-wrap-wide {
            position: relative;
            width: 100%;
            height: 220px;
            overflow: hidden;
        }
        /* Make the canvas always fill wrapper */
        .chart-wrap canvas,
        .chart-wrap-wide canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
        }

        @media (max-width: 1024px) {
            .chart-wrap      { height: 220px; }
            .chart-wrap-wide { height: 190px; }
        }
        @media (max-width: 600px) {
            .chart-wrap      { height: 180px; }
            .chart-wrap-wide { height: 160px; }
        }
        @media (max-width: 400px) {
            .chart-wrap      { height: 155px; }
            .chart-wrap-wide { height: 140px; }
        }

        /* Chart card header */
        .chart-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 6px;
        }
        .chart-card-header h3 {
            margin: 0;
            font-size: 13px;
            font-weight: 700;
            color: var(--text-primary);
        }
        .chart-card-header p {
            margin: 2px 0 0;
            font-size: 11px;
            color: var(--text-secondary);
        }
        .chart-legend-inline {
            display: flex;
            gap: 10px;
            align-items: center;
            font-size: 11px;
            flex-wrap: wrap;
            color: var(--text-secondary);
        }
        .chart-legend-dot {
            display: inline-block;
            width: 9px; height: 9px;
            border-radius: 2px;
            margin-right: 3px;
            vertical-align: middle;
        }

        /* ── Leaderboard Table Responsive ── */
        .table-responsive {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
        #leaderboard-table {
            width: 100% !important;
            min-width: 580px !important;
            border-collapse: collapse;
        }
        #leaderboard-table th, 
        #leaderboard-table td {
            white-space: nowrap;
        }

        /* Metric cards on laporan */
        .metric-card { cursor: default; }
        .metric-value {
            font-family: 'Outfit', sans-serif;
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-top: 4px;
        }
        .metric-title {
            font-size: 0.8125rem;
            font-weight: 500;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .text-success { color: var(--success) !important; }
        .text-primary { color: var(--brand) !important; }

        /* ── Mobile/Tablet Report switcher tabs ── */
        .report-switcher-tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1.5px solid var(--border);
            gap: 16px;
            padding-bottom: 2px;
        }
        .report-tab-btn {
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 500;
            padding: 8px 12px 12px;
            cursor: pointer;
            text-decoration: none;
            position: relative;
            transition: all var(--transition);
        }
        .report-tab-btn:hover {
            color: var(--brand);
        }
        .report-tab-btn.active {
            color: var(--brand);
            font-weight: 700;
        }
        .report-tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: -2.5px;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--brand);
            border-radius: 99px;
        }
    </style>
</head>

<body>
    <script>if(localStorage.getItem('dzhirasena_theme')==='dark') document.body.classList.add('dark-theme');</script>

    <div id="page-content">
        <section id="laporan-view" class="app-view">
            <div class="view-header-row">
                <div>
                    <h1 class="view-title">Laporan Kinerja</h1>
                    <p class="view-subtitle">Analitik dan papan peringkat penyelesaian tugas karyawan.</p>
                </div>
            </div>

            <!-- Mobile switcher tabs -->
            <div class="report-switcher-tabs">
                <a href="/laporan" class="report-tab-btn active">Laporan Kinerja</a>
                <a href="/laporan-honor" class="report-tab-btn">Laporan Honor</a>
            </div>

            <!-- Metrics -->
            <div class="metrics-grid" style="margin-bottom: 20px;">
                <div class="metric-card">
                    <h3 class="metric-title">Total Anggota Tim</h3>
                    <div class="metric-value" id="metric-total-users">0</div>
                </div>
                <div class="metric-card">
                    <h3 class="metric-title">Total Tugas Selesai</h3>
                    <div class="metric-value text-success" id="metric-total-completed">0</div>
                </div>
                <div class="metric-card">
                    <h3 class="metric-title">Total Tugas Berjalan</h3>
                    <div class="metric-value text-primary" id="metric-total-running">0</div>
                </div>
            </div>

            <!-- ── CHARTS SECTION ── -->
            <div id="charts-grid">

                <!-- Chart 1: Top Performers -->
                <div class="chart-card">
                    <div class="chart-card-header">
                        <div>
                            <h3>🏆 Top Karyawan</h3>
                            <p>Berdasarkan tugas diselesaikan</p>
                        </div>
                    </div>
                    <div class="chart-wrap">
                        <canvas id="chart-top-performers"></canvas>
                    </div>
                </div>

                <!-- Chart 2: Category Donut -->
                <div class="chart-card">
                    <div class="chart-card-header">
                        <div>
                            <h3>📂 Distribusi Kategori</h3>
                            <p>Kategori paling banyak dikerjakan</p>
                        </div>
                    </div>
                    <div class="chart-wrap">
                        <canvas id="chart-category"></canvas>
                    </div>
                </div>

                <!-- Chart 3: Comparison (full width) -->
                <div class="chart-card chart-card-wide">
                    <div class="chart-card-header">
                        <div>
                            <h3>📊 Perbandingan Tugas per Karyawan</h3>
                            <p>Tugas berjalan vs selesai tiap anggota tim</p>
                        </div>
                        <div class="chart-legend-inline">
                            <span><span class="chart-legend-dot" style="background:#3B82F6;"></span>Berjalan</span>
                            <span><span class="chart-legend-dot" style="background:#10B981;"></span>Selesai</span>
                        </div>
                    </div>
                    <div class="chart-wrap-wide">
                        <canvas id="chart-employee-comparison"></canvas>
                    </div>
                </div>

            </div>
            <!-- ── END CHARTS ── -->

            <!-- Leaderboard Table -->
            <div class="chart-card" style="padding: 0; overflow: hidden;">
                <div style="padding: 16px 18px; border-bottom: 1px solid var(--border);">
                    <h3 style="margin:0; font-size: 14px; font-weight: 700;">🏅 Papan Peringkat (Leaderboard)</h3>
                </div>
                <!-- table-responsive gives scroll on wide screens; card on small screens via CSS above -->
                <div class="table-responsive">
                    <table class="user-table" id="leaderboard-table">
                        <thead>
                            <tr>
                                <th style="width:60px;">Rank</th>
                                <th>Karyawan</th>
                                <th>Posisi</th>
                                <th style="text-align:center; width:70px;">Selesai</th>
                                <th style="text-align:center; width:70px;">Berjalan</th>
                                <th style="text-align:center; width:60px;">Total</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboard-list"></tbody>
                    </table>
                </div>
            </div>

        </section>
    </div>

    <script src="{{ asset('js/db.js') }}"></script>
    <script src="{{ asset('js/auth.js') }}"></script>
    <script src="{{ asset('js/layout.js') }}"></script>
    <script src="{{ asset('js/laporan.js') }}"></script>
</body>

</html>
