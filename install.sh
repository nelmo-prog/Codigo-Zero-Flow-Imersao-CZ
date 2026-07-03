#!/bin/bash
# Instalador Código ZERO Skills (Mac/Linux/WSL)
# Uso: curl -fsSL https://raw.githubusercontent.com/nelmo-prog/Codigo-Zero-Flow-Imersao-CZ/master/install.sh | bash

set -e

echo ""
echo "=== INSTALADOR CÓDIGO ZERO SKILLS ==="
echo ""
echo "11 equipes de IA instaladas na sua máquina em 1 comando."
echo ""

REPO_URL="https://github.com/nelmo-prog/Codigo-Zero-Flow-Imersao-CZ.git"
TMP_DIR=$(mktemp -d)
CLAUDE_DIR="$HOME/.claude"

# Verificar Claude Code
if [ ! -d "$CLAUDE_DIR" ]; then
  echo "ERRO: Pasta $CLAUDE_DIR não existe."
  echo "Instale o Claude Code primeiro: https://claude.com/download"
  exit 1
fi

# Verificar git
if ! command -v git &> /dev/null; then
  echo "ERRO: git não está instalado."
  echo "Instale git primeiro: https://git-scm.com/downloads"
  exit 1
fi

# Verificar Node
if ! command -v node &> /dev/null; then
  echo "ERRO: Node.js não está instalado."
  echo "Instale Node.js primeiro: https://nodejs.org"
  exit 1
fi

echo "Clonando repositório..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR/Codigo-Zero-Flow-Imersao-CZ" > /dev/null 2>&1

echo "Executando instalador..."
node "$TMP_DIR/Codigo-Zero-Flow-Imersao-CZ/install.js"

# Limpar temp
rm -rf "$TMP_DIR"

echo ""
echo "Instalação concluída. Reinicie o Claude Code."
