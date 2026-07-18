import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs, { createReadStream } from 'fs';
import path from 'path';
import { INITIAL_PROJECTS, INITIAL_STATS } from '../src/data.js';
import {
  deleteApk,
  getHealthInfo,
  getProjects,
  getStats,
  headApk,
  putProjects,
  putStats,
  resolveApkGet,
  resolveApkPut,
} from './handlers.js';
import { isSupabaseStorage } from './storage.js';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const DIST_DIR = path.join(ROOT, 'dist');

const DEFAULT_STATS = INITIAL_STATS;

function ensureDataDirs() {
  if (isSupabaseStorage()) return;

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
  console.log('Storage backend:', isSupabaseStorage() ? 'supabase' : 'file');

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', async (_req, res) => {
    res.json(await getHealthInfo());
  });

  app.get('/api/projects', async (_req, res) => {
    res.json(await getProjects());
  });

  app.put('/api/projects', async (req, res) => {
    try {
      const result = await putProjects(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('🐾 Error handling PUT /api/projects:', err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  app.get('/api/stats', async (_req, res) => {
    res.json(await getStats());
  });

  app.put('/api/stats', async (req, res) => {
    try {
      const result = await putStats(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('🐾 Error handling PUT /api/stats:', err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  app.head('/api/apks/:projectId', async (req, res) => {
    res.sendStatus((await headApk(req.params.projectId)) ? 200 : 404);
  });

  app.get('/api/apks/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const result = await resolveApkGet(projectId);

      if (result.kind === 'not_found') {
        res.sendStatus(404);
        return;
      }

      const fileName = result.fileName || `${projectId}.apk`;
      res.setHeader('X-File-Name', encodeURIComponent(fileName));
      if (typeof result.size === 'string' && result.size.length > 0) {
        res.setHeader('X-File-Size', result.size);
      }

      if (result.kind === 'redirect') {
        res.setHeader('Location', result.url);
        res.status(302).end();
        return;
      }

      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/"/g, '')}"`);

      if (result.kind === 'stream') {
        createReadStream(result.filePath).pipe(res);
        return;
      }

      res.send(result.data);
    } catch (err: any) {
      console.error(`🐾 Error handling GET /api/apks/${req.params.projectId}:`, err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  app.put('/api/apks/:projectId', express.raw({ limit: '500mb', type: '*/*' }), async (req, res) => {
    try {
      const contentType = String(req.headers['content-type'] || '');

      if (contentType.includes('application/json')) {
        const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as {
          mode?: string;
          fileName?: string;
          size?: string;
        };
        const result = await resolveApkPut(req.params.projectId, {
          mode: String(body.mode || ''),
          fileName: body.fileName ? String(body.fileName) : undefined,
          size: body.size ? String(body.size) : undefined,
        });
        res.json(result);
        return;
      }

      const fileName = decodeURIComponent(String(req.headers['x-file-name'] || `${req.params.projectId}.apk`));
      const size = String(req.headers['x-file-size'] || '');
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      console.log(`🐾 Received PUT /api/apks/${req.params.projectId} - contentType=${contentType} fileName=${fileName} sizeHeader=${size} bytes=${body.length}`);
      const result = await resolveApkPut(req.params.projectId, { rawBody: body, fileName, size });
      console.log(`🐾 Completed putApk for ${req.params.projectId}`);
      res.json(result);
    } catch (err: any) {
      console.error('🐾 Error handling PUT /api/apks/:projectId:', err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  app.delete('/api/apks/:projectId', async (req, res) => {
    try {
      const result = await deleteApk(req.params.projectId);
      res.json(result);
    } catch (err: any) {
      console.error(`🐾 Error handling DELETE /api/apks/${req.params.projectId}:`, err);
      res.status(500).json({ error: err?.message || String(err) });
    }
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
