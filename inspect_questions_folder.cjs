const fs = require('fs');
const path = require('path');

// Extract text from docx (docx is a zip containing word/document.xml)
const AdmZip = require('adm-zip');

function extractDocxText(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const content = zip.readAsText("word/document.xml");
    // Strip XML tags
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  } catch (err) {
    return `Error reading ${filePath}: ${err.message}`;
  }
}

const qDir = path.join(__dirname, "Questions");
const files = fs.readdirSync(qDir).filter(f => f.endsWith('.docx'));

console.log("Found docx files in Questions:", files.length);

files.slice(0, 8).forEach(f => {
  const fullPath = path.join(qDir, f);
  const text = extractDocxText(fullPath);
  console.log(`\n================== File: ${f} (${text.length} chars) ==================`);
  console.log(text.substring(0, 500) + "...\n");
});
