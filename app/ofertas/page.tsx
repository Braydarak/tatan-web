import type { Metadata } from "next";
import { Suspense } from "react";
import OfertasView, { OfertasWithParams } from "@/components/pages/OfertasView";
import { fetchAllProductsSSR } from "@/lib/card-props";
import { fetchCategoriesSSR } from "@/lib/categories";
import { fetchHomeContentSSR } from "@/lib/home-content";

/** Sin ofertas cargadas al compilar, la página no se indexa */
export async function generateMetadata(): Promise<Metadata> {
  const products = await fetchAllProductsSSR();
  const hasOffers = products.some((p) => p.originalPrice && p.originalPrice > p.price);
  return {
    title: "Ofertas en ropa para bebés",
    description:
      "Ofertas en ropa para bebés de Algodón Pima: bodys, ajuares, batitas y accesorios con descuento. Envíos a todo el país y cuotas con Mercado Pago.",
    alternates: { canonical: "/ofertas" },
    robots: hasOffers ? undefined : { index: false, follow: true },
  };
}

/** Ofertas: se arma al compilar (sin filtros) y el navegador aplica los filtros y los datos en vivo */
export default async function OfertasPage() {
  const [products, home, categories] = await Promise.all([
    fetchAllProductsSSR(),
    fetchHomeContentSSR(),
    fetchCategoriesSSR(),
  ]);
  const data = { initialProducts: products, initialHome: home, initialCategories: categories };
  return (
    <Suspense fallback={<OfertasView {...data} sp={{}} />}>
      <OfertasWithParams {...data} />
    </Suspense>
  );
}
