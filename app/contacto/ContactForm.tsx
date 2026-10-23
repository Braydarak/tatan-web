"use client";

import React from "react";
import { Send, Check, AlertTriangle } from "lucide-react";
import { apiContactSubmit } from "@/lib/tatan-api";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type ReasonKey = "general" | "pedido" | "cambios" | "mayorista" | "otro";

const REASONS: { key: ReasonKey; label: string }[] = [
  { key: "general", label: "Consulta general" },
  { key: "pedido", label: "Seguimiento de pedido" },
  { key: "cambios", label: "Cambios y devoluciones" },
  { key: "mayorista", label: "Ventas mayoristas" },
  { key: "otro", label: "Otro" },
];

export default function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [reason, setReason] = React.useState<ReasonKey>(REASONS[0].key);
  const [message, setMessage] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "ok" | "err">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<string[]>([]);

  const valid =
    name.trim().length >= 2 &&
    /.+@.+\..+/.test(email.trim()) &&
    message.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!valid || state === "sending") return;
    setState("sending");
    setErrorMsg(null);
    setFieldErrors([]);
    try {
      const r = await apiContactSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        reason,
        message: message.trim(),
      });
      if (!r.ok) {
        setFieldErrors(r.errors ?? ["UNKNOWN"]);
        setState("err");
        return;
      }
      setState("ok");
      setTimeout(() => {
        setName("");
        setEmail("");
        setPhone("");
        setReason(REASONS[0].key);
        setMessage("");
        setState("idle");
      }, 4200);
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "No se pudo enviar el mensaje.",
      );
      setState("err");
    }
  };

  const inputBase =
    "block w-full min-w-0 rounded-xl border-2 bg-white px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition focus:border-tatan-primario4 focus:ring-4 focus:ring-tatan-primario3/40 border-tatan-secundario1/50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5"
          >
            Nombre y apellido *
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Ej: Sofía Martínez"
            className={inputBase}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5"
          >
            Correo electrónico *
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="hola@ejemplo.com"
            className={inputBase}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5"
          >
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+54 9 11 ..."
            className={inputBase}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="reason"
            className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5"
          >
            Motivo *
          </label>
          <select
            id="reason"
            className={cx(inputBase, "appearance-none pr-10")}
            value={reason}
            onChange={(e) => setReason(e.target.value as ReasonKey)}
          >
            {REASONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5"
        >
          Mensaje *
        </label>
        <textarea
          id="message"
          rows={5}
          required
          placeholder="Contanos en qué podemos ayudarte..."
          className={cx(inputBase, "resize-y min-h-[140px]")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {state === "err" ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900 shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold leading-tight">
                No se pudo enviar el mensaje
              </p>
              {errorMsg ? (
                <p className="text-[11px] text-rose-700 mt-0.5">{errorMsg}</p>
              ) : null}
              {fieldErrors.length ? (
                <ul className="mt-1.5 text-[11px] space-y-0.5">
                  {fieldErrors.map((fe) => (
                    <li key={fe}>· {fe}</li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setState("idle");
                  setErrorMsg(null);
                  setFieldErrors([]);
                }}
                className="mt-2 text-[11px] font-bold text-rose-900 underline underline-offset-2 hover:opacity-80"
              >
                Volver a intentar
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] font-medium text-zinc-400">
            * Campos obligatorios. No compartimos tus datos.
          </p>
          <button
            type="submit"
            disabled={state !== "idle" || !valid}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all select-none",
              "btn-primary",
              (state !== "idle" || !valid) && "opacity-80 cursor-not-allowed",
            )}
          >
            {state === "sending" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Enviando…
              </>
            ) : state === "ok" ? (
              <>
                <Check className="w-4 h-4" strokeWidth={2.6} />
                ¡Mensaje enviado!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" strokeWidth={2.2} />
                Enviar mensaje
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
