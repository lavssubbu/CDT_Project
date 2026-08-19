using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Student> Students => Set<Student>();
        public DbSet<Department> Departments => Set<Department>();
        public DbSet<Assessment> Assessments => Set<Assessment>();
        public DbSet<Performance> Performances => Set<Performance>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<User> Users => Set<User>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Dynamic seeding is handled via DbSeeder in Program.cs
        }
    }
}
