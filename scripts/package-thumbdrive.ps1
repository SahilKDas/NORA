param(
  [string]$DestinationRoot = "",
  [switch]$IncludeNodeModules
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$rootPath = $root.Path

if (-not $DestinationRoot) {
  $drive = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 } | Sort-Object DeviceID | Select-Object -First 1
  if (-not $drive) {
    throw "No removable drive found. Pass -DestinationRoot E:\ or plug in a thumbdrive."
  }
  $DestinationRoot = "$($drive.DeviceID)\"
}

$destinationRootPath = [System.IO.Path]::GetFullPath($DestinationRoot)
if (-not (Test-Path -LiteralPath $destinationRootPath)) {
  throw "Destination root does not exist: $destinationRootPath"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destination = Join-Path $destinationRootPath "NORA-City-OS-$stamp"
New-Item -ItemType Directory -Path $destination -Force | Out-Null

$items = @(
  "dist",
  "server",
  "src",
  "data",
  "index.html",
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.js",
  "README.md",
  "Intermediate Example Projects.pdf"
)

foreach ($item in $items) {
  $source = Join-Path $rootPath $item
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
  }
}

if ($IncludeNodeModules) {
  $modules = Join-Path $rootPath "node_modules"
  if (Test-Path -LiteralPath $modules) {
    $targetModules = Join-Path $destination "node_modules"
    robocopy $modules $targetModules /MIR /R:2 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -gt 7) {
      throw "Robocopy failed while copying node_modules with exit code $LASTEXITCODE"
    }
    $global:LASTEXITCODE = 0
  }
}

$launcher = @"
@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run NORA.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\express" (
  echo Dependencies are missing.
  where pnpm >nul 2>nul
  if errorlevel 1 (
    echo pnpm is required to install dependencies.
    pause
    exit /b 1
  )
  pnpm install --frozen-lockfile
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
if not exist "dist\index.html" (
  pnpm build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
start "" "http://localhost:8787"
node server\index.js
pause
"@
Set-Content -LiteralPath (Join-Path $destination "RUN_NORA.bat") -Value $launcher -Encoding ASCII

$thumbdriveReadme = @"
# NORA Thumbdrive Copy

Run `RUN_NORA.bat` to start the app.

The app opens at:

http://localhost:8787

If dependencies are missing, run:

pnpm install --frozen-lockfile
pnpm build
pnpm start

For a full offline copy, run:

powershell -ExecutionPolicy Bypass -File scripts\package-thumbdrive.ps1 -IncludeNodeModules
"@
Set-Content -LiteralPath (Join-Path $destination "THUMBDRIVE_README.md") -Value $thumbdriveReadme -Encoding UTF8

$zipPath = Join-Path $destinationRootPath "NORA-City-OS-$stamp.zip"
Compress-Archive -Path (Join-Path $destination "*") -DestinationPath $zipPath -Force

Set-Content -LiteralPath (Join-Path $destinationRootPath "NORA-LATEST.txt") -Value "Latest NORA deploy: $destination`nZip: $zipPath" -Encoding UTF8

[pscustomobject]@{
  Destination = $destination
  Zip = $zipPath
  IncludesNodeModules = [bool]$IncludeNodeModules
}
