"use client";

/**
 * Aviso de cookies: aparece la primera vez (y otra vez a los 12 meses o si
 * el visitante lo abre desde "Configurar cookies"). Permite aceptar todas,
 * solo las necesarias o elegir por categoría. Ver lib/cookie-consent.ts.
 */

import * as React from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import {
  getCookieConsent,
  OPEN_SETTINGS_EVENT,
  saveCookieConsent,
} from "@/lib/cookie-consent";

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-tatan-acento-verde" : "bg-zinc-300"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

const CATEGORIES = [
  {
    key: "necessary" as const,
    title: "Necesarias",
    text: "Carrito, datos del checkout y seguridad del pago. Sin estas la tienda no funciona.",
  },
  {
    key: "analytics" as const,
    title: "Estadísticas",
    text: "Para saber qué se mira más y mejorar la tienda. Hoy no usamos ninguna.",
  },
  {
    key: "marketing" as const,
    title: "Marketing",
    text: "Para mostrarte publicidad relevante en otras webs y redes. Hoy no usamos ninguna.",
  },
];

export default function CookieConsent() {
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState(false);
  const [choice, setChoice] = React.useState({ analytics: false, marketing: false });

  React.useEffect(() => {
    // La primera vez (o si la elección venció) se muestra solo, con una
    // pequeña demora para no aparecer de golpe al cargar la página
    const timer = getCookieConsent() ? undefined : window.setTimeout(() => setOpen(true), 600);
    const reopen = () => {
      const c = getCookieConsent();
      setChoice({ analytics: c?.analytics ?? false, marketing: c?.marketing ?? false });
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
    };
  }, []);

  if (!open) return null;

  const save = (c: { analytics: boolean; marketing: boolean }) => {
    saveCookieConsent(c);
    setOpen(false);
    setCustom(false);
  };
  // Cerrar sin elegir = solo necesarias
  const close = () => (getCookieConsent() ? setOpen(false) : save({ analytics: false, marketing: false }));

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookies-title"
      className="fixed inset-x-3 bottom-3 z-[150] sm:left-auto sm:right-5 sm:bottom-5 sm:w-[420px]"
    >
      <div className="relative rounded-3xl border border-tatan-secundario1/60 bg-[#FFFDF9] p-5 shadow-[0_18px_48px_-16px_rgba(103,90,80,0.35)]">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2.5 pr-8">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-tatan-primario1/60 text-tatan-secundario2">
            <Cookie className="h-5 w-5" strokeWidth={2} />
          </span>
          <h2 id="cookies-title" className="font-[family-name:var(--font-fredoka)] text-lg font-bold text-zinc-800">
            ¿Aceptás las cookies?
          </h2>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">
          Usamos lo necesario para que la tienda funcione (como tu carrito). Las cookies de estadísticas y marketing son opcionales y solo se activan si las aceptás.{" "}
          <Link href="/legal/cookies" className="font-semibold text-zinc-800 underline underline-offset-2">
            Más info
          </Link>
        </p>

        {custom && (
          <ul className="mt-4 space-y-3">
            {CATEGORIES.map((c) => {
              const checked = c.key === "necessary" ? true : choice[c.key];
              return (
                <li key={c.key} className="flex items-start gap-3 rounded-2xl bg-white p-3 border border-black/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-800">
                      {c.title}
                      {c.key === "necessary" && <span className="ml-1.5 text-xs font-semibold text-zinc-400">siempre activas</span>}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{c.text}</p>
                  </div>
                  <Toggle
                    label={c.title}
                    checked={checked}
                    disabled={c.key === "necessary"}
                    onChange={(v) => c.key !== "necessary" && setChoice((s) => ({ ...s, [c.key]: v }))}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {custom ? (
            <button
              type="button"
              onClick={() => save(choice)}
              className="flex-1 rounded-2xl bg-gradient-to-br from-tatan-primario1 to-tatan-primario2 px-4 py-2.5 text-sm font-extrabold text-zinc-900 hover:brightness-[1.03]"
            >
              Guardar mi elección
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save({ analytics: true, marketing: true })}
              className="flex-1 rounded-2xl bg-gradient-to-br from-tatan-primario1 to-tatan-primario2 px-4 py-2.5 text-sm font-extrabold text-zinc-900 hover:brightness-[1.03]"
            >
              Aceptar todas
            </button>
          )}
          <button
            type="button"
            onClick={() => save({ analytics: false, marketing: false })}
            className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
          >
            Solo las necesarias
          </button>
        </div>
        {!custom && (
          <button
            type="button"
            onClick={() => setCustom(true)}
            className="mt-2 w-full text-center text-xs font-semibold text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
          >
            Elegir cuáles
          </button>
        )}
      </div>
    </div>
  );
}
