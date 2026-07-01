import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const configContent = fs.readFileSync('./config.js', 'utf-8');
const urlMatch = configContent.match(/SUPABASE_URL:\s*"([^"]+)"/);
const keyMatch = configContent.match(/SUPABASE_ANON_KEY:\s*"([^"]+)"/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_ANON_KEY = keyMatch[1];
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setup() {
    console.log("Creating admin2@dzhirasena.com...");
    const { data, error } = await supabase.auth.signUp({
        email: "admin2@dzhirasena.com",
        password: "admin123",
        options: {
            data: {
                name: "Admin 2",
                role: "Admin",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
            }
        }
    });

    if (error) {
        console.error("Failed to sign up admin2:", error.message);
    } else {
        console.log("Success! You can now log in with admin2@dzhirasena.com / admin123");
    }
}
setup();
