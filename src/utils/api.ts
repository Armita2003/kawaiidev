import { INITIAL_PROJECTS } from '../data';
import { APKProject, GlobalStats, StorageStatus } from '../types';

const API_BASE = '/api';
const PROJECTS_STORAGE_KEY = 'kawaii_projects';
const STATS_STORAGE_KEY = 'kawaii_stats';

function readStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorageJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchProjects(): Promise<APKProject[]> {
  try {
    return await apiFetch<APKProject[]>('/projects');
  } catch {
    return readStorageJson<APKProject[]>(PROJECTS_STORAGE_KEY, INITIAL_PROJECTS);
  }
}

export async function saveProjects(projects: APKProject[]): Promise<void> {
  try {
    await apiFetch('/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projects),
    });
  } catch {
    writeStorageJson(PROJECTS_STORAGE_KEY, projects);
  }
}

export async function fetchStats(): Promise<GlobalStats> {
  try {
    return await apiFetch<GlobalStats>('/stats');
  } catch {
    return readStorageJson<GlobalStats>(STATS_STORAGE_KEY, { boops: 0, bugs: 0, coffeeLitres: 0 });
  }
}

export async function saveStats(stats: GlobalStats): Promise<void> {
  try {
    await apiFetch('/stats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
  } catch {
    writeStorageJson(STATS_STORAGE_KEY, stats);
  }
}

export async function fetchStorageStatus(): Promise<StorageStatus> {
  try {
    return await apiFetch<StorageStatus>('/storage-status');
  } catch (err: any) {
    return {
      hasToken: false,
      tokenPreview: '',
      connectionOk: false,
      error: err?.message || String(err),
    };
  }
}
