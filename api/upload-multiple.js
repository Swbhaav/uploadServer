// api/upload-multiple.js - Upload multiple videos to Blob storage
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

      // Get all uploaded video files
      const videoFiles = files.videos || [];

      if (videoFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No video files provided'
        });
      }

      const fs = require('fs');
      const uploadedVideos = [];

      // Upload each video
      for (const videoFile of videoFiles) {
        try {
          const fileBuffer = fs.readFileSync(videoFile.path);

          const blob = await put(videoFile.originalFilename, fileBuffer, {
            access: 'public',
            contentType: videoFile.headers['content-type'] || 'video/mp4'
          });

          uploadedVideos.push({
            filename: blob.pathname,
            url: blob.url,
            size: blob.size
          });

          // Clean up temporary file
          fs.unlinkSync(videoFile.path);
        } catch (uploadError) {
          console.error(`Failed to upload ${videoFile.originalFilename}:`, uploadError);
          // Continue with other files
        }
      }

      if (uploadedVideos.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'All uploads failed'
        });
      }

      return res.status(200).json({
        success: true,
        message: `${uploadedVideos.length} video(s) uploaded successfully`,
        data: uploadedVideos
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