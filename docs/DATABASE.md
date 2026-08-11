# Struktur Database Google Sheets

Spreadsheet utama: `The Family of Muhammad Rizki - Islamic Family Growth Dashboard`.

Sheet yang dibuat otomatis oleh `google-apps-script.gs`:

1. `Family_Members`
2. `User_Roles`
3. `Spiritual_Programs`
4. `Spiritual_Logs`
5. `Emotional_Programs`
6. `Emotional_Logs`
7. `Intellectual_Programs`
8. `Intellectual_Logs`
9. `Daily_Activities`
10. `Income`
11. `Expenses`
12. `Savings`
13. `Investments`
14. `Financial_Goals`
15. `Family_Agendas`
16. `Quran_Progress`
17. `Prayer_Settings`
18. `Notifications`
19. `App_Settings`
20. `Audit_Logs`

Setiap sheet memiliki kolom umum:

`id`, `family_id`, `member_id`, `member_name`, `date`, `created_at`, `updated_at`, `status_data`, `created_by`, `updated_by`.

Relasi utama memakai `family_id` dan `member_id`. Penghapusan dilakukan sebagai soft delete dengan `status_data = deleted` agar audit trail tetap aman.

## Login Password

Sheet `User_Roles` juga menyiapkan kolom:

`password_hash`, `password_salt`, `last_login_at`.

Mode demo saat ini menyimpan hash password di localStorage agar aplikasi bisa langsung dipakai tanpa kredensial Google. Pada produksi, hash dan salt dapat disinkronkan ke `User_Roles` melalui Apps Script HTTPS, tanpa menyimpan password asli.
