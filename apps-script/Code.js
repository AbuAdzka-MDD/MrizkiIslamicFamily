const APP_NAME = 'The Family of Muhammad Rizki';
const SPREADSHEET_NAME = 'The Family of Muhammad Rizki - Islamic Family Growth Dashboard';
const DRIVE_ROOT = 'The Family of Muhammad Rizki';

const COMMON_HEADERS = [
  'id', 'family_id', 'member_id', 'member_name', 'date', 'created_at',
  'updated_at', 'status_data', 'created_by', 'updated_by'
];

const SCHEMA = {
  Family_Members: [...COMMON_HEADERS, 'nickname', 'role', 'gender', 'birth_place', 'birth_date', 'hobby', 'school_or_work', 'skills', 'dream', 'personal_target', 'family_target', 'phone', 'email', 'motto', 'important_notes', 'emergency_contact', 'privacy'],
  User_Roles: [...COMMON_HEADERS, 'email', 'app_role', 'permissions', 'password_hash', 'password_salt', 'last_login_at'],
  Spiritual_Programs: [...COMMON_HEADERS, 'program_name', 'category', 'default_target', 'privacy_default'],
  Spiritual_Logs: [...COMMON_HEADERS, 'program_name', 'target', 'realization', 'status', 'time', 'duration_minutes', 'notes', 'obstacle', 'reflection', 'privacy'],
  Emotional_Programs: [...COMMON_HEADERS, 'activity', 'category', 'default_target'],
  Emotional_Logs: [...COMMON_HEADERS, 'activity', 'start_time', 'end_time', 'duration_minutes', 'emotion_before', 'emotion_after', 'lesson', 'gratitude_note', 'status'],
  Intellectual_Programs: [...COMMON_HEADERS, 'activity', 'category', 'default_target'],
  Intellectual_Logs: [...COMMON_HEADERS, 'activity', 'category', 'target', 'duration_minutes', 'material', 'progress', 'notes', 'attachment_url', 'next_step'],
  Daily_Activities: [...COMMON_HEADERS, 'activity', 'category', 'start_time', 'end_time', 'duration_minutes', 'priority', 'status', 'location', 'energy', 'emotion', 'notes', 'lesson', 'gratitude', 'tomorrow_plan'],
  Income: [...COMMON_HEADERS, 'category', 'description', 'amount', 'budget', 'due_date', 'payment_method', 'notes'],
  Expenses: [...COMMON_HEADERS, 'category', 'description', 'amount', 'budget', 'due_date', 'payment_method', 'notes'],
  Savings: [...COMMON_HEADERS, 'category', 'description', 'amount', 'budget', 'due_date', 'payment_method', 'notes'],
  Investments: [...COMMON_HEADERS, 'category', 'description', 'amount', 'budget', 'due_date', 'payment_method', 'notes'],
  Financial_Goals: [...COMMON_HEADERS, 'goal_name', 'target_amount', 'current_amount', 'target_date', 'monthly_saving', 'notes'],
  Family_Agendas: [...COMMON_HEADERS, 'agenda_title', 'category', 'status', 'notes'],
  Quran_Progress: [...COMMON_HEADERS, 'surah', 'juz', 'last_read', 'pages_read', 'verses_memorized', 'murajaah', 'qari', 'notes', 'bookmark'],
  Prayer_Settings: [...COMMON_HEADERS, 'location', 'method', 'subuh', 'syuruq', 'zuhur', 'asar', 'magrib', 'isya', 'qibla_degree', 'manual_adjustment'],
  Notifications: [...COMMON_HEADERS, 'notification_type', 'enabled', 'time', 'sound', 'vibration', 'frequency', 'notes'],
  App_Settings: [...COMMON_HEADERS, 'setting_key', 'setting_value'],
  Audit_Logs: [...COMMON_HEADERS, 'event_type', 'sheet_name', 'payload_json']
};

function doGet(e) {
  const ss = getSpreadsheet_();
  const payload = { ok: true, appName: APP_NAME, spreadsheetId: ss.getId(), summary: buildSummary_(ss) };
  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(payload);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const ss = getSpreadsheet_();
    if (body.action === 'upsert') return json_(upsert_(ss, body.sheet, body.record));
    if (body.action === 'delete') return json_(softDelete_(ss, body.sheet, body.record));
    if (body.action === 'backup') return json_(createDriveBackup_(body));
    if (body.action === 'init') return json_({ ok: true, spreadsheetId: ss.getId(), folderId: getReportFolder_().getId() });
    return json_({ ok: false, error: 'Unknown action' });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function getSpreadsheet_() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  const ss = files.hasNext() ? SpreadsheetApp.open(files.next()) : SpreadsheetApp.create(SPREADSHEET_NAME);
  ensureSheets_(ss);
  ensureDriveStructure_();
  return ss;
}

function ensureSheets_(ss) {
  Object.keys(SCHEMA).forEach(name => {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    const headers = SCHEMA[name];
    const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (current.join('|') !== headers.join('|')) {
      sheet.clear();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
    }
  });
}

function upsert_(ss, sheetName, record) {
  validateSheet_(sheetName);
  const sheet = ss.getSheetByName(sheetName);
  const headers = SCHEMA[sheetName];
  const idCol = 1;
  const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues().flat() : [];
  const id = sanitize_(record.id || Utilities.getUuid());
  record.id = id;
  record.updated_at = new Date().toISOString();
  const row = headers.map(header => sanitize_(record[header]));
  const found = ids.indexOf(id);
  if (found >= 0) sheet.getRange(found + 2, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
  audit_(ss, record.family_id, record.member_id, record.member_name, 'upsert', sheetName, record);
  return { ok: true, id };
}

function softDelete_(ss, sheetName, record) {
  validateSheet_(sheetName);
  record.status_data = 'deleted';
  return upsert_(ss, sheetName, record);
}

function audit_(ss, familyId, memberId, memberName, eventType, sheetName, payload) {
  const sheet = ss.getSheetByName('Audit_Logs');
  const now = new Date().toISOString();
  sheet.appendRow([
    Utilities.getUuid(), familyId || '', memberId || '', memberName || '', now.slice(0, 10),
    now, now, 'active', memberName || 'api', memberName || 'api',
    eventType, sheetName, JSON.stringify(payload).slice(0, 45000)
  ]);
}

function createDriveBackup_(body) {
  const folder = getReportFolder_();
  const now = new Date();
  const year = String(now.getFullYear());
  const month = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM-MMMM');
  const type = body.kind === 'pdf' ? 'PDF Requests' : 'JSON Backup';
  const target = getOrCreateFolder_(getOrCreateFolder_(getOrCreateFolder_(folder, year), month), type);
  const fileName = body.fileName || ('backup-' + now.toISOString() + '.json');
  const content = body.kind === 'pdf'
    ? HtmlService.createHtmlOutput(body.html || '').getContent()
    : JSON.stringify(body.data || {}, null, 2);
  const mime = body.kind === 'pdf' ? MimeType.HTML : MimeType.JSON;
  const file = target.createFile(fileName.replace(/\.pdf$/i, '.html'), content, mime);
  return { ok: true, fileId: file.getId(), url: file.getUrl() };
}

function ensureDriveStructure_() {
  getReportFolder_();
}

function getReportFolder_() {
  const root = getOrCreateFolder_(DriveApp.getRootFolder(), DRIVE_ROOT);
  return getOrCreateFolder_(root, 'Laporan PDF');
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function buildSummary_(ss) {
  const data = {};
  Object.keys(SCHEMA).forEach(name => data[name] = readRows_(ss, name));
  const sum = (sheet, key) => data[sheet].filter(row => row.status_data !== 'deleted').reduce((total, row) => total + Number(row[key] || 0), 0);
  const income = sum('Income', 'amount');
  const expenses = sum('Expenses', 'amount');
  const savings = sum('Savings', 'amount');
  const investments = sum('Investments', 'amount');
  return {
    members: data.Family_Members.filter(row => row.status_data !== 'deleted').length,
    income,
    expenses,
    savings,
    investments,
    cashflow: income - expenses,
    updatedAt: new Date().toISOString()
  };
}

function readRows_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const headers = values.shift();
  return values.map(row => Object.fromEntries(headers.map((header, i) => [header, row[i]])));
}

function validateSheet_(sheetName) {
  if (!SCHEMA[sheetName]) throw new Error('Invalid sheet: ' + sheetName);
}

function sanitize_(value) {
  return String(value == null ? '' : value).replace(/[<>]/g, '').trim();
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
