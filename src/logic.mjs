export const SHEETS = [
  "Family_Members",
  "User_Roles",
  "Spiritual_Programs",
  "Spiritual_Logs",
  "Emotional_Programs",
  "Emotional_Logs",
  "Intellectual_Programs",
  "Intellectual_Logs",
  "Daily_Activities",
  "Income",
  "Expenses",
  "Savings",
  "Investments",
  "Financial_Goals",
  "Family_Agendas",
  "Quran_Progress",
  "Prayer_Settings",
  "Notifications",
  "App_Settings",
  "Audit_Logs"
];

export const ROLE_PERMISSIONS = {
  abi: ["all"],
  ummi: ["members:read", "members:write", "programs:read", "reports:family", "settings:read", "activity:write", "agenda:write", "quran:write"],
  alif_aslam: ["self:write", "activity:write", "reports:permitted", "family:permitted", "quran:write"],
  muslim_ihsan: ["self:write", "activity:write", "reports:permitted", "family:permitted", "quran:write"],
  m_bilal_albana: ["self:write", "activity:write", "reports:permitted", "family:permitted", "quran:write"],
  fajri_rahman: ["self:write", "activity:write", "reports:permitted", "family:permitted", "quran:write"],
  adzkadina_salsabila: ["self:assisted", "family:permitted"],
  super_admin: ["all"],
  parent: ["members:read", "members:write", "activity:write", "reports:family", "agenda:write", "quran:write"],
  adult: ["self:write", "activity:write", "reports:shared", "quran:write"],
  teen: ["self:write", "activity:write", "quran:write"],
  child: ["self:assisted"]
};

export function createId(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function sanitizeText(value) {
  return String(value ?? "").replace(/[<>]/g, "").trim();
}

export function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) end += 24 * 60;
  return end - start;
}

export function canAccess(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes("all") || permissions.includes(permission);
}

export function isPrivateRecord(record, currentMemberId, role) {
  if (canAccess(role, "all")) return false;
  return record.privacy === "private" && record.member_id !== currentMemberId;
}

export function financialSummary(data) {
  const income = sum(data.Income, "amount");
  const expenses = sum(data.Expenses, "amount");
  const savings = sum(data.Savings, "amount");
  const investments = sum(data.Investments, "amount");
  const emergency = (data.Savings || [])
    .filter(row => /darurat/i.test(row.category || row.goal_name || ""))
    .reduce((total, row) => total + Number(row.amount || row.current_amount || 0), 0);
  const monthlyAverageExpense = expenses || 1;
  return {
    income,
    expenses,
    savings,
    investments,
    cashflow: income - expenses,
    savingRatio: income ? Math.round(((savings + investments) / income) * 100) : 0,
    emergencyMonths: Number((emergency / monthlyAverageExpense).toFixed(1))
  };
}

export function dashboardSummary(data) {
  const members = (data.Family_Members || []).filter(row => row.status_data !== "deleted");
  const daily = (data.Daily_Activities || []).filter(row => row.status_data !== "deleted");
  const spiritual = (data.Spiritual_Logs || []).filter(row => row.status_data !== "deleted");
  const emotional = (data.Emotional_Logs || []).filter(row => row.status_data !== "deleted");
  const intellectual = (data.Intellectual_Logs || []).filter(row => row.status_data !== "deleted");
  const quran = (data.Quran_Progress || []).filter(row => row.status_data !== "deleted");
  const goals = (data.Financial_Goals || []).filter(row => row.status_data !== "deleted");
  const finance = financialSummary(data);
  const doneDaily = daily.filter(row => /selesai/i.test(row.status || "")).length;
  const doneSpiritual = spiritual.filter(row => /selesai|sudah/i.test(row.status || row.realization || "")).length;
  const doneEmotional = emotional.filter(row => /selesai/i.test(row.status || "")).length;
  const doneIntellectual = intellectual.filter(row => Number(row.progress || 0) >= 100 || /selesai/i.test(row.status || "")).length;
  const reachedGoals = goals.filter(row => Number(row.current_amount || 0) >= Number(row.target_amount || 1)).length;
  return {
    members: members.length,
    dailyTotal: daily.length,
    dailyDonePercent: percent(doneDaily, daily.length),
    spiritualPercent: percent(doneSpiritual, spiritual.length),
    emotionalPercent: percent(doneEmotional, emotional.length),
    intellectualPercent: percent(doneIntellectual, intellectual.length),
    goalsReached: reachedGoals,
    goalsOpen: Math.max(0, goals.length - reachedGoals),
    agendas: (data.Family_Agendas || []).filter(row => row.status_data !== "deleted").length,
    quranPages: quran.reduce((total, row) => total + Number(row.pages_read || 0), 0),
    quranMemorized: quran.reduce((total, row) => total + Number(row.verses_memorized || 0), 0),
    ...finance
  };
}

export function percent(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

export function sum(rows = [], key) {
  return rows
    .filter(row => row.status_data !== "deleted")
    .reduce((total, row) => total + Number(row[key] || 0), 0);
}

export function seedData(now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return {
    Family_Members: [
      base("Family_Members", { id: "mem_abi", member_id: "mem_abi", member_name: "Kepala Keluarga", nickname: "Abi", role: "Kepala Keluarga (Abi)", gender: "Laki-laki", date, privacy: "shared", family_target: "Mengelola keluarga, anggota keluarga, program, laporan, dan pengaturan." }),
      base("Family_Members", { id: "mem_ummi", member_id: "mem_ummi", member_name: "Istri", nickname: "Ummi", role: "Istri (Ummi)", gender: "Perempuan", date, privacy: "shared", family_target: "Mengelola keluarga, anggota keluarga, dan melihat program dan laporan." }),
      base("Family_Members", { id: "mem_alif_aslam", member_id: "mem_alif_aslam", member_name: "Alif Aslam", nickname: "Alif", role: "Anak Pertama", gender: "Laki-laki", date, privacy: "private", family_target: "Mengisi dan melihat data pribadi serta data keluarga yang diizinkan." }),
      base("Family_Members", { id: "mem_muslim_ihsan", member_id: "mem_muslim_ihsan", member_name: "Muslim Ihsan", nickname: "Ihsan", role: "Anak Kedua", gender: "Laki-laki", date, privacy: "private", family_target: "Mengisi dan melihat data pribadi serta data keluarga yang diizinkan." }),
      base("Family_Members", { id: "mem_m_bilal_albana", member_id: "mem_m_bilal_albana", member_name: "M. Bilal Albana", nickname: "Bilal", role: "Anak Ketiga", gender: "Laki-laki", date, privacy: "private", family_target: "Mengisi dan melihat data pribadi serta data keluarga yang diizinkan." }),
      base("Family_Members", { id: "mem_fajri_rahman", member_id: "mem_fajri_rahman", member_name: "Fajri Rahman", nickname: "Fajri", role: "Anak Keempat", gender: "Laki-laki", date, privacy: "private", family_target: "Mengisi dan melihat data pribadi serta data keluarga yang diizinkan." }),
      base("Family_Members", { id: "mem_adzkadina_salsabila", member_id: "mem_adzkadina_salsabila", member_name: "Adzkadina Salsabila", nickname: "Adzkadina", role: "Anak Kelima", gender: "Perempuan", date, privacy: "parent", family_target: "Akun pendamping yang dikelola orangtua (Abi dan Ummi)." })
    ],
    User_Roles: [
      base("User_Roles", { id: "role_abi", member_id: "mem_abi", member_name: "Kepala Keluarga", email: "mrizki.markazdigital@gmail.com", app_role: "abi", permissions: "Mengelola keluarga, anggota keluarga, program, laporan, dan pengaturan", date }),
      base("User_Roles", { id: "role_ummi", member_id: "mem_ummi", member_name: "Istri", email: "", app_role: "ummi", permissions: "Mengelola keluarga, anggota keluarga, dan melihat program dan laporan", date }),
      base("User_Roles", { id: "role_alif_aslam", member_id: "mem_alif_aslam", member_name: "Alif Aslam", email: "", app_role: "alif_aslam", permissions: "Mengisi dan melihat data pribadi serta data keluarga yang diizinkan", date }),
      base("User_Roles", { id: "role_muslim_ihsan", member_id: "mem_muslim_ihsan", member_name: "Muslim Ihsan", email: "", app_role: "muslim_ihsan", permissions: "Mengisi dan melihat data pribadi serta data keluarga yang diizinkan", date }),
      base("User_Roles", { id: "role_m_bilal_albana", member_id: "mem_m_bilal_albana", member_name: "M. Bilal Albana", email: "", app_role: "m_bilal_albana", permissions: "Mengisi dan melihat data pribadi serta data keluarga yang diizinkan", date }),
      base("User_Roles", { id: "role_fajri_rahman", member_id: "mem_fajri_rahman", member_name: "Fajri Rahman", email: "", app_role: "fajri_rahman", permissions: "Mengisi dan melihat data pribadi serta data keluarga yang diizinkan", date }),
      base("User_Roles", { id: "role_adzkadina_salsabila", member_id: "mem_adzkadina_salsabila", member_name: "Adzkadina Salsabila", email: "", app_role: "adzkadina_salsabila", permissions: "Akun pendamping yang dikelola orangtua (Abi dan Ummi)", date })
    ],
    Spiritual_Programs: [],
    Spiritual_Logs: [
      base("Spiritual_Logs", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, program_name: "Sholat Subuh", target: "Tepat waktu", realization: "Sudah", status: "Selesai", privacy: "private" })
    ],
    Emotional_Programs: [],
    Emotional_Logs: [
      base("Emotional_Logs", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, activity: "Quality time keluarga", duration_minutes: 45, status: "Selesai", gratitude_note: "Alhamdulillah keluarga sehat." })
    ],
    Intellectual_Programs: [],
    Intellectual_Logs: [
      base("Intellectual_Logs", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, activity: "Membaca buku", category: "Pengembangan diri", progress: 65 })
    ],
    Daily_Activities: [
      base("Daily_Activities", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, activity: "Evaluasi harian", category: "Keluarga", start_time: "21:00", end_time: "21:30", duration_minutes: 30, priority: "Tinggi", status: "Selesai" })
    ],
    Income: [base("Income", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, category: "Pendapatan rutin", description: "Contoh pendapatan", amount: 10000000 })],
    Expenses: [base("Expenses", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, category: "Rumah tangga", description: "Contoh pengeluaran", amount: 3500000 })],
    Savings: [base("Savings", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, category: "Dana darurat", amount: 2500000 })],
    Investments: [base("Investments", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, category: "Investasi syariah", amount: 1000000 })],
    Financial_Goals: [base("Financial_Goals", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, goal_name: "Dana Darurat", target_amount: 30000000, current_amount: 2500000 })],
    Family_Agendas: [base("Family_Agendas", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, agenda_title: "Kajian keluarga", status: "Direncanakan" })],
    Quran_Progress: [base("Quran_Progress", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, surah: "Al-Fatihah", pages_read: 2, verses_memorized: 7, last_read: "Al-Fatihah: 7" })],
    Prayer_Settings: [base("Prayer_Settings", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, location: "Jakarta, Indonesia", method: "Kementerian Agama RI", qibla_degree: 295 })],
    Notifications: [],
    App_Settings: [base("App_Settings", { member_id: "mem_abi", member_name: "Kepala Keluarga", date, setting_key: "demo_mode", setting_value: "true" })],
    Audit_Logs: []
  };
}

export function base(sheet, values = {}) {
  const now = new Date().toISOString();
  return {
    id: values.id || createId(sheet.toLowerCase()),
    family_id: "family_muhammad_rizki",
    member_id: values.member_id || "",
    member_name: values.member_name || "",
    date: values.date || now.slice(0, 10),
    created_at: values.created_at || now,
    updated_at: values.updated_at || now,
    status_data: values.status_data || "active",
    created_by: values.created_by || "demo",
    updated_by: values.updated_by || "demo",
    ...values
  };
}
