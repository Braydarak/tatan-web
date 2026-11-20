import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home, Mail } from "lucide-react";
import Bear from "@/components/checkout/Bear";
import SearchBox from "@/components/ui/SearchBox";
import ProductCard from "@/components/ui/productCard/ProductCard";
import { apiToCardProps, fetchAllProductsSSR } from "@/lib/card-props";
import { fetchHomeContentSSR } from "@/lib/home-content";

/**
 * Página "no encontrada" (404): una dirección que no existe, un producto
 * borrado, una categoría mal escrita… El osito se sorprende y se tapa los
 * ojos; abajo, el buscador y algunos productos para seguir comprando.
 */

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const [products, content] = await Promise.all([
    fetchAllProductsSSR(),
    fetchHomeContentSSR(),
  ]);
  const quickAdd = content.store?.quickAdd !== false;
  // Los más vendidos (con foto) para que siga comprando
  const suggested = products
    .filter((p) => p.active !== false && p.imageSrc)
    .sort((a, b) => (Number(b.soldTotal) || 0) - (Number(a.soldTotal) || 0))
    .slice(0, 4);

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full max-h-[620px] pointer-events-none">
            <div className="absolute -top-4 -left-8 w-64 h-64 rounded-full bg-tatan-acento-azul/30 blur-3xl" />
            <div className="absolute top-8 right-0 w-72 h-72 rounded-full bg-tatan-acento-amarillo/40 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full bg-tatan-acento-rosa/30 blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10 text-center">
            <div className="flex justify-center">
              <Bear phase="lost" className="h-48 w-48 sm:h-56 sm:w-56" />
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="w-8 h-1 rounded-full bg-tatan-primario4" />
              <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                Error 404
              </span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-5xl font-bold text-zinc-800 leading-tight">
              ¡Uy! No encontramos esta página
            </h1>
            <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl mx-auto">
              El osito buscó por todos lados y no la ve. Puede que el link esté mal escrito o que
              el producto ya no esté. Probá buscando lo que querías:
            </p>

            <div className="mt-6 max-w-md mx-auto text-left">
              <SearchBox />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/productos"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-tatan-primario1 to-tatan-primario2 px-6 py-3 text-sm font-extrabold text-zinc-900 shadow-[0_8px_20px_-12px_rgba(214,149,85,0.65)] hover:brightness-[1.03] transition-all"
              >
                Ver todos los productos
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-white transition-colors"
              >
                <Home className="h-4 w-4" strokeWidth={2} />
                Ir al inicio
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-white transition-colors"
              >
                <Mail className="h-4 w-4" strokeWidth={2} />
                Escribinos
              </Link>
            </div>
          </div>
        </section>

        {suggested.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-6 h-1 rounded-full bg-tatan-acento-rosa" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                  Mientras tanto
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800">
                Los más elegidos
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4 justify-items-center">
              {suggested.map((p) => (
                <ProductCard key={p.id} {...apiToCardProps(p, { quickAdd })} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
