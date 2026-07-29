import { APKProject } from '../types';
import { getProjectApkUrl } from './apkUrl';

export function isWebsiteProject(project: APKProject): boolean {
  return project.projectType === 'website';
}

/** Normalize and return the URL users should open (APK or live site). */
export function getProjectLaunchUrl(project: APKProject): string {
  if (isWebsiteProject(project) && project.siteUrl?.trim()) {
    const url = project.siteUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  }
  return getProjectApkUrl(project);
}
