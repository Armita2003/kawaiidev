import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
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

export function createStorage(): Storage {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(APKS_DIR, { recursive: true });
  return new FileStorage();
}

export const storage = createStorage();
