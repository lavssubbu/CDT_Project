using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Assessment
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // e.g. Programming, Aptitude, Communication
        public string Date { get; set; } = string.Empty;
        public int MaxMarks { get; set; }
        public double Weightage { get; set; }
    }
}
