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

/** Motivos (obligatorio elegir uno; "Cambié de opinión" es válido y no hay que probar nada) */
export const REASONS = [
  { key: "cambio-opinion", label: "Cambié de opinión / ya no lo quiero" },
  { key: "talle", label: "No le quedó el talle" },
  { key: "color-modelo", label: "No me gustó el color o el modelo" },
  { key: "falla", label: "Llegó con una falla o defecto" },
  { key: "producto-distinto", label: "Llegó un producto distinto al que pedí" },
  { key: "otro", label: "Otro motivo" },
] as const;

/** Orientación según el motivo elegido */
const HINTS: Record<string, string> = {
  talle: "¿Sabías que podés cambiarlo por otro talle en vez de devolverlo? Escribinos y lo coordinamos.",
  "color-modelo": "Si preferís, también podés cambiarlo por otro color o modelo.",
  falla: "Lo resolvemos sin costo para vos. Si podés, contanos en el comentario qué tiene y mandanos una foto al mail.",
  "producto-distinto": "Disculpas por el error: lo resolvemos sin costo para vos.",
  otro: "Contanos brevemente el motivo en el comentario.",
};

const input =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/50";
const label = "block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5";

export default function ArrepentimientoForm() {
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [code, setCode] = React.useState("");
  const [mailed, setMailed] = React.useState(false);
  const [error, setError] = React.useState("");
  const [reason, setReason] = React.useState("");

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
            (json.errors?.includes("EMAIL")
                ? "Revisá tu mail."
                : json.errors?.includes("NAME")
                  ? "Escribí tu nombre y apellido."
                  : json.errors?.includes("REASON")
                    ? "Elegí el motivo."
                    : json.errors?.includes("COMMENT")
                      ? "Contanos el motivo en el comentario."
                      : "No pudimos enviar la solicitud."),
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
        <label className={label} htmlFor="arr-reason">Motivo *</label>
        <select
          id="arr-reason"
          name="reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`${input} cursor-pointer`}
        >
          <option value="" disabled>
            Elegí un motivo
          </option>
          {REASONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        {HINTS[reason] && <p className="mt-2 rounded-2xl bg-tatan-primario2/40 px-4 py-2.5 text-sm text-zinc-700">{HINTS[reason]}</p>}
      </div>
      <div>
        <label className={label} htmlFor="arr-comment">Comentario{reason === "otro" ? " *" : " (opcional)"}</label>
        <textarea
          id="arr-comment"
          name="comment"
          rows={3}
          required={reason === "otro"}
          minLength={reason === "otro" ? 5 : undefined}
          className={input}
          placeholder={reason === "otro" ? "Contanos el motivo" : "Algo más que quieras contarnos"}
        />
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
