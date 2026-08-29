const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
  "2027 Batch IVYrData.xlsx",
  "02. Overall students database - 2028 Batch (III yr).xlsx",
  "BE23PT810_Coding_Skills_CA.xlsx"
];

files.forEach(filename => {
  const fPath = path.join(__dirname, filename);
  if (!fs.existsSync(fPath)) return;

  const wb = XLSX.readFile(fPath);
  console.log(`\n======================================================`);
  console.log(`FILE: ${filename}`);
  console.log(`Sheets: ${JSON.stringify(wb.SheetNames)}`);
  console.log(`======================================================`);

  wb.SheetNames.forEach(sName => {
    const ws = wb.Sheets[sName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!rows || rows.length === 0) return;

    // Check rows for columns containing "Company", "Placed", "Offer", "Salary", "CTC", "Status"
    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const row = rows[r] || [];
      row.forEach((cell, cIdx) => {
        if (cell && typeof cell === 'string') {
          const lower = cell.toLowerCase();
          if (lower.includes('company') || lower.includes('placed') || lower.includes('offer') || lower.includes('salary') || lower.includes('ctc') || lower.includes('package') || lower.includes('hexaware') || lower.includes('tcs') || lower.includes('zoho')) {
            console.log(`[${sName}] Found keyword "${cell.replace(/\n/g, ' ')}" at Row ${r}, Col ${cIdx}`);
          }
        }
      });
    }

    // Also check if any row data in the sheet has company names
    let placedCount = 0;
    const companyNamesFound = new Set();
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      row.forEach(cell => {
        if (cell && typeof cell === 'string') {
          const t = cell.trim();
          if (t === 'Placed' || t === 'Offer' || t.includes('Hexaware') || t.includes('TCS') || t.includes('Zoho') || t.includes('Infosys') || t.includes('Capgemini') || t.includes('Wipro') || t.includes('Accenture') || t.includes('Cognizant') || t.includes('CTS')) {
            placedCount++;
            companyNamesFound.add(t);
          }
        }
      });
    }

    if (placedCount > 0) {
      console.log(`>>> Sheet "${sName}" has ${placedCount} placement/company mentions:`, Array.from(companyNamesFound).slice(0, 10));
    }
  });
});
