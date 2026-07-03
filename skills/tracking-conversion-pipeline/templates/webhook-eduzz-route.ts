/**
 * Webhook Eduzz - TEMPLATE COMPLETO PRONTO PRA COPY-PASTE
 *
 * Recebe eventos da Eduzz (envelope { id, event, data, sentDate }):
 * - myeduzz.invoice_opened / waiting_payment / paid / canceled / refunded / expired / chargeback
 * - sun.cart_abandonment
 *
 * Path: src/app/api/webhooks/eduzz/route.ts
 *
 * Configurar:
 * - EDUZZ_WEBHOOK_SECRET no env var
 * - URL no Eduzz Developer Hub: https://SEU-DOMINIO/api/webhooks/eduzz?secret=XXX
 *
 * IMPORTANTE: ler BUGS-COMUNS.md antes de modificar.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCapiEvent } from "@/lib/integrations/meta-capi";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// CRITICO: Eduzz valida URL com GET/HEAD antes de ativar
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "webhooks/eduzz", status: "ready" },
    { status: 200, headers: CORS }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!d) return null;
  if (!/^55/.test(d)) d = "55" + d;
  d = d.replace(/^550/, "55");
  return d;
}

interface EduzzEnvelope {
  id?: string;
  event?: string;
  sentDate?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  let body: EduzzEnvelope = {};

  const contentType = request.headers.get("content-type") || "";
  if (raw.trim().length > 0) {
    try {
      if (contentType.includes("json") || raw.trim().startsWith("{")) {
        body = JSON.parse(raw);
      } else {
        body = Object.fromEntries(new URLSearchParams(raw)) as EduzzEnvelope;
      }
    } catch {
      // Verification ping com body invalido: retorna 200
      return NextResponse.json(
        { ok: true, note: "invalid_body_accepted_for_verification" },
        { status: 200, headers: CORS }
      );
    }
  }

  // Validacao do secret
  const expectedSecret = process.env.EDUZZ_WEBHOOK_SECRET;
  const providedSecret = request.nextUrl.searchParams.get("secret");
  if (expectedSecret && providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "invalid_secret" }, { status: 401, headers: CORS });
  }

  // Verification ping (sem body): retorna 200
  if (!raw || raw.trim().length === 0 || Object.keys(body).length === 0) {
    return NextResponse.json(
      { ok: true, note: "verification_ping" },
      { status: 200, headers: CORS }
    );
  }

  // CRITICO: desembrulha envelope { id, event, data, sentDate }
  const rawBodyAny = body as Record<string, unknown>;
  const hasEnvelope = rawBodyAny.event !== undefined && rawBodyAny.data !== undefined;
  const bodyAny = hasEnvelope
    ? ((rawBodyAny.data as Record<string, unknown>) || {})
    : rawBodyAny;
  const eventName = (rawBodyAny.event as string) || "";

  const buyer = (bodyAny.buyer || {}) as Record<string, unknown>;
  const price = (bodyAny.price || {}) as Record<string, unknown>;
  const items = (bodyAny.items || []) as Array<Record<string, unknown>>;
  const firstItem = (items[0] || {}) as Record<string, unknown>;

  const pickStr = (...vals: unknown[]): string | undefined => {
    for (const v of vals) {
      if (v !== undefined && v !== null && v !== "") return String(v);
    }
    return undefined;
  };

  const status = (
    pickStr(eventName, bodyAny.status, bodyAny.event) || ""
  ).toLowerCase();

  const email = pickStr(buyer.email) || null;
  const name = pickStr(buyer.name) || null;
  const phoneRaw = pickStr(buyer.cellphone, buyer.phone, buyer.phone2) || null;
  const whatsapp = normalizePhone(phoneRaw);

  const productName = pickStr(firstItem.name) || null;
  const productId = pickStr(firstItem.productId) || null;
  const amount = parseFloat(pickStr(price.value) || "0");
  const currency = pickStr(price.currency) || "BRL";
  const transactionId = pickStr(bodyAny.id) || "";

  const address = (buyer.address || {}) as Record<string, unknown>;
  const city = pickStr(address.city);
  const state = pickStr(address.state);
  const country = pickStr(address.country);
  const zipCode = pickStr(address.zipCode);
  const paymentMethod = pickStr(bodyAny.paymentMethod);
  const checkoutUrl = pickStr(bodyAny.checkoutUrl);
  const saleRecoveryUrl = pickStr(bodyAny.saleRecoveryUrl);

  // CRITICO: substring checks (NAO usar regex \b - underscore quebra)
  const has = (s: string) => status.includes(s);
  const isPaid = has("paid") || has("approved") || has("completed");
  const isPending =
    has("opened") || has("waiting_payment") || has("recovering") ||
    has("negotiated") || has("negotiating") || has("scheduled") ||
    has("pending") || has("aguardando") ||
    /(^|[._])open([._]|$)/i.test(status);
  const isCancelled =
    has("canceled") || has("cancelled") || has("refunded") || has("waiting_refund") ||
    has("expired") || has("chargeback") || has("estornad") || has("abandon");

  // CRITICO: workspace correto via webhookKey ativa (NAO findFirst sem orderBy)
  let workspace;
  const activeKey = await prisma.webhookKey.findFirst({
    where: { isActive: true },
    select: { workspaceId: true },
    orderBy: { createdAt: "desc" },
  });
  if (activeKey) {
    workspace = await prisma.workspace.findUnique({ where: { id: activeKey.workspaceId } });
  }
  if (!workspace) {
    workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: "desc" } });
  }
  if (!workspace) {
    return NextResponse.json({ error: "no_workspace" }, { status: 500, headers: CORS });
  }

  // DEBUG: salva payload cru numa Activity pra inspecao
  try {
    await prisma.activity.create({
      data: {
        type: "FORM_SUBMITTED",
        title: `[EDUZZ DEBUG] Postback recebido`,
        workspaceId: workspace.id,
        metadata: JSON.parse(JSON.stringify({
          rawPayload: body,
          rawString: raw.slice(0, 3000),
          contentType,
          parsedStatus: status,
          parsedWhatsapp: whatsapp,
          parsedEmail: email,
        })),
      },
    });
  } catch (err) {
    console.error("[EDUZZ DEBUG] erro:", err);
  }

  if (!whatsapp && !email) {
    return NextResponse.json(
      { ok: true, note: "no_identifier", status, received: true },
      { status: 200, headers: CORS }
    );
  }

  // CRITICO: match prioriza whatsapp > phone > email (NAO OR do Prisma)
  let lead = whatsapp
    ? await prisma.lead.findFirst({
        where: { workspaceId: workspace.id, whatsapp },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!lead && whatsapp) {
    lead = await prisma.lead.findFirst({
      where: { workspaceId: workspace.id, phone: whatsapp },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!lead && email) {
    lead = await prisma.lead.findFirst({
      where: { workspaceId: workspace.id, email },
      orderBy: { createdAt: "desc" },
    });
  }

  // Se nao achar, cria novo lead (compra direta sem passar pela LP)
  if (!lead) {
    const [firstName, ...rest] = (name || "Cliente").split(/\s+/);
    lead = await prisma.lead.create({
      data: {
        firstName: firstName || "Cliente",
        lastName: rest.join(" ") || null,
        email: email || undefined,
        whatsapp: whatsapp || undefined,
        source: "LANDING_PAGE",
        status: "NEW",
        score: 50,
        workspaceId: workspace.id,
      },
    });
  }

  // Atualiza status + score
  let newStatus = lead.status;
  let newScore = lead.score;
  let activityTitle = "";
  let activityType: "FORM_SUBMITTED" | "DEAL_WON" | "DEAL_LOST" | "LEAD_CREATED" = "FORM_SUBMITTED";

  const existingCustomFields = (lead.customFields as Record<string, unknown>) || {};

  if (isPaid) {
    newStatus = "CONVERTED";
    newScore = 150;
    activityTitle = `Compra aprovada: ${productName || "Eduzz"} (R$${amount.toFixed(2)})`;
    activityType = "DEAL_WON";
  } else if (isPending) {
    newStatus = "QUALIFIED";
    newScore = Math.max(lead.score, 75);
    activityTitle = `Checkout iniciado (aguardando pagamento): ${productName || "Eduzz"}`;
  } else if (isCancelled) {
    activityTitle = `Checkout cancelado/expirado: ${productName || "Eduzz"} (status: ${status})`;
    activityType = "DEAL_LOST";
  } else {
    activityTitle = `Evento Eduzz: ${status}`;
  }

  // CRITICO: helper que NAO sobrescreve com null/zero
  const onlyIfSet = <T>(key: string, val: T): Record<string, T> | Record<string, never> =>
    val !== null && val !== undefined && val !== "" && val !== 0
      ? { [key]: val } as Record<string, T>
      : {};

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: newStatus,
      score: newScore,
      ...(email && !lead.email ? { email } : {}),
      ...(whatsapp && !lead.whatsapp ? { whatsapp } : {}),
      customFields: {
        ...existingCustomFields,
        eduzzLastStatus: status,
        eduzzLastUpdate: new Date().toISOString(),
        ...onlyIfSet("eduzzTransactionId", transactionId),
        ...onlyIfSet("eduzzProductName", productName),
        ...onlyIfSet("eduzzProductId", productId),
        ...(amount > 0 ? { eduzzAmount: amount } : {}),
        ...onlyIfSet("eduzzCurrency", currency),
        ...onlyIfSet("eduzzPaymentMethod", paymentMethod),
        ...onlyIfSet("eduzzCheckoutUrl", checkoutUrl),
        ...onlyIfSet("eduzzSaleRecoveryUrl", saleRecoveryUrl),
        ...onlyIfSet("eduzzCity", city),
        ...onlyIfSet("eduzzState", state),
        ...onlyIfSet("eduzzCountry", country),
        ...onlyIfSet("eduzzZipCode", zipCode),
        ...(isPaid ? { eduzzPaidAt: new Date().toISOString() } : {}),
        ...(isCancelled ? { eduzzAbandonedAt: new Date().toISOString() } : {}),
      },
    },
  });

  await prisma.activity.create({
    data: {
      type: activityType,
      title: activityTitle,
      workspaceId: workspace.id,
      leadId: lead.id,
      metadata: { eduzzStatus: status, transactionId, amount, currency, productName },
    },
  });

  // CAPI Meta com event_id pra dedup
  if (isPaid) {
    const nameParts = (name || lead.firstName).split(/\s+/);
    await sendCapiEvent({
      eventName: "Purchase",
      eventId: `eduzz_${transactionId}`,
      userData: {
        email: email || lead.email || undefined,
        phone: whatsapp || lead.whatsapp || undefined,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || undefined,
        city, state, zip: zipCode,
        country: (country || "br").toLowerCase(),
        externalId: lead.id,
      },
      customData: {
        currency, value: amount,
        contentName: productName || "Produto",
        contentIds: productId ? [productId] : undefined,
        contentType: "product",
        orderId: transactionId,
      },
      actionSource: "website",
    });
  } else if (isPending) {
    const nameParts = (name || lead.firstName).split(/\s+/);
    await sendCapiEvent({
      eventName: "AddPaymentInfo",
      eventId: `eduzz_addpay_${transactionId}`,
      userData: {
        email: email || lead.email || undefined,
        phone: whatsapp || lead.whatsapp || undefined,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || undefined,
        city, state, zip: zipCode,
        country: (country || "br").toLowerCase(),
        externalId: lead.id,
      },
      customData: {
        currency, value: amount,
        contentName: productName || "Produto",
        contentIds: productId ? [productId] : undefined,
        contentType: "product",
        orderId: transactionId,
      },
      actionSource: "website",
    });
  }

  return NextResponse.json(
    { ok: true, leadId: lead.id, status: newStatus, score: newScore, event: status },
    { headers: CORS }
  );
}
