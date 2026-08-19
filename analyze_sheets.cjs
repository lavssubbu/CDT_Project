const XLSX = require('xlsx');

const filePath = "d:\\2026\\KIOT\\July\\01. Attendance and Test Performance - 2027 Batch (IV yr) (1).xlsx";
const workbook = XLSX.readFile(filePath);

console.log("Analyzing 'Aptitude Marks' sheet:");
const aptSheet = workbook.Sheets['Aptitude Marks'];
if (aptSheet) {
  const rows = XLSX.utils.sheet_to_json(aptSheet, { header: 1 });
  console.log("Headers (Row 3):", rows[3] ? rows[3].slice(0, 30) : "N/A");
  console.log("Row 4:", rows[4] ? rows[4].slice(0, 30) : "N/A");
  console.log("Sample Row 5:", rows[5] ? rows[5].slice(0, 30) : "N/A");
} else {
  console.log("Aptitude Marks sheet not found.");
}

console.log("\nAnalyzing 'Comm. Marks.' sheet:");
const commSheet = workbook.Sheets['Comm. Marks.'];
if (commSheet) {
  const rows = XLSX.utils.sheet_to_json(commSheet, { header: 1 });
  console.log("Headers (Row 3):", rows[3] ? rows[3].slice(0, 30) : "N/A");
  console.log("Sample Row 5:", rows[5] ? rows[5].slice(0, 30) : "N/A");
} else {
  console.log("Comm. Marks. sheet not found.");
}
