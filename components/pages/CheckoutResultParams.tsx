"use client";

import { useSearchParams } from "next/navigation";
import CheckoutResult from "@/components/pages/CheckoutResult";
import type { PaymentStatus } from "@/lib/payments";

/**
 * A dónde vuelve el comprador desde Mercado Pago (back_urls):
 * ?status=approved | pending | failure  (+ la referencia del pedido).
 * Mercado Pago también manda `collection_status`; se acepta cualquiera.
 * Se lee en el navegador (la web es estática).
 */
export default function CheckoutResultParams() {
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) ?? undefined;
  const raw = get("status") ?? get("collection_status") ?? "";
  const status: PaymentStatus =
    raw === "approved" ? "approved" : raw === "pending" || raw === "in_process" ? "pending" : "failure";
  const ref = get("ref") ?? get("external_reference");
  const paymentId = get("payment_id") ?? get("collection_id");
  // Cupón de pago en efectivo (solo de Mercado Pago)
  const rawTicket = get("ticket") ?? "";
  const ticketUrl = /^https:\/\/([a-z0-9-]+\.)*mercadopago\.com(\.ar)?\//i.test(rawTicket) ? rawTicket : undefined;
  return (
    <CheckoutResult status={status} reference={ref} paymentId={paymentId} ticketUrl={ticketUrl} demo={get("demo") === "1"} />
  );
}
