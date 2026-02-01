// api/index.js
const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ message: 'Video Upload Server is running on Vercel!' });
});

// Export instead of app.listen
module.exports = app;
