$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$audioDir = Join-Path $projectRoot "audio"
$manifestPath = Join-Path $audioDir "manifest.js"
$generateScript = Join-Path $PSScriptRoot "generate-audio-manifest.ps1"
if (-not (Test-Path -LiteralPath $audioDir)) {
  New-Item -ItemType Directory -Path $audioDir | Out-Null
}

& $generateScript | Out-Null

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $audioDir
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $false
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, CreationTime, Size'
$watcher.EnableRaisingEvents = $true

$action = {
  Start-Sleep -Milliseconds 250
  & $using:generateScript | Out-Null
}

$createdRegistration = Register-ObjectEvent -InputObject $watcher -EventName Created -Action $action
$changedRegistration = Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $action
$deletedRegistration = Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $action
$renamedRegistration = Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $action

Write-Host "Watching audio folder: $audioDir"

try {
  while ($true) {
    Start-Sleep -Seconds 1
  }
}
finally {
  Unregister-Event -SourceIdentifier $createdRegistration.Name -ErrorAction SilentlyContinue
  Unregister-Event -SourceIdentifier $changedRegistration.Name -ErrorAction SilentlyContinue
  Unregister-Event -SourceIdentifier $deletedRegistration.Name -ErrorAction SilentlyContinue
  Unregister-Event -SourceIdentifier $renamedRegistration.Name -ErrorAction SilentlyContinue
  $watcher.Dispose()
}
