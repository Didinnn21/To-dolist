<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Honor - Dzhirasena</title>
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
    <script>if(localStorage.getItem('dzhirasena_lang')==='en'){ /* handle lang */ } if(localStorage.getItem('dzhirasena_theme')==='dark') document.body.classList.add('dark-theme');</script>

    <!-- Container content for Layout.js to inject and wrap -->
    <div id="page-content">
        <section id="honor-view" class="app-view">
            <div class="view-header-row">
                <div>
                    <h1 class="view-title">Sistem Honor</h1>
                    <p class="view-subtitle">Perhitungan honor otomatis berdasarkan jumlah tugas selesai.</p>
                </div>
            </div>

            <!-- Search toolbar -->
            <div class="toolbar-card" style="margin-bottom: 20px;">
                <div class="toolbar-search">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" id="honor-user-search" placeholder="Cari karyawan berdasarkan nama...">
                </div>
            </div>

            <div class="table-card">
                <div class="card-header" style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h3>Daftar Honor Karyawan</h3>
                    <div style="font-weight: bold; font-size: 18px; color: var(--success);" id="total-payout">Total Payout: Rp0</div>
                </div>
                <div class="table-responsive">
                    <table class="user-table" id="honor-table">
                        <thead>
                            <tr>
                                <th>Karyawan</th>
                                <th style="text-align: center;">Tugas Selesai</th>
                                <th style="text-align: right;">Total Terinput</th>
                                <th style="text-align: center;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="honor-list">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>

    <!-- Shared Scripts -->
    <script src="{{ asset('js/db.js') }}"></script>
    <script src="{{ asset('js/auth.js') }}"></script>
    <script src="{{ asset('js/layout.js') }}"></script>

    <!-- Page Logic -->
    <script src="{{ asset('js/honor.js') }}"></script>
</body>

</html>
