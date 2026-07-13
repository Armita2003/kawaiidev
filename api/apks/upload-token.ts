import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload } from '@vercel/blob/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            projectId: clientPayload || '',
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Serverless direct browser upload completed:', blob, tokenPayload);
      },
    });

    res.status(200).json(jsonResponse);
  } catch (err: any) {
    console.error('Upload token error:', err);
    res.status(400).json({ error: err?.message || String(err) });
  }
}
