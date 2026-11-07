import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import ScrollToTop from "@/components/ui/ScrollToTop";
import StoreChrome from "@/components/ui/StoreChrome";
import { fetchHomeContentSSR } from "@/lib/home-content";
import { fetchAllProductsSSR, offersInfo } from "@/lib/card-props";
import { fetchCategoriesSSR } from "@/lib/categories";

// Fuentes incluidas en el repo (variables, set "latin": cubre todo el
// español). Así el build no depende de descargar de Google Fonts.
const nunito = localFont({
  src: "./fonts/nunito-latin-var.woff2",
  weight: "400 800",
  variable: "--font-nunito",
  display: "swap",
});

const fredoka = localFont({
  src: "./fonts/fredoka-latin-var.woff2",
  weight: "400 700",
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tatan - Ropa para bebés y niños",
  description:
    "Ropa cómoda y bonita para los más pequeños. Bodys, remeras y más.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mensajes de la franja del header (se editan en CRM → Inicio y tienda)
  const [{ header, store }, products, categories] = await Promise.all([
    fetchHomeContentSSR(),
    fetchAllProductsSSR(),
    fetchCategoriesSSR(),
  ]);
  // Pie de página: las categorías visibles que tienen productos (máx. 4)
  const footerCategories = categories
    .filter((c) => c.active && products.some((p) => p.category === c.key))
    .slice(0, 4)
    .map((c) => ({ key: c.key, label: c.label }));
  // Sin ofertas cargadas no se muestra el link a /ofertas
  const offers = offersInfo(products);
  const hasBanner =
    !!header?.show && header.messages.some((m) => m.text.trim().length > 0);
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
      // Alto del header fijo (con o sin la franja de mensajes)
      style={{ "--header-h": hasBanner ? "101px" : "69px" } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col relative">
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <StoreChrome
          header={header}
          store={store}
          offers={offers}
          footerCategories={footerCategories}
        >
          {children}
        </StoreChrome>
      </body>
    </html>
  );
}
