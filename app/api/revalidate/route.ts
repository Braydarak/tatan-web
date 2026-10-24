import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiBaseUrl, type RevalidateTag } from "@/lib/tatan-api";

/**
 * Purga on-demand del caché ISR.
 *
 * El CRM guarda los textos en la API PHP (Ferozo), fuera del alcance de Next,
 * así que el sitio seguiría sirviendo la versión anterior hasta que venciera
 * el `revalidate` del fetch. El CRM llama a este endpoint justo después de
 * guardar para que el cambio se vea al instante.
 *
 * Requiere sesión CRM válida: se reenvía la cookie al backend PHP.
 */

const ALLOWED_TAGS: readonly RevalidateTag[] = [
  "tatan-site-content",
  "tatan-products",
  "tatan-product-detail",
  "tatan-home-products",
];

async function hasCrmSession(): Promise<boolean> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return false;
  try {
    const res = await fetch(`${apiBaseUrl()}/crm-session.php`, {
      headers: { cookie: cookieHeader, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { authenticated?: boolean };
    return data?.authenticated === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await hasCrmSession())) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const tag =
    new URL(request.url).searchParams.get("tag") ?? "tatan-site-content";

  if (!ALLOWED_TAGS.includes(tag as RevalidateTag)) {
    return NextResponse.json(
      { ok: false, error: "UNKNOWN_TAG" },
      { status: 400 },
    );
  }

  revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ ok: true, tag, revalidatedAt: Date.now() });
}
