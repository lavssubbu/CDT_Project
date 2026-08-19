using Microsoft.EntityFrameworkCore;
using backend.Data;

var builder = WebApplication.CreateBuilder(args);

// Configure Database (SQL Server with SQLite fallback for Linux/Cloud container deployment)
var connString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrEmpty(connString) && (connString.Contains("Server=") || connString.Contains("Data Source=")))
    {
        try
        {
            options.UseSqlServer(connString);
        }
        catch
        {
            options.UseSqlite("Data Source=cdt_database.db");
        }
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
