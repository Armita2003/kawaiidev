import { APKProject, GlobalStats } from '../types';

const API_BASE = '/api';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchProjects(): Promise<APKProject[]> {
  return apiFetch<APKProject[]>('/projects');
}

export async function saveProjects(projects: APKProject[]): Promise<void> {
  await apiFetch('/projects', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projects),
  });
}

export async function fetchStats(): Promise<GlobalStats> {
  return apiFetch<GlobalStats>('/stats');
}

export async function saveStats(stats: GlobalStats): Promise<void> {
  await apiFetch('/stats', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stats),
  });
}
