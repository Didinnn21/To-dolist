import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read config.js to extract keys
const configContent = fs.readFileSync('./config.js', 'utf-8');
const urlMatch = configContent.match(/SUPABASE_URL:\s*"([^"]+)"/);
const keyMatch = configContent.match(/SUPABASE_ANON_KEY:\s*"([^"]+)"/);

if (!urlMatch || !keyMatch) {
    console.error("Could not find Supabase URL or Key in config.js");
    process.exit(1);
}

const SUPABASE_URL = urlMatch[1];
const SUPABASE_ANON_KEY = keyMatch[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setup() {
    console.log("Setting up default users in Supabase Auth...");

    const defaultUsers = [
        {
            name: "Alex Thompson",
            email: "admin@dzhirasena.com",
            password: "admin123",
            role: "Admin",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
        },
        {
            name: "Irfan",
            email: "irfan@dzhirasena.com",
            password: "dzhirasena123",
            role: "Project Manager",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
        }
    ];

    for (const u of defaultUsers) {
        console.log(`Trying to sign in ${u.email}...`);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: u.email,
            password: u.password
        });

        if (signInError && signInError.message.includes('Invalid login credentials')) {
            console.log(`User ${u.email} not found or invalid credentials, signing up...`);
            const { data, error } = await supabase.auth.signUp({
                email: u.email,
                password: u.password,
                options: {
                    data: {
                        name: u.name,
                        role: u.role,
                        avatar: u.avatar
                    }
                }
            });

            if (error) {
                console.error(`Failed to sign up ${u.email}:`, error.message);
            } else {
                console.log(`Successfully signed up ${u.email}. Session: ${!!data.session}`);
                
                // If it created successfully, we should make sure wf_users has the new UUID,
                // but if there's a trigger, the trigger might have inserted it.
                // If wf_users already had a row with id="usr-X" and same email, we might have duplicates.
                // We will delete the old "usr-X" ones.
                if (data.user) {
                    const { error: delErr } = await supabase.from('wf_users').delete().eq('email', u.email).not('id', 'eq', data.user.id);
                    if (delErr) console.log(`Error deleting old record for ${u.email}:`, delErr.message);
                }
            }
        } else if (signInError) {
            console.error(`Sign in error for ${u.email}:`, signInError.message);
        } else {
            console.log(`User ${u.email} already exists and can log in.`);
        }
    }
    console.log("Done setup.");
}

setup();
