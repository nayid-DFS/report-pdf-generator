// pdf-generator.js - PDF generation functions for use with web interface
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const { v4: uuidv4 } = require('uuid');
const marked = require('marked');

// Register helper to generate unique IDs for sections
handlebars.registerHelper('uniqueId', function() {
  return uuidv4();
});

// Register helper for formatting dates - modified to use a global variable for consistency
let globalReportDate = '';

handlebars.registerHelper('formatDate', function() {
  // Always use the global report date for consistency
  if (globalReportDate) {
    try {
      const date = new Date(globalReportDate);
      if (!isNaN(date.getTime())) {
        const options = { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
      }
    } catch (e) {
      console.error('Error parsing date in helper:', e);
    }
  }
  
  // Fallback to current date if there's any issue
  return new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
});

// Register comparison helper for template
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Register Handlebars helper to convert Markdown to HTML
handlebars.registerHelper('markdown', function(content) {
  if (!content) return '';
  return new handlebars.SafeString(marked.parse(content));
});

// Helper function to check if a group belongs to Operational Environment category
function isOperationalEnvironmentGroup(title) {
  const operationalGroups = [
    'economy', 'security', 'access', 'coordination', 'logistics', 
    'infrastructure', 'information communication', 'media coverage', 
    'socio-cultural', 'political', 'legal and policy'
  ];
  
  return operationalGroups.some(group => 
    title.toLowerCase().includes(group) || 
    title.toLowerCase() === group
  );
}

// Helper function to check if a group belongs to Sectoral Analysis category
function isSectoralAnalysisGroup(title) {
  const sectoralGroups = [
    'food security', 'livelihoods', 'agriculture', 'nutrition', 
    'health', 'wash', 'shelter', 'protection', 'education', 
    'vulnerable groups', 'special needs'
  ];
  
  return sectoralGroups.some(group => 
    title.toLowerCase().includes(group) || 
    title.toLowerCase() === group
  );
}

// Helper function to encode image as base64
function getBase64Image(filePath) {
  try {
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Read file and convert to base64
      const imageData = fs.readFileSync(filePath);
      const base64Image = Buffer.from(imageData).toString('base64');
      const imageType = path.extname(filePath).substring(1); // remove the dot
      return `data:image/${imageType};base64,${base64Image}`;
    } else {
      console.warn(`Image file not found: ${filePath}`);
      return ''; // Return empty if file doesn't exist
    }
  } catch (error) {
    console.error(`Error processing image ${filePath}:`, error);
    return ''; // Return empty on error
  }
}

// Helper function to format date consistently
function formatDateString(dateStr) {
  try {
    let date;
    if (dateStr && typeof dateStr === 'string') {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        date = new Date();
      }
    } else {
      date = new Date();
    }
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

async function generateAdvancedPDF(country = 'COUNTRY', reportDate = '') {
  try {
    // Set the global report date for use in the Handlebars helper
    globalReportDate = reportDate;
    
    // Read and parse the JSON data file
    const jsonData = fs.readFileSync(path.join(__dirname, 'Weekly_export.json'), 'utf8');
    const data = JSON.parse(jsonData);
    
    // Log the input date for debugging
    console.log('Input report date:', reportDate);
    
    // Format date consistently for both template and footer
    const formattedDate = formatDateString(reportDate);
    console.log('Formatted date:', formattedDate);
    
    // Read the HTML template
    const templateHtml = fs.readFileSync(path.join(__dirname, 'templates', 'advanced-html-template.html'), 'utf8');
    
    // Collect all sources from all groups to consolidate at the end
    const allSources = [];
    const groupsWithSources = new Set();
    
    // Process each category and its groups
    const processedCategories = [];
    
    // Function to process group content and extract headings
    const processGroup = (group, categoryTitle) => {
      const headings = [];
      
      // Collect sources from this group
      if (group.sources && Array.isArray(group.sources)) {
        group.sources.forEach(source => {
          if (source.title && source.keep !== false) {
            allSources.push({
              title: source.title,
              url: source.url || '',
              group: group.title,
              category: categoryTitle
            });
            groupsWithSources.add(group.title);
          }
        });
      }
      
      // Process sections for TOC
      if (group.sections && Array.isArray(group.sections)) {
        group.sections.forEach(section => {
          if (section.title) {
            const sectionId = `section-${uuidv4()}`;
            headings.push({
              title: section.title,
              id: sectionId
            });
            
            // Store the ID in the section object for later reference
            section.id = sectionId;
            
            // Process markdown in section content
            if (section.content) {
              // Format markdown links, lists, etc. properly
              section.content = section.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>'); // Links
            }
            
            // Collect sources from sections if they exist
            if (section.sources && Array.isArray(section.sources)) {
              section.sources.forEach(source => {
                if (source.title && source.keep !== false) {
                  allSources.push({
                    title: source.title,
                    url: source.url || '',
                    group: group.title,
                    section: section.title,
                    category: categoryTitle
                  });
                  groupsWithSources.add(group.title);
                }
              });
            }
          }
        });
      } else if (group.content) {
        // Extract subtitles from markdown content
        const subtitleRegex = /## (.+)/g;
        let match;
        let processedContent = group.content;
        
        while ((match = subtitleRegex.exec(group.content)) !== null) {
          const title = match[1].trim();
          const id = `section-${uuidv4()}`;
          
          headings.push({
            title: title,
            id: id
          });
          
          // Replace the heading in the content with an ID-tagged version
          const originalHeading = match[0];
          const replacementHeading = `<h2 id="${id}">${title}</h2>`;
          processedContent = processedContent.replace(originalHeading, replacementHeading);
        }
        
        // Update the content with the ID-tagged headings
        group.content = processedContent;
        
        // Apply other markdown formatting
        group.content = group.content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
          .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Links
          .replace(/^\* (.*)/gm, '<li>$1</li>') // List items
          .replace(/<li>.*?<\/li>(\n<li>.*?<\/li>)+/g, match => `<ul>${match}</ul>`); // Wrap list items
      }
      
      return {
        ...group,
        headings: headings,
        sources: [],
        hasSources: groupsWithSources.has(group.title)
      };
    };
    
    // Create our processed structure
    // First, find the Operational Environment and Sectoral Analysis categories
    let operationalEnvironment = data.find(item => item.title.toLowerCase().includes('operational environment'));
    let sectoralAnalysis = data.find(item => item.title.toLowerCase().includes('sectoral analysis'));
    
    // If not found, create placeholders
    if (!operationalEnvironment) {
      operationalEnvironment = {
        title: "Operational Environment",
        groups: []
      };
    }
    
    if (!sectoralAnalysis) {
      sectoralAnalysis = {
        title: "Sectoral Analysis",
        groups: []
      };
    }
    
    // Create category objects with isMainCategory flag
    const operationalEnvCategory = {
      title: operationalEnvironment.title,
      isMainCategory: true,
      headings: [],
      groups: operationalEnvironment.groups.map(group => processGroup(group, operationalEnvironment.title))
    };
    
    const sectoralAnalysisCategory = {
      title: sectoralAnalysis.title,
      isMainCategory: true,
      headings: [],
      groups: sectoralAnalysis.groups.map(group => processGroup(group, sectoralAnalysis.title))
    };
    
    // Get base64 encoded logos for the cover page
    const gannetLogoPath = path.join(__dirname, '..', 'public', 'images', 'gannet-logo.png');
    const partnerLogoPath = path.join(__dirname, '..', 'public', 'images', 'partner-logo.png');
    
    const gannetLogoBase64 = getBase64Image(gannetLogoPath);
    const partnerLogoBase64 = getBase64Image(partnerLogoPath);
    
    // Process data to create table of contents entries
    const processedData = {
      // Always set the general title to "Situational Analysis"
      title: "Situational Analysis",
      country: country.toUpperCase(), // Add country parameter
      reportDate: reportDate,
      formatDate: formattedDate,
      currentYear: new Date().getFullYear(),
      
      // Pass the main categories with their groups
      operationalEnvCategory: operationalEnvCategory,
      sectoralAnalysisCategory: sectoralAnalysisCategory,
      
      // Add the consolidated sources to the processed data
      consolidatedSources: allSources,
      
      // Flag to indicate if we have consolidated sources
      hasConsolidatedSources: allSources.length > 0,
      
      // Pass the groups with sources set
      groupsWithSources: Array.from(groupsWithSources),
      
      // Add logo images as base64 data
      gannetLogoBase64: gannetLogoBase64,
      partnerLogoBase64: partnerLogoBase64
    };
    
    // Compile the template with Handlebars
    const template = handlebars.compile(templateHtml);
    let html = template(processedData);
    
    // Directly fix the date in the cover page by replacing it
    if (reportDate) {
      // Find the date on the cover page and replace it
      const dateRegex = /<p class="date">.*?<\/p>/;
      html = html.replace(dateRegex, `<p class="date">${formattedDate}</p>`);
      console.log('Directly injected date into cover page');
    }
    
    // Write the HTML to a temporary file (for debugging)
    fs.writeFileSync(path.join(__dirname, '..', 'output', 'advanced-output.html'), html);
    
    // Create output file path with timestamp to avoid overwrites
    const outputPdfPath = path.join(__dirname, '..', 'output', `Situational_Analysis_Report.pdf`);
    
    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set the base path for resolving relative URLs
    const basePath = `file://${path.resolve(__dirname, '..')}`;
    
    // First load the HTML without waiting for resources to check images
    await page.setContent(html);
    
    // Intercept requests to handle relative image paths
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        const url = request.url();
        if (url.includes('../public/images/')) {
          // Replace relative path with absolute path
          const newUrl = url.replace('../public/images/', `${basePath}/public/images/`);
          request.continue({ url: newUrl });
          return;
        }
      }
      request.continue();
    });
    
    // Now load the content with proper waiting
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      baseURL: basePath
    });
    
    // Add special attributes for PDF navigation to ensure proper ToC linking
    await page.evaluate(() => {
      // Add named destinations for each heading
      document.querySelectorAll('h2[id]').forEach(heading => {
        const id = heading.getAttribute('id');
        if (id) {
          heading.setAttribute('name', id);
          // Add extra attributes that some PDF viewers use for navigation
          heading.setAttribute('data-dest', id);
          heading.setAttribute('data-page-dest', id);
        }
      });
      
      // Enhance internal links
      document.querySelectorAll('a.internal-link').forEach(link => {
        const targetId = link.getAttribute('data-target-id');
        if (targetId) {
          link.setAttribute('name', `link-to-${targetId}`);
          // Add these attributes to help PDF viewers recognize this as an internal link
          link.setAttribute('data-dest', targetId);
          link.setAttribute('data-page-dest', targetId);
        }
      });
    });
    
    // Ensure links are preserved in PDF
    await page.evaluate(() => {
      // Add attribute to preserve links in PDF
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        const href = link.getAttribute('href');
        
        if (href) {
          // Handle internal links (TOC navigation)
          if (href.startsWith('#')) {
            // It's an internal link
            const targetId = href.substring(1);
            link.setAttribute('data-internal-link', 'true');
            // Style internal links differently
            link.style.color = '#00664d';
            link.style.textDecoration = 'none';
            link.style.fontWeight = 'normal';
          } else {
            // External link
            link.setAttribute('data-href', href);
            // Make sure links are green and underlined
            link.style.color = '#008866';
            link.style.textDecoration = 'underline';
          }
        }
      });
    });
    
    // Generate PDF with proper styling and formatting
    await page.pdf({
      path: outputPdfPath,
      format: 'Letter', // Use Letter page size instead of A4
      margin: {
        top: '15mm',     // Reduced by 40% from 25mm
        right: '12mm',   // Reduced by 40% from 20mm
        bottom: '25mm',
        left: '12mm'     // Reduced by 40% from 20mm
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; margin: 0 50px; visibility: hidden;">
          <!-- Header intentionally hidden -->
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-size: 13.5px; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif;">
          <script>
            // Hide footer on first page
            if (document.querySelector('.pageNumber').textContent === '1') {
              document.currentScript.parentElement.style.visibility = 'hidden';
            }
          </script>
          <div style="display: flex; justify-content: space-between; width: calc(100% - 40mm); margin: 0 20mm; color: #555555;">
            <div style="text-align: justify;">${country} Crisis | Situational Analysis | ${formattedDate}</div>
            <div style="text-align: justify;"><span class="pageNumber"></span></div>
          </div>
        </div>
      `,
      preferCSSPageSize: true,
      printableArea: true
    });
    
    await browser.close();
    console.log('PDF generated successfully:', outputPdfPath);
    
    return outputPdfPath;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

module.exports = {
  generateAdvancedPDF
}; 