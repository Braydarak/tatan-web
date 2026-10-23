import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  reason?: unknown;
  message?: unknown;
};

const VALID_REASONS = new Set<string>([
  "general",
  "pedido",
  "cambios",
  "mayorista",
  "otro",
]);

export const maxDuration = 15;
export const dynamic = "force-dynamic";

function clientIp(request: Request): string | null {
  try {
    const h = request.headers;
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null
    );
  } catch {
    return null;
  }
}

function ua(request: Request): string {
  try {
    return (request.headers.get("user-agent") ?? "").slice(0, 500);
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: ContactPayload = {};

  if (contentType.includes("application/json")) {
    try {
      payload = (await request.json()) as ContactPayload;
    } catch {
      return NextResponse.json(
        { ok: false, error: "INVALID_JSON" },
        { status: 400 },
      );
    }
  } else {
    try {
      const fd = await request.formData();
      payload = {
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        reason: fd.get("reason"),
        message: fd.get("message"),
      };
    } catch {
      return NextResponse.json(
        { ok: false, error: "INVALID_FORM" },
        { status: 400 },
      );
    }
  }

  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const phone = (payload.phone != null && String(payload.phone).trim().length
    ? String(payload.phone).trim()
    : null) as string | null;
  const reasonRaw = String(payload.reason ?? "general").trim();
  const reason = VALID_REASONS.has(reasonRaw) ? reasonRaw : "otro";
  const message = String(payload.message ?? "").trim();

  const errors: string[] = [];
  if (name.length < 2) errors.push("NAME_TOO_SHORT");
  if (!/.+@.+\..+/.test(email)) errors.push("INVALID_EMAIL");
  if (message.length < 5) errors.push("MESSAGE_TOO_SHORT");

  if (errors.length) {
    return NextResponse.json(
      { ok: false, errors },
      { status: 400 },
    );
  }

  const [result] = await query<any>(
    `INSERT INTO contact_messages
      (name, email, phone, reason, message, ip, user_agent)
     VALUES (?,?,?,?,?,?,?)`,
    [
      name.slice(0, 150),
      email.slice(0, 150),
      phone?.slice(0, 50) ?? null,
      reason,
      message,
      clientIp(request),
      ua(request),
    ],
  );

  const insertId =
    typeof result === "object" && result !== null && "insertId" in result
      ? (result as { insertId: number }).insertId
      : null;

  return NextResponse.json(
    {
      ok: true,
      id: insertId,
      receivedAt: new Date().toISOString(),
    },
    { status: 201 },
  );
}
