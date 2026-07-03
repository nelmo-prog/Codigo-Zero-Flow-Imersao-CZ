---
name: squad-ads
description: "Orquestrador de campanhas Meta Ads (Instagram/Facebook). Fase 7 do Código ZERO Flow. Cria campanha completa: análise de negócio, estrutura, copies, criativos e publicação. 3 modos de execução: blueprint manual (padrão, sem API), publicação via MCP da Meta ou Marketing API (quem tiver BM + conta de anúncios), e criativos via API de imagem ou upload manual. Actions: criar campanha, gerar criativos, copy de anúncio. Topics: campanha, anúncio, Instagram, Meta Ads, criativo, copy, targeting, público, budget, ROAS, conversão, tráfego."
---

# Squad Ads, Orquestrador de Campanhas Meta

Cria campanhas completas de Meta Ads (Instagram/Facebook). Você descreve o que quer anunciar, o squad faz 99% do trabalho.

**Fase 7 do Código ZERO Flow.** Consome (cadeia alimentar): `02-avatar/RESUMO-SCALE.md` + `LINGUAGEM-CRUA.md`, `04-oferta/OFERTA-COMPLETA.md`, `06-lp/` (LP publicada). Gera: `07-meta-ads/CAMPANHAS-META.md` + `COPY-ADS.md` + `SETUP-CHECKLIST.md`.

---

## Os 3 modos de execução (detectar ANTES de começar)

Pergunte ao usuário o que ele tem, e escolha o modo:

### MODO 1, Blueprint manual (PADRÃO, funciona pra todo mundo, zero API)
O squad gera o pacote completo em `07-meta-ads/`:
- `CAMPANHAS-META.md`: estrutura hierárquica (campanha → conjuntos → anúncios), targeting detalhado, budget por conjunto, KPIs e plano de escala
- `COPY-ADS.md`: variações de copy prontas (3 ângulos x formatos), com UTMs
- `SETUP-CHECKLIST.md`: passo a passo de execução manual na Ads Manager, tela por tela

O usuário executa manualmente na Ads Manager. Nenhuma credencial necessária.

### MODO 2, Publicação via API (quem tiver BM + conta de anúncios)
Se o usuário tem MCP da Meta conectado OU token da Marketing API/Graph API:
- Requisitos mínimos: Business Manager, conta de anúncios ativa, Página do Facebook, Instagram vinculado, token com permissões `ads_management` + `ads_read` + `pages_read_engagement`
- BM verificada NÃO é obrigatória pra criar campanhas, mas reduz muito o risco de bloqueio. Avise o usuário disso
- Perguntar: Account ID (act_...), Page ID, Instagram User ID, e como acessar o token (MCP já conectado, ou variável de ambiente `META_ACCESS_TOKEN`)
- NUNCA pedir pro usuário colar o token no chat se houver tela compartilhada
- Tudo criado com status **PAUSED**, sempre

### MODO 3, Criativos (escolher sub-modo dentro de qualquer modo acima)
- **3A, geração via API:** se o usuário tem `GEMINI_API_KEY` (Nano Banana Pro `gemini-3-pro-image-preview`, ou Flash `gemini-3.1-flash-image-preview`) ou `OPENAI_API_KEY` (GPT Image), gerar as imagens direto, usando as fotos de referência DO USUÁRIO
- **3B, manual gratuito:** gerar os PROMPTS prontos (um por criativo, com cenário, roupa, pose, iluminação e a foto de referência descrita) e instruir o usuário a criar as imagens gratuitamente no app do Gemini ou no ChatGPT, e salvar em `lancamentos/{projeto}/05-criativos/imagens/`. O squad então usa essas imagens na LP e na campanha
- Fotos de referência do usuário: pedir 3-5 fotos nítidas do rosto/corpo, salvar em `lancamentos/{projeto}/05-criativos/referencias/`

---

## Pipeline de Execução (4 Fases)

### FASE 1, INTELIGÊNCIA

**REGRA DE CADEIA ALIMENTAR (verificar ANTES de rodar agentes):**
Se o projeto tem pasta `lancamentos/{projeto}/`, consumir outputs existentes:
- `02-avatar/RESUMO-SCALE.md` → substitui Persona (avatar já existe com 50 camadas)
- `02-avatar/LINGUAGEM-CRUA.md` → alimenta Ogilvy na Fase 3 (frases reais do avatar)
- `03-produto/PRODUTO-SPEC.md` → complementa Scout (produto já documentado)
- `04-oferta/OFERTA-COMPLETA.md` → complementa Scout (oferta já documentada)
- `06-lp/index.html` → Scout lê a LP inteira (produto, preço, USPs, garantia, funil)
Se os arquivos não existem, rodar os agentes normalmente (fallback).

**Scout (Analista de Negócio):** extrai produto, preço, entregáveis, USPs, garantia, bônus da LP e dos artefatos.
**Persona (Analista de Avatar):** adapta o RESUMO-SCALE pra ads (ângulos frio/morno/quente).
**Radar (Analista Competitivo):** se houver concorrentes citados, comparativo de posicionamento.

**Output Fase 1:** briefing consolidado.

### FASE 2, ESTRUTURA (checkpoint de aprovação)

**Atlas (Estrategista Meta):** objetivo da campanha, 2-4 conjuntos com targeting (idade, gênero, interesses, localização), placement (Feed 1:1; Stories/Reels só com 9:16), budget diário por conjunto, duração.

**CHECKPOINT 1:** apresentar estrutura completa. Aguardar aprovação.

### FASE 3, CRIAÇÃO (checkpoint de aprovação)

**Ogilvy (Copywriter):**
- Se `LINGUAGEM-CRUA.md` existe: headlines saem das frases reais do avatar
- 3 variações de copy (3 ângulos), português impecável (acentos, cedilhas), NUNCA travessão (—)
- CTA coerente com o objetivo

**CHECKPOINT 2:** apresentar copies. Aguardar aprovação.

**Harmon (Diretor Criativo):** define 3 cenas (ambiente, roupa, pose, iluminação), mantendo âncora de consistência do personagem (acessórios fixos do usuário).

**Da Vinci (Criativos):** executa o MODO 3A (gerar via API) ou 3B (entregar prompts + aguardar upload em `05-criativos/imagens/`). Formato 1:1 (1080x1080) pra Feed; 9:16 (1080x1920) se placement incluir Stories/Reels. Overlay de texto na parte inferior, NUNCA sobre o rosto.

**Revisor (Quality Gate):** ortografia das copies, dimensão das imagens vs placements, texto não cobre rosto.

**CHECKPOINT 3:** mostrar criativos. Aguardar aprovação.

### FASE 4, EXECUÇÃO (checkpoint final)

**MODO 1:** gerar os 3 arquivos em `07-meta-ads/` e apresentar o SETUP-CHECKLIST pro usuário executar na Ads Manager.

**MODO 2:** confirmação final, depois criar via API/MCP:
- Campanha → ad sets (targeting, budget) → upload de imagens → creatives (com `instagram_user_id`, NÃO `instagram_actor_id`) → ads
- Ad Set de engajamento: `destination_type: "ON_POST"`, `targeting_automation.advantage_audience: 0`
- Creative: `link_data` com message (NÃO photo_data)
- Interest IDs: buscar via `search?type=adinterest`, NUNCA usar IDs decorados
- Tudo com status **PAUSED**. Confirmar IDs criados ao usuário

---

## Regras Absolutas

1. **ORTOGRAFIA:** toda copy com acentos e cedilhas corretos. Sem exceção
2. **IMAGEM vs PLACEMENT:** 1:1 = só Feed. Stories/Reels = precisa 9:16
3. **INSTAGRAM:** sempre vincular `instagram_user_id` nos creatives (modo 2)
4. **STATUS:** tudo criado como PAUSED. O usuário ativa quando quiser
5. **NUNCA** travessão (—) em copies. Sempre vírgula
6. **CREDENCIAIS:** nunca gravar token em arquivo do projeto, nunca pedir token no chat com tela compartilhada
7. **BUDGET:** nunca sugerir mais do que o usuário declarou poder investir
