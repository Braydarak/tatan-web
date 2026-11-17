import { ProductsGridSkeleton } from "@/components/ui/productCard/ProductCardSkeleton";

/**
 * Pantalla de carga de /ofertas: se muestra al instante mientras el servidor
 * trae las ofertas, con la misma forma que la página (panel de filtros,
 * título y grilla) para que no quede en blanco ni salte al cargar.
 */
export default function LoadingOfertas() {
  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full" aria-busy="true">
        <p className="sr-only" role="status">
          Cargando ofertas…
        </p>

        <section className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 pb-16">
          {/* Panel de filtros (compacto) */}
          <div className="flex w-full items-center gap-3 rounded-3xl border border-tatan-secundario1/40 bg-[#FFFDF9] px-4 py-3 sm:px-5 sm:py-4">
            <span className="skeleton block h-9 w-9 shrink-0 rounded-2xl" />
            <span className="skeleton block h-3.5 w-24 rounded-full" />
            <span className="skeleton ml-auto block h-9 w-28 rounded-2xl" />
          </div>

          {/* Título */}
          <div className="mt-6">
            <span className="skeleton block h-1 w-8 rounded-full" />
            <span className="skeleton mt-3 block h-3 w-28 rounded-full" />
            <span className="skeleton mt-3 block h-8 w-56 rounded-full sm:w-72" />
          </div>

          <div className="mt-8">
            <ProductsGridSkeleton
              count={8}
              className="grid gap-3 sm:gap-6 justify-items-center grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
