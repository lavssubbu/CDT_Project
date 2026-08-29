const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "02. Overall students database - 2028 Batch (III yr).xlsx");
const workbook = XLSX.readFile(filePath);

['overall', 'Attend.', 'Tech.Marks.', 'Apti.Marks'].forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n=== Sheet ${sheetName} row inspection ===`);
  
  // Find sample rows for each branch
  const foundBranches = new Set();
  for (let r = 5; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    
    // Check if this row is a header row (e.g. contains "Register" or "Roll")
    const rowText = row.join(' ').toLowerCase();
    if (rowText.includes('register') || rowText.includes('s.no') || rowText.includes('s. no')) {
      console.log(`[Header Row at index ${r}]:`, row.slice(0, 16));
      continue;
    }

    // Check student row
    const reg = String(row[2] || "");
    const branch = String(row[4] || "").trim();
    if (reg.match(/^\d{10,14}$/) && !foundBranches.has(branch)) {
      foundBranches.add(branch);
      console.log(`[Branch ${branch} student at row ${r}]:`, row.slice(0, 16));
    }
  }
});
