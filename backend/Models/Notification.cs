using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Notification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string RegisterNo { get; set; } = string.Empty; // "all" or specific register number
        public string Message { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
    }
}
