import { INITIAL_PROJECTS, INITIAL_STATS } from '../data';
import { APKProject, BugReport, GlobalStats } from '../types';

const API_BASE = '/api';
const PROJECTS_STORAGE_KEY = 'kawaii_projects';
const STATS_STORAGE_KEY = 'kawaii_stats';
const BUG_REPORTS_STORAGE_KEY = 'kawaii_bug_reports';

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

export async function fetchBugReports(): Promise<BugReport[]> {
  try {
    return await apiFetch<BugReport[]>('/bug-reports');
  } catch {
    return readStorageJson<BugReport[]>(BUG_REPORTS_STORAGE_KEY, []);
  }
}

export async function saveBugReports(bugReports: BugReport[]): Promise<void> {
  try {
    await apiFetch('/bug-reports', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bugReports),
    });
  } catch {
    writeStorageJson(BUG_REPORTS_STORAGE_KEY, bugReports);
  }
}
