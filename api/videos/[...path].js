// api/videos/[...path].js - handles DELETE /api/videos/:filename
const { list, del } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const pathSegments = req.query.path || [];
  const filename = decodeURIComponent(pathSegments[0] || '');

  if (!filename) {
    return res.status(400).json({ success: false, message: 'Filename required' });
  }

  try {
    const { blobs } = await list();
    const blob = blobs.find(
      (b) => b.pathname === filename || b.pathname?.endsWith(filename) || b.url?.includes(filename)
    );

    if (!blob) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    await del(blob.url);
    res.status(200).json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
