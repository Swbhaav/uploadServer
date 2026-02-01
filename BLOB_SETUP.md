# Vercel Blob setup (fix "Failed to retrieve the client token")

Uploads **over 4MB** use client upload and need a Blob store. Follow these steps once.

## 1. Create a Blob store (if you don’t have one)

1. Open **[Vercel Dashboard](https://vercel.com)** → your project (**upload-server**).
2. Go to the **Storage** tab.
3. Click **Connect Database** (or **Create Database**).
4. Choose **Blob** → **Create a new Blob store**.
5. Name it (e.g. `video-store`) → **Create**.
6. When asked, select the environments (Production, Preview) so the token is added to the project.

If the store is created and linked to the project, **BLOB_READ_WRITE_TOKEN** is added automatically.

## 2. Confirm the token is set

1. In the project, go to **Settings** → **Environment Variables**.
2. You should see **BLOB_READ_WRITE_TOKEN** (added when you connected the Blob store).
3. If it’s missing: open **Storage** → your Blob store → **Connect** / **.env.local** and connect it to this project again so the token is created.

## 3. Redeploy

- **Deployments** → open the latest deployment → **⋯** → **Redeploy** (with or without cache),  
  **or** push a new commit so a new deployment runs.

After redeploying, try uploading again. Large files will use client upload; files under 4.5MB also work via standard upload if the token isn’t set yet.
