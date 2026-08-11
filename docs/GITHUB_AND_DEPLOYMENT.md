# GitHub dan Deployment PWA

Folder ini sudah siap dijadikan repository GitHub.

Repository target:

```text
https://github.com/AbuAdzka-MDD/MrizkiIslamicFamily
```

## Inisialisasi Git

```bash
git init
git add .
git commit -m "Build Family Rizki PWA"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

## GitHub Actions

Workflow tersedia di:

```text
.github/workflows/pwa-check.yml
```

Workflow menjalankan:

- Syntax check `src/app.js`.
- Syntax check `src/logic.mjs`.
- Unit test `tests/logic.test.mjs`.

## Hosting PWA

Aplikasi ini statis, sehingga dapat di-host di:

- GitHub Pages.
- Netlify.
- Vercel.
- Cloudflare Pages.
- Hosting statis lain.

Untuk GitHub Pages:

1. Push repository ke GitHub.
2. Buka **Settings > Pages**.
3. Pilih branch `main`.
4. Pilih root folder `/`.
5. Simpan.

## Backend Google Workspace

Backend tetap memakai:

- Google Sheets sebagai database.
- Google Apps Script sebagai API.
- Google Drive sebagai penyimpanan laporan PDF/backup.

File backend:

```text
google-apps-script.gs
apps-script/Code.js
apps-script/appsscript.json
apps-script/.clasp.json
```

Project Apps Script yang disiapkan:

```text
1J8DSWyRC9SB_-UEEe8nqCMrofQVVu2W1F3BLzSEvz-pRm8F-03zie0Mg
```

Editor project:

```text
https://script.google.com/u/0/home/projects/1J8DSWyRC9SB_-UEEe8nqCMrofQVVu2W1F3BLzSEvz-pRm8F-03zie0Mg/edit
```

### Upload Manual

1. Buka project Apps Script.
2. Salin isi `apps-script/Code.js` ke file `Code.gs` atau `Code.js`.
3. Pastikan manifest memakai isi `apps-script/appsscript.json`.
4. Deploy sebagai Web App.

### Push Dengan Clasp

```bash
cd apps-script
npm install -g @google/clasp
clasp login
clasp push
clasp deploy
```

Setelah Apps Script dideploy sebagai Web App, isi:

```js
googleAppsScriptUrl: "URL_WEB_APP_APPS_SCRIPT"
```

di `config.js`.

## Login Password

Mode demo memakai setup password pertama kali di browser. Password tidak ditulis di source code dan hanya hash yang disimpan di localStorage.

Untuk produksi, rekomendasi berikutnya:

- Simpan hash password di sheet `User_Roles`.
- Validasi login lewat Apps Script HTTPS.
- Tambahkan rate limiting sederhana.
- Tetap gunakan Google Sign-In untuk opsi login yang lebih kuat.
