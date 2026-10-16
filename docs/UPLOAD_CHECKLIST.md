# Langkah Pembaruan

Perubahan ini belum aktif di aplikasi online sampai Apps Script dan branch `gh-pages` sama-sama diperbarui.

## 1. Apps Script

1. Buka project Apps Script keluarga.
2. Buka file `Code.gs`.
3. Ganti seluruh isinya dengan isi `google-apps-script.gs` dari paket ini, lalu tekan **Save**.
4. Buka **Deploy > Manage deployments**, tekan ikon edit pada Web App, pilih **New version**, lalu tekan **Deploy**.
5. Pertahankan URL Web App yang sama dengan URL di `config.js`. Web App harus berjalan sebagai akun Google Workspace pemilik dan dapat dipanggil oleh anggota keluarga.
6. Jika autentikasi keluarga belum pernah dibuat, pilih fungsi `createFamilyBootstrapKey` di editor Apps Script, tekan **Run**, setujui izin, lalu salin kode dari Execution log. Kode ini diminta saat aktivasi Abi pertama kali dan otomatis dihapus setelah berhasil. Jika fungsi menyatakan `FAMILY_AUTH` sudah ada, lewati langkah ini.

## 2. GitHub Pages

Unggah dan timpa berkas aplikasi di root branch `gh-pages`, dengan struktur folder tetap sama. Sertakan `index.html`, `config.js`, `service-worker.js`, `styles.css`, folder `src`, folder `assets`, `manifest.webmanifest`, dan `.nojekyll`. Jangan mengunggah isi folder aplikasi ke dalam subfolder tambahan.

Setelah commit GitHub, tunggu Pages selesai diperbarui. Di desktop, muat ulang halaman. Di Android/iPhone/tablet, tutup aplikasi/PWA sepenuhnya lalu buka lagi; versi service worker baru akan mengganti cache lama.

## 3. Uji Pertama

1. Login sebagai Abi dengan password yang sudah digunakan.
2. Saat pertama kali pada versi ini, Apps Script menghapus hanya baris yang `created_by` atau `updated_by`-nya persis `demo`. Baris profil keluarga dan data lain tidak disentuh.
3. Buka **Pengaturan**. Uji ubah password satu akun dan hak akses akun tersebut.
4. Login di perangkat kedua, tambahkan satu data uji yang nyata, lalu tunggu status sinkron. Pastikan baris tampil setelah refresh di perangkat pertama.
5. Hapus data uji melalui fitur aplikasi jika tidak ingin menyimpannya.

Antrean offline dibatasi 500 item. Item baru tidak menggandakan baris saat retry; antrean hanya berkurang setelah Apps Script mengonfirmasi penyimpanan. Jika satu data diedit bersamaan di dua perangkat, penyimpanan kedua ditolak sebagai konflik dan isian tetap tersedia untuk dicoba lagi setelah data terbaru dimuat.

## Catatan Keamanan

Apps Script Web App perlu dapat menerima request dari PWA; jangan membagikan URL project editor atau mengubah spreadsheet menjadi publik. URL Web App bukan password dan memang digunakan PWA, sedangkan kode aktivasi awal tidak boleh diunggah ke GitHub. Script menyimpan password sebagai hash bersalt pada Script Properties. Aktivasi Abi pertama memakai kode satu kali acak yang dihapus setelah berhasil.

Perubahan ini belum diuji pada deployment Google Apps Script maupun banyak perangkat sungguhan. Setelah unggah, lakukan langkah uji di atas sebelum mengandalkannya untuk data penting.
