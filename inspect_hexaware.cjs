const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '2027 Batch IVYrData.xlsx');
const workbook = xlsx.readFile(excelPath);

console.log('All Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach((sheetName, i) => {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\nSheet #${i + 1}: "${sheetName}" (${data.length} rows)`);
  if (data.length > 0) {
    console.log('Header Row (Row 1):', data[0]);
    if (data.length > 1) {
      console.log('Row 2:', data[1]);
    }
  }
});
