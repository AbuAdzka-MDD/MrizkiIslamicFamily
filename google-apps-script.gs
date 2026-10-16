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
  const action = e && e.parameter && e.parameter.action;
  if (action === 'authResult') return authResult_(e.parameter);
  const ss = getSpreadsheet_();
  const payload = { ok: true, appName: APP_NAME, spreadsheetId: ss.getId(), summary: buildSummary_(ss) };
  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(payload);
}

function doPost(e) {
  let requestId = '';
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    requestId = String(body.requestId || '');
    if (['authLogin', 'authProvision', 'authSetPassword', 'accessGet', 'accessSet', 'cleanDemo', 'profilePhotoGet', 'profilePhotoSet'].includes(body.action)) {
      const handlers = {
        authLogin: authLogin_, authProvision: authProvision_,
        authSetPassword: authSetPassword_, accessGet: accessGet_, accessSet: accessSet_, cleanDemo: cleanDemo_,
        profilePhotoGet: profilePhotoGet_, profilePhotoSet: profilePhotoSet_
      };
      const result = handlers[body.action](body);
      if (body.requestId) CacheService.getScriptCache().put('auth:' + body.requestId, JSON.stringify(result), 45);
      return json_(result);
    }
    const user = verifySessionToken_(body.sessionToken);
    if (!user) {
      if (body.requestId) CacheService.getScriptCache().put('write:' + body.requestId, JSON.stringify({ ok: false, error: 'Sesi tidak sah atau telah berakhir. Silakan login kembali.' }), 45);
      return json_({ ok: false, error: 'Sesi tidak sah atau telah berakhir. Silakan login kembali.' });
    }
    if (body.requestId) {
      const prior = CacheService.getScriptCache().get('write:' + body.requestId);
      if (prior) return json_(JSON.parse(prior));
    }
    const ss = getSpreadsheet_();
    let result;
    if (body.action === 'upsert') {
      result = canWrite_(user, body.sheet, body.record) ? upsert_(ss, body.sheet, body.record) : { ok: false, error: 'Akun tidak memiliki hak tulis untuk data ini.' };
    } else if (body.action === 'delete') {
      result = canWrite_(user, body.sheet) ? softDelete_(ss, body.sheet, body.record) : { ok: false, error: 'Akun tidak memiliki hak tulis untuk data ini.' };
    } else if (body.action === 'syncData') {
      validateSheet_(body.sheet);
      const access = JSON.parse(PropertiesService.getScriptProperties().getProperty('FAMILY_ACCESS') || '{}');
      const permissions = effectiveAccess_(user, access);
      if (body.sheet === 'Audit_Logs' || body.sheet === 'App_Settings' || (body.sheet === 'User_Roles' && user !== 'abi') || !permissions.enabled || !permissions.modules.includes(moduleForSheet_(body.sheet))) {
        result = { ok: false, error: 'Akun tidak memiliki hak membaca data ini.' };
      } else {
      const limit = Math.min(25, Math.max(1, Number(body.limit || 25)));
      const offset = Math.max(0, Number(body.offset || 0));
      let rows = readRows_(ss, body.sheet);
      if (user !== 'abi' && user !== 'ummi') {
        const memberId = 'mem_' + user;
        rows = rows.filter(row => row.privacy !== 'private' || row.member_id === memberId);
      }
      const page = rows.slice(offset, offset + limit);
      result = { ok: true, rows: page, nextOffset: offset + page.length, done: offset + page.length >= rows.length };
      while (page.length > 1 && Utilities.newBlob(JSON.stringify(result)).getBytes().length > 85000) {
        page.pop();
        result.nextOffset = offset + page.length;
        result.done = result.nextOffset >= rows.length;
      }
      if (Utilities.newBlob(JSON.stringify(result)).getBytes().length > 85000) result = { ok: false, error: 'Satu baris data terlalu besar untuk sinkronisasi. Ringkas catatan pada data tersebut.' };
      }
    } else if (body.action === 'backup') result = user === 'abi' ? createDriveBackup_(body) : { ok: false, error: 'Hanya Abi yang dapat membuat backup.' };
    else if (body.action === 'init') result = user === 'abi' ? { ok: true, spreadsheetId: ss.getId(), folderId: getReportFolder_().getId() } : { ok: false, error: 'Hanya Abi yang dapat mengatur koneksi.' };
    else return json_({ ok: false, error: 'Unknown action' });
    if (body.requestId) CacheService.getScriptCache().put('write:' + body.requestId, JSON.stringify(result), result.ok ? 21600 : 45);
    return json_(result);
  } catch (error) {
    const result = { ok: false, error: String(error) };
    if (requestId) CacheService.getScriptCache().put('write:' + requestId, JSON.stringify(result), 45);
    return json_(result);
  }
}

function authProvision_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('FAMILY_AUTH')) return { ok: true, exists: true };
    const bootstrapKey = props.getProperty('FAMILY_BOOTSTRAP_KEY');
    if (!bootstrapKey || typeof body.bootstrapKey !== 'string' || body.bootstrapKey !== bootstrapKey) return { ok: false, error: 'Kode aktivasi awal tidak sesuai.' };
    if (!validAuthRecords_(body.users, true) || !body.users.abi) return { ok: false, error: 'Invalid password records' };
    props.setProperty('FAMILY_AUTH', JSON.stringify(body.users));
    props.deleteProperty('FAMILY_BOOTSTRAP_KEY');
    return { ok: true, created: true, sessionToken: issueSessionToken_('abi', body.users.abi) };
  } finally {
    lock.releaseLock();
  }
}

function createFamilyBootstrapKey() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('FAMILY_AUTH')) throw new Error('FAMILY_AUTH sudah ada. Tidak perlu aktivasi awal.');
  let key = props.getProperty('FAMILY_BOOTSTRAP_KEY');
  if (!key) {
    key = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('FAMILY_BOOTSTRAP_KEY', key);
  }
  Logger.log('Kode aktivasi satu kali: ' + key);
  return key;
}

function authLogin_(body) {
  const records = JSON.parse(PropertiesService.getScriptProperties().getProperty('FAMILY_AUTH') || '{}');
  const access = JSON.parse(PropertiesService.getScriptProperties().getProperty('FAMILY_ACCESS') || '{}');
  const record = records[body.user];
  if (access[body.user] && access[body.user].enabled === false) return { ok: false, error: 'Akun ini dinonaktifkan oleh Abi.' };
  const ok = Boolean(record && verifyPassword_(record, body.password));
  return { ok, error: record ? 'Password belum sesuai.' : 'Akun belum disiapkan oleh Abi.', sessionToken: ok ? issueSessionToken_(body.user, record) : undefined };
}

function authSetPassword_(body) {
  if (verifySessionToken_(body.sessionToken) !== 'abi') return { ok: false, error: 'Hanya Abi yang dapat mengubah password.' };
  if (!/^(abi|ummi|alif_aslam|muslim_ihsan|m_bilal_albana|fajri_rahman|adzkadina_salsabila)$/.test(body.user || '') || typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) return { ok: false, error: 'Pengguna atau panjang password tidak valid.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    const records = JSON.parse(props.getProperty('FAMILY_AUTH') || '{}');
    const salt = Utilities.getUuid() + Utilities.getUuid();
    records[body.user] = { salt: salt, hash: hashPassword_(salt, body.password) };
    props.setProperty('FAMILY_AUTH', JSON.stringify(records));
    return { ok: true, sessionToken: issueSessionToken_('abi', records.abi) };
  } finally { lock.releaseLock(); }
}

function accessGet_(body) {
  const user = verifySessionToken_(body.sessionToken);
  if (!user) return { ok: false, error: 'Sesi tidak sah.' };
  const access = JSON.parse(PropertiesService.getScriptProperties().getProperty('FAMILY_ACCESS') || '{}');
  const visible = user === 'abi' ? ['ummi', 'alif_aslam', 'muslim_ihsan', 'm_bilal_albana', 'fajri_rahman', 'adzkadina_salsabila'] : [user];
  return { ok: true, access: Object.fromEntries(visible.map(account => [account, effectiveAccess_(account, access)])) };
}

function accessSet_(body) {
  if (verifySessionToken_(body.sessionToken) !== 'abi') return { ok: false, error: 'Hanya Abi yang dapat mengatur hak akses.' };
  const allowedUsers = ['ummi', 'alif_aslam', 'muslim_ihsan', 'm_bilal_albana', 'fajri_rahman', 'adzkadina_salsabila'];
  const allowedModules = ['members', 'growth', 'daily', 'finance', 'agenda', 'quran', 'prayer', 'notifications'];
  if (!allowedUsers.includes(body.user) || !body.account || !Array.isArray(body.account.modules) || body.account.modules.some(module => !allowedModules.includes(module))) return { ok: false, error: 'Pengaturan hak akses tidak valid.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    const access = JSON.parse(props.getProperty('FAMILY_ACCESS') || '{}');
    access[body.user] = { enabled: body.account.enabled === true, modules: [...new Set(body.account.modules)] };
    props.setProperty('FAMILY_ACCESS', JSON.stringify(access));
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function cleanDemo_(body) {
  if (verifySessionToken_(body.sessionToken) !== 'abi') return { ok: false, error: 'Hanya Abi yang dapat membersihkan data demo.' };
  const ss = getSpreadsheet_();
  let deleted = 0;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    Object.keys(SCHEMA).forEach(name => {
      if (['Family_Members', 'User_Roles'].includes(name)) return;
      const sheet = ss.getSheetByName(name);
      if (!sheet || sheet.getLastRow() < 2) return;
      const headers = SCHEMA[name];
      const createdBy = headers.indexOf('created_by') + 1;
      const updatedBy = headers.indexOf('updated_by') + 1;
      for (let row = sheet.getLastRow(); row >= 2; row--) {
        const author = String(sheet.getRange(row, createdBy).getValue());
        const editor = String(sheet.getRange(row, updatedBy).getValue());
        if (author === 'demo' || editor === 'demo') { sheet.deleteRow(row); deleted++; }
      }
    });
  } finally { lock.releaseLock(); }
  return { ok: true, deleted: deleted };
}

function canWrite_(user, sheet, record) {
  const access = JSON.parse(PropertiesService.getScriptProperties().getProperty('FAMILY_ACCESS') || '{}');
  const permissions = effectiveAccess_(user, access);
  if (!permissions.enabled || !permissions.modules.includes(moduleForSheet_(sheet))) return false;
  if (user === 'abi') return true;
  if (user === 'ummi') return ['Family_Members', 'User_Roles', 'Family_Agendas', 'Notifications'].includes(sheet);
  if (user === 'adzkadina_salsabila') return false;
  if (!record || record.member_id !== 'mem_' + user) return false;
  return ['Spiritual_Logs', 'Emotional_Logs', 'Intellectual_Logs', 'Daily_Activities', 'Quran_Progress'].includes(sheet);
}

function effectiveAccess_(user, configured) {
  if (user === 'abi') return { enabled: true, modules: ['members', 'growth', 'daily', 'finance', 'agenda', 'quran', 'prayer', 'reports', 'notifications'] };
  const defaults = user === 'ummi'
    ? ['members', 'growth', 'agenda', 'quran', 'prayer', 'notifications']
    : ['growth', 'daily', 'quran', 'prayer'];
  const saved = configured[user];
  return saved ? { enabled: saved.enabled === true, modules: saved.modules || defaults } : { enabled: true, modules: defaults };
}

function moduleForSheet_(sheet) {
  if (sheet === 'Family_Members' || sheet === 'User_Roles') return 'members';
  if (sheet.indexOf('Spiritual_') === 0 || sheet.indexOf('Emotional_') === 0 || sheet.indexOf('Intellectual_') === 0) return 'growth';
  if (sheet === 'Daily_Activities') return 'daily';
  if (['Income', 'Expenses', 'Savings', 'Investments', 'Financial_Goals'].includes(sheet)) return 'finance';
  if (sheet === 'Family_Agendas') return 'agenda';
  if (sheet === 'Quran_Progress') return 'quran';
  if (sheet === 'Prayer_Settings') return 'prayer';
  if (sheet === 'Notifications') return 'notifications';
  return 'reports';
}

function issueSessionToken_(user, record) {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('FAMILY_SESSION_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('FAMILY_SESSION_SECRET', secret);
  }
  const payload = user + '|' + (Date.now() + 90 * 24 * 60 * 60 * 1000) + '|' + record.hash;
  const signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret));
  return Utilities.base64EncodeWebSafe(payload) + '.' + signature;
}

function verifySessionToken_(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    const payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
    const fields = payload.split('|');
    if (fields.length !== 3 || Number(fields[1]) < Date.now()) return null;
    const user = fields[0];
    const access = JSON.parse(PropertiesService.getScriptProperties().getProperty('FAMILY_ACCESS') || '{}');
    if (access[user] && access[user].enabled === false) return null;
    const auth = JSON.parse(PropertiesService.getScriptProperties().getProperty('FAMILY_AUTH') || '{}');
    const record = auth[user];
    const secret = PropertiesService.getScriptProperties().getProperty('FAMILY_SESSION_SECRET');
    if (!record || !secret || record.hash !== fields[2]) return null;
    const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret));
    return expected === parts[1] ? user : null;
  } catch (error) {
    return null;
  }
}

function profilePhotoGet_(body) {
  const user = verifySessionToken_(body.sessionToken);
  if (!user || user !== body.user) return { ok: false, error: 'Sesi sudah tidak berlaku. Silakan login kembali.' };
  const props = PropertiesService.getScriptProperties();
  const key = 'PROFILE_PHOTO_' + user;
  const fileId = props.getProperty(key);
  if (!fileId) return { ok: true, photoData: '', sessionToken: issueSessionToken_(user, JSON.parse(props.getProperty('FAMILY_AUTH'))[user]) };
  try {
    const blob = DriveApp.getFileById(fileId).getBlob();
    return { ok: true, photoData: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()), sessionToken: issueSessionToken_(user, JSON.parse(props.getProperty('FAMILY_AUTH'))[user]) };
  } catch (error) {
    props.deleteProperty(key);
    return { ok: true, photoData: '', sessionToken: issueSessionToken_(user, JSON.parse(props.getProperty('FAMILY_AUTH'))[user]) };
  }
}

function profilePhotoSet_(body) {
  const user = verifySessionToken_(body.sessionToken);
  if (!user || user !== body.user) return { ok: false, error: 'Sesi sudah tidak berlaku. Silakan login kembali.' };
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.photoData || ''));
  if (!match || body.photoData.length > 70000) return { ok: false, error: 'Foto tidak valid atau ukurannya terlalu besar.' };
  const props = PropertiesService.getScriptProperties();
  const key = 'PROFILE_PHOTO_' + user;
  const previousId = props.getProperty(key);
  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, match[1], 'profile-' + user + '.jpg');
  const file = getProfilePhotoFolder_().createFile(blob);
  props.setProperty(key, file.getId());
  if (previousId) {
    try { DriveApp.getFileById(previousId).setTrashed(true); } catch (error) { /* The old photo may already be deleted. */ }
  }
  return { ok: true, sessionToken: issueSessionToken_(user, JSON.parse(props.getProperty('FAMILY_AUTH'))[user]) };
}

function getProfilePhotoFolder_() {
  return getOrCreateFolder_(getOrCreateFolder_(DriveApp.getRootFolder(), DRIVE_ROOT), 'Foto Profil');
}

function validAuthRecords_(users, allowAbiBootstrap) {
  const allowed = ['abi', 'ummi', 'alif_aslam', 'muslim_ihsan', 'm_bilal_albana', 'fajri_rahman', 'adzkadina_salsabila'];
  if (!users || Object.keys(users).some(user => !allowed.includes(user))) return false;
  const required = allowAbiBootstrap && Object.keys(users).length === 1 && users.abi ? ['abi'] : allowed;
  return required.every(user => users[user] && /^[a-f0-9]{64}$/i.test(users[user].hash) && typeof users[user].salt === 'string');
}

function verifyPassword_(record, password) {
  if (!record || typeof password !== 'string') return false;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, record.salt + ':' + password, Utilities.Charset.UTF_8);
  const hash = digest.map(byte => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('');
  return hash === record.hash;
}

function hashPassword_(salt, password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password, Utilities.Charset.UTF_8);
  return digest.map(byte => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('');
}

function authResult_(params) {
  const callback = String(params.callback || '').replace(/[^\w$.]/g, '');
  const requestId = String(params.requestId || '').replace(/[^\w-]/g, '');
  const cache = CacheService.getScriptCache();
  const result = cache.get('auth:' + requestId) || cache.get('write:' + requestId);
  const payload = result ? JSON.parse(result) : { pending: true };
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('FAMILY_SPREADSHEET_ID');
  if (storedId) return SpreadsheetApp.openById(storedId);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const existingId = props.getProperty('FAMILY_SPREADSHEET_ID');
    if (existingId) return SpreadsheetApp.openById(existingId);
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    const ss = files.hasNext() ? SpreadsheetApp.open(files.next()) : SpreadsheetApp.create(SPREADSHEET_NAME);
    ensureSheets_(ss);
    ensureDriveStructure_();
    props.setProperty('FAMILY_SPREADSHEET_ID', ss.getId());
    return ss;
  } finally { lock.releaseLock(); }
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
  if (JSON.stringify(record).length > 15000) return { ok: false, error: 'Isian terlalu panjang. Ringkas catatan dan coba simpan kembali.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
  validateSheet_(sheetName);
  const sheet = ss.getSheetByName(sheetName);
  const headers = SCHEMA[sheetName];
  const idCol = 1;
  const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues().flat() : [];
  const id = sanitize_(record.id || Utilities.getUuid());
  record.id = id;
  const found = ids.indexOf(id);
  if (found >= 0 && record.base_updated_at) {
    const updatedColumn = headers.indexOf('updated_at') + 1;
    const currentRow = sheet.getRange(found + 2, 1, 1, headers.length).getValues()[0];
    const currentValue = currentRow[updatedColumn - 1];
    const currentUpdatedAt = currentValue instanceof Date ? currentValue.toISOString() : String(currentValue);
    if (currentUpdatedAt !== String(record.base_updated_at)) {
      const current = Object.fromEntries(headers.map((header, index) => [header, currentRow[index] instanceof Date ? currentRow[index].toISOString() : currentRow[index]]));
      return { ok: false, conflict: true, current: current, error: 'Record changed on another device' };
    }
  }
  delete record.base_updated_at;
  record.updated_at = new Date().toISOString();
  const row = headers.map(header => sanitize_(record[header]));
  if (found >= 0) sheet.getRange(found + 2, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
  audit_(ss, record.family_id, record.member_id, record.member_name, 'upsert', sheetName, record);
  return { ok: true, id };
  } finally { lock.releaseLock(); }
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
