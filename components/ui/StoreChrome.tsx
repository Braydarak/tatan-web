"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
import type { HomeHeroData } from "@/components/sections/HomeHeroEditor";
import { StoreSettingsProvider } from "@/components/StoreSettingsContext";
import { offersInfo } from "@/lib/card-props";
import type { Category } from "@/lib/categories";
import { useLive } from "@/lib/live-data";
import type { Product as ApiProduct } from "@/lib/tatan-api";

/**
 * Rutas que NO llevan el chrome de la tienda (header + footer).
 * El CRM y el login tienen su propio layout.
 */
const BARE_PREFIXES = ["/crm", "/login"];

function isBare(pathname: string | null): boolean {
  if (!pathname) return false;
  return BARE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Header + footer de la tienda. Recibe los datos del build y los actualiza
 * en vivo desde la API (mensajes de la franja, categorías del pie, si hay
 * ofertas), así un cambio en el CRM se ve sin volver a compilar.
 */
export default function StoreChrome({
  children,
  initialHome,
  initialProducts,
  initialCategories,
}: {
  children: React.ReactNode;
  initialHome: HomeHeroData;
  initialProducts: ApiProduct[];
  initialCategories: Category[];
}) {
  const { header, store } = useLive("home", initialHome);
  const products = useLive("products", initialProducts);
  const categories = useLive("categories", initialCategories);
  // Pie de página: las categorías visibles que tienen productos (máx. 4)
  const footerCategories = React.useMemo(
    () =>
      categories
        .filter((c) => c.active && products.some((p) => p.category === c.key))
        .slice(0, 4)
        .map((c) => ({ key: c.key, label: c.label })),
    [categories, products],
  );
  // Sin ofertas cargadas no se muestra el link a /ofertas
  const offers = React.useMemo(() => offersInfo(products), [products]);
  const pathname = usePathname();
  const bare = isBare(pathname);

  return (
    <StoreSettingsProvider value={store}>
      {bare ? null : <Header announcements={header} offers={offers} />}
      {children}
      {bare ? null : <Footer
          hasOffers={(offers?.count ?? 0) > 0}
          categories={footerCategories}
        />}
    </StoreSettingsProvider>
  );
}
