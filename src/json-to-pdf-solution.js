// json-to-pdf.js - Main script for converting JSON to PDF
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');

async function generatePDF() {
  try {
    // Read and parse the JSON data file
    const jsonData = fs.readFileSync(path.join(__dirname, 'Weekly_export.json'), 'utf8');
    const data = JSON.parse(jsonData);
    
    // Read the HTML template
    const templateHtml = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
    
    // Compile the template with Handlebars
    const template = handlebars.compile(templateHtml);
    const html = template({ 
      title: data[0].title,
      groups: data[0].groups 
    });
    
    // Write the HTML to a temporary file (for debugging)
    fs.writeFileSync(path.join(__dirname, 'output.html'), html);
    
    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper styling and formatting
    await page.pdf({
      path: path.join(__dirname, 'GANNET_SitHub_Report.pdf'),
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; visibility: hidden;"><!-- Header intentionally hidden --></div>',
      footerTemplate: '<div style="display: flex; justify-content: space-between; width: 100%; font-size: 10px; padding: 0 20mm; box-sizing: border-box;"><script>if (document.querySelector(".pageNumber").textContent === "1") { document.currentScript.parentElement.style.visibility = "hidden"; }</script><div style="text-align: left;">[COUNTRY] Crisis | Situational Analysis | {{formatDate}}</div><div style="text-align: left;">Page <span class="pageNumber"></span></div></div>'
    });
    
    await browser.close();
    console.log('PDF generated successfully!');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

generatePDF();
