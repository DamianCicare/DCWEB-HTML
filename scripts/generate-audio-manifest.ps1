$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$audioDir = Join-Path $projectRoot "audio"
$manifestPath = Join-Path $audioDir "manifest.js"
$supportedExtensions = @(".mp3", ".m4a", ".wav", ".ogg", ".aac", ".flac")

if (-not (Test-Path -LiteralPath $audioDir)) {
  New-Item -ItemType Directory -Path $audioDir | Out-Null
}

$tracks = Get-ChildItem -LiteralPath $audioDir -File |
  Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
  Sort-Object Name |
  ForEach-Object {
    $displayTitle = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $encodedName = [System.Uri]::EscapeDataString($_.Name)

    [pscustomobject]@{
      title = $displayTitle
      artist = "Damian Cicare"
      src = "audio/$encodedName"
    }
  }

$json = $tracks | ConvertTo-Json -Depth 4

if (-not $json) {
  $json = "[]"
}

$content = @(
  "window.AUDIO_TRACKS = $json;"
  ""
) -join [Environment]::NewLine

Set-Content -LiteralPath $manifestPath -Value $content -Encoding UTF8
Write-Output "Manifest updated: $manifestPath"
