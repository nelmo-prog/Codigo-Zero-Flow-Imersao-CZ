---
name: squad-google-ads
description: "Orquestrador de campanhas Google Ads. Fase 8 do Código ZERO Flow. Cria campanha Search completa: keywords, RSA ads, negativas, bid strategy. 2 modos: blueprint manual (padrão, sem API) ou publicação via Google Ads API pra quem tiver developer token aprovado. Actions: criar campanha, gerar RSA ads, keywords, negativas. Topics: Google Ads, campanha, Search, PMax, keywords, negativas, RSA, headline, description, CPA, budget."
---

# Squad Google Ads, Orquestrador de Campanhas

Cria campanhas Google Ads completas. **Fase 8 do Código ZERO Flow.**

Consome (cadeia alimentar): `02-avatar/RESUMO-SCALE.md` + `LINGUAGEM-CRUA.md`, `03-produto/PRODUTO-SPEC.md`, `04-oferta/OFERTA-COMPLETA.md`, `06-lp/` (URL de destino). Gera: `08-google-ads/CAMPANHAS-GOOGLE.md`.

---

## Os 2 modos de execução (detectar ANTES de começar)

### MODO 1, Blueprint manual (PADRÃO, funciona pra todo mundo)
Gera `08-google-ads/CAMPANHAS-GOOGLE.md` completo: estrutura da campanha, ad groups, keywords com match types, negative keywords, RSA ads prontos (headlines + descriptions dentro dos limites), bid strategy progressiva e passo a passo de execução manual no painel do Google Ads. Nenhuma credencial necessária.

### MODO 2, Publicação via API (avançado, raro em iniciante)
Exige: Customer ID, Developer Token APROVADO pelo Google (processo que leva dias, não dá pra criar na hora), Client ID/Secret OAuth e Refresh Token, nas variáveis de ambiente `GOOGLE_ADS_*`. Se o usuário não tiver TUDO isso pronto, use o MODO 1 sem fricção. Tudo criado com status **PAUSED**.

---

## Pipeline de Criação (4 Fases)

### FASE 1, CONTEXTO

**REGRA DE CADEIA ALIMENTAR (verificar ANTES de perguntar):**
- `03-produto/PRODUTO-SPEC.md` → substitui "o que está anunciando?"
- `06-lp/` → substitui "URL de destino"
- `02-avatar/RESUMO-SCALE.md` → substitui "público-alvo" (50 camadas > resposta genérica)
- `04-oferta/OFERTA-COMPLETA.md` → preço, USPs, garantia
Só perguntar o que faltar: objetivo (leads, vendas, tráfego), budget diário em reais, localização, tipo de campanha (Search é o padrão pra iniciante).

### FASE 2, ESTRUTURA (checkpoint de aprovação)

- Nome da campanha, bid strategy, budget diário
- 1-3 Ad Groups com temas diferentes
- 10-15 keywords por grupo, formato `[exata]`, `"frase"`, ampla (ampla só com aviso: exige negativação constante)
- Negative keywords iniciais (grátis, curso grátis, vaga, emprego, etc conforme nicho)

| Objetivo | Bid Strategy |
|----------|--------------|
| Leads / formulários | MAXIMIZE_CONVERSIONS ou TARGET_CPA |
| Vendas / e-commerce | MAXIMIZE_VALUE ou TARGET_ROAS |
| Tráfego qualificado | MAXIMIZE_CONVERSIONS |

**CHECKPOINT 1:** apresentar estrutura. Aguardar aprovação.

### FASE 3, CRIAÇÃO RSA (checkpoint de aprovação)

**CADEIA ALIMENTAR:** se `LINGUAGEM-CRUA.md` existe, headlines saem das frases reais do avatar (dor vira headline, desejo vira CTA).

Regras de RSA:
- Headlines: mínimo 8 recomendado (máximo 15), **cada uma com máximo 30 caracteres**
- Descriptions: mínimo 3 (máximo 4), **cada uma com máximo 90 caracteres**
- Mix: marca, benefício, USP, CTA, preço/oferta, prova social, urgência
- Cada headline faz sentido sozinha (o Google combina aleatoriamente)
- Português correto, NUNCA travessão (—), limites de caracteres RIGOROSOS

**CHECKPOINT 2:** apresentar RSA ads. Aguardar aprovação.

### FASE 4, EXECUÇÃO

**MODO 1:** salvar `08-google-ads/CAMPANHAS-GOOGLE.md` com tudo + passo a passo manual do painel.
**MODO 2:** confirmação final, criar via API na ordem: CampaignBudget → Campaign (PAUSED) → Ad Groups → Keywords → Negativas → RSA Ads. Confirmar IDs.

---

## Análise de Search Terms (pós-lançamento, semanal)

1. Puxar search terms (painel ou API), ordenar por gasto
2. Classificar cada termo: relevante (mantém/vira keyword), irrelevante (negativa), ambíguo (monitora)
3. Termo irrelevante → negativa exata; padrão irrelevante ("grátis") → negativa frase/ampla
4. NUNCA negativar termo que está convertendo, mesmo com CPA alto

---

## Regras Absolutas

1. **ORTOGRAFIA:** headlines e descriptions com acentos e cedilhas corretos
2. **LIMITES:** headlines ≤ 30 chars, descriptions ≤ 90 chars. Sem exceção
3. **STATUS:** tudo criado como PAUSED
4. **BUDGET:** nunca aumentar mais de 50% de uma vez
5. **NUNCA** travessão (—) em headlines, descriptions ou textos
6. **BROAD MATCH:** só recomendar avisando do risco e da necessidade de negativação semanal
7. **CREDENCIAIS:** só via variáveis de ambiente, nunca no chat, nunca em arquivo do projeto
