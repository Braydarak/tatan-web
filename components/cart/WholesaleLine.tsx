"use client";

import { Tag } from "lucide-react";
import type { CartItem } from "@/lib/cart";
import { formatArs } from "@/lib/cart";
import { effectiveUnitPrice, qtyOfProduct, type WholesaleMode } from "@/lib/wholesale";

/**
 * Debajo de cada producto del carrito: avisa si ya se aplicó el precio por
 * mayor o cuántas unidades faltan para llegar (solo en modo "auto").
 */
export default function WholesaleLine({
  item,
  items,
  mode,
}: {
  item: CartItem;
  items: CartItem[];
  mode: WholesaleMode;
}) {
  if (mode !== "auto" || !item.wholesalePrice || !item.wholesaleMinQty) return null;
  if (item.wholesalePrice >= item.unitPrice) return null;
  const { wholesale } = effectiveUnitPrice(item, items, mode);
  if (wholesale) {
    return (
      <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-tatan-acento-verde/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
        <Tag className="h-3 w-3" strokeWidth={2.4} />
        Precio por mayor: {formatArs(item.wholesalePrice)} c/u
      </p>
    );
  }
  // El aviso va una sola vez por producto (en su primera línea)
  const first = items.find((i) => i.productId === item.productId);
  if (first?.key !== item.key) return null;
  const missing = item.wholesaleMinQty - qtyOfProduct(items, item.productId);
  if (missing <= 0) return null;
  return (
    <p className="mt-1 text-[11px] font-semibold text-zinc-500">
      Sumá {missing} {missing === 1 ? "unidad más" : "unidades más"} y pagás{" "}
      <strong className="text-zinc-700">{formatArs(item.wholesalePrice)} c/u</strong>{" "}
      (por mayor)
    </p>
  );
}
