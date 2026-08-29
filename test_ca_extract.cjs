const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "BE23PT810_Coding_Skills_CA.xlsx");
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Overall Analysis'] || workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log(`Processing ${rows.length} rows from BE23PT810_Coding_Skills_CA...`);

let imported = 0;
rows.forEach(r => {
  const email = String(r['Email address'] || '').toLowerCase().trim();
  const total = parseFloat(r['Total']);
  if (email && !isNaN(total)) {
    imported++;
  }
});

console.log(`Successfully mapped ${imported} student scores!`);
