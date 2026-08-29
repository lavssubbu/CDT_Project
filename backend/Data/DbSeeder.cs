using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using backend.Models;

namespace backend.Data
{
    public static class DbSeeder
    {
        public static void SeedData(AppDbContext context)
        {
            try
            {
                // Ensure CompanyPlaced column exists in Students table (SQL Server / SQLite)
                if (context.Database.IsSqlServer())
                {
                    context.Database.ExecuteSqlRaw(@"
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'CompanyPlaced')
                        BEGIN
                            ALTER TABLE [dbo].[Students] ADD [CompanyPlaced] NVARCHAR(MAX) NOT NULL DEFAULT '';
                        END");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Notice: Schema check: {ex.Message}");
            }

            var seedFilePath = Path.Combine(Directory.GetCurrentDirectory(), "seed_data.json");
            if (File.Exists(seedFilePath))
            {
                try
                {
                    var json = File.ReadAllText(seedFilePath);
                    var data = JsonSerializer.Deserialize<SeedDataWrapper>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (data != null)
                    {
                        Console.WriteLine("Checking database sync with seed_data.json...");

                        if (data.Departments != null && data.Departments.Any())
                        {
                            var existingDeptCodes = context.Departments.Select(d => d.Code).ToHashSet();
                            var newDepts = data.Departments.Where(d => !existingDeptCodes.Contains(d.Code)).ToList();
                            if (newDepts.Any())
                            {
                                context.Departments.AddRange(newDepts);
                                context.SaveChanges();
                                Console.WriteLine($"Seeded {newDepts.Count} new departments.");
                            }
                        }

                        if (data.Students != null && data.Students.Any())
                        {
                            var existingStudents = context.Students.ToDictionary(s => s.RegisterNo);
                            var newStudents = new List<Student>();
                            bool updatedExisting = false;

                            foreach (var s in data.Students)
                            {
                                if (existingStudents.TryGetValue(s.RegisterNo, out var exist))
                                {
                                    if (exist.Status != s.Status || exist.CompanyPlaced != s.CompanyPlaced)
                                    {
                                        exist.Status = s.Status;
                                        exist.CompanyPlaced = s.CompanyPlaced;
                                        updatedExisting = true;
                                    }
                                }
                                else
                                {
                                    newStudents.Add(s);
                                }
                            }

                            if (newStudents.Any())
                            {
                                context.Students.AddRange(newStudents);
                            }
                            if (newStudents.Any() || updatedExisting)
                            {
                                context.SaveChanges();
                                Console.WriteLine($"Synced students: {newStudents.Count} new, updated placement statuses for {existingStudents.Count} records.");
                            }
                        }

                        if (data.Assessments != null && data.Assessments.Any())
                        {
                            var existingAssIds = context.Assessments.Select(a => a.Id).ToHashSet();
                            var newAss = data.Assessments.Where(a => !existingAssIds.Contains(a.Id)).ToList();
                            if (newAss.Any())
                            {
                                context.Assessments.AddRange(newAss);
                                context.SaveChanges();
                                Console.WriteLine($"Seeded {newAss.Count} new assessments.");
                            }
                        }

                        if (data.Performances != null && data.Performances.Any())
                        {
                            // If performance count in DB is significantly less, sync new performances
                            int currentPerfCount = context.Performances.Count();
                            if (currentPerfCount < data.Performances.Count)
                            {
                                int chunkSize = 1000;
                                for (int i = currentPerfCount; i < data.Performances.Count; i += chunkSize)
                                {
                                    var chunk = data.Performances.Skip(i).Take(chunkSize);
                                    context.Performances.AddRange(chunk);
                                    context.SaveChanges();
                                }
                                Console.WriteLine($"Seeded additional performances (Total now: {context.Performances.Count()}).");
                            }
                        }

                        if (data.Notifications != null && data.Notifications.Any() && !context.Notifications.Any())
                        {
                            context.Notifications.AddRange(data.Notifications);
                            context.SaveChanges();
                            Console.WriteLine($"Seeded {data.Notifications.Count} notifications.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"ERROR: Database seeding failed: {ex.Message}");
                }
            }

            // Seed default User accounts for authentication if Users table is empty
            if (!context.Users.Any())
            {
                var defaultUsers = new List<User>
                {
                    new User
                    {
                        FullName = "System Administrator",
                        Email = "admin@kiot.ac.in",
                        Username = "admin",
                        Password = "admin123",
                        Role = "Admin",
                        Department = "ALL",
                        CreatedAt = DateTime.UtcNow
                    },
                    new User
                    {
                        FullName = "Dr. Arunkumar (HOD CSE)",
                        Email = "faculty@kiot.ac.in",
                        Username = "faculty",
                        Password = "faculty123",
                        Role = "Faculty",
                        Department = "CSE",
                        CreatedAt = DateTime.UtcNow
                    },
                    new User
                    {
                        FullName = "Placement Officer",
                        Email = "placement@kiot.ac.in",
                        Username = "placement",
                        Password = "placement123",
                        Role = "Placement",
                        Department = "ALL",
                        CreatedAt = DateTime.UtcNow
                    },
                    new User
                    {
                        FullName = "Abirami R",
                        Email = "student@kiot.ac.in",
                        Username = "611223103001",
                        Password = "student123",
                        Role = "Student",
                        Department = "CSE",
                        RegisterNo = "611223103001",
                        CreatedAt = DateTime.UtcNow
                    }
                };

                context.Users.AddRange(defaultUsers);
                context.SaveChanges();
                Console.WriteLine("Seeded 4 default User accounts (Admin, Faculty, Placement, Student).");
            }
        }
    }

    public class SeedDataWrapper
    {
        public List<Department>? Departments { get; set; }
        public List<Student>? Students { get; set; }
        public List<Assessment>? Assessments { get; set; }
        public List<Performance>? Performances { get; set; }
        public List<Notification>? Notifications { get; set; }
    }
}
