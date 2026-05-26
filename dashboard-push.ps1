param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $repoRoot 'IoT-Dashboard'
$log = Join-Path $repoRoot ("dashboard-push-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))

function Write-Log {
    param([string]$Text = '')
    Write-Host $Text
    try { Add-Content -Path $log -Value $Text -Encoding UTF8 -ErrorAction Stop } catch {}
}

function Get-ClaspRunner {
    $claspCommand = Get-Command clasp.cmd, clasp -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($claspCommand) {
        return @{ Command = $claspCommand.Source; Args = @('push', '-f') }
    }

    $candidate = Join-Path $env:APPDATA 'npm\clasp.cmd'
    if (Test-Path $candidate) {
        return @{ Command = $candidate; Args = @('push', '-f') }
    }

    $npxCommand = Get-Command npx.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $npxCommand) {
        throw 'clasp and npx were not found. Install @google/clasp or make npx available.'
    }

    $env:npm_config_cache = Join-Path $repoRoot '.npm-cache'
    return @{ Command = $npxCommand.Source; Args = @('--yes', '@google/clasp', 'push', '-f') }
}

Write-Log '=================================================='
Write-Log 'Dashboard - clasp push'
Write-Log "Project: $projectRoot"
Write-Log "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log '=================================================='

# Sync /shared/*.gs into the project as _shared_<name>.gs (gitignored locally).
$sharedDir = Join-Path $repoRoot 'shared'
if (Test-Path $sharedDir) {
    Get-ChildItem -Path $sharedDir -Filter '*.gs' | ForEach-Object {
        $dst = Join-Path $projectRoot ('_shared_' + $_.Name)
        Copy-Item $_.FullName -Destination $dst -Force
        Write-Log ("synced shared: " + $_.Name + " -> _shared_" + $_.Name)
    }
}

$runner = Get-ClaspRunner
Push-Location $projectRoot
try {
    & $runner.Command @($runner.Args) 2>&1 | ForEach-Object { Write-Log ([string]$_) }
    $result = if ($LASTEXITCODE -ne $null) { $LASTEXITCODE } elseif ($?) { 0 } else { 1 }
} finally {
    Pop-Location
}

Write-Log "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log "Exit code: $result"
if ($result -ne 0) { exit $result }
Write-Log '[OK] Dashboard push completed.'
