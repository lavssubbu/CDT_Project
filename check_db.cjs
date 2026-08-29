async function main() {
  try {
    const studentsRes = await fetch('http://localhost:5296/api/students');
    const students = await studentsRes.json();
    
    const assessmentsRes = await fetch('http://localhost:5296/api/assessments');
    const assessments = await assessmentsRes.json();

    const notificationsRes = await fetch('http://localhost:5296/api/notifications');
    const notifications = await notificationsRes.json();

    console.log('=== DATABASE STATUS SUMMARY ===');
    console.log(`Total Students: ${students.length}`);
    console.log(`Total Assessments: ${assessments.length}`);
    console.log(`Total Notifications: ${notifications.length}`);

    // Department breakdown
    const deptMap = {};
    const batchMap = {};
    students.forEach(s => {
      const dept = s.department || s.departmentCode || s.DepartmentCode || 'Unknown';
      deptMap[dept] = (deptMap[dept] || 0) + 1;

      const batch = s.batch || s.batchName || s.Batch || 'Unknown';
      batchMap[batch] = (batchMap[batch] || 0) + 1;
    });

    console.log('\n--- Students by Department ---');
    console.table(deptMap);

    console.log('\n--- Students by Batch ---');
    console.table(batchMap);

    console.log('\n--- Sample Student Record ---');
    console.log(JSON.stringify(students[0], null, 2));

    console.log('\n--- Assessments Sample (Count: ' + assessments.length + ') ---');
    console.log(JSON.stringify(assessments.slice(0, 3), null, 2));
  } catch (err) {
    console.error('Error fetching database status:', err);
  }
}

main();
