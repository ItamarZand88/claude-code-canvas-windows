# Claude Canvas Windows - Helper Script
# Quick commands for testing and development

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Canvas,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

function Show-Help {
    Write-Host "Claude Canvas Windows - Helper Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\canvas.ps1 <command> [canvas] [args]"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  env          - Show environment detection"
    Write-Host "  test         - Run test suite"
    Write-Host "  show         - Show canvas in current terminal"
    Write-Host "  spawn        - Spawn canvas in split pane"
    Write-Host "  example      - Run example configuration"
    Write-Host "  install      - Install dependencies"
    Write-Host ""
    Write-Host "Canvas Types:" -ForegroundColor Yellow
    Write-Host "  calendar, document, flight"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\scripts\canvas.ps1 env"
    Write-Host "  .\scripts\canvas.ps1 test"
    Write-Host "  .\scripts\canvas.ps1 show calendar"
    Write-Host "  .\scripts\canvas.ps1 spawn calendar"
    Write-Host "  .\scripts\canvas.ps1 example calendar"
    Write-Host "  .\scripts\canvas.ps1 example document"
}

function Test-BunInstalled {
    try {
        $null = Get-Command bun -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Invoke-Env {
    Write-Host "Detecting terminal environment..." -ForegroundColor Cyan
    bun run canvas/src/cli.ts env
}

function Invoke-Test {
    Write-Host "Running test suite..." -ForegroundColor Cyan
    Push-Location $ProjectRoot
    bun test
    Pop-Location
}

function Invoke-Install {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    Push-Location $ProjectRoot
    bun install
    Pop-Location
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
}

function Invoke-Show {
    param([string]$CanvasType)
    
    if (-not $CanvasType) {
        Write-Host "Error: Canvas type required" -ForegroundColor Red
        Write-Host "Usage: .\scripts\canvas.ps1 show <calendar|document|flight>"
        exit 1
    }
    
    Write-Host "Showing $CanvasType in current terminal..." -ForegroundColor Cyan
    bun run canvas/src/cli.ts show $CanvasType
}

function Invoke-Spawn {
    param([string]$CanvasType)
    
    if (-not $CanvasType) {
        Write-Host "Error: Canvas type required" -ForegroundColor Red
        Write-Host "Usage: .\scripts\canvas.ps1 spawn <calendar|document|flight>"
        exit 1
    }
    
    Write-Host "Spawning $CanvasType in split pane..." -ForegroundColor Cyan
    bun run canvas/src/cli.ts spawn $CanvasType
}

function Invoke-Example {
    param([string]$CanvasType)
    
    if (-not $CanvasType) {
        Write-Host "Error: Canvas type required" -ForegroundColor Red
        Write-Host "Usage: .\scripts\canvas.ps1 example <calendar|document|flight>"
        exit 1
    }
    
    $ConfigFile = "$ProjectRoot\examples\$CanvasType-config.json"
    
    if (-not (Test-Path $ConfigFile)) {
        Write-Host "Error: Example config not found: $ConfigFile" -ForegroundColor Red
        exit 1
    }
    
    $Config = Get-Content $ConfigFile -Raw
    
    Write-Host "Spawning $CanvasType with example config..." -ForegroundColor Cyan
    bun run canvas/src/cli.ts spawn $CanvasType --config $Config
}

# Main script execution
if (-not (Test-BunInstalled)) {
    Write-Host "Error: Bun is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Bun:" -ForegroundColor Yellow
    Write-Host '  powershell -c "irm bun.sh/install.ps1 | iex"'
    exit 1
}

switch ($Command) {
    "env" { Invoke-Env }
    "test" { Invoke-Test }
    "install" { Invoke-Install }
    "show" { Invoke-Show -CanvasType $Canvas }
    "spawn" { Invoke-Spawn -CanvasType $Canvas }
    "example" { Invoke-Example -CanvasType $Canvas }
    default { Show-Help }
}
