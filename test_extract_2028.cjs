const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "02. Overall students database - 2028 Batch (III yr).xlsx");
const workbook = XLSX.readFile(filePath);

const overallSheet = workbook.Sheets['overall'];
const rows = XLSX.utils.sheet_to_json(overallSheet, { header: 1 });

console.log("=== Checking 2028 Students Sample ===");
let count = 0;
const depts = new Set();

for (let r = 7; r < rows.length; r++) {
  const row = rows[r];
  if (!row) continue;
  const reg = String(row[2] || "").trim();
  const name = String(row[3] || "").trim();
  let branch = String(row[4] || "").trim().toUpperCase();
  if (branch.startsWith('MECH')) branch = 'MECH';
  if (branch.startsWith('CIVIL')) branch = 'CIVIL';
  if (branch === 'AIDS' || branch === 'AI & DS') branch = 'AI&DS';

  if (reg && reg.match(/^\d{10,14}$/) && name) {
    depts.add(branch);
    count++;
    if (count <= 5) {
      console.log(`Student ${count}:`, {
        reg,
        name,
        branch,
        section: row[5],
        mobile: row[6],
        email: row[7],
        cgpa: row[10],
        arrears: row[11],
        placement: row[13]
      });
    }
  }
}

console.log(`\nTotal 2028 Students: ${count}`);
console.log("Departments found:", Array.from(depts));
