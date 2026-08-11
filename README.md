# The Family of Muhammad Rizki

**Islamic Family Growth Dashboard**  
Tagline: **Bertumbuh dalam Iman, Ilmu, Kebersamaan, dan Kemandirian.**

Paket ini adalah aplikasi demo runnable berbasis Web/PWA karena Flutter tidak tersedia di environment kerja ini. Struktur fitur, data, backend Google Workspace, mode demo, export PDF, dan dokumentasi disiapkan agar mudah dimigrasikan menjadi Flutter produksi.

## Yang Sudah Dibuat

- Frontend responsif untuk mobile, tablet, desktop, dan PWA.
- Logo aplikasi dan login memakai aset `assets/logo/abu-adzka-logo.png`.
- Login password untuk Abi, Ummi, dan seluruh anak. Password dibuat pada setup awal dan disimpan sebagai hash, bukan plaintext.
- Mode demo lokal tanpa kredensial Google.
- Data awal keluarga: Kepala Keluarga (Abi), Istri (Ummi), Alif Aslam, Muslim Ihsan, M. Bilal Albana, Fajri Rahman, dan Adzkadina Salsabila.
- CRUD tambah, edit, hapus, pencarian, dan filter.
- Role demo: Abi, Ummi, Alif Aslam, Muslim Ihsan, M. Bilal Albana, Fajri Rahman, dan Adzkadina Salsabila.
- Dashboard real-time lokal setelah data disimpan.
- Grafik canvas untuk progres dan keuangan.
- Visual Islami modern dengan warna pink, royal blue, putih, dan gold; kartu 3D, smart art, kompas 3D, diagram, chart, dan pola geometri Islami.
- Widget Islami: hari, tanggal, jam real-time, tanggal Hijriah, jadwal salat demo, countdown salat, tombol simulasi adzan, dan arah kiblat demo.
- Al-Qur'an digital UI: selector 30 juz, 114 surah, contoh mushaf, terjemahan Indonesia, legenda tajwid berwarna, qari, bookmark, ulangi ayat, catatan, tilawah, dan hafalan.
- Modul anggota keluarga, pengembangan diri, daily activity, financial freedom, agenda, Al-Qur'an progress, salat/kiblat, laporan, notifikasi, pengaturan.
- Export laporan PDF melalui dialog print/save as PDF.
- Offline cache via service worker dan offline queue untuk sinkronisasi.
- Google Apps Script backend untuk 20 sheet dan folder Google Drive.
- Struktur GitHub-ready dengan `.gitignore` dan GitHub Actions workflow.
- Test logika kalkulasi keuangan, durasi, sanitasi, dan dashboard.

## Struktur Folder

```text
family-rizki-pwa/
  index.html
  styles.css
  config.js
  manifest.webmanifest
  service-worker.js
  google-apps-script.gs
  .env.example
  src/
    app.js
    logic.mjs
  tests/
    logic.test.mjs
  docs/
    DATABASE.md
    ACCESS_CONTROL.md
```

## Cara Menjalankan

Cara paling sederhana: buka `index.html` di browser.

Untuk menguji PWA/service worker, jalankan server lokal:

```powershell
python -m http.server 8770 --bind 127.0.0.1
```

Lalu buka:

```text
http://127.0.0.1:8770/
```

## Mengaktifkan Google Workspace Backend

1. Login dengan akun `mrizki.markazdigital@gmail.com`.
2. Buka `https://script.google.com`.
3. Buat project baru.
4. Tempel isi `google-apps-script.gs`.
5. Jalankan fungsi `doGet` atau deploy sekali untuk memberi izin resmi.
6. Deploy sebagai **Web app**.
7. Pilih **Execute as: Me**.
8. Pilih akses sesuai kebutuhan keluarga.
9. Salin Web App URL.
10. Isi `googleAppsScriptUrl` di `config.js`.

Backend akan membuat spreadsheet:

`The Family of Muhammad Rizki - Islamic Family Growth Dashboard`

Dan folder Drive:

`The Family of Muhammad Rizki/Laporan PDF/`

## GitHub

Panduan GitHub dan deployment PWA tersedia di:

`docs/GITHUB_AND_DEPLOYMENT.md`

Repository target:

`https://github.com/AbuAdzka-MDD/MrizkiIslamicFamily`

Project Apps Script target:

`https://script.google.com/u/0/home/projects/1J8DSWyRC9SB_-UEEe8nqCMrofQVVu2W1F3BLzSEvz-pRm8F-03zie0Mg/edit`

## Environment Variable

Lihat `.env.example`.

Tidak ada password, token, client secret, atau API key di source code. Nilai OAuth/Google Client ID harus diisi melalui konfigurasi aman saat produksi.

## Export PDF

1. Buka Dashboard Utama.
2. Klik **Export Laporan PDF**.
3. Pilih jenis dan periode laporan.
4. Klik **Pratinjau / Simpan PDF**.
5. Di dialog browser, pilih **Save as PDF**.

Untuk penyimpanan Google Drive, isi URL Apps Script lalu gunakan **Simpan ke Google Drive**. Dalam demo ini backend menyimpan representasi HTML laporan/backup ke folder Drive. Produksi Flutter dapat memakai generator PDF native.

## Build Produksi Flutter

Framework target produksi tetap Flutter + Dart:

- Gunakan feature-first architecture: `features/dashboard`, `features/members`, `features/growth`, `features/finance`, `features/quran`, `features/reports`.
- State management: Riverpod atau Bloc.
- Chart: `fl_chart`.
- PDF: `pdf` dan `printing`.
- Google Sign-In: `google_sign_in`.
- HTTP client: `dio`.
- Offline local DB: `drift` atau `isar`.
- Secure storage: `flutter_secure_storage`.

Perintah umum setelah project Flutter tersedia:

```bash
flutter pub get
flutter test
flutter build web
flutter build apk --release
flutter build ios --release
flutter build windows
flutter build macos
```

## Hasil Test

Test tersedia di `tests/logic.test.mjs`.

```powershell
node tests/logic.test.mjs
```

Jika Node tidak ada di PATH, gunakan Node runtime bawaan Codex.

## Konfigurasi Manual Yang Masih Dibutuhkan

- Google Apps Script Web App URL.
- Google OAuth Client ID untuk Google Sign-In produksi.
- Kebijakan whitelist email anggota keluarga.
- Spreadsheet/Drive sharing policy final.
- API jadwal salat produksi dan izin lokasi.
- API Al-Qur'an lengkap 30 juz, font Arab, audio murattal, tajwid berwarna, terjemahan, dan lisensinya.
- Generator PDF native untuk Flutter produksi.

## Rekomendasi Tahap Berikutnya

1. Migrasikan PWA demo ini ke Flutter feature-first.
2. Tambahkan Google Sign-In resmi dan validasi token di Apps Script.
3. Tambahkan API jadwal salat berbasis lokasi pengguna.
4. Integrasikan sumber Al-Qur'an resmi tanpa mengubah teks ayat.
5. Perketat akses Drive/Sheets berdasarkan whitelist keluarga.
6. Tambahkan test end-to-end untuk CRUD, role, offline queue, dan export laporan.
