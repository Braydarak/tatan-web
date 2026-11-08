/**
 * Stock por talle y por color/modelo.
 *
 *  - stockBySize:  total de cada talle (todos los colores sumados).
 *  - stockByColor: { "Rosa": { "3M": 4, "6M": 0 }, … } — solo si el producto
 *    tiene el stock cargado por color. Las claves son el nombre del modelo.
 *
 * Productos sin modelos, o cargados antes del stock por color, solo tienen
 * stockBySize: ahí el stock es compartido por todos los colores.
 */

export type StockMap = Record<string, number>;
export type StockByColor = Record<string, StockMap>;

/** Nombre con el que se guarda el stock de un modelo (igual que la API). */
export function colorKey(name: string | undefined | null): string {
  return (name ?? "").trim().slice(0, 80) || "Modelo";
}

export function hasColorStock(
  stockByColor: StockByColor | undefined | null,
): stockByColor is StockByColor {
  return !!stockByColor && Object.keys(stockByColor).length > 0;
}

export function sumStock(map: StockMap | undefined | null): number {
  return Object.values(map ?? {}).reduce((a, n) => a + (Number(n) || 0), 0);
}

/** Total por talle a partir del stock por color. */
export function totalsBySize(
  stockByColor: StockByColor,
  sizes: string[],
): StockMap {
  const out: StockMap = {};
  for (const s of sizes) {
    out[s] = Object.values(stockByColor).reduce(
      (a, m) => a + Math.max(0, Number(m[s]) || 0),
      0,
    );
  }
  return out;
}
