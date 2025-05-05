// advanced-json-to-pdf.js - Enhanced PDF generation with TOC and Markdown support
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const marked = require('marked');
const { v4: uuidv4 } = require('uuid');

// Register Handlebars helper to convert Markdown to HTML
handlebars.registerHelper('markdown', function(content) {
  if (!content) return '';
  // Replace ## headings with properly marked headings for TOC linking
  const processedContent = content.replace(/## (.+)/g, (match, title) => {
    const id = `section-${uuidv4()}`;
    return `<h2 id="${id}">${title}</h2>`;
  });
  return new handlebars.SafeString(marked.parse(processedContent));
});

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
    
    // Ensure we always have the two main parts with correct titles
    const operationalEnvIndex = data[0].groups.findIndex(g => g.title.toLowerCase().includes('operational environment'));
    const sectoralAnalysisIndex = data[0].groups.findIndex(g => g.title.toLowerCase().includes('sectoral analysis'));
    
    // If the main parts don't exist with correct titles, reorganize as needed
    const organizedGroups = [];
    
    // Add Operational Environment section if it exists, otherwise create a placeholder
    if (operationalEnvIndex >= 0) {
      organizedGroups.push(data[0].groups[operationalEnvIndex]);
    } else {
      organizedGroups.push({
        title: "Operational Environment",
        content: "No operational environment data available.",
        sections: []
      });
    }
    
    // Add Sectoral Analysis section if it exists, otherwise create a placeholder
    if (sectoralAnalysisIndex >= 0) {
      organizedGroups.push(data[0].groups[sectoralAnalysisIndex]);
    } else {
      organizedGroups.push({
        title: "Sectoral Analysis",
        content: "No sectoral analysis data available.",
        sections: []
      });
    }
    
    // Add any other groups that are not the main parts
    data[0].groups.forEach((group, index) => {
      if (index !== operationalEnvIndex && index !== sectoralAnalysisIndex) {
        organizedGroups.push(group);
      }
    });
    
    // Process data to create table of contents entries
    const processedData = {
      title: "Situational Analysis", // Always set the general title to "Situational Analysis"
      groups: organizedGroups.map(group => {
        // Extract headings from content for TOC
        const headings = [];
        
        // Process sections if they exist
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
        
        // Also extract markdown headings from content
        if (group.content) {
          const headingRegex = /## (.+)$/gm;
          let match;
          while ((match = headingRegex.exec(group.content)) !== null) {
            headings.push({
              title: match[1].trim(),
              id: `section-${uuidv4()}`
            });
          }
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
      path: path.join(__dirname, '..', 'output', 'Situational_Analysis_Report.pdf'),
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
        <div style="font-size: 9px; width: 100%; text-align: center; margin: 0 50px; visibility: hidden;">
          <!-- Header intentionally hidden -->
        </div>
      `,
      footerTemplate: `
        <div style="display: flex; justify-content: space-between; width: 100%; font-size: 9px; padding: 0 20mm; box-sizing: border-box;">
          <script>
            // Hide footer on first page
            if (document.querySelector('.pageNumber').textContent === '1') {
              document.currentScript.parentElement.style.visibility = 'hidden';
            }
          </script>
          <div style="text-align: left;">[COUNTRY] Crisis | Situational Analysis | {{formatDate}}</div>
          <div style="text-align: left;">Page <span class="pageNumber"></span></div>
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
