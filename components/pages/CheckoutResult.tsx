"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { clearCart } from "@/lib/cart";
import { clearShipping } from "@/lib/checkout-state";
import type { PaymentStatus } from "@/lib/payments";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

const COPY: Record<
  PaymentStatus,
  { icon: typeof CheckCircle2; ring: string; title: string; text: string }
> = {
  approved: {
    icon: CheckCircle2,
    ring: "bg-tatan-primario2 text-emerald-800",
    title: "¡Gracias por tu compra!",
    text: "Tu pago fue aprobado. Te mandamos un email con el detalle y, cuando despachemos el paquete, el código de seguimiento.",
  },
  pending: {
    icon: Clock,
    ring: "bg-tatan-acento-amarillo/70 text-amber-800",
    title: "Tu pago está pendiente",
    text: "Mercado Pago todavía está procesando el pago (por ejemplo, si elegiste pagar en efectivo). Apenas se acredite te avisamos por email y preparamos tu pedido.",
  },
  failure: {
    icon: XCircle,
    ring: "bg-rose-100 text-rose-700",
    title: "No se pudo completar el pago",
    text: "No se cobró nada. Tu carrito sigue guardado: podés intentar de nuevo con otro medio de pago.",
  },
};

export default function CheckoutResult({
  status,
  reference,
  demo,
}: {
  status: PaymentStatus;
  reference?: string;
  demo?: boolean;
}) {
  // Pago aprobado o pendiente: el pedido ya está hecho, se vacía el carrito
  useEffect(() => {
    if (status !== "failure") {
      clearCart();
      clearShipping();
    }
  }, [status]);

  const c = COPY[status];
  const Icon = c.icon;
  return (
    <main className="relative z-10 mx-auto w-full max-w-xl flex-1 px-4 py-12">
      <div className="paper-card flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center">
        <div className={cx("flex h-20 w-20 items-center justify-center rounded-full", c.ring)}>
          <Icon className="h-10 w-10" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-800">{c.title}</h1>
        <p className="text-sm leading-relaxed text-zinc-600">{c.text}</p>
        {reference && (
          <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-500 ring-1 ring-tatan-secundario1/60">
            Pedido <span className="font-mono text-zinc-700">{reference}</span>
          </p>
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
