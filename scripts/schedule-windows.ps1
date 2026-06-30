# Registers a daily Windows Scheduled Task that refreshes JobBot's jobs.
# Run once (normal PowerShell, no admin needed):
#     powershell -ExecutionPolicy Bypass -File scripts\schedule-windows.ps1
#
# To remove it later:
#     Unregister-ScheduledTask -TaskName "JobBot Daily Refresh" -Confirm:$false

$ErrorActionPreference = "Stop"

# Project root = parent of this script's folder.
$proj = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node).Source
if (-not $node) { throw "Node.js not found on PATH. Install Node, then re-run." }

$taskName = "JobBot Daily Refresh"
$runAt    = "9:00am"   # change to whatever time you like

$action  = New-ScheduledTaskAction -Execute $node `
            -Argument "scripts\refresh-jobs.mjs" -WorkingDirectory $proj
$trigger = New-ScheduledTaskTrigger -Daily -At $runAt
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
            -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Settings $settings -Description "Fetches + scores fresh jobs for JobBot every day." -Force | Out-Null

Write-Host "Registered '$taskName' — runs daily at $runAt."
Write-Host "Project: $proj"
Write-Host ""
Write-Host "Test it now:  Start-ScheduledTask -TaskName '$taskName'"
Write-Host "Remove it:    Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
