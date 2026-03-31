Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-PptxText {
    param([string]$path)
    if (!(Test-Path $path)) { return "File not found: $path" }
    $tempFolder = Join-Path $env:TEMP ([guid]::NewGuid().ToString())
    [System.IO.Compression.ZipFile]::ExtractToDirectory($path, $tempFolder)
    $slideFiles = Get-ChildItem -Path (Join-Path $tempFolder "ppt\slides") -Filter "*.xml"
    $text = ""
    $slideNum = 1
    foreach($slide in $slideFiles) {
        $text += "Slide $slideNum:`n"
        $xml = [xml](Get-Content $slide.FullName)
        $strings = $xml.SelectNodes("//*[local-name()='t']")
        if ($strings) {
            foreach($s in $strings) { $text += $s.InnerText + " " }
        }
        $text += "`n---`n"
        $slideNum++
    }
    Remove-Item $tempFolder -Recurse -Force
    return $text
}

$report1 = Get-PptxText "D:\cuchenSW\250903_쿠첸ON_Data 정리_app취사집계.pptx"
$report2 = Get-PptxText "D:\cuchenSW\240823_쿠첸ON_Data 정리_8.pptx"

Set-Content -Path "out_pptx.txt" -Value "=== REPORT 1 ===`n$report1`n=== REPORT 2 ===`n$report2" -Encoding UTF8
