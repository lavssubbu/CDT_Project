const XLSX = require('xlsx');
const path = require('path');

const fPath = path.join(__dirname, "2027 Batch IVYrData.xlsx");
const wb = XLSX.readFile(fPath);
const attendSheet = wb.Sheets['Attend.'];
const rows = XLSX.utils.sheet_to_json(attendSheet, { header: 1 });

console.log("Header row 4 in Attend. sheet:");
console.log(rows[4]?.slice(0, 25));

const placedStudents = [];

for (let r = 5; r < rows.length; r++) {
  const row = rows[r];
  if (!row) continue;
  const reg = String(row[2] || "").trim();
  const name = String(row[3] || "").trim();
  const dept = String(row[4] || "").trim();
  const sec = String(row[5] || "").trim();
  const company = String(row[12] || "").trim();
  const statusDiv = String(row[14] || "").trim();

  if (reg && reg.match(/^\d{10,14}$/) && (company || statusDiv.toLowerCase().includes('placed'))) {
    placedStudents.push({
      row: r,
      registerNo: reg,
      name,
      dept,
      sec,
      company: company || "Hexaware Technologies",
      statusDiv
    });
  }
}

console.log(`\nFound ${placedStudents.length} placed students in Attend. sheet:`);
console.table(placedStudents);
