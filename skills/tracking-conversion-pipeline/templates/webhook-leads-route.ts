/**
 * Webhook generico de captura de lead - TEMPLATE PRONTO PRA COPY-PASTE
 *
 * Recebe leads de LP via sendBeacon (text/plain) ou JSON.
 * - CORS liberado (OPTIONS handler)
 * - Score 50 + status QUALIFIED automatico pra LP leads
 * - Re-submits bumpam +10 com piso 50, teto 100
 * - Match por whatsapp/email/phone
 * - Validacao via webhookKey querystring
 *
 * Path sugerido: src/app/api/webhooks/leads/route.ts (Next.js App Router)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const LEAD_SOURCES = [
  "MANUAL", "LANDING_PAGE", "WHATSAPP", "EMAIL", "PHONE", "REFERRAL",
  "ADS", "ORGANIC", "INSTAGRAM_DM", "TIKTOK", "TELEGRAM", "FACEBOOK",
  "LINKEDIN", "GOOGLE_ADS", "META_ADS", "YOUTUBE", "WEBSITE", "OTHER",
] as const;

const leadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Missing webhook key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // Validate webhook key
  const webhookKey = await prisma.webhookKey.findUnique({
    where: { key, isActive: true },
  });

  if (!webhookKey) {
    return NextResponse.json(
      { error: "Invalid webhook key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // CRITICO: aceitar text/plain (sendBeacon usa text/plain pra evitar CORS preflight)
  const rawBody = await request.text();
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const data = parsed.data;

  // Check for duplicate by whatsapp, phone or email
  const existing = await prisma.lead.findFirst({
    where: {
      workspaceId: webhookKey.workspaceId,
      OR: [
        ...(data.email ? [{ email: data.email }] : []),
        ...(data.phone ? [{ phone: data.phone }] : []),
        ...(data.whatsapp ? [{ whatsapp: data.whatsapp }] : []),
      ],
    },
  });

  if (existing) {
    // Re-submit: bump score +10 com PISO 50 (LP leads sao quentes), teto 100
    const isLp = (data.source ?? "LANDING_PAGE") === "LANDING_PAGE";
    const floor = isLp ? 50 : 0;
    const baseline = Math.max(existing.score, floor);
    const bumpedScore = existing.status === "CONVERTED"
      ? existing.score
      : Math.min(100, baseline + (isLp ? 10 : 0));
    const newStatus = existing.status === "CONVERTED"
      ? existing.status
      : (isLp ? "QUALIFIED" : existing.status);

    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName ?? existing.lastName,
        email: data.email ?? existing.email,
        phone: data.phone ?? existing.phone,
        whatsapp: data.whatsapp ?? existing.whatsapp,
        score: bumpedScore,
        status: newStatus,
      },
    });

    await prisma.activity.create({
      data: {
        type: "FORM_SUBMITTED",
        title: `${data.firstName} enviou formulario novamente`,
        workspaceId: webhookKey.workspaceId,
        leadId: existing.id,
        metadata: { source: data.source ?? webhookKey.source ?? "LANDING_PAGE" },
      },
    });

    return NextResponse.json(
      { id: updated.id, status: "updated" },
      { headers: CORS_HEADERS }
    );
  }

  // Score/status inicial: leads de LP ja preencheram popup e foram pro checkout,
  // entao entram como QUALIFIED com score 50 (intencao alta).
  const sourceFinal = data.source ?? "LANDING_PAGE";
  const isLandingLead = sourceFinal === "LANDING_PAGE";
  const initialScore = isLandingLead ? 50 : 0;
  const initialStatus = isLandingLead ? "QUALIFIED" : "NEW";

  const lead = await prisma.lead.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp ?? data.phone,
      source: sourceFinal,
      status: initialStatus,
      score: initialScore,
      workspaceId: webhookKey.workspaceId,
      customFields: data.customFields ?? undefined,
    },
  });

  await prisma.activity.create({
    data: {
      type: "LEAD_CREATED",
      title: `Novo lead: ${data.firstName} ${data.lastName ?? ""}`.trim(),
      workspaceId: webhookKey.workspaceId,
      leadId: lead.id,
      metadata: { source: sourceFinal },
    },
  });

  return NextResponse.json(
    { id: lead.id, status: "created" },
    { status: 201, headers: CORS_HEADERS }
  );
}
