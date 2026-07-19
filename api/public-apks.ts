import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPublicApks } from '../server/handlers.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const list = await getPublicApks();
    res.status(200).json(list);
  } catch (err) {
    console.error('public-apks api error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
