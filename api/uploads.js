// api/upload.js
const express = require('express');
const multer = require('multer');
const { put } = require('@vercel/blob');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video uploaded' });
    }

    // Store in Vercel Blob
    const blob = await put(req.file.originalname, req.file.buffer, { access: 'public' });

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      url: blob.url
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = app;
