"use client";

/**
 * Estado del checkout que se comparte entre el carrito y /checkout:
 * código postal, tarifas cotizadas, la tarifa elegida y la sucursal.
 * Se guarda en sessionStorage (dura mientras la pestaña esté abierta).
 */

import { useSyncExternalStore } from "react";
import type { Branch, ShippingQuote } from "@/lib/shipping";

export type ShippingState = {
  postalCode: string;
  quotes: ShippingQuote[];
  /** Firma del carrito con la que se cotizó (si cambia, hay que recotizar) */
  cartSig: string;
  selectedId: string | null;
  branch: Branch | null;
};

const KEY = "tatan:checkout-shipping";
const EMPTY: ShippingState = {
  postalCode: "",
  quotes: [],
  cartSig: "",
  selectedId: null,
  branch: null,
};

let state: ShippingState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as ShippingState) };
  } catch {}
}

export function setShipping(patch: Partial<ShippingState>) {
  load();
  state = { ...state, ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

export function clearShipping() {
  setShipping(EMPTY);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useShipping(): ShippingState {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

/** La tarifa elegida (si sigue entre las cotizadas) */
export function selectedQuote(s: ShippingState): ShippingQuote | null {
  return s.quotes.find((q) => q.id === s.selectedId) ?? null;
}

/** Firma del carrito para saber si la cotización quedó vieja (cambian unidades). */
export function cartSignature(items: { key: string; quantity: number }[]): string {
  return items
    .map((i) => `${i.key}:${i.quantity}`)
    .sort()
    .join("|");
}
