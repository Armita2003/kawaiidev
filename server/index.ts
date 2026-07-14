import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs, { createReadStream } from 'fs';
import path from 'path';
import { handleUpload } from '@vercel/blob/client';
import { INITIAL_PROJECTS } from '../src/data.js';
import {
  deleteApk,
  getApk,
  getProjects,
  getStats,
  headApk,
  putApk,
  putProjects,
  putStats,
  getStorageStatus,
} from './handlers.js';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const APKS_DIR = path.join(DATA_DIR, 'apks');
const DIST_DIR = path.join(ROOT, 'dist');

const DEFAULT_STATS = { boops: 0, bugs: 0, coffeeLitres: 0 };

function ensureDataDirs() {
  fs.mkdirSync(path.join(DATA_DIR, 'apks'), { recursive: true });

  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(INITIAL_PROJECTS, null, 2));
  }
  if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(DEFAULT_STATS, null, 2));
  }
}

async function createServer() {
  ensureDataDirs();

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/projects', async (_req, res) => {
    res.json(await getProjects());
  });

  app.get('/api/storage-status', async (_req, res) => {
    try {
      const status = await getStorageStatus();
      console.log('🐾 Storage Status request:', status.connectionOk ? 'Vercel Blob is active ✅' : `Local-only fallback (${status.error || 'No token'}) 📁`);
      res.json(status);
    } catch (err: any) {
      console.error('Express storage status error:', err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  app.post('/api/apks/upload-token', async (req, res) => {
    try {
      console.log('🐾 Received upload token request from client browser.');
      const jsonResponse = await handleUpload({
        body: req.body,
        request: req,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          console.log(`🐾 Handshaking Vercel Blob token generation for path: ${pathname}, payload: ${clientPayload}`);
          return {
            addRandomSuffix: false,
            tokenPayload: JSON.stringify({
              projectId: clientPayload || '',
            }),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          console.log('🐾 Express direct browser upload complete callback triggered on server:', blob, tokenPayload);
        },
      });
      res.json(jsonResponse);
    } catch (err: any) {
      console.error('Express upload token error:', err);
      res.status(400).json({ error: err?.message || String(err) });
    }
  });

  app.put('/api/projects', async (req, res) => {
    res.json(await putProjects(req.body));
  });

  app.get('/api/stats', async (_req, res) => {
    res.json(await getStats());
  });

  app.put('/api/stats', async (req, res) => {
    res.json(await putStats(req.body));
  });

  app.head('/api/apks/:projectId', async (req, res) => {
    res.sendStatus((await headApk(req.params.projectId)) ? 200 : 404);
  });

  app.get('/api/apks/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const localPath = path.join(APKS_DIR, `${projectId}.apk`);

    // Stream local files directly so large APKs start downloading immediately
    if (fs.existsSync(localPath)) {
      const metaPath = path.join(APKS_DIR, `${projectId}.meta.json`);
      let fileName = `${projectId}.apk`;
      let size = '';
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { fileName?: string; size?: string };
          fileName = meta.fileName || fileName;
          size = meta.size || '';
        } catch {
          // use defaults
        }
      }
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/"/g, '')}"`);
      res.setHeader('X-File-Name', encodeURIComponent(fileName));
      res.setHeader('X-File-Size', size);
      createReadStream(localPath).pipe(res);
      return;
    }

    const apk = await getApk(projectId);
    if (!apk) {
      res.sendStatus(404);
      return;
    }

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${apk.meta.fileName.replace(/"/g, '')}"`);
    res.setHeader('X-File-Name', encodeURIComponent(apk.meta.fileName));
    res.setHeader('X-File-Size', apk.meta.size);
    res.send(apk.data);
  });

  app.put('/api/apks/:projectId', express.raw({ limit: '500mb', type: 'application/octet-stream' }), async (req, res) => {
    try {
      const fileName = decodeURIComponent(String(req.headers['x-file-name'] || `${req.params.projectId}.apk`));
      const size = String(req.headers['x-file-size'] || '');
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      console.log(`🐾 Received PUT /api/apks/${req.params.projectId} - fileName=${fileName} sizeHeader=${size} bytes=${body.length}`);
      const result = await putApk(req.params.projectId, body, fileName, size);
      console.log(`🐾 Completed putApk for ${req.params.projectId}`);
      res.json(result);
    } catch (err: any) {
      console.error('🐾 Error handling PUT /api/apks/:projectId:', err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  app.delete('/api/apks/:projectId', async (req, res) => {
    res.json(await deleteApk(req.params.projectId));
  });

  const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';

  if (isProd && fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: ROOT,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`KawaiiDev server running at http://localhost:${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the other process first, or run with a different port:`);
      console.error(`  $env:PORT=3001; npm start`);
      process.exit(1);
    }
    throw err;
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
