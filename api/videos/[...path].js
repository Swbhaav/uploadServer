// api/videos/[...path].js - GET: stream file from folder | DELETE: remove from Blob
const path = require('path');
const fs = require('fs');
const { list, del } = require('@vercel/blob');

module.exports = async (req, res) => {
  // Vercel may pass path as req.query.path (array or string) or we parse from URL
  const pathParam = req.query.path;
  let filename = '';
  if (Array.isArray(pathParam) && pathParam.length > 0) {
    filename = pathParam[0];
  } else if (typeof pathParam === 'string') {
    filename = pathParam;
  }
  if (!filename && req.url) {
    const pathPart = (req.url || '').split('?')[0];
    const prefix = '/api/videos/';
    filename = pathPart.startsWith(prefix) ? pathPart.slice(prefix.length) : '';
  }
  try {
    filename = decodeURIComponent(filename || '').trim();
  } catch {
    filename = (filename || '').trim();
  }

  if (!filename) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ success: false, message: 'Filename required' });
  }

  // GET: serve video file from api/videos folder (so folder videos play)
  if (req.method === 'GET') {
    const resolvedPath = path.resolve(path.join(__dirname, filename));
    const resolvedDir = path.resolve(__dirname);
    if (!resolvedPath.startsWith(resolvedDir)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    res.setHeader('Content-Type', 'video/mp4');
    fs.createReadStream(resolvedPath).pipe(res);
    return;
  }

  // DELETE: only for Blob-stored videos (folder videos can't be deleted via API)
  if (req.method !== 'DELETE') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'application/json');
  try {
    const { blobs } = await list();
    const blob = blobs.find(
      (b) => b.pathname === filename || b.pathname?.endsWith(filename) || b.url?.includes(filename)
    );

    if (!blob) {
      return res.status(404).json({ success: false, message: 'Video not found in Blob' });
    }

    await del(blob.url);
    res.status(200).json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
