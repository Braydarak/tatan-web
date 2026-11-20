import type { Metadata } from "next";
import { Suspense } from "react";
import ProductoPorQuery from "@/components/pages/ProductoPorQuery";
import LoadingProducto from "@/app/product/[slug]/loading";
import { fetchAllProductsSSR } from "@/lib/card-props";
import { fetchCategoriesSSR } from "@/lib/categories";
import { fetchHomeContentSSR } from "@/lib/home-content";
import { EMPTY_SIZE_GUIDES, fetchSizeGuidesSSR } from "@/lib/size-guide";

/**
 * /producto?s=<nombre-o-id>: productos cargados en el CRM después del
 * último build (todavía sin página propia en /product/…). public/.htaccess
 * manda acá los /product/… que no existen como archivo. Con el próximo
 * build pasan a tener su página.
 */
export const metadata: Metadata = {
  title: "Producto",
  robots: { index: false, follow: true },
};

export default async function ProductoPage() {
  const [products, home, categories, sizeGuides] = await Promise.all([
    fetchAllProductsSSR(),
    fetchHomeContentSSR(),
    fetchCategoriesSSR(),
    fetchSizeGuidesSSR().catch(() => EMPTY_SIZE_GUIDES),
  ]);
  return (
    <Suspense fallback={<LoadingProducto />}>
      <ProductoPorQuery
        initialProducts={products}
        initialHome={home}
        initialCategories={categories}
        initialSizeGuides={sizeGuides}
      />
    </Suspense>
  );
}
