const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelPath = path.join(__dirname, '2027 Batch IVYrData.xlsx');
const workbook = xlsx.readFile(excelPath);
const sheet = workbook.Sheets['MockInterview'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const mockInterviewRecords = [];

rows.forEach((r, idx) => {
  if (!r || r.length < 3) return;
  const rawReg = String(r[2] || '').trim();
  if (!rawReg || !/^\d{11,13}$/.test(rawReg)) return;

  const regNo = rawReg;
  const rollNo = String(r[1] || '').trim();
  const name = String(r[3] || '').trim();
  const branch = String(r[4] || '').trim();
  const section = String(r[5] || '').trim();
  const email = String(r[6] || '').trim();
  const willingness = String(r[7] || '').trim();
  const aptiProgRaw = r[8];
  const techHrRaw = r[9];

  let aptiProgScore = typeof aptiProgRaw === 'number' ? Math.round(aptiProgRaw) : null;
  let techHrScore = typeof techHrRaw === 'number' ? Math.round(techHrRaw) : null;

  mockInterviewRecords.push({
    sNo: r[0],
    rollNo,
    regNo,
    name,
    branch,
    section: section === 'NIL' ? 'A' : section,
    email,
    willingness,
    aptiProgRaw,
    techHrRaw,
    aptiProgScore,
    techHrScore
  });
});

console.log(`Parsed ${mockInterviewRecords.length} Hexaware Mock Interview Records.`);
fs.writeFileSync(path.join(__dirname, 'hexaware_mock_records.json'), JSON.stringify(mockInterviewRecords, null, 2));
console.log('Saved to hexaware_mock_records.json');
