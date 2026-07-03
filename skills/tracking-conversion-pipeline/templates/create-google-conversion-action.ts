/**
 * Cria a conversion action "CZ - Compra Eduzz" na conta 245-602-1627 (Nelmo ADS).
 * Tipo: UPLOAD_CLICKS (offline conversion import via gclid).
 * Valores: dinâmicos (vêm do webhook Eduzz), BRL, count ONE, janela 30 dias.
 *
 * Rodar: npx tsx create-google-conversion-action.ts (na pasta do seu projeto, com .env.local)
 */
import "dotenv/config";
import { GoogleAdsApi, enums } from "google-ads-api";
import * as fs from "fs";
import * as path from "path";

// Carrega .env.local manualmente (dotenv só lê .env por padrão)
const envLocal = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const CUSTOMER_ID = "9876543210"; // Nelmo ADS, sem hifen
const LOGIN_CUSTOMER_ID = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");

async function main() {
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  });

  const customer = client.Customer({
    customer_id: CUSTOMER_ID,
    login_customer_id: LOGIN_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  });

  // Verifica se já existe (idempotência)
  const existing = await customer.query(`
    SELECT conversion_action.resource_name, conversion_action.id, conversion_action.name, conversion_action.status
    FROM conversion_action
    WHERE conversion_action.name = 'CZ - Compra Eduzz'
  `);

  if (existing.length > 0) {
    console.log("Conversion action ja existe:");
    for (const r of existing) {
      console.log("  resource_name:", r.conversion_action?.resource_name);
      console.log("  id:", r.conversion_action?.id);
      console.log("  status:", r.conversion_action?.status);
    }
    return;
  }

  console.log("Criando conversion action 'CZ - Compra Eduzz'...");

  const result = await customer.conversionActions.create([
    {
      name: "CZ - Compra Eduzz",
      type: enums.ConversionActionType.UPLOAD_CLICKS,
      category: enums.ConversionActionCategory.PURCHASE,
      status: enums.ConversionActionStatus.ENABLED,
      counting_type: enums.ConversionActionCountingType.ONE_PER_CLICK,
      click_through_lookback_window_days: 30,
      view_through_lookback_window_days: 1,
      value_settings: {
        default_value: 127,
        default_currency_code: "BRL",
        always_use_default_value: false,
      },
      attribution_model_settings: {
        attribution_model: enums.AttributionModel.GOOGLE_ADS_LAST_CLICK,
      },
    },
  ]);

  console.log("\nCriado com sucesso:");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n>>> Use este resource name na env GOOGLE_ADS_CONVERSION_ACTION_CZ <<<");
  if (result.results && result.results[0]) {
    console.log(result.results[0].resource_name);
  }
}

main().catch((err) => {
  console.error("ERRO:", err);
  if (err.errors) console.error("details:", JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
