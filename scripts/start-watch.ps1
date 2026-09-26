$ErrorActionPreference = 'Stop'
$repoFolder = Split-Path -Parent $PSScriptRoot
$localFolder = Join-Path $repoFolder '.local'
New-Item -ItemType Directory -Force -Path $localFolder | Out-Null
$lockFile = Join-Path $localFolder 'watch.pid'
if (Test-Path -LiteralPath $lockFile) {
    $watchProcessId = [int](Get-Content -LiteralPath $lockFile)
    $existingProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $watchProcessId"
    if ($existingProcess -and $existingProcess.CommandLine.Contains((Join-Path $PSScriptRoot 'watch.mjs'))) {
        Write-Host 'Auto publish is already running.'
        exit 0
    }
}
$nodePath = (Get-Command node -ErrorAction Stop).Source
Start-Process -FilePath $nodePath -ArgumentList ('"' + (Join-Path $PSScriptRoot 'watch.mjs') + '"') -WorkingDirectory $repoFolder -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localFolder 'watch.log') -RedirectStandardError (Join-Path $localFolder 'watch-error.log') | Out-Null
Start-Sleep -Seconds 2
if (!(Test-Path -LiteralPath $lockFile)) { throw 'Publisher did not start. Check .local/watch-error.log.' }
$watchProcessId = [int](Get-Content -LiteralPath $lockFile)
if (!(Get-Process -Id $watchProcessId -ErrorAction SilentlyContinue)) { throw 'Publisher stopped. Check .local/watch-error.log.' }
Write-Host 'Auto publish started. Drop HTML files into this folder. Logs: .local/watch.log'
