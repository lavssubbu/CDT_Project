const fs = require('fs');
const path = require('path');

const records = JSON.parse(fs.readFileSync(path.join(__dirname, 'hexaware_mock_records.json'), 'utf8'));

const mapObj = {};
records.forEach(r => {
  mapObj[r.regNo] = {
    regNo: r.regNo,
    rollNo: r.rollNo,
    name: r.name,
    branch: r.branch,
    section: r.section,
    email: r.email,
    willingness: r.willingness,
    aptiProgScore: r.aptiProgScore,
    techHrScore: r.techHrScore,
    aptiProgRaw: r.aptiProgRaw,
    techHrRaw: r.techHrRaw
  };
});

console.log('Hexaware Mock Map count:', Object.keys(mapObj).length);

const jsOutput = `export const HEXAWARE_MOCK_RECORDS = ${JSON.stringify(mapObj, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, 'src', 'hexawareData.js'), jsOutput);
console.log('Exported to src/hexawareData.js');
