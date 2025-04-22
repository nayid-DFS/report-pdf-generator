document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('fileInput');
  const browseButton = document.getElementById('browse-button');
  const fileDetails = document.getElementById('file-details');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const removeFileButton = document.getElementById('remove-file');
  const generateButton = document.getElementById('generate-button');
  const statusSection = document.getElementById('status');
  const statusMessage = document.getElementById('status-message');
  const resultSection = document.getElementById('result');
  const downloadLink = document.getElementById('download-link');
  const newFileButton = document.getElementById('new-file-button');
  const currentYearElement = document.getElementById('current-year');
  
  // Set current year in footer
  currentYearElement.textContent = new Date().getFullYear();
  
  // Global variables
  let selectedFile = null;
  
  // Event listeners for drag and drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    dropArea.classList.add('highlight');
  }
  
  function unhighlight() {
    dropArea.classList.remove('highlight');
  }
  
  // Handle file drop
  dropArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      handleFiles(files);
    }
  }
  
  // Handle file selection via browse button
  fileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      handleFiles(this.files);
    }
  });
  
  // Trigger file input when browse button is clicked
  browseButton.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Remove selected file
  removeFileButton.addEventListener('click', () => {
    resetFileSelection();
  });
  
  // Handle file processing
  function handleFiles(files) {
    const file = files[0];
    
    // Check if it's a JSON file
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('Please select a JSON file.');
      return;
    }
    
    selectedFile = file;
    
    // Display file details
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileDetails.classList.remove('hidden');
    
    // Enable generate button
    generateButton.disabled = false;
  }
  
  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Reset file selection
  function resetFileSelection() {
    selectedFile = null;
    fileInput.value = '';
    fileDetails.classList.add('hidden');
    generateButton.disabled = true;
  }
  
  // Generate PDF when button is clicked
  generateButton.addEventListener('click', async () => {
    if (!selectedFile) {
      alert('Please select a JSON file first.');
      return;
    }
    
    try {
      // Show status section
      statusSection.classList.remove('hidden');
      resultSection.classList.add('hidden');
      
      // Create form data
      const formData = new FormData();
      formData.append('jsonFile', selectedFile);
      
      // Send request to server
      const response = await fetch('/generate-pdf', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        downloadLink.href = `/download/${data.pdfPath}`;
        statusSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
      } else {
        throw new Error(data.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error:', error);
      statusMessage.textContent = `Error: ${error.message}`;
      statusSection.classList.remove('hidden');
    }
  });
  
  // Process another file
  newFileButton.addEventListener('click', () => {
    resetFileSelection();
    resultSection.classList.add('hidden');
  });
}); 