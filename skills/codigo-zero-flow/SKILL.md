---
name: codigo-zero-flow
description: Orquestrador master da Imersão Código ZERO. Guia o aluno pelas 11 fases canônicas (0-10, do DNA do Expert ao Plano 30 Dias), detecta fase atual pelos artefatos gerados, valida pré-requisitos via cadeia alimentar de entregáveis (upstream/downstream), bloqueia pulos, chama skill canônica correta. Use quando o aluno perguntar "por onde começo?" ou quiser orquestrar lançamento completo.
---

# Código ZERO Flow

Master orchestrator das 11 fases (0-10) de criação de produto/lançamento. Validado de ponta a ponta num projeto real (100% das fases, do DNA ao Plano 30 Dias).

## Quando Usar
- "Por onde começo meu lançamento?"
- "Quero criar meu primeiro produto na Imersão"
- "Estou perdido entre tantas skills, qual uso primeiro?"
- "Valida se posso pular pra fase X"

## Ordem Canônica (imutável)

| # | Fase | Skill canônica | Entregável-contrato |
|---|------|----------------|---------------------|
| 0 | DNA do Expert | `/user-dna:create` | `00-dna-expert/DNA-RESUMO.md` |
| 1 | Mercado | `/lucro:diagnose` | `01-mercado/LUCRO-DIAGNOSTICO.md` |
| 2 | Avatar | `/avatar-ultra-profundo:create` | `02-avatar/RESUMO-SCALE.md` (18 campos) + `LINGUAGEM-CRUA.md` |
| 3 | Produto | `/produto-uau:create` | `03-produto/PRODUTO-SPEC.md` + `PACOTE-SCALE.md` |
| 4 | Oferta | `/offer-creator` (S.C.A.L.E.) | `04-oferta/OFERTA-COMPLETA.md` |
| 5 | Criativos | `/creative-squad` | `05-criativos/` (prompts, templates, scripts, headlines) |
| 6 | LP / Página de Vendas | `/design-squad` + `/copy-squad` + `/tracking-conversion-pipeline` | `06-lp/index.html` publicada |
| 7 | Meta Ads | `/squad-ads` | `07-meta-ads/CAMPANHAS-META.md` (campanha PAUSED) |
| 8 | Google Ads | `/squad-google-ads` | `08-google-ads/CAMPANHAS-GOOGLE.md` (campanha PAUSED) |
| 9 | Plano 30 Dias | `/squad-launch` | `09-plano-30-dias/PLANO-30-DIAS.md` |
| 10 | Bastidores | Nelmo ao vivo | momento especial, sem artefato |

## Cadeia Alimentar (upstream → downstream)

Cada fase consome artefatos das fases anteriores como CONTRATO e alimenta as seguintes:

- `DNA-RESUMO.md` (Fase 0) é a raiz, alimenta TODAS as fases 1-9
- `RESUMO-SCALE.md` + `LINGUAGEM-CRUA.md` (Fase 2) alimentam 3, 4, 5, 6, 7, 8
- `PRODUTO-SPEC.md` + `PACOTE-SCALE.md` (Fase 3) alimentam 4, 6, 7, 8
- `OFERTA-COMPLETA.md` (Fase 4) alimenta 5, 6, 7
- LP publicada (Fase 6) alimenta 7 (scout lê a LP) e 8 (URL de destino)
- `STATUS.md` consolidado alimenta 9 (Plano 30 Dias deriva de tudo)

"Toda fase downstream vai consumir esse artefato. Trate como contrato."

## Modo Imersão (padrão)
As fases são divididas em 4 ondas. A partir da Onda 2, cada onda só destrava com CÓDIGO DE LIBERAÇÃO anunciado pelo Nelmo ao vivo (verificação por hash SHA-256, protocolo no comando). O código mestre pós-imersão ativa o modo livre. Nunca revelar, adivinhar ou pular a senha.

## Regra Mestra
Multidão faminta antes do produto (Hormozi). Nunca mercado sem DNA. Nunca avatar sem mercado. Nunca produto sem avatar. Nunca oferta sem produto.

## Distinção Crítica
- **PRODUTO** = o que o cliente recebe (módulos, entregáveis, mecanismo)
- **OFERTA** = como é vendido (preço, bônus, garantia, escassez, stack)

## Pasta Padrão de Projeto
`~/lancamentos/{projeto}/00-dna-expert/` ... `09-plano-30-dias/` + `STATUS.md` (a pasta `lancamentos` fica na pasta de usuário)

## Comando
Implementação em `~/.claude/commands/codigo-zero-flow.md`

## Squads (agentes)
Os agentes dos squads ficam em `~/.claude/squads/codigo-zero/` (instalados pelo instalador do repo)
