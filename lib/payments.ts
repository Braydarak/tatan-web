/**
 * Pago con Mercado Pago (Checkout Pro).
 *
 *  1. El navegador manda el pedido (productos, envío elegido, datos del
 *     comprador) a `php-api/checkout.php`.
 *  2. El PHP recalcula precios, stock y envío del lado del servidor (no
 *     confía en lo que manda el navegador), guarda el pedido como
 *     "pending", crea la "preferencia" en Mercado Pago con el Access Token
 *     (secreto, solo en el servidor) y devuelve `init_point`.
 *  3. El navegador redirige a `init_point`. El comprador paga en Mercado Pago.
 *  4. Mercado Pago vuelve a /checkout/resultado (back_urls) y avisa a
 *     `php-api/mp-webhook.php`, que confirma el pago y descuenta el stock.
 *
 * Con NEXT_PUBLIC_PAYMENTS_DEMO=1 el pago se simula (no se cobra nada).
 */

import type { CartItem } from "@/lib/cart";
import type { Branch, ShippingQuote } from "@/lib/shipping";
import { apiBaseUrl } from "@/lib/tatan-api";

export const PAYMENTS_DEMO = process.env.NEXT_PUBLIC_PAYMENTS_DEMO === "1";

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
    postalCode: string;
    address?: ShippingAddress;
    branch?: Branch;
  };
  /** Lo que el comprador vio (el servidor lo recalcula igual) */
  totals: { subtotal: number; shipping: number; total: number };
};

export type PaymentStatus = "approved" | "pending" | "failure";

/** Error que se le puede mostrar al comprador tal cual */
export class CheckoutError extends Error {
  constructor(
    message: string,
    /** Código del servidor (p. ej. OUT_OF_STOCK, SHIPPING_CHANGED) */
    public code?: string,
  ) {
    super(message);
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Crea el pedido y el pago, y devuelve a dónde mandar al comprador. */
export async function startCheckout(order: CheckoutOrder): Promise<{ redirectUrl: string }> {
  if (PAYMENTS_DEMO) {
    await wait(900);
    const ref = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    const qs = new URLSearchParams({
      status: "approved",
      ref,
      demo: "1",
      total: String(order.totals.total),
    });
    return { redirectUrl: `/checkout/resultado?${qs}` };
  }

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/checkout.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        buyer: order.buyer,
        // Solo qué y cuánto: el precio lo pone el servidor
        items: order.items.map((i) => ({
          productId: i.productId,
          size: i.size,
          colorName: i.colorName ?? "",
          quantity: i.quantity,
        })),
        shipping: {
          quoteId: order.shipping.quote.id,
          postalCode: order.shipping.postalCode,
          address: order.shipping.address,
          branchId: order.shipping.branch?.id,
        },
      }),
    });
  } catch {
    throw new CheckoutError("No pudimos conectar con el servidor. Revisá tu conexión y probá de nuevo.");
  }
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; data?: { redirectUrl?: string }; error?: string; message?: string }
    | null;
  const redirectUrl = json?.data?.redirectUrl;
  if (!res.ok || !json?.ok || !redirectUrl) {
    throw new CheckoutError(
      json?.message || "No pudimos iniciar el pago. Probá de nuevo en un momento.",
      json?.error,
    );
  }
  return { redirectUrl };
}

/** Estado real del pedido (lo confirma el servidor con Mercado Pago). */
export async function fetchOrderStatus(
  reference: string,
  paymentId?: string,
): Promise<{ status: string; total: number } | null> {
  const qs = new URLSearchParams({ action: "status", ref: reference });
  if (paymentId) qs.set("payment_id", paymentId);
  try {
    const res = await fetch(`${apiBaseUrl()}/mp-webhook.php?${qs}`, {
      headers: { Accept: "application/json" },
    });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: { status: string; total: number } }
      | null;
    return res.ok && json?.ok && json.data ? json.data : null;
  } catch {
    return null;
  }
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
