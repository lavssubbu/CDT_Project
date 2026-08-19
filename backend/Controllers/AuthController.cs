using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("signin")]
        public async Task<ActionResult<AuthResponseDto>> SignIn([FromBody] AuthRequestDto req)
        {
            if (string.IsNullOrWhiteSpace(req.Identifier) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Identifier and password are required."
                });
            }

            var identifier = req.Identifier.Trim().ToLower();

            // Find user matching identifier (email, username, or registerNo)
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == identifier ||
                u.Username.ToLower() == identifier ||
                u.RegisterNo.ToLower() == identifier);

            if (user != null)
            {
                if (user.Password != req.Password)
                {
                    return Unauthorized(new AuthResponseDto
                    {
                        Success = false,
                        Message = "Invalid password."
                    });
                }

                if (!string.Equals(user.Role, req.Role, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new AuthResponseDto
                    {
                        Success = false,
                        Message = $"Account exists but role is '{user.Role}', not '{req.Role}'."
                    });
                }

                return Ok(new AuthResponseDto
                {
                    Success = true,
                    Message = "Sign in successful.",
                    Token = $"jwt-simulated-token-{user.Id}-{DateTime.UtcNow.Ticks}",
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        Username = user.Username,
                        FullName = user.FullName,
                        Role = user.Role,
                        Department = user.Department,
                        RegisterNo = user.RegisterNo
                    }
                });
            }

            // Fallback: If role is Student and identifier matches existing Student RegisterNo
            if (string.Equals(req.Role, "Student", StringComparison.OrdinalIgnoreCase))
            {
                var student = await _context.Students.FirstOrDefaultAsync(s => s.RegisterNo.ToLower() == identifier);
                if (student != null)
                {
                    // Auto-register user account for this existing student
                    var newUser = new User
                    {
                        FullName = student.Name,
                        Email = string.IsNullOrEmpty(student.Email) ? $"{student.RegisterNo}@kiot.ac.in" : student.Email,
                        Username = student.RegisterNo,
                        Password = req.Password,
                        Role = "Student",
                        Department = student.DepartmentCode,
                        RegisterNo = student.RegisterNo,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();

                    return Ok(new AuthResponseDto
                    {
                        Success = true,
                        Message = "Sign in successful.",
                        Token = $"jwt-simulated-token-{newUser.Id}-{DateTime.UtcNow.Ticks}",
                        User = new UserDto
                        {
                            Id = newUser.Id,
                            Email = newUser.Email,
                            Username = newUser.Username,
                            FullName = newUser.FullName,
                            Role = newUser.Role,
                            Department = newUser.Department,
                            RegisterNo = newUser.RegisterNo
                        }
                    });
                }
            }

            return NotFound(new AuthResponseDto
            {
                Success = false,
                Message = "Account not found. Please check your credentials or Sign Up."
            });
        }

        [HttpPost("signup")]
        public async Task<ActionResult<AuthResponseDto>> SignUp([FromBody] SignUpRequestDto req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.FullName))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Full Name, Email, and Password are required."
                });
            }

            var email = req.Email.Trim().ToLower();
            var username = string.IsNullOrWhiteSpace(req.Username) ? email.Split('@')[0] : req.Username.Trim();
            var regNo = string.IsNullOrWhiteSpace(req.RegisterNo) ? username : req.RegisterNo.Trim();

            // Check if user exists
            var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == email || u.Username.ToLower() == username.ToLower());
            if (existingUser)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "An account with this Email or Username already exists. Please Sign In."
                });
            }

            var newUser = new User
            {
                FullName = req.FullName.Trim(),
                Email = email,
                Username = username,
                Password = req.Password,
                Role = string.IsNullOrWhiteSpace(req.Role) ? "Student" : req.Role,
                Department = string.IsNullOrWhiteSpace(req.Department) ? "CSE" : req.Department,
                RegisterNo = regNo,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);

            // If registering as a Student, create Student entry if not existing
            if (string.Equals(newUser.Role, "Student", StringComparison.OrdinalIgnoreCase))
            {
                var existingStudent = await _context.Students.FindAsync(regNo);
                if (existingStudent == null)
                {
                    var newStudent = new Student
                    {
                        RegisterNo = regNo,
                        Name = newUser.FullName,
                        DepartmentCode = newUser.Department,
                        Section = string.IsNullOrWhiteSpace(req.Section) ? "A" : req.Section,
                        Batch = "2023-2027",
                        CGPA = 7.5,
                        StandingArrears = 0,
                        PlacementEligibility = "Eligible",
                        Email = email,
                        Mobile = "9876543210",
                        Avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                        Attendance = 90,
                        Status = "Unplaced"
                    };
                    _context.Students.Add(newStudent);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Account registered successfully!",
                Token = $"jwt-simulated-token-{newUser.Id}-{DateTime.UtcNow.Ticks}",
                User = new UserDto
                {
                    Id = newUser.Id,
                    Email = newUser.Email,
                    Username = newUser.Username,
                    FullName = newUser.FullName,
                    Role = newUser.Role,
                    Department = newUser.Department,
                    RegisterNo = newUser.RegisterNo
                }
            });
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    FullName = u.FullName,
                    Role = u.Role,
                    Department = u.Department,
                    RegisterNo = u.RegisterNo
                })
                .ToListAsync();

            return Ok(users);
        }
    }
}
