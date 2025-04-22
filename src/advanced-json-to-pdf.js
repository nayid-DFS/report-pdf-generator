// advanced-json-to-pdf.js - Enhanced PDF generation with TOC and Markdown support
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const marked = require('marked');
const { v4: uuidv4 } = require('uuid');

// Register Handlebars helper to convert Markdown to HTML
handlebars.registerHelper('markdown', function(content) {
  return new handlebars.SafeString(marked.parse(content));
});

// Register helper to generate unique IDs for sections
handlebars.registerHelper('uniqueId', function() {
  return uuidv4();
});

async function generateAdvancedPDF() {
  try {
    // Read and parse the JSON file
    const jsonData = fs.readFileSync(path.join(__dirname, 'Weekly_export.json'), 'utf8');
    const data = JSON.parse(jsonData);
    
    // Read the HTML template
    const templateHtml = fs.readFileSync(path.join(__dirname, 'advanced-template.html'), 'utf8');
    
    // Process data to create table of contents entries
    const processedData = {
      title: data[0].title,
      groups: data[0].groups.map(group => {
        // Extract headings from content for TOC
        const headings = [];
        const content = group.content;
        
        // Simple regex to extract headings from markdown
        const headingRegex = /^## (.+)$/gm;
        let match;
        while ((match = headingRegex.exec(content)) !== null) {
          headings.push({
            title: match[1],
            id: `section-${uuidv4()}`
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
    fs.writeFileSync(path.join(__dirname, 'advanced-output.html'), html);
    
    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Add custom styles for print
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper styling and formatting
    await page.pdf({
      path: path.join(__dirname, 'Lebanon_Operational_Environment_Advanced.pdf'),
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
          <span>Lebanon Operational Environment</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; margin: 0 50px;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });
    
    await browser.close();
    console.log('Advanced PDF generated successfully!');
    
  } catch (error) {
    console.error('Error generating advanced PDF:', error);
  }
}

generateAdvancedPDF();
