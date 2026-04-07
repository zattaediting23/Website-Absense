# 🏢 Absense — Enterprise Attendance Management System

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB.svg)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933.svg)
![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1.svg)

**Absense** adalah platform manajemen kehadiran dan Sumber Daya Manusia (SDM) kelas enterprise yang dibangun dengan arsitektur *multi-sector* (Corporate, Education, UMKM, Healthcare). Sistem ini dirancang untuk memberikan transparansi, akurasi, dan efisiensi dalam mengelola kehadiran staf berskala besar.

---

## 🎯 Visi & Misi

### Visi
Menjadi platform manajemen kehadiran nomor satu yang menjembatani produktivitas dan kesejahteraan karyawan melalui teknologi otomatis, akurat, dan transparan.

### Misi
- **Automasi Maksimal:** Mengurangi beban kerja HRD dengan kalkulasi otomatis untuk kehadiran, lembur, dan penggajian.
- **Akurasi Tinggi:** Mengeliminasi celah kecurangan kehadiran menggunakan verifikasi lokasi (GPS) dan validasi biometrik (Selfie Photo Proof).
- **Pengambilan Keputusan Berbasis Data:** Menyajikan analitik secara real-time untuk memonitor kesehatan organisasi dan performa individu.
- **Fleksibilitas Multisektor:** Menyediakan kustomisasi terminologi dan alur kerja yang relevan baik untuk perusahan, sekolah, rumah sakit, maupun UMKM.

---

## 💎 Keunggulan (Kelebihan)

1. **Anti-Kecurangan (Fraud-Proof):** Menggunakan kombinasi Geofencing (Haversine formula), Camera Selfie, dan Device Fingerprinting untuk memastikan absensi hanya dilakukan di lokasi dan perangkat yang sah.
2. **Kalkulasi Gaji Cerdas:** Langsung mengintegrasikan data kehadiran, keterlambatan, alpa, izin, dan lembur untuk menghasilkan Slip Gaji yang presisi dalam hitungan detik.
3. **Desain Profesional & Responsif:** Antarmuka pengguna yang dirancang dengan estetika klasik, bersih, dan profesional (menggunakan FontAwesome dan Tailwind CSS), optimal di desktop maupun mobile.
4. **Skalabilitas Tinggi:** Dibangun di atas stack PERN (PostgreSQL, Express, React, Node.js) yang ringan namun sangat kuat menangani banyak pengguna secara bersamaan.

---

## 🚀 Perjalanan Fitur (Version History)

### 🔹 Versi 1.0 — Fondasi Core System
Versi awal (MVP) dirancang untuk memastikan operasional manajemen kehadiran dasar berjalan dengan lancar.
- **Multi-Sector Architecture:** Dukungan dinamis untuk terminologi berbeda (misal: "Karyawan" untuk perusahaan, "Siswa" untuk sekolah).
- **Manajemen Pengguna (User Management):** Pengaturan role (Superadmin, Admin, Member) dan integrasi ke Departemen/Divisi.
- **Manajemen Jadwal Dinamis:** Pembuatan jam kerja standar dan penugasan karyawan ke jadwal spesifik.
- **Clock In & Clock Out Dasar:** Pencatatan waktu riil berbasis server.
- **Pengajuan Izin/Cuti:** Alur pengajuan dan persetujuan (Approve/Reject) untuk cuti, sakit, dan izin.
- **Laporan Dasar:** Rekapitulasi absensi harian secara sederhana.

### 🌟 Versi 2.0 — Massive Enterprise Upgrade
Peningkatan masif yang mentransformasi Absense dari sekadar aplikasi absensi menjadi **HRIS terpadu** dengan 10+ fitur kelas berat dan 5 modul halaman baru.

1. **📍 Geofencing & Location Tracking:** Radius absensi dibatasi oleh koordinat GPS jadwal.
2. **📸 Selfie Photo Proof:** Pengambilan foto *real-time* via webcam saat Clock In / Clock Out.
3. **💰 Auto-Payroll Generation:** Penerbitan slip gaji cerdas berdasarkan tarif harian, potongan telat/alpa, dan tunjangan otomatis. Termasuk cetak **Digital Payslip**.
4. **📊 Advanced Analytics Dashboard:** Analisis mendalam dengan Pie chart, Line chart (Tren Bulanan), Bar chart (Per Departemen), dan Leaderboard Top Performers.
5. **📢 Announcement Broadcast System:** Modul pengumuman internal dengan prioritas (Urgent, High), penyematan (pin), dan pengaturan kadaluarsa.
6. **📅 Holiday Calendar Management:** Integrasi hari libur nasional dan kalender perusahaan (meniadakan pinalti absen pada hari libur).
7. **🔄 Shift Swapping (Tukar Jadwal):** Alur pertukaran shift antar staf (Request ➔ Target Respond ➔ Admin Approve).
8. **⏰ Manajemen Lembur Tercatat:** Pengajuan lembur, kalkulasi durasi otomatis, persetujuan admin, yang langsung masuk ke kalkulasi Payroll.
9. **📱 Device Fingerprinting:** Perekaman OS, Browser, dan resolusi layar tiap absen untuk melacak gonta-ganti *device* ilegal.
10. **🎯 Multi-level Approval Structure:** Struktur database disiapkan untuk alur persetujuan bertingkat tingkat lanjut.

---

## 💻 Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Chart.js, React Router
- **Backend:** Node.js, Express.js, JWT Authentication, Helmet, CORS
- **Database:** PostgreSQL (dengan module `pg`)
- **Desain & Ikon:** Vanilla CSS (no Tailwind utility bloat di file CSS utama) + FontAwesome 6

---

## ⚙️ Cara Instalasi & Menjalankan

### Persyaratan Sistem
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Setup Database
```bash
# Pastikan PostgreSQL berjalan, lalu jalankan schema & migration:
psql -U postgres -f database/schema.sql
psql -U postgres -d absense -f database/migration_v2.sql
```

### 2. Setup Backend
```bash
cd backend
npm install
npm run dev
# Menjalankan server Express di port 5000
```
> *Pastikan file `.env` di backend sudah dikonfigurasi (DB config, JWT_SECRET, dll).*

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
# Menjalankan Vite dev server di port 3000
```

### Credential Default Admin
- **Email:** `admin@absense.com`
- **Password:** `admin123`

---
*Developed with dedication for a better work environment.*
