import type { Product } from "@/lib/tatan-api";
import { wholesaleOf, type Wholesale } from "@/lib/wholesale";

export type SizeOption = { label: string; stock: number };
/** Modelo / estampado / color: con número de artículo y foto opcionales */
export type ColorOption = { name: string; hex: string; sku?: string; imageSrc?: string };

export type BuyOptions = {
  sizes: SizeOption[];
  colors: ColorOption[];
  /** Precio por mayor del producto (si tiene) */
  wholesale?: Wholesale;
};

/**
 * Orden natural de talles: RN, meses (1M, 3M, 6-9M…), después años (2, 4, 6…)
 * y al final cualquier otro (S, M, L / "Único"). La base los devuelve en
 * cualquier orden.
 */
export function sizeRank(label: string): number {
  const s = label.trim().toUpperCase();
  if (s === "RN" || s === "PREMATURO" || s === "0") return 0;
  const months = s.match(/^(\d+)(?:\s*-\s*\d+)?\s*M(?:ESES)?$/);
  if (months) return 1 + Number(months[1]);
  const years = s.match(/^(\d+)(?:\s*-\s*\d+)?(?:\s*A(?:ÑOS)?)?$/);
  if (years) return 100 + Number(years[1]);
  const letters = ["XS", "S", "M", "L", "XL"].indexOf(s);
  if (letters >= 0) return 200 + letters;
  return 300;
}

/** Talles (ordenados de menor a mayor) con su stock, y colores reales del producto. */
export function buyOptionsFromApi(
  api: Pick<Product, "sizes" | "stockBySize" | "colorVariants"> &
    Partial<Pick<Product, "price" | "wholesalePrice" | "wholesaleMinQty">>,
): BuyOptions {
  const stock = api.stockBySize ?? {};
  const labels =
    Array.isArray(api.sizes) && api.sizes.length > 0
      ? api.sizes
      : Object.keys(stock);
  return {
    sizes: labels
      .map((label, i) => ({
        label,
        stock: Math.max(0, Number(stock[label]) || 0),
        i,
      }))
      .sort((a, b) => sizeRank(a.label) - sizeRank(b.label) || a.i - b.i)
      .map(({ label, stock }) => ({ label, stock })),
    colors: (api.colorVariants ?? []).filter((c) => c && c.hex),
    wholesale: wholesaleOf(api),
  };
}

export function totalStock(opts: BuyOptions) {
  return opts.sizes.reduce((a, s) => a + s.stock, 0);
}
