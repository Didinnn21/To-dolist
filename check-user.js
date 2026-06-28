import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const configContent = fs.readFileSync('./config.js', 'utf-8');
const urlMatch = configContent.match(/SUPABASE_URL:\s*"([^"]+)"/);
const keyMatch = configContent.match(/SUPABASE_ANON_KEY:\s*"([^"]+)"/);
const supabase = createClient(urlMatch[1], keyMatch[1]);

async function check() {
    const { data, error } = await supabase.from('wf_users').select('*').eq('email', 'admin2@dzhirasena.com');
    console.log("wf_users admin2:", data, error);
}
check();
