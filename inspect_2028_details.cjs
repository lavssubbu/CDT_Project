const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "02. Overall students database - 2028 Batch (III yr).xlsx");
const workbook = XLSX.readFile(filePath);

['overall', 'Tech.Marks.', 'Apti.Marks.', 'Apti.Marks', 'Attend.', 'Sheet19'].forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n======================================================`);
  console.log(`SHEET: "${sheetName}" (Total rows: ${rows.length})`);
  console.log(`======================================================`);
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const nonNulls = (rows[i] || []).filter(x => x !== null && x !== undefined && x !== "");
    if (nonNulls.length > 0) {
      console.log(`Row ${i}:`, JSON.stringify(rows[i].slice(0, 15)));
    }
  }
});
