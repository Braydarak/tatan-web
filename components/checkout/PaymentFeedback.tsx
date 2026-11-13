"use client";

/**
 * Pantalla mientras se procesa el pago: un osito minimalista que pasa la
 * tarjeta. Según cómo sale, salta contento (aprobado), espera con un reloj
 * (pendiente, p. ej. efectivo) o se pone triste (rechazado).
 *
 * El osito está en components/checkout/Bear.tsx.
 */

import { useEffect, useRef } from "react";
import Bear, { type BearPhase } from "@/components/checkout/Bear";

export type FeedbackPhase = BearPhase;

const COPY: Record<FeedbackPhase, { title: string; text: string }> = {
  processing: { title: "Procesando tu pago", text: "El osito está pasando tu tarjeta. No cierres esta página." },
  approved: { title: "¡Pago aprobado!", text: "Gracias por tu compra. Te llevamos al detalle de tu pedido…" },
  pending: { title: "Tu pago quedó pendiente", text: "Te llevamos al detalle para que veas cómo terminar el pago…" },
  rejected: { title: "No se pudo completar el pago", text: "No se cobró nada." },
};

export default function PaymentFeedback({
  phase,
  message,
  onRetry,
}: {
  phase: FeedbackPhase;
  /** Motivo del rechazo (lo que dice el servidor) */
  message?: string;
  onRetry: () => void;
}) {
  const retryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (phase === "rejected") retryRef.current?.focus();
  }, [phase]);

  const c = COPY[phase];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-white/75 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-feedback-title"
    >
      <div className={`paper-card flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl px-6 pb-7 pt-5 text-center shadow-xl`}>
        <Bear phase={phase} />

        <h2 id="pay-feedback-title" className="text-xl font-extrabold text-zinc-800" aria-live="polite">
          {c.title}
          {phase === "processing" && (
            <span className="tb-dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          )}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-600">
          {phase === "rejected" && message ? message : c.text}
          {phase === "rejected" && message && <span className="block text-xs text-zinc-500">{c.text}</span>}
        </p>
        {phase === "rejected" && (
          <button
            ref={retryRef}
            type="button"
            onClick={onRetry}
            className="mt-1 rounded-2xl bg-[#009ee3] px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#0089c7]"
          >
            Probar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}
