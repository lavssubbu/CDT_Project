using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models
{
    public class Department
    {
        [Key]
        public string Code { get; set; } = string.Empty; // e.g. "CSE", "ECE", "EEE", "IT"
        public string Name { get; set; } = string.Empty; // e.g. "Computer Science & Engineering"

        [JsonIgnore]
        public ICollection<Student> Students { get; set; } = new List<Student>();
    }
}
