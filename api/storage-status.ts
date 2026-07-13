import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStorageStatus } from '../server/handlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      res.status(200).json(await getStorageStatus());
      return;
    }

    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('storage-status api error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
