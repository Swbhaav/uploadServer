// api/videos.js - handles GET /api/videos (list all)
const express = require('express');
const { list } = require('@vercel/blob');

const app = express();

app.get('/api/videos', async (req, res) => {
  try {
    const blobs = await list();
    const data = blobs.blobs.map(b => ({
      url: b.url,
      filename: b.pathname || b.url.split('/').pop() || 'video'
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [], error: error.message });
  }
});

module.exports = app;
