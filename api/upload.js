// api/upload.js - Upload single video to Blob storage
const { put } = require('@vercel/blob');
const multiparty = require('multiparty');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Failed to parse upload: ' + err.message
        });
      }

      // Get the uploaded video file
      const videoFile = files.video ? files.video[0] : null;

      if (!videoFile) {
        return res.status(400).json({
          success: false,
          message: 'No video file provided'
        });
      }

      // Read the file
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(videoFile.path);

      // Upload to Vercel Blob
      const blob = await put(videoFile.originalFilename, fileBuffer, {
        access: 'public',
        contentType: videoFile.headers['content-type'] || 'video/mp4'
      });

      // Clean up temporary file
      fs.unlinkSync(videoFile.path);

      return res.status(200).json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          filename: blob.pathname,
          url: blob.url,
          size: blob.size
        }
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Upload failed'
    });
  }
};