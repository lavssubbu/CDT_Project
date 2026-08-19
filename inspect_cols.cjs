const XLSX = require('xlsx');

const filePath = "d:\\2026\\KIOT\\July\\01. Attendance and Test Performance - 2027 Batch (IV yr) (1).xlsx";
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Prog. Marks'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("Header Columns (Row 3):");
console.log(rows[3]);

console.log("\nSample Student Row (Row 5):");
console.log(rows[5]);
