import { NextResponse, type NextRequest } from "next/server";
import { catalogHref } from "@/lib/seo";

/**
 * Links viejos del catálogo → URL limpia con una redirección 308 de verdad
 * (Google traspasa el posicionamiento):
 *   /productos?c=body          → /productos/body
 *   /productos?t=bebe          → /bebes
 *   /productos?c=ajuar&pr=x    → /productos/ajuar?pr=x
 * Se hace acá y no en la página porque la página empieza a enviarse antes
 * (pantalla de carga) y ahí ya no puede cambiar el código de respuesta.
 */
export function proxy(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const cat = sp.get("c") ?? "";
  const size = sp.get("t") ?? "";
  if ((!cat || cat === "todos") && (!size || size === "todos")) return NextResponse.next();
  const href = catalogHref({
    cat,
    size,
    pr: sp.get("pr") ?? undefined,
    sort: sp.get("s") ?? undefined,
    q: sp.get("q") ?? undefined,
  });
  return NextResponse.redirect(new URL(href, request.url), 308);
}

export const config = {
  matcher: "/productos",
};
