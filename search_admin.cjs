const fs = require('fs');
const code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');

console.log("Lines matching sync-csv or CSV:");
lines.forEach((line, idx) => {
  if (line.includes('sync-csv') || line.includes('Sync Assessments') || line.includes('csvInput')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
