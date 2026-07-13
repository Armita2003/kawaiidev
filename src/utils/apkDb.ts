export interface StoredApk {
  projectId: string;
  blob: Blob;
  fileName: string;
  size: string;
}

export async function saveApkFile(projectId: string, blob: Blob, fileName: string, size: string): Promise<void> {
  const res = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-File-Name': encodeURIComponent(fileName),
      'X-File-Size': size,
    },
    body: blob,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload APK: ${res.status}`);
  }
}

export async function getApkFile(projectId: string): Promise<StoredApk | null> {
  try {
    const headRes = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, { method: 'HEAD' });
    if (!headRes.ok) return null;

    const res = await fetch(`/api/apks/${encodeURIComponent(projectId)}`);
    if (!res.ok) return null;

    const blob = await res.blob();
    const fileName = decodeURIComponent(res.headers.get('X-File-Name') || `${projectId}.apk`);
    const size = res.headers.get('X-File-Size') || '';

    return { projectId, blob, fileName, size };
  } catch (err) {
    console.warn('APK retrieval failed:', err);
    return null;
  }
}

export async function deleteApkFile(projectId: string): Promise<void> {
  try {
    const res = await fetch(`/api/apks/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(`Failed to delete APK: ${res.status}`);
    }
  } catch (err) {
    console.warn('APK delete failed:', err);
  }
}
