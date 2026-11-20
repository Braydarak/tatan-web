import type { Metadata } from "next";
import HomeView from "@/components/pages/HomeView";
import { fetchAllProductsSSR } from "@/lib/card-props";
import { fetchCategoriesSSR } from "@/lib/categories";
import { fetchHomeContentSSR } from "@/lib/home-content";

export const metadata: Metadata = {
  // Título y descripción: los del layout. La home es la URL principal.
  alternates: { canonical: "/" },
};

/** Home: se arma al compilar y se actualiza en vivo en el navegador */
export default async function Home() {
  const [products, home, categories] = await Promise.all([
    fetchAllProductsSSR(),
    fetchHomeContentSSR(),
    fetchCategoriesSSR(),
  ]);
  return (
    <HomeView initialProducts={products} initialHome={home} initialCategories={categories} />
  );
}
