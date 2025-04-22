// Create and inject the upload icon SVG
document.addEventListener('DOMContentLoaded', function() {
  const uploadIconElement = document.getElementById('upload-icon');
  
  if (uploadIconElement) {
    // Create SVG icon for upload
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    
    // Set SVG attributes
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "64");
    svg.setAttribute("height", "64");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "#006699");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    
    // Create the upload icon paths
    const cloudPath = document.createElementNS(svgNS, "path");
    cloudPath.setAttribute("d", "M12 12v9m0-9l-4 4m4-4l4 4");
    
    const filePath = document.createElementNS(svgNS, "path");
    filePath.setAttribute("d", "M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3");
    
    // Append paths to SVG
    svg.appendChild(cloudPath);
    svg.appendChild(filePath);
    
    // Replace the placeholder image with the SVG
    uploadIconElement.parentNode.replaceChild(svg, uploadIconElement);
  }
}); 