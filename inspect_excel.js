const XLSX = require('xlsx');
const fs = require('fs');

const filePath = "d:\\2026\\KIOT\\July\\01. Attendance and Test Performance - 2027 Batch (IV yr) (1).xlsx";

if (!fs.existsSync(filePath)) {
  console.error("Error: File not found at " + filePath);
  process.exit(1);
}

console.log("Loading Excel workbook...");
const workbook = XLSX.readFile(filePath);

console.log("Workbook sheets found:");
workbook.SheetNames.forEach((name, idx) => {
  console.log(" - [" + idx + "]: " + name);
});

// Print first 8 rows of each sheet to inspect headers
workbook.SheetNames.forEach((name) => {
  const sheet = workbook.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log("\n==========================================");
  console.log("SHEET: " + name + " (" + rows.length + " rows)");
  console.log("==========================================");
  rows.slice(0, 10).forEach((row, rIdx) => {
    console.log("Row " + rIdx + ":", row.slice(0, 15)); // print first 15 columns
  });
});
