const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "BE23PT810_Coding_Skills_CA.xlsx");
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Overall Analysis'];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log("Total rows in Overall Analysis:", rows.length);
console.log("Sample 3 rows:", rows.slice(0, 3));

// Check score range
let validScores = 0;
rows.forEach(r => {
  const total = parseFloat(r['Total']);
  if (!isNaN(total)) validScores++;
});
console.log("Valid Total scores count:", validScores);
