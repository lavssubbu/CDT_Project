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
            // Seed only if database is completely fresh
            if (!context.Departments.Any())
            {
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
                            Console.WriteLine("Seeding Database with real AY 2026-2027 student profiles...");

                            if (data.Departments != null && data.Departments.Any())
                            {
                                context.Departments.AddRange(data.Departments);
                                context.SaveChanges();
                                Console.WriteLine($"Seeded {data.Departments.Count} departments.");
                            }

                            if (data.Students != null && data.Students.Any())
                            {
                                context.Students.AddRange(data.Students);
                                context.SaveChanges();
                                Console.WriteLine($"Seeded {data.Students.Count} students.");
                            }

                            if (data.Assessments != null && data.Assessments.Any())
                            {
                                context.Assessments.AddRange(data.Assessments);
                                context.SaveChanges();
                                Console.WriteLine($"Seeded {data.Assessments.Count} assessments.");
                            }

                            if (data.Performances != null && data.Performances.Any())
                            {
                                // Seed in chunks if list is very large to avoid memory issues on SQL server
                                int chunkSize = 1000;
                                for (int i = 0; i < data.Performances.Count; i += chunkSize)
                                {
                                    var chunk = data.Performances.Skip(i).Take(chunkSize);
                                    context.Performances.AddRange(chunk);
                                    context.SaveChanges();
                                }
                                Console.WriteLine($"Seeded {data.Performances.Count} performance score rows.");
                            }

                            if (data.Notifications != null && data.Notifications.Any())
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
