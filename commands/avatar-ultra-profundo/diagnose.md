---
description: Briefing inicial antes do squad Avatar Ultra Profundo rodar. Clarifica nicho, produto, público, B2B/B2C, canal, ticket, nível de consciência, momento de mercado.
---

# Avatar Ultra Profundo, Diagnose

Coleta inputs obrigatórios antes de rodar o squad.

## Fluxo

Ative o agente `@avatar-chief` do squad em `~/.claude/squads/codigo-zero/avatar-ultra-profundo\`.

Execute o comando interno `*diagnose` dele, que roda a task `tasks/avatar-diagnose-input.md`.

## Perguntas obrigatórias (não pular)

1. **Nicho**: qual mercado específico?
2. **Produto/serviço/transformação prometida**: o que você vende?
3. **Público inicial** (se houver): quem já compra ou você tem lista?
4. **B2B ou B2C**: quem é o pagador?
5. **Canal de aquisição**: onde você atrai (Instagram, Google, indicação)?
6. **Canal de venda**: onde converte (LP, WhatsApp, ligação)?
7. **Faixa de ticket**: R$ quanto?
8. **Nível de consciência do público**: frio, morno, ou quente?
9. **Objetivo da análise**: entender avatar, alimentar oferta, copy, funil, script, criativos?
10. **Momento do mercado**: em alta, saturado, nascente?
11. **Concorrência percebida**: quem você vê competindo?

## Saída

Arquivo `~/lancamentos/{projeto}\02-avatar\INPUT-AVATAR.md` com os 11 campos preenchidos.

## Regras
- Se faltar informação, o agente deve assumir hipóteses plausíveis E sinalizar "HIPÓTESE:" (nunca tratar como fato)
- Tom direto, sem clichê
- Português brasileiro, acentos obrigatórios
- Nunca travessão/dash (—), sempre vírgula
