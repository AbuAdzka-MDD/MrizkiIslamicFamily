# Hak Akses

Hak akses diperiksa di antarmuka dan Apps Script. Pengaturan disimpan di Script Properties sebagai `FAMILY_ACCESS`; nilai bawaan memakai prinsip akses seperlunya.

## Struktur Pengguna

| Pengguna | Hak akses |
| --- | --- |
| Kepala Keluarga (Abi) | Mengelola keluarga, anggota keluarga, program, laporan, dan pengaturan. |
| Istri (Ummi) | Mengelola keluarga dan anggota keluarga serta membuka modul keluarga yang diizinkan Abi. Laporan dan Pengaturan tetap khusus Abi. |
| Alif Aslam (Anak Pertama) | Mengisi dan melihat data pribadi serta data keluarga yang diizinkan. |
| Muslim Ihsan (Anak Kedua) | Mengisi dan melihat data pribadi serta data keluarga yang diizinkan. |
| M. Bilal Albana (Anak Ketiga) | Mengisi dan melihat data pribadi serta data keluarga yang diizinkan. |
| Fajri Rahman (Anak Keempat) | Mengisi dan melihat data pribadi serta data keluarga yang diizinkan. |
| Adzkadina Salsabila (Anak Kelima) | Akun pendamping yang dikelola orangtua (Abi dan Ummi). |

## Kode Role

- `abi`: akses penuh untuk mengelola keluarga, anggota keluarga, program, laporan, dan pengaturan.
- `ummi`: secara bawaan dapat membuka anggota, pengembangan diri, agenda, Al-Qur'an, waktu sholat, dan notifikasi. Laporan dan Pengaturan hanya untuk Abi.
- `alif_aslam`: mengisi dan melihat data pribadi serta data keluarga yang diizinkan.
- `muslim_ihsan`: mengisi dan melihat data pribadi serta data keluarga yang diizinkan.
- `m_bilal_albana`: mengisi dan melihat data pribadi serta data keluarga yang diizinkan.
- `fajri_rahman`: mengisi dan melihat data pribadi serta data keluarga yang diizinkan.
- `adzkadina_salsabila`: akun pendamping yang dikelola Abi dan Ummi.

## Privasi

Abi dapat menonaktifkan akun dan memilih modul yang boleh dibuka melalui Pengaturan. Anak secara bawaan tidak memperoleh akses ke keuangan atau anggota keluarga; Abi dapat mengubahnya sesuai kebutuhan.

Data spiritual mendukung `privacy`:

- `private`: hanya pemilik data, Abi, dan pengelola yang diberi izin.
- `parent`: dapat dilihat Abi dan Ummi sesuai aturan keluarga.
- `shared`: dapat ditampilkan pada laporan keluarga.

Aplikasi tidak membuat ranking kualitas iman dan hanya menampilkan konsistensi kebiasaan.
