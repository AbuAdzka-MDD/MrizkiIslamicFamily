# Panduan Google Workspace

Pemilik backend: `mrizki.markazdigital@gmail.com`.

## Apps Script

1. Buka `script.google.com`.
2. Buat project baru.
3. Tempel `google-apps-script.gs`.
4. Deploy sebagai Web App.
5. Salin URL deploy.
6. Masukkan ke `config.js`:

```js
googleAppsScriptUrl: "PASTE_WEB_APP_URL_DI_SINI"
```

## Spreadsheet

Apps Script otomatis membuat spreadsheet dan 20 sheet sesuai database.

## Drive

Apps Script otomatis membuat:

```text
The Family of Muhammad Rizki/
  Laporan PDF/
    Tahun/
      Bulan/
        Jenis laporan/
```

## Keamanan Produksi

- Gunakan Google Sign-In untuk mendapatkan identitas pengguna.
- Validasi email pengguna terhadap `User_Roles`.
- Jangan membuka file Drive ke publik jika berisi data keluarga.
- Jangan menaruh secret di source code.
- Batasi deployment Apps Script sesuai kebutuhan keluarga.
