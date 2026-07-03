#!/usr/bin/env node
/**
 * Instalador Código ZERO Skills
 *
 * Uso:
 *   node install.js
 *
 * O que faz:
 *   1. Detecta pasta ~/.claude/ (Mac/Linux/Windows)
 *   2. Copia skills/ → ~/.claude/skills/
 *   3. Copia commands/ → ~/.claude/commands/
 *   4. Copia squads/ → ~/.claude/squads/codigo-zero/ (agentes dos squads)
 *   5. Mostra resumo do que foi instalado
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const SQUADS_DIR = path.join(CLAUDE_DIR, 'squads', 'codigo-zero');

const REPO_ROOT = __dirname;
const SOURCE_SKILLS = path.join(REPO_ROOT, 'skills');
const SOURCE_COMMANDS = path.join(REPO_ROOT, 'commands');
const SOURCE_SQUADS = path.join(REPO_ROOT, 'squads');

function log(msg, color = '') {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;

  if (fs.lstatSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
  return true;
}

function main() {
  log('\n=== INSTALADOR CÓDIGO ZERO SKILLS ===\n', 'blue');
  log('Um comando, 11 equipes de IA instaladas na sua máquina.\n');

  if (!fs.existsSync(CLAUDE_DIR)) {
    log(`ERRO: Pasta ${CLAUDE_DIR} não existe.`, 'red');
    log('Instale o Claude Code primeiro: https://claude.com/download\n');
    process.exit(1);
  }
  log(`Pasta Claude Code encontrada: ${CLAUDE_DIR}`, 'green');

  if (!fs.existsSync(SKILLS_DIR)) fs.mkdirSync(SKILLS_DIR, { recursive: true });
  if (!fs.existsSync(COMMANDS_DIR)) fs.mkdirSync(COMMANDS_DIR, { recursive: true });

  log('\nInstalando skills...', 'yellow');
  let skillCount = 0;
  for (const skill of fs.readdirSync(SOURCE_SKILLS)) {
    const src = path.join(SOURCE_SKILLS, skill);
    const dest = path.join(SKILLS_DIR, skill);
    if (copyRecursive(src, dest)) {
      log(`  OK ${skill}`, 'green');
      skillCount++;
    }
  }

  log('\nInstalando comandos...', 'yellow');
  let cmdCount = 0;
  for (const cmd of fs.readdirSync(SOURCE_COMMANDS)) {
    const src = path.join(SOURCE_COMMANDS, cmd);
    const dest = path.join(COMMANDS_DIR, cmd);
    if (copyRecursive(src, dest)) {
      log(`  OK ${cmd}`, 'green');
      cmdCount++;
    }
  }

  log('\nInstalando squads (agentes)...', 'yellow');
  let squadCount = 0;
  if (fs.existsSync(SOURCE_SQUADS)) {
    for (const squad of fs.readdirSync(SOURCE_SQUADS)) {
      const src = path.join(SOURCE_SQUADS, squad);
      const dest = path.join(SQUADS_DIR, squad);
      if (copyRecursive(src, dest)) {
        log(`  OK ${squad}`, 'green');
        squadCount++;
      }
    }
  }

  log('\n=== INSTALAÇÃO CONCLUÍDA ===', 'blue');
  log(`${skillCount} skills instaladas`, 'green');
  log(`${cmdCount} comandos instalados`, 'green');
  log(`${squadCount} squads de agentes instalados`, 'green');
  log('\nProximo passo:', 'yellow');
  log('  1. Reinicie o Claude Code');
  log('  2. Digite /codigo-zero-flow pra começar');
  log('\nQualquer dúvida, grupo Telegram da imersão.\n');
}

main();
