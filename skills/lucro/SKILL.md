---
name: lucro
description: Sistema L.U.C.R.O. de diagnóstico de negócios com IA (Leitura de mercado, Urgências, Cruzamento de sinais, Ranking de oportunidades, Oferta otimizada). Fase 1 do Código ZERO Flow. Entrevista guiada + motor de 8 cruzamentos + dossiê executivo + dashboard HTML. Use quando pedir "diagnóstico LUCRO", "/lucro:diagnose", ou na Fase 1 (Mercado) do flow.
---

# L.U.C.R.O., Diagnóstico de Negócios

Motor de inteligência que cruza sinais internos e externos do negócio e devolve: onde está a oportunidade, qual dor está quente, qual urgência está escondida, qual oferta tem mais tração e se o empresário consegue executar agora.

**Fase 1 do Código ZERO Flow.** Consome `00-dna-expert/DNA-RESUMO.md` (upstream). Gera `01-mercado/LUCRO-DIAGNOSTICO.md` (contrato downstream, alimenta as fases 2 em diante).

## Pipeline (siga na ordem, arquivos em `references/`)

1. **Entrevista guiada**: siga `references/00-entrevistador.md`. Perguntas uma a uma, 10-15 minutos. Se o aluno preferir preencher de uma vez, use `references/template-briefing.md`.
2. **Motor de 8 cruzamentos**: rode `references/01-motor-lucro.md` sobre o briefing coletado + DNA-RESUMO.md.
3. **Dossiê executivo**: formate com `references/02-dossie-executivo.md` (denso, analítico, NUNCA resumido). Salve como `01-mercado/LUCRO-DIAGNOSTICO.md`.
4. **Dashboard visual**: gere HTML com `references/03-gerar-dashboard.md`, salve na mesma pasta e mostre o caminho clicável (abrir no navegador, Ctrl+P pra PDF).

## Os 8 cruzamentos

1. Dor x Urgência → ranking de dores quentes
2. Dor x Objeção → mapa de tensão comercial
3. Desejo x Capacidade de pagar → ranking de desejos monetizáveis
4. Oferta atual x Oportunidade real → gap de oferta
5. Comunicação x Resposta do mercado → ângulos vencedores
6. "O que você acha" vs "O que os sinais mostram" → confronto de hipóteses
7. Timing x Capacidade de execução → score de executabilidade
8. Cliente atual x Cliente ideal → gap de ICP

## Regras do motor

- NUNCA inventar dados. Sinalizar como "hipótese baseada em padrão do nicho"
- SEMPRE mostrar "O que você ACHA" vs "O que os SINAIS mostram"
- Scores de 0 a 10 em TODAS as dimensões, score geral no topo
- Linguagem direta, sem jargão acadêmico
- Ortografia PT-BR impecável, nunca travessão (—), sempre vírgula
- Sem APIs externas: roda 100% dentro do Claude
