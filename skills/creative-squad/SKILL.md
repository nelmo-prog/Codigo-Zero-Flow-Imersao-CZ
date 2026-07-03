---
name: creative-squad
description: "Squad de criação de criativos com IA. Fase 5 do Código ZERO Flow. Gera imagens profissionais com consistência de personagem via fotos de referência do usuário. 2 modos: geração direta via API (Gemini Nano Banana Pro/Flash ou OpenAI GPT Image) ou modo manual gratuito (entrega prompts prontos, usuário gera no app do Gemini/ChatGPT e sobe as imagens). Actions: criar, gerar, extrair, batch, prompts. Topics: criativo, imagem, Instagram, Story, feed, CTA, headline, quote, referência, cenário, overlay, moodboard."
---

# Creative Squad, Gerador de Criativos com IA

Cria os assets visuais do lançamento com consistência de personagem (o rosto do usuário, sempre o mesmo, em cenários variados).

**Fase 5 do Código ZERO Flow.** Consome (cadeia alimentar): `02-avatar/RESUMO-SCALE.md` + `LINGUAGEM-CRUA.md`, `04-oferta/OFERTA-COMPLETA.md`. Gera em `05-criativos/`: `MOODBOARD.md`, `PROMPTS-IMAGENS.md`, `TEMPLATES-POSTS.md`, `SCRIPTS-REELS.md`, `HEADLINES-CTAS.md` e (opcional) as imagens em `05-criativos/imagens/`.

---

## Os 2 modos (perguntar ANTES de gerar qualquer imagem)

### MODO A, Geração direta via API
Se o usuário tem chave de API:
- **Gemini** (`GEMINI_API_KEY`): Nano Banana Pro `gemini-3-pro-image-preview` (melhor qualidade, ~$0.13/img) ou Flash `gemini-3.1-flash-image-preview` (~$0.045/img). Dá pra criar chave em https://aistudio.google.com (tem camada gratuita)
- **OpenAI** (`OPENAI_API_KEY`): GPT Image (exige cartão cadastrado)
Gerar as imagens direto e salvar em `lancamentos/{projeto}/05-criativos/imagens/`, organizadas por categoria (`01-hero/`, `02-processo/`, `03-provas/`, `04-ads/`).

### MODO B, Manual gratuito (padrão pra quem não tem chave)
1. Gerar `PROMPTS-IMAGENS.md` com 15-25 prompts COMPLETOS e numerados (cenário, roupa, pose, iluminação, formato, instrução de anexar a foto de referência)
2. Instruir o usuário: abrir o app/site do Gemini ou do ChatGPT (versão gratuita serve), anexar a foto de referência, colar o prompt, baixar a imagem
3. Usuário salva as imagens em `lancamentos/{projeto}/05-criativos/imagens/` com o número do prompt no nome (ex: `07-escritorio-camisa-azul.jpg`)
4. As fases 6 (LP) e 7 (Meta Ads) vão consumir essa pasta

Em AMBOS os modos: pedir 3-5 fotos de referência nítidas do usuário e salvar em `05-criativos/referencias/` antes de qualquer geração.

---

## Tipos de criativo

| Tipo | Descrição |
|---|---|
| `hero` | Foto principal da LP (retrato profissional, olhar pra câmera) |
| `pergunta` | Caixa pergunta + resposta estilo IG Story |
| `headline` | Frase de impacto com fundo escuro semi-transparente |
| `cta` | Botão call-to-action na parte inferior |
| `quote` | Citação com aspas estilizadas |
| `prova` | Cenário de resultado/bastidor (mesa de trabalho, tela, processo) |
| `clean` | Só a foto, sem overlay (base pra ads) |

## Fluxo de execução

1. **Entender o pedido:** quantos criativos, tipos, formatos (story 9:16, feed 4:5, square 1:1), fonte de conteúdo (LP, oferta, texto)
2. **Extrair conteúdo:** da OFERTA-COMPLETA.md e da LINGUAGEM-CRUA.md. Perguntas e headlines na perspectiva do LEAD, mirando dores ocultas reais, não perguntas retóricas de copy
3. **Moodboard primeiro:** paleta, tipografia e direção visual em `MOODBOARD.md`, aprovar com o usuário
4. **Gerar (modo A) ou entregar prompts (modo B)**
5. **Conferir:** mostrar tabela do que foi gerado/pendente antes de encerrar

## Regras

- SEMPRE variar cenário e cor de roupa entre criativos, MANTENDO o âncora de consistência (mesmo rosto, mesmos acessórios característicos do usuário)
- Texto de overlay NUNCA sobre o rosto
- Confirmar com o usuário antes de batch grande (custo em modo A)
- Ortografia PT-BR impecável em qualquer texto de imagem, NUNCA travessão (—)
- Formato 1:1 pra Feed, 9:16 pra Stories/Reels, 4:5 pra feed retrato
