import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createReadStream } from 'fs';
import { deleteApk, headApk, resolveApkGet, resolveApkPut } from '../../server/handlers.js';
import { readRawBody } from '../../server/readBody.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

function isJsonRequest(req: VercelRequest): boolean {
  const contentType = String(req.headers['content-type'] || '');
  return contentType.includes('application/json');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const projectId = String(req.query.projectId || '');

  if (!projectId) {
    res.status(400).json({ error: 'Missing projectId' });
    return;
  }

  try {
    if (req.method === 'HEAD') {
      res.status((await headApk(projectId)) ? 200 : 404).end();
      return;
    }

    if (req.method === 'GET') {
      const result = await resolveApkGet(projectId);
      if (result.kind === 'not_found') {
        res.status(404).end();
        return;
      }

      res.setHeader('X-File-Name', encodeURIComponent(result.fileName));
      res.setHeader('X-File-Size', result.size);

      if (result.kind === 'redirect') {
        res.setHeader('Location', result.url);
        res.status(302).end();
        return;
      }

      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName.replace(/"/g, '')}"`);

      if (result.kind === 'stream') {
        createReadStream(result.filePath).pipe(res);
        return;
      }

      res.status(200).send(result.data);
      return;
    }

    if (req.method === 'PUT') {
      if (isJsonRequest(req)) {
        const raw = await readRawBody(req);
        const body = JSON.parse(raw.toString('utf8')) as {
          mode?: string;
          fileName?: string;
          size?: string;
        };
        const result = await resolveApkPut(projectId, {
          mode: String(body.mode || ''),
          fileName: body.fileName ? String(body.fileName) : undefined,
          size: body.size ? String(body.size) : undefined,
        });
        res.status(200).json(result);
        return;
      }

      const rawBody = await readRawBody(req);
      const fileName = decodeURIComponent(String(req.headers['x-file-name'] || `${projectId}.apk`));
      const size = String(req.headers['x-file-size'] || '');
      res.status(200).json(await resolveApkPut(projectId, { rawBody, fileName, size }));
      return;
    }

    if (req.method === 'DELETE') {
      res.status(200).json(await deleteApk(projectId));
      return;
    }

    res.setHeader('Allow', 'GET, PUT, DELETE, HEAD');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(`apk api error (${projectId}):`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
