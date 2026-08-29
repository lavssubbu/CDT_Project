using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Student
    {
        [Key]
        public string RegisterNo { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;

        // Relational properties
        public string DepartmentCode { get; set; } = string.Empty;
        
        [ForeignKey("DepartmentCode")]
        public Department? DepartmentRelation { get; set; }

        public string Section { get; set; } = string.Empty;
        public string Batch { get; set; } = string.Empty;
        public double CGPA { get; set; }
        public int StandingArrears { get; set; }
        public string PlacementEligibility { get; set; } = "Eligible";
        public string Email { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public int Attendance { get; set; }
        public string Status { get; set; } = "Unplaced";
        public string CompanyPlaced { get; set; } = string.Empty;
        public string ResumeText { get; set; } = string.Empty;

        // Read-only mapped property to output department code as "department" in JSON
        [NotMapped]
        public string Department => DepartmentCode;

        [NotMapped]
        public string Company => CompanyPlaced;
    }
}
