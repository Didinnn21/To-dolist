// ==========================================================================
// DZHIRASENA - Environment Loader
// File ini diimport PERTAMA oleh semua modul backend
// Harus menggunakan CommonJS-style agar berjalan sebelum ES imports lain
// ==========================================================================

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });
