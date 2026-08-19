using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssessmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssessmentsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/assessments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Assessment>>> GetAssessments()
        {
            return await _context.Assessments.ToListAsync();
        }

        // GET: api/assessments/performances
        [HttpGet("performances")]
        public async Task<ActionResult<IEnumerable<Performance>>> GetPerformances()
        {
            return await _context.Performances.ToListAsync();
        }

        // POST: api/assessments
        [HttpPost]
        public async Task<ActionResult<Assessment>> PostAssessment(Assessment assessment)
        {
            _context.Assessments.Add(assessment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAssessments), new { id = assessment.Id }, assessment);
        }

        // POST: api/assessments/sync-csv
        [HttpPost("sync-csv")]
        public async Task<IActionResult> SyncCsv([FromBody] CsvImportRequest request)
        {
            if (string.IsNullOrEmpty(request.CsvText))
            {
                return BadRequest("CSV content is empty.");
            }

            var lines = request.CsvText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            int count = 0;

            foreach (var line in lines)
            {
                var parts = SplitCsvLine(line);
                if (parts.Count < 7) continue;

                string reg = parts[0].Trim();
                string assName = parts[1].Trim();
                string platform = parts[2].Trim();
                string category = parts[3].Trim();
                string date = parts[4].Trim();
                int maxMarks = int.TryParse(parts[5], out var mm) ? mm : 100;
                int score = int.TryParse(parts[6], out var sc) ? sc : 0;
                string weakTopics = parts.Count > 7 ? parts[7].Trim() : "";
                string correctTopics = parts.Count > 8 ? parts[8].Trim() : "";

                // Verify student exists
                var student = await _context.Students.FindAsync(reg);
                if (student == null) continue;

                // Find or create assessment
                var ass = await _context.Assessments.FirstOrDefaultAsync(a => 
                    a.Name.ToLower() == assName.ToLower() && 
                    a.Platform.ToLower() == platform.ToLower());

                if (ass == null)
                {
                    string newId = "A" + (await _context.Assessments.CountAsync() + 1).ToString().PadLeft(3, '0');
                    ass = new Assessment
                    {
                        Id = newId,
                        Name = assName,
                        Platform = platform,
                        Category = category,
                        Date = string.IsNullOrEmpty(date) ? DateTime.Now.ToString("yyyy-MM-dd") : date,
                        MaxMarks = maxMarks,
                        Weightage = 1.0
                    };
                    _context.Assessments.Add(ass);
                    await _context.SaveChangesAsync(); // save immediately to lock ID
                }

                // Upsert performance
                var perf = await _context.Performances.FirstOrDefaultAsync(p => 
                    p.RegisterNo == reg && p.AssessmentId == ass.Id);

                if (perf != null)
                {
                    perf.Score = score;
                    perf.WeakTopics = weakTopics;
                    perf.CorrectTopics = correctTopics;
                }
                else
                {
                    perf = new Performance
                    {
                        RegisterNo = reg,
                        AssessmentId = ass.Id,
                        Platform = platform,
                        Skill = category,
                        Score = score,
                        WeakTopics = weakTopics,
                        CorrectTopics = correctTopics
                    };
                    _context.Performances.Add(perf);
                }

                // Add Notifications
                _context.Notifications.Add(new Notification
                {
                    RegisterNo = reg,
                    Message = $"{category} Score updated for '{assName}' ({platform}): {score}%.",
                    Date = DateTime.Now.ToString("yyyy-MM-dd HH:mm")
                });

                if (category == "Programming")
                {
                    if (score < 60)
                    {
                        _context.Notifications.Add(new Notification
                        {
                            RegisterNo = reg,
                            Message = "Programming Score < 60. Assigned Foundation Course & Path Red.",
                            Date = DateTime.Now.ToString("yyyy-MM-dd HH:mm")
                        });
                    }
                    else if (score >= 80)
                    {
                        _context.Notifications.Add(new Notification
                        {
                            RegisterNo = reg,
                            Message = "High performance score. Assigned Competitive Coding Course & Path Green!",
                            Date = DateTime.Now.ToString("yyyy-MM-dd HH:mm")
                        });
                    }
                }

                count++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { importedCount = count });
        }

        // POST: api/assessments/sync-lms-portal
        [HttpPost("sync-lms-portal")]
        public async Task<IActionResult> SyncLmsPortal()
        {
            try
            {
                string scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "import_lms_excel.cjs");
                scriptPath = Path.GetFullPath(scriptPath);

                if (!System.IO.File.Exists(scriptPath))
                {
                    return NotFound(new { error = $"ETL Script not found at: {scriptPath}" });
                }

                var startInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = $"\"{scriptPath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = System.Diagnostics.Process.Start(startInfo);
                if (process == null)
                {
                    return StatusCode(500, new { error = "Failed to start Node process." });
                }

                string stdout = await process.StandardOutput.ReadToEndAsync();
                string stderr = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    return StatusCode(500, new { error = $"Script exited with code {process.ExitCode}", details = stderr });
                }

                string marker = "JSON_RESULT:";
                int index = stdout.IndexOf(marker);
                if (index != -1)
                {
                    string jsonString = stdout.Substring(index + marker.Length).Trim();
                    int newlineIndex = jsonString.IndexOf('\n');
                    if (newlineIndex != -1)
                    {
                        jsonString = jsonString.Substring(0, newlineIndex).Trim();
                    }
                    
                    return Ok(System.Text.Json.JsonDocument.Parse(jsonString));
                }

                return Ok(new { success = true, rawOutput = stdout });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private List<string> SplitCsvLine(string line)
        {
            var list = new List<string>();
            bool inQuotes = false;
            var currentPart = new System.Text.StringBuilder();

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    list.Add(currentPart.ToString().Replace("\"", "").Trim());
                    currentPart.Clear();
                }
                else
                {
                    currentPart.Append(c);
                }
            }
            list.Add(currentPart.ToString().Replace("\"", "").Trim());
            return list;
        }
    }

    public class CsvImportRequest
    {
        public string CsvText { get; set; } = string.Empty;
    }
}
