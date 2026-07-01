const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wrcenmpkawyovpsuwbaz.supabase.co';
const supabaseKey = 'sb_publishable_8W5ZG3JFYNRu7UfXiivYqQ_ecg0ZP-L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Fetching old users...");
    const { data: users } = await supabase.from('wf_users').select('*');
    if (!users || users.length === 0) return console.log("No users.");

    // We will keep a map of oldId -> newUuid
    const idMap = {};

    for (const u of users) {
        if (u.id === 'usr-test-123') continue;

        console.log(`Creating auth user for ${u.email}...`);
        
        // Rename old email to avoid unique constraint trigger error
        const oldEmail = u.email;
        await supabase.from('wf_users').update({ email: oldEmail + '.old' }).eq('id', u.id);

        const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: oldEmail,
            password: 'dzhirasena123',
            options: { data: { name: u.name, role: u.role, avatar: u.avatar } }
        });

        if (authErr) {
            console.error("Error creating auth:", authErr.message);
        } else {
            idMap[u.id] = authData.user.id;
            console.log(`Mapped ${u.id} -> ${authData.user.id}`);
        }
    }

    console.log("ID Map:", idMap);

    // Update Tasks
    console.log("Updating Tasks...");
    const { data: tasks } = await supabase.from('wf_tasks').select('*');
    if (tasks) {
        for (const t of tasks) {
            let changed = false;
            let newCreatedBy = t.created_by;
            if (idMap[t.created_by]) {
                newCreatedBy = idMap[t.created_by];
                changed = true;
            }

            let newAssignedTo = t.assigned_to;
            try {
                const arr = JSON.parse(t.assigned_to);
                const newArr = arr.map(id => idMap[id] || id);
                newAssignedTo = JSON.stringify(newArr);
                if (newAssignedTo !== t.assigned_to) changed = true;
            } catch (e) {}

            if (changed) {
                await supabase.from('wf_tasks').update({
                    created_by: newCreatedBy,
                    assigned_to: newAssignedTo
                }).eq('id', t.id);
                console.log(`Updated task ${t.id}`);
            }
        }
    }

    // Delete old rows
    for (const u of users) {
        if (idMap[u.id]) {
            // Delete old row
            await supabase.from('wf_users').delete().eq('id', u.id);
            console.log(`Deleted old wf_users row for ${u.id}`);
        }
    }

    console.log("Migration Complete!");
}

migrate();
