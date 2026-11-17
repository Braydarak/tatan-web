import { ProductsGridSkeleton } from "@/components/ui/productCard/ProductCardSkeleton";

/**
 * Pantalla de carga de /productos: se muestra al instante mientras el
 * servidor trae los productos (también al tocar un filtro), con la misma
 * forma que la página para que no quede en blanco ni salte al cargar.
 */

function Pill({ className }: { className: string }) {
  return (
    <span
      className={`skeleton block h-9 shrink-0 rounded-2xl border border-tatan-secundario1/40 ${className}`}
    />
  );
}

export default function LoadingProductos() {
  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full" aria-busy="true">
        <p className="sr-only" role="status">
          Cargando productos…
        </p>

        {/* Barra de categorías (igual que la real, pegada al header) */}
        <div className="sticky top-[calc(var(--header-h,101px)-1px)] z-30 border-b border-tatan-secundario1/50 bg-[#FBF7F0]/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-hidden px-4 py-3 sm:mx-0 sm:px-0">
              <Pill className="w-24" />
              <Pill className="w-24" />
              <Pill className="w-24" />
              <Pill className="w-28" />
              <Pill className="w-24" />
              <Pill className="w-28" />
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-4">
          {/* Filtros de edad / precio y orden */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-hidden px-4 sm:mx-0 sm:px-0">
              <Pill className="w-36" />
              <Pill className="w-40" />
              <Pill className="w-32" />
              <Pill className="w-32" />
            </div>
            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <span className="skeleton block h-4 w-24 rounded-full lg:hidden" />
              <Pill className="w-40" />
            </div>
          </div>

          {/* En compu hay una fila de filtros activos (min-h-8) antes de la grilla */}
          <div className="mt-5 lg:mt-[4.25rem]">
            <ProductsGridSkeleton count={8} />
          </div>
        </section>
      </main>
    </div>
  );
}
