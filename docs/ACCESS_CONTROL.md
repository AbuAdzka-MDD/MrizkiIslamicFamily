# Hak Akses

Mode demo memakai role lokal untuk mensimulasikan role-based access control.

## Struktur Pengguna

| Pengguna | Hak akses |
| --- | --- |
| Kepala Keluarga (Abi) | Mengelola keluarga, anggota keluarga, program, laporan, dan pengaturan. |
| Istri (Ummi) | Mengelola keluarga, anggota keluarga, dan melihat program dan laporan. |
| Alif Aslam (Anak Pertama) | Mengisi dan melihat data pribadi serta data keluarga yang diizinkan. |
| Muslim Ihsan (Anak Kedua) | Mengisi dan melihat data pribadi serta data keluarga yang diizinkan. |
| M. Bilal Albana (Anak Ketiga) | Mengisi dan melihat data pribadi serta data keluarga yang diizinkan. |
| Fajri Rahman (Anak Keempat) | Mengisi dan melihat data pribadi serta data keluarga yang diizinkan. |
| Adzkadina Salsabila (Anak Kelima) | Akun pendamping yang dikelola orangtua (Abi dan Ummi). |

## Kode Role

- `abi`: akses penuh untuk mengelola keluarga, anggota keluarga, program, laporan, dan pengaturan.
- `ummi`: mengelola keluarga dan anggota keluarga, serta melihat program dan laporan.
- `alif_aslam`: mengisi dan melihat data pribadi serta data keluarga yang diizinkan.
- `muslim_ihsan`: mengisi dan melihat data pribadi serta data keluarga yang diizinkan.
- `m_bilal_albana`: mengisi dan melihat data pribadi serta data keluarga yang diizinkan.
- `fajri_rahman`: mengisi dan melihat data pribadi serta data keluarga yang diizinkan.
- `adzkadina_salsabila`: akun pendamping yang dikelola Abi dan Ummi.

## Privasi

Data spiritual mendukung `privacy`:

- `private`: hanya pemilik data, Abi, dan pengelola yang diberi izin.
- `parent`: dapat dilihat Abi dan Ummi sesuai aturan keluarga.
- `shared`: dapat ditampilkan pada laporan keluarga.

Aplikasi tidak membuat ranking kualitas iman dan hanya menampilkan konsistensi kebiasaan.
