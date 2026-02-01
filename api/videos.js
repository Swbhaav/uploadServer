// api/videos.js - handles GET /api/videos (list all: Blob + folder)
const express = require('express');
const path = require('path');
const fs = require('fs');
const { list } = require('@vercel/blob');

const app = express();

app.get('/api/videos', async (req, res) => {
  try {
    const data = [];

    // 1. Videos from Vercel Blob (uploaded via the app)
    try {
      const blobs = await list();
      blobs.blobs.forEach((b) => {
        data.push({
          url: b.url,
          filename: b.pathname || b.url.split('/').pop() || 'video',
          source: 'blob'
        });
      });
    } catch (blobErr) {
      // Blob may not be configured locally
    }

    // 2. Videos from api/videos folder (static .mp4 files in repo)
    const folderPath = path.join(__dirname, 'videos');
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.mp4'));
      files.forEach((filename) => {
        data.push({
          url: `/api/videos/${encodeURIComponent(filename)}`,
          filename,
          source: 'folder'
        });
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [], error: error.message });
  }
});

module.exports = app;
