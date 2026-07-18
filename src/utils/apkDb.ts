export interface StoredApk {
  projectId: string;
  blob: Blob;
  fileName: string;
  size: string;
}

interface StoredApkRecord extends StoredApk {
  createdAt: string;
}

interface SignedUploadInitResponse {
  supported: boolean;
  uploadUrl?: string;
  path?: string;
}

const DB_NAME = 'kawaiidev-apks';
const STORE_NAME = 'apks';

function openApkDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open APK database'));
  });
}

async function storeApkRecord(projectId: string, blob: Blob, fileName: string, size: string): Promise<void> {
  const db = await openApkDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = store.put({ projectId, blob, fileName, size, createdAt: new Date().toISOString() } as StoredApkRecord);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to save APK locally'));
    tx.onabort = () => reject(tx.error || new Error('APK save transaction aborted'));
  });

  db.close();
}

async function getStoredApkRecord(projectId: string): Promise<StoredApk | null> {
  const db = await openApkDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const record = await new Promise<StoredApkRecord | null>((resolve, reject) => {
    const request = store.get(projectId);
    request.onsuccess = () => resolve(request.result as StoredApkRecord | null);
    request.onerror = () => reject(request.error || new Error('Failed to read APK locally'));
  });

  db.close();
  return record ? { projectId: record.projectId, blob: record.blob, fileName: record.fileName, size: record.size } : null;
}

async function deleteStoredApkRecord(projectId: string): Promise<void> {
  const db = await openApkDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = store.delete(projectId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to delete APK locally'));
  });

  db.close();
}

async function uploadViaSignedUrl(projectId: string, blob: Blob, fileName: string, size: string): Promise<boolean> {
  const initRes = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'signed-upload', fileName, size }),
  });

  if (!initRes.ok) return false;

  const initData = (await initRes.json()) as SignedUploadInitResponse;
  if (!initData.supported || !initData.uploadUrl) return false;

  const uploadRes = await fetch(initData.uploadUrl, {
    method: 'PUT',
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Direct APK upload failed: ${uploadRes.status}`);
  }

  const completeRes = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'complete-upload', fileName, size }),
  });

  if (!completeRes.ok) {
    throw new Error(`Failed to finalize APK upload: ${completeRes.status}`);
  }

  return true;
}

async function uploadViaRawPut(projectId: string, blob: Blob, fileName: string, size: string): Promise<boolean> {
  const res = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-File-Name': String(fileName),
      'X-File-Size': size,
    },
    body: blob,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload APK: ${res.status}`);
  }

  return true;
}

export async function saveApkFile(projectId: string, blob: Blob, fileName: string, size: string): Promise<boolean> {
  try {
    // Try raw PUT to the API first (works reliably from browser). If that fails,
    // fall back to signed upload flow which may be blocked by CORS in some setups.
    try {
      await uploadViaRawPut(projectId, blob, fileName, size);
      return true;
    } catch (err) {
      console.warn('Raw PUT failed, trying signed upload flow:', err);
    }

    const usedSignedUpload = await uploadViaSignedUrl(projectId, blob, fileName, size).catch((err) => {
      console.warn('Signed upload unavailable, falling back to local storage:', err);
      return false;
    });

    if (usedSignedUpload) return true;
    return false;
  } catch (err) {
    await storeApkRecord(projectId, blob, fileName, size);
    console.warn('Remote APK storage unavailable; stored locally in browser:', err);
    return false;
  }
}

export async function getApkFile(projectId: string): Promise<StoredApk | null> {
  try {
    const headRes = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, { method: 'HEAD' });
    if (headRes.ok) {
      const res = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, { redirect: 'follow' });
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 1024) {
          const fileName = decodeURIComponent(res.headers.get('X-File-Name') || `${projectId}.apk`);
          const size = res.headers.get('X-File-Size') || '';
          await storeApkRecord(projectId, blob, fileName, size).catch(() => {});
          return { projectId, blob, fileName, size };
        }
      }
    }
  } catch (err) {
    console.warn('APK server retrieval failed, trying IndexedDB:', err);
  }

  return getStoredApkRecord(projectId);
}

export async function deleteApkFile(projectId: string): Promise<void> {
  try {
    const res = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(`Failed to delete APK: ${res.status}`);
    }
  } catch (err) {
    console.warn('APK delete failed:', err);
  } finally {
    await deleteStoredApkRecord(projectId);
  }
}
