/**
 * Sugerencias del buscador de la tienda: mientras se escribe, propone
 * accesos directos (p. ej. "bebés" → todos los productos de bebé) y
 * productos que coinciden (con foto y precio).
 */

import { matchesProduct } from "@/lib/product-search";
import { productHref } from "@/lib/product-url";

export type SearchProduct = {
  id: string;
  name: string;
  slug?: string | null;
  imageSrc: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  sizeGroup?: string;
  tagline?: string | null;
  colorVariants?: { name?: string; sku?: string; imageSrc?: string }[];
};

export type SearchCategory = { key: string; label: string };

export type Shortcut = { kind: "shortcut"; label: string; hint: string; href: string };
export type ProductHit = {
  kind: "product";
  id: string;
  name: string;
  imageSrc: string;
  price: number;
  originalPrice?: number | null;
  href: string;
};
export type Suggestion = Shortcut | ProductHit;

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Palabras que llevan a un filtro o página (sin acentos, minúscula) */
const SHORTCUTS: { words: string[]; label: string; hint: string; href: string }[] = [
  {
    words: ["bebe", "bebes", "baby", "recien nacido", "rn", "bebito", "bebita", "ajuar"],
    label: "Ver todo lo de bebés",
    hint: "Todos los productos con talle de bebé",
    href: "/productos?t=bebe",
  },
  {
    words: ["nino", "ninos", "nina", "ninas", "nene", "nenes", "nena", "nenas", "chicos", "infantil"],
    label: "Ver todo lo de niños",
    hint: "Todos los productos con talle de niños",
    href: "/productos?t=ninios",
  },
  {
    words: ["oferta", "ofertas", "descuento", "descuentos", "promo", "promocion", "rebaja", "sale"],
    label: "Ver ofertas",
    hint: "Productos con descuento",
    href: "/ofertas",
  },
  {
    words: ["envio", "envios", "pago", "pagos", "cuotas", "mercado pago", "efectivo", "tarjeta", "rapipago", "pago facil"],
    label: "Envíos y pagos",
    hint: "Cómo te llega y cómo pagar",
    href: "/envios",
  },
];

/** ¿La búsqueda es el comienzo de alguna palabra/frase de la lista? ("beb" → bebé) */
function startsAny(q: string, words: string[]): boolean {
  return q.length >= 2 && words.some((w) => w.startsWith(q) || q === w || q.startsWith(`${w} `) || q.endsWith(` ${w}`));
}

/** "bodys" / "bodies" → "body" para comparar con las categorías */
function singular(s: string): string {
  return s.replace(/(ies|es|s)$/, (m) => (m === "ies" ? "y" : ""));
}

export function buildSuggestions(
  query: string,
  products: SearchProduct[],
  categories: SearchCategory[],
  maxProducts = 6,
): Suggestion[] {
  const q = norm(query);
  if (q.length < 1) return [];
  const out: Suggestion[] = [];

  for (const s of SHORTCUTS) {
    if (startsAny(q, s.words)) out.push({ kind: "shortcut", label: s.label, hint: s.hint, href: s.href });
  }

  // Categorías con productos: "body" → "Ver todos: Body"
  const withProducts = new Set(products.map((p) => p.category));
  for (const c of categories) {
    if (!withProducts.has(c.key)) continue;
    const label = norm(c.label);
    if (q.length >= 2 && (label.startsWith(q) || label.startsWith(singular(q)) || singular(q) === singular(label))) {
      out.push({
        kind: "shortcut",
        label: `Ver todos: ${c.label}`,
        hint: "Categoría",
        href: `/productos?c=${encodeURIComponent(c.key)}`,
      });
    }
  }

  // Productos: primero los que empiezan con lo buscado, después los que lo contienen
  const words = q.split(" ").filter(Boolean);
  const scored = products
    .map((p) => {
      const name = norm(p.name);
      const hay = `${name} ${norm(p.tagline ?? "")} ${(p.colorVariants ?? []).map((v) => norm(v.name ?? "")).join(" ")}`;
      const all = words.every((w) => hay.includes(w) || hay.includes(singular(w)));
      const byCode = matchesProduct({ name: p.name, slug: p.slug, colorVariants: p.colorVariants }, query);
      if (!all && !byCode) return null;
      const score = (name.startsWith(q) ? 3 : 0) + (name.includes(q) ? 2 : 0) + (byCode ? 1 : 0);
      return { p, score };
    })
    .filter((x): x is { p: SearchProduct; score: number } => !!x)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, maxProducts);

  for (const { p } of scored) {
    out.push({
      kind: "product",
      id: p.id,
      name: p.name,
      imageSrc: p.imageSrc,
      price: p.price,
      originalPrice: p.originalPrice,
      href: productHref(p),
    });
  }
  return out;
}
