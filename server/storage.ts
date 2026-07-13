import dotenv from 'dotenv';
dotenv.config();

import fs, { createReadStream } from 'fs';
import path from 'path';
import { del, put, list } from '@vercel/blob';

const ROOT = process.cwd();
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(ROOT, 'data');
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
  accessType?: 'public' | 'private';
}

export interface Storage {
  readJson<T>(key: string, fallback: T): Promise<T>;
  writeJson(key: string, data: unknown): Promise<void>;
  hasApk(projectId: string): Promise<boolean>;
  getApk(projectId: string): Promise<{ data: Buffer; meta: ApkMeta } | null>;
  getApkUrl(projectId: string): Promise<string | null>;
  putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void>;
  deleteApk(projectId: string): Promise<void>;
  getStatus(): Promise<StorageStatus>;
}

const blobUrlCache = new Map<string, string>();

async function getBlobUrl(token: string, pathname: string): Promise<string | null> {
  const cacheKey = `${token}:${pathname}`;
  if (blobUrlCache.has(cacheKey)) {
    return blobUrlCache.get(cacheKey) || null;
  }

  try {
    const { blobs } = await list({
      prefix: pathname,
      token,
    });
    const found = blobs.find((b) => b.pathname === pathname);
    const url = found ? found.url : null;
    if (url) {
      blobUrlCache.set(cacheKey, url);
    }
    return url;
  } catch (err) {
    console.error(`getBlobUrl error for ${pathname}:`, err);
    throw err;
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
    return path.join(APKS_DIR, `${projectId}.meta.json`);
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

  async getApkUrl(projectId: string): Promise<string | null> {
    return null;
  }

  async putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void> {
    fs.mkdirSync(APKS_DIR, { recursive: true });
    console.log(`🐾 FileStorage: writing APK to ${this.apkPath(projectId)} (${data.length} bytes) meta=${JSON.stringify(meta)}`);
    fs.writeFileSync(this.apkPath(projectId), data);
    fs.writeFileSync(this.metaPath(projectId), JSON.stringify(meta, null, 2));
    console.log(`🐾 FileStorage: finished writing APK ${projectId}`);
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
  private isPrivateStore: boolean | null = null;

  constructor(private token: string) {}

  private async getAccessType(): Promise<'public' | 'private'> {
    if (this.isPrivateStore === null) {
      try {
        // Try a tiny write to test if public access is allowed
        const testKey = 'temp-access-test.txt';
        await put(testKey, 'test', {
          access: 'public',
          token: this.token,
          addRandomSuffix: false,
        });
        this.isPrivateStore = false;
        // Clean up the test file
        try {
          await del(testKey, { token: this.token });
        } catch {
          // ignore cleanup error
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        if (
          errMsg.includes('private store') ||
          errMsg.includes('private access') ||
          errMsg.includes('public access') ||
          errMsg.includes('Cannot use public access')
        ) {
          console.log('🐾 Vercel Blob: Detected private store (public access not allowed). Switching to private access.');
          this.isPrivateStore = true;
        } else {
          // Some other error, default to public
          this.isPrivateStore = false;
        }
      }
    }
    return this.isPrivateStore ? 'private' : 'public';
  }

  private blobKey(key: string) {
    return `data/${key}`;
  }

  private apkKey(projectId: string) {
    return `apks/${projectId}.apk`;
  }

  private metaKey(projectId: string) {
    return `apks/${projectId}.meta.json`;
  }

  async getJsonWithStatus<T>(key: string): Promise<{ exists: boolean; data: T | null; error: boolean }> {
    try {
      const url = await getBlobUrl(this.token, this.blobKey(key));
      if (!url) {
        return { exists: false, data: null, error: false };
      }
      const response = await fetch(url);
      if (response.status === 404) {
        return { exists: false, data: null, error: false };
      }
      if (!response.ok) {
        return { exists: true, data: null, error: true };
      }
      const data = await response.json();
      return { exists: true, data: data as T, error: false };
    } catch (err: any) {
      console.error(`getJsonWithStatus error for key: ${key}`, err);
      return { exists: true, data: null, error: true };
    }
  }

  async readJson<T>(key: string, fallback: T): Promise<T> {
    try {
      const status = await this.getJsonWithStatus<T>(key);
      if (status.data !== null) return status.data;
      return fallback;
    } catch {
      return fallback;
    }
  }

  async writeJson(key: string, data: unknown): Promise<void> {
    const access = await this.getAccessType();
    const pathname = this.blobKey(key);
    const result = await put(pathname, JSON.stringify(data, null, 2), {
      access: access as any,
      contentType: 'application/json',
      token: this.token,
      addRandomSuffix: false,
    });
    blobUrlCache.set(`${this.token}:${pathname}`, result.url);
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

  async getApkUrl(projectId: string): Promise<string | null> {
    try {
      return await getBlobUrl(this.token, this.apkKey(projectId));
    } catch {
      return null;
    }
  }

  async putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void> {
    await this.uploadApkAndMeta(projectId, data, data.length, meta);
  }

  async putApkFromPath(projectId: string, apkFilePath: string, meta: ApkMeta): Promise<void> {
    const { size } = fs.statSync(apkFilePath);
    const stream = createReadStream(apkFilePath);
    await this.uploadApkAndMeta(projectId, stream, size, meta);
  }

  private async uploadApkAndMeta(
    projectId: string,
    apkBody: Parameters<typeof put>[1],
    apkSize: number,
    meta: ApkMeta,
  ): Promise<void> {
    const access = await this.getAccessType();
    const apkPathname = this.apkKey(projectId);
    const metaPathname = this.metaKey(projectId);
    try {
      console.log(`🐾 BlobStorage: putting APK to ${apkPathname} (${apkSize} bytes) access=${access}`);
      const apkResult = await put(apkPathname, apkBody, {
        access: access as any,
        contentType: 'application/vnd.android.package-archive',
        token: this.token,
        addRandomSuffix: false,
        multipart: apkSize > 5 * 1024 * 1024,
      });
      blobUrlCache.set(`${this.token}:${apkPathname}`, apkResult.url);
      console.log(`🐾 BlobStorage: APK put succeeded ${apkResult.url}`);
    } catch (err) {
      console.error(`🐾 BlobStorage: APK put failed for ${apkPathname}:`, err);
      throw err;
    }

    try {
      console.log(`🐾 BlobStorage: putting metadata to ${metaPathname}`);
      const metaResult = await put(metaPathname, JSON.stringify(meta), {
        access: access as any,
        contentType: 'application/json',
        token: this.token,
        addRandomSuffix: false,
      });
      blobUrlCache.set(`${this.token}:${metaPathname}`, metaResult.url);
      console.log(`🐾 BlobStorage: metadata put succeeded ${metaResult.url}`);
    } catch (err) {
      console.error(`🐾 BlobStorage: metadata put failed for ${metaPathname}:`, err);
      throw err;
    }
  }

  async deleteApk(projectId: string): Promise<void> {
    const pathnames: string[] = [];

    for (const key of [this.apkKey(projectId), this.metaKey(projectId)]) {
      // Only attempt delete if the blob exists (getBlobUrl can validate existence)
      const url = await getBlobUrl(this.token, key);
      if (url) {
        pathnames.push(key);
      }
    }

    if (pathnames.length > 0) {
      await del(pathnames, { token: this.token });
    }
  }

  async getStatus(): Promise<StorageStatus> {
    try {
      // Test the token by running a simple list call
      await list({ limit: 1, token: this.token });
      const accessType = await this.getAccessType();
      return {
        hasToken: true,
        tokenPreview: this.token ? `${this.token.substring(0, 10)}...` : '',
        connectionOk: true,
        error: null,
        accessType,
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
        const result = await this.blobStorage.getJsonWithStatus<T>(key);
        if (result.exists) {
          if (!result.error && result.data !== null) {
            // Successfully fetched from Blob. Sync locally.
            try {
              await this.fileStorage.writeJson(key, result.data);
            } catch {
              // Ignore local write errors
            }
            return result.data;
          } else {
            // An error occurred fetching, or data is invalid.
            // DO NOT seed/overwrite! Just fall back to local FileStorage so we don't lose data.
            console.warn(`🐾 Error reading "${key}" from Vercel Blob. Falling back to local cache to avoid overwriting.`);
            return this.fileStorage.readJson(key, fallback);
          }
        } else {
          // File definitely does not exist on Vercel Blob yet. Seed it safely!
          const localVal = await this.fileStorage.readJson(key, fallback);
          console.log(`🐾 Key "${key}" not found in Vercel Blob. Seeding with local/fallback data...`);
          try {
            await this.blobStorage.writeJson(key, localVal);
          } catch (writeErr) {
            console.warn(`Failed to seed key "${key}" to Vercel Blob:`, writeErr);
          }
          return localVal;
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

  async getApkUrl(projectId: string): Promise<string | null> {
    if (this.blobStorage) {
      try {
        const url = await this.blobStorage.getApkUrl(projectId);
        if (url) return url;
      } catch {
        // fallback
      }
    }
    return this.fileStorage.getApkUrl(projectId);
  }

  async putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void> {
    let localSucceeded = false;
    // Write locally first
    try {
      console.log(`🐾 HybridStorage: attempting local write for ${projectId} (${data.length} bytes)`);
      await this.fileStorage.putApk(projectId, data, meta);
      localSucceeded = true;
      console.log(`🐾 HybridStorage: local write succeeded for ${projectId}`);
    } catch (err) {
      console.warn(`Local FileStorage APK write failed (expected on read-only environments like Vercel):`, err);
    }

    if (this.blobStorage) {
      if (localSucceeded) {
        // Return immediately after local write; stream from disk so restarts don't lose the buffer
        const apkFilePath = path.join(APKS_DIR, `${projectId}.apk`);
        void this.blobStorage
          .putApkFromPath(projectId, apkFilePath, meta)
          .then(() => console.log(`🐾 HybridStorage: background blob sync succeeded for ${projectId}`))
          .catch((err) => console.error(`Failed to background sync APK ${projectId} to Vercel Blob:`, err));
        return;
      }
      try {
        console.log(`🐾 HybridStorage: attempting blob write for ${projectId}`);
        await this.blobStorage.putApk(projectId, data, meta);
        console.log(`🐾 HybridStorage: blob write succeeded for ${projectId}`);
      } catch (err) {
        console.error(`Failed to sync upload APK ${projectId} to Vercel Blob:`, err);
        throw err;
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

  async syncMissingApksToBlob(): Promise<void> {
    if (!this.blobStorage || process.env.VERCEL) return;
    if (!fs.existsSync(APKS_DIR)) return;

    const apkFiles = fs.readdirSync(APKS_DIR).filter((name) => name.endsWith('.apk'));
    for (const fileName of apkFiles) {
      const projectId = fileName.replace(/\.apk$/, '');
      const apkFilePath = path.join(APKS_DIR, fileName);
      const { size } = fs.statSync(apkFilePath);
      if (size < 1024) continue;

      try {
        const existsInBlob = await this.blobStorage.hasApk(projectId);
        if (existsInBlob) continue;

        const metaPath = path.join(APKS_DIR, `${projectId}.meta.json`);
        const meta: ApkMeta = fs.existsSync(metaPath)
          ? (JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as ApkMeta)
          : { fileName, size: '' };

        console.log(`🐾 Startup sync: uploading missing APK ${projectId} (${size} bytes) to blob...`);
        await this.blobStorage.putApkFromPath(projectId, apkFilePath, meta);
        console.log(`🐾 Startup sync: ${projectId} uploaded to blob`);
      } catch (err) {
        console.error(`🐾 Startup sync failed for ${projectId}:`, err);
      }
    }
  }
}

export function createStorage(): Storage {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(APKS_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create local storage directories (expected in read-only environments like Vercel):', err);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const instance = new HybridStorage(token);
  if (token) {
    void instance.syncMissingApksToBlob();
  }
  return instance;
}

export const storage = createStorage();
