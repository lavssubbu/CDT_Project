Add-Type -AssemblyName System.IO.Compression.FileSystem
$files = Get-ChildItem -Path "Questions" -Filter "*.docx"

foreach ($f in $files) {
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
        $entry = $zip.GetEntry("word/document.xml")
        if ($entry) {
            $stream = $entry.Open()
            $reader = New-Object System.IO.StreamReader($stream)
            $xml = $reader.ReadToEnd()
            $text = [System.Text.RegularExpressions.Regex]::Replace($xml, '<[^>]+>', ' ')
            $text = [System.Text.RegularExpressions.Regex]::Replace($text, '\s+', ' ').Trim()
            Write-Host "================== $($f.Name) =================="
            Write-Host $text.Substring(0, [Math]::Min(600, $text.Length))
            Write-Host ""
            $reader.Close()
            $stream.Close()
        }
        $zip.Dispose()
    } catch {
        Write-Host "Error reading $($f.Name)"
    }
}
