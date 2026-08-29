const XLSX = require('xlsx');
const path = require('path');

const fPath = path.join(__dirname, "2027 Batch IVYrData.xlsx");
const wb = XLSX.readFile(fPath);

['Company wise', 'Sheet29'].forEach(sName => {
  const ws = wb.Sheets[sName];
  if (!ws) return;
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n=== Sheet: ${sName} (Rows: ${rows.length}) ===`);
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    if (rows[i] && rows[i].length > 0) {
      console.log(`Row ${i}:`, JSON.stringify(rows[i].slice(0, 15)));
    }
  }
});
