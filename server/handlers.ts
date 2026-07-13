import { INITIAL_PROJECTS } from '../src/data.js';
import { storage } from './storage.js';

const PROJECTS_KEY = 'projects.json';
const STATS_KEY = 'stats.json';
const DEFAULT_STATS = { boops: 0, bugs: 0, coffeeLitres: 0 };

export async function getProjects() {
  return storage.readJson(PROJECTS_KEY, INITIAL_PROJECTS);
}

export async function putProjects(body: unknown) {
  await storage.writeJson(PROJECTS_KEY, body);
  return { ok: true as const };
}

export async function getStats() {
  return storage.readJson(STATS_KEY, DEFAULT_STATS);
}

export async function putStats(body: unknown) {
  await storage.writeJson(STATS_KEY, body);
  return { ok: true as const };
}

export async function headApk(projectId: string) {
  return storage.hasApk(projectId);
}

export async function getApk(projectId: string) {
  return storage.getApk(projectId);
}

export async function getApkUrl(projectId: string) {
  return storage.getApkUrl(projectId);
}

export async function putApk(projectId: string, data: Buffer, fileName: string, size: string) {
  await storage.putApk(projectId, data, { fileName, size });
  return { ok: true as const };
}

export async function deleteApk(projectId: string) {
  await storage.deleteApk(projectId);
  return { ok: true as const };
}

export async function getStorageStatus() {
  return storage.getStatus();
}
