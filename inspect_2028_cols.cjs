const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "02. Overall students database - 2028 Batch (III yr).xlsx");
const workbook = XLSX.readFile(filePath);

['overall', 'Tech.Marks.', 'Apti.Marks', 'Attend.'].forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n======================================================`);
  console.log(`SHEET: "${sheetName}" (Rows: ${rows.length})`);
  console.log(`======================================================`);
  
  // Find header row (usually row 6)
  const headerRow = rows[6] || [];
  console.log("Header row 6 length:", headerRow.length);
  headerRow.forEach((col, idx) => {
    if (col !== null && col !== undefined && col !== "") {
      console.log(`Col ${idx}: ${String(col).replace(/\n/g, ' ')}`);
    }
  });

  // Check how many valid student rows exist
  let validStudents = 0;
  const branches = {};
  for (let r = 7; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const reg = row[2];
    const name = row[3];
    const branch = row[4];
    if (reg && String(reg).match(/^\d{10,14}$/)) {
      validStudents++;
      branches[branch] = (branches[branch] || 0) + 1;
    }
  }
  console.log(`Total valid students found: ${validStudents}`);
  console.log("Branch counts:", branches);
});
