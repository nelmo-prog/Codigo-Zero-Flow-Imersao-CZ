#!/usr/bin/env bash
# Instalador Código ZERO Skills (Mac / Linux / WSL)
# Uso: curl -fsSL https://raw.githubusercontent.com/nelmo-prog/Codigo-Zero-Flow-Imersao-CZ/master/install.sh | bash
# Não precisa de Node.js nem de Git: baixa o pacote do GitHub e copia as pastas.

set -e

echo ""
echo "=== INSTALADOR CÓDIGO ZERO SKILLS ==="
echo ""
echo "Equipes de IA instaladas na sua máquina em 1 comando."
echo ""

TARBALL_URL="https://github.com/nelmo-prog/Codigo-Zero-Flow-Imersao-CZ/archive/refs/heads/master.tar.gz"
TEMP_DIR="$(mktemp -d)"
CLAUDE_DIR="$HOME/.claude"

if [ ! -d "$CLAUDE_DIR" ]; then
  echo "ERRO: Pasta $CLAUDE_DIR não existe."
  echo "Instale o Claude Code primeiro: https://claude.com/download"
  exit 1
fi
echo "Pasta Claude Code encontrada: $CLAUDE_DIR"

echo "Baixando pacote..."
curl -fsSL "$TARBALL_URL" -o "$TEMP_DIR/pacote.tar.gz"

echo "Extraindo..."
tar -xzf "$TEMP_DIR/pacote.tar.gz" -C "$TEMP_DIR"
REPO_ROOT="$(find "$TEMP_DIR" -maxdepth 1 -type d -name "Codigo-Zero-*" | head -n 1)"

copy_bundle() {
  local src="$REPO_ROOT/$1"
  local dest="$2"
  local count=0
  [ -d "$src" ] || { echo 0; return; }
  mkdir -p "$dest"
  for item in "$src"/*; do
    cp -R "$item" "$dest/"
    echo "  OK $(basename "$item")" >&2
    count=$((count+1))
  done
  echo $count
}

echo ""
echo "Instalando skills..."
SKILLS=$(copy_bundle "skills" "$CLAUDE_DIR/skills")

echo ""
echo "Instalando comandos..."
CMDS=$(copy_bundle "commands" "$CLAUDE_DIR/commands")

echo ""
echo "Instalando squads (agentes)..."
SQUADS=$(copy_bundle "squads" "$CLAUDE_DIR/squads/codigo-zero")

rm -rf "$TEMP_DIR"

echo ""
echo "=== INSTALAÇÃO CONCLUÍDA ==="
echo "$SKILLS skills instaladas"
echo "$CMDS comandos instalados"
echo "$SQUADS squads de agentes instalados"
echo ""
echo "Próximo passo:"
echo "  1. FECHE e ABRA o Claude Code"
echo "  2. Digite /codigo-zero-flow pra começar"
echo ""
echo "Qualquer dúvida, grupo Telegram da imersão."
echo ""
