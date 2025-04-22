// pdf-generator.js - PDF generation functions for use with web interface
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const { v4: uuidv4 } = require('uuid');

// Register helper to generate unique IDs for sections
handlebars.registerHelper('uniqueId', function() {
  return uuidv4();
});

async function generateAdvancedPDF() {
  try {
    // Read and parse the JSON data file
    const jsonData = fs.readFileSync(path.join(__dirname, 'Weekly_export.json'), 'utf8');
    const data = JSON.parse(jsonData);
    
    // Read the HTML template
    const templateHtml = fs.readFileSync(path.join(__dirname, 'templates', 'advanced-html-template.html'), 'utf8');
    
    // Process data to create table of contents entries
    const processedData = {
      title: data[0].title,
      groups: data[0].groups.map(group => {
        // Process sections from JSON content
        const headings = [];
        
        // Assuming content is plain text with JSON structure
        // We extract section titles from the content for TOC
        if (group.sections && Array.isArray(group.sections)) {
          group.sections.forEach(section => {
            if (section.title) {
              headings.push({
                title: section.title,
                id: `section-${uuidv4()}`
              });
            }
          });
        }
        
        return {
          ...group,
          headings: headings
        };
      })
    };
    
    // Compile the template with Handlebars
    const template = handlebars.compile(templateHtml);
    const html = template(processedData);
    
    // Write the HTML to a temporary file (for debugging)
    fs.writeFileSync(path.join(__dirname, '..', 'output', 'advanced-output.html'), html);
    
    // Create output file path with timestamp to avoid overwrites
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPdfPath = path.join(__dirname, '..', 'output', `GANNET_SitHub_Report_${timestamp}.pdf`);
    
    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Add custom styles for print
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper styling and formatting
    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      margin: {
        top: '25mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; margin: 0 50px;">
          <span>GANNET SitHub Report</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; margin: 0 50px;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
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