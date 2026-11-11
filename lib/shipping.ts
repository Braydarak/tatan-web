/**
 * Envíos: cotización de tarifas y sucursales.
 *
 * Pensado para Enviopack: cada tarifa es un correo + un servicio (estándar o
 * prioritario) + una modalidad (a domicilio o retiro en sucursal del correo),
 * con su precio y plazo. El comprador elige la que le convenga.
 *
 * Las tarifas y sucursales son reales: salen de `php-api/shipping.php`, que
 * habla con Enviopack con las claves de `php-api/secrets.php` (en el
 * servidor, nunca en el navegador).
 *
 * Con NEXT_PUBLIC_SHIPPING_DEMO=1 se usan datos de ejemplo (para probar la
 * pantalla sin la API).
 */

import type { CartItem } from "@/lib/cart";
import { apiBaseUrl } from "@/lib/tatan-api";

export const SHIPPING_DEMO = process.env.NEXT_PUBLIC_SHIPPING_DEMO === "1";

/** Pide algo a php-api/shipping.php y devuelve `data` (o un error legible). */
async function shippingApi<T>(params: Record<string, string>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/shipping.php?${new URLSearchParams(params)}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("No pudimos calcular el envío. Revisá tu conexión y probá de nuevo.");
  }
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; data?: T; message?: string }
    | null;
  if (!res.ok || !json?.ok || json.data === undefined) {
    throw new Error(json?.message || "No pudimos calcular el envío. Probá de nuevo en un momento.");
  }
  return json.data;
}

/** A domicilio, retiro en sucursal del correo o retiro sin cargo en Tatan */
export type ShippingMode = "domicilio" | "sucursal" | "retiro";

export type ShippingQuote = {
  /** Único por correo + servicio + modalidad */
  id: string;
  carrierId: string;
  carrier: string;
  service: "estandar" | "prioritario";
  mode: ShippingMode;
  /** Precio final en ARS (0 = sin cargo) */
  price: number;
  /** Días hábiles desde que se despacha */
  days: { min: number; max: number };
};

export type Branch = {
  id: string;
  carrierId: string;
  name: string;
  address: string;
  city: string;
  hours?: string;
  distanceKm?: number;
};

/**
 * Retiro sin cargo coordinado con Tatan. Se ofrece como una tarifa más.
 * Desactivado (Tatan no ofrece retiro). Poner `enabled: true` para mostrarlo.
 */
export const STORE_PICKUP = {
  enabled: false,
  label: "Retiro sin cargo",
  detail: "Coordinamos día y lugar por WhatsApp",
};

/** Código postal argentino: 4 números ("1425") o CPA ("C1425ABC"). Devuelve los 4 números o null. */
export function normalizePostalCode(input: string): string | null {
  const s = input.trim().toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^[A-Z]?(\d{4})[A-Z]{0,3}$/);
  return m ? m[1] : null;
}

/** Peso estimado del paquete (kg): prendas de bebé, ~150 g c/u + caja. */
export function packageWeightKg(items: Pick<CartItem, "quantity">[]): number {
  const units = items.reduce((a, i) => a + i.quantity, 0);
  return Math.max(0.5, Math.round((0.2 + units * 0.15) * 10) / 10);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tarifas para ese código postal y ese carrito. */
export async function quoteShipping(
  postalCode: string,
  items: Pick<CartItem, "quantity">[],
): Promise<ShippingQuote[]> {
  const cp = normalizePostalCode(postalCode);
  if (!cp) throw new Error("Revisá el código postal");

  if (!SHIPPING_DEMO) {
    const units = items.reduce((a, i) => a + i.quantity, 0);
    const quotes = await shippingApi<ShippingQuote[]>({
      action: "quote",
      cp,
      units: String(Math.max(1, units)),
    });
    if (!quotes.length) {
      throw new Error("No hay envíos disponibles para ese código postal");
    }
    return quotes;
  }

  // ---- Datos de ejemplo (NEXT_PUBLIC_SHIPPING_DEMO=1) --------------------
  await wait(700);
  const n = Number(cp);
  // AMBA más barato y rápido; el resto según lo lejos
  const zone = n < 2000 ? 0 : n < 5000 ? 1 : n < 8000 ? 2 : 3;
  const kg = packageWeightKg(items);
  const base = [4200, 5600, 6900, 8400][zone] + Math.round(kg * 900);
  const days = [
    { min: 1, max: 3 },
    { min: 2, max: 5 },
    { min: 3, max: 6 },
    { min: 4, max: 8 },
  ][zone];
  const round = (v: number) => Math.round(v / 10) * 10;
  const q = (
    carrierId: string,
    carrier: string,
    service: ShippingQuote["service"],
    mode: ShippingMode,
    factor: number,
    extraDays = 0,
  ): ShippingQuote => ({
    id: `${carrierId}-${service}-${mode}`,
    carrierId,
    carrier,
    service,
    mode,
    price: round(base * factor),
    days:
      service === "prioritario"
        ? { min: Math.max(1, days.min - 1), max: Math.max(2, days.max - 2) }
        : { min: days.min + extraDays, max: days.max + extraDays },
  });
  const quotes = [
    q("correo-argentino", "Correo Argentino", "estandar", "domicilio", 1),
    q("correo-argentino", "Correo Argentino", "estandar", "sucursal", 0.72),
    q("andreani", "Andreani", "estandar", "domicilio", 1.12),
    q("andreani", "Andreani", "prioritario", "domicilio", 1.45),
    q("andreani", "Andreani", "estandar", "sucursal", 0.8),
    q("oca", "OCA", "estandar", "domicilio", 1.05, 1),
    q("oca", "OCA", "estandar", "sucursal", 0.76, 1),
  ];
  // -----------------------------------------------------------------------

  if (STORE_PICKUP.enabled) {
    quotes.push({
      id: "tatan-retiro",
      carrierId: "tatan",
      carrier: "Tatan",
      service: "estandar",
      mode: "retiro",
      price: 0,
      days: { min: 1, max: 2 },
    });
  }
  return quotes.sort((a, b) => a.price - b.price);
}

/** Sucursales del correo cerca de ese código postal (para retiro en sucursal). */
export async function listBranches(
  postalCode: string,
  carrierId: string,
): Promise<Branch[]> {
  const cp = normalizePostalCode(postalCode);
  if (!cp) return [];

  if (!SHIPPING_DEMO) {
    return shippingApi<Branch[]>({ action: "branches", cp, carrier: carrierId });
  }

  // ---- Datos de ejemplo (NEXT_PUBLIC_SHIPPING_DEMO=1) --------------------
  await wait(500);
  const names: Record<string, string> = {
    "correo-argentino": "Correo Argentino",
    andreani: "Andreani",
    oca: "OCA",
  };
  const carrier = names[carrierId] ?? "Sucursal";
  return [
    { street: "Av. Rivadavia 4520", km: 0.8 },
    { street: "Av. Corrientes 2850", km: 1.6 },
    { street: "Av. Santa Fe 1730", km: 2.9 },
  ].map((b, i) => ({
    id: `${carrierId}-${cp}-${i}`,
    carrierId,
    name: `${carrier} · Sucursal ${i + 1}`,
    address: b.street,
    city: `CP ${cp}`,
    hours: "Lun a vie 9 a 18 h · Sáb 9 a 13 h",
    distanceKm: b.km,
  }));
  // -----------------------------------------------------------------------
}

export function modeLabel(mode: ShippingMode): string {
  return mode === "domicilio"
    ? "Envío a domicilio"
    : mode === "sucursal"
      ? "Retiro en sucursal"
      : STORE_PICKUP.label;
}

export function daysLabel({ min, max }: ShippingQuote["days"]): string {
  if (min === max) return `${min} ${min === 1 ? "día hábil" : "días hábiles"}`;
  return `${min} a ${max} días hábiles`;
}
