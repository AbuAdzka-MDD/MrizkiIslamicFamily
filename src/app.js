import {
  SHEETS,
  base,
  canAccess,
  calculateDuration,
  dashboardSummary,
  rupiah,
  sanitizeText,
  seedData
} from "./logic.mjs";

const config = window.APP_CONFIG || {};
const storageKey = `${config.familyId}:data:v3`;
const queueKey = `${config.familyId}:offlineQueue:v3`;
const authKey = `${config.familyId}:auth:v1`;
const sessionKey = `${config.familyId}:session:v1`;
const profilePhotoKey = `${config.familyId}:profilePhotos:v1`;
const cloudSessionKey = `${config.familyId}:cloudSession:v1`;
const accessKey = `${config.familyId}:access:v1`;
const quranCacheKey = `${config.familyId}:quranCache:v2`;
const prayerLocationKey = `${config.familyId}:prayerLocation:v1`;
let state = loadData();
let queue = loadQueue();
let editing = null;
let deferredInstall = null;
let prayerState = null;
let quranAudio = null;
let familyAccess = loadFamilyAccess();
let isSyncing = false;

const LOGIN_USERS = [
  ["abi", "Kepala Keluarga (Abi)"],
  ["ummi", "Istri (Ummi)"],
  ["alif_aslam", "Alif Aslam (Anak Pertama)"],
  ["muslim_ihsan", "Muslim Ihsan (Anak Kedua)"],
  ["m_bilal_albana", "M. Bilal Albana (Anak Ketiga)"],
  ["fajri_rahman", "Fajri Rahman (Anak Keempat)"],
  ["adzkadina_salsabila", "Adzkadina Salsabila (Anak Kelima)"]
];

const ACTIVE_ROLE_MEMBER = {
  abi: "mem_abi",
  ummi: "mem_ummi",
  alif_aslam: "mem_alif_aslam",
  muslim_ihsan: "mem_muslim_ihsan",
  m_bilal_albana: "mem_m_bilal_albana",
  fajri_rahman: "mem_fajri_rahman",
  adzkadina_salsabila: "mem_adzkadina_salsabila"
};

const DEFAULT_ACCESS_MODULES = {
  ummi: ["members", "growth", "agenda", "quran", "prayer", "notifications"],
  alif_aslam: ["growth", "daily", "quran", "prayer"],
  muslim_ihsan: ["growth", "daily", "quran", "prayer"],
  m_bilal_albana: ["growth", "daily", "quran", "prayer"],
  fajri_rahman: ["growth", "daily", "quran", "prayer"],
  adzkadina_salsabila: ["growth", "daily", "quran", "prayer"]
};

const navItems = [
  ["dashboard", "Dashboard Utama"],
  ["members", "Anggota Keluarga"],
  ["growth", "Pengembangan Diri"],
  ["daily", "Daily Activity"],
  ["finance", "Financial Freedom"],
  ["agenda", "Agenda Keluarga"],
  ["quran", "Al-Qur'an"],
  ["prayer", "Waktu Sholat dan Kiblat"],
  ["reports", "Laporan"],
  ["notifications", "Notifikasi"],
  ["settings", "Pengaturan"]
];

const PRAYER_TIMES = [
  ["Subuh", "04:39"],
  ["Syuruq", "05:58"],
  ["Zuhur", "12:02"],
  ["Asar", "15:23"],
  ["Magrib", "17:58"],
  ["Isya", "19:08"]
];

prayerState = loadPrayerState();

const PRAYER_API_NAMES = {
  Fajr: "Subuh",
  Sunrise: "Syuruq",
  Dhuhr: "Zuhur",
  Asr: "Asar",
  Maghrib: "Magrib",
  Isha: "Isya"
};

const QURAN_QARIS = [
  ["ar.alafasy", "Mishary Rashid Alafasy"],
  ["ar.abdulbasitmurattal", "Abdul Basit Murattal"],
  ["ar.hanirifai", "Hani Ar-Rifai"],
  ["ar.husary", "Mahmoud Khalil Al-Husary"],
  ["ar.minshawi", "Mohamed Siddiq Al-Minshawi"]
];

const BISMILLAH_ARABIC = "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650";
const BISMILLAH_VARIANTS = [
  BISMILLAH_ARABIC,
  "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"
];

const QURAN_SURAHS = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Taha", "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Gafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jasiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Az-Zariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Tagabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddassir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Insyiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Gasyiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takasur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraisy", "Al-Ma'un", "Al-Kausar", "Al-Kafirun", "An-Nasr", "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

const sheetForms = {
  Family_Members: {
    title: "Data Anggota Keluarga",
    view: "members",
    fields: [
      ["member_name", "Nama lengkap", "text", true],
      ["nickname", "Nama panggilan", "text"],
      ["role", "Status keluarga", "select", true, ["Kepala Keluarga (Abi)", "Istri (Ummi)", "Anak Pertama", "Anak Kedua", "Anak Ketiga", "Anak Keempat", "Anak Kelima"]],
      ["gender", "Jenis kelamin", "select", false, ["Laki-laki", "Perempuan", "Placeholder"]],
      ["birth_place", "Tempat lahir", "text"],
      ["birth_date", "Tanggal lahir", "date"],
      ["hobby", "Hobi", "text"],
      ["school_or_work", "Pekerjaan/sekolah", "text"],
      ["skills", "Keahlian", "text"],
      ["dream", "Cita-cita", "text"],
      ["personal_target", "Target pribadi", "textarea"],
      ["family_target", "Target keluarga", "textarea"],
      ["phone", "Nomor telepon", "text"],
      ["email", "Email", "email"],
      ["motto", "Motto hidup", "textarea"],
      ["important_notes", "Catatan penting", "textarea"],
      ["emergency_contact", "Kontak darurat", "text"],
      ["privacy", "Privasi", "select", false, ["private", "parent", "shared"]]
    ]
  },
  Spiritual_Logs: {
    title: "Pengembangan Spiritual",
    view: "growth",
    fields: [
      ["member_name", "Nama anggota", "text", true],
      ["date", "Tanggal", "date", true],
      ["program_name", "Nama kegiatan", "select", true, ["Sholat Subuh", "Sholat Zuhur", "Sholat Asar", "Sholat Magrib", "Sholat Isya", "Sholat berjamaah", "Rawatib", "Tahajud", "Duha", "Dzikir pagi", "Dzikir petang", "Tilawah Al-Qur'an", "Hafalan Al-Qur'an", "Murajaah", "Tafsir", "Puasa Senin-Kamis", "Ayyamul Bidh", "Sedekah", "Kajian Islam", "Silaturahmi", "Birrul walidain"]],
      ["target", "Target", "text"],
      ["realization", "Realisasi", "text"],
      ["status", "Status", "select", false, ["Direncanakan", "Sedang berlangsung", "Selesai", "Ditunda"]],
      ["time", "Waktu pelaksanaan", "time"],
      ["duration_minutes", "Durasi menit", "number"],
      ["notes", "Catatan", "textarea"],
      ["obstacle", "Kendala", "textarea"],
      ["reflection", "Refleksi", "textarea"],
      ["privacy", "Privasi data", "select", false, ["private", "parent", "shared"]]
    ]
  },
  Emotional_Logs: {
    title: "Pengembangan Emosional",
    view: "growth",
    fields: [
      ["member_name", "Nama anggota", "text", true],
      ["date", "Tanggal", "date", true],
      ["activity", "Aktivitas", "select", true, ["Olahraga", "Membersihkan rumah", "Membantu keluarga", "Tafakur", "Tadabbur", "Tasyakur", "Empati", "Active listening", "Quality time", "Mengelola emosi", "Menyelesaikan konflik", "Rasa syukur", "Istirahat berkualitas"]],
      ["start_time", "Waktu mulai", "time"],
      ["end_time", "Waktu selesai", "time"],
      ["duration_minutes", "Durasi menit", "number"],
      ["emotion_before", "Emosi sebelum", "text"],
      ["emotion_after", "Emosi setelah", "text"],
      ["lesson", "Pelajaran", "textarea"],
      ["gratitude_note", "Catatan syukur", "textarea"],
      ["status", "Status", "select", false, ["Direncanakan", "Sedang berlangsung", "Selesai", "Ditunda"]]
    ]
  },
  Intellectual_Logs: {
    title: "Pengembangan Intelektual",
    view: "growth",
    fields: [
      ["member_name", "Nama anggota", "text", true],
      ["date", "Tanggal", "date", true],
      ["activity", "Nama kegiatan", "select", true, ["Membaca buku", "Mengikuti kursus", "Upgrade skill", "Public speaking", "Kepemimpinan", "Menulis", "Belajar bahasa", "Kajian keislaman", "Literasi digital", "Literasi finansial", "Belajar teknologi", "Diskusi keluarga", "Proyek pribadi"]],
      ["category", "Kategori", "text"],
      ["target", "Target", "text"],
      ["duration_minutes", "Durasi menit", "number"],
      ["material", "Materi", "textarea"],
      ["progress", "Progres %", "number"],
      ["notes", "Catatan", "textarea"],
      ["attachment_url", "Dokumen pendukung", "url"],
      ["next_step", "Rencana tindak lanjut", "textarea"]
    ]
  },
  Daily_Activities: {
    title: "Daily Activity",
    view: "daily",
    fields: [
      ["member_name", "Nama anggota", "text", true],
      ["date", "Tanggal", "date", true],
      ["activity", "Nama aktivitas", "text", true],
      ["category", "Kategori", "select", false, ["Ibadah", "Keluarga", "Belajar", "Kerja/Sekolah", "Kesehatan", "Keuangan", "Tugas rumah"]],
      ["start_time", "Waktu mulai", "time"],
      ["end_time", "Waktu selesai", "time"],
      ["duration_minutes", "Durasi otomatis", "number"],
      ["priority", "Prioritas", "select", false, ["Tinggi", "Sedang", "Rendah"]],
      ["status", "Status", "select", false, ["Direncanakan", "Sedang berlangsung", "Selesai", "Ditunda", "Dibatalkan"]],
      ["location", "Lokasi", "text"],
      ["energy", "Tingkat energi", "text"],
      ["emotion", "Kondisi emosi", "text"],
      ["notes", "Catatan", "textarea"],
      ["lesson", "Pelajaran hari ini", "textarea"],
      ["gratitude", "Hal yang disyukuri", "textarea"],
      ["tomorrow_plan", "Rencana perbaikan besok", "textarea"]
    ]
  },
  Income: { title: "Pendapatan", view: "finance", fields: financeFields(["Gaji", "Honor tetap", "Pendapatan usaha", "Uang sewa", "Bonus", "Komisi", "Proyek", "Penjualan", "Freelance", "Hadiah"]) },
  Expenses: { title: "Pengeluaran", view: "finance", fields: financeFields(["Sewa/cicilan rumah", "Wi-Fi", "Listrik", "Air", "Pendidikan anak", "Rumah tangga", "Transportasi", "Zakat", "Infak", "Liburan", "Kesehatan", "Kebutuhan mendadak"]) },
  Savings: { title: "Tabungan", view: "finance", fields: financeFields(["Tabungan keluarga", "Dana darurat", "Dana pendidikan", "Dana kesehatan", "Dana rumah", "Dana kendaraan", "Dana haji/umrah"]) },
  Investments: { title: "Investasi", view: "finance", fields: financeFields(["Emas", "Properti", "Investasi syariah", "Modal usaha"]) },
  Financial_Goals: {
    title: "Target Keuangan",
    view: "finance",
    fields: [["member_name", "Nama anggota", "text"], ["date", "Tanggal", "date"], ["goal_name", "Nama target", "text", true], ["target_amount", "Nilai target", "number"], ["current_amount", "Saldo saat ini", "number"], ["target_date", "Target tanggal", "date"], ["monthly_saving", "Setoran bulanan", "number"], ["notes", "Catatan", "textarea"]]
  },
  Family_Agendas: {
    title: "Agenda Keluarga",
    view: "agenda",
    fields: [["member_name", "Penanggung jawab", "text"], ["date", "Tanggal", "date", true], ["agenda_title", "Agenda", "text", true], ["category", "Kategori", "select", false, ["Kajian", "Keluarga", "Pendidikan", "Kesehatan", "Keuangan"]], ["status", "Status", "select", false, ["Direncanakan", "Selesai", "Ditunda"]], ["notes", "Catatan", "textarea"]]
  },
  Quran_Progress: {
    title: "Al-Qur'an Digital dan Progres",
    view: "quran",
    fields: [["member_name", "Nama anggota", "text", true], ["date", "Tanggal", "date", true], ["surah", "Surah", "text"], ["juz", "Juz", "number"], ["last_read", "Terakhir dibaca", "text"], ["pages_read", "Halaman dibaca", "number"], ["verses_memorized", "Ayat dihafal", "number"], ["murajaah", "Murajaah", "text"], ["qari", "Qari", "text"], ["notes", "Catatan ayat", "textarea"], ["bookmark", "Bookmark", "text"]]
  },
  Prayer_Settings: {
    title: "Waktu Sholat dan Kiblat",
    view: "prayer",
    fields: [["member_name", "Nama anggota", "text"], ["date", "Tanggal", "date"], ["location", "Lokasi", "text"], ["method", "Metode", "select", false, ["Kementerian Agama RI", "Manual"]], ["subuh", "Subuh", "time"], ["syuruq", "Syuruq", "time"], ["zuhur", "Zuhur", "time"], ["asar", "Asar", "time"], ["magrib", "Magrib", "time"], ["isya", "Isya", "time"], ["qibla_degree", "Arah kiblat derajat", "number"], ["manual_adjustment", "Penyesuaian manual", "text"]]
  },
  Notifications: {
    title: "Notifikasi",
    view: "notifications",
    fields: [["member_name", "Nama anggota", "text"], ["date", "Tanggal", "date"], ["notification_type", "Jenis", "select", false, ["Waktu sholat", "Dzikir", "Tilawah", "Hafalan", "Daily Activity", "Agenda", "Tagihan", "Target tabungan", "Laporan mingguan"]], ["enabled", "Aktif", "select", false, ["Ya", "Tidak"]], ["time", "Waktu", "time"], ["sound", "Suara", "text"], ["vibration", "Getar", "select", false, ["Ya", "Tidak"]], ["frequency", "Frekuensi", "text"], ["notes", "Catatan", "textarea"]]
  }
};

function financeFields(categories) {
  return [["member_name", "Nama anggota", "text"], ["date", "Tanggal", "date", true], ["category", "Kategori", "select", true, categories], ["description", "Deskripsi", "text"], ["amount", "Jumlah Rupiah", "number", true], ["budget", "Anggaran", "number"], ["due_date", "Jatuh tempo", "date"], ["payment_method", "Metode", "text"], ["notes", "Catatan", "textarea"]];
}

init();

function init() {
  renderNav();
  buildViews();
  bindTopActions();
  bindMobileDrawer();
  initAuth();
  initPrayerLocation();
  tickIslamicWidget();
  setInterval(tickIslamicWidget, 1000);
  setInterval(() => { if (navigator.onLine && localStorage.getItem(sessionKey)) syncFamilyData(); }, 180000);
  window.addEventListener("resize", drawCharts);
  renderAll();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" })
      .then(registration => registration.update())
      .catch(() => {});
  }
  window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); deferredInstall = event; });
  window.addEventListener("online", syncQueue);
}

function initAuth() {
  const loginUser = document.getElementById("loginUser");
  loginUser.innerHTML = LOGIN_USERS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("togglePasswordBtn")?.addEventListener("click", togglePasswordVisibility);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("profilePhotoInput")?.addEventListener("change", handleProfilePhoto);

  const session = localStorage.getItem(sessionKey);
  if (LOGIN_USERS.some(([user]) => user === session)) unlockApp(session);
  else document.getElementById("loginForm").hidden = false;
}

async function handlePasswordSetup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.submitting === "true") return;
  const user = form.elements.account.value;
  const password = form.elements.password.value;
  const status = form.querySelector(".status-line");
  if (localStorage.getItem(sessionKey) !== "abi" || password.length < 8) {
    status.textContent = "Hanya Abi yang dapat mengubah password. Gunakan minimal 8 karakter.";
    return;
  }
  form.dataset.submitting = "true";
  const button = form.querySelector('[type="submit"]');
  if (button) button.disabled = true;
  try {
    const result = await sendAuthRequest({ action: "authSetPassword", user, password, sessionToken: localStorage.getItem(cloudSessionKey) });
    if (!result.ok) throw new Error(result.error || "Pengaturan password gagal.");
    saveCloudSession(result);
    const auth = loadAuth() || {};
    auth[user] = await createPasswordRecord(password);
    localStorage.setItem(authKey, JSON.stringify(auth));
    status.textContent = `Password ${LOGIN_USERS.find(([id]) => id === user)?.[1] || user} berhasil diperbarui.`;
    form.reset();
  } catch (error) {
    status.textContent = `${error.message} Password belum diubah.`;
  } finally {
    form.dataset.submitting = "false";
    if (button) button.disabled = false;
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const user = document.getElementById("loginUser").value;
  const password = document.getElementById("loginPassword").value;
  const status = document.getElementById("loginStatus");
  const auth = loadAuth() || {};
  status.textContent = "Memeriksa password keluarga...";
  try {
    const cloud = await sendAuthRequest({ action: "authLogin", user, password });
    if (cloud.ok) {
      saveCloudSession(cloud);
      localStorage.setItem(sessionKey, user);
      status.textContent = "";
      unlockApp(user);
      return;
    }
    if (cloud.error === "Password belum sesuai.") {
      status.textContent = cloud.error;
      return;
    }
    if (user === "abi") {
      let recordsToProvision;
      if (auth.abi) {
        const hash = await hashPassword(auth.abi.salt, password);
        if (hash !== auth.abi.hash) {
          status.textContent = "Password belum sesuai.";
          return;
        }
        recordsToProvision = LOGIN_USERS.every(([member]) => auth[member]) ? auth : { abi: auth.abi };
      } else {
        recordsToProvision = { abi: await createPasswordRecord(password) };
      }
      const bootstrapKey = prompt("Kode aktivasi satu kali dari Script Properties Apps Script:");
      if (!bootstrapKey) {
        status.textContent = "Aktivasi awal memerlukan kode satu kali dari pengelola Apps Script.";
        return;
      }
      const provision = await sendAuthRequest({ action: "authProvision", users: recordsToProvision, bootstrapKey });
      if (provision.created) {
        saveCloudSession(provision);
        localStorage.setItem(sessionKey, user);
        unlockApp(user);
        return;
      }
      if (provision.exists) {
        const retry = await sendAuthRequest({ action: "authLogin", user, password });
        if (retry.ok) {
          saveCloudSession(retry);
          localStorage.setItem(sessionKey, user);
          unlockApp(user);
          return;
        }
        status.textContent = retry.error || "Password belum sesuai.";
        return;
      }
    }
    status.textContent = cloud.error || "Password keluarga belum tersedia di server.";
  } catch (error) {
    status.textContent = error?.message || "Server login tidak merespons. Coba lagi sebentar.";
  }
}

async function sendAuthRequest(payload) {
  return sendCloudRequest(payload);
}

async function sendCloudRequest(payload) {
  // navigator.onLine is unreliable in installed desktop browsers; let the request determine connectivity.
  if (!config.googleAppsScriptUrl) throw new Error("Alamat server login belum diatur.");
  const requestId = createRequestId();
  await fetch(config.googleAppsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, requestId })
  });
  const result = await pollAuthResult(requestId);
  saveCloudSession(result);
  return result;
}

function pollAuthResult(requestId) {
  return new Promise((resolve, reject) => {
    const callback = `authCallback_${requestId.replace(/-/g, "")}`;
    let attempts = 0;
    const check = () => {
      if (attempts++ >= 20) {
        delete window[callback];
        reject(new Error("Server login tidak merespons. Coba lagi sebentar."));
        return;
      }
      const script = document.createElement("script");
      script.src = `${config.googleAppsScriptUrl}?action=authResult&requestId=${encodeURIComponent(requestId)}&callback=${callback}&t=${Date.now()}`;
      script.onerror = () => { script.remove(); setTimeout(check, 500); };
      script.onload = () => {
        script.remove();
        const result = window[callback]?.result;
        if (result && !result.pending) { delete window[callback]; resolve(result); }
        else setTimeout(check, 500);
      };
      document.head.append(script);
    };
    window[callback] = result => { window[callback].result = result; window[callback].pending = Boolean(result.pending); };
    check();
  });
}

function togglePasswordVisibility() {
  const input = document.getElementById("loginPassword");
  const button = document.getElementById("togglePasswordBtn");
  const visible = input.type === "text";
  input.type = visible ? "password" : "text";
  button.textContent = visible ? "Lihat" : "Sembunyi";
  button.setAttribute("aria-label", visible ? "Tampilkan password" : "Sembunyikan password");
  button.title = visible ? "Tampilkan password" : "Sembunyikan password";
  input.focus();
}

function unlockApp(user) {
  document.body.classList.remove("auth-locked");
  document.body.classList.add("auth-ready");
  const roleSelect = document.getElementById("roleSelect");
  roleSelect.value = user;
  roleSelect.disabled = true;
  restrictStateForUser(user);
  updateDashboardProfile(user);
  loadCloudProfilePhoto(user);
  renderNav(user);
  if (!canAccess(user, "all") && ["reports", "settings"].some(id => document.getElementById(id).classList.contains("active"))) {
    showView("dashboard");
  }
  renderAll();
  if (navigator.onLine && localStorage.getItem(cloudSessionKey)) {
    loadAccessSettings();
    if (user === "abi") cleanDemoData(true).finally(syncFamilyData);
    else syncFamilyData();
  }
}

function saveCloudSession(result) {
  if (result.sessionToken) localStorage.setItem(cloudSessionKey, result.sessionToken);
}

async function loadCloudProfilePhoto(user) {
  const token = localStorage.getItem(cloudSessionKey);
  if (!token || !navigator.onLine) return;
  try {
    const result = await sendAuthRequest({ action: "profilePhotoGet", user, sessionToken: token });
    if (!result.ok) return;
    if (result.photoData) {
      const photos = loadProfilePhotos();
      photos[user] = result.photoData;
      localStorage.setItem(profilePhotoKey, JSON.stringify(photos));
      const image = document.getElementById("dashboardProfilePhoto");
      if (image && localStorage.getItem(sessionKey) === user) image.src = result.photoData;
    } else {
      const localPhoto = loadProfilePhotos()[user];
      if (localPhoto) await sendAuthRequest({ action: "profilePhotoSet", user, sessionToken: token, photoData: localPhoto });
    }
  } catch { /* Keep the locally saved photo available while the cloud is offline. */ }
}

function updateDashboardProfile(user) {
  const member = state.Family_Members.find(row => row.member_id === ACTIVE_ROLE_MEMBER[user]);
  const displayName = dashboardUserName(user, member);
  const image = document.getElementById("dashboardProfilePhoto");
  if (image) {
    image.src = loadProfilePhotos()[user] || "assets/logo/abu-adzka-logo.png";
    image.alt = `Foto profil ${displayName}`;
  }
  tickIslamicWidget();
}

function dashboardUserName(user, member) {
  const familiarNames = {
    abi: "Abi", ummi: "Ummi", alif_aslam: "Alif Aslam",
    muslim_ihsan: "Muslim Ihsan", m_bilal_albana: "M. Bilal Albana",
    fajri_rahman: "Fajri Rahman", adzkadina_salsabila: "Adzkadina Salsabila"
  };
  const actualName = member?.nickname || member?.member_name;
  if (actualName && !/^(kepala keluarga|istri|anak (pertama|kedua|ketiga|keempat|kelima))$/i.test(actualName.trim())) {
    if (["abi", "ummi"].includes(user) && !actualName.toLowerCase().startsWith(familiarNames[user].toLowerCase())) return `${familiarNames[user]} ${actualName}`;
    return actualName;
  }
  return familiarNames[user] || "Keluarga";
}

async function handleProfilePhoto(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  const user = localStorage.getItem(sessionKey);
  if (!file || !user || !file.type.startsWith("image/")) return;
  const image = document.getElementById("dashboardProfilePhoto");
  const status = document.getElementById("profilePhotoStatus");
  const previewUrl = URL.createObjectURL(file);
  if (image) image.src = previewUrl;
  let savedOnDevice = false;
  try {
    const decodedImage = new Image();
    await new Promise((resolve, reject) => {
      decodedImage.onload = resolve;
      decodedImage.onerror = reject;
      decodedImage.src = previewUrl;
    });
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 384 / Math.max(decodedImage.width, decodedImage.height));
    canvas.width = Math.round(decodedImage.width * scale);
    canvas.height = Math.round(decodedImage.height * scale);
    canvas.getContext("2d").drawImage(decodedImage, 0, 0, canvas.width, canvas.height);
    const photos = loadProfilePhotos();
    photos[user] = canvas.toDataURL("image/jpeg", 0.72);
    localStorage.setItem(profilePhotoKey, JSON.stringify(photos));
    savedOnDevice = true;
    const token = localStorage.getItem(cloudSessionKey);
    if (token && navigator.onLine) {
      const result = await sendAuthRequest({ action: "profilePhotoSet", user, sessionToken: token, photoData: photos[user] });
      if (!result.ok) throw new Error(result.error || "Sinkronisasi foto gagal.");
      if (status) status.textContent = "Foto tersimpan dan tersinkron";
    } else if (status) status.textContent = "Foto tersimpan di perangkat ini; login ulang untuk sinkronisasi.";
  } catch {
    if (status) status.textContent = savedOnDevice ? "Foto tersimpan di perangkat, tetapi gagal disinkronkan." : "Foto gagal disimpan. Coba JPG, PNG, atau WebP yang lebih kecil.";
  }
  input.value = "";
}

function loadProfilePhotos() {
  try { return JSON.parse(localStorage.getItem(profilePhotoKey) || "{}"); }
  catch { return {}; }
}

function logout() {
  localStorage.removeItem(sessionKey);
  localStorage.removeItem(cloudSessionKey);
  document.body.classList.add("auth-locked");
  document.body.classList.remove("auth-ready");
  document.getElementById("loginPassword").value = "";
  document.getElementById("loginStatus").textContent = "";
  document.getElementById("loginForm").hidden = false;
}

function loadFamilyAccess() {
  try { return JSON.parse(localStorage.getItem(accessKey) || "{}"); }
  catch { return {}; }
}

function loadAuth() {
  try { return JSON.parse(localStorage.getItem(authKey) || "null"); }
  catch { return null; }
}

async function hashPassword(salt, password) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function createPasswordRecord(password) {
  const salt = crypto.getRandomValues(new Uint32Array(4)).join("-");
  return { salt, hash: await hashPassword(salt, password) };
}

function renderNav(role = document.getElementById("roleSelect")?.value || "abi") {
  const desktop = document.getElementById("desktopNav");
  const mobile = document.getElementById("mobileNav");
  const visibleNav = allowedNavItems(role);
  desktop.innerHTML = visibleNav.map(([id, label]) => `<button data-view="${id}" class="${id === "dashboard" ? "active" : ""}">${label}</button>`).join("");
  mobile.innerHTML = visibleNav.map(([id, label]) => `<button data-view="${id}" class="${id === "dashboard" ? "active" : ""}">${label}</button>`).join("");
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    showView(button.dataset.view);
    closeMobileDrawer();
  }));
}

function allowedNavItems(role) {
  return navItems.filter(([id]) => isModuleAllowed(role, id));
}

function isModuleAllowed(user, moduleId) {
  const account = familyAccess[user];
  if (account?.enabled === false) return false;
  if (moduleId === "dashboard") return true;
  if (canAccess(user, "all")) return true;
  if (["reports", "settings"].includes(moduleId)) return false;
  const modules = Array.isArray(account?.modules) ? account.modules : DEFAULT_ACCESS_MODULES[user] || [];
  return modules.includes(moduleId);
}

function restrictStateForUser(user) {
  const memberId = ACTIVE_ROLE_MEMBER[user];
  for (const sheet of SHEETS) {
    if (!isModuleAllowed(user, moduleForLocalSheet(sheet))) {
      state[sheet] = [];
      continue;
    }
    if (!canAccess(user, "all") && user !== "ummi") {
      state[sheet] = (state[sheet] || []).filter(row => row.privacy !== "private" || row.member_id === memberId);
    }
  }
}

function showView(id) {
  const role = document.getElementById("roleSelect")?.value || "abi";
  if (!isModuleAllowed(role, id)) id = "dashboard";
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === id));
  document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === id));
  const item = navItems.find(([viewId]) => viewId === id);
  document.getElementById("pageTitle").textContent = item ? item[1] : "Dashboard";
  renderAll();
}

function bindMobileDrawer() {
  document.getElementById("mobileMenuToggle")?.addEventListener("click", toggleMobileDrawer);
  document.getElementById("sidebarBackdrop")?.addEventListener("click", closeMobileDrawer);
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMobileDrawer();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMobileDrawer();
  });
}

function toggleMobileDrawer() {
  const isOpen = document.body.classList.contains("sidebar-open");
  if (isOpen) closeMobileDrawer();
  else openMobileDrawer();
}

function openMobileDrawer() {
  document.body.classList.add("sidebar-open");
  const toggle = document.getElementById("mobileMenuToggle");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "×";
  }
  if (backdrop) backdrop.hidden = false;
}

function closeMobileDrawer() {
  document.body.classList.remove("sidebar-open");
  const toggle = document.getElementById("mobileMenuToggle");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
  }
  if (backdrop) backdrop.hidden = true;
}

function buildViews() {
  const grouped = Object.entries(sheetForms).reduce((acc, [sheet, meta]) => {
    acc[meta.view] = acc[meta.view] || [];
    acc[meta.view].push([sheet, meta]);
    return acc;
  }, {});
  Object.entries(grouped).forEach(([view, forms]) => {
    const node = document.getElementById(view);
    node.innerHTML = forms.map(([sheet, meta]) => formTemplate(sheet, meta)).join("");
  });
  enhanceQuranView();
  enhancePrayerView();
  document.getElementById("reports").innerHTML = reportsTemplate();
  document.getElementById("settings").innerHTML = settingsTemplate();
  document.querySelectorAll("form[data-sheet]").forEach(form => form.addEventListener("submit", handleSubmit));
  document.getElementById("setupForm")?.addEventListener("submit", handlePasswordSetup);
  document.getElementById("accessForm")?.addEventListener("submit", handleAccessSave);
  document.getElementById("accessUser")?.addEventListener("change", renderAccessModules);
  document.querySelector("[data-clean-demo]")?.addEventListener("click", cleanDemoData);
  document.getElementById("syncConflicts")?.addEventListener("click", resolveQueuedConflict);
  renderAccessModules();
  document.querySelectorAll("[data-export-json]").forEach(button => button.addEventListener("click", exportJson));
  document.querySelectorAll("[data-backup]").forEach(button => button.addEventListener("click", backupToDrive));
}

function enhanceQuranView() {
  const node = document.getElementById("quran");
  node.insertAdjacentHTML("afterbegin", `
    <div class="panel" style="margin-bottom:16px">
      <h3>Al-Qur'an Digital 30 Juz</h3>
      <div class="quran-reader">
        <div class="glass-3d">
          <label>Tampilkan
            <select id="quranMode"><option value="juz">Juz lengkap</option><option value="surah">Surah</option></select>
          </label>
          <label>Juz
            <select id="quranJuz">${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}">Juz ${i + 1}</option>`).join("")}</select>
          </label>
          <label>Surah
            <select id="quranSurah">${QURAN_SURAHS.map((name, index) => `<option value="${index + 1}">${index + 1}. ${name}</option>`).join("")}</select>
          </label>
          <label>Qari
            <select id="quranQari">${QURAN_QARIS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select>
          </label>
          <label>Ukuran Arab
            <select id="arabicSize"><option value="normal">Normal</option><option value="large">Besar</option><option value="xlarge">Sangat besar</option></select>
          </label>
          <div class="form-actions quran-actions">
            <button class="btn small primary" type="button" id="loadQuranBtn">Muat Bacaan</button>
            <button class="btn small" type="button" id="playQuranBtn">Putar Audio</button>
            <button class="btn small" type="button" id="stopQuranBtn">Stop</button>
          </div>
          <div class="tajwid-legend">
            <span class="pill"><span class="tajwid mad">Mad</span></span>
            <span class="pill"><span class="tajwid ikhfa">Ikhfa</span></span>
            <span class="pill"><span class="tajwid idgham">Idgham</span></span>
            <span class="pill"><span class="tajwid qalqalah">Qalqalah</span></span>
          </div>
          <p class="status-line" id="quranStatus">Pilih juz atau surah, lalu muat bacaan.</p>
        </div>
        <div class="mushaf-panel" id="mushafPanel"></div>
      </div>
      <p class="status-line">Data mushaf mengambil 30 juz, terjemahan Indonesia, dan audio qari melalui API AlQuran Cloud. Cache browser dipakai agar bacaan yang pernah dibuka tetap tersedia saat offline.</p>
    </div>`);
  ["quranMode", "quranJuz", "quranSurah", "quranQari", "arabicSize"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", renderQuranReader);
  });
  document.getElementById("loadQuranBtn")?.addEventListener("click", () => renderQuranReader(true));
  document.getElementById("playQuranBtn")?.addEventListener("click", playVisibleQuranAudio);
  document.getElementById("stopQuranBtn")?.addEventListener("click", stopQuranAudio);
  document.getElementById("mushafPanel")?.addEventListener("click", event => {
    const button = event.target.closest("[data-play-ayah]");
    if (button) playAyah(button.dataset.playAyah);
  });
}

function enhancePrayerView() {
  const node = document.getElementById("prayer");
  node.insertAdjacentHTML("afterbegin", `
    <div class="grid two" style="margin-bottom:16px">
      <div class="panel">
        <h3>Jadwal Sholat dan Adzan</h3>
        <div class="table-tools">
          <button class="btn small primary" type="button" id="useLocationBtn">Gunakan Lokasi Saya</button>
          <span class="pill" id="prayerLocationLabel">Memuat lokasi...</span>
        </div>
        <div class="prayer-grid" id="prayerGrid"></div>
      </div>
      <div class="panel">
        <h3>Arah Kiblat</h3>
        <div class="qibla-card glass-3d">
          <div class="compass-3d"><span>N</span><i></i><b>295&deg;</b></div>
          <p class="status-line">Arah kiblat akan disesuaikan otomatis setelah izin lokasi diberikan.</p>
        </div>
      </div>
    </div>`);
  document.getElementById("useLocationBtn")?.addEventListener("click", initPrayerLocation);
}

function formTemplate(sheet, meta) {
  const fields = meta.fields.map(([name, label, type, required, options]) => {
    const req = required ? "required" : "";
    if (type === "textarea") return `<label class="wide">${label}<textarea name="${name}" ${req}></textarea></label>`;
    if (type === "select") return `<label>${label}<select name="${name}" ${req}>${options.map(option => `<option>${option}</option>`).join("")}</select></label>`;
    return `<label>${label}<input name="${name}" type="${type}" ${req}></label>`;
  }).join("");
  return `
    <div class="grid two" style="margin-bottom:16px">
      <form class="panel crud-area" data-sheet="${sheet}">
        <h3>${meta.title}</h3>
        <div class="form-grid">${fields}</div>
        <div class="form-actions">
          <button class="btn" type="reset">Bersihkan</button>
          <button class="btn primary" type="submit">Simpan</button>
        </div>
        <div class="status-line"></div>
      </form>
      <div class="panel">
        <h3>Data ${meta.title}</h3>
        <div class="table-tools">
          <input data-search="${sheet}" placeholder="Cari data">
          <select data-filter="${sheet}"><option value="">Semua status</option><option>Selesai</option><option>Direncanakan</option><option>Ditunda</option><option>active</option></select>
        </div>
        <div class="table-wrap"><table data-table="${sheet}"></table></div>
      </div>
    </div>`;
}

function reportsTemplate() {
  return `
    <div class="panel">
      <h3>Laporan dan Verifikasi</h3>
      <p class="tagline">Laporan disusun dari data keluarga yang tercatat. PDF dicetak dari layout dashboard agar kartu, grafik, dan tabel mudah dibaca.</p>
      <div class="table-wrap"><table id="reportTable"></table></div>
    </div>`;
}

function settingsTemplate() {
  return `
    <div class="grid two">
      <div class="panel">
        <h3>Konfigurasi Aman</h3>
        <p class="status-line" id="syncStatus">Data terbaru diperiksa setelah login.</p>
        <table><tbody>
          <tr><th>Workspace owner</th><td>${config.workspaceOwner}</td></tr>
          <tr><th>Apps Script URL</th><td>${config.googleAppsScriptUrl ? "Terhubung" : "Belum dikonfigurasi"}</td></tr>
          <tr><th>Google Client ID</th><td>${config.googleClientId ? "Diisi melalui config/env" : "Belum diisi"}</td></tr>
          <tr><th>Offline queue</th><td id="queueCount">${queue.length} item</td></tr>
        </tbody></table>
      </div>
      <div class="panel">
        <h3>Data dan Backup</h3>
        <div class="form-actions" style="justify-content:flex-start; flex-wrap:wrap">
          <button class="btn" data-export-json>Export JSON</button>
          <button class="btn" data-backup>Backup ke Google Drive</button>
          <button class="btn" data-clean-demo>Bersihkan Baris Demo</button>
        </div>
        <p class="status-line">Tidak ada password, token, client secret, atau API key di source code.</p>
      </div>
      <form class="panel" id="setupForm">
        <h3>Password Per Pengguna</h3>
        <label>Pengguna<select name="account">${LOGIN_USERS.map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`).join("")}</select></label>
        <label>Password baru<input name="password" type="password" minlength="8" autocomplete="new-password" required></label>
        <button class="btn primary" type="submit">Simpan Password Pengguna</button>
        <p class="status-line">Mengubah password satu pengguna tidak mengubah password anggota lain.</p>
      </form>
      <form class="panel" id="accessForm">
        <h3>Hak Akses Pengguna</h3>
        <label>Pengguna<select id="accessUser" name="account">${LOGIN_USERS.filter(([id]) => id !== "abi").map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`).join("")}</select></label>
        <label class="inline-checkbox"><input type="checkbox" name="enabled" checked><span>Akun aktif</span></label>
        <div id="accessModules" class="form-grid"></div>
        <button class="btn primary" type="submit">Simpan Hak Akses</button>
        <p class="status-line">Hak akses disimpan untuk akun terpilih.</p>
      </form>
    </div>`;
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.submitting === "true") return;
  const sheet = form.dataset.sheet;
  const role = document.getElementById("roleSelect").value;
  const statusLine = form.querySelector(".status-line");
  if ((!navigator.onLine || !config.googleAppsScriptUrl) && queue.length >= 500) {
    statusLine.textContent = "Antrean 500 data sudah penuh. Sinkronkan data sebelum menambah lagi.";
    return;
  }
  if (!canWriteSheet(role, sheet)) {
    form.querySelector(".status-line").textContent = "Akun ini tidak memiliki izin menyimpan data pada modul tersebut.";
    return;
  }
  const payload = Object.fromEntries(new FormData(form).entries());
  Object.keys(payload).forEach(key => payload[key] = sanitizeText(payload[key]));
  if (!['abi', 'ummi'].includes(role) && ACTIVE_ROLE_MEMBER[role]) {
    const member = state.Family_Members.find(row => row.member_id === ACTIVE_ROLE_MEMBER[role]);
    payload.member_name = dashboardUserName(role, member);
  }
  if (sheet === "Daily_Activities" && payload.start_time && payload.end_time) {
    payload.duration_minutes = calculateDuration(payload.start_time, payload.end_time);
  }
  const duplicate = findLikelyDuplicate(sheet, payload);
  if (duplicate && !confirm("Ada catatan serupa untuk anggota dan tanggal yang sama. Tetap simpan sebagai catatan terpisah?")) return;
  const record = base(sheet, {
    ...payload,
    member_id: !['abi', 'ummi'].includes(role) && ACTIVE_ROLE_MEMBER[role] ? ACTIVE_ROLE_MEMBER[role] : findMemberId(payload.member_name),
    created_by: activeActor(),
    updated_by: activeActor()
  });
  const previousRecord = editing && editing.sheet === sheet ? state[sheet].find(row => row.id === editing.id) : null;
  if (previousRecord) record.base_updated_at = previousRecord.updated_at;
  form.dataset.submitting = "true";
  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  if (editing && editing.sheet === sheet) {
    const index = state[sheet].findIndex(row => row.id === editing.id);
    state[sheet][index] = { ...state[sheet][index], ...record, id: editing.id, created_at: state[sheet][index].created_at, updated_at: new Date().toISOString() };
    editing = null;
  } else {
    state[sheet].push(record);
  }
  audit("upsert", sheet, record);
  saveData();
  let writeError = "";
  try {
    await enqueueOrSend({ action: "upsert", sheet, record });
  } catch (error) {
    writeError = error.message;
    if (!queue.some(item => item.record?.id === record.id)) {
      if (previousRecord) state[sheet] = state[sheet].map(row => row.id === previousRecord.id ? previousRecord : row);
      else state[sheet] = state[sheet].filter(row => row.id !== record.id);
      saveData();
    }
    if (error.conflict) {
      editing = { sheet, id: record.id };
      syncFamilyData();
    }
  } finally {
    form.dataset.submitting = "false";
    if (submitButton) submitButton.disabled = false;
  }
  if (!writeError.startsWith("Konflik:")) {
    form.reset();
    setDefaultDates();
  }
  statusLine.textContent = writeError || (queue.some(item => item.record?.id === record.id)
    ? "Data tersimpan di perangkat dan menunggu sinkronisasi."
    : "Data tersinkron ke Google Sheets. Dashboard diperbarui.");
  renderAll();
}

function canWriteSheet(role, sheet) {
  if (!isModuleAllowed(role, moduleForLocalSheet(sheet))) return false;
  if (canAccess(role, "all")) return true;
  if (role === "ummi") return ["Family_Members", "User_Roles", "Family_Agendas", "Notifications"].includes(sheet);
  if (role === "adzkadina_salsabila") return false;
  return ["Spiritual_Logs", "Emotional_Logs", "Intellectual_Logs", "Daily_Activities", "Quran_Progress"].includes(sheet);
}

function findLikelyDuplicate(sheet, payload) {
  const keys = {
    Daily_Activities: ["activity", "start_time"],
    Spiritual_Logs: ["program_name", "time"],
    Emotional_Logs: ["activity", "start_time"],
    Intellectual_Logs: ["activity", "category"],
    Income: ["category", "description", "amount"],
    Expenses: ["category", "description", "amount"],
    Savings: ["category", "description", "amount"],
    Investments: ["category", "description", "amount"],
    Financial_Goals: ["goal_name", "target_amount"],
    Family_Agendas: ["agenda_title", "category"],
    Quran_Progress: ["surah", "juz", "last_read"],
    Family_Members: ["member_name", "role"]
  }[sheet];
  if (!keys) return null;
  const currentId = editing?.sheet === sheet ? editing.id : null;
  const memberId = findMemberId(payload.member_name);
  const normalize = value => String(value ?? "").trim().toLocaleLowerCase("id-ID");
  const dateKey = value => String(value ?? "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || normalize(value);
  return (state[sheet] || []).find(row => row.id !== currentId && row.status_data !== "deleted" &&
    normalize(row.member_id) === normalize(memberId) && dateKey(row.date) === dateKey(payload.date) &&
    keys.every(key => normalize(row[key]) === normalize(payload[key])));
}

function renderAll() {
  setDefaultDates();
  renderFilters();
  renderMetrics();
  renderTables();
  renderReports();
  renderTimeline();
  renderQuranReader();
  renderPrayerGrid();
  drawCharts();
  const queueCount = document.getElementById("queueCount");
  if (queueCount) queueCount.textContent = `${queue.length} item`;
  renderSyncConflicts();
}

function renderMetrics() {
  const s = dashboardSummary(state);
  const metrics = [
    ["Anggota keluarga", s.members, "Profil aktif keluarga"],
    ["Daily Activity", `${s.dailyDonePercent}%`, `${s.dailyTotal} aktivitas tercatat`],
    ["Spiritual", `${s.spiritualPercent}%`, "Konsistensi kebiasaan ibadah"],
    ["Emosional", `${s.emotionalPercent}%`, "Aktivitas selesai"],
    ["Intelektual", `${s.intellectualPercent}%`, "Progres belajar"],
    ["Target tercapai", s.goalsReached, `${s.goalsOpen} belum selesai`],
    ["Tilawah", `${s.quranPages} hlm`, `${s.quranMemorized} ayat hafalan`],
    ["Arus kas", rupiah(s.cashflow), `Rasio menabung ${s.savingRatio}%`],
    ["Pendapatan", rupiah(s.income), "Bulan berjalan"],
    ["Pengeluaran", rupiah(s.expenses), "Termasuk zakat dan infak"],
    ["Tabungan", rupiah(s.savings), `${s.emergencyMonths} bulan dana darurat`],
    ["Investasi", rupiah(s.investments), "Aset produktif keluarga"]
  ];
  document.getElementById("metricGrid").innerHTML = metrics.map(([label, value, note]) => `<div class="card metric"><div class="label">${label}</div><div class="value">${value}</div><div class="note">${note}</div></div>`).join("");
}

function renderTables() {
  document.querySelectorAll("[data-table]").forEach(table => {
    const sheet = table.dataset.table;
    const search = document.querySelector(`[data-search="${sheet}"]`);
    const filter = document.querySelector(`[data-filter="${sheet}"]`);
    if (search && !search.dataset.bound) {
      search.dataset.bound = "1";
      search.addEventListener("input", renderTables);
      filter.addEventListener("change", renderTables);
    }
    const rows = visibleRows(sheet).filter(row => {
      const haystack = JSON.stringify(row).toLowerCase();
      const q = (search?.value || "").toLowerCase();
      const f = filter?.value || "";
      return (!q || haystack.includes(q)) && (!f || row.status === f || row.status_data === f);
    });
    table.innerHTML = tableMarkup(sheet, rows);
  });
}

function tableMarkup(sheet, rows) {
  const keys = Array.from(new Set(rows.flatMap(row => Object.keys(row)))).filter(key => !["family_id", "created_at", "updated_at"].includes(key)).slice(0, 8);
  if (!rows.length) return "<tbody><tr><td>Belum ada data.</td></tr></tbody>";
  return `<thead><tr>${keys.map(key => `<th>${key}</th>`).join("")}<th>Aksi</th></tr></thead><tbody>${rows.map(row => `<tr>${keys.map(key => `<td>${formatCell(row[key])}</td>`).join("")}<td><button class="btn small" data-edit="${sheet}:${row.id}">Edit</button> <button class="btn small danger" data-delete="${sheet}:${row.id}">Hapus</button></td></tr>`).join("")}</tbody>`;
}

function formatCell(value) {
  if (String(value).length > 80) return `${String(value).slice(0, 80)}...`;
  if (/^\d{5,}$/.test(String(value))) return rupiah(value);
  return value ?? "";
}

document.addEventListener("click", event => {
  const editTarget = event.target.closest("[data-edit]");
  const deleteTarget = event.target.closest("[data-delete]");
  if (editTarget) startEdit(editTarget.dataset.edit);
  if (deleteTarget) softDelete(deleteTarget.dataset.delete);
});

function startEdit(token) {
  const [sheet, id] = token.split(":");
  const row = state[sheet].find(item => item.id === id);
  const form = document.querySelector(`form[data-sheet="${sheet}"]`);
  if (!row || !form) return;
  Object.entries(row).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value;
  });
  editing = { sheet, id };
  form.querySelector(".status-line").textContent = "Mode edit aktif. Simpan untuk memperbarui data.";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function softDelete(token) {
  const [sheet, id] = token.split(":");
  const row = state[sheet].find(item => item.id === id);
  if (!row) return;
  row.status_data = "deleted";
  row.updated_at = new Date().toISOString();
  row.updated_by = activeActor();
  audit("delete", sheet, row);
  saveData();
  await enqueueOrSend({ action: "delete", sheet, record: row });
  renderAll();
}

function renderReports() {
  const table = document.getElementById("reportTable");
  if (!table) return;
  const rows = [
    ["Seluruh keluarga", "Dashboard, anggota, aktivitas, agenda, keuangan", "Siap export PDF"],
    ["Per anggota", "Privasi ibadah default private, finansial mengikuti role", "Butuh login Google untuk produksi"],
    ["Daily Activity", "Timeline, status, prioritas, energi, emosi", "Realtime lokal"],
    ["Keuangan", "Arus kas, rasio menabung, dana darurat", "Format Rupiah aktif"],
    ["Al-Qur'an", "Tilawah, hafalan, murajaah, bookmark", "API mushaf perlu konfigurasi produksi"]
  ];
  table.innerHTML = `<thead><tr><th>Jenis</th><th>Isi</th><th>Status</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td><span class="pill green">${row[2]}</span></td></tr>`).join("")}</tbody>`;
}

function renderTimeline() {
  const rows = [...visibleRows("Daily_Activities"), ...visibleRows("Spiritual_Logs"), ...visibleRows("Quran_Progress")]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8);
  document.getElementById("recentActivity").innerHTML = rows.length ? rows.map(row => `<li><span class="time">${row.start_time || row.time || row.date || ""}</span><span><strong>${row.activity || row.program_name || row.surah || "Catatan"}</strong><br><span class="muted">${row.member_name || ""} - ${row.status || row.last_read || ""}</span></span></li>`).join("") : "<li>Belum ada aktivitas.</li>";
}

function renderFilters() {
  const select = document.getElementById("filterMember");
  if (!select) return;
  const current = select.value;
  const members = ["Semua", ...state.Family_Members.filter(row => row.status_data !== "deleted").map(row => row.member_name)];
  select.innerHTML = members.map(member => `<option>${member}</option>`).join("");
  select.value = members.includes(current) ? current : "Semua";
  ["filterMember", "filterPeriod", "filterCategory", "filterStatus", "globalSearch"].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.bound) {
      el.dataset.bound = "1";
      el.addEventListener("input", renderAll);
      el.addEventListener("change", renderAll);
    }
  });
}

function tickIslamicWidget() {
  const now = new Date();
  const greeting = now.getHours() < 11 ? "Selamat pagi" : now.getHours() < 15 ? "Selamat siang" : now.getHours() < 18 ? "Selamat sore" : "Selamat malam";
  const hijri = new Intl.DateTimeFormat("id-ID-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(now);
  const date = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
  const prayer = nextPrayer(now);
  const heading = document.getElementById("islamicHeader");
  const currentUser = document.getElementById("roleSelect")?.value || localStorage.getItem(sessionKey);
  const member = state.Family_Members.find(row => row.member_id === ACTIVE_ROLE_MEMBER[currentUser]);
  const displayName = dashboardUserName(currentUser, member);
  if (heading) heading.textContent = `${greeting}, ${displayName}. ${date}. Hijriah: ${hijri}. Sholat berikutnya ${prayer.name} dalam ${prayer.countdown}.`;
  const clock = document.getElementById("realTimeClock");
  const dateNode = document.getElementById("realTimeDate");
  const prayerName = document.getElementById("nextPrayerName");
  const prayerCountdown = document.getElementById("nextPrayerCountdown");
  if (clock) clock.textContent = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
  if (dateNode) dateNode.textContent = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  if (prayerName) prayerName.textContent = prayer.name;
  if (prayerCountdown) prayerCountdown.textContent = `Menuju adzan ${prayer.countdown}`;
  const widget = document.getElementById("islamicWidget");
  const location = prayerState.locationName || coordinateLabel(prayerState.latitude, prayerState.longitude);
  if (widget) widget.innerHTML = [
    ["Tanggal Masehi", date],
    ["Tanggal Hijriah", hijri],
    ["Lokasi", location],
    ["Metode", prayerState.methodLabel],
    ...currentPrayerTimes(),
    ["Sholat berikutnya", `${prayer.name} - ${prayer.countdown}`],
    ["Arah kiblat", `${Math.round(prayerState.qibla)} derajat dari utara`]
  ].map(row => `<tr><th>${row[0]}</th><td>${row[1]}</td></tr>`).join("");
  updateQiblaDisplays();
}

function nextPrayer(now) {
  const times = currentPrayerTimes();
  const current = now.getHours() * 60 + now.getMinutes();
  let found = times.map(([name, time]) => ({ name, mins: Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) })).find(item => item.mins > current);
  if (!found) found = { name: "Subuh", mins: Number(times[0][1].slice(0, 2)) * 60 + Number(times[0][1].slice(3)) + 1440 };
  const diff = found.mins - current;
  return { name: found.name, countdown: `${Math.floor(diff / 60)}j ${diff % 60}m` };
}

function renderPrayerGrid() {
  const grid = document.getElementById("prayerGrid");
  if (!grid) return;
  const next = nextPrayer(new Date()).name;
  grid.innerHTML = currentPrayerTimes().map(([name, time]) => `
    <div class="prayer-tile">
      <span>${name}</span>
      <strong>${time}</strong>
      <small class="${name === next ? "pill gold" : "muted"}">${name === next ? "Berikutnya" : prayerState.source}</small>
    </div>`).join("");
  const label = document.getElementById("prayerLocationLabel");
  if (label) label.textContent = prayerState.locationName || coordinateLabel(prayerState.latitude, prayerState.longitude);
  updateQiblaDisplays();
}
function renderQuranReader(force = false) {
  const panel = document.getElementById("mushafPanel");
  if (!panel) return;
  const mode = document.getElementById("quranMode")?.value || "juz";
  const surah = Number(document.getElementById("quranSurah")?.value || 1);
  const juz = Number(document.getElementById("quranJuz")?.value || 1);
  const qari = document.getElementById("quranQari")?.value || QURAN_QARIS[0][0];
  const size = document.getElementById("arabicSize")?.value || "normal";
  const cacheKey = `${mode}:${mode === "juz" ? juz : surah}:${qari}`;
  const cache = loadQuranCache();
  if (!force && cache[cacheKey]) {
    renderMushaf(cache[cacheKey], size, "cache offline");
    return;
  }
  panel.innerHTML = `<div class="loading-state">Memuat ${mode === "juz" ? `Juz ${juz}` : `Surah ${QURAN_SURAHS[surah - 1]}`}...</div>`;
  setQuranStatus("Mengambil mushaf, terjemahan, dan audio qari...");
  loadQuranSelection(mode, mode === "juz" ? juz : surah, qari)
    .then(data => {
      const updated = loadQuranCache();
      updated[cacheKey] = data;
      localStorage.setItem(quranCacheKey, JSON.stringify(updated));
      renderMushaf(data, size, "online");
    })
    .catch(error => {
      if (cache[cacheKey]) {
        renderMushaf(cache[cacheKey], size, "cache offline");
        return;
      }
      panel.innerHTML = `<div class="loading-state error">Belum bisa memuat mushaf. Periksa koneksi internet, lalu tekan Muat Bacaan.</div>`;
      setQuranStatus(error.message || "Gagal memuat Al-Quran digital.");
    });
}

async function loadQuranSelection(mode, reference, qari) {
  const baseUrl = "https://api.alquran.cloud/v1";
  const endpoint = mode === "juz" ? `juz/${reference}` : `surah/${reference}`;
  const [arabic, translation, audio] = await Promise.all([
    fetchJson(`${baseUrl}/${endpoint}/quran-uthmani`),
    fetchJson(`${baseUrl}/${endpoint}/id.indonesian`),
    fetchJson(`${baseUrl}/${endpoint}/${qari}`).catch(() => ({ data: { ayahs: [] } }))
  ]);
  const arabicAyahs = arabic.data.ayahs || [];
  const translationByNumber = new Map((translation.data.ayahs || []).map(ayah => [ayah.number, ayah.text]));
  const audioByNumber = new Map((audio.data.ayahs || []).map(ayah => [ayah.number, ayah.audio]));
  const title = mode === "juz" ? `Juz ${reference}` : `${reference}. ${QURAN_SURAHS[reference - 1]}`;
  return {
    mode,
    reference,
    qari,
    title,
    source: "AlQuran Cloud",
    ayahs: arabicAyahs.map(ayah => {
      const surahNumber = mode === "surah" ? reference : ayah.surah?.number;
      return {
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        surahNumber,
        surahName: ayah.surah?.englishName || QURAN_SURAHS[(surahNumber || 1) - 1],
        arabic: normalizeQuranArabic(ayah.text, surahNumber, ayah.numberInSurah),
        hasOpeningBismillah: shouldShowOpeningBismillah(surahNumber, ayah.numberInSurah),
        translation: translationByNumber.get(ayah.number) || "Terjemahan belum tersedia.",
        audio: audioByNumber.get(ayah.number) || ""
      };
    })
  };
}

function renderMushaf(data, size, sourceLabel) {
  const panel = document.getElementById("mushafPanel");
  if (!panel) return;
  const sizeClass = size === "xlarge" ? " arabic-xl" : size === "large" ? " arabic-lg" : "";
  const qariName = QURAN_QARIS.find(([value]) => value === data.qari)?.[1] || "Qari";
  panel.dataset.audioList = JSON.stringify(data.ayahs.map(ayah => ayah.audio).filter(Boolean));
  panel.innerHTML = `
    <div class="mushaf-head">
      <span class="pill gold">${escapeHtml(data.title)}</span>
      <span class="pill">${data.ayahs.length} ayat</span>
      <span class="pill green">${escapeHtml(qariName)}</span>
    </div>
    ${data.ayahs.map(ayah => `
      <article class="ayah-card">
        <div class="ayah-meta">
          <span>${escapeHtml(ayah.surahName || "Surah")} : ${ayah.numberInSurah}</span>
          <button class="icon-button mini" type="button" title="Putar ayat" data-play-ayah="${escapeHtml(ayah.audio)}">&#9834;</button>
        </div>
        ${ayah.hasOpeningBismillah ? `<div class="arabic-line bismillah-line${sizeClass}">${escapeHtml(BISMILLAH_ARABIC)}</div>` : ""}
        <div class="arabic-line${sizeClass}">${escapeHtml(ayah.arabic)} <span class="ayah-number">${ayah.numberInSurah}</span></div>
        <div class="translation-line">${escapeHtml(ayah.translation)}</div>
      </article>`).join("")}
    <div class="form-actions" style="justify-content:flex-start; flex-wrap:wrap">
      <button class="btn small" type="button">Bookmark</button>
      <button class="btn small" type="button">Catatan</button>
      <button class="btn small primary" type="button">Simpan Progres</button>
    </div>`;
  setQuranStatus(`${data.title} siap dibaca dari ${sourceLabel}. Audio: ${qariName}.`);
}

function colorizeTajwid(text) {
  return escapeHtml(text);
}

function shouldShowOpeningBismillah(surahNumber, ayahNumber) {
  return Number(ayahNumber) === 1 && ![1, 9].includes(Number(surahNumber));
}

function normalizeQuranArabic(text = "", surahNumber, ayahNumber) {
  if (!shouldShowOpeningBismillah(surahNumber, ayahNumber)) return text;
  return BISMILLAH_VARIANTS.reduce((clean, bismillah) => clean.replace(bismillah, "").trim(), text);
}

function playVisibleQuranAudio() {
  const panel = document.getElementById("mushafPanel");
  const list = JSON.parse(panel?.dataset.audioList || "[]");
  if (!list.length) return setQuranStatus("Muat bacaan terlebih dahulu agar audio tersedia.");
  playAudioList(list);
}

function playAyah(url) {
  if (!url) return setQuranStatus("Audio ayat ini belum tersedia dari qari terpilih.");
  playAudioList([url]);
}

function playAudioList(list, index = 0) {
  stopQuranAudio();
  quranAudio = new Audio(list[index]);
  quranAudio.addEventListener("ended", () => {
    if (list[index + 1]) playAudioList(list, index + 1);
  }, { once: true });
  quranAudio.play().catch(() => setQuranStatus("Browser memblokir audio. Tekan tombol Putar Audio sekali lagi."));
}

function stopQuranAudio() {
  if (!quranAudio) return;
  quranAudio.pause();
  quranAudio.currentTime = 0;
  quranAudio = null;
}

function setQuranStatus(message) {
  const status = document.getElementById("quranStatus");
  if (status) status.textContent = message;
}
function drawCharts() {
  drawProgressChart(document.getElementById("progressChart"));
  drawFinanceChart(document.getElementById("financeChart"));
}

function drawProgressChart(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const s = dashboardSummary(state);
  drawBarChart(ctx, canvas, [
    ["Spiritual", s.spiritualPercent, "#1840A0"],
    ["Emosional", s.emotionalPercent, "#F3B6C6"],
    ["Intelektual", s.intellectualPercent, "#D4AF37"],
    ["Daily", s.dailyDonePercent, "#24755F"],
    ["Tilawah", Math.min(100, s.quranPages * 5), "#10245E"]
  ], "%");
}

function drawFinanceChart(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const s = dashboardSummary(state);
  drawBarChart(ctx, canvas, [
    ["Pendapatan", s.income, "#1840A0"],
    ["Pengeluaran", s.expenses, "#B42318"],
    ["Tabungan", s.savings, "#24755F"],
    ["Investasi", s.investments, "#D4AF37"]
  ], "Rp");
}

function drawBarChart(ctx, canvas, rows, suffix) {
  const width = Math.max(280, canvas.clientWidth || canvas.width);
  const height = 260;
  const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(1, ...rows.map(row => row[1]));
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#ffffff");
  background.addColorStop(1, "#f7f8fc");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  const barLeft = Math.min(142, Math.max(104, width * 0.25));
  const barWidth = Math.max(24, width - barLeft - 116);
  ctx.textAlign = "left";
  ctx.font = "14px Segoe UI";
  rows.forEach((row, index) => {
    const y = 38 + index * 56;
    const fillWidth = Math.max(4, (row[1] / max) * barWidth);
    ctx.fillStyle = "#10245E";
    ctx.fillText(row[0], 8, y);
    ctx.fillStyle = "#D8DEEB";
    ctx.fillRect(barLeft + 4, y - 14, barWidth, 24);
    ctx.fillStyle = "#E8EDF7";
    ctx.fillRect(barLeft, y - 18, barWidth, 24);
    const fill = ctx.createLinearGradient(barLeft, y - 18, barLeft + fillWidth, y + 6);
    fill.addColorStop(0, row[2]);
    fill.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = fill;
    ctx.fillRect(barLeft, y - 18, fillWidth, 24);
    ctx.fillStyle = "rgba(16,36,94,.12)";
    ctx.fillRect(barLeft, y + 6, fillWidth, 8);
    ctx.fillStyle = "#172033";
    ctx.textAlign = "right";
    ctx.font = suffix === "Rp" ? "11px Segoe UI" : "12px Segoe UI";
    ctx.fillText(suffix === "Rp" ? rupiah(row[1]) : `${row[1]}%`, width - 4, y, 108);
    ctx.textAlign = "left";
    ctx.font = "14px Segoe UI";
  });
}

function bindTopActions() {
  document.getElementById("exportBtn").addEventListener("click", () => {
    document.getElementById("pdfPeriod").value = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date());
    document.getElementById("pdfDialog").showModal();
  });
  document.getElementById("printPdfBtn").addEventListener("click", event => {
    event.preventDefault();
    showView("dashboard");
    setTimeout(() => window.print(), 150);
  });
  document.getElementById("saveDriveBtn").addEventListener("click", async event => {
    event.preventDefault();
    await backupToDrive("pdf");
    document.getElementById("pdfDialog").close();
  });
  document.getElementById("adhanBtn")?.addEventListener("click", () => {
    const audio = new Audio();
    alert("Simulasi adzan aktif. Tambahkan file audio adzan berlisensi pada konfigurasi produksi.");
    audio.remove();
  });
}

async function backupToDrive(kind = "json") {
  const payload = {
    action: "backup",
    kind,
    fileName: pdfFileName(),
    reportFolder: config.driveReportFolderName,
    html: document.getElementById("dashboard").outerHTML,
    data: state
  };
  await enqueueOrSend(payload);
  alert(config.googleAppsScriptUrl ? "Permintaan backup dikirim ke Google Drive." : "Mode demo: backup masuk antrean lokal sampai URL Apps Script diisi.");
}

function pdfFileName() {
  const type = sanitizeText(document.getElementById("pdfType")?.value || "Laporan gabungan").replace(/\s+/g, "_");
  const period = sanitizeText(document.getElementById("pdfPeriod")?.value || "Periode").replace(/\s+/g, "_");
  const date = new Date().toISOString().slice(0, 10);
  return `The_Family_of_Muhammad_Rizki_${type}_${period}_${date}.pdf`;
}

async function enqueueOrSend(item) {
  const request = { ...item, requestId: item.requestId || createRequestId(), ownerUser: item.ownerUser || localStorage.getItem(sessionKey), sessionToken: localStorage.getItem(cloudSessionKey) };
  if (!config.googleAppsScriptUrl || !navigator.onLine) return enqueueLocal(request);
  if (!request.sessionToken) throw new Error("Sesi server belum aktif. Login ulang dengan internet sebelum menyimpan data.");
  try {
    const result = await sendCloudRequest(request);
    if (!result.ok) {
      const error = new Error(result.error || "Server menolak penyimpanan.");
      error.serverRejected = true;
      if (result.conflict) {
        error.message = "Konflik: data ini sudah diubah dari perangkat lain. Isian masih tersedia; data server sedang dimuat ulang.";
        error.conflict = true;
      }
      throw error;
    }
  } catch (error) {
    if (error.conflict || error.serverRejected) throw error;
    enqueueLocal(request);
    throw new Error(`Data tersimpan lokal dan menunggu sinkronisasi: ${error.message}`);
  }
}

async function syncQueue() {
  if (isSyncing || !config.googleAppsScriptUrl || !navigator.onLine || !localStorage.getItem(cloudSessionKey)) return;
  isSyncing = true;
  try {
    while (queue.length) {
      const user = localStorage.getItem(sessionKey);
      const memberId = ACTIVE_ROLE_MEMBER[user];
      const index = queue.findIndex(entry => {
        const ownerMatches = entry.ownerUser === user || user === "abi" || (!entry.ownerUser && (user === "ummi" || entry.record?.member_id === memberId));
        return ownerMatches && isModuleAllowed(user, moduleForLocalSheet(entry.sheet));
      });
      if (index < 0) break;
      const item = queue[index];
      const result = await sendCloudRequest({ ...item, sessionToken: localStorage.getItem(cloudSessionKey) });
      if (result.conflict) {
        queue[index] = { ...item, conflict: true, serverRecord: result.current };
        saveQueue();
        const status = document.getElementById("syncStatus");
        if (status) status.textContent = "Ada perubahan bersamaan. Pilih versi yang dipertahankan di panel Dashboard.";
        break;
      }
      if (!result.ok) throw new Error(result.error || "Sinkronisasi ditolak.");
      queue.splice(index, 1);
      saveQueue();
    }
  } catch (error) {
    const status = document.getElementById("syncStatus");
    if (status) status.textContent = `Antrean belum selesai: ${error.message}`;
  } finally {
    isSyncing = false;
  }
  renderAll();
}

function enqueueLocal(item) {
  const key = `${item.action}:${item.sheet}:${item.record?.id || item.requestId}`;
  const index = queue.findIndex(entry => `${entry.action}:${entry.sheet}:${entry.record?.id || entry.requestId}` === key);
  if (index >= 0) queue[index] = { ...queue[index], ...item };
  else if (queue.length < 500) queue.push(item);
  else throw new Error("Antrean luring mencapai batas 500 item. Sinkronkan dahulu sebelum menambah data.");
  saveQueue();
}

async function syncFamilyData() {
  if (isSyncing || !navigator.onLine || !localStorage.getItem(cloudSessionKey)) return;
  await syncQueue();
  isSyncing = true;
  try {
    const remote = { ...emptyData() };
    const syncSheets = SHEETS.filter(sheet => !["Audit_Logs", "App_Settings"].includes(sheet));
    let nextSheet = 0;
    const worker = async () => {
      while (true) {
        const sheet = syncSheets[nextSheet++];
        if (!sheet) return;
        let offset = 0;
        while (true) {
          const result = await sendCloudRequest({ action: "syncData", sheet, offset, limit: 25, sessionToken: localStorage.getItem(cloudSessionKey) });
          if (!result.ok && /tidak memiliki hak membaca/i.test(result.error || "")) break;
          if (!result.ok) throw new Error(result.error || "Data server tidak dapat dibaca.");
          remote[sheet].push(...(result.rows || []));
          if (result.done) break;
          offset = result.nextOffset;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, syncSheets.length) }, worker));
    if (localStorage.getItem(sessionKey) === "abi") {
      for (const sheet of ["Family_Members", "User_Roles"]) {
        if (remote[sheet].length || !(state[sheet] || []).length) continue;
        const initialRows = [...state[sheet]];
        for (const record of initialRows) {
          const result = await sendCloudRequest({ action: "upsert", sheet, record, sessionToken: localStorage.getItem(cloudSessionKey) });
          if (!result.ok) throw new Error(result.error || `Gagal menyiapkan ${sheet}.`);
        }
        remote[sheet] = initialRows;
      }
    }
    for (const sheet of SHEETS) {
        const user = localStorage.getItem(sessionKey);
        if (!isModuleAllowed(user, moduleForLocalSheet(sheet))) {
          state[sheet] = [];
          continue;
        }
        state[sheet] = remote[sheet];
    }
    const currentUser = localStorage.getItem(sessionKey);
    queue.forEach(item => {
      const row = item.record;
      if (!isModuleAllowed(currentUser, moduleForLocalSheet(item.sheet))) return;
      if (currentUser !== "abi" && currentUser !== "ummi" && item.ownerUser && item.ownerUser !== currentUser) return;
      if (currentUser !== "abi" && currentUser !== "ummi" && !item.ownerUser && row?.member_id !== ACTIVE_ROLE_MEMBER[currentUser]) return;
      if (!row || !state[item.sheet]) return;
      const index = state[item.sheet].findIndex(existing => existing.id === row.id);
      if (index >= 0) state[item.sheet][index] = row;
      else state[item.sheet].push(row);
    });
    saveData();
    const status = document.getElementById("syncStatus");
    if (status) status.textContent = "Data tersinkron dengan Google Sheets.";
    renderAll();
  } catch (error) {
    const status = document.getElementById("syncStatus");
    if (status) status.textContent = `Sinkronisasi belum selesai: ${error.message}`;
  } finally { isSyncing = false; }
}

function createRequestId() {
  return crypto.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function renderSyncConflicts() {
  const panel = document.getElementById("syncConflicts");
  if (!panel) return;
  const conflicts = queue.filter(item => item.conflict && item.record && item.serverRecord);
  panel.hidden = conflicts.length === 0;
  if (!conflicts.length) { panel.innerHTML = ""; return; }
  panel.innerHTML = `<h3>Perubahan dari perangkat lain</h3><p>Catatan ini berubah di dua perangkat. Pilih versi yang ingin dipertahankan.</p>${conflicts.map(item => `
    <div class="conflict-row">
      <div><strong>${escapeHtml(sheetForms[item.sheet]?.title || item.sheet)}</strong><span>${escapeHtml(item.record.member_name || "")} · ${escapeHtml(item.record.date || "")}</span></div>
      <div class="form-actions"><button class="btn small" data-conflict="server" data-request-id="${escapeHtml(item.requestId)}">Pakai versi server</button><button class="btn small primary" data-conflict="local" data-request-id="${escapeHtml(item.requestId)}">Pakai versi perangkat ini</button></div>
    </div>`).join("")}`;
}

function resolveQueuedConflict(event) {
  const button = event.target.closest("[data-conflict]");
  if (!button) return;
  const index = queue.findIndex(item => item.requestId === button.dataset.requestId && item.conflict);
  if (index < 0) return;
  const item = queue[index];
  if (button.dataset.conflict === "server") {
    queue.splice(index, 1);
    const rows = state[item.sheet] || [];
    state[item.sheet] = [...rows.filter(row => row.id !== item.record.id), item.serverRecord];
  } else {
    item.record.base_updated_at = item.serverRecord.updated_at;
    item.record.updated_at = new Date().toISOString();
    item.requestId = createRequestId();
    delete item.conflict;
    delete item.serverRecord;
    queue[index] = item;
    const rows = state[item.sheet] || [];
    state[item.sheet] = [...rows.filter(row => row.id !== item.record.id), item.record];
  }
  saveQueue();
  saveData();
  renderAll();
  syncFamilyData();
}

function moduleForLocalSheet(sheet) {
  if (["Family_Members", "User_Roles"].includes(sheet)) return "members";
  if (/^(Spiritual|Emotional|Intellectual)_/.test(sheet)) return "growth";
  if (sheet === "Daily_Activities") return "daily";
  if (["Income", "Expenses", "Savings", "Investments", "Financial_Goals"].includes(sheet)) return "finance";
  if (sheet === "Family_Agendas") return "agenda";
  if (sheet === "Quran_Progress") return "quran";
  if (sheet === "Prayer_Settings") return "prayer";
  if (sheet === "Notifications") return "notifications";
  return "reports";
}

function renderAccessModules() {
  const user = document.getElementById("accessUser")?.value;
  const account = familyAccess[user] || {};
  const enabled = document.querySelector('#accessForm [name="enabled"]');
  if (enabled) enabled.checked = account.enabled !== false;
  const available = navItems.filter(([id]) => !["dashboard", "settings", "reports"].includes(id));
  const container = document.getElementById("accessModules");
  const defaults = DEFAULT_ACCESS_MODULES[user] || [];
  if (container) container.innerHTML = available.map(([id, label]) => `<label class="access-module-option"><input type="checkbox" name="module" value="${id}" ${(account.modules || defaults).includes(id) ? "checked" : ""}><span>${label}</span></label>`).join("");
}

async function loadAccessSettings() {
  try {
    const result = await sendAuthRequest({ action: "accessGet", sessionToken: localStorage.getItem(cloudSessionKey) });
    if (result.ok) {
      familyAccess = { ...familyAccess, ...(result.access || {}) };
      localStorage.setItem(accessKey, JSON.stringify(familyAccess));
      restrictStateForUser(localStorage.getItem(sessionKey));
      renderNav(localStorage.getItem(sessionKey));
      renderAll();
      renderAccessModules();
    }
  } catch {}
}

async function handleAccessSave(event) {
  event.preventDefault();
  if (localStorage.getItem(sessionKey) !== "abi") return;
  const form = event.currentTarget;
  if (form.dataset.submitting === "true") return;
  form.dataset.submitting = "true";
  const button = form.querySelector('[type="submit"]');
  if (button) button.disabled = true;
  const user = form.elements.account.value;
  const account = { enabled: form.elements.enabled.checked, modules: [...form.querySelectorAll('[name="module"]:checked')].map(input => input.value) };
  try {
    const result = await sendAuthRequest({ action: "accessSet", user, account, sessionToken: localStorage.getItem(cloudSessionKey) });
    if (!result.ok) throw new Error(result.error || "Hak akses gagal disimpan.");
    familyAccess[user] = account;
    localStorage.setItem(accessKey, JSON.stringify(familyAccess));
    form.querySelector(".status-line").textContent = "Hak akses tersimpan.";
  } catch (error) { form.querySelector(".status-line").textContent = error.message; }
  finally { form.dataset.submitting = "false"; if (button) button.disabled = false; }
}

async function cleanDemoData(automatic = false) {
  const cleanupKey = `${config.familyId}:demo-cleanup:v1`;
  if (localStorage.getItem(sessionKey) !== "abi" || (!automatic && !confirm("Hapus hanya baris yang jelas ditandai sebagai data demo dari Google Sheets? Profil keluarga dan data lainnya tidak dihapus."))) return;
  if (automatic && localStorage.getItem(cleanupKey)) return;
  const status = document.querySelector("#settings .status-line");
  try {
    const result = await sendAuthRequest({ action: "cleanDemo", sessionToken: localStorage.getItem(cloudSessionKey) });
    if (!result.ok) throw new Error(result.error || "Pembersihan data demo gagal.");
    localStorage.setItem(cleanupKey, "1");
    status.textContent = `${result.deleted} baris demo dihapus. Data keluarga lainnya tetap utuh.`;
    for (const sheet of SHEETS) state[sheet] = (state[sheet] || []).filter(row => row.created_by !== "demo" && row.updated_by !== "demo");
    saveData();
    renderAll();
  } catch (error) { status.textContent = error.message; }
}

function visibleRows(sheet) {
  const role = document.getElementById("roleSelect")?.value || "super_admin";
  const memberId = ACTIVE_ROLE_MEMBER[role] || "mem_abi";
  return (state[sheet] || []).filter(row => row.status_data !== "deleted" && !(role !== "ummi" && !canAccess(role, "all") && row.privacy === "private" && row.member_id !== memberId));
}

function audit(action, sheet, record) {
  state.Audit_Logs.push(base("Audit_Logs", { event_type: action, sheet_name: sheet, member_name: activeActor(), payload_json: JSON.stringify(record).slice(0, 2000) }));
}

function findMemberId(name) {
  return state.Family_Members.find(row => row.member_name === name)?.member_id || "";
}

function activeActor() {
  return document.getElementById("roleSelect")?.selectedOptions[0]?.textContent || "Demo User";
}

function setDefaultDates() {
  document.querySelectorAll('input[type="date"]').forEach(input => { if (!input.value) input.value = new Date().toISOString().slice(0, 10); });
}

async function initPrayerLocation() {
  const label = document.getElementById("prayerLocationLabel");
  if (label) label.textContent = "Meminta izin lokasi...";
  if (!navigator.geolocation) {
    await refreshPrayerTimes(prayerState.latitude, prayerState.longitude, "Jakarta, Indonesia");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async position => {
      const { latitude, longitude } = position.coords;
      await refreshPrayerTimes(latitude, longitude, coordinateLabel(latitude, longitude));
    },
    async () => {
      await refreshPrayerTimes(prayerState.latitude, prayerState.longitude, prayerState.locationName || "Jakarta, Indonesia");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 1800000 }
  );
}

async function refreshPrayerTimes(latitude, longitude, locationName) {
  const date = new Date();
  const stamp = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${stamp}?latitude=${latitude}&longitude=${longitude}&method=20`;
  try {
    const response = await fetchJson(url);
    const timings = response.data.timings || {};
    prayerState = {
      latitude,
      longitude,
      locationName,
      methodLabel: response.data.meta?.method?.name || "Kementerian Agama RI",
      source: "GPS online",
      qibla: await fetchQibla(latitude, longitude),
      times: Object.entries(PRAYER_API_NAMES).map(([apiName, localName]) => [localName, cleanPrayerTime(timings[apiName])])
    };
  } catch {
    prayerState = {
      ...prayerState,
      latitude,
      longitude,
      locationName,
      source: "Fallback lokal",
      qibla: calculateQibla(latitude, longitude)
    };
  }
  localStorage.setItem(prayerLocationKey, JSON.stringify(prayerState));
  tickIslamicWidget();
  renderPrayerGrid();
}

async function fetchQibla(latitude, longitude) {
  try {
    const response = await fetchJson(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
    return Number(response.data.direction) || calculateQibla(latitude, longitude);
  } catch {
    return calculateQibla(latitude, longitude);
  }
}

function currentPrayerTimes() {
  return (prayerState.times && prayerState.times.length ? prayerState.times : PRAYER_TIMES)
    .filter(row => row[1] && /^\d{2}:\d{2}$/.test(row[1]));
}

function updateQiblaDisplays() {
  const degree = Math.round(prayerState.qibla);
  document.querySelectorAll(".compass-3d").forEach(compass => {
    const needle = compass.querySelector("i");
    const label = compass.querySelector("b");
    if (needle) needle.style.transform = `rotate(${degree}deg)`;
    if (label) label.innerHTML = `${degree}&deg;`;
  });
  const status = document.getElementById("qiblaStatus") || document.querySelector("#prayer .qibla-card .status-line");
  if (status) status.textContent = `Arah kiblat ${degree} derajat dari utara, berdasarkan ${prayerState.locationName || coordinateLabel(prayerState.latitude, prayerState.longitude)}.`;
}

function cleanPrayerTime(value = "") {
  const match = String(value).match(/\d{2}:\d{2}/);
  return match ? match[0] : "";
}

function coordinateLabel(latitude, longitude) {
  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
}

function calculateQibla(latitude, longitude) {
  const kaabaLat = 21.422487 * Math.PI / 180;
  const kaabaLon = 39.826206 * Math.PI / 180;
  const lat = latitude * Math.PI / 180;
  const lon = longitude * Math.PI / 180;
  const y = Math.sin(kaabaLon - lon);
  const x = Math.cos(lat) * Math.tan(kaabaLat) - Math.sin(lat) * Math.cos(kaabaLon - lon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function loadPrayerState() {
  try {
    const saved = JSON.parse(localStorage.getItem(prayerLocationKey) || "null");
    if (saved?.times?.length) return saved;
  } catch {}
  return {
    latitude: -6.2088,
    longitude: 106.8456,
    locationName: "Jakarta, Indonesia",
    methodLabel: "Kementerian Agama RI",
    source: "Default Jakarta",
    qibla: 295,
    times: PRAYER_TIMES
  };
}

function loadQuranCache() {
  try { return JSON.parse(localStorage.getItem(quranCacheKey) || "{}"); }
  catch { return {}; }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function loadData() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = { ...emptyData(), ...JSON.parse(saved) };
      let changed = false;
      for (const sheet of SHEETS.filter(name => !["Family_Members", "User_Roles"].includes(name))) {
        const cleanRows = (data[sheet] || []).filter(row => row.created_by !== "demo" && row.updated_by !== "demo");
        if (cleanRows.length !== (data[sheet] || []).length) changed = true;
        data[sheet] = cleanRows;
      }
      if (changed) localStorage.setItem(storageKey, JSON.stringify(data));
      return data;
    }
  } catch {}
  return { ...emptyData(), ...seedData(new Date()) };
}

function emptyData() {
  return Object.fromEntries(SHEETS.map(sheet => [sheet, []]));
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadQueue() {
  try {
    const items = JSON.parse(localStorage.getItem(queueKey) || "[]");
    const clean = items.filter(item => item.record?.created_by !== "demo" && item.record?.updated_by !== "demo");
    if (clean.length !== items.length) localStorage.setItem(queueKey, JSON.stringify(clean));
    return clean;
  }
  catch { return []; }
}

function saveQueue() {
  localStorage.setItem(queueKey, JSON.stringify(queue));
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "The_Family_of_Muhammad_Rizki_backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
}
