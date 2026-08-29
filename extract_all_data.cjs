const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 1. Setup departments
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

const normalizeBranch = (b) => {
  if (!b) return "CSE";
  const s = String(b).trim().toUpperCase();
  if (s.startsWith("MECH")) return "MECH";
  if (s.startsWith("CIVIL") || s.startsWith("CE")) return "CIVIL";
  if (s.includes("AI") || s.includes("AIDS")) return "AI&DS";
  if (s.includes("CSBS") || s.includes("BUSINESS")) return "CSBS";
  if (s.includes("EEE") || s.includes("ELECTRICAL")) return "EEE";
  if (s.includes("ECE") || s.includes("ELECTRONIC")) return "ECE";
  if (s.includes("IT") || s.includes("INFO")) return "IT";
  if (s.includes("CSE") || s.includes("COMP")) return "CSE";
  return s;
};

const allStudents = [];
const allAssessments = [];
const allPerformances = [];
const studentRegSet = new Set();

let studentIndex = 0;

// ==========================================
// A. EXTRACT 2027 BATCH (IV YEAR)
// ==========================================
const ivFilePath = path.join(__dirname, "2027 Batch IVYrData.xlsx");
if (fs.existsSync(ivFilePath)) {
  console.log("Processing IV Year (2027 Batch)...");
  const ivWb = XLSX.readFile(ivFilePath);

  const progSheetName = ivWb.SheetNames.find(n => n.includes("Prog. Marks"));
  const commSheetName = ivWb.SheetNames.find(n => n.includes("Comm. Marks"));
  const aptiSheetName = ivWb.SheetNames.find(n => n.includes("Apti. Marks"));

  const progSheet = ivWb.Sheets[progSheetName];
  const commSheet = ivWb.Sheets[commSheetName];
  const aptiSheet = ivWb.Sheets[aptiSheetName];

  const progRows = XLSX.utils.sheet_to_json(progSheet, { header: 1 });
  const commRows = XLSX.utils.sheet_to_json(commSheet, { header: 1 });
  const aptiRows = aptiSheet ? XLSX.utils.sheet_to_json(aptiSheet, { header: 1 }) : [];
  
  // Extract real company placed information from Attend. sheet
  const attendSheet = ivWb.Sheets['Attend.'];
  const attendRows = attendSheet ? XLSX.utils.sheet_to_json(attendSheet, { header: 1 }) : [];
  const placedMap = {};
  if (attendRows.length > 5) {
    for (let r = 5; r < attendRows.length; r++) {
      const row = attendRows[r];
      if (!row) continue;
      const reg = String(row[2] || "").trim();
      let company = String(row[12] || "").trim();
      const statusDiv = String(row[14] || "").trim();
      if (reg && reg.match(/^\d{10,14}$/) && (company || statusDiv.toLowerCase().includes('placed'))) {
        if (!company || company === "Hexaware") company = "Hexaware Technologies";
        placedMap[reg] = company;
      }
    }
  }

  const studentPhones = {};
  commRows.slice(5).forEach(row => {
    const reg = String(row[2] || "").trim();
    const mobile = String(row[9] || "").trim();
    if (reg && mobile) studentPhones[reg] = mobile;
  });

  const progColStart = 131;
  const progColEnd = 143;
  const progHeaderRow = progRows[3] || [];

  for (let col = progColStart; col <= progColEnd; col++) {
    let name = String(progHeaderRow[col] || `Prog Assessment ${col - progColStart + 1}`).trim().replace(/\r?\n/g, " ");
    name = name.replace(/\(\s*out\s*of\s*100\s*\)/gi, "").replace(/out\s*of\s*100/gi, "").replace(/\s+/g, " ").trim();
    const dateVal = "2026-06-" + String(col - progColStart + 10).padStart(2, '0');
    let platform = (name.includes("P&P") || name.toLowerCase().includes("pen and paper")) ? "Internal" : "IAMNEO";

    allAssessments.push({
      id: `A_2027_PROG_${col}`,
      name: `IV-Yr Prog: ${name}`,
      platform: platform,
      category: "Programming",
      date: dateVal,
      maxMarks: 100,
      weightage: 1.0
    });
  }

  if (aptiRows.length > 4) {
    const aptiHeaderRow = aptiRows[4] || [];
    for (let col = 74; col <= 87; col++) {
      let name = String(aptiHeaderRow[col] || `Aptitude Assessment ${col - 74 + 1}`).trim().replace(/\r?\n/g, " ");
      name = name.replace(/\(\s*out\s*of\s*100\s*\)/gi, "").replace(/out\s*of\s*100/gi, "").replace(/\s+/g, " ").trim();
      const dateVal = "2026-05-" + String(col - 74 + 1).padStart(2, '0');
      let platform = (name.includes("Pen & Paper") || name.toLowerCase().includes("pen and paper")) ? "Internal" : "KIOT LMS";

      allAssessments.push({
        id: `A_2027_APTI_${col}`,
        name: `IV-Yr Apti: ${name}`,
        platform: platform,
        category: "Aptitude",
        date: dateVal,
        maxMarks: 100,
        weightage: 1.0
      });
    }
  }

  progRows.slice(5).forEach(row => {
    const reg = String(row[2] || "").trim();
    const name = String(row[3] || "").trim();
    if (!reg || !name || reg === "Reg. No." || isNaN(Number(reg))) return;

    studentIndex++;
    studentRegSet.add(reg);
    const branch = normalizeBranch(row[4]);
    const section = String(row[5] || "A").trim().toUpperCase() === "B" ? "B" : (String(row[5] || "").trim().toUpperCase() === "C" ? "C" : "A");
    const email = String(row[8] || `${reg}@kiot.ac.in`).trim();
    const cgpa = parseFloat(row[12]) || 7.0;
    const arrears = parseInt(row[14]) || 0;
    const mobile = studentPhones[reg] || "9876543210";
    const company = placedMap[reg] || "";
    const isPlaced = Boolean(company);

    allStudents.push({
      registerNo: reg,
      name: name,
      departmentCode: branch,
      section: section,
      batch: "2027",
      cgpa: cgpa,
      standingArrears: arrears,
      placementEligibility: arrears === 0 && cgpa >= 6.0 ? "Eligible" : "Not Eligible",
      email: email,
      mobile: mobile,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + studentIndex % 1000}?w=150&auto=format&fit=crop&q=60`,
      attendance: Math.round(80 + (reg.charCodeAt(reg.length - 1) % 18)),
      status: isPlaced ? "Placed" : "Unplaced",
      companyPlaced: company
    });

    // IV Year Prog scores
    for (let col = progColStart; col <= progColEnd; col++) {
      const scoreVal = row[col];
      if (scoreVal === undefined || scoreVal === null || scoreVal === "" || scoreVal === "NT" || scoreVal === "A" || scoreVal === "AB") continue;
      const score = parseInt(scoreVal);
      if (isNaN(score)) continue;

      const assessment = allAssessments.find(a => a.id === `A_2027_PROG_${col}`);
      allPerformances.push({
        registerNo: reg,
        assessmentId: `A_2027_PROG_${col}`,
        platform: assessment ? assessment.platform : "IAMNEO",
        skill: "Programming",
        score: score,
        weakTopics: score < 60 ? "Recursion,Pointers,Functions" : (score < 80 ? "Pointers" : ""),
        correctTopics: score < 60 ? "Loops" : (score < 80 ? "Arrays,Loops,Functions" : "Arrays,Loops,Functions,Recursion,Pointers")
      });
    }
  });

  // IV Year Apti scores
  if (aptiRows.length > 5) {
    aptiRows.slice(5).forEach(row => {
      const reg = String(row[2] || "").trim();
      if (!reg || !studentRegSet.has(reg)) return;

      for (let col = 74; col <= 87; col++) {
        const scoreVal = row[col];
        if (scoreVal === undefined || scoreVal === null || scoreVal === "" || scoreVal === "NT" || scoreVal === "A" || scoreVal === "AB") continue;
        const score = parseInt(scoreVal);
        if (isNaN(score)) continue;

        const assessment = allAssessments.find(a => a.id === `A_2027_APTI_${col}`);
        allPerformances.push({
          registerNo: reg,
          assessmentId: `A_2027_APTI_${col}`,
          platform: assessment ? assessment.platform : "KIOT LMS",
          skill: "Aptitude",
          score: score,
          weakTopics: score < 60 ? "Quantitative Aptitude, Logical Reasoning" : (score < 80 ? "Data Interpretation" : ""),
          correctTopics: score < 60 ? "Basic Arithmetic" : "Quantitative Aptitude, Logical Reasoning, Number Systems"
        });
      }
    });
  }
}

// ==========================================
// B. EXTRACT 2028 BATCH (III YEAR)
// ==========================================
const iiiFilePath = path.join(__dirname, "02. Overall students database - 2028 Batch (III yr).xlsx");
if (fs.existsSync(iiiFilePath)) {
  console.log("Processing III Year (2028 Batch)...");
  const iiiWb = XLSX.readFile(iiiFilePath);

  const attendSheet = iiiWb.Sheets['Attend.'] || iiiWb.Sheets['overall'];
  const techSheet = iiiWb.Sheets['Tech.Marks.'];
  const aptiSheet = iiiWb.Sheets['Apti.Marks'];

  const attendRows = XLSX.utils.sheet_to_json(attendSheet, { header: 1 });
  const techRows = techSheet ? XLSX.utils.sheet_to_json(techSheet, { header: 1 }) : [];
  const aptiRows = aptiSheet ? XLSX.utils.sheet_to_json(aptiSheet, { header: 1 }) : [];

  // Register III Year Technical Assessments
  // Cols 53 to 67 (Pre Ass, Ass.1 to Ass.14) and Col 86 (Post Ass)
  if (techRows.length > 6) {
    const techHRow = techRows[6] || [];
    for (let col = 53; col <= 67; col++) {
      let tName = String(techHRow[col] || `Tech Ass ${col - 53}`).trim().replace(/\r?\n/g, " ");
      allAssessments.push({
        id: `A_2028_TECH_${col}`,
        name: `III-Yr Prog: ${tName}`,
        platform: "IAMNEO",
        category: "Programming",
        date: "2026-07-15",
        maxMarks: 100,
        weightage: 1.0
      });
    }
    allAssessments.push({
      id: `A_2028_TECH_86`,
      name: `III-Yr Prog: Post Assessment`,
      platform: "IAMNEO",
      category: "Programming",
      date: "2026-07-30",
      maxMarks: 100,
      weightage: 1.0
    });
  }

  // Register III Year Aptitude Assessments
  // Cols 61 to 71
  if (aptiRows.length > 6) {
    const aptiHRow = aptiRows[6] || [];
    [61, 63, 65, 67, 69, 71].forEach(col => {
      let aName = String(aptiHRow[col] || `Apti Ass ${col}`).trim().replace(/\r?\n/g, " ");
      allAssessments.push({
        id: `A_2028_APTI_${col}`,
        name: `III-Yr Apti: ${aName}`,
        platform: "KIOT LMS",
        category: "Aptitude",
        date: "2026-04-10",
        maxMarks: 100,
        weightage: 1.0
      });
    });
  }

  // Map students from Attend sheet
  attendRows.slice(7).forEach(row => {
    const reg = String(row[2] || "").trim();
    const name = String(row[3] || "").trim();
    if (!reg || !name || reg === "Register No." || isNaN(Number(reg))) return;
    if (studentRegSet.has(reg)) return;

    studentIndex++;
    studentRegSet.add(reg);

    const branch = normalizeBranch(row[4]);
    let section = String(row[5] || "A").trim().toUpperCase();
    if (section !== "B" && section !== "C") section = "A";

    const mobile = String(row[6] || "9876543210").replace(/\s+/g, "");
    const email = String(row[7] || `${reg}@kiot.ac.in`).trim();
    const cgpaRaw = parseFloat(row[10]);
    const cgpa = isNaN(cgpaRaw) || cgpaRaw > 10 ? 7.5 : cgpaRaw;
    
    let arrears = 0;
    const arrVal = row[11];
    if (arrVal && !isNaN(parseInt(arrVal))) arrears = parseInt(arrVal);

    // Attendance % from Col 179 or 181
    let att = 88;
    const attRaw = parseFloat(row[179] || row[181]);
    if (!isNaN(attRaw) && attRaw >= 40 && attRaw <= 100) att = Math.round(attRaw);

    const placementWill = String(row[13] || "Yes").toLowerCase();
    const isEligible = arrears === 0 && cgpa >= 6.0 && (placementWill === "yes" || placementWill === "y");

    allStudents.push({
      registerNo: reg,
      name: name,
      departmentCode: branch,
      section: section,
      batch: "2028",
      cgpa: Math.round(cgpa * 100) / 100,
      standingArrears: arrears,
      placementEligibility: isEligible ? "Eligible" : "Not Eligible",
      email: email,
      mobile: mobile || "9876543210",
      avatar: `https://images.unsplash.com/photo-${1500000000000 + studentIndex % 1000}?w=150&auto=format&fit=crop&q=60`,
      attendance: att,
      status: "Unplaced",
      companyPlaced: ""
    });
  });

  // Extract III Year Tech Marks
  if (techRows.length > 7) {
    techRows.slice(7).forEach(row => {
      const reg = String(row[2] || "").trim();
      if (!reg || !studentRegSet.has(reg)) return;

      for (let col = 53; col <= 67; col++) {
        const scoreVal = row[col];
        if (scoreVal === undefined || scoreVal === null || scoreVal === "" || scoreVal === "NT" || scoreVal === "A" || scoreVal === "AB" || scoreVal === "-") continue;
        const score = Math.min(100, Math.max(0, parseInt(scoreVal)));
        if (isNaN(score)) continue;

        allPerformances.push({
          registerNo: reg,
          assessmentId: `A_2028_TECH_${col}`,
          platform: "IAMNEO",
          skill: "Programming",
          score: score,
          weakTopics: score < 60 ? "Data Structures, Pointers" : (score < 80 ? "Pointers" : ""),
          correctTopics: score < 60 ? "Syntax, Basics" : "Data Structures, Logic, Algorithms"
        });
      }

      // Post Assessment
      const postScoreVal = row[86];
      if (postScoreVal !== undefined && postScoreVal !== null && postScoreVal !== "" && postScoreVal !== "NT" && postScoreVal !== "A" && postScoreVal !== "AB" && postScoreVal !== "-") {
        const score = Math.min(100, Math.max(0, parseInt(postScoreVal)));
        if (!isNaN(score)) {
          allPerformances.push({
            registerNo: reg,
            assessmentId: `A_2028_TECH_86`,
            platform: "IAMNEO",
            skill: "Programming",
            score: score,
            weakTopics: score < 60 ? "Dynamic Programming" : "",
            correctTopics: "Arrays, Sorting, Search, OOP"
          });
        }
      }
    });
  }

  // Extract III Year Apti Marks
  if (aptiRows.length > 7) {
    aptiRows.slice(7).forEach(row => {
      const reg = String(row[2] || "").trim();
      if (!reg || !studentRegSet.has(reg)) return;

      for (const col of [61, 63, 65, 67, 69, 71]) {
        const scoreVal = row[col];
        if (scoreVal === undefined || scoreVal === null || scoreVal === "" || scoreVal === "NT" || scoreVal === "A" || scoreVal === "AB" || scoreVal === "-") continue;
        const score = Math.min(100, Math.max(0, parseInt(scoreVal)));
        if (isNaN(score)) continue;

        allPerformances.push({
          registerNo: reg,
          assessmentId: `A_2028_APTI_${col}`,
          platform: "KIOT LMS",
          skill: "Aptitude",
          score: score,
          weakTopics: score < 60 ? "Quantitative Ability, Probability" : "",
          correctTopics: "Logical Reasoning, Numerical Series"
        });
      }
    });
  }
}

// ==========================================
// C. EXTRACT BE23PT810 CODING SKILLS CA
// ==========================================
const caFilePath = path.join(__dirname, "BE23PT810_Coding_Skills_CA.xlsx");
if (fs.existsSync(caFilePath)) {
  console.log("Processing BE23PT810 Coding Skills CA...");
  const caWb = XLSX.readFile(caFilePath);
  const caSheet = caWb.Sheets['Overall Analysis'] || caWb.Sheets[caWb.SheetNames[0]];
  const caRows = XLSX.utils.sheet_to_json(caSheet, { defval: "" });

  const caAssId = "A_2028_CODING_SKILLS_CA";
  allAssessments.push({
    id: caAssId,
    name: "III-Yr: BE23PT810 Coding Skills CA",
    platform: "KIOT LMS",
    category: "Programming",
    date: "2026-08-25",
    maxMarks: 100,
    weightage: 1.0
  });

  const emailToReg = {};
  allStudents.forEach(s => {
    if (s.email) emailToReg[s.email.toLowerCase().trim()] = s.registerNo;
  });

  let caScoresCount = 0;
  caRows.forEach(row => {
    const email = String(row['Email address'] || '').toLowerCase().trim();
    const regNo = emailToReg[email];
    if (!regNo) return;

    const totalVal = row['Total'];
    if (totalVal === undefined || totalVal === null || totalVal === '' || totalVal === '-') return;
    const total = parseFloat(totalVal);
    if (isNaN(total)) return;

    const mcq = parseFloat(row['MCQ']) || 0;
    const debug = parseFloat(row['Debugging']) || 0;
    const coding = parseFloat(row['Coding '] || row['Coding']) || 0;

    let weakTopics = [];
    let correctTopics = [];

    if (mcq < 15) weakTopics.push("Core MCQ Concepts");
    else correctTopics.push("MCQ Foundations");

    if (debug < 30) weakTopics.push("Code Tracing & Debugging");
    else correctTopics.push("Code Debugging");

    if (coding < 15) weakTopics.push("Algorithms & Logic Building");
    else correctTopics.push("Algorithm Implementation");

    if (weakTopics.length === 0 && total < 60) weakTopics.push("Data Structures, Logic");
    if (correctTopics.length === 0) correctTopics.push("Syntax & Basic Logic");

    allPerformances.push({
      registerNo: regNo,
      assessmentId: caAssId,
      platform: "KIOT LMS",
      skill: "Programming",
      score: Math.min(100, Math.max(0, Math.round(total))),
      weakTopics: weakTopics.join(", "),
      correctTopics: correctTopics.join(", ")
    });
    caScoresCount++;
  });
  console.log(`Ingested ${caScoresCount} student scores for BE23PT810 Coding Skills CA.`);
}

// Notifications
const notifications = [
  { registerNo: "all", message: "AY 2026-2027 Unified Student Database updated: III Year (2028 Batch) and IV Year (2027 Batch) active!", date: new Date().toISOString().replace('T', ' ').substring(0, 16) }
];

// Write backend seed_data.json
const outputData = {
  departments,
  students: allStudents,
  assessments: allAssessments,
  performances: allPerformances,
  notifications
};

const jsonPath = path.join(__dirname, "backend", "seed_data.json");
fs.writeFileSync(jsonPath, JSON.stringify(outputData, null, 2));

// Write frontend mockDb.js
const jsContent = `// Real Unified Database extracted from 2027 Batch & 2028 Batch Excel files

export const INITIAL_STUDENTS = ${JSON.stringify(allStudents, null, 2)};

export const INITIAL_ASSESSMENTS = ${JSON.stringify(allAssessments, null, 2)};

export const INITIAL_PERFORMANCES = ${JSON.stringify(allPerformances, null, 2)};

export const INITIAL_NOTIFICATIONS = ${JSON.stringify(notifications, null, 2)};
`;

const mockDbPath = path.join(__dirname, "src", "mockDb.js");
fs.writeFileSync(mockDbPath, jsContent);

console.log("\n=================== EXTRACTION SUMMARY ===================");
console.log(`Total Departments: ${departments.length}`);
console.log(`Total Students: ${allStudents.length}`);
const batchCounts = {};
const deptCounts = {};
allStudents.forEach(s => {
  batchCounts[s.batch] = (batchCounts[s.batch] || 0) + 1;
  deptCounts[s.departmentCode] = (deptCounts[s.departmentCode] || 0) + 1;
});
console.log("Students by Batch:", batchCounts);
console.log("Students by Department:", deptCounts);
console.log(`Total Assessments: ${allAssessments.length}`);
console.log(`Total Performance Rows: ${allPerformances.length}`);
console.log(`Saved backend seed: ${jsonPath}`);
console.log(`Saved frontend mockDb: ${mockDbPath}`);
console.log("==========================================================");
