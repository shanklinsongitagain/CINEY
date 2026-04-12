$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$viteUrl = 'http://localhost:50525'

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$projectRoot'; npm run dev"
)

Start-Sleep -Seconds 4
Start-Process $viteUrl
