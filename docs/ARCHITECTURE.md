# Arsitektur

```mermaid
flowchart TD
  A["PWA / Flutter Production UI"] --> B["Local Store + Offline Queue"]
  B --> C["Google Apps Script API"]
  C --> D["Google Sheets Database"]
  C --> E["Google Drive Attachments + PDF Reports"]
  C --> F["Audit Logs"]
  A --> G["Google Sign-In Production"]
  A --> H["Prayer/Qibla API"]
  A --> I["Qur'an API + Licensed Fonts/Audio"]
```

## Prinsip

- Demo berjalan tanpa kredensial.
- Produksi memakai otorisasi resmi pemilik Workspace.
- Semua data penting memiliki `family_id`, `member_id`, `id`, `created_at`, `updated_at`, dan `status_data`.
- Data ibadah privat secara default.
- Penghapusan memakai soft delete.
- Apps Script membuat struktur Sheets dan Drive secara otomatis.
