// ==========================================================================
// DZHIRASENA - CENTRALIZED DATABASE CLIENT (v5.0 - Direct Supabase REST)
// Semua operasi data langsung ke Supabase REST API (tanpa Express backend)
// Gunakan anon key + Supabase access_token milik user yang sedang login
// ==========================================================================

const SUPABASE_URL  = 'https://wrcenmpkawyovpsuwbaz.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyY2VubXBrYXd5b3Zwc3V3YmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzExNTgsImV4cCI6MjA5NzEwNzE1OH0.4gQMXu49zKleA9LAV8MsGFcKvVETiCrU-Mc-lAk5Vx4';

const DB = {
    users: [],
    tasks: [],
    notifications: [],
    categories: [],
    comments: [],

    // ── HELPER: Supabase REST fetch ───────────────────────────────────────────
    async _sb(path, options = {}) {
        const token = Auth.token;
        const headers = {
            'apikey': SUPABASE_ANON,
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };

        const res = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });

        // 401 → sesi berakhir → redirect ke login
        if (res.status === 401) {
            Auth._clearSession();
            sessionStorage.removeItem('dzhirasena_db_cache');
            const path2 = window.location.pathname.toLowerCase();
            const isLoginPage = path2 === '/' || path2.endsWith('/index.html') || path2 === '';
            if (!isLoginPage) {
                if (window.showToast) window.showToast('Sesi berakhir. Silakan login kembali.', 'error');
                setTimeout(() => { window.location.href = '/'; }, 1500);
            }
            throw new Error('Unauthorized');
        }

        // Untuk DELETE dan operasi tanpa body response
        if (res.status === 204) return {};

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || data.hint || `HTTP Error ${res.status}`);
        }

        return data;
    },

    // ── Helper: parse assignedTo field → selalu array ──────────────────────────
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

    // ── Helper: map Supabase task row ke format frontend ───────────────────────
    _mapTask(t) {
        return {
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            deadline: t.deadline,
            priority: t.priority,
            assignedTo: this._parseAssignees(t.assigned_to),
            createdBy: t.created_by || null,
            status: t.status,
            createdAt: t.created_at,
            honorAmount: t.honor_amount || 0,
            attachments: (() => {
                try { return t.attachments ? JSON.parse(t.attachments) : []; }
                catch { return []; }
            })(),
            progressUpdates: (() => {
                try { return t.progress_updates ? JSON.parse(t.progress_updates) : []; }
                catch { return []; }
            })()
        };
    },

    // ── Helper: parse credentials dari description ──────────────────────────────
    parseJournalCredentials(description) {
        if (!description) return { description: "", username: "", password: "" };
        const marker = "\n\n--- Jurnal Credentials ---\n";
        const idx = description.indexOf(marker);
        if (idx === -1) return { description, username: "", password: "" };
        const cleanDesc = description.substring(0, idx);
        const credsStr  = description.substring(idx + marker.length);
        let username = "", password = "";
        for (const line of credsStr.split("\n")) {
            if (line.startsWith("Username: ")) username = line.substring(10);
            else if (line.startsWith("Password: ")) password = line.substring(10);
        }
        return { description: cleanDesc, username, password };
    },

    formatJournalDescription(description, username, password) {
        if (!username && !password) return description;
        return `${description}\n\n--- Jurnal Credentials ---\nUsername: ${username}\nPassword: ${password}`;
    },

    // ── INVALIDATE CACHE ───────────────────────────────────────────────────────
    _invalidateCache() {
        sessionStorage.removeItem('dzhirasena_db_cache');
    },

    // ── INIT: Ambil semua data dari Supabase ───────────────────────────────────
    async init() {
        if (typeof Auth !== 'undefined' && Auth._ready) {
            await Auth._ready;
        }

        if (!Auth.token) {
            console.log('DB.init: Tidak ada token, skip fetch data (halaman login).');
            return;
        }

        // Cek session cache (5 menit)
        const cachedDataStr = sessionStorage.getItem('dzhirasena_db_cache');
        if (cachedDataStr) {
            try {
                const cachedData = JSON.parse(cachedDataStr);
                const cacheAge   = Date.now() - (cachedData._cachedAt || 0);
                if (cacheAge < 5 * 60 * 1000) {
                    this.users         = cachedData.users         || [];
                    this.tasks         = cachedData.tasks         || [];
                    this.categories    = cachedData.categories    || [];
                    this.notifications = cachedData.notifications || [];
                    this.comments      = cachedData.comments      || [];
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
            const userId = Auth.currentUser ? Auth.currentUser.id : null;

            // Ambil semua data secara paralel
            const [usersRes, tasksRes, catsRes, notifsRes] = await Promise.all([
                this._sb('/rest/v1/wf_users?select=id,name,email,role,avatar,status,npwp,cv_url,portfolio_url,address,gender,bank_account,ktp_url&order=name'),
                this._sb('/rest/v1/wf_tasks?select=*&order=created_at.desc'),
                this._sb('/rest/v1/wf_categories?select=*&order=name'),
                userId
                    ? this._sb(`/rest/v1/wf_notifications?user_id=eq.${userId}&select=*&order=timestamp.desc&limit=50`)
                    : Promise.resolve([])
            ]);

            this.users         = Array.isArray(usersRes)  ? usersRes  : [];
            this.tasks         = Array.isArray(tasksRes)  ? tasksRes.map(t => this._mapTask(t))  : [];
            this.categories    = Array.isArray(catsRes)   ? catsRes   : [];
            this.notifications = Array.isArray(notifsRes) ? notifsRes.map(n => ({
                id:        n.id,
                userId:    n.user_id,
                message:   n.message,
                type:      n.type,
                timestamp: n.timestamp,
                isRead:    n.is_read
            })) : [];
            this.comments = [];

            // Simpan ke session cache
            sessionStorage.setItem('dzhirasena_db_cache', JSON.stringify({
                users:         this.users,
                tasks:         this.tasks,
                categories:    this.categories,
                notifications: this.notifications,
                comments:      this.comments,
                _cachedAt:     Date.now()
            }));

            this._checkDeadlineReminders();
            console.log('✅ Data berhasil dimuat dari Supabase.');

        } catch (err) {
            if (err.message === 'Unauthorized') return;
            console.error('Gagal memuat data:', err.message);
            if (window.showToast) {
                window.showToast('Gagal memuat data dari server.', 'error');
            }
        }
    },

    // ── CHECK DEADLINE REMINDERS ───────────────────────────────────────────────
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
                const daysLeft  = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

                assignees.forEach(userId => {
                    const alreadyNotified = this.notifications.some(n =>
                        n.userId === userId &&
                        n.type === 'deadline_reminder' &&
                        n.message.includes(task.id) &&
                        n.timestamp && n.timestamp.startsWith(todayStr)
                    );

                    if (!alreadyNotified && Auth.currentUser && Auth.currentUser.id === userId) {
                        let msg;
                        if (daysLeft <= 0)      msg = `⚠️ Deadline tugas "${task.title}" sudah LEWAT! [${task.id}]`;
                        else if (daysLeft === 1) msg = `🔔 Tugas "${task.title}" deadline BESOK! [${task.id}]`;
                        else                    msg = `🔔 Tugas "${task.title}" deadline dalam ${daysLeft} hari. [${task.id}]`;

                        this.notifications.unshift({
                            id:        `notif-deadline-${task.id}-${userId}-${todayStr}`,
                            userId,
                            message:   msg,
                            type:      'deadline_reminder',
                            timestamp: new Date().toISOString(),
                            isRead:    false
                        });
                    }
                });
            }
        });
    },

    // ── UPLOAD FILE (Supabase Storage) ─────────────────────────────────────────
    async uploadFiles(files) {
        if (!files || files.length === 0) return [];
        const uploaded = [];
        const BUCKET   = 'attachments';

        for (let i = 0; i < files.length; i++) {
            const file     = files[i];
            const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const filePath = `tasks/${safeName}`;

            try {
                const res = await fetch(
                    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filePath}`,
                    {
                        method:  'POST',
                        headers: {
                            'apikey':        SUPABASE_ANON,
                            'Authorization': `Bearer ${Auth.token}`,
                            'Content-Type':  file.type || 'application/octet-stream',
                            'x-upsert':      'true'
                        },
                        body: file
                    }
                );

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    console.warn('Upload gagal untuk', file.name, ':', err.message || res.status);
                    continue;
                }

                // URL publik
                const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
                uploaded.push({
                    id:       `att-${Date.now()}-${i}`,
                    name:     file.name,
                    url:      publicUrl,
                    type:     file.type,
                    size:     file.size,
                    uploadedAt: new Date().toISOString()
                });
            } catch (err) {
                console.warn('Upload error untuk', file.name, ':', err.message);
            }
        }

        if (uploaded.length === 0 && files.length > 0) {
            if (window.showToast) window.showToast('Gagal mengunggah file. Periksa bucket Supabase Storage.', 'error');
        }

        return uploaded;
    },

    // ==========================================================================
    // TASKS CRUD
    // ==========================================================================

    async addTask(task) {
        this._invalidateCache();
        task.assignedTo  = this._parseAssignees(task.assignedTo);
        task.attachments = task.attachments || [];

        const newTask = {
            id:           `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            title:        task.title,
            description:  task.description  || '',
            category:     task.category     || '',
            deadline:     task.deadline,
            priority:     task.priority,
            assigned_to:  JSON.stringify(task.assignedTo),
            created_by:   Auth.currentUser ? Auth.currentUser.id : null,
            status:       'In Progress',
            attachments:  task.attachments.length > 0 ? JSON.stringify(task.attachments) : null,
            created_at:   new Date().toISOString()
        };

        try {
            const res = await this._sb('/rest/v1/wf_tasks?select=*', {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(newTask)
            });
            const created = Array.isArray(res) ? res[0] : res;
            const mapped  = this._mapTask(created);
            this.tasks.unshift(mapped);
            return mapped;
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
            await this._sb(`/rest/v1/wf_tasks?id=eq.${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
        } catch (err) {
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

        // Map frontend keys ke Supabase columns
        const dbData = {};
        if (updatedData.title       !== undefined) dbData.title       = updatedData.title;
        if (updatedData.description !== undefined) dbData.description = updatedData.description;
        if (updatedData.category    !== undefined) dbData.category    = updatedData.category;
        if (updatedData.deadline    !== undefined) dbData.deadline    = updatedData.deadline;
        if (updatedData.priority    !== undefined) dbData.priority    = updatedData.priority;
        if (updatedData.assignedTo  !== undefined) dbData.assigned_to = JSON.stringify(updatedData.assignedTo);
        if (updatedData.attachments !== undefined) dbData.attachments = JSON.stringify(updatedData.attachments);

        try {
            const res = await this._sb(`/rest/v1/wf_tasks?id=eq.${taskId}&select=*`, {
                method: 'PATCH',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(dbData)
            });
            const updated = Array.isArray(res) ? res[0] : res;
            if (taskIndex !== -1 && updated) this.tasks[taskIndex] = this._mapTask(updated);
        } catch (err) {
            console.error('Gagal update tugas:', err.message);
            if (window.showToast) window.showToast('Gagal memperbarui tugas: ' + err.message, 'error');
        }
    },

    async deleteTask(taskId) {
        this._invalidateCache();
        this.tasks    = this.tasks.filter(t => t.id !== taskId);
        this.comments = this.comments.filter(c => c.taskId !== taskId);

        try {
            await this._sb(`/rest/v1/wf_tasks?id=eq.${taskId}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Gagal menghapus tugas:', err.message);
            if (window.showToast) window.showToast('Gagal menghapus tugas: ' + err.message, 'error');
        }
    },

    async addProgressUpdate(taskId, userId, userName, text) {
        this._invalidateCache();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return null;

        const progressUpdates = [...(task.progressUpdates || [])];
        const newUpdate = {
            id:        `upd-${Date.now()}`,
            userId:    userId || (Auth.currentUser ? Auth.currentUser.id : 'unknown'),
            userName:  userName || (Auth.currentUser ? Auth.currentUser.name : 'Unknown'),
            text:      text.trim(),
            createdAt: new Date().toISOString()
        };
        progressUpdates.push(newUpdate);
        task.progressUpdates = progressUpdates;

        try {
            await this._sb(`/rest/v1/wf_tasks?id=eq.${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ progress_updates: JSON.stringify(progressUpdates) })
            });
            return newUpdate;
        } catch (err) {
            console.error('Gagal menambahkan progress update:', err.message);
            return null;
        }
    },

    async deleteProgressUpdate(taskId, progressId) {
        this._invalidateCache();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.progressUpdates) return false;

        task.progressUpdates = task.progressUpdates.filter(upd => upd.id !== progressId);

        try {
            await this._sb(`/rest/v1/wf_tasks?id=eq.${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ progress_updates: JSON.stringify(task.progressUpdates) })
            });
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
        task.attachments.push(attachment);

        try {
            await this._sb(`/rest/v1/wf_tasks?id=eq.${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ attachments: JSON.stringify(task.attachments) })
            });
        } catch (err) {
            console.error('Gagal menyimpan lampiran:', err.message);
        }
    },

    async removeAttachment(taskId, attachmentId) {
        this._invalidateCache();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.attachments) return;
        task.attachments = task.attachments.filter(a => a.id !== attachmentId);

        try {
            await this._sb(`/rest/v1/wf_tasks?id=eq.${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ attachments: JSON.stringify(task.attachments) })
            });
        } catch (err) {
            console.error('Gagal menghapus lampiran:', err.message);
        }
    },

    // ==========================================================================
    // USERS CRUD
    // ==========================================================================

    async addUser(user) {
        this._invalidateCache();
        // Membuat user baru memerlukan Supabase Admin API (service role).
        // Karena kita hanya punya anon key di frontend, kita panggil
        // Supabase Auth signUp — user akan muncul di Auth tapi perlu
        // menambahkan record ke wf_users secara manual jika RLS mengizinkan.
        try {
            // Step 1: Daftarkan ke Supabase Auth (tidak bisa pakai admin.createUser tanpa service role)
            const signUpRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, password: user.password })
            });
            const signUpData = await signUpRes.json();
            if (!signUpRes.ok) {
                return { success: false, message: signUpData.msg || signUpData.error_description || 'Gagal membuat akun.' };
            }

            const newUserId = signUpData.user?.id;
            if (!newUserId) return { success: false, message: 'Gagal mendapatkan ID user baru.' };

            // Step 2: Insert ke wf_users (memerlukan RLS policy INSERT untuk admin)
            const wfUser = {
                id:         newUserId,
                name:       user.name,
                email:      user.email.trim().toLowerCase(),
                role:       user.role || 'Staff',
                avatar:     user.avatar || '',
                status:     'Active',
                created_at: new Date().toISOString()
            };

            const dbRes = await this._sb('/rest/v1/wf_users?select=*', {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(wfUser)
            });

            const created = Array.isArray(dbRes) ? dbRes[0] : dbRes;
            if (created) this.users.push(created);
            return { success: true };
        } catch (err) {
            console.error('Gagal menambahkan user:', err.message);
            return { success: false, message: err.message };
        }
    },

    async updateUserStatus(userId, status) {
        this._invalidateCache();
        const user = this.users.find(u => u.id === userId);
        if (user) user.status = status;

        try {
            await this._sb(`/rest/v1/wf_users?id=eq.${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
        } catch (err) {
            if (user) user.status = status === 'Active' ? 'Inactive' : 'Active';
            console.error('Gagal update status user:', err.message);
        }
    },

    async updateUserAvatar(userId, avatar) {
        this._invalidateCache();
        const user = this.users.find(u => u.id === userId);
        if (user) user.avatar = avatar;

        try {
            await this._sb(`/rest/v1/wf_users?id=eq.${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ avatar })
            });
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
        if (user) user.name = name;

        try {
            await this._sb(`/rest/v1/wf_users?id=eq.${userId}`, {
                method: 'PATCH',
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
        if (user) Object.assign(user, profileData);

        // Map ke Supabase columns
        const dbData = {};
        const allowed = ['name','npwp','cv_url','portfolio_url','address','gender','bank_account','ktp_url'];
        allowed.forEach(k => { if (profileData[k] !== undefined) dbData[k] = profileData[k]; });

        try {
            const res = await this._sb(`/rest/v1/wf_users?id=eq.${userId}&select=*`, {
                method: 'PATCH',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(dbData)
            });
            const updated = Array.isArray(res) ? res[0] : res;
            if (updated && Auth.currentUser && Auth.currentUser.id === userId) {
                Object.assign(Auth.currentUser, updated);
                localStorage.setItem('dzhirasena_user_cache', JSON.stringify(Auth.currentUser));
            }
            return updated;
        } catch (err) {
            console.error('Gagal memperbarui profil:', err.message);
            throw err;
        }
    },

    async updateUserPassword(userId, password) {
        // Supabase: user hanya bisa ubah password sendiri via Auth API
        try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                method: 'PUT',
                headers: {
                    'apikey':        SUPABASE_ANON,
                    'Authorization': `Bearer ${Auth.token}`,
                    'Content-Type':  'application/json'
                },
                body: JSON.stringify({ password })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.msg || err.message || 'Gagal update password.');
            }
            return { success: true };
        } catch (err) {
            console.error('Gagal update password:', err.message);
            throw err;
        }
    },

    async updateUserRoleAndName(userId, name, role) {
        this._invalidateCache();
        const user = this.users.find(u => u.id === userId);
        if (user) { user.name = name; user.role = role; }

        try {
            await this._sb(`/rest/v1/wf_users?id=eq.${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ name, role })
            });
        } catch (err) {
            console.error('Gagal update role user:', err.message);
            throw err;
        }
    },

    async deleteUser(userId) {
        this._invalidateCache();
        this.users = this.users.filter(u => u.id !== userId);

        try {
            await this._sb(`/rest/v1/wf_users?id=eq.${userId}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Gagal hapus user:', err.message);
            if (window.showToast) window.showToast('Gagal menghapus user: ' + err.message, 'error');
        }
    },

    // ==========================================================================
    // CATEGORIES CRUD
    // ==========================================================================

    async addCategory(category) {
        this._invalidateCache();
        const newCat = { id: `cat-${Date.now()}`, name: category.name.trim() };

        try {
            const res = await this._sb('/rest/v1/wf_categories?select=*', {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(newCat)
            });
            const created = Array.isArray(res) ? res[0] : res;
            if (created) this.categories.push(created);
            return created;
        } catch (err) {
            console.error('Gagal menambahkan kategori:', err.message);
        }
    },

    async deleteCategory(catId) {
        this._invalidateCache();
        this.categories = this.categories.filter(c => c.id !== catId);

        try {
            await this._sb(`/rest/v1/wf_categories?id=eq.${catId}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Gagal menghapus kategori:', err.message);
        }
    },

    // ==========================================================================
    // NOTIFICATIONS
    // ==========================================================================

    async addNotification(userId, message, type = 'info') {
        this._invalidateCache();
        const newNotif = {
            id:        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id:   userId,
            message,
            type:      type || 'info',
            timestamp: new Date().toISOString(),
            is_read:   false
        };

        try {
            const res = await this._sb('/rest/v1/wf_notifications?select=*', {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(newNotif)
            });
            const created = Array.isArray(res) ? res[0] : res;
            const mapped  = created ? { id: created.id, userId: created.user_id, message: created.message, type: created.type, timestamp: created.timestamp, isRead: created.is_read } : null;
            if (mapped) this.notifications.unshift(mapped);
            return mapped;
        } catch (err) {
            console.error('Gagal menambahkan notifikasi:', err.message);
        }
    },

    async markNotificationRead(notifId) {
        this._invalidateCache();
        const notif = this.notifications.find(n => n.id === notifId);
        if (notif) notif.isRead = true;

        try {
            await this._sb(`/rest/v1/wf_notifications?id=eq.${notifId}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_read: true })
            });
        } catch (err) {
            console.error('Gagal tandai notifikasi dibaca:', err.message);
        }
    },

    async markAllNotificationsRead(userId) {
        this._invalidateCache();
        this.notifications.forEach(n => { if (n.userId === userId) n.isRead = true; });

        try {
            await this._sb(`/rest/v1/wf_notifications?user_id=eq.${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_read: true })
            });
        } catch (err) {
            console.error('Gagal tandai semua notifikasi dibaca:', err.message);
        }
    },

    // ==========================================================================
    // HONOR PAYMENT
    // ==========================================================================

    async saveHonorPayment(employeeId, employeeName, amount, completedTaskIds, taskAmounts) {
        this._invalidateCache();
        try {
            // Update setiap task: status → Paid, honor_amount
            for (const taskId of completedTaskIds) {
                const taskAmount = taskAmounts ? Number(taskAmounts[taskId]) || 0 : 0;
                await this._sb(`/rest/v1/wf_tasks?id=eq.${taskId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'Paid', honor_amount: taskAmount })
                });

                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = 'Paid';
                    if (taskAmount) task.honorAmount = taskAmount;
                }
            }

            // Simpan record honor payment
            const honorRecord = {
                id:            `honor-${Date.now()}`,
                employee_id:   employeeId,
                employee_name: employeeName,
                amount:        Number(amount),
                task_count:    completedTaskIds.length,
                task_ids:      JSON.stringify(completedTaskIds),
                paid_by:       Auth.currentUser ? Auth.currentUser.id : null,
                created_at:    new Date().toISOString()
            };

            await this._sb('/rest/v1/wf_honor_payments', {
                method: 'POST',
                body: JSON.stringify(honorRecord)
            }).catch(err => {
                // Tabel belum ada — tetap lanjut
                console.warn('Gagal simpan honor record (tabel mungkin belum ada):', err.message);
            });

            if (window.showToast) window.showToast(`Honor Rp${Number(amount).toLocaleString()} untuk ${employeeName} berhasil dibayarkan.`, 'success');
            return { success: true };
        } catch (err) {
            console.error('Gagal memproses pembayaran honor:', err.message);
            if (window.showToast) window.showToast('Gagal memproses honor: ' + err.message, 'error');
            return { success: false, message: err.message };
        }
    },

    // ==========================================================================
    // COMMENTS (Legacy)
    // ==========================================================================

    async addComment(taskId, message) {
        const newComment = {
            id:        `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            taskId,
            userId:    Auth.currentUser ? Auth.currentUser.id : 'unknown',
            message,
            timestamp: new Date().toISOString()
        };
        this.comments.push(newComment);
        return newComment;
    },

    async deleteComment(commentId) {
        this.comments = this.comments.filter(c => c.id !== commentId);
    },

    // ── Backward Compatibility ────────────────────────────────────────────────
    saveUsers()         {},
    saveTasks()         {},
    saveCategories()    {},
    saveNotifications() {},
    saveComments()      {}
};
