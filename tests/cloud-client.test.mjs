import test from 'node:test';
import assert from 'node:assert/strict';
import { requestAppsScript } from '../src/cloud-client.mjs';

test('uses a readable simple CORS POST without browser cookies or URL credentials', async () => {
  const payload = { action: 'authLogin', user: 'abi', password: 'test-only-password', requestId: 'stable-write-id' };
  let sent;
  const result = await requestAppsScript('https://script.google.com/macros/s/test/exec', payload, {
    fetchImpl: async (url, options) => {
      sent = { url, options };
      return { ok: true, text: async () => JSON.stringify({ ok: true, sessionToken: 'test-token' }) };
    }
  });
  assert.equal(result.sessionToken, 'test-token');
  assert.equal(sent.options.mode, 'cors');
  assert.equal(sent.options.credentials, 'omit');
  assert.equal(sent.options.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.deepEqual(JSON.parse(sent.options.body), payload);
  assert.equal(new URL(sent.url).search, '');
});

test('keeps a password rejection distinct from a network failure', async () => {
  const result = await requestAppsScript('https://example.test/exec', {}, {
    fetchImpl: async () => ({ ok: true, text: async () => '{"ok":false,"error":"Password belum sesuai."}' })
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Password belum sesuai.');
});

test('reports HTML responses, invalid JSON objects, and HTTP failures', async () => {
  for (const body of ['<html>Sign in</html>', '{}', 'null', '[]']) {
    await assert.rejects(requestAppsScript('https://example.test/exec', {}, {
      fetchImpl: async () => ({ ok: true, text: async () => body })
    }));
  }
  await assert.rejects(requestAppsScript('https://example.test/exec', {}, {
    fetchImpl: async () => ({ ok: false, status: 503 })
  }), /HTTP 503/);
});

test('aborts a stalled call without retrying a mutation', async () => {
  let calls = 0;
  await assert.rejects(requestAppsScript('https://example.test/exec', { action: 'upsert' }, {
    timeoutMs: 20,
    fetchImpl: async (url, { signal }) => {
      calls++;
      return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
    }
  }), /belum merespons/);
  assert.equal(calls, 1);
});

