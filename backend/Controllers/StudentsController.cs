using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StudentsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/students
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Student>>> GetStudents()
        {
            return await _context.Students
                .Include(s => s.DepartmentRelation)
                .ToListAsync();
        }

        // GET: api/students/5010
        [HttpGet("{regNo}")]
        public async Task<ActionResult<Student>> GetStudent(string regNo)
        {
            var student = await _context.Students
                .Include(s => s.DepartmentRelation)
                .FirstOrDefaultAsync(s => s.RegisterNo == regNo);
                
            if (student == null)
            {
                return NotFound();
            }
            return student;
        }

        // POST: api/students
        [HttpPost]
        public async Task<ActionResult<Student>> PostStudent(Student student)
        {
            var existing = await _context.Students.FindAsync(student.RegisterNo);
            if (existing != null)
            {
                // Update
                _context.Entry(existing).CurrentValues.SetValues(student);
            }
            else
            {
                // Create
                _context.Students.Add(student);
            }

            await _context.SaveChangesAsync();
            return Ok(student);
        }
    }
}
