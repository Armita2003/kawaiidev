const DB_NAME = 'KawaiiApkDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'apkFiles';

export interface StoredApk {
  projectId: string;
  blob: Blob;
  fileName: string;
  size: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function saveApkFile(projectId: string, blob: Blob, fileName: string, size: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ projectId, blob, fileName, size });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    request.onerror = () => reject(request.error);
  });
}

export async function getApkFile(projectId: string): Promise<StoredApk | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB retrieval failed:', err);
    return null;
  }
}

export async function deleteApkFile(projectId: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(projectId);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }
}
