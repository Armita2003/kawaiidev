import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { del, put, list } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const APKS_DIR = path.join(DATA_DIR, 'apks');

export interface ApkMeta {
  fileName: string;
  size: string;
}

export interface StorageStatus {
  hasToken: boolean;
  tokenPreview: string;
  connectionOk: boolean;
  error: string | null;
}

export interface Storage {
  readJson<T>(key: string, fallback: T): Promise<T>;
  writeJson(key: string, data: unknown): Promise<void>;
  hasApk(projectId: string): Promise<boolean>;
  getApk(projectId: string): Promise<{ data: Buffer; meta: ApkMeta } | null>;
  putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void>;
  deleteApk(projectId: string): Promise<void>;
  getStatus(): Promise<StorageStatus>;
}

async function getBlobUrl(token: string, pathname: string): Promise<string | null> {
  try {
    const { blobs } = await list({
      prefix: pathname,
      token,
    });
    const found = blobs.find((b) => b.pathname === pathname);
    return found ? found.url : null;
  } catch (err) {
    console.error(`getBlobUrl error for ${pathname}:`, err);
    return null;
  }
}

class FileStorage implements Storage {
  private filePath(key: string) {
    return path.join(DATA_DIR, key);
  }

  private apkPath(projectId: string) {
    return path.join(APKS_DIR, `${projectId}.apk`);
  }

  private metaPath(projectId: string) {
    return path.join(APKS_DIR, `${projectId}.json`);
  }

  async readJson<T>(key: string, fallback: T): Promise<T> {
    const filePath = this.filePath(key);
    try {
      if (!fs.existsSync(filePath)) return fallback;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    } catch {
      return fallback;
    }
  }

  async writeJson(key: string, data: unknown): Promise<void> {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(this.filePath(key), JSON.stringify(data, null, 2));
  }

  async hasApk(projectId: string): Promise<boolean> {
    return fs.existsSync(this.apkPath(projectId));
  }

  async getApk(projectId: string): Promise<{ data: Buffer; meta: ApkMeta } | null> {
    const apkPath = this.apkPath(projectId);
    if (!fs.existsSync(apkPath)) return null;

    const metaPath = this.metaPath(projectId);
    const meta = fs.existsSync(metaPath)
      ? (JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as ApkMeta)
      : { fileName: `${projectId}.apk`, size: '' };

    return { data: fs.readFileSync(apkPath), meta };
  }

  async putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void> {
    fs.mkdirSync(APKS_DIR, { recursive: true });
    fs.writeFileSync(this.apkPath(projectId), data);
    fs.writeFileSync(this.metaPath(projectId), JSON.stringify(meta, null, 2));
  }

  async deleteApk(projectId: string): Promise<void> {
    const apkPath = this.apkPath(projectId);
    const metaPath = this.metaPath(projectId);
    if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  }

  async getStatus(): Promise<StorageStatus> {
    return {
      hasToken: false,
      tokenPreview: '',
      connectionOk: false,
      error: 'Using local filesystem storage.',
    };
  }
}

class BlobStorage implements Storage {
  constructor(private token: string) {}

  private blobKey(key: string) {
    return `data/${key}`;
  }

  private apkKey(projectId: string) {
    return `apks/${projectId}.apk`;
  }

  private metaKey(projectId: string) {
    return `apks/${projectId}.meta.json`;
  }

  async readJson<T>(key: string, fallback: T): Promise<T> {
    try {
      const url = await getBlobUrl(this.token, this.blobKey(key));
      if (!url) return fallback;
      const response = await fetch(url);
      if (!response.ok) return fallback;
      return (await response.json()) as T;
    } catch {
      return fallback;
    }
  }

  async writeJson(key: string, data: unknown): Promise<void> {
    await put(this.blobKey(key), JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      token: this.token,
      addRandomSuffix: false,
    });
  }

  async hasApk(projectId: string): Promise<boolean> {
    try {
      const url = await getBlobUrl(this.token, this.apkKey(projectId));
      return url !== null;
    } catch {
      return false;
    }
  }

  async getApk(projectId: string): Promise<{ data: Buffer; meta: ApkMeta } | null> {
    try {
      const url = await getBlobUrl(this.token, this.apkKey(projectId));
      if (!url) return null;

      const response = await fetch(url);
      if (!response.ok) return null;

      const data = Buffer.from(await response.arrayBuffer());

      let meta: ApkMeta = { fileName: `${projectId}.apk`, size: '' };
      try {
        const metaUrl = await getBlobUrl(this.token, this.metaKey(projectId));
        if (metaUrl) {
          const metaResponse = await fetch(metaUrl);
          if (metaResponse.ok) {
            meta = (await metaResponse.json()) as ApkMeta;
          }
        }
      } catch {
        // use fallback meta
      }

      return { data, meta };
    } catch {
      return null;
    }
  }

  async putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void> {
    await put(this.apkKey(projectId), data, {
      access: 'public',
      contentType: 'application/vnd.android.package-archive',
      token: this.token,
      addRandomSuffix: false,
    });

    await put(this.metaKey(projectId), JSON.stringify(meta), {
      access: 'public',
      contentType: 'application/json',
      token: this.token,
      addRandomSuffix: false,
    });
  }

  async deleteApk(projectId: string): Promise<void> {
    const targets: string[] = [];

    for (const key of [this.apkKey(projectId), this.metaKey(projectId)]) {
      const url = await getBlobUrl(this.token, key);
      if (url) {
        targets.push(url);
      }
    }

    if (targets.length > 0) {
      await del(targets, { token: this.token });
    }
  }

  async getStatus(): Promise<StorageStatus> {
    try {
      // Test the token by running a simple list call
      await list({ limit: 1, token: this.token });
      return {
        hasToken: true,
        tokenPreview: this.token ? `${this.token.substring(0, 10)}...` : '',
        connectionOk: true,
        error: null,
      };
    } catch (err: any) {
      console.error('BlobStorage.getStatus test failed:', err);
      return {
        hasToken: true,
        tokenPreview: this.token ? `${this.token.substring(0, 10)}...` : '',
        connectionOk: false,
        error: err?.message || String(err),
      };
    }
  }
}

class HybridStorage implements Storage {
  private fileStorage: FileStorage;
  private blobStorage: BlobStorage | null = null;

  constructor(token?: string) {
    this.fileStorage = new FileStorage();
    if (token) {
      this.blobStorage = new BlobStorage(token);
    }
  }

  async readJson<T>(key: string, fallback: T): Promise<T> {
    if (this.blobStorage) {
      try {
        const val = await this.blobStorage.readJson<T | null>(key, null);
        if (val !== null) {
          // Sync to local FileStorage for immediate access
          try {
            await this.fileStorage.writeJson(key, val);
          } catch {
            // Ignore write errors on read-only environments like Vercel
          }
          return val;
        }
      } catch (err) {
        console.warn(`Failed to read JSON ${key} from BlobStorage, falling back to FileStorage:`, err);
      }
    }
    return this.fileStorage.readJson(key, fallback);
  }

  async writeJson(key: string, data: unknown): Promise<void> {
    let localSucceeded = false;
    // Write locally first for instant availability (where writable)
    try {
      await this.fileStorage.writeJson(key, data);
      localSucceeded = true;
    } catch (err) {
      console.warn(`Local FileStorage write failed (expected on read-only environments like Vercel):`, err);
    }

    if (this.blobStorage) {
      try {
        await this.blobStorage.writeJson(key, data);
      } catch (err) {
        console.error(`Failed to sync write JSON ${key} to Vercel Blob:`, err);
        // Only throw if we had absolutely no way to store the data
        if (!localSucceeded) {
          throw err;
        }
      }
    } else if (!localSucceeded) {
      throw new Error('No storage option succeeded (local storage is read-only and Vercel Blob is not configured)');
    }
  }

  async hasApk(projectId: string): Promise<boolean> {
    if (this.blobStorage) {
      try {
        const exists = await this.blobStorage.hasApk(projectId);
        if (exists) return true;
      } catch {
        // fallback
      }
    }
    try {
      return await this.fileStorage.hasApk(projectId);
    } catch {
      return false;
    }
  }

  async getApk(projectId: string): Promise<{ data: Buffer; meta: ApkMeta } | null> {
    if (this.blobStorage) {
      try {
        const res = await this.blobStorage.getApk(projectId);
        if (res) {
          // Keep local cached copy updated
          this.fileStorage.putApk(projectId, res.data, res.meta).catch(() => {
            // Suppress local storage cache warnings in read-only environments
          });
          return res;
        }
      } catch (err) {
        console.warn(`Failed to get APK ${projectId} from BlobStorage, falling back to FileStorage:`, err);
      }
    }
    try {
      return await this.fileStorage.getApk(projectId);
    } catch {
      return null;
    }
  }

  async putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void> {
    let localSucceeded = false;
    // Write locally first
    try {
      await this.fileStorage.putApk(projectId, data, meta);
      localSucceeded = true;
    } catch (err) {
      console.warn(`Local FileStorage APK write failed (expected on read-only environments like Vercel):`, err);
    }

    if (this.blobStorage) {
      try {
        await this.blobStorage.putApk(projectId, data, meta);
      } catch (err) {
        console.error(`Failed to sync upload APK ${projectId} to Vercel Blob:`, err);
        // Only throw if no other storage option succeeded
        if (!localSucceeded) {
          throw err;
        }
      }
    } else if (!localSucceeded) {
      throw new Error('Failed to save APK: Local filesystem is read-only and Vercel Blob is not configured.');
    }
  }

  async deleteApk(projectId: string): Promise<void> {
    try {
      await this.fileStorage.deleteApk(projectId);
    } catch (err) {
      console.warn(`Local FileStorage APK delete failed (expected on read-only environments like Vercel):`, err);
    }

    if (this.blobStorage) {
      try {
        await this.blobStorage.deleteApk(projectId);
      } catch (err) {
        console.error(`Failed to delete APK ${projectId} from Vercel Blob:`, err);
      }
    }
  }

  async getStatus(): Promise<StorageStatus> {
    if (this.blobStorage) {
      return this.blobStorage.getStatus();
    }
    return {
      hasToken: false,
      tokenPreview: '',
      connectionOk: false,
      error: 'BLOB_READ_WRITE_TOKEN environment variable is not defined or empty.',
    };
  }
}

export function createStorage(): Storage {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(APKS_DIR, { recursive: true });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return new HybridStorage(token);
}

export const storage = createStorage();
