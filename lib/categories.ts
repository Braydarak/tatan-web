/**
 * Categorías de productos. Viven en la base (tabla `categories`) y se
 * administran desde CRM → Categorías. Si la API todavía no tiene
 * categories.php (o falla), se usa esta lista de respaldo.
 */

export type Category = {
  key: string;
  label: string;
  sortOrder: number;
  active: boolean;
  productCount?: number;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { key: "body", label: "Body", sortOrder: 1, active: true },
  { key: "remera", label: "Remera", sortOrder: 2, active: true },
  { key: "pijama", label: "Pijama", sortOrder: 3, active: true },
  { key: "set", label: "Set", sortOrder: 4, active: true },
  { key: "pantalon", label: "Pantalón", sortOrder: 5, active: true },
  { key: "buzo", label: "Buzo", sortOrder: 6, active: true },
  { key: "accesorio", label: "Accesorio", sortOrder: 7, active: true },
];

export function categoryLabel(categories: Category[], key: string): string {
  const c = categories.find((x) => x.key === key);
  if (c) return c.label;
  return key ? key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ") : "";
}

const PHP_API_BASE = "https://tatankids.com.ar/api";

/** Categorías visibles (servidor, con caché de 60 s). */
export async function fetchCategoriesSSR(): Promise<Category[]> {
  try {
    const res = await fetch(`${PHP_API_BASE}/categories.php`, {
      next: { revalidate: 60, tags: ["tatan-categories"] },
      cache: "force-cache",
    });
    if (!res.ok) return DEFAULT_CATEGORIES;
    const json = (await res.json()) as { ok?: boolean; data?: Category[] };
    return json?.ok && Array.isArray(json.data) && json.data.length
      ? json.data
      : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}
