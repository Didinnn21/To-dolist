// ==========================================================================
// DZHIRASENA - SHARED LAYOUT & NAVIGATION INJECTOR (MPA)
// ==========================================================================

const Layout = {
    init() {
        if (!Auth.currentUser) return; // Only layout if authenticated

        this.injectLayout();
        this.setupNavigation();
        this.setupDropdowns();
        this.setupModals();

        // Initial load for notifications
        this.renderNotifications();
        this.hydrateAssigneeDropdowns();
        this.hydrateCategoryDropdowns();

        // Apply translations if the chosen language is English
        const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
        this.applyTranslation(savedLang);

        // Apply dark mode if chosen
        const savedTheme = localStorage.getItem("dzhirasena_theme") || "light";
        if (savedTheme === "dark") {
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
        }
    },

    dictionary: {
        "Beranda": "Dashboard",
        "Semua Tugas": "All Tasks",
        "Manajemen Tim": "Team Management",
        "Arsip": "Archive",
        "Profil": "Profile",
        "Profil Saya": "My Profile",
        "Keluar": "Logout",
        "Notifikasi": "Notifications",
        "Tandai dibaca": "Mark as read",
        "Dashboard Kerja Saya": "My Work Dashboard",
        "Ringkasan aktivitas dan tugas pribadi Anda.": "Summary of your personal activities and tasks.",
        "TUGAS SAYA": "MY TASKS",
        "terjadwal": "scheduled",
        "BERJALAN": "IN PROGRESS",
        "perlu dikerjakan": "needs work",
        "SELESAI": "COMPLETED",
        "selesai": "completed",
        "Tugas Terbaru Saya": "My Recent Tasks",
        "Semua Kategori": "All Categories",
        "Urutkan": "Sort",
        "Tambah Tugas Baru": "Add New Task",
        "Nama Tugas": "Task Name",
        "Deskripsi Tugas": "Task Description",
        "Jelaskan detail tugas di sini...": "Explain task details here...",
        "Kategori": "Category",
        "Deadline": "Deadline",
        "Assign Ke": "Assign To",
        "Prioritas": "Priority",
        "Tinggi": "High",
        "Sedang": "Medium",
        "Rendah": "Low",
        "Simpan Tugas": "Save Task",
        "Weekly Progress Saya": "My Weekly Progress",
        "Anda telah menyelesaikan": "You have completed",
        "tugas. Tetap semangat!": "tasks. Keep it up!",
        "Pengaturan Profil": "Profile Settings",
        "Kelola profil pribadi dan preferensi aplikasi Anda.": "Manage your personal profile and application preferences.",
        "Nama Lengkap": "Full Name",
        "Simpan": "Save",
        "Ganti Bahasa": "Change Language",
        "Mode Tampilan": "Display Mode",
        "Keluar dari Akun": "Log Out of Account",
        "To-Do List Kerja": "Work To-Do List",
        "Kelola tugas harian agar pekerjaan lebih teratur.": "Manage daily tasks to keep work organized.",
        "Tambah Tugas": "Add Task",
        "Cari tugas...": "Search tasks...",
        "Semua Status": "All Statuses",
        "Semua Karyawan": "All Employees",
        "Semua Prioritas": "All Priorities",
        "Tugas Tidak Ditemukan": "Task Not Found",
        "Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.": "Try adjusting your search keywords or clearing the filters above.",
        "Terlewat": "Overdue",
        "Hari ini": "Today",
        "Batal": "Cancel",
        "Simpan Perubahan": "Save Changes",
        "Edit Tugas": "Edit Task",
        "Kelola Anggota Tim": "Manage Team Members",
        "Lihat performa dan kontribusi setiap anggota tim.": "View the performance and contribution of each team member.",
        "Tambah Anggota": "Add Member",
        "Tambah Pengguna Baru": "Add New User",
        "Beban Kerja Tim": "Team Workload",
        "Statistik performa pengerjaan tugas tim Anda.": "Performance statistics of your team's task completion.",
        "BEBAN TUGAS": "TASK LOAD",
        "aktif": "active",
        "TERSELESAIKAN": "RESOLVED",
        "total": "total",
        "PROGRES RATA-RATA": "AVERAGE PROGRESS",
        "rata-rata": "average",
        "Daftar Anggota Tim": "Team Member List",
        "Pencarian Anggota": "Search Member",
        "Email": "Email",
        "Peran": "Role",
        "Status": "Status",
        "Aksi": "Actions",
        "Aktif": "Active",
        "Nonaktif": "Inactive",
        "Arsip Tugas": "Task Archive",
        "Daftar tugas yang telah diselesaikan dan diarsipkan.": "List of completed and archived tasks.",
        "Cari tugas diarsip...": "Search archived tasks...",
        "Tidak Ada Tugas Diarsipkan": "No Archived Tasks",
        "Belum ada tugas yang diselesaikan atau diarsipkan.": "No tasks have been completed or archived yet.",
        "Selesai": "Completed",
        "Berjalan": "In Progress",
        "Tidak ada deskripsi.": "No description.",
        "Tidak ada aktivitas tugas yang cocok.": "No matching task activities.",
        "Edit Tugas": "Edit Task",
        "Hapus Tugas": "Delete Task",
        "Hapus Kategori": "Delete Category",
        "Edit User": "Edit User",
        "Hapus User": "Delete User",
        "Ditugaskan kepada:": "Assigned to:",
        "Terlewat:": "Overdue:",
        "Data pengguna berhasil diperbarui!": "User data updated successfully!",
        "Gagal memperbarui pengguna": "Failed to update user",
        "Tugas yang Ditugaskan": "Assigned Tasks",
        "Belum ada tugas yang ditugaskan kepada karyawan ini.": "No tasks assigned to this employee yet.",
        "Tugas Baru": "New Task",
        "Prioritas": "Priority",
        "Ditugaskan Kepada": "Assigned To",
        "Apakah Anda yakin ingin menghapus tugas ini?": "Are you sure you want to delete this task?",
        "Apakah Anda yakin ingin menghapus pengguna ini? Semua tugas yang ditugaskan kepada mereka akan tetap ada namun ditandai sebagai pemilik yang dihapus.": "Are you sure you want to delete this user? All tasks assigned to them will remain but will be marked as having a deleted owner.",
        "Apakah Anda yakin ingin menghapus kategori \"": "Are you sure you want to delete the category \"",
        "\"? Tugas yang menggunakan kategori ini tidak akan otomatis terhapus.": "\"? Tasks using this category will not be automatically deleted.",
        "Fitur ini masih dalam tahap pengembangan.": "This feature is still in development.",
        "Status tugas \"": "Task status \"",
        "\" diperbarui.": "\" updated.",
        "\" dikembalikan ke Berjalan.": "\" reverted to In Progress.",
        "\" berhasil ditambahkan!": "\" added successfully!",
        "\" berhasil dihapus.": "\" deleted successfully.",
        "Anda tidak memiliki izin menghapus tugas ini!": "You do not have permission to delete this task!",
        "Tugas berhasil dihapus.": "Task deleted successfully.",
        "Tugas baru berhasil ditambahkan!": "New task added successfully!",
        "Email sudah terdaftar!": "Email already registered!",
        "Pengguna \"": "User \"",
        "Tugas berhasil diperbarui!": "Task updated successfully!",
        "Tugas tidak ditemukan!": "Task not found!",
        "Semua notifikasi ditandai sebagai dibaca.": "All notifications marked as read.",
        "Ukuran gambar terlalu besar! Maksimal 2MB.": "Image size too large! Maximum 2MB.",
        "Avatar berhasil diperbarui!": "Avatar updated successfully!",
        "Nama tidak boleh kosong!": "Name cannot be empty!",
        "Nama berhasil diperbarui!": "Name updated successfully!",
        "Status pengguna \"": "User status \"",
        "\" diubah menjadi ": "\" changed to ",
        "Pengguna berhasil dihapus dari sistem.": "User successfully deleted from system.",
        "Kategori tersebut sudah terdaftar!": "That category is already registered!",
        "Kategori \"": "Category \"",
        "Daftar tugas diurutkan berdasarkan tanggal terdekat.": "Task list sorted by earliest date.",
        "Daftar tugas diurutkan berdasarkan tanggal terjauh.": "Task list sorted by latest date.",
        "Gagal memperbarui status tugas di Supabase.": "Failed to update task status in Supabase.",
        "Gagal menambahkan tugas di Supabase.": "Failed to add task in Supabase.",
        "Gagal menghapus tugas di Supabase.": "Failed to delete task in Supabase.",
        "Gagal menambahkan user di Supabase.": "Failed to add user in Supabase.",
        "Gagal memperbarui status user di Supabase.": "Failed to update user status in Supabase.",
        "Gagal memperbarui avatar user di Supabase.": "Failed to update user avatar in Supabase.",
        "Gagal memperbarui nama user di Supabase.": "Failed to update user name in Supabase.",
        "Gagal menghapus user di Supabase.": "Failed to delete user in Supabase.",
        "Gagal menambahkan kategori di Supabase.": "Failed to add category in Supabase.",
        "Gagal menghapus kategori di Supabase.": "Failed to delete category in Supabase.",
        "Gagal menambahkan notifikasi di Supabase.": "Failed to add notification in Supabase.",
        "Gagal menandai notifikasi dibaca di Supabase.": "Failed to mark notification as read in Supabase.",
        "Gagal menandai semua notifikasi dibaca di Supabase.": "Failed to mark all notifications as read in Supabase.",
        "Hubungi Admin, akun Anda telah dinonaktifkan!": "Contact Admin, your account has been deactivated!"
    },

    applyTranslation(lang, rootNode = document.body) {
        if (lang !== 'en') return;

        const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const trimmed = node.nodeValue.trim();
                if (this.dictionary[trimmed]) {
                    node.nodeValue = node.nodeValue.replace(trimmed, this.dictionary[trimmed]);
                } else {
                    for (const [key, value] of Object.entries(this.dictionary)) {
                        if (trimmed.includes(key)) {
                            node.nodeValue = node.nodeValue.replace(key, value);
                        }
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === "SCRIPT" || node.tagName === "STYLE") return;

                const placeholder = node.getAttribute("placeholder");
                if (placeholder && this.dictionary[placeholder.trim()]) {
                    node.setAttribute("placeholder", this.dictionary[placeholder.trim()]);
                }

                const titleAttr = node.getAttribute("title");
                if (titleAttr && this.dictionary[titleAttr.trim()]) {
                    node.setAttribute("title", this.dictionary[titleAttr.trim()]);
                }

                const valueAttr = node.getAttribute("value");
                if (valueAttr && this.dictionary[valueAttr.trim()] && (node.tagName === "INPUT" || node.tagName === "BUTTON" || node.tagName === "OPTION")) {
                    node.setAttribute("value", this.dictionary[valueAttr.trim()]);
                }

                for (let i = 0; i < node.childNodes.length; i++) {
                    walk(node.childNodes[i]);
                }
            }
        };

        walk(rootNode);
    },

    injectLayout() {
        const pageContent = document.getElementById("page-content");
        if (!pageContent) return;

        const user = Auth.currentUser;
        const isAdmin = user.role === "Admin" || user.role === "Project Manager";
        const isAtasan = user.role === "Atasan";

        // Create Container Screen
        const appScreen = document.createElement("div");
        appScreen.id = "app-screen";
        appScreen.className = "app-screen";

        // Determine active view based on current HTML file
        const path = window.location.pathname.toLowerCase();
        let activeView = "dashboard";
        if (path.endsWith("tasks") || path.endsWith("tasks.html")) activeView = "tasks";
        else if (path.endsWith("team") || path.endsWith("team.html")) activeView = "team";
        else if (path.endsWith("archive") || path.endsWith("archive.html")) activeView = "archive";
        else if (path.endsWith("archive-paid") || path.endsWith("archive-paid.html")) activeView = "archivePaid";
        else if (path.endsWith("profile") || path.endsWith("profile.html")) activeView = "profile";
        else if (path.endsWith("laporan") || path.endsWith("laporan.html")) activeView = "laporan";
        else if (path.endsWith("laporan-honor") || path.endsWith("laporan-honor.html")) activeView = "laporanHonor";
        else if (path.endsWith("honor") || path.endsWith("honor.html")) activeView = "honor";

        // 1. Mobile Header HTML
        const mobileHeaderHtml = `
            <header class="mobile-header">
                <button class="mobile-menu-btn" id="mobile-menu-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                        <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                        <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                        <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                    </svg>
                </button>
                <div class="mobile-logo">
                    <svg class="logo-tick" viewBox="0 0 24 24" width="20" height="20" stroke="#0A52C6" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Dzhirasena</span>
                </div>
                <div style="display:flex; align-items:center; gap: 12px;">
                    <div class="notification-wrapper">
                        <button class="control-btn notification-btn" id="notification-trigger-mobile" style="padding: 6px;">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            <span class="notification-badge hidden" id="notification-badge-count-mobile">0</span>
                        </button>
                        <div class="dropdown-menu notification-dropdown" id="notification-dropdown-mobile">
                            <div class="dropdown-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 16px;">
                                <strong>Notifikasi</strong>
                                <a href="#" id="mark-all-read-btn-mobile" style="font-size: 11px; font-weight: 600;">Tandai dibaca</a>
                            </div>
                            <div class="dropdown-divider"></div>
                            <div class="notification-list" id="notification-list-container-mobile"></div>
                        </div>
                    </div>
                    <div class="mobile-user-avatar" id="mobile-profile-trigger">
                        <img src="${user.avatar}" alt="Profile" class="user-avatar-img">
                    </div>
                </div>
            </header>
        `;

        // 2. Desktop Sidebar HTML
        const desktopSidebarHtml = `
            <aside class="desktop-sidebar">
                <div class="sidebar-profile">
                    <div class="profile-avatar">
                        <img src="${user.avatar}" alt="Profile" class="user-avatar-img">
                        <span class="active-badge"></span>
                    </div>
                    <div class="profile-info">
                        <h4>${user.name}</h4>
                        <p>${user.role}</p>
                    </div>
                </div>

                <nav class="sidebar-nav">
                    <ul>
                        <li class="nav-item ${activeView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
                            <a href="#">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
                                <span>Beranda</span>
                            </a>
                        </li>
                        ${!isAtasan ? `
                        <li class="nav-item ${activeView === 'tasks' ? 'active' : ''}" data-view="tasks">
                            <a href="#">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                                <span>Semua Tugas</span>
                            </a>
                        </li>
                        ` : ''}
                        ${isAdmin ? `
                        <li class="nav-item ${activeView === 'team' ? 'active' : ''}" data-view="team">
                            <a href="#">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                <span>Manajemen Tim</span>
                            </a>
                        </li>
                        ` : ''}
                        ${isAtasan ? `
                        <li class="nav-item ${activeView === 'honor' ? 'active' : ''}" data-view="honor">
                            <a href="#">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                <span>Bayar Honor</span>
                            </a>
                        </li>
                        <li class="nav-item ${activeView === 'laporan' || activeView === 'laporanHonor' ? 'active' : ''}" data-view="laporan">
                            <a href="#">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                <span>Laporan</span>
                            </a>
                        </li>
                        ` : (isAdmin ? `
                        <li class="nav-item ${activeView === 'laporan' ? 'active' : ''}" data-view="laporan">
                            <a href="#">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                <span>Laporan</span>
                            </a>
                        </li>
                        ` : '')}
                        <li class="nav-item has-submenu ${activeView === 'archive' || activeView === 'archivePaid' ? 'active' : ''}">
                            <a href="#" class="submenu-toggle">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                                <span>Arsip</span>
                                <svg class="submenu-arrow" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto; transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </a>
                            <ul class="sidebar-submenu">
                                <li class="submenu-item ${activeView === 'archive' ? 'active' : ''}" data-view="archive">
                                    <a href="#">Arsip Tugas Selesai</a>
                                </li>
                                <li class="submenu-item ${activeView === 'archivePaid' ? 'active' : ''}" data-view="archivePaid">
                                    <a href="#">Arsip Tugas Terbayar</a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </nav>

                <div class="sidebar-footer">
                    <button class="btn-logout" id="btn-logout-desktop">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span>Keluar</span>
                    </button>
                    <div class="app-version-badge">
                        <span class="active-dot"></span>
                        <span>Dzhirasena v2.4 Aktif</span>
                    </div>
                </div>
            </aside>
        `;

        // 3. Desktop Header HTML
        const desktopHeaderHtml = `
            <header class="desktop-header">
                <div class="header-logo">
                    <svg class="logo-tick" viewBox="0 0 24 24" width="24" height="24" stroke="#0A52C6" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <h2>Dzhirasena</h2>
                </div>
                
                <div class="header-controls">
                    <div class="search-bar" ${activeView === 'tasks' ? 'style="display: none;"' : ''}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" id="global-search" placeholder="Cari tugas...">
                    </div>
                    
                    <div class="notification-wrapper">
                        <button class="control-btn notification-btn" id="notification-trigger">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            <span class="notification-badge hidden" id="notification-badge-count">0</span>
                        </button>
                        <div class="dropdown-menu notification-dropdown" id="notification-dropdown">
                            <div class="dropdown-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 16px;">
                                <strong>Notifikasi</strong>
                                <a href="#" id="mark-all-read-btn" style="font-size: 11px; font-weight: 600;">Tandai dibaca</a>
                            </div>
                            <div class="dropdown-divider"></div>
                            <div class="notification-list" id="notification-list-container"></div>
                        </div>
                    </div>
                    
                    <div class="desktop-profile-wrapper">
                        <img src="${user.avatar}" alt="Profile" class="user-avatar-img header-profile-img" id="header-user-avatar-img">
                        <div class="dropdown-menu" id="profile-dropdown">
                            <div class="dropdown-header">
                                <strong>${user.name}</strong>
                                <span>${user.email}</span>
                            </div>
                            <div class="dropdown-divider"></div>
                            <a href="/profile" class="dropdown-item">Profil Saya</a>
                            <a href="#" class="dropdown-item" id="dropdown-logout-btn">Keluar</a>
                        </div>
                    </div>
                </div>
            </header>
        `;

        // 4. Mobile Bottom Navigation HTML
        let bottomNavButtons = "";
        
        // Always include Beranda/Dashboard
        bottomNavButtons += `
            <button class="bottom-nav-item ${activeView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
                <span>Beranda</span>
            </button>
        `;

        if (isAtasan) {
            bottomNavButtons += `
                <button class="bottom-nav-item ${activeView === 'laporan' || activeView === 'laporanHonor' ? 'active' : ''}" data-view="laporan">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    <span>Laporan</span>
                </button>
                <button class="bottom-nav-item ${activeView === 'honor' ? 'active' : ''}" data-view="honor">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <span>Bayar Honor</span>
                </button>
                <button class="bottom-nav-item ${activeView === 'archive' || activeView === 'archivePaid' ? 'active' : ''}" data-view="archive">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                    <span>Arsip</span>
                </button>
            `;
        } else if (isAdmin) {
            bottomNavButtons += `
                <button class="bottom-nav-item ${activeView === 'laporan' ? 'active' : ''}" data-view="laporan">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    <span>Laporan</span>
                </button>
                <button class="bottom-nav-item ${activeView === 'team' ? 'active' : ''}" data-view="team">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                    <span>Tim</span>
                </button>
                <button class="bottom-nav-item ${activeView === 'archive' || activeView === 'archivePaid' ? 'active' : ''}" data-view="archive">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                    <span>Arsip</span>
                </button>
            `;
        } else {
            bottomNavButtons += `
                <button class="bottom-nav-item ${activeView === 'tasks' ? 'active' : ''}" data-view="tasks">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                    <span>Tugas</span>
                </button>
                <button class="bottom-nav-item ${activeView === 'archive' || activeView === 'archivePaid' ? 'active' : ''}" data-view="archive">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                    <span>Arsip</span>
                </button>
            `;
        }

        // Always include Profile
        bottomNavButtons += `
            <button class="bottom-nav-item ${activeView === 'profile' ? 'active' : ''}" data-view="profile">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span>Profil</span>
            </button>
        `;

        const mobileBottomNavHtml = `
            <nav class="mobile-bottom-nav">
                ${bottomNavButtons}
            </nav>
        `;

        // Assemble Scaffold
        appScreen.innerHTML = `
            ${mobileHeaderHtml}
            ${desktopSidebarHtml}
            <main class="main-layout">
                ${desktopHeaderHtml}
                <div class="content-container"></div>
            </main>
            ${mobileBottomNavHtml}
        `;

        // Move the unique view content inside the scaffold layout
        const mainContainer = appScreen.querySelector(".content-container");
        while (pageContent.firstChild) {
            mainContainer.appendChild(pageContent.firstChild);
        }

        // Clean body and insert scaffold + modals
        document.body.innerHTML = "";

        // Modal & Toast Scaffolds
        const toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.className = "toast-container";

        document.body.appendChild(toastContainer);
        document.body.appendChild(appScreen);

        // Inject Shared Modals
        this.injectSharedModals(isAdmin);
    },

    injectSharedModals(isAdmin) {
        const modalsContainer = document.createElement("div");
        modalsContainer.id = "shared-modals-wrapper";

        const addUserModalHtml = isAdmin ? `
            <!-- Add User Modal -->
            <div id="add-user-modal" class="modal-overlay hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Tambah Pengguna Baru</h3>
                        <button class="modal-close-btn" id="close-user-modal">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <form id="add-user-form">
                        <div class="form-group">
                            <label for="new-user-name">Nama Lengkap</label>
                            <input type="text" id="new-user-name" placeholder="Contoh: Sarah Johnson" required>
                        </div>
                        <div class="form-group">
                            <label for="new-user-email">Alamat Email</label>
                            <input type="email" id="new-user-email" placeholder="contoh@dzhirasena.com" required>
                        </div>
                        <div class="form-group">
                            <label for="new-user-password">Password Awal</label>
                            <div class="input-wrapper">
                                <svg class="input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
                                    stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <input type="password" id="new-user-password" placeholder="Min 6 karakter" required minlength="6">
                                <button type="button" class="toggle-password" id="toggle-new-user-password-btn">
                                    <svg id="new-user-eye-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
                                        stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="new-user-role">Role / Peran</label>
                                <input type="text" id="new-user-role" list="role-options" placeholder="Ketik atau pilih role..." required style="width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); outline: none; background-color: #F8FAFC;">
                                <datalist id="role-options">
                                    <option value="Admin">
                                    <option value="Project Manager">
                                    <option value="Atasan">
                                    <option value="Finance Specialist">
                                    <option value="UI Designer">
                                    <option value="Marketing Lead">
                                    <option value="IT Specialist">
                                </datalist>
                            </div>
                            <div class="form-group col-6">
                                <label for="new-user-avatar">Pilih Avatar</label>
                                <select id="new-user-avatar">
                                    <option value="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80">Female Avatar 1 (Sarah)</option>
                                    <option value="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80">Female Avatar 2 (Jessica)</option>
                                    <option value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80">Male Avatar 1 (Mike)</option>
                                    <option value="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80">Male Avatar 2 (Standard)</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancel-user-modal">Batal</button>
                            <button type="submit" class="btn btn-primary">Tambah User</button>
                        </div>
                    </form>
                </div>
            </div>
        ` : '';

        const mobileAddTaskModalHtml = `
            <!-- Mobile Add Task Modal -->
            <div id="add-task-modal-mobile" class="modal-overlay hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Tambah Tugas Baru</h3>
                        <button class="modal-close-btn" id="close-task-modal-mobile">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <form id="add-task-form-mobile">
                        <div class="form-group">
                            <label for="task-name-mob">Nama Tugas</label>
                            <input type="text" id="task-name-mob" placeholder="Masukkan nama tugas..." required>
                        </div>

                        <div class="form-group">
                            <label for="task-desc-mob">Deskripsi Tugas</label>
                            <textarea id="task-desc-mob" placeholder="Jelaskan detail tugas di sini..." rows="3"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="task-files-mob">Lampiran Dokumen</label>
                            <input type="file" id="task-files-mob" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style="font-size: 13px; padding: 8px;">
                        </div>

                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="task-category-mob">Kategori</label>
                                <input type="text" id="task-category-mob" list="task-category-mob-options" placeholder="Ketik atau pilih kategori..." required style="width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); outline: none; background-color: #F8FAFC;">
                                <datalist id="task-category-mob-options">
                                    <option value="Keuangan">
                                    <option value="Desain">
                                    <option value="Pemasaran">
                                    <option value="Teknologi Informasi">
                                    <option value="Jurnal">
                                </datalist>
                            </div>
                            <div class="form-group col-6">
                                <label for="task-deadline-mob">Deadline</label>
                                <input type="date" id="task-deadline-mob" required>
                            </div>
                        </div>

                        <!-- New Username and Password fields for Journal category -->
                        <div class="form-row hidden" id="journal-fields-mob" style="margin-bottom: 18px;">
                            <div class="form-group col-6" style="margin-bottom: 0;">
                                <label for="task-username-mob">Username Jurnal</label>
                                <input type="text" id="task-username-mob" placeholder="Masukkan username..." style="width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); outline: none; background-color: #F8FAFC;">
                            </div>
                            <div class="form-group col-6" style="margin-bottom: 0;">
                                <label for="task-password-mob">Password Jurnal</label>
                                <input type="text" id="task-password-mob" placeholder="Masukkan password..." style="width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); outline: none; background-color: #F8FAFC;">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="task-assignee-mob">Assign Ke</label>
                            <select id="task-assignee-mob"></select>
                        </div>

                        <div class="form-group">
                            <label>Prioritas</label>
                            <div class="priority-selector">
                                <input type="radio" name="priority-mob" id="prio-high-mob" value="Tinggi" checked>
                                <label for="prio-high-mob" class="prio-btn prio-high-label">Tinggi</label>

                                <input type="radio" name="priority-mob" id="prio-medium-mob" value="Sedang">
                                <label for="prio-medium-mob" class="prio-btn prio-medium-label">Sedang</label>

                                <input type="radio" name="priority-mob" id="prio-low-mob" value="Rendah">
                                <label for="prio-low-mob" class="prio-btn prio-low-label">Rendah</label>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancel-task-modal-mobile">Batal</button>
                            <button type="submit" class="btn btn-primary btn-block">Simpan Tugas</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const contactAdminModalHtml = `
            <!-- Contact Admin Info Modal -->
            <div id="contact-admin-modal" class="modal-overlay hidden">
                <div class="modal-content text-center">
                    <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                        <h3 style="width: 100%;">Hubungi Administrator</h3>
                    </div>
                    <div style="padding: 20px;">
                        <p>Pendaftaran akun baru hanya dapat dilakukan oleh **Administrator** atau **Project Manager**.</p>
                        <p style="margin-top: 12px; color: #6b7280; font-size: 0.9em;">
                            Silakan hubungi bagian IT/HR di perusahaan Anda untuk meminta kredensial akun Dzhirasena.
                        </p>
                        <div style="margin-top: 20px; padding: 12px; background: #eef4ff; border-radius: 8px; font-weight: 500; color: #0a52c6;">
                            admin@dzhirasena.com / admin123
                        </div>
                    </div>
                    <div class="modal-footer" style="border-top: none; justify-content: center;">
                        <button type="button" class="btn btn-primary" id="close-contact-modal">Mengerti</button>
                    </div>
                </div>
            </div>
        `;

        const editTaskModalHtml = `
            <!-- Edit Task Modal -->
            <div id="edit-task-modal" class="modal-overlay hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Tugas</h3>
                        <button class="modal-close-btn" id="close-edit-task-modal">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <form id="edit-task-form">
                        <input type="hidden" id="edit-task-id">
                        <div class="form-group">
                            <label for="edit-task-name">Nama Tugas</label>
                            <input type="text" id="edit-task-name" placeholder="Masukkan nama tugas..." required>
                        </div>

                        <div class="form-group">
                            <label for="edit-task-desc">Deskripsi Tugas</label>
                            <textarea id="edit-task-desc" placeholder="Jelaskan detail tugas di sini..." rows="3"></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="edit-task-category">Kategori</label>
                                <input type="text" id="edit-task-category" list="edit-task-category-options" placeholder="Ketik atau pilih kategori..." required style="width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); outline: none; background-color: #F8FAFC;">
                                <datalist id="edit-task-category-options"></datalist>
                            </div>
                            <div class="form-group col-6">
                                <label for="edit-task-deadline">Deadline</label>
                                <input type="date" id="edit-task-deadline" required>
                            </div>
                        </div>

                        <!-- New Username and Password fields for Journal category -->
                        <div class="form-row hidden" id="edit-journal-fields" style="margin-bottom: 18px;">
                            <div class="form-group col-6" style="margin-bottom: 0;">
                                <label for="edit-task-username">Username Jurnal</label>
                                <input type="text" id="edit-task-username" placeholder="Masukkan username..." style="width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); outline: none; background-color: #F8FAFC;">
                            </div>
                            <div class="form-group col-6" style="margin-bottom: 0;">
                                <label for="edit-task-password">Password Jurnal</label>
                                <input type="text" id="edit-task-password" placeholder="Masukkan password..." style="width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); outline: none; background-color: #F8FAFC;">
                            </div>
                        </div>

                        <div class="form-group" id="edit-task-assignee-group">
                            <label for="edit-task-assignee">Assign Ke</label>
                            <select id="edit-task-assignee"></select>
                        </div>

                        <div class="form-group">
                            <label>Prioritas</label>
                            <div class="priority-selector">
                                <input type="radio" name="edit-priority" id="edit-prio-high" value="Tinggi">
                                <label for="edit-prio-high" class="prio-btn prio-high-label">Tinggi</label>

                                <input type="radio" name="edit-priority" id="edit-prio-medium" value="Sedang">
                                <label for="edit-prio-medium" class="prio-btn prio-medium-label">Sedang</label>

                                <input type="radio" name="edit-priority" id="edit-prio-low" value="Rendah">
                                <label for="edit-prio-low" class="prio-btn prio-low-label">Rendah</label>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancel-edit-task-modal">Batal</button>
                            <button type="submit" class="btn btn-primary btn-block">Simpan Perubahan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const taskDetailModalHtml = `
            <!-- Task Detail & Discussion Modal -->
            <div id="task-detail-modal" class="modal-overlay hidden">
                <div class="modal-content modal-content-wide">
                    <div class="modal-header">
                        <h3 id="task-detail-modal-title">Detail Tugas</h3>
                        <button class="modal-close-btn" id="close-task-detail-modal">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div class="task-detail-layout">
                        <!-- Left: Task info + attachments -->
                        <div class="task-detail-left">
                            <div id="task-detail-meta"></div>
                            <!-- Attachments -->
                            <div class="attachment-section">
                                <h4 class="section-sub-title">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                    Lampiran
                                </h4>
                                <div id="task-attachment-list" class="attachment-list"></div>
                                <div class="upload-drop-zone" id="attachment-drop-zone">
                                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="#9ca3af" stroke-width="1.5" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    <p>Seret file ke sini atau</p>
                                    <label for="attachment-file-input" class="btn btn-secondary" style="cursor:pointer; margin-top:4px;">Pilih File</label>
                                    <input type="file" id="attachment-file-input" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style="display:none;">
                                    <p style="font-size:11px; color:var(--text-muted); margin-top:6px;">Gambar, PDF, Word, Excel, PPT (maks 5MB)</p>
                                </div>
                            </div>
                        </div>
                        <!-- Right: Discussion / Comments -->
                        <div class="task-detail-right">
                            <h4 class="section-sub-title">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                Laporan Pengerjaan & Komentar
                            </h4>
                            <div id="task-comments-list" class="comments-list"></div>
                            <div class="comment-input-row">
                                <img id="comment-user-avatar" src="" alt="" class="comment-avatar">
                                <div class="comment-input-wrap">
                                    <textarea id="comment-input" placeholder="Tulis laporan progress..." rows="2"></textarea>
                                    <button class="btn btn-primary btn-sm" id="send-comment-btn">
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                        Kirim
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const progressDetailModalHtml = `
            <!-- Progress Detail Modal -->
            <div id="progress-detail-modal" class="modal-overlay hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="progress-modal-title">Detail Progress</h3>
                        <button class="modal-close-btn" id="close-progress-modal">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div id="progress-modal-body" style="padding: 16px 0; max-height: 60vh; overflow-y: auto;"></div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="close-progress-modal-footer">Tutup</button>
                    </div>
                </div>
            </div>
        `;

        modalsContainer.innerHTML = `
            ${addUserModalHtml}
            ${mobileAddTaskModalHtml}
            ${contactAdminModalHtml}
            ${editTaskModalHtml}
            ${taskDetailModalHtml}
            ${progressDetailModalHtml}
        `;
        document.body.appendChild(modalsContainer);
    },

    setupNavigation() {
        const isAtasan = Auth.currentUser.role === "Atasan";
        
        const pages = {
            dashboard: (Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager" || isAtasan) ? "/admin-dashboard" : "/user-dashboard",
            tasks: "/tasks",
            team: "/team",
            archive: "/archive",
            archivePaid: "/archive-paid",
            profile: "/profile",
            laporan: "/laporan",
            laporanHonor: "/laporan-honor",
            honor: "/honor"
        };

        // Setup initial submenu states
        document.querySelectorAll(".sidebar-nav .has-submenu").forEach(item => {
            const submenu = item.querySelector(".sidebar-submenu");
            const arrow = item.querySelector(".submenu-arrow");
            const isActive = item.classList.contains("active");
            if (submenu) {
                submenu.style.display = isActive ? "flex" : "none";
            }
            if (arrow) {
                arrow.style.transform = isActive ? "rotate(180deg)" : "rotate(0deg)";
            }
            
            const toggleBtn = item.querySelector(".submenu-toggle");
            if (toggleBtn) {
                toggleBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isHidden = submenu.style.display === "none";
                    submenu.style.display = isHidden ? "flex" : "none";
                    if (arrow) arrow.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
                });
            }
        });

        // Desktop sidebar nav click (non-submenu items and submenu items)
        document.querySelectorAll(".sidebar-nav .nav-item:not(.has-submenu), .sidebar-nav .submenu-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const view = item.getAttribute("data-view");
                if (view) {
                    window.location.href = pages[view];
                }
            });
        });

        // Mobile bottom nav click
        document.querySelectorAll(".mobile-bottom-nav .bottom-nav-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const view = item.getAttribute("data-view");
                window.location.href = pages[view];
            });
        });

        // Global Logout triggers
        const logoutHandler = (e) => {
            e.preventDefault();
            Auth.logout();
        };

        const btnLogoutDesktop = document.getElementById("btn-logout-desktop");
        const btnLogoutDropdown = document.getElementById("dropdown-logout-btn");
        if (btnLogoutDesktop) btnLogoutDesktop.addEventListener("click", logoutHandler);
        if (btnLogoutDropdown) btnLogoutDropdown.addEventListener("click", logoutHandler);

        // Mobile profile trigger to setting page
        const mobProfile = document.getElementById("mobile-profile-trigger");
        if (mobProfile) {
            mobProfile.addEventListener("click", () => {
                window.location.href = "/profile";
            });
        }
    },

    setupDropdowns() {
        const profileImg = document.getElementById("header-user-avatar-img");
        const profileDropdown = document.getElementById("profile-dropdown");
        const notifTrigger = document.getElementById("notification-trigger");
        const notifDropdown = document.getElementById("notification-dropdown");
        const notifTriggerMob = document.getElementById("notification-trigger-mobile");
        const notifDropdownMob = document.getElementById("notification-dropdown-mobile");

        if (profileImg && profileDropdown) {
            profileImg.addEventListener("click", (e) => {
                e.stopPropagation();
                if (notifDropdown) notifDropdown.classList.remove("show");
                profileDropdown.classList.toggle("show");
            });
            document.addEventListener("click", () => {
                profileDropdown.classList.remove("show");
            });
        }

        if (notifTrigger && notifDropdown) {
            notifTrigger.addEventListener("click", (e) => {
                e.stopPropagation();
                if (profileDropdown) profileDropdown.classList.remove("show");
                notifDropdown.classList.toggle("show");
            });
            document.addEventListener("click", () => {
                notifDropdown.classList.remove("show");
            });
        }

        if (notifTriggerMob && notifDropdownMob) {
            notifTriggerMob.addEventListener("click", (e) => {
                e.stopPropagation();
                notifDropdownMob.classList.toggle("show");
            });
            document.addEventListener("click", () => {
                notifDropdownMob.classList.remove("show");
            });
        }

        // Global search redirect
        const globalSearch = document.getElementById("global-search");
        if (globalSearch) {
            globalSearch.addEventListener("input", (e) => {
                const query = e.target.value.trim().toLowerCase();
                if (query) {
                    sessionStorage.setItem("global_search_query", query);
                    window.location.href = "/tasks";
                }
            });
        }
    },

    setupModals() {
        const addUserModal = document.getElementById("add-user-modal");
        const showAddUserModalBtn = document.getElementById("btn-show-add-user-modal");

        if (addUserModal) {
            if (showAddUserModalBtn) {
                showAddUserModalBtn.addEventListener("click", () => {
                    addUserModal.classList.remove("hidden");
                });
            }
            document.getElementById("close-user-modal").addEventListener("click", () => {
                addUserModal.classList.add("hidden");
            });
            document.getElementById("cancel-user-modal").addEventListener("click", () => {
                addUserModal.classList.add("hidden");
            });

            // Toggle Password Visibility in Add User Modal
            const toggleNewUserPassBtn = document.getElementById("toggle-new-user-password-btn");
            const newUserPasswordInput = document.getElementById("new-user-password");
            const newUserEyeIcon = document.getElementById("new-user-eye-icon");
            if (toggleNewUserPassBtn && newUserPasswordInput && newUserEyeIcon) {
                toggleNewUserPassBtn.addEventListener("click", () => {
                    const type = newUserPasswordInput.getAttribute("type") === "password" ? "text" : "password";
                    newUserPasswordInput.setAttribute("type", type);
                    if (type === "text") {
                        newUserEyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
                    } else {
                        newUserEyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
                    }
                });
            }

            // Handle Add User Form Submission
            document.getElementById("add-user-form").addEventListener("submit", async (e) => {
                e.preventDefault();
                const name = document.getElementById("new-user-name").value.trim();
                const email = document.getElementById("new-user-email").value.trim().toLowerCase();
                const password = document.getElementById("new-user-password").value;
                const role = document.getElementById("new-user-role").value;
                const avatar = document.getElementById("new-user-avatar").value;

                if (DB.users.some(u => u.email.toLowerCase() === email)) {
                    window.showToast("Email sudah terdaftar!", "error");
                    return;
                }

                const newUser = {
                    id: `usr-${Date.now()}`,
                    name,
                    email,
                    password,
                    role,
                    avatar,
                    status: "Active"
                };
                const submitBtn = e.target.querySelector("button[type='submit']");
                const originalText = submitBtn.innerText;
                submitBtn.innerText = "Menambahkan...";
                submitBtn.disabled = true;

                const res = await DB.addUser(newUser);

                submitBtn.innerText = originalText;
                submitBtn.disabled = false;

                if (!res.success) {
                    window.showToast(res.message, "error");
                    return;
                }

                e.target.reset();
                addUserModal.classList.add("hidden");

                // Refresh specific team manager list if we are on team.html
                if (typeof renderTeamManagement === 'function') {
                    renderTeamManagement();
                }
                Layout.hydrateAssigneeDropdowns();
                window.showToast(`Pengguna "${name}" berhasil ditambahkan!`, "success");
            });
        }

        // Mobile / Shared Add Task Modals
        const addTaskModalMobile = document.getElementById("add-task-modal-mobile");
        const btnAddTaskMobile = document.getElementById("btn-add-task-mobile");
        const btnShowAddTaskModal = document.getElementById("btn-show-add-task-modal");

        const openTaskModal = () => {
            if (addTaskModalMobile) {
                addTaskModalMobile.classList.remove("hidden");
                document.getElementById("task-deadline-mob").value = new Date().toISOString().split('T')[0];
            }
        };

        if (btnAddTaskMobile) btnAddTaskMobile.addEventListener("click", openTaskModal);
        if (btnShowAddTaskModal) btnShowAddTaskModal.addEventListener("click", openTaskModal);

        if (addTaskModalMobile) {
            const taskCategoryMob = document.getElementById("task-category-mob");
            const journalFieldsMob = document.getElementById("journal-fields-mob");
            if (taskCategoryMob && journalFieldsMob) {
                const toggleFields = () => {
                    if (taskCategoryMob.value && taskCategoryMob.value.toLowerCase() === "jurnal") {
                        journalFieldsMob.classList.remove("hidden");
                    } else {
                        journalFieldsMob.classList.add("hidden");
                        const u = document.getElementById("task-username-mob");
                        const p = document.getElementById("task-password-mob");
                        if (u) u.value = "";
                        if (p) p.value = "";
                    }
                };
                taskCategoryMob.addEventListener("input", toggleFields);
                taskCategoryMob.addEventListener("change", toggleFields);
            }

            document.getElementById("close-task-modal-mobile").addEventListener("click", () => {
                addTaskModalMobile.classList.add("hidden");
            });
            document.getElementById("cancel-task-modal-mobile").addEventListener("click", () => {
                addTaskModalMobile.classList.add("hidden");
            });

            document.getElementById("add-task-form-mobile").addEventListener("submit", async (e) => {
                e.preventDefault();
                const title = document.getElementById("task-name-mob").value.trim();
                const description = document.getElementById("task-desc-mob").value.trim();
                const category = document.getElementById("task-category-mob").value;
                const deadline = document.getElementById("task-deadline-mob").value;

                const isJournal = category && category.toLowerCase() === "jurnal";
                let finalDesc = description;
                if (isJournal) {
                    const u = document.getElementById("task-username-mob").value.trim();
                    const pVal = document.getElementById("task-password-mob").value.trim();
                    finalDesc = DB.formatJournalDescription(description, u, pVal);
                }

                const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
                let assignedTo = document.getElementById("task-assignee-mob")
                    ? document.getElementById("task-assignee-mob").value
                    : Auth.currentUser.id;

                if (!isAdmin) {
                    assignedTo = Auth.currentUser.id;
                }

                let priority = "Tinggi";
                const checkedPrio = document.querySelector('input[name="priority-mob"]:checked');
                if (checkedPrio) priority = checkedPrio.value;

                // Handle File Uploads
                const fileInput = document.getElementById("task-files-mob");
                let uploadedAttachments = [];

                if (fileInput && fileInput.files.length > 0) {
                    const submitBtn = document.getElementById("add-task-form-mobile").querySelector('button[type="submit"]');
                    const origText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px;"></span> Mengunggah...';
                    submitBtn.disabled = true;

                    uploadedAttachments = await DB.uploadFiles(fileInput.files);

                    submitBtn.innerHTML = origText;
                    submitBtn.disabled = false;
                }

                const newTask = {
                    id: `tsk-${Date.now()}`,
                    title,
                    description: finalDesc,
                    category,
                    deadline,
                    priority,
                    assignedTo,
                    createdBy: Auth.currentUser.id,
                    status: "In Progress",
                    createdAt: new Date().toISOString().split('T')[0],
                    attachments: uploadedAttachments
                };

                await DB.addTask(newTask);

                // Notify single assignee
                if (assignedTo && assignedTo !== Auth.currentUser.id) {
                    await DB.addNotification(assignedTo, `Tugas baru "${title}" telah ditugaskan kepada Anda oleh ${Auth.currentUser.name}.`, "task_added");
                }

                e.target.reset();
                if (journalFieldsMob) journalFieldsMob.classList.add("hidden");
                addTaskModalMobile.classList.add("hidden");

                // Refresh dashboard or task list
                if (typeof renderDashboardTasks === 'function') renderDashboardTasks();
                if (typeof renderAllTasks === 'function') renderAllTasks();
                if (typeof updateStats === 'function') updateStats();

                window.showToast("Tugas baru berhasil ditambahkan!", "success");
            });
        }

        // Task Detail Modal Handlers
        const taskDetailModal = document.getElementById("task-detail-modal");
        if (taskDetailModal) {
            document.getElementById("close-task-detail-modal").addEventListener("click", () => {
                taskDetailModal.classList.add("hidden");
            });
            taskDetailModal.addEventListener("click", (e) => {
                if (e.target === taskDetailModal) taskDetailModal.classList.add("hidden");
            });

            // Clipboard Copy for Jurnal Credentials
            taskDetailModal.addEventListener("click", (e) => {
                const copyBtn = e.target.closest(".btn-copy-cred");
                if (copyBtn) {
                    const text = copyBtn.getAttribute("data-copy");
                    if (text) {
                        navigator.clipboard.writeText(text).then(() => {
                            window.showToast("Berhasil disalin ke clipboard!", "success");
                        }).catch(err => {
                            console.error("Gagal menyalin:", err);
                        });
                    }
                }
            });

            // Attachment upload — kirim ke Supabase via API (bukan base64 lokal)
            const dropZone = document.getElementById("attachment-drop-zone");
            const fileInput = document.getElementById("attachment-file-input");

            const processFiles = async (files) => {
                const taskId = taskDetailModal.getAttribute("data-task-id");
                if (!taskId) return;

                const validFiles = [];
                for (const file of files) {
                    if (file.size > 10 * 1024 * 1024) {
                        window.showToast(`File "${file.name}" terlalu besar! Maksimal 10MB.`, "error");
                        continue;
                    }
                    validFiles.push(file);
                }
                if (validFiles.length === 0) return;

                // Tampilkan loading state di drop zone
                if (dropZone) {
                    dropZone.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">⏳ Mengunggah ${validFiles.length} file...</p>`;
                }

                try {
                    // Upload ke Supabase Storage via Express API
                    const uploaded = await DB.uploadFiles(validFiles);

                    if (uploaded && uploaded.length > 0) {
                        for (const att of uploaded) {
                            await DB.addAttachment(taskId, att);
                        }
                        window.openTaskDetailModal(taskId); // re-render modal
                        window.showToast(`${uploaded.length} lampiran berhasil ditambahkan!`, "success");
                    } else {
                        window.showToast("Gagal mengunggah file. Coba lagi.", "error");
                        window.openTaskDetailModal(taskId); // restore drop zone
                    }
                } catch (err) {
                    console.error("Upload error:", err);
                    window.showToast("Gagal mengunggah: " + err.message, "error");
                    window.openTaskDetailModal(taskId); // restore drop zone
                }
            };

            if (fileInput) fileInput.addEventListener("change", (e) => processFiles(Array.from(e.target.files)));
            if (dropZone) {
                dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
                dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
                dropZone.addEventListener("drop", (e) => {
                    e.preventDefault();
                    dropZone.classList.remove("drag-over");
                    processFiles(Array.from(e.dataTransfer.files));
                });
            }

            // Comment / Progress Update send
            const sendCommentBtn = document.getElementById("send-comment-btn");
            const commentInput = document.getElementById("comment-input");
            const sendComment = async () => {
                const msg = commentInput ? commentInput.value.trim() : "";
                if (!msg) return;
                const taskId = taskDetailModal.getAttribute("data-task-id");
                if (!taskId) return;

                const task = DB.tasks.find(t => t.id === taskId);
                if (task && (task.status === "Completed" || task.status === "Paid")) {
                    const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
                    if (!isAdmin) {
                        window.showToast("Tugas yang telah selesai tidak dapat diperbarui lagi kecuali oleh Admin!", "error");
                        return;
                    }
                }

                // Call DB.addProgressUpdate to save report to database
                await DB.addProgressUpdate(taskId, Auth.currentUser.id, Auth.currentUser.name, msg);
                commentInput.value = "";
                this.renderTaskComments(taskId);

                // Notify creator, admins, PMs, Atasans, and assignees
                if (task) {
                    const assigneeId = typeof task.assignedTo === 'string' ? task.assignedTo : (Array.isArray(task.assignedTo) ? task.assignedTo[0] : null);
                    
                    const targetUsers = new Set();
                    if (task.createdBy) targetUsers.add(task.createdBy);
                    if (assigneeId) targetUsers.add(assigneeId);
                    
                    DB.users.forEach(u => {
                        if (['Admin', 'Project Manager', 'Atasan'].includes(u.role)) {
                            targetUsers.add(u.id);
                        }
                    });

                    targetUsers.delete(Auth.currentUser.id);

                    const notifPromises = Array.from(targetUsers).map(userId => 
                        DB.addNotification(
                            userId, 
                            `${Auth.currentUser.name} memperbarui progress tugas "${task.title}": "${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}".`, 
                            "info"
                        )
                    );
                    await Promise.all(notifPromises).catch(err => console.error("Notification fail:", err));

                    // Refresh active view lists if they exist
                    if (typeof renderDashboardTasks === 'function') renderDashboardTasks();
                    if (typeof renderAllTasks === 'function') renderAllTasks();
                }
            };
            if (sendCommentBtn) sendCommentBtn.addEventListener("click", sendComment);
            if (commentInput) commentInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendComment();
            });

            // Delete comment / progress update
            document.addEventListener("click", async (e) => {
                const delCommentBtn = e.target.closest(".delete-comment-btn");
                if (delCommentBtn) {
                    const taskId = taskDetailModal.getAttribute("data-task-id");
                    const progressId = delCommentBtn.getAttribute("data-progress-id");

                    if (progressId) {
                        await DB.deleteProgressUpdate(taskId, progressId);
                        this.renderTaskComments(taskId);
                        if (typeof renderDashboardTasks === 'function') renderDashboardTasks();
                        if (typeof renderAllTasks === 'function') renderAllTasks();
                    } else {
                        const commentId = delCommentBtn.getAttribute("data-comment-id");
                        await DB.deleteComment(commentId);
                        this.renderTaskComments(taskId);
                    }
                }

                const delAttachBtn = e.target.closest(".delete-attach-btn");
                if (delAttachBtn) {
                    const attachId = delAttachBtn.getAttribute("data-attach-id");
                    const taskId = taskDetailModal.getAttribute("data-task-id");
                    await DB.removeAttachment(taskId, attachId);
                    window.openTaskDetailModal(taskId);
                }
            });
        }

        // Progress Detail Modal handlers
        const progressModal = document.getElementById("progress-detail-modal");
        if (progressModal) {
            const closeProgress = () => progressModal.classList.add("hidden");
            const closeBtn = document.getElementById("close-progress-modal");
            const closeFooterBtn = document.getElementById("close-progress-modal-footer");
            if (closeBtn) closeBtn.addEventListener("click", closeProgress);
            if (closeFooterBtn) closeFooterBtn.addEventListener("click", closeProgress);
            progressModal.addEventListener("click", (e) => { if (e.target === progressModal) closeProgress(); });
        }

        // Edit Task Modal Handlers
        const editTaskModal = document.getElementById("edit-task-modal");
        if (editTaskModal) {
            const editCatInput = document.getElementById("edit-task-category");
            const editJournalFields = document.getElementById("edit-journal-fields");
            if (editCatInput && editJournalFields) {
                const toggleEditJournalFields = () => {
                    if (editCatInput.value && editCatInput.value.toLowerCase() === "jurnal") {
                        editJournalFields.classList.remove("hidden");
                    } else {
                        editJournalFields.classList.add("hidden");
                        const u = document.getElementById("edit-task-username");
                        const p = document.getElementById("edit-task-password");
                        if (u) u.value = "";
                        if (p) p.value = "";
                    }
                };
                editCatInput.addEventListener("input", toggleEditJournalFields);
                editCatInput.addEventListener("change", toggleEditJournalFields);
            }

            document.getElementById("close-edit-task-modal").addEventListener("click", () => {
                editTaskModal.classList.add("hidden");
            });
            document.getElementById("cancel-edit-task-modal").addEventListener("click", () => {
                editTaskModal.classList.add("hidden");
            });

            document.getElementById("edit-task-form").addEventListener("submit", async (e) => {
                e.preventDefault();
                const taskId = document.getElementById("edit-task-id").value;
                const title = document.getElementById("edit-task-name").value.trim();
                const description = document.getElementById("edit-task-desc").value.trim();
                const category = document.getElementById("edit-task-category").value;
                const deadline = document.getElementById("edit-task-deadline").value;

                const isJournal = category && category.toLowerCase() === "jurnal";
                let finalDesc = description;
                if (isJournal) {
                    const u = document.getElementById("edit-task-username").value.trim();
                    const p = document.getElementById("edit-task-password").value.trim();
                    finalDesc = DB.formatJournalDescription(description, u, p);
                }

                const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
                let assignedTo = document.getElementById("edit-task-assignee").value || Auth.currentUser.id;

                if (!isAdmin) {
                    const originalTask = DB.tasks.find(t => t.id === taskId);
                    if (originalTask) {
                        assignedTo = typeof originalTask.assignedTo === 'string' ? originalTask.assignedTo : (Array.isArray(originalTask.assignedTo) ? originalTask.assignedTo[0] : Auth.currentUser.id);
                    } else {
                        assignedTo = Auth.currentUser.id;
                    }
                }

                let priority = "Tinggi";
                const checkedPrio = document.querySelector('input[name="edit-priority"]:checked');
                if (checkedPrio) priority = checkedPrio.value;

                const originalTask = DB.tasks.find(t => t.id === taskId);
                const updatedData = {
                    title,
                    description: finalDesc,
                    category,
                    deadline,
                    priority,
                    assignedTo
                };

                await DB.updateTask(taskId, updatedData);

                // Notify new assignee if changed
                if (originalTask && originalTask.assignedTo !== assignedTo && assignedTo !== Auth.currentUser.id) {
                    await DB.addNotification(assignedTo, `Tugas "${title}" telah dialihkan kepada Anda oleh ${Auth.currentUser.name}.`, "task_added");
                }

                editTaskModal.classList.add("hidden");

                // Refresh dashboard or task list
                if (typeof renderDashboardTasks === 'function') renderDashboardTasks();
                if (typeof renderAllTasks === 'function') renderAllTasks();
                if (typeof updateStats === 'function') updateStats();

                window.showToast("Tugas berhasil diperbarui!", "success");
            });
        }

        window.openEditTaskModal = (taskId) => {
            const task = DB.tasks.find(t => t.id === taskId);
            if (!task) {
                window.showToast("Tugas tidak ditemukan!", "error");
                return;
            }

            const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
            if ((task.status === "Completed" || task.status === "Paid") && !isAdmin) {
                window.showToast("Tugas yang telah selesai hanya dapat diubah oleh Admin!", "error");
                return;
            }

            const { description: cleanDesc, username, password } = DB.parseJournalCredentials(task.description);
            const isJournal = task.category && task.category.toLowerCase() === "jurnal";

            document.getElementById("edit-task-id").value = task.id;
            document.getElementById("edit-task-name").value = task.title;
            document.getElementById("edit-task-desc").value = cleanDesc || "";
            document.getElementById("edit-task-category").value = task.category;
            document.getElementById("edit-task-deadline").value = task.deadline;

            const editJournalFields = document.getElementById("edit-journal-fields");
            const editUsername = document.getElementById("edit-task-username");
            const editPassword = document.getElementById("edit-task-password");
            if (editJournalFields && editUsername && editPassword) {
                if (isJournal) {
                    editJournalFields.classList.remove("hidden");
                    editUsername.value = username || "";
                    editPassword.value = password || "";
                } else {
                    editJournalFields.classList.add("hidden");
                    editUsername.value = "";
                    editPassword.value = "";
                }
            }

            // Single assignee: set select value
            const taskAssignee = typeof task.assignedTo === 'string'
                ? task.assignedTo
                : (Array.isArray(task.assignedTo) ? task.assignedTo[0] : '');
            const editSelect = document.getElementById("edit-task-assignee");
            if (editSelect) editSelect.value = taskAssignee || '';

            // Uncheck all edit priority radios first
            document.querySelectorAll('input[name="edit-priority"]').forEach(radio => {
                radio.checked = false;
            });

            // Check the one that matches task priority
            const priorityRadio = Array.from(document.querySelectorAll('input[name="edit-priority"]'))
                .find(r => r.value === task.priority);
            if (priorityRadio) {
                priorityRadio.checked = true;
            }

            if (editTaskModal) {
                editTaskModal.classList.remove("hidden");
            }
        };

        // Task Detail Modal - open function
        window.openTaskDetailModal = (taskId) => {
            const modal = document.getElementById("task-detail-modal");
            if (!modal) return;

            const task = DB.tasks.find(t => t.id === taskId);
            if (!task) return;

            modal.setAttribute("data-task-id", taskId);
            const assigneeId = typeof task.assignedTo === 'string' ? task.assignedTo : (Array.isArray(task.assignedTo) ? task.assignedTo[0] : '');
            const assignee = DB.users.find(u => u.id === assigneeId) || { name: 'Tidak Dikenal', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' };
            const assigneeName = assignee.name;
            const title = document.getElementById("task-detail-modal-title");
            if (title) title.textContent = task.title;

            const meta = document.getElementById("task-detail-meta");
            if (meta) {
                const statusBadge = task.status === "Completed"
                    ? `<span class="tag tag-status-completed">Selesai</span>`
                    : (task.status === "Paid" ? `<span class="tag" style="background-color: var(--success); color: white;">Sudah Dibayar</span>` : `<span class="tag tag-status-running">Berjalan</span>`);
                const prioClass = task.priority.toLowerCase();
                
                let formattedDeadline = '-';
                if (task.deadline) {
                    const d = new Date(task.deadline);
                    if (!isNaN(d.getTime())) {
                        formattedDeadline = d.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
                    } else {
                        formattedDeadline = task.deadline;
                    }
                }

                const { description: cleanDesc, username, password } = DB.parseJournalCredentials(task.description);

                meta.innerHTML = `
                    <div class="task-detail-info-grid">
                        <div class="detail-info-item">
                            <span class="detail-label">Status</span>
                            <div>${statusBadge}</div>
                        </div>
                        <div class="detail-info-item">
                            <span class="detail-label">Prioritas</span>
                            <span class="tag tag-prio-${prioClass}">${task.priority}</span>
                        </div>
                        <div class="detail-info-item">
                            <span class="detail-label">Kategori</span>
                            <span class="tag tag-cat-generic">${task.category}</span>
                        </div>
                        <div class="detail-info-item">
                            <span class="detail-label">Deadline</span>
                            <span style="font-weight: 600;">${formattedDeadline}</span>
                        </div>
                        <div class="detail-info-item" style="grid-column: span 2;">
                            <span class="detail-label">Anggota Tim</span>
                            <span>${assigneeName || '-'}</span>
                        </div>
                        ${username ? `<div class="detail-info-item">
                            <span class="detail-label">Username Jurnal</span>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${username}</span>
                                <button class="btn-copy-cred" data-copy="${username}" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; padding: 2px;" title="Salin Username">
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                            </div>
                        </div>` : ''}
                        ${password ? `<div class="detail-info-item">
                            <span class="detail-label">Password Jurnal</span>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${password}</span>
                                <button class="btn-copy-cred" data-copy="${password}" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; padding: 2px;" title="Salin Password">
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                            </div>
                        </div>` : ''}
                        ${cleanDesc ? `<div class="detail-info-item" style="grid-column: span 2;">
                            <span class="detail-label">Deskripsi</span>
                            <p style="margin:4px 0 0; color: var(--text-secondary); line-height: 1.5;">${cleanDesc}</p>
                        </div>` : ''}
                    </div>
                `;
            }

            // Render attachments
            const attachList = document.getElementById("task-attachment-list");
            if (attachList) {
                const attachments = task.attachments || [];
                if (attachments.length === 0) {
                    attachList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Belum ada lampiran.</p>`;
                } else {
                    attachList.innerHTML = attachments.map(att => {
                        const isImage = att.type && att.type.startsWith("image/");
                        const isPdf   = att.type === "application/pdf";
                        const icon = isImage
                            ? `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#10b981" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
                            : isPdf
                                ? `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#ef4444" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>`
                                : `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#6b7280" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
                        const sizeKb = att.size ? Math.round(att.size / 1024) : '?';
                        const canDelete = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager" || (task.createdBy === Auth.currentUser.id && task.status !== "Completed" && task.status !== "Paid");

                        // Jika file ada di Supabase Storage (att.url), gunakan proxy download
                        // agar file terunduh dengan benar (hindari masalah CORS & corrupt)
                        // Fallback ke att.data (base64) untuk file lama
                        let fileHref = '#';
                        if (att.url && att.url.startsWith('http')) {
                            // Proxy via backend — memastikan content-type & binary benar, dengan token auth
                            fileHref = `/api/upload/download?url=${encodeURIComponent(att.url)}&name=${encodeURIComponent(att.name)}&token=${encodeURIComponent(Auth.token || '')}`;
                        } else if (att.data) {
                            fileHref = att.data;
                        }

                        return `
                            <div class="attachment-item">
                                <a href="${fileHref}" download="${att.name}" target="_blank" rel="noopener noreferrer" class="attachment-link" title="${att.name}">
                                    ${icon}
                                    <span>${att.name}</span>
                                    <small>${sizeKb}KB</small>
                                </a>
                                ${canDelete ? `<button class="delete-attach-btn" data-attach-id="${att.id}" title="Hapus lampiran">
                                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>` : ''}
                            </div>
                        `;
                    }).join("");
                }
            }

            // Render comments
            this.renderTaskComments(taskId);

            // Hide dropzone and comment input for completed tasks if not admin
            const isCompletedTask = task.status === "Completed" || task.status === "Paid";
            const isUserAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";
            const dropZoneEl = document.getElementById("attachment-drop-zone");
            const commentInputRowEl = document.querySelector(".comment-input-row");
            if (dropZoneEl) {
                dropZoneEl.style.display = (isCompletedTask && !isUserAdmin) ? "none" : "block";
            }
            if (commentInputRowEl) {
                commentInputRowEl.style.display = (isCompletedTask && !isUserAdmin) ? "none" : "flex";
            }

            // Set current user avatar on comment input
            const commentAvatar = document.getElementById("comment-user-avatar");
            if (commentAvatar) commentAvatar.src = Auth.currentUser.avatar;

            modal.classList.remove("hidden");
        };
    },

    renderTaskComments(taskId) {
        const commentsList = document.getElementById("task-comments-list");
        if (!commentsList) return;

        const task = DB.tasks.find(t => t.id === taskId);
        if (!task) return;

        const progressUpdates = task.progressUpdates || [];

        if (progressUpdates.length === 0) {
            commentsList.innerHTML = `<p class="no-comments-msg">Belum ada laporan progress/komentar.</p>`;
            return;
        }

        commentsList.innerHTML = progressUpdates.map(c => {
            const user = DB.users.find(u => u.id === c.userId) || { name: c.userName || "?", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" };
            const isOwn = c.userId === Auth.currentUser.id;
            const timeAgo = this.formatTimeAgo(c.createdAt);
            
            // Allow deletion of progress reports by author (if not completed/paid) or admin/project manager
            const canDelete = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager" || (isOwn && task.status !== "Completed" && task.status !== "Paid");

            return `
                <div class="comment-bubble ${isOwn ? 'comment-own' : 'comment-other'}">
                    <img src="${user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'}" alt="${user.name}" class="comment-avatar-sm">
                    <div class="comment-content">
                        <div class="comment-header-row">
                            <span class="comment-author">${user.name}</span>
                            <span class="comment-time">${timeAgo}</span>
                            ${canDelete ? `<button class="delete-comment-btn" data-progress-id="${c.id}" title="Hapus progress update">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>` : ''}
                        </div>
                        <p class="comment-text">${c.text}</p>
                    </div>
                </div>
            `;
        }).join("");

        // Scroll to bottom of comments
        commentsList.scrollTop = commentsList.scrollHeight;
    },

    hydrateAssigneeDropdowns() {
        const taskAssigneeSelect = document.getElementById("task-assignee");
        const taskAssigneeSelectMob = document.getElementById("task-assignee-mob");
        const taskAssigneeSelectEdit = document.getElementById("edit-task-assignee");
        const toolbarAssigneeFilter = document.getElementById("filter-task-assignee");

        let optionsHtml = "";
        const activeEmployees = DB.users.filter(u => u.status === "Active");
        const isAdmin = Auth.currentUser.role === "Admin" || Auth.currentUser.role === "Project Manager";

        if (isAdmin) {
            activeEmployees.forEach(u => {
                const isSelf = u.id === Auth.currentUser.id ? " (Anda)" : "";
                optionsHtml += `<option value="${u.id}">${u.name}${isSelf}</option>`;
            });
            if (taskAssigneeSelect) {
                taskAssigneeSelect.disabled = false;
                const parent = taskAssigneeSelect.closest(".form-group");
                if (parent) parent.classList.remove("hidden");
            }
            if (taskAssigneeSelectMob) {
                taskAssigneeSelectMob.disabled = false;
                const parent = taskAssigneeSelectMob.closest(".form-group");
                if (parent) parent.classList.remove("hidden");
            }
            if (taskAssigneeSelectEdit) {
                taskAssigneeSelectEdit.disabled = false;
                const parent = taskAssigneeSelectEdit.closest(".form-group");
                if (parent) parent.classList.remove("hidden");
            }
        } else {
            optionsHtml += `<option value="${Auth.currentUser.id}">${Auth.currentUser.name} (Anda)</option>`;
            if (taskAssigneeSelect) {
                taskAssigneeSelect.disabled = true;
                const parent = taskAssigneeSelect.closest(".form-group");
                if (parent) parent.classList.add("hidden");
            }
            if (taskAssigneeSelectMob) {
                taskAssigneeSelectMob.disabled = true;
                const parent = taskAssigneeSelectMob.closest(".form-group");
                if (parent) parent.classList.add("hidden");
            }
            if (taskAssigneeSelectEdit) {
                taskAssigneeSelectEdit.disabled = true;
                const parent = taskAssigneeSelectEdit.closest(".form-group");
                if (parent) parent.classList.add("hidden");
            }
        }

        if (taskAssigneeSelect) taskAssigneeSelect.innerHTML = optionsHtml;
        if (taskAssigneeSelectMob) taskAssigneeSelectMob.innerHTML = optionsHtml;
        if (taskAssigneeSelectEdit) taskAssigneeSelectEdit.innerHTML = optionsHtml;

        // Filters dropdown setup
        let filterOptionsHtml = `<option value="all">Semua Karyawan</option>`;
        DB.users.forEach(u => {
            filterOptionsHtml += `<option value="${u.id}">${u.name}</option>`;
        });
        if (toolbarAssigneeFilter) toolbarAssigneeFilter.innerHTML = filterOptionsHtml;
    },

    hydrateCategoryDropdowns() {
        const filterCatSelect = document.getElementById("task-filter-category");
        const formCatSelect = document.getElementById("task-category-options");
        const formCatSelectMob = document.getElementById("task-category-mob-options");
        const formCatSelectEdit = document.getElementById("edit-task-category-options");

        const categories = DB.categories || [];

        // 1. Hydrate filters
        if (filterCatSelect) {
            let filterHtml = `<option value="all">Semua Kategori</option>`;
            categories.forEach(c => {
                filterHtml += `<option value="${c.name}">${c.name}</option>`;
            });
            filterCatSelect.innerHTML = filterHtml;
        }

        // 2. Hydrate forms
        let formHtml = "";
        categories.forEach(c => {
            formHtml += `<option value="${c.name}">${c.name}</option>`;
        });

        if (formCatSelect) formCatSelect.innerHTML = formHtml;
        if (formCatSelectMob) formCatSelectMob.innerHTML = formHtml;
        if (formCatSelectEdit) formCatSelectEdit.innerHTML = formHtml;
    },

    renderNotifications() {
        const userNotifs = DB.notifications.filter(n => n.userId === Auth.currentUser.id);
        const unreadCount = userNotifs.filter(n => !n.isRead).length;

        const badge = document.getElementById("notification-badge-count");
        const badgeMobile = document.getElementById("notification-badge-count-mobile");

        if (badge) {
            badge.textContent = unreadCount;
            if (unreadCount > 0) badge.classList.remove("hidden");
            else badge.classList.add("hidden");
        }
        if (badgeMobile) {
            badgeMobile.textContent = unreadCount;
            if (unreadCount > 0) badgeMobile.classList.remove("hidden");
            else badgeMobile.classList.add("hidden");
        }

        const listContainer = document.getElementById("notification-list-container");
        const listContainerMobile = document.getElementById("notification-list-container-mobile");

        const generateHtml = (notifs) => {
            if (notifs.length === 0) {
                return `<div class="notification-empty">Tidak ada notifikasi baru.</div>`;
            }
            return notifs.map(n => {
                const unreadClass = n.isRead ? "" : "unread";
                let icon = "";
                if (n.type === "task_added") {
                    icon = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
                } else if (n.type === "task_completed") {
                    icon = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                } else if (n.type === "deadline_reminder") {
                    icon = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="#f59e0b" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
                } else {
                    icon = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
                }
                const timeAgo = this.formatTimeAgo(n.timestamp);

                return `
                    <div class="notification-item ${unreadClass}" onclick="Layout.markNotifRead('${n.id}')">
                        <div class="notification-item-icon icon-${n.type}">
                            ${icon}
                        </div>
                        <div class="notification-item-content">
                            <div class="notification-item-text">${n.message}</div>
                            <div class="notification-item-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            }).join("");
        };

        const html = generateHtml(userNotifs);
        if (listContainer) listContainer.innerHTML = html;
        if (listContainerMobile) listContainerMobile.innerHTML = html;

        // Attach listeners for Mark All Read
        const markReadBtn = document.getElementById("mark-all-read-btn");
        if (markReadBtn) {
            markReadBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.markAllNotifsRead();
            };
        }
        const markReadBtnMob = document.getElementById("mark-all-read-btn-mobile");
        if (markReadBtnMob) {
            markReadBtnMob.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.markAllNotifsRead();
            };
        }
    },

    async markNotifRead(notifId) {
        await DB.markNotificationRead(notifId);
        this.renderNotifications();
    },

    async markAllNotifsRead() {
        await DB.markAllNotificationsRead(Auth.currentUser.id);
        this.renderNotifications();
        window.showToast("Semua notifikasi ditandai sebagai dibaca.", "success");
    },

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
        const isEn = savedLang === "en";

        if (seconds < 60) return isEn ? "Just now" : "Baru saja";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return isEn ? `${minutes}m ago` : `${minutes} m yang lalu`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return isEn ? `${hours}h ago` : `${hours} jam yang lalu`;
        const days = Math.floor(hours / 24);
        if (days === 1) return isEn ? "Yesterday" : "Kemarin";

        const monthsId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const months = isEn ? monthsEn : monthsId;
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
};

window.showToast = function (message, type = "info") {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;

    // Translation logic for dynamic / static toast messages
    const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
    if (savedLang === "en") {
        if (Layout && Layout.dictionary) {
            if (Layout.dictionary[message]) {
                message = Layout.dictionary[message];
            } else {
                for (const [key, value] of Object.entries(Layout.dictionary)) {
                    if (message.includes(key)) {
                        message = message.replace(key, value);
                    }
                }
            }
        }
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
        iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#10b981" stroke-width="2.5" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === "error") {
        iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#EF4444" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#0A52C6" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
};

// Global confirm override to support translation
const nativeConfirm = window.confirm;
window.confirm = function (message) {
    const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
    if (savedLang === "en") {
        if (Layout && Layout.dictionary) {
            if (Layout.dictionary[message]) {
                message = Layout.dictionary[message];
            } else {
                for (const [key, value] of Object.entries(Layout.dictionary)) {
                    if (message.includes(key)) {
                        message = message.replace(key, value);
                    }
                }
            }
        }
    }
    return nativeConfirm(message);
};

// Global alert override to support translation
const nativeAlert = window.alert;
window.alert = function (message) {
    const savedLang = localStorage.getItem("dzhirasena_lang") || "id";
    if (savedLang === "en") {
        if (Layout && Layout.dictionary) {
            if (Layout.dictionary[message]) {
                message = Layout.dictionary[message];
            } else {
                for (const [key, value] of Object.entries(Layout.dictionary)) {
                    if (message.includes(key)) {
                        message = message.replace(key, value);
                    }
                }
            }
        }
    }
    return nativeAlert(message);
};
