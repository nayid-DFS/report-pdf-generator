// markdown-processor.js - Utility for enhancing Markdown content for better PDF output

const marked = require('marked');
const { v4: uuidv4 } = require('uuid');

/**
 * Process Markdown content to enhance it for PDF output:
 * - Extract headings for TOC
 * - Add IDs to headings for linking
 * - Apply custom formatting
 */
function processMarkdown(content) {
  const headings = [];
  let processedContent = content;
  
  // Extract all h2 headings (## in Markdown)
  const headingRegex = /^## (.+)$/gm;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const headingText = match[1];
    const headingId = `section-${uuidv4()}`;
    
    headings.push({
      title: headingText,
      id: headingId
    });
    
    // Replace the heading with one that includes an ID
    processedContent = processedContent.replace(
      `## ${headingText}`,
      `<h2 id="${headingId}">${headingText}</h2>`
    );
  }
  
  // Convert the processed Markdown to HTML
  const html = marked.parse(processedContent);
  
  return {
    html,
    headings
  };
}

/**
 * Helper function to convert JSON sections to enhanced HTML
 */
function processJsonSections(jsonData) {
  const data = JSON.parse(jsonData);
  
  // Create processed data structure
  const processedData = {
    title: data[0].title,
    groups: data[0].groups.map(group => {
      const { html, headings } = processMarkdown(group.content);
      
      return {
        ...group,
        content: html,
        headings: headings
      };
    })
  };
  
  return processedData;
}

module.exports = {
  processMarkdown,
  processJsonSections
};
