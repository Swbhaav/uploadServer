// api/videos.js - List all videos from Blob storage
const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // List all blobs in storage
    const { blobs } = await list();

    // Filter only video files and format response
    const videos = blobs
      .filter(blob => {
        const ext = blob.pathname.toLowerCase();
        return ext.endsWith('.mp4') || 
               ext.endsWith('.mov') || 
               ext.endsWith('.avi') || 
               ext.endsWith('.webm') ||
               ext.endsWith('.mkv');
      })
      .map(blob => ({
        filename: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      }));

    return res.status(200).json({
      success: true,
      videos: videos,
      count: videos.length
    });
  } catch (error) {
    console.error('Error listing videos:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to list videos'
    });
  }
};