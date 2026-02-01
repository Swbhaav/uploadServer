// api/videos.js
const express = require('express');
const { list } = require('@vercel/blob');

const app = express();

app.get('/api/videos', async (req, res) => {
  try {
    const blobs = await list(); // fetch all blobs
    const videos = blobs.blobs.map(b => b.url);

    res.json({ videos });
  } catch (error) {
    res.status(500).json({ videos: [], error: error.message });
  }
});

module.exports = app;
