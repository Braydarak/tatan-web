"use client";

/**
 * Osito Tatan minimalista (SVG + animaciones CSS). Se usa mientras se
 * procesa el pago y en la página de gracias.
 *
 *  - processing: pasa la tarjeta de un lado al otro y la mira
 *  - approved:   salta contento, con corazones y un tilde
 *  - pending:    espera con un reloj (p. ej. pago en efectivo)
 *  - rejected:   triste, orejas caídas y una lagrimita
 *  - lost:       se sorprende y se tapa los ojos ("no lo encuentro"),
 *                para la página de "no encontrado"
 *
 * Se anima siempre, aunque el dispositivo tenga "reducir movimiento"
 * activado (son movimientos chicos, a pedido de Tatan).
 */

export type BearPhase = "processing" | "approved" | "pending" | "rejected" | "lost";

// Paleta Tatan
const FUR = "#e6c3a0";
const FUR_DARK = "#c99a76";
const SNOUT = "#f7e6d3";
const INK = "#5b4636";

export default function Bear({
  phase,
  loop = false,
  className = "h-44 w-44",
}: {
  phase: BearPhase;
  /** Repite el festejo / la animación de forma suave (página de gracias) */
  loop?: boolean;
  className?: string;
}) {
  const cardColor = phase === "rejected" ? "#f4b8c8" : phase === "approved" ? "#8dbfa3" : "#a8c8e0";
  return (
    <span className={`tb-root tb-${phase}${loop ? " tb-loop" : ""} inline-flex`}>
      <style>{STYLES}</style>
      <svg viewBox="0 0 200 190" className={className} aria-hidden="true">
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
            {phase === "lost" ? (
              <>
                {/* sorpresa: cejas arriba, ojos grandes con brillo y boca en "o" */}
                <g className="tb-brows">
                  <path d="M76 74 q8 -7 16 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M108 74 q8 -7 16 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
                </g>
                <g className="tb-eyes">
                  <circle cx="84" cy="88" r="7" fill="#fff" />
                  <circle cx="116" cy="88" r="7" fill="#fff" />
                  <circle cx="84" cy="89" r="4.5" fill={INK} />
                  <circle cx="116" cy="89" r="4.5" fill={INK} />
                  <circle cx="85.5" cy="87" r="1.4" fill="#fff" />
                  <circle cx="117.5" cy="87" r="1.4" fill="#fff" />
                </g>
                <ellipse className="tb-mouth" cx="100" cy="115" rx="5" ry="6" fill={INK} />
              </>
            ) : phase === "approved" ? (
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

          {phase === "lost" ? (
            /* patitas: suben a taparse los ojos (van después de la cabeza, así la tapan) */
            <>
              {[66, 134].map((x) => (
                <g key={x} className={`tb-paw ${x < 100 ? "tb-paw-l" : "tb-paw-r"}`}>
                  {/* patita con borde, almohadilla y tres deditos */}
                  <circle cx={x} cy="150" r="16" fill={FUR} stroke={FUR_DARK} strokeWidth="2.5" />
                  <ellipse cx={x} cy="154" rx="7" ry="5.5" fill={SNOUT} />
                  <circle cx={x - 7} cy="144" r="2.8" fill={SNOUT} />
                  <circle cx={x} cy="141" r="2.8" fill={SNOUT} />
                  <circle cx={x + 7} cy="144" r="2.8" fill={SNOUT} />
                </g>
              ))}
            </>
          ) : (
            /* tarjeta en las patitas */
            <g className="tb-card">
              <rect x="70" y="132" width="60" height="38" rx="6" fill={cardColor} />
              <rect x="70" y="140" width="60" height="7" fill="#fff" opacity="0.6" />
              <rect x="78" y="154" width="18" height="5" rx="2.5" fill="#fff" opacity="0.8" />
              <circle cx="66" cy="152" r="9" fill={FUR_DARK} />
              <circle cx="134" cy="152" r="9" fill={FUR_DARK} />
            </g>
          )}
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
        {phase === "lost" && (
          <g className="tb-question">
            <circle cx="160" cy="44" r="17" fill="#f7e4a3" />
            <text x="160" y="52" textAnchor="middle" fontSize="24" fontWeight="800" fill={INK} fontFamily="system-ui, sans-serif">
              ?
            </text>
          </g>
        )}
        {phase === "rejected" && (
          <g className="tb-badge">
            <circle cx="160" cy="120" r="17" fill="#f4b8c8" />
            <path d="M153 113 l14 14 M167 113 l-14 14" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </span>
  );
}

const STYLES = `
.tb-root .tb-bear, .tb-root .tb-head, .tb-root .tb-card, .tb-root .tb-ear, .tb-root .tb-badge, .tb-root .tb-heart, .tb-root .tb-shadow, .tb-root .tb-question, .tb-root .tb-mouth, .tb-root .tb-brows {
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

/* perdido (página no encontrada), ciclo de 5 s:
   0-14%  se sorprende: saltito, cejas arriba, boca en "o" y aparece el "?"
   22-34% sube las patitas y se tapa los ojos
   34-70% sigue tapado y niega con la cabeza ("no lo veo")
   78-90% baja las patitas y espía; vuelve a empezar */
.tb-lost .tb-bear { animation: tb-lost-jump 5s ease-in-out infinite; }
.tb-lost .tb-shadow { animation: tb-lost-shadow 5s ease-in-out infinite; }
.tb-lost .tb-brows { animation: tb-lost-brows 5s ease-in-out infinite; }
.tb-lost .tb-mouth { animation: tb-lost-mouth 5s ease-in-out infinite; }
.tb-lost .tb-head { animation: tb-lost-head 5s ease-in-out infinite; }
.tb-lost .tb-ear-l { animation: tb-lost-ear-l 5s ease-in-out infinite; }
.tb-lost .tb-ear-r { animation: tb-lost-ear-r 5s ease-in-out infinite; }
.tb-lost .tb-paw-l { animation: tb-lost-paw-l 5s cubic-bezier(.45,0,.3,1.2) infinite; }
.tb-lost .tb-paw-r { animation: tb-lost-paw-r 5s cubic-bezier(.45,0,.3,1.2) infinite; }
.tb-lost .tb-question { animation: tb-lost-question 5s ease-in-out infinite; }
@keyframes tb-lost-jump { 0%, 14%, 100% { transform: translateY(0) } 5% { transform: translateY(-14px) } }
@keyframes tb-lost-shadow { 0%, 14%, 100% { transform: scaleX(1); opacity: .08 } 5% { transform: scaleX(.75); opacity: .04 } }
@keyframes tb-lost-brows { 0%, 100% { transform: translateY(0) } 4%, 20% { transform: translateY(-5px) } 30%, 90% { transform: translateY(0) } }
@keyframes tb-lost-mouth { 0%, 100% { transform: scale(.6) } 4%, 22% { transform: scale(1.15) } 32%, 90% { transform: scale(.75) } }
@keyframes tb-lost-head { 0%, 34%, 70%, 100% { transform: rotate(0) } 40% { transform: rotate(-6deg) } 48% { transform: rotate(6deg) } 56% { transform: rotate(-6deg) } 64% { transform: rotate(4deg) } }
@keyframes tb-lost-ear-l { 0%, 100% { transform: rotate(0) } 4%, 16% { transform: rotate(-12deg) } 24%, 90% { transform: rotate(0) } }
@keyframes tb-lost-ear-r { 0%, 100% { transform: rotate(0) } 4%, 16% { transform: rotate(12deg) } 24%, 90% { transform: rotate(0) } }
/* de la panza (66,150 / 134,150) a los ojos (84,88 / 116,88) */
@keyframes tb-lost-paw-l { 0%, 20%, 92%, 100% { transform: translate(0, 0) } 32%, 74% { transform: translate(18px, -62px) } 82% { transform: translate(12px, -44px) } }
@keyframes tb-lost-paw-r { 0%, 20%, 92%, 100% { transform: translate(0, 0) } 32%, 74% { transform: translate(-18px, -62px) } 82% { transform: translate(-12px, -44px) } }
@keyframes tb-lost-question { 0%, 2% { transform: scale(0) rotate(-20deg); opacity: 0 } 8% { transform: scale(1.15) rotate(8deg); opacity: 1 } 12%, 86% { transform: scale(1) rotate(0); opacity: 1 } 94%, 100% { transform: scale(0); opacity: 0 } }

/* página de gracias: festeja cada tanto, sin parar */
.tb-loop.tb-approved .tb-bear { animation: tb-hop-loop 2.6s cubic-bezier(.3,.7,.4,1.4) infinite; }
.tb-loop.tb-approved .tb-shadow { animation: tb-shadow-loop 2.6s ease-in-out infinite; }
.tb-loop.tb-rejected .tb-head { animation: tb-shake 3s ease-in-out infinite; }
@keyframes tb-hop-loop { 0%, 30%, 60%, 100% { transform: translateY(0) } 12% { transform: translateY(-18px) } 42% { transform: translateY(-12px) } }
@keyframes tb-shadow-loop { 0%, 30%, 60%, 100% { transform: scaleX(1); opacity: .08 } 12%, 42% { transform: scaleX(.7); opacity: .04 } }
`;
