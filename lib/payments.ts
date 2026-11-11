/**
 * Pago con Mercado Pago (Checkout Pro).
 *
 * Flujo real (a conectar):
 *  1. El navegador manda el pedido (productos, envío elegido, datos del
 *     comprador) a un endpoint PHP propio, p. ej. `checkout.php`.
 *  2. El PHP recalcula precios y envío del lado del servidor (no confiar en
 *     lo que manda el navegador), crea la "preferencia" en Mercado Pago con
 *     el Access Token (secreto, solo en el servidor) y devuelve `init_point`.
 *  3. El navegador redirige a `init_point`. El comprador paga en Mercado Pago.
 *  4. Mercado Pago vuelve a /checkout/resultado?status=approved|pending|failure
 *     (back_urls) y avisa al PHP por webhook para confirmar el pago, descontar
 *     stock y crear el envío en Enviopack.
 *
 * ⚠️ Todavía NO está conectado (PAYMENTS_DEMO): `startCheckout` simula el
 * paso 1-3 y manda directo a la página de resultado, sin cobrar nada.
 */

import type { CartItem } from "@/lib/cart";
import type { Branch, ShippingQuote } from "@/lib/shipping";

export const PAYMENTS_DEMO = true;

export type Buyer = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  /** DNI: lo piden los correos para entregar */
  dni: string;
};

export type ShippingAddress = {
  street: string;
  number: string;
  floor?: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
};

export type CheckoutOrder = {
  buyer: Buyer;
  items: CartItem[];
  shipping: {
    quote: ShippingQuote;
    address?: ShippingAddress;
    branch?: Branch;
  };
  /** Lo que el comprador vio (el servidor lo recalcula igual) */
  totals: { subtotal: number; shipping: number; total: number };
};

export type PaymentStatus = "approved" | "pending" | "failure";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Crea el pago y devuelve a dónde mandar al comprador. */
export async function startCheckout(order: CheckoutOrder): Promise<{ redirectUrl: string }> {
  // ---- DEMO: reemplazar por la llamada al endpoint PHP ------------------
  await wait(900);
  const ref = `DEMO-${Date.now().toString(36).toUpperCase()}`;
  const qs = new URLSearchParams({
    status: "approved",
    ref,
    demo: "1",
    total: String(order.totals.total),
  });
  return { redirectUrl: `/checkout/resultado?${qs}` };
  // -----------------------------------------------------------------------
}

/** Medios que acepta Mercado Pago (para mostrar en el checkout) */
export const PAYMENT_METHODS = [
  "Tarjetas de crédito y débito",
  "Dinero en cuenta de Mercado Pago",
  "Cuotas sin tarjeta (Mercado Crédito)",
  "Efectivo en Rapipago o Pago Fácil",
];

export const PROVINCES = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];
