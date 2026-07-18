import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteApk, getApk, headApk, putApk } from '../../server/handlers.js';
import { readRawBody } from '../../server/readBody.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
      const apk = await getApk(projectId);
      if (!apk) {
        res.status(404).end();
        return;
      }

      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('X-File-Name', encodeURIComponent(apk.meta.fileName));
      res.setHeader('X-File-Size', apk.meta.size);
      res.status(200).send(apk.data);
      return;
    }

    if (req.method === 'PUT') {
      const body = await readRawBody(req);
      const fileName = decodeURIComponent(String(req.headers['x-file-name'] || `${projectId}.apk`));
      const size = String(req.headers['x-file-size'] || '');
      res.status(200).json(await putApk(projectId, body, fileName, size));
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
