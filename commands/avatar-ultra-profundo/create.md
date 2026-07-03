---
description: Cria dossiê ultra-profundo do avatar (14 blocos, 50 camadas, 10 subcamadas de autossabotagem). Output alimenta S.C.A.L.E. direto.
---

# Avatar Ultra Profundo, Create

Roda o workflow completo `wf-avatar-from-zero.yaml` do squad em `~/.claude/squads/codigo-zero/avatar-ultra-profundo\`.

## Pré-requisito
`/avatar-ultra-profundo:diagnose` deve ter rodado antes (input salvo em `02-avatar/INPUT-AVATAR.md`).

Se não rodou, execute `:diagnose` primeiro.

## Execução

Ative `@avatar-chief` com comando interno `*create`. Ele orquestra os 7 agentes especialistas (Cialdini, Kahneman, Schwartz, Christensen, Brown, Abraham, Hormozi) por blocos:

- **Cialdini + Kahneman**: Blocos 1, 6, 11 (Raio X, Medos, Mecânica de Decisão)
- **Brown**: Blocos 4, 6 (Dores inconfessáveis, vergonha)
- **Abraham**: Bloco 5 (Desejos ocultos)
- **Christensen**: Blocos 2, 3, 9 (Identidade, Contexto, Tentativas)
- **Schwartz**: Blocos 10, 14 (Linguagem crua, Resumo SCALE)
- **Hormozi**: Blocos 7, 8, 13 (Autossabotagem, Objeções, Subcamadas)
- **Chief**: Bloco 12 (50 Camadas obrigatórias, síntese)

## Saídas (em `~/lancamentos/{projeto}\02-avatar\`)

1. `DOSSIE-COMPLETO.md` — 14 blocos completos
2. `50-CAMADAS.md` — detalhamento das 50 camadas obrigatórias (Bloco 12)
3. `AUTOSSABOTAGEM.md` — 15 padrões + 10 subcamadas (Blocos 7 e 13)
4. `LINGUAGEM-CRUA.md` — 25+ frases reais (Bloco 10)
5. `RESUMO-SCALE.md` — 18 campos pro S.C.A.L.E. (Bloco 14)

## Regras Críticas (não pular)

1. Nunca genérico. Nunca clichê de marketing. Nunca estereótipo.
2. Mostrar contradições reais, autoenganos, ganhos secundários
3. Autossabotagem como força CENTRAL, não periférica
4. Marcação obrigatória de confiança: FATO / INFERÊNCIA / HIPÓTESE
5. Português brasileiro, ortografia impecável
6. Nunca travessão/dash (—), sempre vírgula

## Autoauditoria Final
Após gerar, Chief roda checklist `avatar-depth-checklist.md`:
- Parece um ser humano real?
- Revela motivo real de compra?
- Trouxe tensões, vergonhas, desejos ocultos?
- Mostrou como avatar se sabota?
- Mostrou como quebrar essa autossabotagem?

Se qualquer resposta for "não", retorna pro agente dono do bloco pra aprofundar.

## Próximo passo
Após dossiê pronto, rode `/codigo-zero-flow next` ou `/produto-uau:create` (Fase 3).
