const XLSX = require('xlsx');
const path = require('path');

const ivPath = path.join(__dirname, "2027 Batch IVYrData.xlsx");
const ivWb = XLSX.readFile(ivPath);
const attendSheet = ivWb.Sheets['Attend.'];
const rows = XLSX.utils.sheet_to_json(attendSheet, { header: 1 });

const placedMap = {};

for (let r = 5; r < rows.length; r++) {
  const row = rows[r];
  if (!row) continue;
  const reg = String(row[2] || "").trim();
  const name = String(row[3] || "").trim();
  let company = String(row[12] || "").trim();
  const statusDiv = String(row[14] || "").trim();

  if (reg && reg.match(/^\d{10,14}$/)) {
    if (company || statusDiv.toLowerCase().includes('placed')) {
      if (!company) company = "Hexaware Technologies";
      if (company === "Hexaware") company = "Hexaware Technologies";
      placedMap[reg] = {
        name,
        company,
        status: "Placed",
        statusDiv
      };
    }
  }
}

console.log(`Total Placed Students Found in 2027 Batch: ${Object.keys(placedMap).length}`);

// Group by company
const compCounts = {};
Object.values(placedMap).forEach(p => {
  compCounts[p.company] = (compCounts[p.company] || 0) + 1;
});
console.log("Placed by Company:");
console.table(compCounts);

console.log("\nSample 10 Placed Students:");
console.table(Object.entries(placedMap).slice(0, 10).map(([reg, data]) => ({ reg, ...data })));
