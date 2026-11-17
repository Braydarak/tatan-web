/**
 * Tarjeta "fantasma" mientras cargan los productos: misma forma y tamaño que
 * ProductCard, con un brillo que se desliza (clase `skeleton`), así la página
 * nunca queda en blanco y no salta cuando llegan los productos de verdad.
 */

function Bar({ className }: { className: string }) {
  return <span className={`skeleton block rounded-full ${className}`} />;
}

export default function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[320px] h-full flex flex-col rounded-2xl sm:rounded-3xl bg-white/75 border border-tatan-secundario1/50 p-1.5 sm:p-2.5 shadow-[0_1px_3px_rgba(185,168,155,0.12),0_6px_16px_rgba(185,168,155,0.08)]"
    >
      <div className="skeleton aspect-square rounded-xl sm:rounded-[1.25rem]" />
      <div className="flex flex-1 flex-col px-1 sm:px-1.5 pt-2.5 sm:pt-3 pb-1">
        <Bar className="h-3.5 w-4/5" />
        <Bar className="mt-2 h-2.5 w-1/2" />
        <Bar className="mt-3 h-4 w-2/5" />
        <Bar className="mt-2 h-2 w-3/4" />
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="skeleton block h-4 w-4 rounded-full" />
          ))}
        </div>
        <span className="skeleton mt-3 block h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Grilla de tarjetas fantasma (mismas columnas que la de productos) */
export function ProductsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 justify-items-center">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
