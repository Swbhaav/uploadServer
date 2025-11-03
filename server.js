const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create uploads directory if it doesn't exist
const uploadDir = './uploads/videos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only video files
const fileFilter = (req, file, cb) => {
  const isVideo = file.mimetype.startsWith('video/');
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'];
  const hasVideoExtension = videoExtensions.some(ext => 
    file.originalname.toLowerCase().endsWith(ext)
  );
  
  if (isVideo || hasVideoExtension) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only video files are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded videos
app.use('/videos', express.static(uploadDir));

// Serve static files from public directory
app.use(express.static('public'));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Video Upload Server is running!' });
});

app.post('/api/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No video file uploaded' 
      });
    }

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
        url: `http://localhost:${PORT}/videos/${req.file.filename}`
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading video', 
      error: error.message 
    });
  }
});

// NEW: Simple endpoint for Flutter app (returns {"videos": [...]})
app.get('/api/videos', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ 
        videos: [],
        error: 'Error reading videos directory' 
      });
    }

    const videoFiles = files.filter(file => 
      file.endsWith('.mp4') || 
      file.endsWith('.avi') || 
      file.endsWith('.mov') ||
      file.endsWith('.MP4') ||
      file.endsWith('.mkv') ||
      file.endsWith('.webm')
    );

    const videoPaths = videoFiles.map(file => `videos/${file}`);
    res.json({ videos: videoPaths });
  });
});

// Original endpoint (keeps backward compatibility)
app.get('/api/videos-list', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error reading videos directory' 
      });
    }

    const videoFiles = files.map(file => ({
      filename: file,
      url: `http://localhost:${PORT}/videos/${file}`
    }));

    res.json({
      success: true,
      data: videoFiles
    });
  });
});

app.post('/api/upload-multiple', upload.array('videos', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No video files uploaded' 
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `http://localhost:${PORT}/videos/${file.filename}`
    }));

    res.json({
      success: true,
      message: 'Videos uploaded successfully',
      data: uploadedFiles
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading videos', 
      error: error.message 
    });
  }
});

app.delete('/api/videos/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large. Max limit is 100MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: error.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - Upload single: http://localhost:${PORT}/api/upload`);
  console.log(`  - Upload multiple: http://localhost:${PORT}/api/upload-multiple`);
  console.log(`  - List videos: http://localhost:${PORT}/api/videos`);
  console.log(`  - List videos (detailed): http://localhost:${PORT}/api/videos-list`);
  console.log(`  - Delete video: DELETE http://localhost:${PORT}/api/videos/:filename`);
});

