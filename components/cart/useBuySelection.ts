"use client";

import { useEffect, useRef, useState } from "react";
import { colorSoldOut, type BuyOptions, type SizeOption } from "@/lib/buy-options";
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
  // Con un solo modelo/color ya viene elegido; con varios, hay que elegir
  const [colorIdx, setColorIdxState] = useState<number | null>(
    opts.colors.length > 1 ? null : 0,
  );
  const firstColor = opts.colors.length > 1 ? undefined : opts.colors[0];
  // Si hay un solo talle con stock (del color ya elegido), ya viene elegido
  const [size, setSize] = useState<string | null>(() => {
    const avail = inStock.filter(
      (s) => !opts.perColor || !firstColor || (firstColor.stock?.[s.label] ?? 0) > 0,
    );
    return avail.length === 1 ? avail[0].label : null;
  });
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

  const color = colorIdx === null ? undefined : opts.colors[colorIdx];
  // Stock por color: el talle tiene el stock del color elegido
  const byColor = opts.perColor && color ? color : undefined;

  const sizeStock = (label: string) =>
    byColor
      ? Math.max(0, Number(byColor.stock?.[label]) || 0)
      : (opts.sizes.find((s) => s.label === label)?.stock ?? 0);
  /** Unidades que todavía se pueden sumar de ese talle (y color) */
  const remaining = (label: string) =>
    Math.max(
      0,
      sizeStock(label) -
        inCartForSize(items, product.productId, label, byColor ? byColor.name : undefined),
    );
  /** Talles a mostrar (los que hay en algún color) con el stock del color elegido */
  const sizes: SizeOption[] = inStock.map((s) => ({
    label: s.label,
    stock: sizeStock(s.label),
  }));
  const isColorSoldOut = (i: number) => {
    const c = opts.colors[i];
    return !!c && colorSoldOut(opts, c);
  };
  const mustChooseModel = opts.colors.length > 1;
  const soldOut = inStock.length === 0;

  function setColorIdx(i: number) {
    if (isColorSoldOut(i)) return;
    setColorIdxState(i);
    if (status === "need-model") setStatus("idle");
    // Si el talle elegido no hay en este color, se deselecciona
    const c = opts.colors[i];
    if (opts.perColor && c) {
      const avail = inStock.filter((s) => (c.stock?.[s.label] ?? 0) > 0);
      if (size && (c.stock?.[size] ?? 0) <= 0) {
        setSize(avail.length === 1 ? avail[0].label : null);
      } else if (!size && avail.length === 1) {
        setSize(avail[0].label);
      }
    }
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
      stockPerColor: !!byColor,
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
    /** Talles con stock en algún color; `stock` = del color elegido */
    sizes,
    isColorSoldOut,
    add,
  };
}
