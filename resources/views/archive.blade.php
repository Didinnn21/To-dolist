<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arsip Tugas - Dzhirasena</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Main Stylesheet -->
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
    <style>
        /* ── Mobile/Tablet Report switcher tabs ── */
        .report-switcher-tabs {
            display: none;
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
        
        @media (max-width: 1024px) {
            .report-switcher-tabs {
                display: flex;
            }
        }
    </style>
</head>

<body>
    <script>if(localStorage.getItem('dzhirasena_theme')==='dark') document.body.classList.add('dark-theme');</script>

    <!-- Container content for Layout.js to inject and wrap -->
    <div id="page-content">
        <!-- VIEW D: ARCHIVE / REPORTS -->
        <section id="archive-view" class="app-view">
            <h1 class="view-title">Arsip Tugas Selesai</h1>
            <p class="view-subtitle">Semua tugas yang telah diselesaikan oleh karyawan.</p>

            <!-- Mobile switcher tabs -->
            <div class="report-switcher-tabs">
                <a href="/archive" class="report-tab-btn active">Tugas Selesai</a>
                <a href="/archive-paid" class="report-tab-btn">Tugas Terbayar</a>
            </div>

            <div class="task-list-wrapper" id="archive-tasks-list">
                <!-- Populated dynamically -->
            </div>
            
            <div id="archive-pagination-container" class="pagination-container hidden">
                <!-- Pagination buttons will be injected here -->
            </div>

            <div class="empty-state-card">
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="#6b7280" stroke-width="1.5" fill="none">
                        <polyline points="21 8 21 21 3 21 3 8"></polyline>
                        <rect x="1" y="3" width="22" height="5"></rect>
                    </svg>
                </div>
                <h3>Belum Ada Tugas Diarsipkan</h3>
                <p>Tugas yang telah selesai dalam jangka panjang akan diarsipkan di sini untuk mempermudah monitoring
                    berkala.</p>
            </div>
        </section>
    </div>

    <!-- Shared Scripts -->
    <script src="{{ asset('js/db.js') }}"></script>
    <script src="{{ asset('js/auth.js') }}"></script>
    <script src="{{ asset('js/layout.js') }}"></script>

    <!-- Page Logic -->
    <script src="{{ asset('js/archive.js') }}"></script>
</body>

</html>
