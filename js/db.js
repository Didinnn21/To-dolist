// ==========================================================================
// DZHIRASENA - CENTRALIZED DATABASE API CLIENT (v4.0 - Express.js Backend)
// Semua operasi data sekarang melewati Express.js REST API
// Tidak ada lagi koneksi Supabase langsung dari browser
// ==========================================================================

const DB = {
    users: [],
    tasks: [],
    notifications: [],
    categories: [],
    comments: [],

    // ── HELPER: API Fetch dengan auth header ─────────────────────────────────
    async _fetch(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...Auth.getAuthHeader(),
            ...(options.headers || {})
        };

        const res = await fetch(`/api${endpoint}`, {
            ...options,
            headers
        });

        // Jika 401 → token expired → redirect ke login (kecuali sudah di login page)
        if (res.status === 401) {
            Auth._clearSession();
            sessionStorage.removeItem('dzhirasena_db_cache');
            const path = window.location.pathname.toLowerCase();
            const isLoginPage = path === '/' || path.endsWith('/index.html') || path.endsWith('/');
            if (!isLoginPage) {
                if (window.showToast) window.showToast('Sesi berakhir. Silakan login kembali.', 'error');
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            }
            throw new Error('Unauthorized');
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || `HTTP Error ${res.status}`);
        }

        return data;
    },

    // Helper: parse assignedTo field → selalu array
    _parseAssignees(val) {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch {
            return [String(val)];
        }
    },

    // Parse credentials from description
    parseJournalCredentials(description) {
        if (!description) return { description: "", username: "", password: "" };
        const marker = "\n\n--- Jurnal Credentials ---\n";
        const idx = description.indexOf(marker);
        if (idx === -1) {
            return { description, username: "", password: "" };
        }
        const cleanDesc = description.substring(0, idx);
        const credsStr = description.substring(idx + marker.length);
        const lines = credsStr.split("\n");
        let username = "";
        let password = "";
        for (const line of lines) {
            if (line.startsWith("Username: ")) {
                username = line.substring("Username: ".length);
            } else if (line.startsWith("Password: ")) {
                password = line.substring("Password: ".length);
            }
        }
        return { description: cleanDesc, username, password };
    },

    // Format description with credentials
    formatJournalDescription(description, username, password) {
        if (!username && !password) return description;
        return `${description}\n\n--- Jurnal Credentials ---\nUsername: ${username}\nPassword: ${password}`;
    },

    // ── INIT: Ambil semua data dari Express API ───────────────────────────────
    async init() {
        // Tunggu Auth.init() selesai dulu (cegah race condition)
        // Auth._ready adalah promise yang disimpan saat auth.js DOMContentLoaded
        if (typeof Auth !== 'undefined' && Auth._ready) {
            await Auth._ready;
        }

        // Jika tidak ada token (belum login), skip fetch data
        // Ini mencegah reload loop di halaman login
        if (!Auth.token) {
            console.log('DB.init: Tidak ada token, skip fetch data (halaman login).');
            return;
        }

        const cachedDataStr = sessionStorage.getItem('dzhirasena_db_cache');
        if (cachedDataStr) {
            try {
                const cachedData = JSON.parse(cachedDataStr);
                const cacheAge = Date.now() - (cachedData._cachedAt || 0);
                // Cache valid selama 5 menit
                if (cacheAge < 5 * 60 * 1000) {
                    this.users = cachedData.users || [];
                    this.tasks = cachedData.tasks || [];
                    this.categories = cachedData.categories || [];
                    this.notifications = cachedData.notifications || [];
                    this.comments = cachedData.comments || [];
                    this._checkDeadlineReminders();
                    console.log('Data dimuat dari cache session.');
                    return;
                } else {
                    sessionStorage.removeItem('dzhirasena_db_cache');
                }
            } catch (e) {
                sessionStorage.removeItem('dzhirasena_db_cache');
            }
        }

        try {
            // Ambil semua data secara paralel
            const [usersData, tasksData, categoriesData, notifsData] = await Promise.all([
                this._fetch('/users'),
                this._fetch('/tasks'),
                this._fetch('/categories'),
                this._fetch('/notifications')
            ]);

            this.users = usersData.users || [];
            this.tasks = tasksData.tasks || [];
            this.categories = categoriesData.categories || [];
            this.notifications = notifsData.notifications || [];
            this.comments = []; // Comments fetched per-task jika dibutuhkan

            // Simpan ke session cache
            sessionStorage.setItem('dzhirasena_db_cache', JSON.stringify({
                users: this.users,
                tasks: this.tasks,
                categories: this.categories,
                notifications: this.notifications,
                comments: this.comments,
                _cachedAt: Date.now()
            }));

            this._checkDeadlineReminders();
            console.log('✅ Data berhasil dimuat dari Express API.');

        } catch (err) {
            if (err.message === 'Unauthorized') return; // sudah dihandle redirect
            console.error('Gagal memuat data dari API:', err.message);
            if (window.showToast) {
                window.showToast('Gagal memuat data. Pastikan server backend berjalan.', 'error');
            } else {
                console.error('❌ Server tidak merespons. Jalankan: npm run server:dev');
            }
        }
    },

    // ── Invalidate cache setelah operasi write ────────────────────────────────
    _invalidateCache() {
        sessionStorage.removeItem('dzhirasena_db_cache');
    },

    // ── CHECK DEADLINE REMINDERS (tidak lagi duplikat) ────────────────────────
    _checkDeadlineReminders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);
        const todayStr = today.toISOString().split('T')[0];

        this.tasks.forEach(task => {
            if (task.status === 'Completed' || task.status === 'Paid' || !task.deadline) return;

            const deadlineDate = new Date(task.deadline);
            deadlineDate.setHours(0, 0, 0, 0);

            if (deadlineDate <= threeDaysLater) {
                const assignees = this._parseAssignees(task.assignedTo);
                const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

                assignees.forEach(userId => {
                    // Cek apakah reminder sudah ada hari ini (cegah duplikat)
                    const alreadyNotified = this.notifications.some(n =>
                        n.userId === userId &&
                        n.type === 'deadline_reminder' &&
                        n.message.includes(task.id) &&
                        n.timestamp && n.timestamp.startsWith(todayStr)
                    );

                    if (!alreadyNotified && Auth.currentUser && Auth.currentUser.id === userId) {
                        let msg;
                        if (daysLeft <= 0) {
                            msg = `⚠️ Deadline tugas "${task.title}" sudah LEWAT! [${task.id}]`;
                        } else if (daysLeft === 1) {
                            msg = `🔔 Tugas "${task.title}" deadline BESOK! [${task.id}]`;
                        } else {
                            msg = `🔔 Tugas "${task.title}" deadline dalam ${daysLeft} hari. [${task.id}]`;
                        }

                        // Tambahkan notifikasi hanya ke in-memory (tidak spam API)
                        this.notifications.unshift({
                            id: `notif-deadline-${task.id}-${userId}-${todayStr}`,
                            userId,
                            message: msg,
                            type: 'deadline_reminder',
                            timestamp: new Date().toISOString(),
                            isRead: false
                        });
                    }
                });
            }
        });
    },

    // ── UPLOAD FILE ───────────────────────────────────────────────────────────
    async uploadFiles(files) {
        if (!files || files.length === 0) return [];

        try {
            // Kirim file ke Express backend via /api/upload
            // Express akan upload ke Supabase Storage dan kembalikan URL publik
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            const res = await fetch('/api/upload', {
                method: 'POST',
                // JANGAN set Content-Type — biarkan browser set otomatis dengan boundary
                headers: { ...Auth.getAuthHeader() },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Upload gagal: HTTP ${res.status}`);
            }

            const data = await res.json();

            if (data.errors && data.errors.length > 0) {
                console.warn('Beberapa file gagal diupload:', data.errors);
            }

            return data.uploaded || [];
        } catch (err) {
            console.error('uploadFiles error:', err.message);
            if (window.showToast) window.showToast('Gagal mengunggah file: ' + err.message, 'error');
            return [];
        }
    },

    // ============================================================
    // TASKS CRUD
    // ============================================================

    async addTask(task) {
        this._invalidateCache();
        task.assignedTo = this._parseAssignees(task.assignedTo);
        task.attachments = task.attachments || [];

        try {
            const data = await this._fetch('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    title: task.title,
                    description: task.description,
                    category: task.category,
                    deadline: task.deadline,
                    priority: task.priority,
                    assignedTo: task.assignedTo,
                    attachments: task.attachments
                })
            });
            // Update local state
            this.tasks.unshift(data.task);
            return data.task;
        } catch (err) {
            console.error('Gagal menambahkan tugas:', err.message);
            if (window.showToast) window.showToast('Gagal menambahkan tugas: ' + err.message, 'error');
            throw err;
        }
    },

    async updateTaskStatus(taskId, status) {
        this._invalidateCache();
        const task = this.tasks.find(t => t.id === taskId);
        if (task) task.status = status; // optimistic update

        try {
            await this._fetch(`/tasks/${taskId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
        } catch (err) {
            // Rollback optimistic update on error
            if (task) task.status = task._prevStatus || task.status;
            console.error('Gagal update status:', err.message);
            if (window.showToast) window.showToast('Gagal update status: ' + err.message, 'error');
        }
    },

    async updateTask(taskId, updatedData) {
        this._invalidateCache();
        if (updatedData.assignedTo) {
            updatedData.assignedTo = this._parseAssignees(updatedData.assignedTo);
        }

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedData }; // optimistic
        }

        try {
            const data = await this._fetch(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });
            if (taskIndex !== -1) this.tasks[taskIndex] = data.task;
        } catch (err) {
            console.error('Gagal update tugas:', err.message);
            if (window.showToast) window.showToast('Gagal memperbarui tugas: ' + err.message, 'error');
        }
    },

    async deleteTask(taskId) {
        this._invalidateCache();
        this.tasks = this.tasks.filter(t => t.id !== taskId); // optimistic
        this.comments = this.comments.filter(c => c.taskId !== taskId);

        try {
            await this._fetch(`/tasks/${taskId}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Gagal menghapus tugas:', err.message);
            if (window.showToast) window.showToast('Gagal menghapus tugas: ' + err.message, 'error');
        }
    },

    async addProgressUpdate(taskId, userId, userName, text) {
        this._invalidateCache();
        try {
            const data = await this._fetch(`/tasks/${taskId}/progress`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                if (!task.progressUpdates) task.progressUpdates = [];
                task.progressUpdates.push(data.progressUpdate);
            }
            return data.progressUpdate;
        } catch (err) {
            console.error('Gagal menambahkan progress update:', err.message);
            return null;
        }
    },

    async deleteProgressUpdate(taskId, progressId) {
        this._invalidateCache();
        try {
            await this._fetch(`/tasks/${taskId}/progress/${progressId}`, {
                method: 'DELETE'
            });
            const task = this.tasks.find(t => t.id === taskId);
            if (task && task.progressUpdates) {
                task.progressUpdates = task.progressUpdates.filter(upd => upd.id !== progressId);
            }
            return true;
        } catch (err) {
            console.error('Gagal menghapus progress update:', err.message);
            if (window.showToast) window.showToast('Gagal menghapus progress: ' + err.message, 'error');
            return false;
        }
    },

    async addAttachment(taskId, attachment) {
        this._invalidateCache();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        if (!task.attachments) task.attachments = [];
        task.attachments.push(attachment); // optimistic

        try {
            await this._fetch(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({ attachments: task.attachments })
            });
        } catch (err) {
            console.error('Gagal menyimpan lampiran:', err.message);
        }
    },

    async removeAttachment(taskId, attachmentId) {
        this._invalidateCache();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.attachments) return;
        task.attachments = task.attachments.filter(a => a.id !== attachmentId); // optimistic

        try {
            await this._fetch(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({ attachments: task.attachments })
            });
        } catch (err) {
            console.error('Gagal menghapus lampiran:', err.message);
        }
    },

    // ============================================================
    // USERS CRUD
    // ============================================================

    async addUser(user) {
        this._invalidateCache();
        try {
            const data = await this._fetch('/users', {
                method: 'POST',
                body: JSON.stringify(user)
            });
            if (data.user) this.users.push(data.user);
            return { success: true };
        } catch (err) {
            console.error('Gagal menambahkan user:', err.message);
            return { success: false, message: err.message };
        }
    },

    async updateUserStatus(userId, status) {
        this._invalidateCache();
        const user = this.users.find(u => u.id === userId);
        if (user) user.status = status; // optimistic

        try {
            await this._fetch(`/users/${userId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
        } catch (err) {
            if (user) user.status = status === 'Active' ? 'Inactive' : 'Active'; // rollback
            console.error('Gagal update status user:', err.message);
        }
    },

    async updateUserAvatar(userId, avatar) {
        this._invalidateCache();
        const user = this.users.find(u => u.id === userId);
        if (user) user.avatar = avatar; // optimistic

        try {
            await this._fetch(`/users/${userId}/avatar`, {
                method: 'PUT',
                body: JSON.stringify({ avatar })
            });
            // Update cache user juga
            if (Auth.currentUser && Auth.currentUser.id === userId) {
                Auth.currentUser.avatar = avatar;
                localStorage.setItem('dzhirasena_user_cache', JSON.stringify(Auth.currentUser));
            }
        } catch (err) {
            console.error('Gagal update avatar:', err.message);
        }
    },

    async updateUserName(userId, name) {
        this._invalidateCache();
        const user = this.users.find(u => u.id === userId);
        if (user) user.name = name; // optimistic

        try {
            await this._fetch(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ name })
            });
        } catch (err) {
            console.error('Gagal update nama user:', err.message);
            throw err;
        }
    },

    async updateUserProfile(userId, profileData) {
        this._invalidateCache();
        const user = this.users.find(u => u.id === userId);
        if (user) {
            if (profileData.name !== undefined) user.name = profileData.name;
            if (profileData.npwp !== undefined) user.npwp = profileData.npwp;
            if (profileData.cv_url !== undefined) user.cv_url = profileData.cv_url;
            if (profileData.portfolio_url !== undefined) user.portfolio_url = profileData.portfolio_url;
            if (profileData.address !== undefined) user.address = profileData.address;
            if (profileData.gender !== undefined) user.gender = profileData.gender;
            if (profileData.bank_account !== undefined) user.bank_account = profileData.bank_account;
            if (profileData.ktp_url !== undefined) user.ktp_url = profileData.ktp_url;
        }

        try {
            const data = await this._fetch(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            return data.user;
        } catch (err) {
            console.error('Gagal memperbarui profil:', err.message);
            throw err;
        }
    },

    async updateUserPassword(userId, password) {
        try {
            await this._fetch(`/users/${userId}/password`, {
                method: 'PUT',
                body: JSON.stringify({ password })
            });
            return { success: true };
        } catch (err) {
            console.error('Gagal update password:', err.message);
            throw err;
        }
    },

    async updateUserRoleAndName(userId, name, role) {
        this._invalidateCache();
        const user = this.users.find(u => u.id === userId);
        if (user) { user.name = name; user.role = role; } // optimistic

        try {
            await this._fetch(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ name, role })
            });
        } catch (err) {
            console.error('Gagal update role user:', err.message);
            throw err;
        }
    },

    async deleteUser(userId) {
        this._invalidateCache();
        this.users = this.users.filter(u => u.id !== userId); // optimistic

        try {
            await this._fetch(`/users/${userId}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Gagal hapus user:', err.message);
            if (window.showToast) window.showToast('Gagal menghapus user: ' + err.message, 'error');
        }
    },

    // ============================================================
    // CATEGORIES CRUD
    // ============================================================

    async addCategory(category) {
        this._invalidateCache();
        try {
            const data = await this._fetch('/categories', {
                method: 'POST',
                body: JSON.stringify({ name: category.name })
            });
            this.categories.push(data.category);
            return data.category;
        } catch (err) {
            console.error('Gagal menambahkan kategori:', err.message);
        }
    },

    async deleteCategory(catId) {
        this._invalidateCache();
        this.categories = this.categories.filter(c => c.id !== catId); // optimistic

        try {
            await this._fetch(`/categories/${catId}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Gagal menghapus kategori:', err.message);
        }
    },

    // ============================================================
    // NOTIFICATIONS
    // ============================================================

    async addNotification(userId, message, type = 'info') {
        this._invalidateCache();
        try {
            const data = await this._fetch('/notifications', {
                method: 'POST',
                body: JSON.stringify({ userId, message, type })
            });
            this.notifications.unshift(data.notification);
            return data.notification;
        } catch (err) {
            console.error('Gagal menambahkan notifikasi:', err.message);
        }
    },

    async markNotificationRead(notifId) {
        this._invalidateCache();
        const notif = this.notifications.find(n => n.id === notifId);
        if (notif) notif.isRead = true; // optimistic

        try {
            await this._fetch(`/notifications/${notifId}/read`, { method: 'PUT' });
        } catch (err) {
            console.error('Gagal tandai notifikasi dibaca:', err.message);
        }
    },

    async markAllNotificationsRead(userId) {
        this._invalidateCache();
        this.notifications.forEach(n => {
            if (n.userId === userId) n.isRead = true;
        }); // optimistic

        try {
            await this._fetch('/notifications/read-all', { method: 'PUT' });
        } catch (err) {
            console.error('Gagal tandai semua notifikasi dibaca:', err.message);
        }
    },

    // ============================================================
    // HONOR PAYMENT (BUG FIX: sekarang tersinkron ke Supabase)
    // ============================================================

    async saveHonorPayment(employeeId, employeeName, amount, completedTaskIds, taskAmounts) {
        this._invalidateCache();
        try {
            const data = await this._fetch('/honor/pay', {
                method: 'POST',
                body: JSON.stringify({
                    employeeId,
                    employeeName,
                    amount,
                    taskIds: completedTaskIds,
                    taskAmounts
                })
            });

            // Update task status ke 'Paid' dan set honorAmount di local state
            completedTaskIds.forEach(taskId => {
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = 'Paid';
                    if (taskAmounts && taskAmounts[taskId]) {
                        task.honorAmount = Number(taskAmounts[taskId]);
                    }
                }
            });

            if (window.showToast) window.showToast(data.message, 'success');
            return { success: true };
        } catch (err) {
            console.error('Gagal memproses pembayaran honor:', err.message);
            if (window.showToast) window.showToast('Gagal memproses honor: ' + err.message, 'error');
            return { success: false, message: err.message };
        }
    },

    // ============================================================
    // COMMENTS (Legacy - tetap dipertahankan untuk kompatibilitas)
    // ============================================================

    async addComment(taskId, message) {
        const newComment = {
            id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            taskId,
            userId: Auth.currentUser ? Auth.currentUser.id : 'unknown',
            message,
            timestamp: new Date().toISOString()
        };
        this.comments.push(newComment);
        return newComment;
    },

    async deleteComment(commentId) {
        this.comments = this.comments.filter(c => c.id !== commentId);
    },

    // ── BACKWARD COMPATIBILITY: metode yang masih dipanggil kode lama ──────────

    // Dulu dipakai untuk simpan ke localStorage - sekarang no-op (tidak perlu lagi)
    saveUsers() {},
    saveTasks() {},
    saveCategories() {},
    saveNotifications() {},
    saveComments() {}
};
