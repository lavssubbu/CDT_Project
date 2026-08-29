const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, "2027 Batch IVYrData.xlsx"));

// 1. Inspect Company wise sheet Round 3
const compSheet = wb.Sheets['Company wise'];
const compRows = XLSX.utils.sheet_to_json(compSheet, { header: 1 });

const r3Selected = [];
for (let r = 6; r < compRows.length; r++) {
  const row = compRows[r];
  if (!row) continue;
  const reg = String(row[2] || '').trim();
  const name = String(row[3] || '').trim();
  const dept = String(row[4] || '').trim();
  const sec = String(row[5] || '').trim();
  const r1 = String(row[14] || '').trim();
  const r2 = String(row[15] || '').trim();
  const r3 = String(row[16] || '').trim();

  if (r3.toLowerCase() === 'yes' || r3.toLowerCase() === 'selected' || r3.toLowerCase() === 'placed') {
    r3Selected.push({ r, reg, name, dept, sec, r1, r2, r3 });
  }
}

console.log(`\n=== Company wise Round 3 Selected: ${r3Selected.length} students ===`);
console.table(r3Selected);

// 2. Inspect Sheet29
const s29 = wb.Sheets['Sheet29'];
const s29Rows = XLSX.utils.sheet_to_json(s29, { header: 1 });
const s29Students = [];
for (let r = 6; r < s29Rows.length; r++) {
  const row = s29Rows[r];
  if (!row) continue;
  const sNo = row[0];
  const reg = String(row[1] || '').trim();
  const name = String(row[2] || '').trim();
  const dept = String(row[3] || '').trim();
  if (reg && reg.match(/^\d{10,14}$/)) {
    s29Students.push({ sNo, reg, name, dept });
  }
}
console.log(`\n=== Sheet29 Left Column Students: ${s29Students.length} students ===`);
console.table(s29Students);

// 3. Inspect Attend. sheet where Col 12 is Hexaware
const attSheet = wb.Sheets['Attend.'];
const attRows = XLSX.utils.sheet_to_json(attSheet, { header: 1 });
const attHex = [];
for (let r = 5; r < attRows.length; r++) {
  const row = attRows[r];
  if (!row) continue;
  const reg = String(row[2] || '').trim();
  const name = String(row[3] || '').trim();
  const dept = String(row[4] || '').trim();
  const sec = String(row[5] || '').trim();
  const comp = String(row[12] || '').trim();
  const statusDiv = String(row[14] || '').trim();
  if (comp.toLowerCase().includes('hexaware')) {
    attHex.push({ r, reg, name, dept, sec, comp, statusDiv });
  }
}
console.log(`\n=== Attend. Sheet Hexaware Placed: ${attHex.length} students ===`);
console.table(attHex);
