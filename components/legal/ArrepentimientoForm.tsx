"use client";

/**
 * Formulario del botón de arrepentimiento (Res. SCI 424/2020): sin cuenta
 * ni registro. Al enviarlo se muestra el código de identificación del
 * trámite (y llega por mail). Ver php-api/arrepentimiento.php.
 */

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiBaseUrl } from "@/lib/tatan-api";
import { LEGAL } from "@/lib/legal";

const input =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/50";
const label = "block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5";

export default function ArrepentimientoForm() {
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [code, setCode] = React.useState("");
  const [mailed, setMailed] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState("sending");
    setError("");
    try {
      const res = await fetch(`${apiBaseUrl()}/arrepentimiento.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { ok?: boolean; code?: string; mailed?: boolean; message?: string; errors?: string[] };
      if (!json.ok || !json.code) {
        setError(
          json.message ??
            (json.errors?.includes("EMAIL") ? "Revisá tu mail." : json.errors?.includes("NAME") ? "Escribí tu nombre y apellido." : "No pudimos enviar la solicitud."),
        );
        setState("error");
        return;
      }
      setCode(json.code);
      setMailed(!!json.mailed);
      setState("done");
    } catch {
      setError(`No pudimos enviar la solicitud. Escribinos a ${LEGAL.email}.`);
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="text-center not-prose">
        <CheckCircle2 className="mx-auto h-12 w-12 text-tatan-acento-verde" strokeWidth={1.8} />
        <h2 className="mt-3 font-[family-name:var(--font-fredoka)] text-2xl font-bold text-zinc-800">Recibimos tu solicitud</h2>
        <p className="mt-2 text-zinc-600">Este es el código de tu trámite. Guardalo:</p>
        <p className="mt-3 inline-block rounded-2xl bg-tatan-primario2/60 px-5 py-3 font-mono text-xl font-bold tracking-wide text-zinc-800">{code}</p>
        <p className="mt-4 text-sm text-zinc-600">
          {mailed ? "También te lo mandamos por mail. " : null}
          Te escribimos para coordinar la devolución. Los gastos de envío de la devolución están a nuestro cargo y te reintegramos el total pagado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Campo trampa para bots (invisible para las personas) */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="arr-name">Nombre y apellido *</label>
          <input id="arr-name" name="name" required minLength={2} className={input} autoComplete="name" />
        </div>
        <div>
          <label className={label} htmlFor="arr-email">Mail *</label>
          <input id="arr-email" name="email" type="email" required className={input} autoComplete="email" placeholder="El que usaste para comprar" />
        </div>
        <div>
          <label className={label} htmlFor="arr-phone">Teléfono</label>
          <input id="arr-phone" name="phone" type="tel" className={input} autoComplete="tel" />
        </div>
        <div>
          <label className={label} htmlFor="arr-order">Número de pedido</label>
          <input id="arr-order" name="orderNumber" className={input} placeholder="TTN-2026-…" />
        </div>
        <div>
          <label className={label} htmlFor="arr-date">Fecha en que lo recibiste</label>
          <input id="arr-date" name="purchaseDate" type="date" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="arr-products">Productos</label>
          <input id="arr-products" name="products" className={input} placeholder="Ej: body manga larga talle 2" />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="arr-comment">Comentario (opcional)</label>
        <textarea id="arr-comment" name="comment" rows={3} className={input} placeholder="No hace falta explicar el motivo." />
      </div>
      {state === "error" && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-tatan-primario1 to-tatan-primario2 px-6 py-3.5 text-sm font-extrabold text-zinc-900 hover:brightness-[1.03] disabled:opacity-60 sm:w-auto"
      >
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar solicitud de arrepentimiento
      </button>
      <p className="text-xs text-zinc-500">
        No necesitás cuenta ni registrarte. Al enviarla te damos un código de identificación de tu trámite.
      </p>
    </form>
  );
}
