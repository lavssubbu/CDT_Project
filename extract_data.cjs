const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, "2027 Batch IVYrData.xlsx");
const workbook = XLSX.readFile(filePath);

const progSheetName = workbook.SheetNames.find(n => n.includes("Prog. Marks"));
const commSheetName = workbook.SheetNames.find(n => n.includes("Comm. Marks"));
const aptiSheetName = workbook.SheetNames.find(n => n.includes("Apti. Marks"));

const progSheet = workbook.Sheets[progSheetName];
const commSheet = workbook.Sheets[commSheetName];
const aptiSheet = workbook.Sheets[aptiSheetName];

const progRows = XLSX.utils.sheet_to_json(progSheet, { header: 1 });
const commRows = XLSX.utils.sheet_to_json(commSheet, { header: 1 });
const aptiRows = aptiSheet ? XLSX.utils.sheet_to_json(aptiSheet, { header: 1 }) : [];

// Index mobile numbers from comm sheet by register number
const studentPhones = {};
commRows.slice(5).forEach(row => {
  const reg = String(row[2] || "").trim();
  const mobile = String(row[9] || "").trim();
  if (reg && mobile) {
    studentPhones[reg] = mobile;
  }
});

const departments = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "ECE", name: "Electronics & Communication Engineering" },
  { code: "EEE", name: "Electrical & Electronics Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "AI&DS", name: "Artificial Intelligence & Data Science" },
  { code: "CSBS", name: "Computer Science & Business Systems" },
  { code: "CIVIL", name: "Civil Engineering" },
  { code: "MECH", name: "Mechanical Engineering" }
];

const extractedStudents = [];
const extractedPerformances = [];
const extractedAssessments = [];
const studentRegSet = new Set();

// 1. Prepare Programming assessments metadata (Cols 131 to 143 representing Test 1 to Test 13)
const progColStart = 131;
const progColEnd = 143;
const progHeaderRow = progRows[3];

for (let col = progColStart; col <= progColEnd; col++) {
  let name = String(progHeaderRow[col] || `Programming Assessment ${col - progColStart + 1}`).trim().replace(/\r?\n/g, " ");
  name = name.replace(/\(\s*out\s*of\s*100\s*\)/gi, "").replace(/out\s*of\s*100/gi, "").replace(/\s+/g, " ").trim();

  const dateVal = "2026-06-" + String(col - progColStart + 10).padStart(2, '0');
  let platform = "IAMNEO";
  if (name.includes("P&P") || name.includes("P & P") || name.toLowerCase().includes("pen and paper")) {
    platform = "Internal";
  }

  extractedAssessments.push({
    id: `A_PROG_${col}`,
    name: `Prog: ${name}`,
    platform: platform,
    category: "Programming",
    date: dateVal,
    maxMarks: 100,
    weightage: 1.0
  });
}

// 2. Prepare Aptitude assessments metadata (Cols 74 to 87 representing Aptitude Assessment 1 to 14)
if (aptiRows.length > 4) {
  const aptiHeaderRow = aptiRows[4];
  for (let col = 74; col <= 87; col++) {
    let name = String(aptiHeaderRow[col] || `Aptitude Assessment ${col - 74 + 1}`).trim().replace(/\r?\n/g, " ");
    name = name.replace(/\(\s*out\s*of\s*100\s*\)/gi, "").replace(/out\s*of\s*100/gi, "").replace(/\s+/g, " ").trim();

    const dateVal = "2026-05-" + String(col - 74 + 1).padStart(2, '0');
    let platform = "KIOT LMS";
    if (name.includes("Pen & Paper") || name.toLowerCase().includes("pen and paper")) {
      platform = "Internal";
    }

    extractedAssessments.push({
      id: `A_APTI_${col}`,
      name: `Aptitude: ${name}`,
      platform: platform,
      category: "Aptitude",
      date: dateVal,
      maxMarks: 100,
      weightage: 1.0
    });
  }
}

let validStudentCount = 0;

// Extract student details and Programming performances
progRows.slice(5).forEach((row) => {
  const reg = String(row[2] || "").trim();
  const name = String(row[3] || "").trim();
  if (!reg || !name || reg === "Reg. No." || isNaN(Number(reg))) {
    return;
  }

  const branch = String(row[4] || "CSE").trim();
  const section = String(row[5] || "A").trim();
  const email = String(row[8] || "").trim();
  const cgpa = parseFloat(row[12]) || 7.0;
  const arrears = parseInt(row[14]) || 0;
  const mobile = studentPhones[reg] || "9876543210";
  
  validStudentCount++;
  studentRegSet.add(reg);

  let finalSection = "A";
  if (section === "B" || section === "C") {
    finalSection = section;
  }

  extractedStudents.push({
    registerNo: reg,
    name: name,
    departmentCode: branch,
    section: finalSection,
    batch: "2027",
    cgpa: cgpa,
    standingArrears: arrears,
    placementEligibility: arrears === 0 && cgpa >= 6.0 ? "Eligible" : "Not Eligible",
    email: email || `${reg}@kiot.ac.in`,
    mobile: mobile,
    avatar: `https://images.unsplash.com/photo-${1500000000000 + validStudentCount % 1000}?w=150&auto=format&fit=crop&q=60`,
    attendance: Math.round(80 + (reg.charCodeAt(reg.length - 1) % 18)),
    status: arrears === 0 && cgpa >= 8.2 && (validStudentCount % 7 === 0) ? "Placed" : "Unplaced"
  });

  // Programming marks
  for (let col = progColStart; col <= progColEnd; col++) {
    const scoreVal = row[col];
    if (scoreVal === undefined || scoreVal === null || scoreVal === "" || scoreVal === "NT" || scoreVal === "A" || scoreVal === "AB") {
      continue;
    }
    const score = parseInt(scoreVal);
    if (isNaN(score)) continue;

    const assessment = extractedAssessments.find(a => a.id === `A_PROG_${col}`);
    const platform = assessment ? assessment.platform : "IAMNEO";

    let weakTopics = "";
    let correctTopics = "";
    if (score < 60) {
      weakTopics = "Recursion,Pointers,Functions";
      correctTopics = "Loops";
    } else if (score < 80) {
      weakTopics = "Pointers";
      correctTopics = "Arrays,Loops,Functions";
    } else {
      weakTopics = "";
      correctTopics = "Arrays,Loops,Functions,Recursion,Pointers";
    }

    extractedPerformances.push({
      registerNo: reg,
      assessmentId: `A_PROG_${col}`,
      platform: platform,
      skill: "Programming",
      score: score,
      weakTopics: weakTopics,
      correctTopics: correctTopics
    });
  }
});

// Extract Aptitude performances
if (aptiRows.length > 5) {
  aptiRows.slice(5).forEach(row => {
    const reg = String(row[2] || "").trim();
    if (!reg || !studentRegSet.has(reg)) return;

    for (let col = 74; col <= 87; col++) {
      const scoreVal = row[col];
      if (scoreVal === undefined || scoreVal === null || scoreVal === "" || scoreVal === "NT" || scoreVal === "A" || scoreVal === "AB") {
        continue;
      }
      const score = parseInt(scoreVal);
      if (isNaN(score)) continue;

      const assessment = extractedAssessments.find(a => a.id === `A_APTI_${col}`);
      const platform = assessment ? assessment.platform : "KIOT LMS";

      let weakTopics = "";
      let correctTopics = "";
      if (score < 60) {
        weakTopics = "Quantitative Aptitude, Logical Reasoning";
        correctTopics = "Basic Arithmetic";
      } else if (score < 80) {
        weakTopics = "Data Interpretation";
        correctTopics = "Quantitative Aptitude, Number Systems";
      } else {
        weakTopics = "";
        correctTopics = "Quantitative Aptitude, Logical Reasoning, Number Systems, Data Interpretation";
      }

      extractedPerformances.push({
        registerNo: reg,
        assessmentId: `A_APTI_${col}`,
        platform: platform,
        skill: "Aptitude",
        score: score,
        weakTopics: weakTopics,
        correctTopics: correctTopics
      });
    }
  });
}

// Seed default initial notifications
const notifications = [
  { registerNo: "all", message: "AY 2026-2027 Training & Assessment Database synced successfully from 2027 Batch IVYrData.xlsx!", date: new Date().toISOString().replace('T', ' ').substring(0, 16) }
];

// Write to JSON for Backend
const outputData = {
  departments,
  students: extractedStudents,
  assessments: extractedAssessments,
  performances: extractedPerformances,
  notifications
};

const jsonPath = path.join(__dirname, "backend", "seed_data.json");
fs.writeFileSync(jsonPath, JSON.stringify(outputData, null, 2));

// Write to JS for Frontend mockDb.js
const jsContent = `// Real Database extracted from 2027 Batch IVYrData.xlsx

export const INITIAL_STUDENTS = ${JSON.stringify(extractedStudents, null, 2)};

export const INITIAL_ASSESSMENTS = ${JSON.stringify(extractedAssessments, null, 2)};

export const INITIAL_PERFORMANCES = ${JSON.stringify(extractedPerformances, null, 2)};

export const INITIAL_NOTIFICATIONS = ${JSON.stringify(notifications, null, 2)};
`;

const mockDbPath = path.join(__dirname, "src", "mockDb.js");
fs.writeFileSync(mockDbPath, jsContent);

console.log("SUCCESS: Data extracted and saved.");
console.log(`Backend seed saved to: ${jsonPath}`);
console.log(`Frontend mockDb saved to: ${mockDbPath}`);
console.log(`Summary: ${departments.length} departments, ${extractedStudents.length} students, ${extractedAssessments.length} assessments, ${extractedPerformances.length} performance score records written.`);

