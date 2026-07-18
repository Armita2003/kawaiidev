import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createStorage, mapJsonKey } from './storage.js';

test('mapJsonKey maps legacy file keys to database keys', () => {
  assert.equal(mapJsonKey('projects.json'), 'projects');
  assert.equal(mapJsonKey('stats.json'), 'stats');
  assert.equal(mapJsonKey('custom.json'), 'custom');
  assert.equal(mapJsonKey('plain'), 'plain');
});

test('storage persists JSON values to disk', async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'kawaii-storage-'));

  try {
    const storage = createStorage(tempDir);

    await storage.writeJson('projects.json', [{ id: 'demo', name: 'Demo Project' }]);
    const projects = await storage.readJson('projects.json', []);

    assert.deepEqual(projects, [{ id: 'demo', name: 'Demo Project' }]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('file storage persists APK binaries and metadata', async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'kawaii-storage-'));

  try {
    const storage = createStorage(tempDir);
    const payload = Buffer.from('fake-apk-bytes');

    await storage.putApk('demo-app', payload, { fileName: 'demo.apk', size: '12 KB' });
    assert.equal(await storage.hasApk('demo-app'), true);

    const apk = await storage.getApk('demo-app');
    assert.ok(apk);
    assert.equal(apk.data.toString(), 'fake-apk-bytes');
    assert.deepEqual(apk.meta, { fileName: 'demo.apk', size: '12 KB' });

    await storage.deleteApk('demo-app');
    assert.equal(await storage.hasApk('demo-app'), false);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
