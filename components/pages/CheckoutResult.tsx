"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Bear, { type BearPhase } from "@/components/checkout/Bear";
import { clearCart } from "@/lib/cart";
import { clearShipping } from "@/lib/checkout-state";
import { fetchOrderStatus, type PaymentStatus } from "@/lib/payments";

const COPY: Record<PaymentStatus, { bear: BearPhase; title: string; text: string }> = {
  approved: {
    bear: "approved",
    title: "¡Gracias por tu compra!",
    text: "Tu pago fue aprobado. Te mandamos un email con el detalle y, cuando despachemos el paquete, el código de seguimiento.",
  },
  pending: {
    bear: "pending",
    title: "Tu pago está pendiente",
    text: "Mercado Pago todavía está procesando el pago (por ejemplo, si elegiste pagar en efectivo). Apenas se acredite te avisamos por email y preparamos tu pedido.",
  },
  failure: {
    bear: "rejected",
    title: "No se pudo completar el pago",
    text: "No se cobró nada. Tu carrito sigue guardado: podés intentar de nuevo con otro medio de pago.",
  },
};

/** Estado del pedido en la base → qué mostrarle al comprador */
function fromOrderStatus(s: string): PaymentStatus | null {
  if (s === "paid" || s === "shipped" || s === "delivered") return "approved";
  if (s === "pending") return "pending";
  if (s === "cancelled" || s === "refunded") return "failure";
  return null;
}

export default function CheckoutResult({
  status: urlStatus,
  reference,
  paymentId,
  ticketUrl,
  demo,
}: {
  status: PaymentStatus;
  reference?: string;
  /** Id del pago que manda Mercado Pago al volver */
  paymentId?: string;
  /** Pago en efectivo: cupón para pagar en Rapipago / Pago Fácil */
  ticketUrl?: string;
  demo?: boolean;
}) {
  // Lo que dice la URL se puede tocar a mano: se confirma con el servidor
  const [status, setStatus] = useState<PaymentStatus>(urlStatus);
  // Lo que dice la URL ya lo confirmó el checkout (el modal del osito): se
  // muestra al toque y se verifica con el servidor sin hacer esperar.
  // `checked` = ya respondió el servidor (recién ahí se vacía el carrito).
  const [checked, setChecked] = useState(demo || !reference);
  useEffect(() => {
    if (demo || !reference) return;
    let alive = true;
    void fetchOrderStatus(reference, paymentId).then((res) => {
      if (!alive) return;
      const s = res ? fromOrderStatus(res.status) : null;
      // Si el pago no se rechazó pero el aviso todavía no llegó, queda "pendiente"
      if (s) setStatus(s === "pending" && urlStatus === "failure" ? "failure" : s);
      setChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [demo, reference, paymentId, urlStatus]);

  // Pago aprobado o pendiente: el pedido ya está hecho, se vacía el carrito
  useEffect(() => {
    if (checked && status !== "failure") {
      clearCart();
      clearShipping();
    }
  }, [checked, status]);

  const c = COPY[status];
  return (
    <main className="relative z-10 mx-auto w-full max-w-xl flex-1 px-4 py-12">
      <div className="paper-card flex flex-col items-center gap-4 rounded-3xl px-6 pb-12 pt-8 text-center">
        {/* Mientras se confirma con el servidor, el osito sigue "pasando la tarjeta" */}
        <Bear phase={c.bear} loop className="h-48 w-48" />
        <h1 className="text-2xl font-extrabold text-zinc-800" aria-live="polite">
          {c.title}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600">{c.text}</p>
        {reference && (
          <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-500 ring-1 ring-tatan-secundario1/60">
            Pedido <span className="font-mono text-zinc-700">{reference}</span>
          </p>
        )}
        {ticketUrl && status === "pending" && (
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-[#009ee3] px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#0089c7]"
          >
            Ver el cupón para pagar
          </a>
        )}
        {demo && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            Esto fue una simulación: no se cobró nada ni se creó un pedido.
          </p>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {status === "failure" ? (
            <>
              <Link href="/checkout" className="btn-primary rounded-2xl px-6 py-3 text-sm font-bold">
                Intentar de nuevo
              </Link>
              <Link href="/cart" className="rounded-2xl px-6 py-3 text-sm font-bold text-zinc-600 ring-1 ring-tatan-secundario1 hover:bg-white/70">
                Ver carrito
              </Link>
            </>
          ) : (
            <>
              <Link href="/productos" className="btn-primary rounded-2xl px-6 py-3 text-sm font-bold">
                Seguir comprando
              </Link>
              <Link href="/contacto" className="rounded-2xl px-6 py-3 text-sm font-bold text-zinc-600 ring-1 ring-tatan-secundario1 hover:bg-white/70">
                ¿Dudas? Escribinos
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
