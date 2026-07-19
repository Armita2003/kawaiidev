import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const ROOT = process.cwd();
const DATA_DIR_FROM_ENV = process.env.DATA_DIR ? path.resolve(ROOT, process.env.DATA_DIR) : undefined;
const DEFAULT_DATA_DIR = DATA_DIR_FROM_ENV || path.join(ROOT, 'data');
const APK_BUCKET = 'apks';
const SIGNED_URL_TTL_SECONDS = 3600;

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
  getApkMeta?(projectId: string): Promise<ApkMeta | null>;
  writeApkMeta?(projectId: string, meta: ApkMeta): Promise<void>;
  createApkDownloadUrl?(projectId: string): Promise<string | null>;
  createApkUploadUrl?(projectId: string): Promise<{ uploadUrl: string; path: string } | null>;
}

export type StorageBackend = 'supabase' | 'file';

export function mapJsonKey(key: string): string {
  if (key === 'projects.json') return 'projects';
  if (key === 'stats.json') return 'stats';
  return key.replace(/\.json$/, '');
}

function apkObjectPath(projectId: string) {
  return `${projectId}.apk`;
}

function apkMetaObjectPath(projectId: string) {
  return `${projectId}.meta.json`;
}

class FileStorage implements Storage {
  constructor(private readonly dataDir: string = DEFAULT_DATA_DIR) {}

  private filePath(key: string) {
    return path.join(this.dataDir, key);
  }

  private apkDir() {
    return path.join(this.dataDir, 'apks');
  }

  private apkPath(projectId: string) {
    return path.join(this.apkDir(), apkObjectPath(projectId));
  }

  private metaPath(projectId: string) {
    return path.join(this.apkDir(), apkMetaObjectPath(projectId));
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
    fs.mkdirSync(this.dataDir, { recursive: true });
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
    fs.mkdirSync(this.apkDir(), { recursive: true });
    fs.writeFileSync(this.apkPath(projectId), data);
    fs.writeFileSync(this.metaPath(projectId), JSON.stringify(meta, null, 2));
  }

  async deleteApk(projectId: string): Promise<void> {
    const apkPath = this.apkPath(projectId);
    const metaPath = this.metaPath(projectId);
    if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  }

  async getApkMeta(projectId: string): Promise<ApkMeta | null> {
    if (!fs.existsSync(this.apkPath(projectId))) return null;
    return this.getLocalApkMeta(projectId);
  }

  async writeApkMeta(projectId: string, meta: ApkMeta): Promise<void> {
    fs.mkdirSync(this.apkDir(), { recursive: true });
    fs.writeFileSync(this.metaPath(projectId), JSON.stringify(meta, null, 2));
  }

  getLocalApkPath(projectId: string): string | null {
    const apkPath = this.apkPath(projectId);
    return fs.existsSync(apkPath) ? apkPath : null;
  }

  getLocalApkMeta(projectId: string): ApkMeta {
    const metaPath = this.metaPath(projectId);
    if (fs.existsSync(metaPath)) {
      try {
        return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as ApkMeta;
      } catch {
        // fall through
      }
    }
    return { fileName: `${projectId}.apk`, size: '' };
  }
}

class SupabaseStorage implements Storage {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    try {
      console.log('SupabaseStorage initialized with URL:', url ? url : '(missing)');
    } catch {
      // ignore logging errors
    }
  }

  async readJson<T>(key: string, fallback: T): Promise<T> {
    const dbKey = mapJsonKey(key);
    const { data, error } = await this.client
      .from('app_data')
      .select('value')
      .eq('key', dbKey)
      .maybeSingle();

    if (error) {
      console.error(`Supabase readJson error (${dbKey}):`, error.message || error);
      throw new Error(`Supabase readJson error (${dbKey}): ${error.message || JSON.stringify(error)}`);
    }

    if (!data?.value) return fallback;
    return data.value as T;
  }

  async writeJson(key: string, data: unknown): Promise<void> {
    const dbKey = mapJsonKey(key);
    try {
      const resp = await this.client
        .from('app_data')
        .upsert({ key: dbKey, value: data, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyResp: any = resp;
      if (anyResp.error) {
        console.error(`Supabase writeJson error (${dbKey}) response:`, anyResp);
        throw new Error(`Supabase writeJson error (${dbKey}): ${anyResp.error?.message || JSON.stringify(anyResp.error)}`);
      }
      return;
    } catch (err: any) {
      console.error(`Supabase writeJson exception (${dbKey}):`, err);
      throw new Error(
        `Supabase writeJson error (${dbKey}): ${err?.message || String(err)}. Check SUPABASE_URL and network connectivity.`,
      );
    }
  }

  async hasApk(projectId: string): Promise<boolean> {
    const { data, error } = await this.client.storage.from(APK_BUCKET).list('', {
      search: apkObjectPath(projectId),
    });

    if (error) {
      console.error(`Supabase hasApk error (${projectId}):`, error.message || error);
      throw new Error(`Supabase hasApk error (${projectId}): ${error.message || JSON.stringify(error)}`);
    }

    return (data ?? []).some((item) => item.name === apkObjectPath(projectId));
  }

  async getApk(projectId: string): Promise<{ data: Buffer; meta: ApkMeta } | null> {
    const exists = await this.hasApk(projectId);
    if (!exists) return null;

    const { data: apkData, error: apkError } = await this.client.storage
      .from(APK_BUCKET)
      .download(apkObjectPath(projectId));

    if (apkError || !apkData) {
      console.error(`Supabase getApk download error (${projectId}):`, apkError?.message || apkError);
      throw new Error(`Supabase getApk error (${projectId}): ${apkError?.message || JSON.stringify(apkError)}`);
    }

    const meta = await this.readApkMeta(projectId);
    const buffer = Buffer.from(await apkData.arrayBuffer());
    return { data: buffer, meta };
  }

  async putApk(projectId: string, data: Buffer, meta: ApkMeta): Promise<void> {
    const { error: apkError } = await this.client.storage
      .from(APK_BUCKET)
      .upload(apkObjectPath(projectId), data, {
        upsert: true,
        contentType: 'application/vnd.android.package-archive',
      });

    if (apkError) {
      throw new Error(`Supabase putApk error (${projectId}): ${apkError.message}`);
    }

    await this.writeApkMeta(projectId, meta);
  }

  async writeApkMeta(projectId: string, meta: ApkMeta): Promise<void> {
    const metaBody = JSON.stringify(meta);
    const { error } = await this.client.storage
      .from(APK_BUCKET)
      .upload(apkMetaObjectPath(projectId), metaBody, {
        upsert: true,
        contentType: 'application/json',
      });

    if (error) {
      throw new Error(`Supabase writeApkMeta error (${projectId}): ${error.message}`);
    }
  }

  async deleteApk(projectId: string): Promise<void> {
    try {
      const resp = await this.client.storage.from(APK_BUCKET).remove([
        apkObjectPath(projectId),
        apkMetaObjectPath(projectId),
      ]);
      // Supabase client returns { data, error }
      // Log full response when there is an error to aid debugging (network, permission, etc.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyResp: any = resp;
      if (anyResp.error) {
        console.error(`Supabase deleteApk error (${projectId}) response:`, anyResp);
        throw new Error(`Supabase deleteApk error (${projectId}): ${anyResp.error?.message || JSON.stringify(anyResp.error)}`);
      }
      return;
    } catch (err: any) {
      console.error(`Supabase deleteApk exception (${projectId}):`, err);
      // rethrow to let higher level handlers decide response
      throw err;
    }
  }

  async getApkMeta(projectId: string): Promise<ApkMeta | null> {
    const exists = await this.hasApk(projectId);
    if (!exists) return null;
    return this.readApkMeta(projectId);
  }

  async createApkDownloadUrl(projectId: string): Promise<string | null> {
    const exists = await this.hasApk(projectId);
    if (!exists) return null;

    const { data, error } = await this.client.storage
      .from(APK_BUCKET)
      .createSignedUrl(apkObjectPath(projectId), SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      console.error(`Supabase createApkDownloadUrl error (${projectId}):`, error?.message || error);
      throw new Error(`Supabase createApkDownloadUrl error (${projectId}): ${error?.message || JSON.stringify(error)}`);
    }

    return data.signedUrl;
  }

  async createApkUploadUrl(projectId: string): Promise<{ uploadUrl: string; path: string } | null> {
    const objectPath = apkObjectPath(projectId);
    const { data, error } = await this.client.storage
      .from(APK_BUCKET)
      .createSignedUploadUrl(objectPath, { upsert: true });

    if (error || !data?.signedUrl) {
      console.error(`Supabase createApkUploadUrl error (${projectId}):`, error?.message);
      return null;
    }

    return { uploadUrl: data.signedUrl, path: objectPath };
  }

  private async readApkMeta(projectId: string): Promise<ApkMeta> {
    const { data, error } = await this.client.storage.from(APK_BUCKET).download(apkMetaObjectPath(projectId));

    if (error || !data) {
      return { fileName: `${projectId}.apk`, size: '' };
    }

    try {
      return JSON.parse(await data.text()) as ApkMeta;
    } catch {
      return { fileName: `${projectId}.apk`, size: '' };
    }
  }
}

let cachedBackend: StorageBackend | null = null;

export function getStorageBackend(): StorageBackend {
  if (cachedBackend) return cachedBackend;
  cachedBackend =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? 'supabase' : 'file';
  return cachedBackend;
}

export function isSupabaseStorage(): boolean {
  return getStorageBackend() === 'supabase';
}

export function createStorage(dataDir: string = DEFAULT_DATA_DIR): Storage {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    return new SupabaseStorage(supabaseUrl, supabaseKey);
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'apks'), { recursive: true });
  return new FileStorage(dataDir);
}

export const storage = createStorage();

export async function getFileStorageLocalApkPath(projectId: string): Promise<string | null> {
  // Prefer direct helper if available on the storage implementation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyStorage: any = storage as any;
  if (typeof anyStorage.getLocalApkPath === 'function') {
    try {
      return await anyStorage.getLocalApkPath(projectId);
    } catch (err) {
      // ignore
    }
  }
  if (storage instanceof FileStorage) {
    return storage.getLocalApkPath(projectId);
  }
  return null;
}

export async function getFileStorageLocalApkMeta(projectId: string): Promise<ApkMeta> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyStorage: any = storage as any;
  if (typeof anyStorage.getLocalApkMeta === 'function') {
    try {
      return await anyStorage.getLocalApkMeta(projectId);
    } catch (err) {
      // ignore
    }
  }
  if (storage instanceof FileStorage) {
    return storage.getLocalApkMeta(projectId);
  }
  return { fileName: `${projectId}.apk`, size: '' };
}
