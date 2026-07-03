# Instalador Código ZERO Skills (Windows PowerShell)
# Uso: iwr -useb https://raw.githubusercontent.com/nelmo-prog/Codigo-Zero-Flow-Imersao-CZ/master/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== INSTALADOR CÓDIGO ZERO SKILLS ===" -ForegroundColor Blue
Write-Host ""
Write-Host "11 equipes de IA instaladas na sua máquina em 1 comando."
Write-Host ""

$repoUrl = "https://github.com/nelmo-prog/Codigo-Zero-Flow-Imersao-CZ.git"
$tempDir = Join-Path $env:TEMP "Codigo-Zero-Flow-Imersao-CZ-install"
$claudeDir = Join-Path $env:USERPROFILE ".claude"

# Verificar Claude Code
if (-not (Test-Path $claudeDir)) {
  Write-Host "ERRO: Pasta $claudeDir não existe." -ForegroundColor Red
  Write-Host "Instale o Claude Code primeiro: https://claude.com/download"
  exit 1
}

# Verificar git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "ERRO: git não está instalado." -ForegroundColor Red
  Write-Host "Instale git primeiro: https://git-scm.com/downloads"
  exit 1
}

# Verificar Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "ERRO: Node.js não está instalado." -ForegroundColor Red
  Write-Host "Instale Node.js primeiro: https://nodejs.org"
  exit 1
}

# Limpar temp anterior
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }

Write-Host "Clonando repositório..." -ForegroundColor Yellow
git clone --depth 1 $repoUrl $tempDir 2>&1 | Out-Null

Write-Host "Executando instalador..." -ForegroundColor Yellow
node (Join-Path $tempDir "install.js")

# Limpar temp
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "Instalação concluída. Reinicie o Claude Code." -ForegroundColor Green
