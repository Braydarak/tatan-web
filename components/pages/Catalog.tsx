import type { Metadata } from "next";
import { Suspense } from "react";
import CatalogView, { CatalogWithParams } from "@/components/pages/CatalogView";
import { fetchAllProductsSSR } from "@/lib/card-props";
import { fetchCategoriesSSR } from "@/lib/categories";
import { fetchHomeContentSSR } from "@/lib/home-content";
import { routePath, routeSeo, type CatalogRoute } from "@/lib/catalog-route";
import { absoluteUrl } from "@/lib/seo";

/**
 * Catálogo, armado al compilar. Lo usan cuatro rutas, cada una con su
 * título y su URL propia para Google (ver lib/seo.ts y lib/catalog-route.ts):
 *   /productos              todo
 *   /productos/[categoria]  una categoría (body, ajuar…)
 *   /bebes  /ninos          un grupo de talles
 *
 * El HTML sale sin filtros (eso lee Google); los filtros de la URL
 * (precio, orden, búsqueda) los aplica el navegador (CatalogView), que
 * además actualiza los datos en vivo desde la API.
 */

export type { CatalogRoute };

export async function catalogMetadata(route: CatalogRoute): Promise<Metadata> {
  const [categories, products] = await Promise.all([fetchCategoriesSSR(), fetchAllProductsSSR()]);
  const seo = routeSeo(route, categories);
  if (!seo) return { title: "Categoría no encontrada", robots: { index: false } };
  const path = routePath(route);
  const listed = products.filter((p) => {
    if (route.kind === "category") return p.category === route.key;
    if (route.kind === "size") return p.sizeGroup === route.size;
    return true;
  });
  // Al compartir: la foto del primer producto (si no hay, la imagen general)
  const image = listed.find((p) => p.imageSrc)?.imageSrc;
  return {
    title: seo.title,
    description: seo.description,
    // Las variantes con filtros (?pr=, ?s=, ?q=) usan este mismo HTML y
    // apuntan a la URL limpia
    alternates: { canonical: path },
    // Página vacía (p. ej. /ninos sin productos): no se indexa
    robots: listed.length > 0 ? undefined : { index: false, follow: true },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: path,
      images: [image ? { url: absoluteUrl(image), alt: seo.h1 } : { url: "/opengraph-image", alt: seo.h1 }],
    },
  };
}

export default async function Catalog({ route }: { route: CatalogRoute }) {
  const [products, home, categories] = await Promise.all([
    fetchAllProductsSSR(),
    fetchHomeContentSSR(),
    fetchCategoriesSSR(),
  ]);
  const data = { route, initialProducts: products, initialHome: home, initialCategories: categories };
  return (
    // Sin filtros mientras el navegador lee la URL (es lo que queda en el HTML)
    <Suspense fallback={<CatalogView {...data} sp={{}} />}>
      <CatalogWithParams {...data} />
    </Suspense>
  );
}
