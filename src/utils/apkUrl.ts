import { APKProject } from '../types';

/** Resolve the download URL for a project's APK. */
export function getProjectApkUrl(project: APKProject): string {
  if (project.apk) {
    if (project.apk.startsWith('http://') || project.apk.startsWith('https://') || project.apk.startsWith('/')) {
      return project.apk;
    }
    return `/apks/${project.apk}`;
  }
  return `/api/apks/${encodeURIComponent(project.id)}`;
}
