import { INITIAL_PROJECTS, INITIAL_STATS } from '../src/data.js';
import fs from 'fs';
import path from 'path';
import {
  getFileStorageLocalApkMeta,
  getFileStorageLocalApkPath,
  getStorageBackend,
  isSupabaseStorage,
  storage,
} from './storage.js';

const PROJECTS_KEY = 'projects.json';
const STATS_KEY = 'stats.json';

export async function getProjects() {
  return INITIAL_PROJECTS.map((project) => ({ ...project }));
}

export async function putProjects(_body: unknown) {
  return { ok: true as const };
}

export async function getStats() {
  return storage.readJson(STATS_KEY, INITIAL_STATS);
}

export async function putStats(body: unknown) {
  await storage.writeJson(STATS_KEY, body);
  return { ok: true as const };
}

export async function getHealthInfo() {
  return {
    ok: true as const,
    service: 'kawaiidev-api',
    storage: getStorageBackend(),
  };
}

export async function headApk(projectId: string) {
  return storage.hasApk(projectId);
}

export async function getApk(projectId: string) {
  return storage.getApk(projectId);
}

export async function getApkDownloadUrl(projectId: string) {
  if (!storage.createApkDownloadUrl) return null;
  return storage.createApkDownloadUrl(projectId);
}

export async function getApkUploadUrl(projectId: string) {
  if (!storage.createApkUploadUrl) return null;
  return storage.createApkUploadUrl(projectId);
}

export async function completeApkUpload(projectId: string, fileName: string, size: string) {
  if (storage.writeApkMeta) {
    await storage.writeApkMeta(projectId, { fileName, size });
  }
  return { ok: true as const };
}

export async function putApk(projectId: string, data: Buffer, fileName: string, size: string) {
  await storage.putApk(projectId, data, { fileName, size });
  return { ok: true as const };
}

export async function deleteApk(projectId: string) {
  await storage.deleteApk(projectId);
  return { ok: true as const };
}

export async function getPublicApks() {
  const catalogPath = path.join(process.cwd(), 'data', 'apks', 'catalog.json');
  if (fs.existsSync(catalogPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as Array<{ name?: string; url?: string; size?: string }>;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item.name === 'string' && typeof item.url === 'string')
          .map((item) => ({
            name: item.name as string,
            url: item.url as string,
            size: typeof item.size === 'string' ? item.size : '',
          }));
      }
    } catch (err) {
      console.warn('Failed to read APK catalog from data/apks/catalog.json:', err);
    }
  }

  const publicDir = path.join(process.cwd(), 'public', 'apks');
  if (!fs.existsSync(publicDir)) return [];

  try {
    const files = fs.readdirSync(publicDir).filter((f) => f.toLowerCase().endsWith('.apk'));
    return files.map((file) => {
      const fp = path.join(publicDir, file);
      let size = '';
      try {
        const stat = fs.statSync(fp);
        size = `${Math.round(stat.size / 1024)} KB`;
      } catch {
        size = '';
      }
      return { name: file, url: `/apks/${encodeURIComponent(file)}`, size };
    });
  } catch (err) {
    console.error('Failed to list public/apks:', err);
    return [];
  }
}

export type ApkGetResult =
  | { kind: 'redirect'; url: string; fileName: string; size: string }
  | { kind: 'stream'; filePath: string; fileName: string; size: string }
  | { kind: 'buffer'; data: Buffer; fileName: string; size: string }
  | { kind: 'not_found' };

export async function resolveApkGet(projectId: string): Promise<ApkGetResult> {
  // Prefer using signed download URL when available on the storage implementation.
  if (storage.createApkDownloadUrl) {
    try {
      const downloadUrl = await storage.createApkDownloadUrl(projectId);
      if (downloadUrl) {
        const meta = storage.getApkMeta
          ? (await storage.getApkMeta(projectId)) ?? { fileName: `${projectId}.apk`, size: '' }
          : { fileName: `${projectId}.apk`, size: '' };
        return {
          kind: 'redirect',
          url: downloadUrl,
          fileName: meta.fileName,
          size: meta.size,
        };
      }
    } catch (err) {
      console.error(`Error creating download URL for ${projectId}:`, err);
      // fall through to try local/file/buffer retrieval
    }
  }

  // Try file-backed local path helpers first (works when storage switched to local file)
  const localPath = await getFileStorageLocalApkPath(projectId);
  if (localPath) {
    const meta = await getFileStorageLocalApkMeta(projectId);
    return {
      kind: 'stream',
      filePath: localPath,
      fileName: meta.fileName,
      size: meta.size,
    };
  }

  const apk = await getApk(projectId);
  if (!apk) return { kind: 'not_found' };

  return {
    kind: 'buffer',
    data: apk.data,
    fileName: apk.meta.fileName,
    size: apk.meta.size,
  };
}

export async function resolveApkPut(
  projectId: string,
  options: {
    mode?: string;
    fileName?: string;
    size?: string;
    rawBody?: Buffer;
  },
) {
  if (options.mode === 'signed-upload') {
    if (!storage.createApkUploadUrl) {
      return { supported: false as const };
    }
    const signed = await storage.createApkUploadUrl(projectId);
    if (!signed) {
      throw new Error('Failed to create signed upload URL');
    }
    return { supported: true as const, ...signed };
  }

  if (options.mode === 'complete-upload') {
    const fileName = options.fileName || `${projectId}.apk`;
    const size = options.size || '';
    return completeApkUpload(projectId, fileName, size);
  }

  const fileName = options.fileName || `${projectId}.apk`;
  const size = options.size || '';
  const body = options.rawBody ?? Buffer.alloc(0);
  return putApk(projectId, body, fileName, size);
}
