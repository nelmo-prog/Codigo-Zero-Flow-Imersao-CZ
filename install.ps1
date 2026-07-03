# Instalador Código ZERO Skills (Windows PowerShell)
# Uso: iwr -useb https://raw.githubusercontent.com/nelmo-prog/Codigo-Zero-Flow-Imersao-CZ/master/install.ps1 | iex
# Não precisa de Node.js nem de Git: baixa o zip do GitHub e copia as pastas.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== INSTALADOR CÓDIGO ZERO SKILLS ===" -ForegroundColor Blue
Write-Host ""
Write-Host "Equipes de IA instaladas na sua máquina em 1 comando."
Write-Host ""

$zipUrl = "https://github.com/nelmo-prog/Codigo-Zero-Flow-Imersao-CZ/archive/refs/heads/master.zip"
$tempDir = Join-Path $env:TEMP "codigo-zero-install"
$zipPath = Join-Path $env:TEMP "codigo-zero.zip"
$claudeDir = Join-Path $env:USERPROFILE ".claude"

# Verificar Claude Code
if (-not (Test-Path $claudeDir)) {
  Write-Host "ERRO: Pasta $claudeDir não existe." -ForegroundColor Red
  Write-Host "Instale o Claude Code primeiro: https://claude.com/download"
  exit 1
}
Write-Host "Pasta Claude Code encontrada: $claudeDir" -ForegroundColor Green

# Limpar restos de instalação anterior
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

Write-Host "Baixando pacote..." -ForegroundColor Yellow
Invoke-WebRequest -UseBasicParsing -Uri $zipUrl -OutFile $zipPath

Write-Host "Extraindo..." -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
$repoRoot = Get-ChildItem $tempDir -Directory | Select-Object -First 1

function Copy-Bundle($srcName, $destPath) {
  $src = Join-Path $repoRoot.FullName $srcName
  if (-not (Test-Path $src)) { return 0 }
  if (-not (Test-Path $destPath)) { New-Item -ItemType Directory -Force $destPath | Out-Null }
  $count = 0
  foreach ($item in Get-ChildItem $src) {
    Copy-Item -Recurse -Force $item.FullName (Join-Path $destPath $item.Name)
    Write-Host "  OK $($item.Name)" -ForegroundColor Green
    $count++
  }
  return $count
}

Write-Host "`nInstalando skills..." -ForegroundColor Yellow
$skills = Copy-Bundle "skills" (Join-Path $claudeDir "skills")

Write-Host "`nInstalando comandos..." -ForegroundColor Yellow
$cmds = Copy-Bundle "commands" (Join-Path $claudeDir "commands")

Write-Host "`nInstalando squads (agentes)..." -ForegroundColor Yellow
$squads = Copy-Bundle "squads" (Join-Path $claudeDir "squads\codigo-zero")

# Limpar temporários
Remove-Item -Recurse -Force $tempDir
Remove-Item -Force $zipPath

Write-Host ""
Write-Host "=== INSTALAÇÃO CONCLUÍDA ===" -ForegroundColor Blue
Write-Host "$skills skills instaladas" -ForegroundColor Green
Write-Host "$cmds comandos instalados" -ForegroundColor Green
Write-Host "$squads squads de agentes instalados" -ForegroundColor Green
Write-Host ""
Write-Host "Próximo passo:" -ForegroundColor Yellow
Write-Host "  1. FECHE e ABRA o Claude Code"
Write-Host "  2. Digite /codigo-zero-flow pra começar"
Write-Host ""
Write-Host "Qualquer dúvida, grupo Telegram da imersão."
Write-Host ""
