# PowerShell script to kill process using a specific port
param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Checking for processes using port $Port..." -ForegroundColor Yellow

$processes = netstat -ano | findstr ":$Port"

if ($processes) {
    $pids = $processes | ForEach-Object {
        $parts = $_ -split '\s+'
        $parts[-1]
    } | Select-Object -Unique
    
    foreach ($pid in $pids) {
        if ($pid -match '^\d+$') {
            Write-Host "Killing process with PID: $pid" -ForegroundColor Red
            taskkill /F /PID $pid
        }
    }
    Write-Host "Port $Port is now free!" -ForegroundColor Green
} else {
    Write-Host "No process found using port $Port" -ForegroundColor Green
}

