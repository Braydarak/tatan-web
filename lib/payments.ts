/**
 * Pago con Mercado Pago, dentro de la web (Payment Brick: el comprador no
 * sale de la tienda).
 *
 *  1. `createOrder`: el navegador manda productos, envío elegido y datos del
 *     comprador a `php-api/checkout.php?action=create`. El PHP recalcula
 *     precios, stock y envío (no confía en el navegador), guarda el pedido
 *     como "pending" y devuelve el número de pedido y el total real.
 *  2. Se muestra el Payment Brick con ese total. Los datos de la tarjeta los
 *     maneja Mercado Pago (nunca pasan por nuestro servidor): el Brick
 *     devuelve un token.
 *  3. `payOrder`: el navegador manda el token a `checkout.php?action=pay`,
 *     que cobra con la API de Orders de Mercado Pago y el Access Token
 *     (secreto, solo en el servidor) por el total guardado en el pedido.
 *  4. `php-api/mp-webhook.php` confirma los cambios posteriores (p. ej. un
 *     pago en efectivo que se acredita días después).
 *
 * Con NEXT_PUBLIC_PAYMENTS_DEMO=1 el pago se simula (no se cobra nada).
 */

import type { CartItem } from "@/lib/cart";
import type { Branch, ShippingQuote } from "@/lib/shipping";
import { apiBaseUrl } from "@/lib/tatan-api";

export const PAYMENTS_DEMO = process.env.NEXT_PUBLIC_PAYMENTS_DEMO === "1";
/** Public Key de Mercado Pago (es pública: va en el navegador) */
export const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

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

/** Pedido creado en el servidor, listo para pagar */
export type CreatedOrder = {
  orderNumber: string;
  subtotal: number;
  shipping: number;
  /** Total real (calculado por el servidor): es lo que se cobra */
  total: number;
};

export type PaymentStatus = "approved" | "pending" | "failure";

export type PayResult = {
  orderNumber: string;
  status: "approved" | "pending" | "rejected";
  statusDetail: string;
  /** Si se rechazó: qué decirle al comprador */
  message?: string;
  /** Efectivo (Rapipago / Pago Fácil): cupón para pagar */
  ticketUrl?: string;
};

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

async function checkoutApi<T>(action: string, body: unknown, fallback: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/checkout.php?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CheckoutError("No pudimos conectar con el servidor. Revisá tu conexión y probá de nuevo.");
  }
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; data?: T; error?: string; message?: string }
    | null;
  if (!res.ok || !json?.ok || !json.data) {
    throw new CheckoutError(json?.message || fallback, json?.error);
  }
  return json.data;
}

/** Guarda el pedido en el servidor (con precios y envío recalculados). */
export async function createOrder(order: CheckoutOrder): Promise<CreatedOrder> {
  if (PAYMENTS_DEMO) {
    await wait(600);
    return {
      orderNumber: `DEMO-${Date.now().toString(36).toUpperCase()}`,
      ...order.totals,
    };
  }
  return checkoutApi<CreatedOrder>(
    "create",
    {
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
    },
    "No pudimos preparar tu pedido. Probá de nuevo en un momento.",
  );
}

/** Cobra el pedido con los datos del Payment Brick (token de la tarjeta, etc.). */
export async function payOrder(
  orderNumber: string,
  formData: unknown,
  /** credit_card, debit_card, ticket… (lo da el Brick) */
  paymentType = "",
): Promise<PayResult> {
  if (PAYMENTS_DEMO) {
    await wait(900);
    return { orderNumber, status: "approved", statusDetail: "accredited" };
  }
  return checkoutApi<PayResult>(
    "pay",
    {
      orderNumber,
      paymentType,
      formData,
      // Si el navegador reenvía el mismo intento, no se cobra dos veces
      attemptId: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
    },
    "No pudimos procesar el pago. Probá de nuevo en un momento.",
  );
}

/** A dónde mandar al comprador después de pagar */
export function resultUrl(r: PayResult, demo = false): string {
  const qs = new URLSearchParams({
    status: r.status === "rejected" ? "failure" : r.status,
    ref: r.orderNumber,
  });
  if (r.ticketUrl) qs.set("ticket", r.ticketUrl);
  if (demo) qs.set("demo", "1");
  return `/checkout/resultado?${qs}`;
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
  "Tarjetas de crédito, en cuotas",
  "Tarjetas de débito",
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
