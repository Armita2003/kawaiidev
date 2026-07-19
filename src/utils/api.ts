import { INITIAL_PROJECTS, INITIAL_STATS } from '../data';
import { APKProject, GlobalStats } from '../types';

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
  return INITIAL_PROJECTS.map((project) => ({ ...project }));
}

export async function saveProjects(_projects: APKProject[]): Promise<void> {
  return;
}

export async function fetchStats(): Promise<GlobalStats> {
  try {
    return await apiFetch<GlobalStats>('/stats');
  } catch {
    return readStorageJson<GlobalStats>(STATS_STORAGE_KEY, INITIAL_STATS);
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
