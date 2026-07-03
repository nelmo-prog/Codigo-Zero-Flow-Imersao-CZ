#!/usr/bin/env bash
# Setup de env vars no Vercel via REST API
# Uso: edite as variaveis abaixo e rode `bash vercel-env-setup.sh`

# ===== CONFIGURAR =====
TOKEN="vcp_SEU_VERCEL_TOKEN"  # Vercel > Settings > Tokens > Create
PID="prj_SEU_PROJECT_ID"      # GET /projects via API
TEAM="team_SEU_TEAM_ID"       # opcional, omitir se nao for time

# ===== ENV VARS =====
META_PIXEL_ID="SEU_PIXEL_ID_AQUI"
META_CAPI_TOKEN="EAAxxx..."   # Events Manager > Settings > Conversions API > Generate
EDUZZ_WEBHOOK_SECRET="cz_2026_SECRET_RANDOM"

# ===== HELPER =====
add_env() {
  local key=$1
  local value=$2
  echo "Setting $key..."
  curl -s -X POST "https://api.vercel.com/v10/projects/$PID/env?teamId=$TEAM&upsert=true" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"value\":\"$value\",\"type\":\"encrypted\",\"target\":[\"production\",\"preview\",\"development\"]}"
  echo ""
}

# ===== EXECUTA =====
add_env "META_PIXEL_ID" "$META_PIXEL_ID"
add_env "META_CAPI_TOKEN" "$META_CAPI_TOKEN"
add_env "EDUZZ_WEBHOOK_SECRET" "$EDUZZ_WEBHOOK_SECRET"

# Trigger redeploy pra env vars valerem
echo "Triggering redeploy..."
LATEST=$(curl -s "https://api.vercel.com/v6/deployments?projectId=$PID&teamId=$TEAM&limit=1&target=production" \
  -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.deployments[0].uid)})")

curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=$TEAM&forceNew=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$PID\",\"deploymentId\":\"$LATEST\",\"target\":\"production\"}"

echo ""
echo "Done. Env vars adicionadas e redeploy disparado."
