/**
 * Recuadro para productos sin foto (o con la foto rota): en lugar del logo
 * genérico, un aviso amable con una percha dibujada.
 */
export default function MissingPhoto({
  compact = false,
  className = "",
}: {
  /** Versión chica (miniaturas, carrito): solo el dibujo */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-tatan-primario1/30 via-white to-tatan-primario2/30 text-center ${className}`}
      role="img"
      aria-label="Foto no disponible"
    >
      <svg
        viewBox="0 0 64 48"
        className={compact ? "w-8 opacity-70" : "w-14 sm:w-20 opacity-80"}
        fill="none"
        stroke="#B9A89B"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* percha */}
        <path d="M32 14a5 5 0 1 0-5-5" />
        <path d="M32 14v3L7 33c-2.6 1.7-1.4 5.5 1.7 5.5h46.6c3.1 0 4.3-3.8 1.7-5.5L32 17" />
        {/* estrellita */}
        <path d="M52 6l1.2 2.6L56 9.8l-2.8 1.2L52 13.6l-1.2-2.6L48 9.8l2.8-1.2z" fill="#F7E4A3" stroke="none" />
      </svg>
      {!compact && (
        <div className="px-3">
          <p className="font-[family-name:var(--font-fredoka)] text-sm sm:text-base font-semibold text-zinc-600">
            ¡Ups! La foto se perdió
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-400">
            Pronto la volvemos a subir
          </p>
        </div>
      )}
    </div>
  );
}
