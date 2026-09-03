using Microsoft.EntityFrameworkCore;
using backend.Data;

// Disable inotify FileSystemWatcher in Linux/Docker to prevent System.IO.IOException (status 139)
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = Directory.GetCurrentDirectory()
});

builder.Configuration.Sources.Clear();
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: false);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: false);
builder.Configuration.AddEnvironmentVariables();

// Configure Database (SQLite for Linux/Docker cloud containers, SQL Server fallback for local Windows)
var connString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!OperatingSystem.IsWindows())
    {
        options.UseSqlite("Data Source=cdt_database.db");
    }
    else if (!string.IsNullOrEmpty(connString) && connString.Contains("Server=") && !connString.Contains("(localdb)"))
    {
        options.UseSqlServer(connString);
    }
    else
    {
        options.UseSqlite("Data Source=cdt_database.db");
    }
});

// Enable controllers support
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowReactApp");

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

// Auto initialize and seed database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        DbSeeder.SeedData(context); // Invoke the bulk JSON seeder
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while creating or seeding the database.");
    }
}

app.Run();
