const http = require('http');

http.get('http://localhost:5296/api/students', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const students = JSON.parse(data);
      console.log(`Success! Fetched ${students.length} students.`);
      console.log("Sample Student JSON:", JSON.stringify(students[0], null, 2));
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
      console.log("Response text:", data.slice(0, 500));
    }
  });
}).on('error', (e) => {
  console.error("API Connection Error:", e.message);
});
