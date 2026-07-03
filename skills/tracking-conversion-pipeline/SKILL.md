---
name: tracking-conversion-pipeline
description: Implementa o fluxo completo LP -> CRM -> Plataforma de pagamento -> Meta Pixel + Conversions API + Google Ads Offline Conversions (via gclid) com lead scoring, deduplicacao, custom fields e protecao contra os 10+ bugs comuns. Use quando precisar integrar qualquer landing page com qualquer CRM (Nova CRM, HubSpot, RD, Pipedrive, etc) e disparar eventos pro Meta (Facebook/Instagram Ads) via pixel browser + CAPI server-side E pro Google Ads via uploadClickConversions. Tambem cobre integracao com Eduzz, Hotmart, Kiwify, Stripe, Lastlink, Cakto, Greenn.
---

# Tracking Conversion Pipeline

Skill que implementa o **fluxo completo de tracking de conversao** que aprendi na sessao 07/04/2026 integrando a LP do Codigo Zero ao Nova CRM, Eduzz e Meta CAPI. Inclui templates prontos, regras de score, formato dos webhooks, e os 10 bugs que aconteceram com seus respectivos fixes.

**Use esta skill quando o usuario pedir:**
- "Integra essa LP com o CRM"
- "Configura o Meta Pixel + CAPI"
- "Conecta a Eduzz/Hotmart/Kiwify ao CRM"
- "Implementa lead scoring"
- "Faz captura de lead com sendBeacon"
- "Recebe postback de compra"
- "Dispara evento de conversao server-side"

## Arquitetura padrao

```
LP (qualquer) -> captura gclid (Google) + fbp/fbc (Meta) em cookies
              -> popup/form -> CRM webhook -> lead criado (score X, com gclid/fbp/fbc)
              -> redireciona pro checkout (Eduzz/Hotmart/etc)
                 -> cliente paga ou abandona
                    -> plataforma manda postback -> CRM webhook eduzz
                       -> match lead por whatsapp > phone > email
                       -> grava custom fields, atualiza score/status
                       -> dispara CAPI Meta (AddPaymentInfo / Purchase)
                       -> dispara Google Ads uploadClickConversions (se gclid)
```

## Etapas obrigatorias

### Etapa 1: Coletar contexto

Antes de implementar, pergunte:

1. **LP**: qual URL? Hospedada onde (WP, Vercel, Netlify, custom)? Tem popup ja? Quais campos captura?
2. **CRM**: qual sistema? Tem webhook endpoint? Qual a URL? Tem auth (key, bearer)? Schema do lead (campos disponiveis)?
3. **Plataforma de pagamento**: Eduzz / Hotmart / Kiwify / Stripe / Cakto / Greenn / Lastlink? Qual conta? Acesso ao painel de webhooks?
4. **Meta Pixel**: ID do pixel? Tem CAPI Token? Eventos ja configurados?
5. **Onde hospedar o endpoint**: Vercel? VPS? Cloud Run? Tem auth/secret?

Se faltar qualquer item, **pare e pergunte antes de continuar**.

### Etapa 2: Implementar o webhook do CRM (recebe leads da LP)

Use o template `templates/webhook-leads-route.ts` como base. **Nao esqueca**:

- ✅ **OPTIONS handler com CORS** (preflight)
- ✅ **Aceitar text/plain** (sendBeacon)
- ✅ **Score inicial 50 + status QUALIFIED** pra leads de LP (eles ja foram pro checkout)
- ✅ **Piso de 50** no update (re-submits nao podem rebaixar)
- ✅ **Dedup por whatsapp/email**
- ✅ **Resolver workspace via authentication/key**, NUNCA `findFirst()` sem orderBy

### Etapa 3a: Implementar o helper Google Ads Offline Conversions (se houver Google Ads)

Use `templates/google-ads-capi.ts` (REST puro, sem dependencia google-ads-api npm).

**Quando usar**: sempre que o cliente rodar Google Ads E o checkout NAO tiver thank-you page no dominio proprio (Eduzz, Hotmart, Kiwify hospedados). Sem thank-you propria, gtag puro nao funciona, precisa de Offline Conversion Import via gclid.

**Pre-requisitos no Google Ads**:
1. Conversion action criada do tipo `UPLOAD_CLICKS` (NAO `WEBPAGE`)
2. Category `PURCHASE`, count `ONE_PER_CLICK`, click-through window 30d
3. Resource name no formato `customers/{id}/conversionActions/{actionId}`

**Criar conversion action via API** (idempotente): use `templates/create-google-conversion-action.ts` desta skill como template. ATENCAO: campo `include_in_conversions_metric` e IMMUTABLE no create, NAO incluir.

**Pontos criticos do helper**:
- ✅ **OAuth refresh token** com cache de access token (expira em 1h)
- ✅ **Header `developer-token`** obrigatorio
- ✅ **Header `login-customer-id`** = MCC sem hifen (ex: `1234567890`)
- ✅ **`customer_id`** = conta filha sem hifen (ex: `9876543210`)
- ✅ **`conversionDateTime`** no formato `yyyy-MM-dd HH:mm:ss-03:00` (com offset GMT, NAO ISO 8601)
- ✅ **`partialFailure: true`** no payload pra Google aceitar request mesmo se 1 conversao falhar
- ✅ **Tratar `partialFailureError`** na resposta (pode vir 200 OK com erro embutido)
- ✅ **NAO throwa em erro de validacao Google** (loga e retorna `{ok: false}`)
- ✅ **Throwa SO em erro de configuracao** (env vars ausentes)

**Variaveis de ambiente**:
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` (MCC sem hifen)
- `GOOGLE_ADS_CUSTOMER_ID` (conta filha sem hifen)
- `GOOGLE_ADS_CONVERSION_ACTION_<NOME>` (resource name completo, ex: `customers/9876543210/conversionActions/1122334455`)

### Etapa 3: Implementar o helper Meta CAPI

Use `templates/meta-capi.ts`. **Pontos criticos**:

- ✅ **SHA256 hash de todos PII** (email, phone, nome, cidade, estado, pais, CEP)
- ✅ **Normalizar telefone antes de hashear** (formato E.164: 55 + DDD sem zero)
- ✅ **Lowercase + trim antes de hashear** (Meta exige)
- ✅ **`event_id` em todos os eventos** pra deduplicacao com pixel browser
- ✅ **Suporte a `test_event_code`** pra debugar no Meta Test Events
- ✅ **client_ip_address e client_user_agent** sempre que possivel
- ✅ Variaveis de ambiente: `META_PIXEL_ID`, `META_CAPI_TOKEN`

### Etapa 4: Implementar o webhook da plataforma de pagamento

**IMPORTANTE**: Quando o cliente roda Google Ads, no branch `isPaid` do webhook, APOS disparar `sendCapiEvent` (Meta Purchase), tambem disparar `uploadClickConversion` (Google Ads):

```ts
const gclid = (leadCf.gclid as string) || undefined;
const conversionAction = process.env.GOOGLE_ADS_CONVERSION_ACTION_<NOME>;
if (gclid && conversionAction) {
  try {
    await uploadClickConversion({
      gclid,
      conversionAction,
      conversionDateTime: new Date(),
      conversionValue: amount,
      currencyCode: currency,
      orderId: transactionId,
    });
  } catch (err) {
    console.error("[google-ads-capi] erro inesperado:", err);
  }
}
```

Try/catch independente do Meta CAPI: se Google falhar, Meta nao deve quebrar.



Use o template apropriado:
- **Eduzz**: `templates/webhook-eduzz-route.ts`
- **Hotmart**: `templates/webhook-hotmart-route.ts` (similar mas formato diferente)
- **Kiwify**: `templates/webhook-kiwify-route.ts`
- **Stripe**: `templates/webhook-stripe-route.ts` (com signature validation)

**Pontos criticos universais**:

- ✅ **GET/HEAD handlers retornam 200** (plataforma valida URL)
- ✅ **POST com body vazio retorna 200** (verification ping)
- ✅ **Detectar e desembrulhar envelope** (Eduzz: `{event, data}`, Hotmart: `{event, data}`)
- ✅ **Match lead prioriza whatsapp > phone > email**, NUNCA OR do Prisma
- ✅ **Workspace correto** via webhookKey ativa
- ✅ **`onlyIfSet` helper** pra nao sobrescrever customFields com null/zero
- ✅ **Substring checks** no status, NAO regex com `\b` (underscore quebra)
- ✅ **Debug Activity sempre** com rawPayload pra inspecao futura
- ✅ **Disparar CAPI** com `event_id = "{plataforma}_{transactionId}"`

### Etapa 5: Modificar a LP pra capturar lead

Use `templates/lp-capture-snippet.js`. **Inclua**:

- ✅ **sendBeacon com Blob text/plain** (evita CORS preflight)
- ✅ **Normalizar telefone no cliente** (55 + DDD sem zero)
- ✅ **Delay 150ms antes de redirect** pra garantir envio
- ✅ **Custom fields com plano, origem, lpUrl**
- ✅ **Capture phase nos event listeners** (`addEventListener(..., true)`)
- ✅ **fbq.track + capi parallel** com `event_id` sincronizado pra dedup
- ✅ **Captura gclid (Google Ads)**: ler `?gclid=` da URL, persistir em cookie 90 dias (`cz_gclid` ou similar), ler do cookie no submit, enviar em `customFields.gclid`. Sem isso o uploadClickConversions nao tem como atribuir a venda ao clique de anuncio.

### Etapa 6: Configurar plataforma de pagamento

1. **Eduzz**: Developer Hub -> Webhooks -> Nova configuracao
2. **Hotmart**: Ferramentas -> Webhook
3. **Kiwify**: Apps -> Webhooks
4. **Stripe**: Dashboard -> Developers -> Webhooks

URL pro endpoint criado na etapa 4 + querystring com secret.

**Eventos a habilitar (Eduzz)**:
- `myeduzz.invoice_opened`
- `myeduzz.invoice_waiting_payment`
- `myeduzz.invoice_paid` ← essencial
- `myeduzz.invoice_canceled`
- `myeduzz.invoice_expired`
- `myeduzz.invoice_refunded`
- `myeduzz.invoice_chargeback`
- `myeduzz.invoice_recovering`
- `myeduzz.invoice_negotiated`
- `myeduzz.invoice_waiting_refund`
- `sun.cart_abandonment` (Checkout Sun)

### Etapa 7: Configurar env vars

Adicione no Vercel/host:
- `META_PIXEL_ID`
- `META_CAPI_TOKEN`
- `<PLATAFORMA>_WEBHOOK_SECRET` (ex: `EDUZZ_WEBHOOK_SECRET`, `HOTMART_WEBHOOK_SECRET`)
- `ADMIN_SECRET` (opcional, pra endpoints admin)

Se houver Google Ads (offline conversions via gclid):
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` (MCC sem hifen)
- `GOOGLE_ADS_CUSTOMER_ID` (conta filha sem hifen)
- `GOOGLE_ADS_CONVERSION_ACTION_<NOME>` (resource name completo)

Pra setar via API REST sem CLI (se nao tiver vercel cli logado), use `templates/setup-vercel-env.sh` com um token gerado em https://vercel.com/account/tokens.

Comando Vercel CLI: `vercel env add VARIAVEL` ou via REST API (ver `templates/vercel-env-setup.sh`).

### Etapa 8: Testar end-to-end

1. **Endpoint de leads** com payload teste:
   ```bash
   curl -X POST "https://CRM/api/webhooks/leads?key=KEY" \
     -H "Content-Type: text/plain" \
     -d '{"firstName":"Teste","whatsapp":"5551999999999","source":"LANDING_PAGE"}'
   ```

2. **Webhook da plataforma** simulando envelope real (ver `templates/test-payloads/`).

3. **CAPI** com `test_event_code` pra ver no Meta Test Events.

4. **Fluxo completo**: abrir LP em aba anonima, preencher popup, gerar pix/checkout, conferir lead no CRM com scores e custom fields.

## Regras de Lead Score (sugestao padrao)

| Score | Status | Origem |
|---|---|---|
| 0 | NEW | Manual sem interacao |
| 50 | QUALIFIED | LP popup submitido (foi pro checkout) |
| 60-70 | QUALIFIED | Re-submits da LP (+10 cada, teto 100) |
| 75 | QUALIFIED | Plataforma: invoice_opened/waiting_payment (gerou Pix) |
| 100 | QUALIFIED | Plataforma: invoice_negotiated/recovering |
| 150 | CONVERTED | Plataforma: invoice_paid (compra aprovada) |
| -10 | LOST | Plataforma: refunded/chargeback (apos paid) |

## Custom fields padronizados

Sempre prefixe com a origem (ex: `eduzzAmount`, `hotmartTransactionId`). Evita conflito.

**Da LP**:
- `lpUrl`, `plano`, `origem`, `utm_source`, `utm_medium`, `utm_campaign`

**Da plataforma de pagamento**:
- `<plat>LastStatus`, `<plat>TransactionId`, `<plat>ProductName`, `<plat>ProductId`, `<plat>Amount`, `<plat>Currency`, `<plat>PaymentMethod`, `<plat>CheckoutUrl`, `<plat>SaleRecoveryUrl`, `<plat>City`, `<plat>State`, `<plat>Country`, `<plat>ZipCode`, `<plat>LastUpdate`, `<plat>PaidAt`, `<plat>AbandonedAt`

## Os 10 bugs comuns (LEIA ANTES DE COMECAR!)

Veja `BUGS-COMUNS.md` na pasta da skill pra detalhes de cada um:

1. **CORS preflight** quebrando sendBeacon -> usar text/plain + OPTIONS handler
2. **Score 0 em leads de LP** -> piso 50 obrigatorio
3. **Plataforma falha ao validar URL** -> GET/HEAD/POST vazio retorna 200
4. **Parser ignora envelope** -> sempre logar rawPayload primeiro
5. **OR do Prisma retorna lead errado** -> queries sequenciais por prioridade
6. **Workspace errado** com `findFirst()` -> resolver via webhookKey/auth
7. **Regex `\b` nao matcha com underscore** -> usar includes() ou `(^|[._])X([._]|$)`
8. **customFields sobrescritos com null** -> helper `onlyIfSet`
9. **Cleanup destrutivo sem confirmacao** -> sempre preview antes
10. **CRLF/LF warnings** no git Windows -> ignorar ou `.gitattributes`
11. **Google Ads `include_in_conversions_metric` IMMUTABLE no create** -> nao incluir no payload de criacao da conversion action, so update
12. **Google Ads MAXIMIZE_CONVERSIONS sem conversion action ativa** -> erro/queima budget. SEMPRE criar conversion action ANTES da campanha
13. **Google Ads `conversionDateTime` em ISO 8601** -> nao funciona, formato exigido e `yyyy-MM-dd HH:mm:ss-03:00` (com offset literal)
14. **Google Ads `login-customer-id` com hifen** -> rejeitado, sempre sem hifen (ex: `1234567890` nao `123-456-7890`)
15. **gclid perdido entre LP e Eduzz** -> obrigatorio cookie 90d na LP, plataformas de pagamento NAO propagam gclid pra postback. Match e feito via lead no CRM (gclid persistido na LP -> CRM -> webhook lookup)

## Templates disponiveis

Na pasta `templates/` desta skill (ver arquivos individuais):

- `webhook-leads-route.ts` — webhook generico de captura de lead (CRM)
- `meta-capi.ts` — helper Meta Conversions API
- `google-ads-capi.ts` — helper Google Ads Offline Conversions (REST puro, sem dependencia)
- `create-google-conversion-action.ts` — script pra criar conversion action UPLOAD_CLICKS via API
- `webhook-eduzz-route.ts` — webhook completo da Eduzz (com Meta + Google dispatch)
- `lp-capture-snippet.js` — JS pra LP capturar lead via sendBeacon (com gclid + fbp/fbc)
- `vercel-env-setup.sh` — script bash pra setar env vars via REST API
- `test-payloads/` — payloads reais pra testar (Eduzz envelope, Hotmart, etc)

## Exemplos de uso

### Caso 1: Nova LP do projeto X integrada ao Nova CRM
1. Usar webhookKey existente do Nova CRM ou criar nova
2. Aplicar `lp-capture-snippet.js` na LP nova
3. Criar custom fields especificos do produto X
4. Eventos Meta: PageView, ViewContent, Lead, InitiateCheckout, AddPaymentInfo, Purchase

### Caso 2: LP nova com CRM novo (HubSpot/RD/etc)
1. Implementar webhook adapter no CRM novo (mesmo padrao)
2. Adaptar score rules pro CRM destino
3. Resto do fluxo identico

### Caso 3: Migrar de Eduzz pra Hotmart
1. Criar webhook Hotmart (template ja pronto)
2. Manter o mesmo CRM e Meta CAPI
3. Custom fields prefixados `hotmartX` em vez de `eduzzX`

## Checklist final

Apos implementar, garanta que:

- [ ] LP envia lead pro CRM (testado em aba anonima)
- [ ] Lead aparece com score 50 + status QUALIFIED + customFields da LP
- [ ] Plataforma de pagamento aceita o webhook (status verde no painel)
- [ ] Postback de checkout iniciado atualiza o lead pra score 75 + activity
- [ ] CAPI dispara AddPaymentInfo (visivel no Test Events com test_event_code)
- [ ] Compra real -> lead vira CONVERTED + score 150
- [ ] CAPI dispara Purchase com event_id deduplication
- [ ] Custom fields completos (todos campos `<plat>X`)
- [ ] Meta Events Manager mostra eventos vindo de "Server" (CAPI) + "Browser" (pixel)
- [ ] (Se Google Ads) gclid capturado em cookie 90d e enviado em customFields
- [ ] (Se Google Ads) conversion action UPLOAD_CLICKS criada e ativa
- [ ] (Se Google Ads) log `[google-ads-capi] conversao enviada` no servidor
- [ ] (Se Google Ads) conversao aparece no painel em ate 6h apos compra real
- [ ] (Se Google Ads) campanha MAXIMIZE_CONVERSIONS so criada DEPOIS da conversion action ja registrar 1 conversao real

## Templates desta skill

- `templates/lp-capture-snippet.js`: snippet de captura pra LP (troque `SEU_PIXEL_ID_AQUI` pelo ID do seu pixel)
- `templates/create-google-conversion-action.ts`: cria conversion action via API (credenciais via variaveis de ambiente `GOOGLE_ADS_*`)
