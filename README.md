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

## Deploy to Vercel

1. Push to GitHub and connect the repo in Vercel
2. In Vercel Dashboard → **Storage** → create a **Blob** store and connect it to the project
3. Redeploy — Vercel sets `BLOB_READ_WRITE_TOKEN` automatically

Without Blob storage, the API routes exist but data won't persist across devices.
