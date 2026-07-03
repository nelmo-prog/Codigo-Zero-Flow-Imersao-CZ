/**
 * Meta Conversions API helper - TEMPLATE PRONTO PRA COPY-PASTE
 *
 * Uso:
 *   import { sendCapiEvent } from "@/lib/integrations/meta-capi";
 *
 *   await sendCapiEvent({
 *     eventName: "Purchase",
 *     eventId: "stripe_pi_xxx",  // pra dedup com pixel browser
 *     userData: { email, phone, firstName, lastName, city, state, country, zip },
 *     customData: { currency: "BRL", value: 414, contentName: "Produto X", orderId: "..." },
 *   });
 *
 * Env vars necessárias:
 *   META_PIXEL_ID = ID do pixel (ex: 123456789012345)
 *   META_CAPI_TOKEN = Access Token gerado em Events Manager > Settings > Conversions API
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

export type CapiEventName =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "InitiateCheckout"
  | "Purchase"
  | "AddPaymentInfo"
  | "CompleteRegistration"
  | "AddToCart"
  | "Search"
  | "Subscribe";

export interface CapiUserData {
  email?: string;        // sera hasheado
  phone?: string;        // sera hasheado e normalizado
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;      // ex "br"
  zip?: string;
  externalId?: string;   // ID interno do lead/user
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;          // cookie _fbc
  fbp?: string;          // cookie _fbp
}

export interface CapiCustomData {
  currency?: string;
  value?: number;
  contentName?: string;
  contentCategory?: string;
  contentIds?: string[];
  contentType?: string;
  orderId?: string;
}

export interface CapiEventOptions {
  eventName: CapiEventName;
  eventTime?: number;      // unix seconds
  eventId?: string;        // dedup com pixel browser - CRITICO
  eventSourceUrl?: string;
  actionSource?: "website" | "system_generated" | "other";
  userData?: CapiUserData;
  customData?: CapiCustomData;
  testEventCode?: string;  // pra teste no Events Manager > Test Events
}

async function sha256(input: string): Promise<string> {
  // OBRIGATORIO: lowercase + trim antes de hashear (Meta exige)
  const cleaned = input.trim().toLowerCase();
  const buf = new TextEncoder().encode(cleaned);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhone(phone: string): string {
  // Formato E.164 brasileiro: 55 + DDD sem zero + numero
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!/^55/.test(d)) d = "55" + d;
  d = d.replace(/^550/, "55");
  return d;
}

async function buildUserData(u: CapiUserData = {}): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  if (u.email) out.em = [await sha256(u.email)];
  if (u.phone) out.ph = [await sha256(normalizePhone(u.phone))];
  if (u.firstName) out.fn = [await sha256(u.firstName)];
  if (u.lastName) out.ln = [await sha256(u.lastName)];
  if (u.city) out.ct = [await sha256(u.city)];
  if (u.state) out.st = [await sha256(u.state)];
  if (u.country) out.country = [await sha256(u.country)];
  if (u.zip) out.zp = [await sha256(u.zip)];
  if (u.externalId) out.external_id = [u.externalId];
  // IP e UA NAO sao hasheados
  if (u.clientIpAddress) out.client_ip_address = u.clientIpAddress;
  if (u.clientUserAgent) out.client_user_agent = u.clientUserAgent;
  if (u.fbc) out.fbc = u.fbc;
  if (u.fbp) out.fbp = u.fbp;
  return out;
}

function buildCustomData(c: CapiCustomData = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (c.currency) out.currency = c.currency;
  if (c.value != null) out.value = c.value;
  if (c.contentName) out.content_name = c.contentName;
  if (c.contentCategory) out.content_category = c.contentCategory;
  if (c.contentIds) out.content_ids = c.contentIds;
  if (c.contentType) out.content_type = c.contentType;
  if (c.orderId) out.order_id = c.orderId;
  return out;
}

export async function sendCapiEvent(opts: CapiEventOptions) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const TOKEN = process.env.META_CAPI_TOKEN;

  if (!PIXEL_ID || !TOKEN) {
    console.warn("[CAPI] META_PIXEL_ID ou META_CAPI_TOKEN nao configurados");
    return { ok: false, error: "missing_env" };
  }

  const event: Record<string, unknown> = {
    event_name: opts.eventName,
    event_time: opts.eventTime ?? Math.floor(Date.now() / 1000),
    action_source: opts.actionSource ?? "website",
    user_data: await buildUserData(opts.userData),
    custom_data: buildCustomData(opts.customData),
  };

  if (opts.eventId) event.event_id = opts.eventId;
  if (opts.eventSourceUrl) event.event_source_url = opts.eventSourceUrl;

  const body: Record<string, unknown> = { data: [event] };
  if (opts.testEventCode) body.test_event_code = opts.testEventCode;

  try {
    const res = await fetch(
      `${GRAPH_API}/${PIXEL_ID}/events?access_token=${TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      console.error("[CAPI] Erro:", json);
      return { ok: false, status: res.status, error: json };
    }
    return { ok: true, response: json };
  } catch (err) {
    console.error("[CAPI] Exception:", err);
    return { ok: false, error: String(err) };
  }
}
