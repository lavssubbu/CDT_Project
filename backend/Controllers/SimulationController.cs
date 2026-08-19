using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimulationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SimulationController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/simulation/apply
        [HttpPost("apply")]
        public async Task<IActionResult> ApplySimulation([FromBody] SimulationRequest request)
        {
            var student = await _context.Students.FindAsync(request.RegisterNo);
            if (student == null)
            {
                return NotFound("Student not found.");
            }

            // Update student parameters
            student.CGPA = request.CGPA;
            student.Attendance = request.Attendance;
            student.StandingArrears = request.StandingArrears;
            student.PlacementEligibility = request.StandingArrears == 0 && request.CGPA >= 6.0 ? "Eligible" : "Not Eligible";

            // Find or create simulation assessment
            const string simAssId = "A_SIM";
            var ass = await _context.Assessments.FindAsync(simAssId);
            if (ass == null)
            {
                ass = new Assessment
                {
                    Id = simAssId,
                    Name = "Placement AI Evaluation",
                    Platform = "Internal LMS",
                    Category = "Programming",
                    Date = DateTime.Now.ToString("yyyy-MM-dd"),
                    MaxMarks = 100,
                    Weightage = 1.0
                };
                _context.Assessments.Add(ass);
                await _context.SaveChangesAsync();
            }

            // Upsert Simulated Performance rows for Programming, Aptitude, Communication
            await UpsertSimulatedScore(request.RegisterNo, "Programming", request.ProgrammingScore);
            await UpsertSimulatedScore(request.RegisterNo, "Aptitude", request.AptitudeScore);
            await UpsertSimulatedScore(request.RegisterNo, "Communication", request.CommunicationScore);

            // Add notification
            _context.Notifications.Add(new Notification
            {
                RegisterNo = request.RegisterNo,
                Message = "AI Parameter optimization applied! Profile updated.",
                Date = DateTime.Now.ToString("yyyy-MM-dd HH:mm")
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        private async Task UpsertSimulatedScore(string regNo, string skill, int score)
        {
            const string simAssId = "A_SIM";
            var perf = await _context.Performances.FirstOrDefaultAsync(p => 
                p.RegisterNo == regNo && p.AssessmentId == simAssId && p.Skill == skill);

            if (perf != null)
            {
                perf.Score = score;
            }
            else
            {
                perf = new Performance
                {
                    RegisterNo = regNo,
                    AssessmentId = simAssId,
                    Platform = "Internal LMS",
                    Skill = skill,
                    Score = score,
                    WeakTopics = score < 60 ? "General Fundamentals" : "",
                    CorrectTopics = score >= 80 ? "Core Concepts" : ""
                };
                _context.Performances.Add(perf);
            }
        }
    }

    public class SimulationRequest
    {
        public string RegisterNo { get; set; } = string.Empty;
        public double CGPA { get; set; }
        public int Attendance { get; set; }
        public int StandingArrears { get; set; }
        public int ProgrammingScore { get; set; }
        public int AptitudeScore { get; set; }
        public int CommunicationScore { get; set; }
    }
}
