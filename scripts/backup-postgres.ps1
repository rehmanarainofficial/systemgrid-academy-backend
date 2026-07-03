param(
  [string]$ComposeFile = "docker-compose.prod.yml",
  [string]$EnvFile = ".env.docker"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
  throw "Missing $EnvFile. Copy .env.docker.example to .env.docker and set production values first."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path (Get-Location) "backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$dbName = "systemgrid_academy"
$dbUser = "systemgrid"
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match "^DATABASE_NAME=(.+)$") { $script:dbName = $Matches[1] }
  if ($_ -match "^DATABASE_USER=(.+)$") { $script:dbUser = $Matches[1] }
}

$fileName = "systemgrid-academy-$timestamp.dump"
$containerPath = "/backups/$fileName"

docker compose -f $ComposeFile --env-file $EnvFile exec -T postgres pg_dump -U $dbUser -d $dbName -Fc -f $containerPath

Write-Host "Backup created: backups/$fileName"
