import type { StoreSettings } from "@/components/sections/HomeHeroEditor";

export type WholesaleMode = StoreSettings["wholesaleMode"];
export type Wholesale = { price: number; minQty: number };

/**
 * Recargo que se suma al precio por mayor cargado en el CRM antes de
 * mostrarlo y cobrarlo en la web. En la base queda el precio cargado (así
 * editar el producto no lo vuelve a sumar). No se menciona en la tienda.
 */
export const WHOLESALE_MARKUP = 0.1;

/** Precio por mayor tal como se ve y se cobra en la web (con el recargo). */
export function wholesaleWebPrice(loaded: number): number {
  return Math.round(loaded * (1 + WHOLESALE_MARKUP));
}

/** Precio por mayor del producto, si tiene uno válido (menor al normal). */
export function wholesaleOf(
  p: { price?: number | null; wholesalePrice?: number | null; wholesaleMinQty?: number | null },
): Wholesale | undefined {
  const loaded = Number(p.wholesalePrice) || 0;
  if (!(loaded > 0)) return undefined;
  const w = wholesaleWebPrice(loaded);
  const price = Number(p.price) || 0;
  if (price > 0 && w >= price) return undefined;
  return { price: w, minQty: Math.max(2, Number(p.wholesaleMinQty) || 2) };
}

type LineLike = {
  productId: string;
  quantity: number;
  unitPrice: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
};

/** Unidades de un producto en el carrito (todos los talles y colores). */
export function qtyOfProduct(items: LineLike[], productId: string) {
  return items
    .filter((i) => i.productId === productId)
    .reduce((a, i) => a + i.quantity, 0);
}

/**
 * Precio unitario que se cobra por una línea del carrito. En modo "auto",
 * si el producto llega a la cantidad mínima, va el precio por mayor.
 */
export function effectiveUnitPrice(
  item: LineLike,
  items: LineLike[],
  mode: WholesaleMode,
): { price: number; wholesale: boolean } {
  if (
    mode === "auto" &&
    item.wholesalePrice &&
    item.wholesaleMinQty &&
    item.wholesalePrice < item.unitPrice &&
    qtyOfProduct(items, item.productId) >= item.wholesaleMinQty
  ) {
    return { price: item.wholesalePrice, wholesale: true };
  }
  return { price: item.unitPrice, wholesale: false };
}

export function cartTotals(items: LineLike[], mode: WholesaleMode) {
  let subtotal = 0;
  let saved = 0;
  for (const i of items) {
    const { price } = effectiveUnitPrice(i, items, mode);
    subtotal += price * i.quantity;
    saved += (i.unitPrice - price) * i.quantity;
  }
  return { subtotal, saved };
}
