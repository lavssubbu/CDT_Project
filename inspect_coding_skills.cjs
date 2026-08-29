const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "BE23PT810_Coding_Skills_CA.xlsx");
const workbook = XLSX.readFile(filePath);

console.log("=== Sheet Names in BE23PT810_Coding_Skills_CA.xlsx ===");
console.log(workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n---------------------------------------------------------`);
  console.log(`Sheet: "${sheetName}" (Rows: ${rows.length})`);
  console.log(`---------------------------------------------------------`);
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    if (rows[i] && rows[i].length > 0) {
      console.log(`Row ${i}:`, JSON.stringify(rows[i].slice(0, 20)));
    }
  }
});
