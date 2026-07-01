const fs = require('fs');

let code = fs.readFileSync('js/db.js', 'utf8');

// 1. Inject cache logic into DB.init()
// We will wrap the Promise.all logic with a sessionStorage cache check
const cacheLogic = `
                // --- ADDED CACHE LOGIC FOR FASTER NAVIGATION ---
                const cachedDataStr = sessionStorage.getItem('dzhirasena_db_cache');
                if (cachedDataStr) {
                    try {
                        const cachedData = JSON.parse(cachedDataStr);
                        this.users = cachedData.users;
                        this.tasks = cachedData.tasks;
                        this.categories = cachedData.categories;
                        this.notifications = cachedData.notifications;
                        this.comments = cachedData.comments;
                        this.checkDeadlineReminders();
                        return;
                    } catch (e) {
                        sessionStorage.removeItem('dzhirasena_db_cache');
                    }
                }
                // --- END CACHE LOGIC ---
`;

// Insert it right after the try { block in init()
code = code.replace(
    /if \(this\.isSupabaseConfigured\) \{\s*try \{/,
    `if (this.isSupabaseConfigured) {\n            try {${cacheLogic}`
);

// We need to save to cache after successfully fetching from Supabase
const saveCacheLogic = `
                // Save to session cache
                sessionStorage.setItem('dzhirasena_db_cache', JSON.stringify({
                    users: this.users,
                    tasks: this.tasks,
                    categories: this.categories,
                    notifications: this.notifications,
                    comments: this.comments
                }));
`;

code = code.replace(
    /console\.log\("Koneksi Supabase Cloud aktif & tersinkronisasi\."\);/,
    `${saveCacheLogic}\n                console.log("Koneksi Supabase Cloud aktif & tersinkronisasi.");`
);


// 2. Clear cache on mutations
// We need to add `sessionStorage.removeItem('dzhirasena_db_cache');` at the beginning of all async mutation methods
const methodsToHook = [
    'addTask(', 'updateTaskStatus(', 'updateTask(', 'deleteTask(', 
    'addAttachment(', 'removeAttachment(', 'addComment(', 'deleteComment(',
    'addUser(', 'updateUserStatus(', 'updateUserAvatar(', 'updateUserName(',
    'updateUserRoleAndName(', 'deleteUser(', 'addCategory(', 'deleteCategory(',
    'addNotification(', 'markNotificationRead(', 'markAllNotificationsRead('
];

methodsToHook.forEach(method => {
    // We look for: async methodName(args...) {
    const regex = new RegExp(`async\\s+${method.replace('(', '\\(')}([^\\)]*)\\)\\s*\\{`, 'g');
    code = code.replace(regex, `async ${method}$1) {
        sessionStorage.removeItem('dzhirasena_db_cache');`);
});

fs.writeFileSync('js/db.js', code);
console.log('Successfully injected cache logic into db.js');
