using System;
using System.IO;
using System.IO.Compression;
using System.Text.RegularExpressions;

class Program
{
    static void Main()
    {
        var questionsDir = Path.Combine(Directory.GetCurrentDirectory(), "Questions");
        if (!Directory.Exists(questionsDir)) return;

        var files = Directory.GetFiles(questionsDir, "*.docx");
        foreach (var file in files)
        {
            try
            {
                using var zip = ZipFile.OpenRead(file);
                var entry = zip.GetEntry("word/document.xml");
                if (entry != null)
                {
                    using var stream = entry.Open();
                    using var reader = new StreamReader(stream);
                    var xml = reader.ReadToEnd();
                    var text = Regex.Replace(xml, "<[^>]+>", " ");
                    text = Regex.Replace(text, @"\s+", " ").Trim();
                    Console.WriteLine("=== FILE: " + Path.GetFileName(file) + " (" + text.Length + " chars) ===");
                    Console.WriteLine(text.Substring(0, Math.Min(600, text.Length)));
                    Console.WriteLine();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error reading " + file + ": " + ex.Message);
            }
        }
    }
}
