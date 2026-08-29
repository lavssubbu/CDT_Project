const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, "2027 Batch IVYrData.xlsx"));

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  // Find which row and column has "Name of the Company Placed"
  let targetCol = -1;
  let headerRowIdx = -1;

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r] || [];
    row.forEach((cell, c) => {
      if (cell && typeof cell === 'string' && cell.toLowerCase().includes('name of the company placed')) {
        targetCol = c;
        headerRowIdx = r;
      }
    });
  }

  if (targetCol !== -1) {
    console.log(`\n======================================================`);
    console.log(`Sheet: "${sheetName}"`);
    console.log(`Header found at Row ${headerRowIdx}, Column ${targetCol}: "${rows[headerRowIdx][targetCol]}"`);
    console.log(`======================================================`);

    const placedEntries = [];
    const countsByCompany = {};

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const reg = String(row[2] || "").trim();
      const name = String(row[3] || "").trim();
      const dept = String(row[4] || "").trim();
      const sec = String(row[5] || "").trim();
      const val = row[targetCol];

      if (reg && reg.match(/^\d{10,14}$/) && val !== undefined && val !== null && String(val).trim() !== "" && String(val).trim() !== "-" && String(val).trim() !== "NIL") {
        const compName = String(val).trim();
        placedEntries.push({
          row: r,
          registerNo: reg,
          name,
          dept,
          sec,
          company: compName
        });
        countsByCompany[compName] = (countsByCompany[compName] || 0) + 1;
      }
    }

    console.log(`Total students with value in "Name of the Company Placed": ${placedEntries.length}`);
    console.log("Counts by exact value:");
    console.table(countsByCompany);

    console.log("\nAll Placed Students based ONLY on this column:");
    console.table(placedEntries);
  }
});
