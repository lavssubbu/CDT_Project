const XLSX = require('xlsx');

const filePath = "d:\\2026\\KIOT\\July\\01. Attendance and Test Performance - 2027 Batch (IV yr) (1).xlsx";
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Prog. Marks'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const headerRow = rows[3];
const subHeaderRow = rows[4];
const parentHeaderRow = rows[1];

console.log("Analyzing Prog. Marks Columns:");
headerRow.forEach((col, idx) => {
  const sub = subHeaderRow && subHeaderRow[idx] ? ` | Sub: ${subHeaderRow[idx]}` : "";
  const parent = parentHeaderRow && parentHeaderRow[idx] ? ` | Parent: ${parentHeaderRow[idx]}` : "";
  console.log(`Col [${idx}]: "${col}"${sub}${parent}`);
});
