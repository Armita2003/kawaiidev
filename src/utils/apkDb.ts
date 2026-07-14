import { upload } from '@vercel/blob/client';

export interface StoredApk {
  projectId: string;
  blob: Blob;
  fileName: string;
  size: string;
}

interface StoredApkRecord extends StoredApk {
  createdAt: string;
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

export async function saveApkFile(projectId: string, blob: Blob, fileName: string, size: string): Promise<void> {
  // Always store locally in the browser's IndexedDB first
  try {
    await storeApkRecord(projectId, blob, fileName, size);
  } catch (err) {
    console.warn('Failed to store APK in local IndexedDB:', err);
  }

  // Then try to upload to the server
  try {
    // Check if Vercel Blob is active
    let blobActive = false;
    let accessType: 'public' | 'private' = 'public';
    try {
      const statusRes = await fetch('/api/storage-status');
      if (statusRes.ok) {
        const status = await statusRes.json();
        if (status && status.connectionOk) {
          blobActive = true;
          if (status.accessType) {
            accessType = status.accessType;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to check storage status:', err);
    }

    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isLarge = blob.size > 5 * 1024 * 1024;

    // Browser multipart upload hits blob.vercel-storage.com directly, which often fails on
    // localhost/restricted networks (ERR_NAME_NOT_RESOLVED). Use server PUT instead.
    if (blobActive && !isLocalhost && !isLarge) {
      console.log(`Vercel Blob is active. Performing direct browser-to-blob upload using ${accessType} access...`);
      
      try {
        // 1. Upload APK directly to Vercel Blob
        let lastLoggedPct = -1;
        const apkUpload = await upload(`apks/${projectId}.apk`, blob, {
          access: accessType as any,
          handleUploadUrl: '/api/apks/upload-token',
          clientPayload: projectId,
          multipart: false,
          onUploadProgress: ({ loaded, total, percentage }) => {
            const pct = percentage ?? (total ? Math.round((loaded / total) * 100) : 0);
            if (pct >= lastLoggedPct + 5 || pct === 100) {
              lastLoggedPct = pct;
              const mbLoaded = (loaded / (1024 * 1024)).toFixed(1);
              const mbTotal = total ? (total / (1024 * 1024)).toFixed(1) : '?';
              console.log(`🐾 Browser blob upload ${projectId}: ${pct}% (${mbLoaded}/${mbTotal} MB)`);
            }
          },
        });
        console.log('APK uploaded directly to Vercel Blob:', apkUpload.url);

        // 2. Upload Metadata directly to Vercel Blob
        const metaContent = JSON.stringify({ fileName, size });
        const metaBlob = new Blob([metaContent], { type: 'application/json' });
        await upload(`apks/${projectId}.meta.json`, metaBlob, {
          access: accessType as any,
          handleUploadUrl: '/api/apks/upload-token',
          clientPayload: projectId,
        });
        console.log('Metadata uploaded directly to Vercel Blob');
        return; // Success, exit early!
      } catch (uploadErr) {
        console.warn('Direct browser-to-blob upload failed. Falling back to Express server PUT upload...', uploadErr);
      }
    }

    // Server PUT: saves locally immediately, syncs to blob in background with progress logs
    console.log(`Performing server PUT upload for ${projectId} (${(blob.size / (1024 * 1024)).toFixed(1)} MB)...`);
    const res = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-File-Name': encodeURIComponent(fileName),
        'X-File-Size': size,
      },
      body: blob,
    });

    if (!res.ok) {
      throw new Error(`Failed to upload APK to server: ${res.status}`);
    }
  } catch (err) {
    console.warn('Remote server APK upload failed; using browser IndexedDB storage:', err);
  }
}

export async function getApkFile(projectId: string): Promise<StoredApk | null> {
  try {
    const headRes = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, { method: 'HEAD' });
    if (headRes.ok) {
      const res = await fetch(`/api/apks/${encodeURIComponent(projectId)}`);
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

  const cached = await getStoredApkRecord(projectId);
  if (cached && cached.blob.size > 1024) {
    return cached;
  }
  return cached;
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
