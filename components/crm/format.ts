/** Umbral de "stock bajo" (unidades totales por producto). */
export const LOW_STOCK = 3;

export function formatMoneyArs(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function totalStockOf(stockBySize: Record<string, number>): number {
  return Object.values(stockBySize).reduce((acc, n) => acc + n, 0);
}

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(total: number): StockLevel {
  if (total <= 0) return "out";
  if (total <= LOW_STOCK) return "low";
  return "ok";
}
