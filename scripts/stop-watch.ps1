$ErrorActionPreference = 'Stop'
$repoFolder = Split-Path -Parent $PSScriptRoot
$lockFile = Join-Path $repoFolder '.local\watch.pid'
if (Test-Path -LiteralPath $lockFile) {
    $watchProcessId = [int](Get-Content -LiteralPath $lockFile)
    $watchProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $watchProcessId"
    if ($watchProcess -and $watchProcess.CommandLine.Contains((Join-Path $PSScriptRoot 'watch.mjs'))) {
        Stop-Process -Id $watchProcessId
        Write-Host 'Auto publish stopped.'
    }
    Remove-Item -LiteralPath $lockFile
} else { Write-Host 'Auto publish is not running.' }
