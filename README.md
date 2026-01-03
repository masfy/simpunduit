# SimpunDuit v5 💰

SimpunDuit adalah aplikasi pencatat keuangan pribadi berbasis web yang modern, ringan, dan mudah digunakan. Dibangun dengan pendekatan **Mobile-First** dan desain **Glassmorphism** yang elegan.

## ✨ Fitur Utama

*   **Dashboard Interaktif**: Ringkasan Pemasukan, Pengeluaran, dan Saldo dengan visualisasi grafik donat.
*   **Filter Cerdas**: Filter ringkasan berdasarkan Hari Ini, Minggu Ini, Bulan Ini, dan Tahun Ini.
*   **Pencatatan Mudah**: Form input transaksi yang intuitif dengan kategori yang bisa disesuaikan.
*   **Riwayat Transaksi**: Daftar lengkap riwayat transaksi dengan pencarian cepat.
*   **Manajemen Kategori**: Tambah dan hapus kategori pemasukan/pengeluaran sesuai kebutuhan.
*   **Profil Pengguna**: Personalisasi nama, status, dan foto profil.
*   **Mode Offline/Simulasi**: Tetap bisa dicoba meski tanpa koneksi backend (menggunakan data mock).
*   **Desain Premium**: Antarmuka modern dengan tema Light Mode, efek Glassmorphism, dan animasi halus.

## 🛠️ Teknologi

*   **Frontend**: HTML5, CSS3 (Custom Glassmorphism Design System), JavaScript (ES6+).
*   **Framework CSS**: Bootstrap 5.
*   **Icons & Fonts**: FontAwesome 6, Google Fonts (Plus Jakarta Sans).
*   **Charting**: Chart.js.
*   **Backend**: Google Apps Script (Spreadsheet sebagai database).
*   **Build Tool**: Vite.

## 🚀 Cara Menjalankan (Local)

1.  **Clone Repository**
    ```bash
    git clone https://github.com/masfy/simpunduit.git
    cd simpunduit
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Jalankan Development Server**
    ```bash
    npm run dev
    ```
    Buka `http://localhost:5173` di browser Anda.

## 🌐 Konfigurasi Backend (Google Sheets)

Aplikasi ini menggunakan Google Sheets sebagai database melalui Google Apps Script.

1.  Buat Google Sheet baru.
2.  Buka **Extensions > Apps Script**.
3.  Copy kode dari `backend_code.gs` (tersedia di dokumentasi proyek) ke editor Apps Script.
4.  Deploy sebagai **Web App**:
    *   **Execute as**: Me (email anda).
    *   **Who has access**: Anyone.
5.  Copy URL Web App yang dihasilkan.
6.  Buat file `.env` di root project dan isi:
    ```env
    VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_URL/exec
    ```

## 📱 Tampilan

Aplikasi ini dioptimalkan untuk tampilan mobile (PWA-ready layout) namun tetap responsif di desktop.

---
*Dibuat dengan ❤️ oleh Mas Alfy*
