param(
    [string]$Description = "data deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $repoRoot 'IoT-Data'
$log = Join-Path $repoRoot ("data-deploy-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))

function Write-Log {
    param([string]$Text = '')
    Write-Host $Text
    try { Add-Content -Path $log -Value $Text -Encoding UTF8 -ErrorAction Stop } catch {}
}

function Get-ClaspRunner {
    param([string]$DeploymentId)

    $claspCommand = Get-Command clasp.cmd, clasp -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($claspCommand) {
        return @{ Command = $claspCommand.Source; Args = @('deploy', '-i', $DeploymentId, '-d', $Description) }
    }

    $candidate = Join-Path $env:APPDATA 'npm\clasp.cmd'
    if (Test-Path $candidate) {
        return @{ Command = $candidate; Args = @('deploy', '-i', $DeploymentId, '-d', $Description) }
    }

    $npxCommand = Get-Command npx.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $npxCommand) {
        throw 'clasp and npx were not found. Install @google/clasp or make npx available.'
    }

    $env:npm_config_cache = Join-Path $repoRoot '.npm-cache'
    return @{ Command = $npxCommand.Source; Args = @('--yes', '@google/clasp', 'deploy', '-i', $DeploymentId, '-d', $Description) }
}

$claspJson = Get-Content -Path (Join-Path $projectRoot '.clasp.json') -Raw | ConvertFrom-Json
$deploymentId = [string]$claspJson.deploymentId
if (-not $deploymentId) {
    throw 'IoT-Data/.clasp.json does not contain deploymentId.'
}

Write-Log '=================================================='
Write-Log 'Data - clasp deploy'
Write-Log "Project: $projectRoot"
Write-Log "Deployment ID: $deploymentId"
Write-Log "Description: $Description"
Write-Log "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log '=================================================='

$runner = Get-ClaspRunner -DeploymentId $deploymentId
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
Write-Log '[OK] Data deploy completed.'
