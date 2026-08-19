using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UglyToad.PdfPig;
using backend.Data;
using System.Text;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/resume")]
    public class ResumeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ResumeController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("upload/{registerNo}")]
        public async Task<IActionResult> UploadResume([FromRoute] string registerNo, [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var student = await _context.Students.FindAsync(registerNo);
            if (student == null)
                return NotFound("Student not found.");

            try
            {
                using var stream = file.OpenReadStream();
                using var document = PdfDocument.Open(stream);
                var textBuilder = new StringBuilder();

                foreach (var page in document.GetPages())
                {
                    textBuilder.AppendLine(page.Text);
                }

                string fullText = textBuilder.ToString();
                student.ResumeText = fullText;
                await _context.SaveChangesAsync();

                var parsedDetails = ParseResumeText(fullText, student.DepartmentCode);

                return Ok(new { 
                    success = true, 
                    message = "Resume uploaded successfully",
                    resumeText = fullText,
                    parsedDetails = parsedDetails
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error parsing PDF: {ex.Message}");
            }
        }

        public static object ParseResumeText(string text, string deptCode = "CSE")
        {
            var textUpper = text.ToUpper();

            var potentialSkills = new[] {
                "C#", "C++", "EMBEDDED C", "PYTHON", "JAVA", "JAVASCRIPT", "TYPESCRIPT", "PHP", "RUBY", "GO", "RUST",
                "FLUTTER", "SWIFT", "KOTLIN", "REACT", "NODE.JS", "NODEJS", "SPRING BOOT", "EXPRESS", "HTML", "CSS",
                "TAILWIND", "BOOTSTRAP", "SQL", "MYSQL", "POSTGRESQL", "MONGODB", "ORACLE", "FIREBASE", "AWS", "AZURE",
                "DOCKER", "KUBERNETES", "GIT", "LINUX", "MATLAB", "VLSI", "MICROCONTROLLERS", "ARDUINO", "RASPBERRY PI",
                "PCB", "MACHINE LEARNING", "DEEP LEARNING", "DATA SCIENCE", "FIGMA", "POWER BI", "TABLEAU", "REST APIS"
            };

            var extractedSkills = potentialSkills
                .Where(s => textUpper.Contains(s))
                .Select(s => s switch {
                    "C#" => "C#",
                    "C++" => "C++",
                    "EMBEDDED C" => "Embedded C",
                    "PYTHON" => "Python",
                    "JAVA" => "Java",
                    "JAVASCRIPT" => "JavaScript",
                    "TYPESCRIPT" => "TypeScript",
                    "PHP" => "PHP",
                    "RUBY" => "Ruby",
                    "GO" => "Go",
                    "RUST" => "Rust",
                    "FLUTTER" => "Flutter",
                    "SWIFT" => "Swift",
                    "KOTLIN" => "Kotlin",
                    "REACT" => "React.js",
                    "NODE.JS" or "NODEJS" => "Node.js",
                    "SPRING BOOT" => "Spring Boot",
                    "EXPRESS" => "Express.js",
                    "HTML" => "HTML5",
                    "CSS" => "CSS3",
                    "TAILWIND" => "Tailwind CSS",
                    "BOOTSTRAP" => "Bootstrap",
                    "SQL" or "MYSQL" or "POSTGRESQL" => "SQL & Databases",
                    "MONGODB" => "MongoDB",
                    "ORACLE" => "Oracle DB",
                    "FIREBASE" => "Firebase",
                    "AWS" => "AWS Cloud",
                    "AZURE" => "Microsoft Azure",
                    "DOCKER" => "Docker",
                    "KUBERNETES" => "Kubernetes",
                    "GIT" => "Git & Version Control",
                    "LINUX" => "Linux",
                    "MATLAB" => "MATLAB",
                    "VLSI" => "VLSI Design",
                    "MICROCONTROLLERS" => "Microcontrollers",
                    "ARDUINO" => "Arduino",
                    "RASPBERRY PI" => "Raspberry Pi",
                    "PCB" => "PCB Design",
                    "MACHINE LEARNING" => "Machine Learning",
                    "DEEP LEARNING" => "Deep Learning",
                    "DATA SCIENCE" => "Data Science & Analytics",
                    "FIGMA" => "Figma UI/UX",
                    "POWER BI" => "Power BI",
                    "TABLEAU" => "Tableau",
                    "REST APIS" => "REST APIs",
                    _ => s
                })
                .Distinct()
                .ToList();

            if (extractedSkills.Count == 0)
            {
                var textWords = text.Split(new[] { ' ', '\r', '\n', '\t', ',', ';', ':', '(', ')', '/', '\\' }, StringSplitOptions.RemoveEmptyEntries)
                    .Where(w => w.Length >= 3 && char.IsUpper(w[0]))
                    .Where(w => !new[] { "THE", "AND", "FOR", "WITH", "FROM", "THIS", "THAT", "YOUR", "PROJECT", "SKILLS", "RESUME", "EXPERIENCE", "EDUCATION", "UNIVERSITY", "COLLEGE" }.Contains(w.ToUpper()))
                    .Distinct()
                    .Take(4)
                    .ToList();

                if (textWords.Count > 0)
                {
                    extractedSkills = textWords;
                }
                else
                {
                    extractedSkills = new List<string> { "Core Engineering & Technical Problem Solving" };
                }
            }

            var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            var extractedProjects = new List<string>();

            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (trimmed.Length > 5 && trimmed.Length < 80 && 
                    (trimmed.Contains("Project", StringComparison.OrdinalIgnoreCase) || 
                     trimmed.Contains("System", StringComparison.OrdinalIgnoreCase) || 
                     trimmed.Contains("App", StringComparison.OrdinalIgnoreCase) || 
                     trimmed.Contains("Portal", StringComparison.OrdinalIgnoreCase) ||
                     trimmed.Contains("Engine", StringComparison.OrdinalIgnoreCase) ||
                     trimmed.Contains("Platform", StringComparison.OrdinalIgnoreCase) ||
                     trimmed.Contains("Dashboard", StringComparison.OrdinalIgnoreCase)))
                {
                    if (!trimmed.StartsWith("PROJECTS", StringComparison.OrdinalIgnoreCase) && !extractedProjects.Contains(trimmed))
                    {
                        extractedProjects.Add(trimmed);
                    }
                }
            }

            if (extractedProjects.Count == 0)
            {
                extractedProjects = new List<string> { "Primary Technical Engineering Project" };
            }

            var coreSubjects = new List<string>();
            if (textUpper.Contains("DBMS") || textUpper.Contains("DATABASE") || textUpper.Contains("SQL")) coreSubjects.Add("DBMS & SQL");
            if (textUpper.Contains("STRUCTURE") || textUpper.Contains("ALGORITHM") || textUpper.Contains("DSA")) coreSubjects.Add("Data Structures & Algorithms");
            if (textUpper.Contains("OPERATING") || textUpper.Contains("OS")) coreSubjects.Add("Operating Systems");
            if (textUpper.Contains("NETWORK") || textUpper.Contains("CN")) coreSubjects.Add("Computer Networks");
            if (textUpper.Contains("OOPS") || textUpper.Contains("OBJECT ORIENTED")) coreSubjects.Add("Object-Oriented Programming (OOPs)");
            if (textUpper.Contains("EMBEDDED") || textUpper.Contains("MICROCONTROLLER")) coreSubjects.Add("Embedded Systems & Microcontrollers");

            if (coreSubjects.Count == 0)
            {
                coreSubjects = new List<string> { "Core Engineering Fundamentals" };
            }

            return new
            {
                skills = extractedSkills,
                projects = extractedProjects,
                coreSubjects = coreSubjects
            };
        }
    }
}
