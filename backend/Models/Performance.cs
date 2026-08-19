using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Performance
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string RegisterNo { get; set; } = string.Empty;
        public string AssessmentId { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public string Skill { get; set; } = string.Empty;
        public int Score { get; set; }
        public string WeakTopics { get; set; } = string.Empty; // Comma-separated
        public string CorrectTopics { get; set; } = string.Empty; // Comma-separated
    }
}
