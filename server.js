const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { Catbox } = require('node-catbox');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// CatBox instance (gunakan userhash jika ada)
const catbox = new Catbox('59770acae5e391fd921ec0df4');

// Serve demo page di root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 1. Deline Upload
app.post('/api/deline', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    const response = await axios.post('https://api.deline.web.id/uploader', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxBodyLength: 50 * 1024 * 1024,
      maxContentLength: 50 * 1024 * 1024,
    });
    
    const data = response.data;
    
    if (data.status === false) {
      throw new Error(data.message || data.error || 'Upload failed');
    }
    
    const link = data?.result?.link || data?.url || data?.path;
    if (!link) throw new Error('Invalid response (no link found)');
    
    res.json({
      success: true,
      url: link,
      provider: 'deline'
    });
    
  } catch (error) {
    console.error('Deline upload error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'deline'
    });
  }
});

// 2. Uguu Upload
app.post('/api/uguu', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const formData = new FormData();
    formData.append('files[]', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    const response = await axios.post('https://uguu.se/upload.php', formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    const data = response.data;
    
    if (data.success === false || !data.files || data.files.length === 0) {
      throw new Error(data.message || 'Upload failed');
    }
    
    const fileData = data.files[0];
    res.json({
      success: true,
      url: fileData.url,
      name: fileData.name,
      size: fileData.size,
      provider: 'uguu'
    });
    
  } catch (error) {
    console.error('Uguu upload error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'uguu'
    });
  }
});

// 3. CatBox Upload
app.post('/api/catbox', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Save buffer to temporary file
    const tempFilePath = `/tmp/${Date.now()}-${req.file.originalname}`;
    fs.writeFileSync(tempFilePath, req.file.buffer);
    
    const response = await catbox.uploadFile({ path: tempFilePath });
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    res.json({
      success: true,
      url: response,
      provider: 'catbox'
    });
    
  } catch (error) {
    console.error('CatBox upload error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'catbox'
    });
  }
});

// 4. Quax Upload
app.post('/api/quax', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const formData = new FormData();
    formData.append('files[]', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    const response = await axios.post('https://qu.ax/upload.php', formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    // Quax returns plain text URL or JSON
    let url;
    if (typeof response.data === 'string' && response.data.startsWith('http')) {
      url = response.data.trim();
    } else if (response.data.files && response.data.files[0]) {
      url = response.data.files[0].url;
    } else {
      throw new Error('Invalid response format');
    }
    
    res.json({
      success: true,
      url: url,
      provider: 'quax'
    });
    
  } catch (error) {
    console.error('Quax upload error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'quax'
    });
  }
});

// 5. Nekohime Upload
app.post('/api/nekohime', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    const response = await axios.post('https://cdn.nekohime.site/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    const data = response.data;
    
    if (!data.files || data.files.length === 0) {
      throw new Error('No files returned from server');
    }
    
    const fileData = data.files[0];
    res.json({
      success: true,
      url: fileData.url || fileData.path,
      name: fileData.name,
      provider: 'nekohime'
    });
    
  } catch (error) {
    console.error('Nekohime upload error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'nekohime'
    });
  }
});

// 6. Nauval Upload
app.post('/api/nauval', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    const response = await axios.post('https://nauval.cloud/uploade', formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    const data = response.data;
    
    // Handle various response formats
    const url = data.url || data.path || data.link;
    if (!url) {
      throw new Error('No URL returned from server');
    }
    
    res.json({
      success: true,
      url: url,
      provider: 'nauval'
    });
    
  } catch (error) {
    console.error('Nauval upload error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'nauval'
    });
  }
});

// API health check
app.get('/api', (req, res) => {
  res.json({
    message: 'Image Upload API is running',
    providers: [
      { name: 'deline', endpoint: '/api/deline' },
      { name: 'uguu', endpoint: '/api/uguu' },
      { name: 'catbox', endpoint: '/api/catbox' },
      { name: 'quax', endpoint: '/api/quax' },
      { name: 'nekohime', endpoint: '/api/nekohime' },
      { name: 'nauval', endpoint: '/api/nauval' }
    ],
    usage: 'POST /api/{provider} with file form-data'
  });
});

const PORT = process.env.PORT || 6767;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Demo page: http://localhost:${PORT}/`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api`);
});

module.exports = app;
