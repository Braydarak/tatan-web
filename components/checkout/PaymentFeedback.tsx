"use client";

/**
 * Pantalla mientras se procesa el pago: un osito minimalista que pasa la
 * tarjeta. Según cómo sale, salta contento (aprobado), espera con un reloj
 * (pendiente, p. ej. efectivo) o se pone triste (rechazado).
 *
 * Se anima siempre, aunque el dispositivo tenga "reducir movimiento"
 * activado (son movimientos chicos, a pedido de Tatan).
 */

import { useEffect, useRef } from "react";

export type FeedbackPhase = "processing" | "approved" | "pending" | "rejected";

const COPY: Record<FeedbackPhase, { title: string; text: string }> = {
  processing: { title: "Procesando tu pago", text: "El osito está pasando tu tarjeta. No cierres esta página." },
  approved: { title: "¡Pago aprobado!", text: "Gracias por tu compra. Te llevamos al detalle de tu pedido…" },
  pending: { title: "Tu pago quedó pendiente", text: "Te llevamos al detalle para que veas cómo terminar el pago…" },
  rejected: { title: "No se pudo completar el pago", text: "No se cobró nada." },
};

// Paleta Tatan
const FUR = "#e6c3a0";
const FUR_DARK = "#c99a76";
const SNOUT = "#f7e6d3";
const INK = "#5b4636";

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
  const cardColor = phase === "rejected" ? "#f4b8c8" : phase === "approved" ? "#8dbfa3" : "#a8c8e0";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-white/75 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-feedback-title"
    >
      <style>{STYLES}</style>
      <div className={`tb-root tb-${phase} paper-card flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl px-6 pb-7 pt-5 text-center shadow-xl`}>
        <svg viewBox="0 0 200 190" className="h-44 w-44" aria-hidden="true">
          {/* sombra */}
          <ellipse className="tb-shadow" cx="100" cy="182" rx="46" ry="5" fill="#000" opacity="0.08" />

          <g className="tb-bear">
            {/* cuerpo */}
            <ellipse cx="100" cy="160" rx="44" ry="26" fill={FUR} />
            <ellipse cx="100" cy="164" rx="26" ry="15" fill={SNOUT} />

            {/* cabeza */}
            <g className="tb-head">
              <g className="tb-ear tb-ear-l">
                <circle cx="62" cy="50" r="17" fill={FUR} />
                <circle cx="62" cy="50" r="9" fill={FUR_DARK} />
              </g>
              <g className="tb-ear tb-ear-r">
                <circle cx="138" cy="50" r="17" fill={FUR} />
                <circle cx="138" cy="50" r="9" fill={FUR_DARK} />
              </g>
              <circle cx="100" cy="88" r="47" fill={FUR} />
              {/* cachetes */}
              <circle cx="72" cy="104" r="7" fill="#f4b8c8" opacity={phase === "rejected" ? 0.25 : 0.55} />
              <circle cx="128" cy="104" r="7" fill="#f4b8c8" opacity={phase === "rejected" ? 0.25 : 0.55} />
              {/* hocico */}
              <ellipse cx="100" cy="106" rx="19" ry="14" fill={SNOUT} />
              <ellipse cx="100" cy="100" rx="6.5" ry="4.5" fill={INK} />

              {/* ojos y boca según el estado */}
              {phase === "approved" ? (
                <>
                  <path d="M78 86 q6 -8 12 0" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M110 86 q6 -8 12 0" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M90 110 q10 10 20 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
              ) : phase === "rejected" ? (
                <>
                  {/* cejas tristes: más altas hacia el centro */}
                  <path d="M77 84 l12 -4" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                  <path d="M123 84 l-12 -4" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                  <circle cx="84" cy="91" r="4" fill={INK} />
                  <circle cx="116" cy="91" r="4" fill={INK} />
                  <path d="M91 115 q9 -7 18 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path className="tb-tear" d="M132 96 q4 7 0 10 q-4 -3 0 -10z" fill="#a8c8e0" />
                </>
              ) : (
                <>
                  <g className="tb-eyes">
                    <ellipse cx="84" cy="88" rx="4.5" ry="5" fill={INK} />
                    <ellipse cx="116" cy="88" rx="4.5" ry="5" fill={INK} />
                  </g>
                  <path d="M93 111 q7 5 14 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
              )}
            </g>

            {/* tarjeta en las patitas */}
            <g className="tb-card">
              <rect x="70" y="132" width="60" height="38" rx="6" fill={cardColor} />
              <rect x="70" y="140" width="60" height="7" fill="#fff" opacity="0.6" />
              <rect x="78" y="154" width="18" height="5" rx="2.5" fill="#fff" opacity="0.8" />
              <circle cx="66" cy="152" r="9" fill={FUR_DARK} />
              <circle cx="134" cy="152" r="9" fill={FUR_DARK} />
            </g>
          </g>

          {/* extras según el estado */}
          {phase === "approved" && (
            <g>
              <path className="tb-heart tb-heart-1" d="M40 60 c-6 -8 -16 0 -8 8 l8 7 l8 -7 c8 -8 -2 -16 -8 -8z" fill="#f4b8c8" />
              <path className="tb-heart tb-heart-2" d="M160 46 c-5 -7 -13 0 -7 7 l7 6 l7 -6 c6 -7 -2 -14 -7 -7z" fill="#f4b8c8" />
              <g className="tb-badge">
                <circle cx="160" cy="120" r="17" fill="#8dbfa3" />
                <path d="M152 120 l6 6 l10 -12" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          )}
          {phase === "pending" && (
            <g className="tb-badge">
              <circle cx="160" cy="120" r="17" fill="#f7e4a3" />
              <circle cx="160" cy="120" r="12" fill="none" stroke={INK} strokeWidth="2.5" />
              <path className="tb-clock" d="M160 120 l0 -8" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M160 120 l5 3" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}
          {phase === "rejected" && (
            <g className="tb-badge">
              <circle cx="160" cy="120" r="17" fill="#f4b8c8" />
              <path d="M153 113 l14 14 M167 113 l-14 14" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}
        </svg>

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

const STYLES = `
.tb-root .tb-bear, .tb-root .tb-head, .tb-root .tb-card, .tb-root .tb-ear, .tb-root .tb-badge, .tb-root .tb-heart, .tb-root .tb-shadow {
  transform-box: fill-box; transform-origin: center;
}
.tb-root .tb-ear-l { transform-origin: 80% 80%; }
.tb-root .tb-ear-r { transform-origin: 20% 80%; }
.tb-dots span { animation: tb-dot 1.2s infinite; opacity: 0; }
.tb-dots span:nth-child(2) { animation-delay: .2s; }
.tb-dots span:nth-child(3) { animation-delay: .4s; }
@keyframes tb-dot { 0%, 20% { opacity: 0 } 40%, 100% { opacity: 1 } }

/* procesando: pasa la tarjeta y la mira */
.tb-processing .tb-card { animation: tb-swipe 1.1s ease-in-out infinite; }
.tb-processing .tb-head { animation: tb-bob 1.1s ease-in-out infinite; }
.tb-processing .tb-eyes { animation: tb-look 1.1s ease-in-out infinite; }
@keyframes tb-swipe { 0%, 100% { transform: translateX(-10px) rotate(-4deg) } 50% { transform: translateX(10px) rotate(4deg) } }
@keyframes tb-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(2px) } }
@keyframes tb-look { 0%, 100% { transform: translate(-2px, 2px) } 50% { transform: translate(2px, 2px) } }

/* aprobado: salta contento */
.tb-approved .tb-bear { animation: tb-hop .7s cubic-bezier(.3,.7,.4,1.4) 2; }
.tb-approved .tb-shadow { animation: tb-shadow .7s ease-in-out 2; }
.tb-approved .tb-heart { animation: tb-float 1.6s ease-out infinite; }
.tb-approved .tb-heart-2 { animation-delay: .5s; }
.tb-approved .tb-badge, .tb-pending .tb-badge, .tb-rejected .tb-badge { animation: tb-pop .45s cubic-bezier(.3,.7,.4,1.5) both; }
@keyframes tb-hop { 0%, 100% { transform: translateY(0) } 40% { transform: translateY(-18px) } }
@keyframes tb-shadow { 0%, 100% { transform: scaleX(1); opacity: .08 } 40% { transform: scaleX(.7); opacity: .04 } }
@keyframes tb-float { 0% { transform: translateY(8px) scale(.6); opacity: 0 } 30% { opacity: 1 } 100% { transform: translateY(-22px) scale(1); opacity: 0 } }
@keyframes tb-pop { 0% { transform: scale(0) } 100% { transform: scale(1) } }

/* pendiente: espera mirando el reloj */
.tb-pending .tb-clock { transform-box: view-box; transform-origin: 160px 120px; animation: tb-tick 2s linear infinite; }
.tb-pending .tb-head { animation: tb-tilt 2.4s ease-in-out infinite; }
@keyframes tb-tick { to { transform: rotate(360deg) } }
@keyframes tb-tilt { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(5deg) } }

/* rechazado: niega con la cabeza, orejas caídas */
.tb-rejected .tb-head { animation: tb-shake .5s ease-in-out 2; }
.tb-rejected .tb-ear-l { transform: rotate(-18deg); }
.tb-rejected .tb-ear-r { transform: rotate(18deg); }
.tb-rejected .tb-card { transform: translateY(6px) rotate(-6deg); }
.tb-rejected .tb-tear { animation: tb-drop 1.6s ease-in infinite; }
@keyframes tb-shake { 0%, 100% { transform: rotate(0) } 25% { transform: rotate(-7deg) } 75% { transform: rotate(7deg) } }
@keyframes tb-drop { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(12px); opacity: 0 } }
`;
