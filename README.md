## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app (includes API server + frontend):
   `npm run dev`
3. Kill Working Port :
   `Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }`

## Production

1. Build the frontend: `npm run build`
2. Start the server: `npm start`

Without Supabase, APK data is stored server-side in the `data/` folder on the machine running the server.

**Stats & bugs:** Coffee boops, heart likes, and bug reports are saved to the backend store. With Supabase configured, all devices see the same data automatically.

## Supabase setup (shared data across devices)

Use Supabase when deploying to Vercel or whenever multiple devices should share the same projects, stats, and APK uploads.

### 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Open **SQL Editor** and run:

```sql
create table if not exists app_data (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into app_data (key, value) values
  ('projects', '[]'::jsonb),
  ('stats', '{"boops":0,"bugs":0,"coffeeLitres":0,"likes":0}'::jsonb)
on conflict (key) do nothing;
```

3. Open **Storage** and create a **private** bucket named `apks`.
4. Copy your **Project URL** and **service_role** key from **Project Settings → API**.

### 2. Configure environment variables

Copy `.env.example` to `.env` and set the same values for both local development and Vercel:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

This ensures local changes, project updates, and APK uploads all read and write to the same shared Supabase backend.

Never expose the service role key in frontend code. It is server-only.

### 3. Seed initial data (optional)

If you have existing local data or want the demo projects in Supabase:

```bash
npm run seed:supabase
```

### 4. Deploy to Vercel

1. Push to GitHub and connect the repo in Vercel.
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in **Project Settings → Environment Variables**.
3. Redeploy.

Projects and stats sync immediately through PostgreSQL. APK uploads on Vercel use signed URLs to upload directly to Supabase Storage (avoiding Vercel's request body size limit).

Check `/api/health` to confirm the active backend: `{ "ok": true, "storage": "supabase" }`.

### Local development without Supabase

Omit the Supabase env vars and the app falls back to the `data/` directory. Optionally override the path with `DATA_DIR=./data`.

**Linking APKs:** Add an `apk` field to each project in `data.ts` (or via admin panel):

- Local file: `apk: '/apks/myapp.apk'` (put the file in `public/apks/`)
- Server file: `apk: '/api/apks/project-id'` (upload via admin panel or place in `data/apks/`)
- External URL: `apk: 'https://example.com/app.apk'`
- Omit `apk` to default to `/api/apks/{project-id}`
