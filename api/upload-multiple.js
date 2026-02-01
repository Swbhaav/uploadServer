// api/upload-multiple.js - handles POST /api/upload-multiple
const express = require('express');
const multer = require('multer');
const { put } = require('@vercel/blob');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload-multiple', upload.array('videos', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No videos uploaded' });
    }

    const results = [];
    for (const file of req.files) {
      const blob = await put(file.originalname, file.buffer, { access: 'public' });
      results.push({ url: blob.url, filename: file.originalname });
    }

    res.json({
      success: true,
      message: `${results.length} video(s) uploaded successfully`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = app;
