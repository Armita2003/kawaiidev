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

APK data is stored server-side in the `data/` folder so all devices see the same projects.

**Stats & bugs:** Coffee boops, heart likes, and bug reports are saved to `data/stats.json` and `data/projects.json`. Commit these files to keep counts in sync across machines.

**Linking APKs:** Add an `apk` field to each project in `data.ts` (or via admin panel):
- Local file: `apk: '/apks/myapp.apk'` (put the file in `public/apks/`)
- Server file: `apk: '/api/apks/project-id'` (put the file in `data/apks/`)
- External URL: `apk: 'https://example.com/app.apk'`
- Omit `apk` to default to `/api/apks/{project-id}`

## Deploy to Vercel

1. Push to GitHub and connect the repo in Vercel
2. Add APK files to `data/apks/` (e.g. `myproject.apk` + `myproject.meta.json`) and commit them to the repo
3. Redeploy — APKs are served directly from the bundled `data/` folder
