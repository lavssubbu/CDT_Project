const XLSX = require('xlsx');
const path = require('path');

const ivPath = path.join(__dirname, "2027 Batch IVYrData.xlsx");
const wb = XLSX.readFile(ivPath);

console.log("=== Checking all sheets in 2027 Batch IVYrData.xlsx ===");

wb.SheetNames.forEach(sName => {
  const ws = wb.Sheets[sName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  // Find rows with Hexaware and Final/Selected/Placed
  const hexRows = [];
  rows.forEach((row, rIdx) => {
    if (!row) return;
    const rowStr = row.map(c => String(c || '')).join(' ');
    if (rowStr.toLowerCase().includes('hexaware')) {
      hexRows.push({ rIdx, row: row.slice(0, 15) });
    }
  });
  if (hexRows.length > 0) {
    console.log(`Sheet "${sName}": ${hexRows.length} rows containing Hexaware`);
  }
});

// Let's specifically inspect "Company wise"
const compSheet = wb.Sheets['Company wise'];
if (compSheet) {
  const compRows = XLSX.utils.sheet_to_json(compSheet, { header: 1 });
  console.log("\n=== Company wise Sheet Headers ===");
  console.log("Row 3:", compRows[3]);
  console.log("Row 4:", compRows[4]);
  console.log("Row 5:", compRows[5]);

  // Let's look at all columns related to Hexaware placement drive
  const hexSelected = [];
  for (let r = 6; r < compRows.length; r++) {
    const row = compRows[r];
    if (!row) continue;
    const reg = String(row[2] || '').trim();
    const name = String(row[3] || '').trim();
    const dept = String(row[4] || '').trim();
    const sec = String(row[5] || '').trim();
    
    // Check all cells in row for "Select", "Placed", "Selected", "Yes", "Offer" in Hexaware drive columns
    // Let's check columns 10 to 25
    const driveCols = row.slice(10, 25);
    const hasPlaced = driveCols.some(c => typeof c === 'string' && (c.toLowerCase().includes('select') || c.toLowerCase().includes('placed') || c.toLowerCase().includes('offer') || c.toLowerCase().includes('intern')));
    
    // Let's check exact cell values
    if (reg && reg.match(/^\d{10,14}$/)) {
      hexSelected.push({
        r, reg, name, dept, sec,
        col10: row[10], col11: row[11], col12: row[12], col13: row[13], col14: row[14], col15: row[15], col16: row[16], col17: row[17], col18: row[18]
      });
    }
  }

  console.log(`Total student rows in Company wise: ${hexSelected.length}`);
}

// Let's also inspect "Sheet29"
const s29 = wb.Sheets['Sheet29'];
if (s29) {
  const s29Rows = XLSX.utils.sheet_to_json(s29, { header: 1 });
  console.log("\n=== Sheet29 (Finalists in Hexaware Assessments) ===");
  for (let r = 0; r < Math.min(30, s29Rows.length); r++) {
    if (s29Rows[r] && s29Rows[r].length > 0) {
      console.log(`Row ${r}:`, JSON.stringify(s29Rows[r].slice(0, 10)));
    }
  }
}
