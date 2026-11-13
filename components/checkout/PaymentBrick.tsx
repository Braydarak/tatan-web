"use client";

/**
 * Formulario de pago de Mercado Pago (Payment Brick) dentro de la web.
 * Los datos de la tarjeta los carga Mercado Pago en sus propios campos:
 * nunca pasan por nuestro servidor. Al enviar, devuelve un token que
 * `checkout.php?action=pay` usa para cobrar.
 *
 * Se carga solo en el navegador (next/dynamic con ssr: false).
 */

import { useState } from "react";
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
  onSubmit,
  onError,
}: {
  amount: number;
  payer: BrickPayer;
  /** Recibe los datos del Brick (token, medio de pago, cuotas…) */
  onSubmit: (formData: unknown) => Promise<void>;
  onError: (message: string) => void;
}) {
  ensureInit();
  const [ready, setReady] = useState(false);

  if (!MP_PUBLIC_KEY) {
    return (
      <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        Falta configurar la Public Key de Mercado Pago (NEXT_PUBLIC_MP_PUBLIC_KEY).
      </p>
    );
  }

  return (
    <div className="relative min-h-40">
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
        onSubmit={({ formData }) => onSubmit(formData)}
      />
    </div>
  );
}
