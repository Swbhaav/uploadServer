// api/videos/[...path].js
const { list, del } = require('@vercel/blob');

module.exports = async (req, res) => {
  // Parse filename from request
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
    return res.status(400).json({ 
      success: false, 
      message: 'Filename required' 
    });
  }

  // GET: Return the Blob URL or redirect to it
  if (req.method === 'GET') {
    try {
      const { blobs } = await list();
      const blob = blobs.find(b => 
        b.pathname === filename || 
        b.pathname?.endsWith(`/${filename}`) ||
        b.pathname?.endsWith(filename)
      );

      if (!blob) {
        return res.status(404).json({ 
          success: false, 
          message: 'Video not found' 
        });
      }

      // Option 1: Return JSON with the URL (recommended for SPAs)
      return res.status(200).json({
        success: true,
        url: blob.url,
        filename: blob.pathname
      });

      // Option 2: Redirect directly to the video (uncomment to use)
      // return res.redirect(307, blob.url);
      
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  // DELETE: Remove from Blob storage
  if (req.method === 'DELETE') {
    try {
      const { blobs } = await list();
      const blob = blobs.find(b =>
        b.pathname === filename || 
        b.pathname?.endsWith(`/${filename}`) ||
        b.pathname?.endsWith(filename)
      );

      if (!blob) {
        return res.status(404).json({ 
          success: false, 
          message: 'Video not found in Blob' 
        });
      }

      await del(blob.url);
      return res.status(200).json({ 
        success: true, 
        message: 'Video deleted successfully' 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ 
    success: false, 
    message: 'Method not allowed' 
  });
};