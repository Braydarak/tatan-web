/**
 * Búsqueda de productos (tienda y CRM): por nombre o por número de artículo
 * (el del producto o el de cualquiera de sus modelos). El ID interno de la
 * base no se usa.
 */
type Searchable = {
  name: string;
  slug?: string | null;
  colorVariants?: { sku?: string }[];
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function matchesProduct(p: Searchable, query: string): boolean {
  const q = norm(query);
  if (!q) return true;
  if (norm(p.name).includes(q)) return true;
  const skus = [p.slug ?? "", ...(p.colorVariants ?? []).map((v) => v.sku ?? "")];
  return skus.some((s) => s && norm(s).includes(q));
}
