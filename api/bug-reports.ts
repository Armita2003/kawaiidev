import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBugReports, putBugReports } from '../server/handlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      res.status(200).json(await getBugReports());
      return;
    }

    if (req.method === 'PUT') {
      res.status(200).json(await putBugReports(req.body));
      return;
    }

    res.setHeader('Allow', 'GET, PUT');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('bug-reports api error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
