import type { Metadata } from "next";
import CheckoutResult from "@/components/pages/CheckoutResult";
import type { PaymentStatus } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Estado de tu compra",
  robots: { index: false, follow: false },
};

/**
 * A dónde vuelve el comprador desde Mercado Pago (back_urls):
 * ?status=approved | pending | failure  (+ la referencia del pedido).
 * Mercado Pago también manda `collection_status`; se acepta cualquiera.
 */
export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const raw = String(sp.status ?? sp.collection_status ?? "");
  const status: PaymentStatus =
    raw === "approved" ? "approved" : raw === "pending" || raw === "in_process" ? "pending" : "failure";
  const ref = typeof sp.ref === "string" ? sp.ref : typeof sp.external_reference === "string" ? sp.external_reference : undefined;
  return <CheckoutResult status={status} reference={ref} demo={sp.demo === "1"} />;
}
