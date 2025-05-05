const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateAdvancedPDF } = require('./src/pdf-generator');

const app = express();
const port = process.env.PORT || 3000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the upload directory exists
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'Weekly_export.json'); // Always save as Weekly_export.json for compatibility
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only JSON files
    if (file.mimetype !== 'application/json') {
      return cb(new Error('Only JSON files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB size limit
  }
});

// Serve static files from public directory
app.use(express.static('public'));

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload and PDF generation route
app.post('/generate-pdf', upload.single('jsonFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get country and date from the form
    const country = req.body.country || 'COUNTRY';
    const reportDate = req.body.reportDate || '';

    // Validate that the uploaded file is valid JSON
    try {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      JSON.parse(fileContent); // Try to parse it to ensure it's valid JSON
    } catch (jsonError) {
      return res.status(400).json({ error: 'Invalid JSON file. Please upload a properly formatted JSON file.' });
    }

    // Copy the uploaded JSON to the src directory
    const uploadedFilePath = req.file.path;
    const destFilePath = path.join(__dirname, 'src', 'Weekly_export.json');
    fs.copyFileSync(uploadedFilePath, destFilePath);

    // Generate the PDF with country and date parameters
    const pdfPath = await generateAdvancedPDF(country, reportDate);
    
    res.json({ 
      success: true, 
      message: 'PDF generated successfully',
      pdfPath: path.basename(pdfPath)
    });
  } catch (error) {
    console.error('Error during PDF generation:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  }
});

// Route to serve the generated PDF
app.get('/download/:filename', (req, res) => {
  const pdfPath = path.join(__dirname, 'output', req.params.filename);
  
  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath);
  } else {
    res.status(404).json({ error: 'PDF file not found' });
  }
});

// Start the server with port fallback mechanism
const startServer = (portToUse) => {
  const server = app.listen(portToUse)
    .on('listening', () => {
      console.log(`Server running on http://localhost:${portToUse}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${portToUse} is busy, trying port ${portToUse + 1}`);
        startServer(portToUse + 1);
      } else {
        console.error('Server error:', err);
      }
    });
};

startServer(port); 