const fs = require('fs');
const code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');

console.log("Occurrences of 'split' in src/App.jsx:");
lines.forEach((line, idx) => {
  if (line.includes('split')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

console.log("\nOccurrences of 'weak' in src/App.jsx:");
lines.forEach((line, idx) => {
  if (line.includes('weak')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
