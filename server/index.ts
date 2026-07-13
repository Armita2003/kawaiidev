import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_PROJECTS } from '../src/data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const APKS_DIR = path.join(DATA_DIR, 'apks');
const DIST_DIR = path.join(ROOT, 'dist');

const DEFAULT_STATS = { boops: 0, bugs: 0, coffeeLitres: 0 };

function ensureDataDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(APKS_DIR, { recursive: true });

  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(INITIAL_PROJECTS, null, 2));
  }
  if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(DEFAULT_STATS, null, 2));
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function createServer() {
  ensureDataDirs();

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/projects', (_req, res) => {
    res.json(readJson(PROJECTS_FILE, INITIAL_PROJECTS));
  });

  app.put('/api/projects', (req, res) => {
    writeJson(PROJECTS_FILE, req.body);
    res.json({ ok: true });
  });

  app.get('/api/stats', (_req, res) => {
    res.json(readJson(STATS_FILE, DEFAULT_STATS));
  });

  app.put('/api/stats', (req, res) => {
    writeJson(STATS_FILE, req.body);
    res.json({ ok: true });
  });

  app.head('/api/apks/:projectId', (req, res) => {
    const apkPath = path.join(APKS_DIR, `${req.params.projectId}.apk`);
    if (!fs.existsSync(apkPath)) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(200);
  });

  app.get('/api/apks/:projectId', (req, res) => {
    const metaPath = path.join(APKS_DIR, `${req.params.projectId}.json`);
    const apkPath = path.join(APKS_DIR, `${req.params.projectId}.apk`);

    if (!fs.existsSync(apkPath)) {
      res.sendStatus(404);
      return;
    }

    const meta = fs.existsSync(metaPath)
      ? readJson<{ fileName: string; size: string }>(metaPath, { fileName: `${req.params.projectId}.apk`, size: '' })
      : { fileName: `${req.params.projectId}.apk`, size: '' };

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('X-File-Name', encodeURIComponent(meta.fileName));
    res.setHeader('X-File-Size', meta.size);
    fs.createReadStream(apkPath).pipe(res);
  });

  app.put('/api/apks/:projectId', express.raw({ limit: '500mb', type: 'application/octet-stream' }), (req, res) => {
    const apkPath = path.join(APKS_DIR, `${req.params.projectId}.apk`);
    const metaPath = path.join(APKS_DIR, `${req.params.projectId}.json`);
    const fileName = decodeURIComponent(String(req.headers['x-file-name'] || `${req.params.projectId}.apk`));
    const size = String(req.headers['x-file-size'] || '');

    fs.writeFileSync(apkPath, req.body);
    writeJson(metaPath, { fileName, size });
    res.json({ ok: true });
  });

  app.delete('/api/apks/:projectId', (req, res) => {
    const apkPath = path.join(APKS_DIR, `${req.params.projectId}.apk`);
    const metaPath = path.join(APKS_DIR, `${req.params.projectId}.json`);
    if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    res.json({ ok: true });
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
