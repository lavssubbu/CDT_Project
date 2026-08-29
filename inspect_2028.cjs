const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "02. Overall students database - 2028 Batch (III yr).xlsx");
const workbook = XLSX.readFile(filePath);

console.log("Sheet names in 2028 Batch Excel:");
console.log(workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n=== Sheet: "${sheetName}" (Total rows: ${rows.length}) ===`);
  for (let i = 0; i < Math.min(6, rows.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(rows[i]?.slice(0, 20)));
  }
});
