"use client";

import { useEffect, useRef, useState } from "react";
import type { BuyOptions } from "@/lib/buy-options";
import { addToCart, inCartForSize, useCart } from "@/lib/cart";

type Product = {
  productId: string;
  name: string;
  imageSrc: string;
  unitPrice: number;
  /** Número de artículo del producto (si el modelo no tiene uno propio) */
  sku?: string;
};

export type AddStatus = "idle" | "added" | "need-size" | "need-model" | "no-stock";

/**
 * Estado compartido para elegir talle/color y agregar al carrito
 * (lo usan la card y la página de producto).
 */
export function useBuySelection(product: Product, opts: BuyOptions) {
  const { items } = useCart();
  const inStock = opts.sizes.filter((s) => s.stock > 0);
  // Si hay un solo talle con stock, ya viene elegido
  const [size, setSize] = useState<string | null>(
    inStock.length === 1 ? inStock[0].label : null,
  );
  // Con un solo modelo/color ya viene elegido; con varios, hay que elegir
  const [colorIdx, setColorIdxState] = useState<number | null>(
    opts.colors.length > 1 ? null : 0,
  );
  const [status, setStatus] = useState<AddStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flash = (s: AddStatus, ms = 1800) => {
    setStatus(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), ms);
  };

  const sizeStock = (label: string) =>
    opts.sizes.find((s) => s.label === label)?.stock ?? 0;
  /** Unidades que todavía se pueden sumar de ese talle */
  const remaining = (label: string) =>
    Math.max(0, sizeStock(label) - inCartForSize(items, product.productId, label));

  const color = colorIdx === null ? undefined : opts.colors[colorIdx];
  const mustChooseModel = opts.colors.length > 1;
  const soldOut = inStock.length === 0;

  function setColorIdx(i: number) {
    setColorIdxState(i);
    if (status === "need-model") setStatus("idle");
  }

  function chooseSize(label: string) {
    if (sizeStock(label) <= 0) return;
    setSize(label);
    if (status === "need-size" || status === "no-stock") setStatus("idle");
  }

  function add(quantity = 1): boolean {
    if (soldOut) return false;
    if (mustChooseModel && !color) {
      flash("need-model", 2200);
      return false;
    }
    if (!size) {
      flash("need-size", 2200);
      return false;
    }
    const added = addToCart({
      ...product,
      // Foto y número de artículo del modelo elegido, si tiene
      imageSrc: color?.imageSrc || product.imageSrc,
      sku: color?.sku || product.sku || undefined,
      wholesalePrice: opts.wholesale?.price,
      wholesaleMinQty: opts.wholesale?.minQty,
      size,
      colorName: color?.name,
      colorHex: color?.hex,
      quantity,
      maxStock: sizeStock(size),
    });
    if (added <= 0) {
      flash("no-stock", 2200);
      return false;
    }
    flash("added");
    return true;
  }

  return {
    size,
    chooseSize,
    colorIdx,
    setColorIdx,
    color,
    status,
    soldOut,
    remaining,
    add,
  };
}
