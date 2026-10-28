import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiBaseUrl, SESSION_HEADER, type RevalidateTag } from "@/lib/tatan-api";

/**
 * Purga on-demand del caché ISR.
 *
 * El CRM guarda los textos en la API PHP (Ferozo), fuera del alcance de Next,
 * así que el sitio seguiría sirviendo la versión anterior hasta que venciera
 * el `revalidate` del fetch. El CRM llama a este endpoint justo después de
 * guardar para que el cambio se vea al instante.
 *
 * Requiere sesión CRM válida: se reenvía el header X-Tatan-Session (o la
 * cookie, si vino) al backend PHP.
 */

const ALLOWED_TAGS: readonly RevalidateTag[] = [
  "tatan-site-content",
  "tatan-products",
  "tatan-product-detail",
  "tatan-home-products",
];

async function hasCrmSession(request: Request): Promise<boolean> {
  const token = request.headers.get(SESSION_HEADER);
  const cookieHeader = (await cookies()).toString();
  if (!token && !cookieHeader) return false;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers[SESSION_HEADER] = token;
  if (cookieHeader) headers.cookie = cookieHeader;

  // Este pedido sale desde Vercel y el anti-bot del hosting a veces responde
  // con una página HTML en vez del JSON: se reintenta un par de veces.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${apiBaseUrl()}/crm-session.php`, {
        headers,
        cache: "no-store",
      });
      const isJson = (res.headers.get("content-type") ?? "").includes("json");
      if (res.ok && isJson) {
        const data = (await res.json()) as { authenticated?: boolean };
        return data?.authenticated === true;
      }
    } catch {
      /* reintentar */
    }
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  return false;
}

export async function POST(request: Request) {
  if (!(await hasCrmSession(request))) {
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
