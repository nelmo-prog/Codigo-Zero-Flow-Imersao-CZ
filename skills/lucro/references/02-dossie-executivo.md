# Gerador de Dossiê Executivo L.U.C.R.O.

## Sua Função
Formatar o diagnóstico LUCRO completo como Dossiê Executivo, pronto pra ser renderizado no dashboard HTML. O dossiê é o entregável tangível que o empresário leva embora.

REGRA ABSOLUTA: O dossiê contém TODO o conteúdo analítico do diagnóstico. Cada cruzamento com sua análise completa, cada insight com explicação detalhada, cada recomendação com contexto. NUNCA resumir, NUNCA cortar, NUNCA "versão enxuta". O empresário precisa ler e entender o PORQUÊ de cada score, cada oportunidade, cada alerta. Denso, explicativo, coerente, visualmente organizado.

## Dados de Entrada
O diagnóstico LUCRO já foi gerado (9 telas completas com scores, rankings e análise dos 8 cruzamentos).

## Estrutura do Dossiê

Gere o dossiê no seguinte formato:

```markdown
---

# DOSSIÊ EXECUTIVO L.U.C.R.O.
## Diagnóstico Comercial Completo

**Negócio:** [nome]
**Segmento:** [nicho]
**Data:** [data]
**Gerado por:** Sistema L.U.C.R.O. via Claude Code

---

## 1. RESUMO EXECUTIVO

[3-5 parágrafos resumindo os achados principais. Tom: direto, confiante, sem enrolação. Deve causar a reação "puta merda, isso faz sentido".]

**Score Geral:** X.X/10

**Veredicto em 1 frase:** [ex: "Seu negócio tem ouro escondido na comunicação, mas a oferta atual está desalinhada com a urgência real do mercado."]

---

## 2. TOP 3 DESCOBERTAS

### Descoberta #1: [título impactante]
[Explicação + dados + o que fazer]

### Descoberta #2: [título impactante]
[Explicação + dados + o que fazer]

### Descoberta #3: [título impactante]
[Explicação + dados + o que fazer]

---

## 3. MAPA DE OPORTUNIDADES

[Tabela visual com as top 5 oportunidades, scores, e ação recomendada]

---

## 4. DIAGNÓSTICO DA OFERTA ATUAL

**Status:** ✅ Alinhada / ⚠️ Parcialmente desalinhada / ❌ Desalinhada

[Análise do gap entre oferta atual e demanda real]

**Oferta Recomendada:**
- Promessa:
- Mecanismo:
- Ticket sugerido:
- Garantia sugerida:

---

## 5. PONTOS CEGOS DO EMPRESÁRIO

[Tabela de confronto "O que você acha vs O que os sinais mostram" com os insights mais impactantes]

---

## 6. DIREÇÃO ESTRATÉGICA

### Comunicação
[Ângulos vencedores + headlines sugeridas]

### Oferta
[Ajustes recomendados]

### Canal
[Onde focar esforço de venda]

---

## 7. PLANO DE AÇÃO

### Próximas 72 horas (3 ações rápidas)
1.
2.
3.

### Próximos 7 dias
1.
2.

### Próximos 30 dias
1.
2.
3.

---

## 8. SCORECARD COMPLETO

| Dimensão | Score | Status |
|----------|-------|--------|
| L - Leitura de mercado | X/10 | 🟢/🟡/🔴 |
| U - Urgências identificadas | X/10 | 🟢/🟡/🔴 |
| C - Cruzamento de sinais | X/10 | 🟢/🟡/🔴 |
| R - Ranking de oportunidades | X/10 | 🟢/🟡/🔴 |
| O - Oferta otimizada | X/10 | 🟢/🟡/🔴 |
| **TOTAL** | **X.X/10** | |

> 🟢 = 8-10 (forte) | 🟡 = 5-7 (precisa atenção) | 🔴 = 0-4 (crítico)

---

*Dossiê gerado pelo Sistema L.U.C.R.O. | [data]*
*Metodologia proprietária de Nelmo Ricalde | codigozero.com.br*
```

## Regras
1. Tom executivo mas acessível (empresário de 45 anos precisa entender, não analista)
2. NUNCA mais de 3 parágrafos seguidos sem bullet point, tabela ou destaque
3. Cada seção precisa ter "e agora, o que fazer" (acionável)
4. O dossiê deve funcionar sozinho, sem precisar do diagnóstico completo pra fazer sentido
5. Máximo 5-6 páginas quando renderizado em PDF
6. NUNCA usar travessão/dash (—) no meio de frases, usar vírgula no lugar
