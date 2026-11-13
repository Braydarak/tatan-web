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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { Loader2 } from "lucide-react";
import { MP_PUBLIC_KEY } from "@/lib/payments";

/**
 * Opciones fijas del Brick. Van fuera del componente a propósito: el SDK
 * vuelve a crear el formulario cada vez que cambia la referencia de
 * `initialization`, `customization` o de los callbacks (si se crean en cada
 * render, el formulario se recarga sin parar).
 */
const CUSTOMIZATION = {
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
} as const;

/** Con el botón oculto no se usa, pero el SDK lo pide */
const noopSubmit = async () => {};

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

  // Datos del comprador: se toman al crear el formulario. Si cambian después
  // (escribe en "Tus datos"), no se recarga el formulario por eso.
  const [initialPayer] = useState(payer);
  // Solo un total nuevo crea el formulario de nuevo
  const initialization = useMemo(
    () => ({
      amount,
      payer: {
        email: initialPayer.email,
        firstName: initialPayer.firstName,
        lastName: initialPayer.lastName,
        identification: { type: "DNI", number: initialPayer.dni },
      },
    }),
    [amount, initialPayer],
  );

  // Callbacks estables (las funciones del padre pueden cambiar en cada render)
  const onErrorRef = useRef(onError);
  const onSelectedRef = useRef(onSelectedChange);
  useEffect(() => {
    onErrorRef.current = onError;
    onSelectedRef.current = onSelectedChange;
  });
  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback((e: { type: string }) => {
    console.error("[PaymentBrick]", e);
    if (e.type === "critical") {
      onErrorRef.current("No pudimos cargar los medios de pago. Recargá la página y probá de nuevo.");
    }
  }, []);

  // El Brick dibuja la lista de medios de pago en la página (solo los campos
  // de la tarjeta van en iframes): se mira qué opción quedó marcada.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !ready) return;
    const check = () => {
      const options = el.querySelectorAll('input[type="radio"], [role="radio"]');
      const chosen =
        // El Brick marca la opción elegida con una clase "checked-xxxx" (no con :checked)
        el.querySelector('input[type="radio"][class*="checked"], input[type="radio"]:checked') ||
        el.querySelector('[role="radio"][aria-checked="true"], [aria-selected="true"]') ||
        // Respaldo: aparecieron los campos de la tarjeta (iframes de Mercado Pago)
        // o los datos para el pago en efectivo
        el.querySelector('iframe[src*="mercadopago"], iframe[name*="cardNumber"], input[name*="docNumber"], input[name*="email"]');
      // Si no hay lista para elegir (un solo medio), ya está elegido
      onSelectedRef.current(options.length === 0 || !!chosen);
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
      onSelectedRef.current(false);
    };
  }, [ready]);

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
        initialization={initialization}
        customization={CUSTOMIZATION}
        onReady={handleReady}
        onError={handleError}
        onSubmit={noopSubmit}
      />
    </div>
  );
}
