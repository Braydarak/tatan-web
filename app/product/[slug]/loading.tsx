/**
 * Pantalla de carga de la página de un producto: se muestra al instante al
 * tocar una tarjeta, mientras el servidor trae el producto, con la misma
 * forma que la página (ruta, foto grande con miniaturas y caja de compra).
 */

function Bar({ className }: { className: string }) {
  return <span className={`skeleton block rounded-full ${className}`} />;
}

export default function LoadingProducto() {
  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full" aria-busy="true">
        <p className="sr-only" role="status">
          Cargando producto…
        </p>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          {/* Ruta: Inicio › Productos › Categoría › Producto */}
          <div className="mb-5 flex items-center gap-2">
            <Bar className="h-3 w-10" />
            <Bar className="h-3 w-16" />
            <Bar className="h-3 w-12" />
            <Bar className="h-3 w-28" />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Foto grande y miniaturas */}
            <div className="min-w-0 space-y-3">
              <div className="paper-card rounded-3xl p-3 sm:p-5">
                <div className="skeleton aspect-square rounded-2xl" />
              </div>
              <div className="flex gap-2.5 overflow-hidden pb-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="skeleton block h-20 w-20 shrink-0 rounded-2xl sm:h-24 sm:w-24"
                  />
                ))}
              </div>
            </div>

            {/* Caja de compra */}
            <div className="min-w-0 space-y-5">
              <div className="paper-card rounded-3xl p-5 sm:p-8 space-y-5">
                <div>
                  <Bar className="h-6 w-20" />
                  <Bar className="mt-3 h-9 w-4/5" />
                  <Bar className="mt-2.5 h-3.5 w-2/5" />
                </div>

                {/* Precio */}
                <div className="rounded-2xl bg-white/70 border border-tatan-secundario1/50 px-4 py-3.5">
                  <Bar className="h-9 w-36" />
                  <Bar className="mt-2 h-2.5 w-48" />
                </div>

                {/* Colores y talles */}
                <div>
                  <Bar className="h-3.5 w-16" />
                  <div className="mt-3 flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="skeleton block h-9 w-9 rounded-full" />
                    ))}
                  </div>
                </div>
                <div>
                  <Bar className="h-3.5 w-14" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="skeleton block h-10 w-12 rounded-xl" />
                    ))}
                  </div>
                </div>

                {/* Botón de compra */}
                <span className="skeleton block h-12 w-full rounded-2xl" />
              </div>

              <div className="paper-card rounded-3xl px-5 sm:px-8 py-5 space-y-3">
                <Bar className="h-4 w-32" />
                <Bar className="h-3 w-full" />
                <Bar className="h-3 w-11/12" />
                <Bar className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
