/**
 * Google Ads Offline Conversion Import (Click Conversions).
 *
 * Dispara conversões pro Google Ads via API REST quando uma compra é confirmada,
 * usando o GCLID capturado na LP (cookie 90d) → Eduzz webhook → aqui.
 *
 * Por que: tudo é Eduzz (sem thank-you no nosso domínio), então não dá pra usar
 * gtag puro. Usamos uploadClickConversions com o GCLID que a LP capturou e
 * propagou via Nova CRM.
 *
 * Docs: https://developers.google.com/google-ads/api/rest/reference/rest/v17/customers/uploadClickConversions
 *
 * Env vars necessárias:
 * - GOOGLE_ADS_DEVELOPER_TOKEN
 * - GOOGLE_ADS_CLIENT_ID
 * - GOOGLE_ADS_CLIENT_SECRET
 * - GOOGLE_ADS_REFRESH_TOKEN
 * - GOOGLE_ADS_LOGIN_CUSTOMER_ID  (MCC, sem hífen, ex: 1234567890)
 * - GOOGLE_ADS_CUSTOMER_ID        (conta filha, sem hífen, ex: 9876543210)
 * - GOOGLE_ADS_CONVERSION_ACTION_CZ  (resource name completo, ex: customers/9876543210/conversionActions/123456789)
 */

const API_VERSION = "v17";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ADS_BASE = `https://googleads.googleapis.com/${API_VERSION}`;

interface UploadClickConversionInput {
  gclid: string;
  conversionAction: string; // resource name completo
  conversionDateTime: Date | string; // se Date, formatamos
  conversionValue: number;
  currencyCode?: string;
  orderId?: string;
}

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: AccessTokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("[google-ads-capi] OAuth env vars ausentes (CLIENT_ID/SECRET/REFRESH_TOKEN)");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[google-ads-capi] falha ao renovar token: ${res.status} ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

/**
 * Formata data no formato exigido pelo Google Ads API:
 * "yyyy-MM-dd HH:mm:ss+|-HH:mm" (com offset de timezone).
 * Default: America/Sao_Paulo (-03:00).
 */
function formatConversionDateTime(date: Date | string): string {
  if (typeof date === "string") return date;
  const pad = (n: number) => String(n).padStart(2, "0");
  // Converte pra GMT-3 manualmente (Brasília não tem horário de verão desde 2019)
  const utc = date.getTime();
  const brt = new Date(utc - 3 * 60 * 60 * 1000);
  return (
    `${brt.getUTCFullYear()}-${pad(brt.getUTCMonth() + 1)}-${pad(brt.getUTCDate())} ` +
    `${pad(brt.getUTCHours())}:${pad(brt.getUTCMinutes())}:${pad(brt.getUTCSeconds())}-03:00`
  );
}

/**
 * Envia uma click conversion pro Google Ads.
 * Não throwa em erro de validação Google: loga e retorna { ok: false, error }.
 * Throwa só em erro de configuração (env vars).
 */
export async function uploadClickConversion(input: UploadClickConversionInput): Promise<{
  ok: boolean;
  error?: string;
  partialFailureError?: unknown;
  results?: unknown;
}> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!developerToken || !customerId) {
    console.warn("[google-ads-capi] env vars Google Ads ausentes, pulando upload");
    return { ok: false, error: "missing_env_vars" };
  }
  if (!input.gclid) {
    return { ok: false, error: "missing_gclid" };
  }
  if (!input.conversionAction) {
    return { ok: false, error: "missing_conversion_action" };
  }

  const accessToken = await getAccessToken();

  const payload = {
    conversions: [
      {
        gclid: input.gclid,
        conversionAction: input.conversionAction,
        conversionDateTime: formatConversionDateTime(input.conversionDateTime),
        conversionValue: input.conversionValue,
        currencyCode: input.currencyCode || "BRL",
        ...(input.orderId ? { orderId: input.orderId } : {}),
      },
    ],
    partialFailure: true,
    validateOnly: false,
  };

  const url = `${ADS_BASE}/customers/${customerId}:uploadClickConversions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text);
  } catch {
    // resposta não-JSON
  }

  if (!res.ok) {
    console.error("[google-ads-capi] upload falhou:", res.status, text.slice(0, 600));
    return { ok: false, error: `http_${res.status}`, results: json };
  }

  // partialFailureError aparece quando o Google aceita o request mas rejeita
  // a conversão específica (ex: gclid não encontrado, conversion action inválida)
  if (json.partialFailureError) {
    console.error("[google-ads-capi] partial failure:", JSON.stringify(json.partialFailureError));
    return { ok: false, partialFailureError: json.partialFailureError, results: json };
  }

  console.log("[google-ads-capi] conversão enviada:", input.gclid.slice(0, 20), "→", input.conversionAction);
  return { ok: true, results: json };
}
