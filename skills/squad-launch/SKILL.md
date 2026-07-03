---
name: squad-launch
description: Orquestrador de lancamento de produtos. Use quando o usuario quer lancar um produto, ferramenta, mentoria ou servico. Coordena pesquisa de mercado, criacao de oferta, copy de vendas, estrategia de trafego e criativos de anuncio. Aciona na ordem certa: market-researcher, offer-creator, hormozi-squad, copy-squad, traffic-masters, creative-squad, k-dense-ai-market-research-reports.
---

# Squad Launch (Orquestrador de Lancamento)

Coordena todo o processo de lancamento de um produto, do estudo de mercado ate o criativo do anuncio. Voce nao precisa lembrar qual skill chamar, o orquestrador decide.

---

## Quando Usar

- "Quero lancar o Nova CRM"
- "Preciso preparar o lancamento da mentoria"
- "Vou vender o Zuvora como SaaS"
- "Monta a estrategia de lancamento completa"
- Qualquer cenario onde um produto/servico precisa ir ao mercado

---

## Skills e Squads Orquestrados

| Ordem | Skill/Squad | Funcao no Lancamento |
|---|---|---|
| 1 | `/market-researcher` | Pesquisa de mercado: TAM/SAM/SOM, concorrencia, avatar, dores, precos |
| 2 | `/k-dense-ai-market-research-reports` | (Opcional) Relatorio completo 50+ paginas estilo McKinsey |
| 3 | `/offer-creator` | Cria oferta irresistivel com metodologia S.C.A.L.E., stack de valor, bonus |
| 4 | `/hormozi-squad:create-offer` | Grand Slam Offer, precificacao, hooks de vendas |
| 5 | `/hormozi-squad:set-pricing` | Estrategia de preco (tiers, ancora, desconto) |
| 6 | `/copy-squad:write-landing-page` | Copy completa da landing page de vendas |
| 7 | `/copy-squad:write-vsl-script` | Script de video de vendas (VSL) |
| 8 | `/copy-squad:write-email-sequence` | Sequencia de e-mails (lancamento, carrinho aberto, urgencia) |
| 9 | `/traffic-masters:create-ad-strategy` | Estrategia de anuncios (Meta Ads, Google Ads) |
| 10 | `/traffic-masters:setup-tracking` | Pixel, conversoes, UTMs |
| 11 | `/traffic-masters:manage-budget` | Orcamento por fase de lancamento |
| 12 | `/creative-squad` | Criativos visuais para anuncios e redes sociais |

---

## Processo

### Fase 1: Inteligencia (Skills 1-2)

Pergunte ao usuario:
1. **O que esta lancando?** (produto, servico, mentoria, SaaS)
2. **Para quem?** (publico-alvo, se souber)
3. **Quanto quer cobrar?** (se ja tiver ideia)
4. **Prazo?** (data de lancamento)

Com essas respostas, acione:

```
/market-researcher
  -> Pesquisar: [produto] para [publico]
  -> Extrair: TAM/SAM/SOM, concorrentes, keywords, CAC/LTV
  -> Resultado: relatorio de mercado
```

Se o usuario pedir relatorio completo:
```
/k-dense-ai-market-research-reports
  -> Gerar relatorio 50+ paginas com frameworks estrategicos
```

### Fase 2: Oferta (Skills 3-5)

Use os dados da Fase 1 para criar a oferta:

```
/offer-creator
  -> Criar oferta com score S.C.A.L.E.
  -> Stack de valor, bonus, garantias
  -> Resultado: oferta pontuada e empacotada

/hormozi-squad:create-offer
  -> Refinar como Grand Slam Offer
  -> Hooks de vendas

/hormozi-squad:set-pricing
  -> Definir tiers de preco
  -> Ancora de valor, descontos estrategicos
```

### Fase 3: Copy (Skills 6-8)

Com a oferta pronta, gerar toda a copy:

```
/copy-squad:write-landing-page
  -> Landing page completa (hero, dor, solucao, prova, CTA)

/copy-squad:write-vsl-script
  -> Roteiro de video de vendas (3-15 min)

/copy-squad:write-email-sequence
  -> Sequencia: pre-lancamento, abertura, prova social, urgencia, fechamento
```

### Fase 4: Trafego (Skills 9-11)

```
/traffic-masters:create-ad-strategy
  -> Funil de anuncios (topo, meio, fundo)
  -> Publicos, segmentacoes, orcamento

/traffic-masters:setup-tracking
  -> Pixel Meta, Google Tag, UTMs

/traffic-masters:manage-budget
  -> Distribuicao por fase e canal
```

### Fase 5: Criativos (Skill 12)

```
/creative-squad
  -> Gerar criativos para anuncios (headline, CTA, pergunta)
  -> Manter consistencia visual
```

---

## Output Final

Ao final, o usuario recebe:
- [ ] Relatorio de mercado
- [ ] Oferta com score S.C.A.L.E.
- [ ] Precificacao definida
- [ ] Landing page (copy completa)
- [ ] Script VSL
- [ ] Sequencia de e-mails
- [ ] Estrategia de trafego
- [ ] Tracking configurado
- [ ] Orcamento distribuido
- [ ] Criativos prontos

> Tudo isso com um unico comando: `/squad-launch`
