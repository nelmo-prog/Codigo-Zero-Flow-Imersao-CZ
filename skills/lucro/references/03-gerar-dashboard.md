# Gerador de Dashboard Visual L.U.C.R.O.

## Sua Função
Transformar o diagnóstico L.U.C.R.O. (output do motor 01) em um arquivo HTML visual premium. O arquivo é self-contained (single-file), abre no navegador e pode ser salvo como PDF via Ctrl+P.

## Quando Executar
Automaticamente após o motor LUCRO (01) gerar o diagnóstico completo. O participante NÃO precisa pedir, o dashboard é gerado como etapa final do fluxo.

## O Que Fazer

1. Ler o template base em `dashboard-lucro.html` (na pasta do projeto LUCRO)
2. Substituir TODOS os dados hardcoded pelos dados reais do diagnóstico que acabou de ser gerado
3. Salvar como `diagnostico-[nome-do-negocio].html` na pasta atual do usuário
4. Apresentar o resultado com caminho completo e link clicável

## Dados Para Substituir no Template

Substituir cada dado no HTML:

### Header
- Nome do negócio (substituir "A Nova Inteligência (Nelmo Ricalde)")
- Data (substituir "26/03/2026" pela data atual)
- Score total (substituir "7.8")

### Radar Chart (SVG)
- Recalcular as coordenadas dos 5 pontos do pentágono baseado nos novos scores L.U.C.R.O.
- Fórmula: para cada eixo, distância = (score/10) * 120 pixels a partir do centro (190,170)
- Ângulos: L = -90°, U = -18°, C = 54°, R = 126°, O = 198°

### Gauge
- Recalcular o ângulo do arco baseado no score total
- Fórmula: ângulo = 180 * (score/10) graus, começando da esquerda

### Cards Executivos
- Substituir textos, scores e cores de cada card
- Cores: score >= 8 = success (verde), 6-7.9 = warning (amarelo), < 6 = danger (vermelho)

### Barras de Dores
- Substituir os 5 itens com textos e scores reais
- Width da barra = score * 10 em percentual

### Tabela de Confronto
- Substituir cada linha com hipótese, realidade e status
- Status: "Confirmado" = verde, "Parcial" = amarelo, "Divergente" = vermelho

### Oportunidades
- Substituir os 5 cards com dados reais
- Badges: score >= 8.5 = "EXECUTE HOJE" verde, 7-8.4 = "EXECUTE AGORA" verde, 5-6.9 = "COM AJUSTES" amarelo, < 5 = "NÃO É HORA" vermelho

### Plano de Ação
- Substituir os itens de 72h, 7d, 30d

### ICP
- Substituir as linhas da tabela comparativa

### Blocos de Análise (MAIS IMPORTANTE)
REGRA ABSOLUTA: incluir TODO o conteúdo analítico do diagnóstico. NUNCA resumir, NUNCA cortar parágrafos, NUNCA fazer "versão enxuta". Cada bloco de análise deve conter:

- **Veredicto Executivo:** parágrafo completo explicando o estado do negócio
- **Urgências Ocultas:** cada urgência com explicação detalhada do porquê e o que fazer
- **Mapa de Tensão Comercial:** cada par dor-objeção com tipo e estratégia de destravamento
- **Análise do Confronto:** cada hipótese com o que os sinais mostram e insight acionável
- **Gap de Oferta:** diagrama do funil completo + projeção de receita com números
- **Análise de Executabilidade:** cada oportunidade com justificativa do score e veredicto
- **Direção de Comunicação:** ângulos vencedores com headlines sugeridas + narrativa comercial
- **Direção de Oferta:** promessa, mecanismo, ângulo, headline, posicionamento, ticket
- **Veredicto ICP:** análise completa do público misturado com ações de filtragem
- **Plano de Ação:** todos os itens de 72h, 7d e 30d com detalhamento

O dashboard NÃO é um resumo visual. É o diagnóstico COMPLETO apresentado de forma visualmente agradável. Se o conteúdo analítico do motor tinha 10 parágrafos numa seção, o dashboard precisa ter os mesmos 10 parágrafos.

### Footer
- Atualizar nome do negócio e data

## Apresentação Final (OBRIGATÓRIO)

Após salvar o arquivo, exibir no terminal EXATAMENTE neste formato:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  DIAGNÓSTICO L.U.C.R.O. COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📊  Score Total: X.X/10

  📄  Dashboard visual salvo em:
      [CAMINHO COMPLETO DO ARQUIVO]

  🔗  Abra no navegador:
      file:///[CAMINHO COMPLETO COM BARRAS NORMAIS]

  💡  Para salvar como PDF:
      Abra o link acima → Ctrl+P → "Salvar como PDF"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Regras Críticas
1. O CAMINHO COMPLETO deve usar a pasta atual onde o Claude Code está rodando
2. O link file:/// deve usar barras normais (/) não invertidas (\)
3. O nome do arquivo deve ser slugificado: "Casa das Cordas" → "diagnostico-casa-das-cordas.html"
4. NUNCA usar travessão/dash (—) no meio de frases nos textos analíticos
5. Manter todos os acentos e cedilhas corretos em português
6. O HTML gerado deve ser 100% self-contained (zero dependências externas além do Google Fonts)
7. Se o template base não estiver disponível, gerar o HTML completo do zero seguindo o mesmo design system (dark cyberpunk, #0A0A0F, cyan #00D4FF, Inter font)
