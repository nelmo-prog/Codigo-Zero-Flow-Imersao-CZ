# 10 Bugs Comuns no Pipeline de Tracking + Fixes

> Aprendizado real da sessao 07/04/2026. Cada bug listado custou tempo significativo de debug. **LEIA ANTES de implementar pra nao perder horas.**

---

## Bug #1: CORS Preflight quebrando sendBeacon

### Sintoma
LP envia lead via `sendBeacon` mas nada chega no CRM. Console nao mostra erro (sendBeacon falha silenciosamente).

### Causa
```js
// LP enviando assim:
navigator.sendBeacon(url, new Blob([json], { type: 'application/json' }))
```
`Content-Type: application/json` nao eh um "simple request" CORS, dispara preflight `OPTIONS`. Se o endpoint nao responde com headers `Access-Control-Allow-*`, o preflight falha e o POST nunca acontece.

### Fix

**Cliente (LP)**: usar `text/plain`
```js
const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
navigator.sendBeacon(url, blob);
```

**Servidor (CRM)**: adicionar OPTIONS handler + CORS headers
```ts
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  // Aceita json OU text/plain
  const raw = await request.text();
  const body = JSON.parse(raw);
  // ...
  return NextResponse.json(result, { headers: CORS_HEADERS });
}
```

### Licao
Endpoints chamados via sendBeacon **sempre** devem aceitar `text/plain` no body e ter CORS liberado.

---

## Bug #2: Lead score 0 em leads de LP (frio)

### Sintoma
Leads que vem da LP entram com score 0 e status NEW, parecem leads frios apesar de terem mostrado intencao alta (foram pro checkout).

### Causa
Codigo padrao do webhook seta `status: "NEW", score: 0`. Mas quem preenche popup da LP **ja foi pro checkout** = intencao alta = nao deveria ser frio.

### Fix
```ts
const isLandingLead = source === "LANDING_PAGE";
const initialScore = isLandingLead ? 50 : 0;
const initialStatus = isLandingLead ? "QUALIFIED" : "NEW";
```

E no path de update (lead voltou), garantir piso:
```ts
const floor = isLp ? 50 : 0;
const baseline = Math.max(existing.score, floor);
const bumpedScore = Math.min(100, baseline + (isLp ? 10 : 0));
```

### Licao
Score inicial deve refletir a **acao real** do lead, nao "padrao = 0". Quem chega via popup -> checkout merece pelo menos 50.

---

## Bug #3: Plataforma de pagamento falha ao validar URL

### Sintoma
Ao ativar postback na Eduzz/Hotmart/Kiwify: "Nao foi possivel ativar a configuracao pois a URL cadastrada retornou erro ao receber os eventos."

### Causa
A plataforma valida a URL fazendo:
- `GET /webhook` (verificar se existe)
- `HEAD /webhook` (HTTP HEAD)
- `POST /webhook` com body vazio ou minimo

Se o seu endpoint so aceita POST com payload completo, todos esses falham.

### Fix
```ts
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "webhook/eduzz", status: "ready" },
    { status: 200, headers: CORS_HEADERS }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  // Verification ping: body vazio retorna 200
  if (!raw || raw.trim().length === 0) {
    return NextResponse.json(
      { ok: true, note: "verification_ping" },
      { status: 200, headers: CORS_HEADERS }
    );
  }
  // ... resto
}
```

### Licao
**Sempre retorne 2xx** pra requests de validacao. Webhooks de terceiros validam de forma imprevisivel (GET, HEAD, POST vazio, payload minimo). Trate todos como ping.

---

## Bug #4: Parser ignora envelope do webhook

### Sintoma
Webhook recebe postbacks (200 OK no painel da plataforma), mas nenhum lead eh atualizado. `body.buyer` retorna undefined apesar do JSON conter buyer.

### Causa
Plataformas como Eduzz envelopam o payload:
```json
{
  "id": "evt_xxx",
  "event": "myeduzz.invoice_opened",
  "data": {
    "id": "98623441",
    "status": "open",
    "buyer": { "name": "...", "email": "...", "cellphone": "..." },
    ...
  },
  "sentDate": "..."
}
```

Voce le `body.buyer.name` mas o buyer real esta em `body.data.buyer.name`.

### Fix
Detectar envelope automaticamente:
```ts
const rawBodyAny = body as Record<string, unknown>;
const hasEnvelope = rawBodyAny.event !== undefined && rawBodyAny.data !== undefined;
const bodyAny = hasEnvelope
  ? (rawBodyAny.data as Record<string, unknown>)
  : rawBodyAny;
const eventName = (rawBodyAny.event as string) || "";

const buyer = bodyAny.buyer || {};
// agora buyer eh acessivel
```

### Licao
**SEMPRE** logar `rawPayload` completo na primeira chamada de um webhook novo. Use uma `Activity` persistente no DB, NAO `console.log` (Vercel logs sao dificeis de ler).

```ts
// Debug helper
await prisma.activity.create({
  data: {
    type: "FORM_SUBMITTED",
    title: `[${PLATFORM} DEBUG] Postback recebido`,
    workspaceId,
    metadata: JSON.parse(JSON.stringify({
      rawPayload: body,
      rawString: raw.slice(0, 3000),
      contentType,
      keys: Object.keys(body),
    })),
  },
});
```

---

## Bug #5: OR do Prisma retornando lead errado

### Sintoma
Postback do webhook deveria atualizar o lead novo (criado pela LP), mas atualiza um lead antigo qualquer que tinha o mesmo email.

### Causa
```ts
// Codigo bugado
const lead = await prisma.lead.findFirst({
  where: {
    OR: [
      { whatsapp },
      { email },
    ],
  },
});
```

`OR` no Prisma **nao garante prioridade**. Se 2 leads matcham (um pelo whatsapp, outro pelo email), o Prisma pode retornar qualquer um.

### Fix
Queries sequenciais por prioridade:
```ts
let lead = whatsapp
  ? await prisma.lead.findFirst({
      where: { workspaceId, whatsapp },
      orderBy: { createdAt: "desc" },
    })
  : null;

if (!lead && whatsapp) {
  lead = await prisma.lead.findFirst({
    where: { workspaceId, phone: whatsapp },
    orderBy: { createdAt: "desc" },
  });
}

if (!lead && email) {
  lead = await prisma.lead.findFirst({
    where: { workspaceId, email },
    orderBy: { createdAt: "desc" },
  });
}
```

### Licao
**NUNCA** use OR do Prisma quando a ordem de match importa. Sempre faca queries separadas em sequencia.

---

## Bug #6: Workspace errado com `findFirst()` (CRITICO)

### Sintoma
Leads da LP entram no workspace A. Postbacks da plataforma criam/atualizam leads em workspace B (vazio/antigo). Os custom fields da plataforma aparecem em leads "fantasmas" que nao existem na UI.

### Causa
```ts
const workspace = await prisma.workspace.findFirst();
```

Sem orderBy, retorna o workspace mais antigo (criado primeiro). Se o app tem multiplos workspaces (legado, testes, produto), pega o errado.

### Fix
Resolver via webhookKey ativa:
```ts
const activeKey = await prisma.webhookKey.findFirst({
  where: { isActive: true },
  select: { workspaceId: true },
  orderBy: { createdAt: "desc" },
});

let workspace;
if (activeKey) {
  workspace = await prisma.workspace.findUnique({
    where: { id: activeKey.workspaceId },
  });
}

// Fallback
if (!workspace) {
  workspace = await prisma.workspace.findFirst({
    orderBy: { createdAt: "desc" },
  });
}
```

### Licao
Em apps multi-workspace, **NUNCA** use `findFirst()` sem orderBy ou filtro explicito. Sempre resolva o workspace via algum identificador confiavel (webhookKey, authenticated user, tenant ID).

---

## Bug #7: Regex `\b` (word boundary) nao matcha com underscore

### Sintoma
Status `myeduzz.invoice_opened` chega no webhook, mas a classificacao falha. Score nao sobe, CAPI nao dispara.

### Causa
```ts
const isPending = /\bopened\b/i.test("myeduzz.invoice_opened"); // false!
```

`\b` em regex marca transicao entre word char e non-word char. **Underscore `_` eh word char**. Entao `\bopened\b` precisa de fronteira antes do "o", mas o caractere anterior eh `_` (word char). Sem fronteira -> sem match.

### Fix
Usar substring includes() ou regex sem boundaries:
```ts
const has = (s: string) => status.includes(s);
const isPending = has("opened") || has("waiting_payment") || has("recovering");
```

Ou regex customizado tratando `_` e `.` como separadores:
```ts
const isPending = /(^|[._])(opened|pending|waiting)([._]|$)/i.test(status);
```

### Licao
**Underscore eh word char em regex.** Se voce precisa match palavra em strings com underscores (`event_name`, `field_id`, etc), use `includes()` ou regex customizado.

---

## Bug #8: customFields sobrescritos com null/zero

### Sintoma
Lead tem `eduzzAmount: 414` apos `invoice_opened`. Depois chega `cart_abandonment`, e o `eduzzAmount` vira `0`. Dado perdido.

### Causa
Webhooks da mesma plataforma podem ter shapes diferentes por evento. `cart_abandonment` nao traz amount/productName, entao vem null. O codigo:
```ts
customFields: {
  ...existing,
  eduzzAmount: amount, // 0
  eduzzProductName: productName, // null
}
```
Sobrescreve os valores ja gravados.

### Fix
Helper que so atualiza se vier valor:
```ts
const onlyIfSet = <T>(key: string, val: T): Record<string, T> | Record<string, never> =>
  val !== null && val !== undefined && val !== "" && val !== 0
    ? { [key]: val } as Record<string, T>
    : {};

customFields: {
  ...existing,
  eduzzLastStatus: status, // sempre atualiza
  eduzzLastUpdate: new Date().toISOString(),
  ...onlyIfSet("eduzzTransactionId", transactionId),
  ...(amount > 0 ? { eduzzAmount: amount } : {}),
  ...onlyIfSet("eduzzProductName", productName),
}
```

### Licao
**Nunca sobrescreva campos agregados sem checar se o novo valor eh util.** Webhooks de mesma origem podem ter shapes diferentes por evento.

---

## Bug #9: Cleanup destrutivo sem confirmacao

### Sintoma
Voce roda um endpoint admin pra limpar "lixo" e deleta 100+ registros que eram dados reais.

### Causa
Endpoint admin executou `deleteMany` direto sem mostrar antes o que ia ser afetado.

### Fix
Sempre fazer 2 etapas:
```ts
// Endpoint pode ter ?dry=1 pra preview
const dry = request.nextUrl.searchParams.get("dry") === "1";

const targets = await prisma.lead.findMany({
  where: { /* condicoes */ },
  select: { id: true, firstName: true, email: true },
});

if (dry) {
  return NextResponse.json({
    preview: true,
    wouldDelete: targets.length,
    examples: targets.slice(0, 10),
  });
}

// Sem dry: requer confirmacao explicita
const confirmCode = request.nextUrl.searchParams.get("confirm");
if (confirmCode !== `delete_${targets.length}`) {
  return NextResponse.json({
    error: "needs_confirmation",
    message: `Pass ?confirm=delete_${targets.length} to proceed`,
  }, { status: 400 });
}

// So entao deleta
await prisma.lead.deleteMany({ /* condicoes */ });
```

### Licao
**Endpoints destrutivos** devem exigir confirmacao em duas etapas. **Nao tome decisao sozinho** de deletar dados sem mostrar pro usuario o que vai ser afetado.

---

## Bug #10: CRLF/LF warnings no git Windows

### Sintoma
Cada commit no Windows aparece:
```
warning: in the working copy of '...', LF will be replaced by CRLF the next time Git touches it
```

### Causa
Windows usa CRLF como line ending, Linux/Vercel/git usam LF. Git esta configurado pra converter automaticamente.

### Impacto
**Nenhum funcional**, so warnings irritantes.

### Fix opcional
Criar `.gitattributes` na raiz:
```
* text=auto eol=lf
*.{cmd,bat,ps1} text eol=crlf
```

Ou ignorar os warnings.

### Licao
Se trabalhar em Windows com projetos JS/TS deployados em Linux, espere ver esse warning. Eh inofensivo.

---

## Resumo: checklist anti-bugs antes de subir pra producao

- [ ] Webhook tem OPTIONS handler com CORS
- [ ] Aceita text/plain alem de application/json
- [ ] GET/HEAD retornam 200 (validation ping)
- [ ] POST com body vazio retorna 200
- [ ] Score inicial diferenciado por origem (LP -> 50)
- [ ] Piso de score no update (re-submits nao rebaixam)
- [ ] Match prioriza whatsapp > phone > email (queries sequenciais)
- [ ] Workspace resolvido via webhookKey/auth (nao findFirst)
- [ ] Parser detecta envelope da plataforma
- [ ] Status check usa includes() ou regex sem `\b`
- [ ] customFields usa `onlyIfSet` helper
- [ ] Debug Activity grava rawPayload sempre
- [ ] CAPI tem `event_id` pra dedup
- [ ] PII hasheado SHA256 antes de enviar pro Meta
- [ ] Telefone normalizado (55+DDD sem zero)
- [ ] Endpoints destrutivos exigem confirmacao
