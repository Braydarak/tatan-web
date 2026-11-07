import type { ProductCardProps } from "@/components/ui/productCard/types";
import { buyOptionsFromApi } from "@/lib/buy-options";
import { wholesaleOf } from "@/lib/wholesale";
import type { Product as ApiProduct } from "@/lib/tatan-api";

/** Datos de la card a partir del producto de la API (mismo criterio en toda la tienda). */
export function apiToCardProps(
  api: ApiProduct,
  opts: { quickAdd?: boolean } = {},
): ProductCardProps & { id: string } {
  const price = Number(api.price) || 0;
  const original =
    api.originalPrice != null ? Number(api.originalPrice) || undefined : undefined;
  const hasDiscount = !!original && original > price;
  const installments = Number(api.installments) || undefined;
  return {
    id: api.id,
    title: api.name,
    imageSrc: api.imageSrc || "/tatanLogo.png",
    images: Array.isArray(api.gallery) ? api.gallery.filter(Boolean) : [],
    discountedPrice: price,
    originalPrice: hasDiscount ? original : undefined,
    discountPercentage: hasDiscount
      ? Math.round(((original! - price) / original!) * 100)
      : undefined,
    installments,
    installmentPrice: installments ? Math.round(price / installments) : undefined,
    taxFreePrice: Math.round(price * 0.79),
    colorHex: api.colorHex || "#F5E6D3",
    tagline: api.tagline?.trim() || undefined,
    productUrl: `/product/${api.id}`,
    ctaLabel: "Ver producto",
    buy: opts.quickAdd === false ? undefined : buyOptionsFromApi(api),
    wholesale: wholesaleOf(api),
  };
}

const PHP_API_BASE = "https://tatankids.com.ar/api";

/** Todos los productos activos (con el mismo caché que el resto de la tienda). */
export async function fetchAllProductsSSR(): Promise<ApiProduct[]> {
  try {
    const res = await fetch(`${PHP_API_BASE}/products.php`, {
      next: { revalidate: 60, tags: ["tatan-products"] },
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { ok?: boolean; data?: ApiProduct[] };
    return Array.isArray(json?.data)
      ? json.data.filter((p) => p.active !== false)
      : [];
  } catch {
    return [];
  }
}

/** "Se compró junto con" para la página de producto (solo pedidos pagados). */
export async function fetchCombosSSR(ids: string[], limit = 4): Promise<string[]> {
  if (!ids.length) return [];
  try {
    const qs = new URLSearchParams({ ids: ids.join(","), limit: String(limit) });
    const res = await fetch(`${PHP_API_BASE}/combos.php?${qs}`, {
      next: { revalidate: 300, tags: ["tatan-combos"] },
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { productId: string }[];
    };
    return json?.ok && Array.isArray(json.data)
      ? json.data.map((d) => d.productId)
      : [];
  } catch {
    return [];
  }
}

export type OffersInfo = { count: number; maxPct: number };

/** ¿Hay ofertas? (productos con precio anterior mayor al actual) y el mayor %. */
export function offersInfo(products: ApiProduct[]): OffersInfo {
  let count = 0;
  let maxPct = 0;
  for (const p of products) {
    const price = Number(p.price) || 0;
    const orig = Number(p.originalPrice) || 0;
    if (orig > price && price > 0) {
      count++;
      maxPct = Math.max(maxPct, Math.round(((orig - price) / orig) * 100));
    }
  }
  return { count, maxPct };
}
