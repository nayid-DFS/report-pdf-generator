# Lebanon Operational Environment - PDF Generator

This tool automatically converts the Weekly Export JSON data into professionally formatted PDF reports. It uses HTML/CSS for styling and Puppeteer for PDF generation.

## Features

- **JSON Parsing**: Automatically reads and parses the Weekly_export.json file
- **HTML Templates**: Uses Handlebars templates for consistent formatting
- **Markdown Support**: Properly renders Markdown content within the JSON
- **Table of Contents**: Automatically generates a clickable table of contents
- **Professional Styling**: Clean, professional design with proper headings, colors, and spacing
- **Source Reference**: Includes source listings at the end of each section
- **Page Breaks**: Intelligently handles page breaks between sections

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

### Basic PDF Generation

To generate a basic PDF report:

```bash
node json-to-pdf.js
```

This will create `Lebanon_Operational_Environment.pdf` in the project directory.

### Advanced PDF with Table of Contents

To generate an enhanced PDF with table of contents:

```bash
node advanced-json-to-pdf.js
```

This will create `Lebanon_Operational_Environment_Advanced.pdf` in the project directory.

## Configuration

You can customize various aspects of the PDF generation:

- Edit `template.html` or `advanced-template.html` to change the styling and layout
- Modify the PDF options in the JS files to adjust page size, margins, etc.
- Add custom processing logic in the JavaScript files

## Dependencies

- **puppeteer**: Headless Chrome for PDF generation
- **handlebars**: HTML templating
- **marked**: Markdown parsing
- **uuid**: Generating unique IDs for TOC links

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

## Troubleshooting

- **PDF Generation Fails**: Make sure all dependencies are installed and Puppeteer can launch Chrome
- **Formatting Issues**: Check the HTML output files for debugging
- **Missing Content**: Verify the JSON structure matches the expected format

## License

MIT
