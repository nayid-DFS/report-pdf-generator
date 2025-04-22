# GANNET SitHub PDF Generator

This tool automatically converts JSON data into professionally formatted PDF reports for situational awareness and operational environments. It uses HTML/CSS for styling and Puppeteer for PDF generation.

## Features

- **JSON Parsing**: Automatically reads and parses exported JSON data
- **HTML Templates**: Uses Handlebars templates for consistent formatting
- **Markdown Support**: Properly renders Markdown content within the JSON
- **Table of Contents**: Automatically generates a clickable table of contents
- **Professional Styling**: Clean, professional design with proper headings, colors, and spacing
- **Source Reference**: Includes source listings at the end of each section
- **Page Breaks**: Intelligently handles page breaks between sections
- **Web Interface**: Simple UI for uploading JSON files and generating PDFs

## Requirements

- Node.js (v14+)
- NPM or Yarn

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Usage

### Web Interface

The easiest way to use the tool is through the web interface:

1. Start the server:

```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`
3. Upload a JSON file using the drag-and-drop interface or file browser
4. Click "Generate PDF" to create your report
5. Download the generated PDF when processing is complete

### Command Line Usage

You can also use the tool directly from the command line:

#### Basic PDF Generation

```bash
node src/json-to-pdf-solution.js
```

This will create a PDF report in the project directory.

#### Advanced PDF with Table of Contents

```bash
node src/advanced-json-to-pdf.js
```

This will create an advanced PDF report with table of contents in the project directory.

## Configuration

You can customize various aspects of the PDF generation:

- Edit `src/templates/html-template.html` or `src/templates/advanced-html-template.html` to change the styling and layout
- Modify the PDF options in the JS files to adjust page size, margins, etc.
- Add custom processing logic in the JavaScript files

## Dependencies

- **express**: Web server for the UI interface
- **puppeteer**: Headless Chrome for PDF generation
- **handlebars**: HTML templating
- **marked**: Markdown parsing
- **uuid**: Generating unique IDs for TOC links
- **multer**: File upload handling

## Extending the Solution

### Adding New Features

1. **Custom Cover Page**: Add a special template for the first page
2. **Dynamic Charts/Graphs**: Integrate Chart.js to visualize data
3. **Multi-Language Support**: Add language toggle options

### Processing Different Input Formats

The solution can be extended to handle:
- Excel files (using ExcelJS or SheetJS)
- CSV files (using csv-parser)
- API data (using axios or fetch)

## JSON Structure

The tool expects JSON data in the following format:

```json
[
  {
    "title": "Report Title",
    "groups": [
      {
        "title": "Section Title",
        "content": "Markdown content with ## headings",
        "sources": [
          {
            "title": "Source 1 Title"
          },
          {
            "title": "Source 2 Title"
          }
        ]
      }
    ]
  }
]
```

## Use Cases

This PDF generator can be used for various situational reporting needs:
- Regional conflict analysis
- Humanitarian situation reports
- Security assessments
- Environmental monitoring reports
- Crisis management briefings
- Operational planning documents

## Troubleshooting

- **PDF Generation Fails**: Make sure all dependencies are installed and Puppeteer can launch Chrome
- **Formatting Issues**: Check the HTML output files for debugging
- **Missing Content**: Verify the JSON structure matches the expected format
- **File Upload Issues**: Check file permissions and ensure the JSON is properly formatted

## License

MIT
