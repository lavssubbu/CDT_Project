const XLSX = require('xlsx');
const fs = require('fs');

const filePath = "d:\\2026\\KIOT\\July\\KIOT LMS\\PracticeAssessmentsC-Hexaware Eligible - Aptitude Assessment-grades.xlsx";

if (!fs.existsSync(filePath)) {
  console.error("Error: File not found at " + filePath);
  process.exit(1);
}

console.log("Loading LMS Excel workbook...");
const workbook = XLSX.readFile(filePath);

console.log("Workbook sheets found:");
workbook.SheetNames.forEach((name, idx) => {
  console.log(" - [" + idx + "]: " + name);
});

// Inspect first sheet
const name = workbook.SheetNames[0];
const sheet = workbook.Sheets[name];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("\n==========================================");
console.log("SHEET: " + name + " (" + rows.length + " rows)");
console.log("==========================================");
rows.slice(0, 12).forEach((row, rIdx) => {
  console.log("Row " + rIdx + ":", row.slice(0, 15)); // print first 15 columns
});
