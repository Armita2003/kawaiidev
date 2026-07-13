import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { del, head, put } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const APKS_DIR = path.join(DATA_DIR, 'apks');

export interface ApkMeta {
  fileName: string;
  size: string;
}

export interface Storage {
  readJson<T>(key: string, fallback: T): Promise<T>;
  writeJson(key: string, data: unknown): Promise<void>;
  hasApk(projectId: string): Promise<boolean>;
  getApk(projectId: string): Promise<{ data: Buffer; meta: ApkMeta } | null>;
  putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void>;
  deleteApk(projectId: string): Promise<void>;
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
      const info = await head(this.blobKey(key), { token: this.token });
      const response = await fetch(info.downloadUrl);
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
      await head(this.apkKey(projectId), { token: this.token });
      return true;
    } catch {
      return false;
    }
  }

  async getApk(projectId: string): Promise<{ data: Buffer; meta: ApkMeta } | null> {
    try {
      const info = await head(this.apkKey(projectId), { token: this.token });
      const response = await fetch(info.downloadUrl);
      if (!response.ok) return null;

      const data = Buffer.from(await response.arrayBuffer());

      try {
        const metaInfo = await head(this.metaKey(projectId), { token: this.token });
        const metaResponse = await fetch(metaInfo.downloadUrl);
        if (metaResponse.ok) {
          return { data, meta: (await metaResponse.json()) as ApkMeta };
        }
      } catch {
        // use fallback meta
      }

      return { data, meta: { fileName: `${projectId}.apk`, size: String(info.size ?? '') } };
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
      try {
        const info = await head(key, { token: this.token });
        targets.push(info.url);
      } catch {
        // blob may not exist
      }
    }

    if (targets.length > 0) {
      await del(targets, { token: this.token });
    }
  }
}

export function createStorage(): Storage {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    return new BlobStorage(token);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(APKS_DIR, { recursive: true });
  return new FileStorage();
}

export const storage = createStorage();
