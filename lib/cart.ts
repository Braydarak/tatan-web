"use client";

import { useSyncExternalStore } from "react";

/**
 * Carrito de la tienda. Vive en el navegador (localStorage), así sobrevive a
 * recargas y se sincroniza entre pestañas. No toca la API.
 */

export type CartItem = {
  /** productId + talle + color */
  key: string;
  productId: string;
  name: string;
  imageSrc: string;
  unitPrice: number;
  size: string;
  colorName?: string;
  colorHex?: string;
  /** Número de artículo del modelo (o del producto) */
  sku?: string;
  quantity: number;
  /** Stock del talle cuando se agregó (tope de cantidad) */
  maxStock: number;
  /** Precio por mayor y desde cuántas unidades (del producto) */
  wholesalePrice?: number;
  wholesaleMinQty?: number;
};

export type AddToCartInput = Omit<CartItem, "key" | "quantity"> & {
  quantity?: number;
};

const STORAGE_KEY = "tatan-cart-v1";
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    items = Array.isArray(parsed)
      ? parsed.filter((i) => i && i.key && i.quantity > 0)
      : [];
  } catch {
    items = [];
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    emit();
  });
}

function emit() {
  for (const l of listeners) l();
}

function commit(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // modo privado o sin espacio: el carrito sigue funcionando en memoria
  }
  emit();
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  load();
  return items;
}

function getServerSnapshot() {
  return EMPTY;
}

export function itemKey(productId: string, size: string, colorName?: string) {
  return `${productId}__${size}__${colorName ?? ""}`;
}

/** Agrega (o suma) respetando el stock. Devuelve cuántas unidades sumó. */
export function addToCart(input: AddToCartInput): number {
  load();
  const key = itemKey(input.productId, input.size, input.colorName);
  const qty = Math.max(1, input.quantity ?? 1);
  // El tope es el stock del talle, sumando todos los colores de ese talle
  const sameSize = items
    .filter(
      (i) =>
        i.productId === input.productId && i.size === input.size && i.key !== key,
    )
    .reduce((a, i) => a + i.quantity, 0);
  const existing = items.find((i) => i.key === key);
  const current = existing?.quantity ?? 0;
  const room = Math.max(0, input.maxStock - sameSize - current);
  const added = Math.min(qty, room);
  if (added <= 0) return 0;

  const next = existing
    ? items.map((i) =>
        i.key === key
          ? { ...i, quantity: i.quantity + added, maxStock: input.maxStock }
          : i,
      )
    : [...items, { ...input, key, quantity: added }];
  commit(next);
  window.dispatchEvent(
    new CustomEvent("tatan:cart-added", {
      detail: { name: input.name, size: input.size, colorName: input.colorName },
    }),
  );
  return added;
}

export function setQuantity(key: string, quantity: number) {
  const item = items.find((i) => i.key === key);
  if (!item) return;
  const sameSize = items
    .filter(
      (i) =>
        i.productId === item.productId && i.size === item.size && i.key !== key,
    )
    .reduce((a, i) => a + i.quantity, 0);
  const q = Math.min(quantity, Math.max(1, item.maxStock - sameSize));
  if (q <= 0) return removeFromCart(key);
  commit(items.map((i) => (i.key === key ? { ...i, quantity: q } : i)));
}

export function removeFromCart(key: string) {
  commit(items.filter((i) => i.key !== key));
}

export function clearCart() {
  commit([]);
}

/** Cuántas unidades de ese producto+talle hay en el carrito (todos los colores). */
export function inCartForSize(
  list: CartItem[],
  productId: string,
  size: string,
) {
  return list
    .filter((i) => i.productId === productId && i.size === size)
    .reduce((a, i) => a + i.quantity, 0);
}

export function openCart() {
  window.dispatchEvent(new Event("tatan:open-cart"));
}

export function useCart() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = list.reduce((a, i) => a + i.quantity, 0);
  const subtotal = list.reduce((a, i) => a + i.unitPrice * i.quantity, 0);
  return { items: list, count, subtotal };
}

export function formatArs(n: number) {
  return `$ ${Math.round(n).toLocaleString("es-AR")}`;
}
