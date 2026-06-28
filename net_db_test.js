// ==========================================================================
// DZHIRASENA - CENTRALIZED DATABASE & STORAGE MANAGEMENT (v3.0)
// ==========================================================================

const DB = {
    users: [],
    tasks: [],
    notifications: [],
    categories: [],
    comments: [],
    isSupabaseConfigured: false,
    client: null,

    // Default Seed Data
    defaultUsers: [
        {
            id: "usr-1",
            name: "Alex Thompson",
            email: "admin@dzhirasena.com",
            password: "admin123",
            role: "Admin",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
            status: "Active"
        },
        {
            id: "usr-2",
            name: "Irfan",
            email: "irfan@dzhirasena.com",
            password: "dzhirasena123",
            role: "Project Manager",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
            status: "Active"
        }
    ],
    defaultTasks: [],
    defaultNotifications: [],
    defaultCategories: [
        { id: "cat-1", name: "Keuangan" },
        { id: "cat-2", name: "Desain" },
        { id: "cat-3", name: "Pemasaran" },
        { id: "cat-4", name: "Teknologi Informasi" }
    ],
    defaultComments: [],

    // Helper: parse assignedTo field → always returns an array
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

    // Upload files to Supabase Storage
    async uploadFiles(files) {
        if (!this.isSupabaseConfigured || !this.client || !files || files.length === 0) return [];
        const uploadedUrls = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            
            try {
                // Upload to Supabase Storage bucket named 'task_attachments'
                const { data, error } = await this.client.storage
                    .from('task_attachments')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (error) {
                    console.error("Error uploading file:", error.message);
                    continue;
                }

                // Get public URL
                const { data: urlData } = this.client.storage
                    .from('task_attachments')
                    .getPublicUrl(fileName);

                if (urlData && urlData.publicUrl) {
                    uploadedUrls.push({
                        name: file.name,
                        url: urlData.publicUrl,
                        type: file.type || 'application/octet-stream',
                        size: file.size
                    });
                }
            } catch (err) {
                console.error("Upload failed", err);
            }
        }
        return uploadedUrls;
    },

    // Initialize Database (Supabase vs LocalStorage)
    async init() {
        if (typeof window.supabase !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
            this.isSupabaseConfigured = true;
            this.client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        }

        if (this.isSupabaseConfigured) {
            try {
                // Fetch all collections concurrently to avoid sequential waterfall delay
                const [usersRes, tasksRes, categoriesRes, notificationsRes, commentsRes] = await Promise.all([
                    this.client.from('wf_users').select('*'),
                    this.client.from('wf_tasks').select('*'),
                    this.client.from('wf_categories').select('*'),
                    this.client.from('wf_notifications').select('*'),
                    this.client.from('wf_comments').select('*').catch(() => ({ data: [], error: null }))
                ]);

                if (usersRes.error) throw usersRes.error;
                if (tasksRes.error) throw tasksRes.error;
                if (categoriesRes.error) throw categoriesRes.error;
                if (notificationsRes.error) throw notificationsRes.error;

                const dbUsers = usersRes.data;
                const dbTasks = tasksRes.data;
                const dbCategories = categoriesRes.data;
                const dbNotifs = notificationsRes.data;
                const dbComments = commentsRes.data || [];

                // 1. Handle Users
                if (!dbUsers || dbUsers.length === 0) {
                    await this.client.from('wf_users').insert(this.defaultUsers);
                    this.users = [...this.defaultUsers];
                } else {
                    this.users = dbUsers;
                    // Check if missing any default users (like Irfan) and add them
                    const missingUsers = this.defaultUsers.filter(defU => !this.users.some(u => u.email.toLowerCase() === defU.email.toLowerCase()));
                    if (missingUsers.length > 0) {
                        await this.client.from('wf_users').insert(missingUsers);
                        this.users = [...this.users, ...missingUsers];
                    }
                }

                // 2. Handle Tasks
                if (!dbTasks || dbTasks.length === 0) {
                    this.tasks = [...this.defaultTasks];
                } else {
                    this.tasks = dbTasks.map(t => ({
                        id: t.id,
                        title: t.title,
                        description: t.description,
                        category: t.category,
                        deadline: t.deadline,
                        priority: t.priority,
                        assignedTo: this._parseAssignees(t.assigned_to),
                        createdBy: t.created_by || "usr-1",
                        status: t.status,
                        createdAt: t.created_at,
                        attachments: t.attachments ? JSON.parse(t.attachments) : []
                    }));
                }

                // 3. Handle Categories - migrate English to Indonesian if needed
                if (!dbCategories || dbCategories.length === 0) {
                    await this.client.from('wf_categories').insert(this.defaultCategories);
                    this.categories = [...this.defaultCategories];
                } else {
                    this.categories = dbCategories.map(c => ({
                        ...c,
                        name: this._migrateCategory(c.name)
                    }));
                }

                // 4. Handle Notifications
                if (!dbNotifs || dbNotifs.length === 0) {
                    this.notifications = [...this.defaultNotifications];
                } else {
                    this.notifications = dbNotifs.map(n => ({
                        id: n.id,
                        userId: n.user_id,
                        message: n.message,
                        type: n.type,
                        timestamp: n.timestamp,
                        isRead: n.is_read
                    }));
                }

                // 5. Handle Comments
                this.comments = dbComments.map(c => ({
                    id: c.id,
                    taskId: c.task_id,
                    userId: c.user_id,
                    message: c.message,
                    timestamp: c.timestamp || c.created_at
                }));

                // Save to local storage for offline support
                this.saveUsers();
                this.saveTasks();
                this.saveCategories();
                this.saveNotifications();
                this.saveComments();

                console.log("Koneksi Supabase Cloud aktif & tersinkronisasi.");
            } catch (err) {
                console.error("Kesalahan Supabase, beralih ke penyimpanan lokal:", err);
                alert("Gagal memuat data dari Supabase: " + (err.message || JSON.stringify(err)));
                this.isSupabaseConfigured = false;
                this.loadLocalStorageData();
            }
        } else {
            alert("Sistem gagal memuat konfigurasi Supabase (Cek koneksi internet, CDN, atau isi config.js). Beralih ke offline mode.");
            this.loadLocalStorageData();
        }

        // Check deadline reminders after data is loaded
        this.checkDeadlineReminders();
    },

    // Migrate old English category names to Indonesian
    _migrateCategory(name) {
        const map = {
            "Finance": "Keuangan",
            "Design": "Desain",
            "Marketing": "Pemasaran",
            "IT": "Teknologi Informasi"
        };
        return map[name] || name;
    },

    loadLocalStorageData() {
        const storedUsers = localStorage.getItem("wf_users");
        let needsReset = false;
        if (storedUsers) {
            try {
                const parsed = JSON.parse(storedUsers);
                if (!parsed.some(u => u.id === "usr-2")) {
                    needsReset = true;
                }
            } catch (e) {
                needsReset = true;
            }
        }
        
        if (needsReset) {
            localStorage.removeItem("wf_users");
            localStorage.removeItem("wf_tasks");
            localStorage.removeItem("wf_notifications");
            localStorage.removeItem("wf_session");
            localStorage.removeItem("wf_categories");
        }

        // Users
        const activeStoredUsers = localStorage.getItem("wf_users");
        if (!activeStoredUsers) {
            this.users = [...this.defaultUsers];
            localStorage.setItem("wf_users", JSON.stringify(this.users));
        } else {
            this.users = JSON.parse(activeStoredUsers);
        }

        // Tasks
        const storedTasks = localStorage.getItem("wf_tasks");
        if (!storedTasks) {
            this.tasks = [...this.defaultTasks];
            localStorage.setItem("wf_tasks", JSON.stringify(this.tasks));
        } else {
            this.tasks = JSON.parse(storedTasks).map(t => ({
                ...t,
                createdBy: t.createdBy || "usr-1",
                assignedTo: this._parseAssignees(t.assignedTo),
                attachments: t.attachments || []
            }));
        }

        // Categories - migrate and save Indonesian names
        const activeStoredCategories = localStorage.getItem("wf_categories");
        if (!activeStoredCategories) {
            this.categories = [...this.defaultCategories];
            localStorage.setItem("wf_categories", JSON.stringify(this.categories));
        } else {
            this.categories = JSON.parse(activeStoredCategories).map(c => ({
                ...c,
                name: this._migrateCategory(c.name)
            }));
            // Save migrated categories back
            localStorage.setItem("wf_categories", JSON.stringify(this.categories));
        }

        // Notifications
        const storedNotifs = localStorage.getItem("wf_notifications");
        if (!storedNotifs) {
            this.notifications = [...this.defaultNotifications];
            localStorage.setItem("wf_notifications", JSON.stringify(this.notifications));
        } else {
            this.notifications = JSON.parse(storedNotifs);
        }

        // Comments
        const storedComments = localStorage.getItem("wf_comments");
        if (!storedComments) {
            this.comments = [...this.defaultComments];
            localStorage.setItem("wf_comments", JSON.stringify(this.comments));
        } else {
            this.comments = JSON.parse(storedComments);
        }
    },

    saveUsers() {
        localStorage.setItem("wf_users", JSON.stringify(this.users));
    },

    saveTasks() {
        localStorage.setItem("wf_tasks", JSON.stringify(this.tasks));
    },

    saveCategories() {
        localStorage.setItem("wf_categories", JSON.stringify(this.categories));
    },

    saveNotifications() {
        localStorage.setItem("wf_notifications", JSON.stringify(this.notifications));
    },

    saveComments() {
        localStorage.setItem("wf_comments", JSON.stringify(this.comments));
    },

    // Check deadline reminders (called after init)
    checkDeadlineReminders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);

        const todayStr = today.toISOString().split('T')[0];

        this.tasks.forEach(task => {
            if (task.status === "Completed" || !task.deadline) return;

            const deadlineDate = new Date(task.deadline);
            deadlineDate.setHours(0, 0, 0, 0);

            if (deadlineDate <= threeDaysLater) {
                const assignees = this._parseAssignees(task.assignedTo);
                const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

                assignees.forEach(userId => {
                    // Check if reminder for this task was already sent today
                    const alreadyNotified = this.notifications.some(n =>
                        n.userId === userId &&
                        n.type === "deadline_reminder" &&
                        n.message.includes(task.id) &&
                        n.timestamp && n.timestamp.startsWith(todayStr)
                    );

                    if (!alreadyNotified) {
                        let msg;
                        if (daysLeft <= 0) {
                            msg = `⚠️ Deadline tugas "${task.title}" sudah LEWAT! [${task.id}]`;
                        } else if (daysLeft === 1) {
                            msg = `🔔 Pengingat: Tugas "${task.title}" deadline BESOK! [${task.id}]`;
                        } else {
                            msg = `🔔 Pengingat: Tugas "${task.title}" deadline dalam ${daysLeft} hari. [${task.id}]`;
                        }

                        // Add notification synchronously (no async to avoid race conditions)
                        const newNotification = {
                            id: `notif-deadline-${task.id}-${userId}-${todayStr}`,
                            userId,
                            message: msg,
                            type: "deadline_reminder",
                            timestamp: new Date().toISOString(),
                            isRead: false
                        };
                        this.notifications.unshift(newNotification);
                    }
                });
            }
        });

        this.saveNotifications();
    },

    // CRUD Helper Operations
    async addTask(task) {
        // Ensure assignedTo is always an array
        task.assignedTo = this._parseAssignees(task.assignedTo);
        task.attachments = task.attachments || [];

        this.tasks.unshift(task);
        this.saveTasks();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_tasks').insert([{
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    category: task.category,
                    deadline: task.deadline,
                    priority: task.priority,
                    assigned_to: JSON.stringify(task.assignedTo),
                    created_by: task.createdBy,
                    status: task.status,
                    created_at: task.createdAt,
                    attachments: JSON.stringify(task.attachments)
                }]);
                if (error) console.error("Gagal menambahkan tugas di Supabase:", error);
            } catch (err) {
                console.error("Gagal menambahkan tugas di Supabase:", err);
            }
        }
    },

    async updateTaskStatus(taskId, status) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            this.saveTasks();

            if (this.isSupabaseConfigured) {
                try {
                    const { error } = await this.client.from('wf_tasks').update({ status }).eq('id', taskId);
                    if (error) console.error("Gagal memperbarui status tugas di Supabase:", error);
                } catch (err) {
                    console.error("Gagal memperbarui status tugas di Supabase:", err);
                }
            }
        }
    },

    async updateTask(taskId, updatedData) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            // Ensure assignedTo is always array
            if (updatedData.assignedTo) {
                updatedData.assignedTo = this._parseAssignees(updatedData.assignedTo);
            }
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedData };
            this.saveTasks();

            if (this.isSupabaseConfigured) {
                try {
                    const supabaseUpdate = {
                        title: updatedData.title,
                        description: updatedData.description,
                        category: updatedData.category,
                        deadline: updatedData.deadline,
                        priority: updatedData.priority,
                        assigned_to: JSON.stringify(updatedData.assignedTo || this.tasks[taskIndex].assignedTo)
                    };
                    if (updatedData.attachments !== undefined) {
                        supabaseUpdate.attachments = JSON.stringify(updatedData.attachments);
                    }
                    const { error } = await this.client.from('wf_tasks').update(supabaseUpdate).eq('id', taskId);
                    if (error) console.error("Gagal memperbarui tugas di Supabase:", error);
                } catch (err) {
                    console.error("Gagal memperbarui tugas di Supabase:", err);
                }
            }
        }
    },

    async deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        // Also clean up comments for this task
        this.comments = this.comments.filter(c => c.taskId !== taskId);
        this.saveComments();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_tasks').delete().eq('id', taskId);
                if (error) console.error("Gagal menghapus tugas di Supabase:", error);
                // Also delete comments for this task
                await this.client.from('wf_comments').delete().eq('task_id', taskId).catch(() => {});
            } catch (err) {
                console.error("Gagal menghapus tugas di Supabase:", err);
            }
        }
    },

    async addAttachment(taskId, attachment) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        if (!task.attachments) task.attachments = [];
        task.attachments.push(attachment);
        this.saveTasks();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_tasks')
                    .update({ attachments: JSON.stringify(task.attachments) })
                    .eq('id', taskId);
                if (error) console.error("Gagal menyimpan lampiran di Supabase:", error);
            } catch (err) {
                console.error("Gagal menyimpan lampiran di Supabase:", err);
            }
        }
    },

    async removeAttachment(taskId, attachmentId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.attachments) return;
        task.attachments = task.attachments.filter(a => a.id !== attachmentId);
        this.saveTasks();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_tasks')
                    .update({ attachments: JSON.stringify(task.attachments) })
                    .eq('id', taskId);
                if (error) console.error("Gagal menghapus lampiran di Supabase:", error);
            } catch (err) {
                console.error("Gagal menghapus lampiran di Supabase:", err);
            }
        }
    },

    // Comment Operations
    async addComment(taskId, message) {
        const newComment = {
            id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            taskId,
            userId: typeof Auth !== 'undefined' ? Auth.currentUser.id : 'usr-1',
            message,
            timestamp: new Date().toISOString()
        };
        this.comments.push(newComment);
        this.saveComments();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_comments').insert([{
                    id: newComment.id,
                    task_id: newComment.taskId,
                    user_id: newComment.userId,
                    message: newComment.message,
                    timestamp: newComment.timestamp
                }]);
                if (error) console.error("Gagal menambahkan komentar di Supabase:", error);
            } catch (err) {
                console.error("Gagal menambahkan komentar di Supabase:", err);
            }
        }

        return newComment;
    },

    async deleteComment(commentId) {
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.saveComments();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_comments').delete().eq('id', commentId);
                if (error) console.error("Gagal menghapus komentar di Supabase:", error);
            } catch (err) {
                console.error("Gagal menghapus komentar di Supabase:", err);
            }
        }
    },

    async addUser(user) {
        this.users.push(user);
        this.saveUsers();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_users').insert([user]);
                if (error) console.error("Gagal menambahkan user di Supabase:", error);
            } catch (err) {
                console.error("Gagal menambahkan user di Supabase:", err);
            }
        }
    },

    async updateUserStatus(userId, status) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.status = status;
            this.saveUsers();

            if (this.isSupabaseConfigured) {
                try {
                    const { error } = await this.client.from('wf_users').update({ status }).eq('id', userId);
                    if (error) console.error("Gagal memperbarui status user di Supabase:", error);
                } catch (err) {
                    console.error("Gagal memperbarui status user di Supabase:", err);
                }
            }
        }
    },

    async updateUserAvatar(userId, avatar) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.avatar = avatar;
            this.saveUsers();

            if (this.isSupabaseConfigured) {
                try {
                    const { error } = await this.client.from('wf_users').update({ avatar }).eq('id', userId);
                    if (error) console.error("Gagal memperbarui avatar user di Supabase:", error);
                } catch (err) {
                    console.error("Gagal memperbarui avatar user di Supabase:", err);
                }
            }
        }
    },

    async updateUserName(userId, name) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.name = name;
            this.saveUsers();

            if (this.isSupabaseConfigured) {
                try {
                    const { error } = await this.client.from('wf_users').update({ name }).eq('id', userId);
                    if (error) console.error("Gagal memperbarui nama user di Supabase:", error);
                } catch (err) {
                    console.error("Gagal memperbarui nama user di Supabase:", err);
                }
            }
        }
    },

    async deleteUser(userId) {
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_users').delete().eq('id', userId);
                if (error) console.error("Gagal menghapus user di Supabase:", error);
            } catch (err) {
                console.error("Gagal menghapus user di Supabase:", err);
            }
        }
    },

    async addCategory(category) {
        this.categories.push(category);
        this.saveCategories();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_categories').insert([category]);
                if (error) console.error("Gagal menambahkan kategori di Supabase:", error);
            } catch (err) {
                console.error("Gagal menambahkan kategori di Supabase:", err);
            }
        }
    },

    async deleteCategory(catId) {
        this.categories = this.categories.filter(c => c.id !== catId);
        this.saveCategories();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_categories').delete().eq('id', catId);
                if (error) console.error("Gagal menghapus kategori di Supabase:", error);
            } catch (err) {
                console.error("Gagal menghapus kategori di Supabase:", err);
            }
        }
    },

    async addNotification(userId, message, type = 'info') {
        const newNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            message,
            type,
            timestamp: new Date().toISOString(),
            isRead: false
        };
        this.notifications.unshift(newNotification);
        this.saveNotifications();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_notifications').insert([{
                    id: newNotification.id,
                    user_id: newNotification.userId,
                    message: newNotification.message,
                    type: newNotification.type,
                    timestamp: newNotification.timestamp,
                    is_read: newNotification.isRead
                }]);
                if (error) console.error("Gagal menambahkan notifikasi di Supabase:", error);
            } catch (err) {
                console.error("Gagal menambahkan notifikasi di Supabase:", err);
            }
        }
    },

    async markNotificationRead(notifId) {
        const notif = this.notifications.find(n => n.id === notifId);
        if (notif) {
            notif.isRead = true;
            this.saveNotifications();

            if (this.isSupabaseConfigured) {
                try {
                    const { error } = await this.client.from('wf_notifications').update({ is_read: true }).eq('id', notifId);
                    if (error) console.error("Gagal menandai notifikasi dibaca di Supabase:", error);
                } catch (err) {
                    console.error("Gagal menandai notifikasi dibaca di Supabase:", err);
                }
            }
        }
    },

    async markAllNotificationsRead(userId) {
        this.notifications.forEach(n => {
            if (n.userId === userId) {
                n.isRead = true;
            }
        });
        this.saveNotifications();

        if (this.isSupabaseConfigured) {
            try {
                const { error } = await this.client.from('wf_notifications').update({ is_read: true }).eq('user_id', userId);
                if (error) console.error("Gagal menandai semua notifikasi dibaca di Supabase:", error);
            } catch (err) {
                console.error("Gagal menandai semua notifikasi dibaca di Supabase:", err);
            }
        }
    }
};
