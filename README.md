# To-Do List & Team Management System

Aplikasi web komprehensif untuk mengelola daftar tugas (To-Do List), manajemen anggota tim, dan perhitungan laporan honorarium berbasis penyelesaian tugas. Aplikasi ini dibangun dengan antarmuka yang modern, responsif, dan mendukung mode Gelap/Terang (Dark/Light Mode).

## 🚀 Fitur Utama

- **Manajemen Tugas (To-Do List)**: Tambah, edit, hapus, dan ubah status tugas dengan mudah.
- **Manajemen Tim**: Kelola anggota tim, peran (Admin/User), dan status aktif/non-aktif.
- **Laporan Honor**: Sistem otomatis untuk menghitung honor/gaji anggota tim berdasarkan jumlah tugas yang diselesaikan.
- **Dashboard Analitik**: Ringkasan data (metrik) pengguna, tugas selesai, dan statistik lainnya secara visual.
- **Responsif & Modern**: Tampilan (UI) berbentuk kartu (card) bergaya *glassmorphism* yang elegan, berfungsi dengan baik di Desktop, Tablet, maupun Smartphone.
- **Tema Terang/Gelap**: Mendukung pergantian otomatis atau manual untuk Light Mode dan Dark Mode.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
- **Backend / Routing**: [Laravel](https://laravel.com/)
- **Deployment**: [Vercel](https://vercel.com/) (Dikonfigurasi via `vercel.json`)

## 💻 Cara Menjalankan di Komputer Lokal (Localhost)

Karena proyek ini menggunakan framework Laravel, pastikan Anda sudah menginstal **PHP** dan **Composer** di komputer Anda.

1. **Clone repository ini**
   ```bash
   git clone https://github.com/USERNAME/To-dolist.git
   cd To-dolist
   ```

2. **Instal dependensi (Composer)**
   ```bash
   composer install
   ```

3. **Salin file Environment**
   ```bash
   cp .env.example .env
   ```

4. **Generate Application Key**
   ```bash
   php artisan key:generate
   ```

5. **Jalankan Server Lokal**
   ```bash
   php artisan serve
   ```
   *Aplikasi akan berjalan di `http://localhost:8000` atau `http://127.0.0.1:8000`*

## 🌐 Cara Deployment ke Vercel

Proyek ini sudah dilengkapi dengan file `vercel.json` sehingga sangat mudah untuk di-deploy secara gratis menggunakan Vercel.

1. Login ke akun [Vercel](https://vercel.com).
2. Buat proyek baru dan impor repository GitHub ini.
3. Vercel akan otomatis membaca file `vercel.json` dan mengatur routing untuk PHP dan file statis (CSS/JS) di folder `public/`.
4. Klik **Deploy** dan tunggu proses build selesai.

## 📁 Struktur Direktori Penting

- `public/css/` - Berisi file `styles.css` utama untuk seluruh UI.
- `public/js/` - Berisi logika interaktif di sisi klien (seperti `auth.js`, `dashboard.js`, `team.js`, dll).
- `resources/views/` - Berisi file Blade HTML yang merender antarmuka pengguna.
- `routes/web.php` - Berisi pengaturan rute antar halaman.
- `_archive/` & `scripts/` - Folder tempat menyimpan arsip arsitektur lama dan skrip utilitas.

---
*Dibuat untuk memudahkan produktivitas tim secara efisien.*
