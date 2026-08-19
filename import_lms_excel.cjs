const XLSX = require('xlsx');
const fs = require('fs');
const http = require('http');
const path = require('path');

const lmsDir = "d:\\2026\\KIOT\\July\\KIOT LMS";
const backendUrl = "http://localhost:5296";

function getLatestExcelFile() {
  if (!fs.existsSync(lmsDir)) {
    throw new Error(`LMS Directory not found at ${lmsDir}`);
  }
  const files = fs.readdirSync(lmsDir);
  let latestFile = null;
  let latestMtime = 0;
  
  files.forEach(file => {
    if ((file.endsWith('.xlsx') || file.endsWith('.xls')) && file.includes('-grades')) {
      const fullPath = path.join(lmsDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latestFile = fullPath;
      }
    }
  });
  return { excelPath: latestFile, mtime: latestMtime };
}

let excelPath;
let mtime;

try {
  const result = getLatestExcelFile();
  excelPath = result.excelPath;
  mtime = result.mtime;
} catch (err) {
  console.error("Error finding LMS directory:", err.message);
  process.exit(1);
}

if (!excelPath) {
  console.error("Error: No grades Excel file containing '-grades' found in " + lmsDir);
  process.exit(1);
}

// Extract assessment details from filename
const baseName = path.basename(excelPath, path.extname(excelPath));
let assessmentName = baseName;
if (assessmentName.startsWith("PracticeAssessmentsC-")) {
  assessmentName = assessmentName.substring("PracticeAssessmentsC-".length);
}
if (assessmentName.endsWith("-grades")) {
  assessmentName = assessmentName.substring(0, assessmentName.length - "-grades".length);
}

let category = "Aptitude";
const lowerName = assessmentName.toLowerCase();
if (lowerName.includes("programming") || lowerName.includes("coding")) {
  category = "Programming";
} else if (lowerName.includes("sql") || lowerName.includes("db")) {
  category = "SQL";
}

const fileDate = new Date(mtime).toISOString().split('T')[0];

console.log(`Resolved Assessment: "${assessmentName}"`);
console.log(`Category: "${category}" | Date: "${fileDate}"`);
console.log(`LMS File Source: ${excelPath}`);

// 1. Fetch students from API to map Email -> RegisterNo
function getStudents() {
  return new Promise((resolve, reject) => {
    http.get(`${backendUrl}/api/students`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const students = JSON.parse(data);
          const emailMap = {};
          students.forEach(s => {
            if (s.email) {
              emailMap[s.email.toLowerCase().trim()] = s.registerNo;
            }
          });
          resolve(emailMap);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 2. Post CSV to backend
function postCsv(csvText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ csvText });
    const req = http.request(`${backendUrl}/api/assessments/sync-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse response: " + data));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  try {
    console.log("Fetching students mapping from C# Backend...");
    const emailToReg = await getStudents();
    console.log(`Loaded ${Object.keys(emailToReg).length} student email mappings.`);

    console.log("Parsing LMS Excel file...");
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet); // default reads as object with headers

    console.log(`Found ${rows.length} rows in spreadsheet.`);

    let csvLines = [];
    let mappedCount = 0;

    // Detect grade column name and max value dynamically
    let gradeKey = null;
    let maxGrade = 100.0;
    
    if (rows.length > 0) {
      Object.keys(rows[0]).forEach(key => {
        if (key.startsWith('Grade/')) {
          gradeKey = key;
          maxGrade = parseFloat(key.replace('Grade/', '')) || 100.0;
        }
      });
    }

    if (!gradeKey) {
      console.error("Error: Could not locate a 'Grade/X.X' column in the Excel file.");
      process.exit(1);
    }
    console.log(`Detected grade column "${gradeKey}" with max grade value: ${maxGrade}`);

    rows.forEach((row, idx) => {
      const email = String(row['Email address'] || '').toLowerCase().trim();
      const gradeStr = String(row[gradeKey] || '').trim();
      
      if (!email || gradeStr === 'Overall average' || gradeStr === '-') {
        return; // skip non-grades / footer average rows
      }

      const regNo = emailToReg[email];
      if (!regNo) {
        return; // Skip if student not registered in the database
      }

      const grade = parseFloat(gradeStr);
      if (isNaN(grade)) return;

      // Map score to percentage (out of 100)
      const score = Math.round((grade / maxGrade) * 100);

      // Weak topics & Correct topics based on percentage score
      let weak = "Aptitude Foundations";
      let correct = "Basic Arithmetic";
      if (score >= 80) {
        weak = "";
        correct = "Quantitative Aptitude, Logical Reasoning, Number Systems";
      } else if (score >= 60) {
        weak = "Logical Reasoning";
        correct = "Quantitative Aptitude, Number Systems";
      } else {
        weak = "Quantitative Aptitude, Number Systems, Logical Reasoning";
        correct = "";
      }

      // CSV line format: RegisterNo, AssessmentName, Platform, Category, Date, MaxMarks, Score, Weak, Correct
      const csvLine = `"${regNo}","${assessmentName}","KIOT LMS","${category}","${fileDate}",100,${score},"${weak}","${correct}"`;
      csvLines.push(csvLine);
      mappedCount++;
    });

    if (csvLines.length === 0) {
      console.log("No valid rows matched. Seeding aborted.");
      return;
    }

    console.log(`Mapped ${mappedCount} student rows to Register Numbers.`);
    console.log("Sending CSV data payload to C# REST API...");
    const res = await postCsv(csvLines.join("\n"));
    console.log("API Response:", res);
    
    // Output a structured JSON line at the very end to be captured by process runners
    const finalResult = {
      status: "SUCCESS",
      importedCount: res.importedCount,
      assessmentName: assessmentName,
      category: category,
      date: fileDate,
      sourceFile: path.basename(excelPath)
    };
    console.log("\nJSON_RESULT:" + JSON.stringify(finalResult));
    console.log(`SUCCESS: Successfully synchronized ${res.importedCount} LMS test score records!`);
  } catch (e) {
    console.error("ETL ERROR:", e);
  }
}

run();
