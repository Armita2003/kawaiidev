import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { INITIAL_PROJECTS, INITIAL_STATS } from '../src/data.js';
import { createStorage, mapJsonKey } from '../server/storage.js';

async function seedSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before seeding.');
    process.exit(1);
  }

  const storage = createStorage();
  const dataDir = path.join(process.cwd(), 'data');
  const apksDir = path.join(dataDir, 'apks');

  const existingProjects = await storage.readJson('projects.json', null as typeof INITIAL_PROJECTS | null);
  if (!existingProjects || existingProjects.length === 0) {
    await storage.writeJson('projects.json', INITIAL_PROJECTS);
    console.log(`Seeded projects (${INITIAL_PROJECTS.length} items)`);
  } else {
    console.log(`Projects already present (${existingProjects.length} items), skipping`);
  }

  const existingStats = await storage.readJson('stats.json', null as typeof INITIAL_STATS | null);
  if (!existingStats) {
    await storage.writeJson('stats.json', INITIAL_STATS);
    console.log('Seeded stats');
  } else {
    console.log('Stats already present, skipping');
  }

  if (fs.existsSync(apksDir)) {
    const apkFiles = fs.readdirSync(apksDir).filter((name) => name.endsWith('.apk'));
    for (const fileName of apkFiles) {
      const projectId = fileName.replace(/\.apk$/, '');
      if (await storage.hasApk(projectId)) {
        console.log(`APK already stored for ${projectId}, skipping`);
        continue;
      }

      const apkPath = path.join(apksDir, fileName);
      const metaPath = path.join(apksDir, `${projectId}.meta.json`);
      const meta = fs.existsSync(metaPath)
        ? (JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { fileName: string; size: string })
        : { fileName, size: '' };

      await storage.putApk(projectId, fs.readFileSync(apkPath), meta);
      console.log(`Uploaded APK for ${projectId}`);
    }
  }

  console.log('Seed complete.');
  console.log(`Storage keys use: ${mapJsonKey('projects.json')}, ${mapJsonKey('stats.json')}`);
}

seedSupabase().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
