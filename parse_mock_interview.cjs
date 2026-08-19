const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '2027 Batch IVYrData.xlsx');
const workbook = xlsx.readFile(excelPath);

const sheet = workbook.Sheets['MockInterview'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const mockData = {};
let validCount = 0;
let numericTechCount = 0;
let intCount = 0;
let absCount = 0;

rows.forEach((r, idx) => {
  if (!r || r.length < 3) return;
  const rawReg = String(r[2] || '').trim();
  if (!rawReg || !/^\d{11,13}$/.test(rawReg)) return;

  const regNo = rawReg;
  const mockAptiProg = r[8];
  const mockTechHR = r[9];

  validCount++;

  let techScore = null;
  let aptiProgScore = null;
  let status = 'Not Attempted';
  let grade = 'Pending Attempt';

  if (typeof mockTechHR === 'number') {
    techScore = Math.min(100, Math.max(0, Math.round(mockTechHR)));
    numericTechCount++;
    status = 'Completed';
    if (techScore >= 80) grade = 'Placement Ready';
    else if (techScore >= 60) grade = 'Proficient';
    else if (techScore >= 40) grade = 'Foundation';
    else grade = 'Remedial Needed';
  } else if (String(mockTechHR).toUpperCase().includes('INT') || String(mockAptiProg).toUpperCase().includes('INT')) {
    intCount++;
    status = 'Interested';
    grade = 'Registered / Interested';
  } else if (String(mockTechHR).toUpperCase().includes('ABS') || String(mockAptiProg).toUpperCase().includes('ABS')) {
    absCount++;
    status = 'Absent';
    grade = 'Absent for Interview';
  }

  mockData[regNo] = {
    regNo,
    rollNo: r[1],
    name: r[3],
    branch: r[4],
    section: r[5],
    email: r[6],
    willingness: r[7],
    mockAptiProgRaw: mockAptiProg,
    mockTechHRRaw: mockTechHR,
    techScore,
    status,
    grade
  };
});

console.log('--- Mock Interview Summary ---');
console.log('Total Student Records Parsed:', validCount);
console.log('Numeric Tech HR Scores Evaluated:', numericTechCount);
console.log('Registered/Interested Status:', intCount);
console.log('Absent Status:', absCount);

console.log('\nFirst 10 Parsed Student Mock Records:');
console.log(Object.values(mockData).slice(0, 10));
