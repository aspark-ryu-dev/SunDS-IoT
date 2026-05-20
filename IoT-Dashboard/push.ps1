$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$log = Join-Path $root 'push.log'

function Write-Both {
    param([string]$Text = '')
    Write-Host $Text
    Add-Content -Path $log -Value $Text -Encoding UTF8
}

Write-Both '=================================================='
Write-Both 'IoT-Dashboard - clasp push'
Write-Both "Working dir: $root"
Write-Both "Log file: $log"
Write-Both "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Both '=================================================='
Write-Both ''

$cmd = $null
$argsList = @()

$claspCommand = Get-Command clasp.cmd, clasp -ErrorAction SilentlyContinue | Select-Object -First 1
if ($claspCommand) {
    $cmd = $claspCommand.Source
    $argsList = @('push', '-f')
    Write-Both "Using installed clasp: $cmd"
} else {
    $candidate = Join-Path $env:APPDATA 'npm\clasp.cmd'
    if (Test-Path $candidate) {
        $cmd = $candidate
        $argsList = @('push', '-f')
        Write-Both "Using installed clasp: $cmd"
    }
}

if (-not $cmd) {
    $npxCommand = Get-Command npx.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $npxCommand) {
        Write-Both '[ERROR] clasp and npx were not found in PATH.'
        Write-Both 'Try: npm install -g @google/clasp'
        Write-Both 'Then: clasp login'
        exit 1
    }
    $env:npm_config_cache = Join-Path $root '.npm-cache'
    $cmd = $npxCommand.Source
    $argsList = @('--yes', '@google/clasp', 'push', '-f')
    Write-Both 'clasp was not found. Falling back to npx.'
    Write-Both "npx: $cmd"
    Write-Both "npm cache: $env:npm_config_cache"
}

Write-Both ''
function Quote-CmdArg {
    param([string]$Arg)
    if ($Arg -match '[\s"]') {
        return '"' + ($Arg -replace '"', '\"') + '"'
    }
    return $Arg
}

$commandLine = (Quote-CmdArg $cmd) + ' ' + (($argsList | ForEach-Object { Quote-CmdArg $_ }) -join ' ')
Write-Both ("Running: " + $commandLine)
Write-Both ''

& cmd.exe /d /s /c "`"$commandLine`"" 2>&1 | Tee-Object -FilePath $log -Append
$result = if ($LASTEXITCODE -ne $null) { $LASTEXITCODE } elseif ($?) { 0 } else { 1 }

Write-Both ''
Write-Both "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Both "Exit code: $result"

if ($result -ne 0) {
    Write-Both ''
    Write-Both '[ERROR] clasp push failed.'
    Write-Both 'Common checks:'
    Write-Both '  - Apps Script API: https://script.google.com/home/usersettings'
    Write-Both '  - Login: clasp login'
    Write-Both '  - Project binding: .clasp.json scriptId'
    exit $result
}

Write-Both ''
Write-Both '[OK] clasp push completed.'
exit 0
