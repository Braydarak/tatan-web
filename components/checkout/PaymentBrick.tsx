"use client";

/**
 * Formulario de pago de Mercado Pago (Payment Brick) dentro de la web.
 * Los datos de la tarjeta los carga Mercado Pago en sus propios campos:
 * nunca pasan por nuestro servidor.
 *
 * El botón "Pagar" del Brick está oculto: se paga con el botón de la
 * tienda, que pide los datos con `getBrickFormData()` (lib/payment-brick).
 * `onSelectedChange` avisa si ya eligió un medio de pago (para habilitar
 * ese botón).
 *
 * Se carga solo en el navegador (next/dynamic con ssr: false).
 */

import { useEffect, useRef, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { Loader2 } from "lucide-react";
import { MP_PUBLIC_KEY } from "@/lib/payments";

let initialized = false;
function ensureInit() {
  if (initialized || !MP_PUBLIC_KEY) return;
  initMercadoPago(MP_PUBLIC_KEY, { locale: "es-AR" });
  initialized = true;
}

export type BrickPayer = {
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
};

export default function PaymentBrick({
  amount,
  payer,
  onSelectedChange,
  onError,
}: {
  amount: number;
  payer: BrickPayer;
  /** true cuando ya eligió un medio de pago en el formulario */
  onSelectedChange: (selected: boolean) => void;
  onError: (message: string) => void;
}) {
  ensureInit();
  const [ready, setReady] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // El Brick dibuja la lista de medios de pago en la página (solo los campos
  // de la tarjeta van en iframes): se mira qué opción quedó marcada.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !ready) return;
    const check = () => {
      const radios = el.querySelectorAll('input[type="radio"]');
      // Si no hay lista para elegir (un solo medio), ya está elegido
      onSelectedChange(radios.length === 0 || !!el.querySelector('input[type="radio"]:checked'));
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["checked", "aria-checked", "class"] });
    el.addEventListener("change", check);
    el.addEventListener("click", check);
    return () => {
      obs.disconnect();
      el.removeEventListener("change", check);
      el.removeEventListener("click", check);
      onSelectedChange(false);
    };
  }, [ready, onSelectedChange]);

  if (!MP_PUBLIC_KEY) {
    return (
      <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        Falta configurar la Public Key de Mercado Pago (NEXT_PUBLIC_MP_PUBLIC_KEY).
      </p>
    );
  }

  return (
    <div ref={wrapRef} className="relative min-h-40">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando medios de pago…
        </div>
      )}
      <Payment
        initialization={{
          amount,
          payer: {
            email: payer.email,
            firstName: payer.firstName,
            lastName: payer.lastName,
            identification: { type: "DNI", number: payer.dni },
          },
        }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            maxInstallments: 12,
          },
          visual: {
            style: { theme: "default" },
            // Se paga con el botón de la tienda
            hidePaymentButton: true,
            // Que no aparezca el panel de "te vamos a redirigir"
            hideRedirectionPanel: true,
          },
        }}
        onReady={() => setReady(true)}
        onError={(e) => {
          console.error("[PaymentBrick]", e);
          if (e.type === "critical") {
            onError("No pudimos cargar los medios de pago. Recargá la página y probá de nuevo.");
          }
        }}
        // Con el botón oculto no se usa, pero el SDK lo pide
        onSubmit={async () => {}}
      />
    </div>
  );
}
