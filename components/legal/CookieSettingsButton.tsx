"use client";

import { openCookieSettings } from "@/lib/cookie-consent";

/** Botón/link para volver a abrir el aviso de cookies */
export default function CookieSettingsButton({
  className = "inline-flex items-center rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold text-zinc-700 hover:bg-tatan-primario1/30",
  label = "Configurar cookies",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {label}
    </button>
  );
}
