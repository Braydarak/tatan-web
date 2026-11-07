import type { Product as ApiProduct } from "@/lib/tatan-api";

const stockOf = (p: ApiProduct) =>
  Object.values(p.stockBySize ?? {}).reduce((a, n) => a + (Number(n) || 0), 0);

/**
 * Elige productos para recomendar a partir de uno o varios productos base
 * (la página de un producto, o lo que hay en el carrito).
 *
 * Orden de prioridad:
 *  1. `ranked`: ids que vienen de la analítica (lo que se compró junto).
 *  2. Los relacionados que se cargan a mano en el CRM.
 *  3. Productos de la misma categoría.
 *  4. El resto del catálogo.
 * Nunca repite ni incluye los productos base, y deja lo agotado al final.
 */
export function pickRelated(
  all: ApiProduct[],
  baseIds: string[],
  limit = 4,
  ranked: string[] = [],
): ApiProduct[] {
  const byId = new Map(all.map((p) => [p.id, p]));
  const base = new Set(baseIds);
  const bases = baseIds.map((id) => byId.get(id)).filter(Boolean) as ApiProduct[];
  const cats = new Set(bases.map((p) => p.category));

  const ordered: string[] = [
    ...ranked,
    ...bases.flatMap((p) => p.relatedIds ?? []),
    ...all.filter((p) => cats.has(p.category)).map((p) => p.id),
    ...all.map((p) => p.id),
  ];

  const seen = new Set<string>();
  const picks: ApiProduct[] = [];
  for (const id of ordered) {
    if (seen.has(id) || base.has(id)) continue;
    seen.add(id);
    const p = byId.get(id);
    if (p && p.active !== false) picks.push(p);
  }
  // Lo que se puede comprar primero, respetando el orden anterior
  const inStock = picks.filter((p) => stockOf(p) > 0);
  const out = picks.filter((p) => stockOf(p) <= 0);
  return [...inStock, ...out].slice(0, limit);
}
