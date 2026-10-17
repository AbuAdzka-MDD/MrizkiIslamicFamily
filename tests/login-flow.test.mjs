import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const loginCode = app.slice(app.indexOf('async function handleLogin(event)'), app.indexOf('function consumeLoginRedirect()'));

function fixture(result) {
  const storage = new Map();
  const status = { textContent: '' };
  const password = { value: 'test-only-password' };
  const button = { disabled: false };
  const form = { dataset: {}, setAttribute() {}, removeAttribute() {}, querySelector: () => button };
  const nodes = { loginPassword: password, loginStatus: status, loginUser: { value: 'abi' } };
  const users = [];
  let calls = 0;
  const context = vm.createContext({
    document: { getElementById: id => nodes[id] },
    localStorage: { setItem: (k, v) => storage.set(k, v) },
    sessionKey: 'session', cloudSessionKey: 'token',
    sendAuthRequest: async payload => { calls++; assert.equal(payload.action, 'authLogin'); return await result; },
    unlockApp: user => users.push(user)
  });
  vm.runInContext(loginCode, context);
  return { context, form, status, password, button, storage, users, get calls() { return calls; } };
}

test('opens the dashboard in place and keeps the shared server session', async () => {
  const f = fixture({ ok: true, sessionToken: 'test-token' });
  await f.context.handleLogin({ preventDefault() {}, currentTarget: f.form });
  assert.deepEqual(f.users, ['abi']);
  assert.equal(f.storage.get('token'), 'test-token');
  assert.equal(f.storage.get('session'), 'abi');
  assert.equal(f.password.value, '');
  assert.equal(f.button.disabled, false);
  assert.equal(f.status.textContent, '');
});

test('keeps the login form available when the password is rejected', async () => {
  const f = fixture({ ok: false, error: 'Password belum sesuai.' });
  await f.context.handleLogin({ preventDefault() {}, currentTarget: f.form });
  assert.equal(f.users.length, 0);
  assert.equal(f.storage.size, 0);
  assert.equal(f.status.textContent, 'Password belum sesuai.');
  assert.equal(f.button.disabled, false);
});

test('ignores a second click while authentication is still pending', async () => {
  let finish;
  const f = fixture(new Promise(resolve => { finish = resolve; }));
  const first = f.context.handleLogin({ preventDefault() {}, currentTarget: f.form });
  await f.context.handleLogin({ preventDefault() {}, currentTarget: f.form });
  assert.equal(f.calls, 1);
  finish({ ok: true, sessionToken: 'test-token' });
  await first;
});

test('login and photos have no native form navigation or JSONP polling', () => {
  assert.doesNotMatch(app, /form\.submit\(|submitProfilePhotoForm|pollAuthResult|sendLoginBridge/);
  assert.match(app, /await uploadProfilePhoto\(user, photoData\)/);
  assert.match(app, /await requestAppsScript\(config.googleAppsScriptUrl/);
});

