import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import JsonLd from "@/components/seo/JsonLd";
import { INSTAGRAM_URL, SITE_ALT_NAME, SITE_LOCALE, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import ScrollToTop from "@/components/ui/ScrollToTop";
import AnimatedFavicon from "@/components/AnimatedFavicon";
import StoreChrome from "@/components/ui/StoreChrome";
import { fetchHomeContentSSR } from "@/lib/home-content";
import { fetchAllProductsSSR } from "@/lib/card-props";
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
  // Base de las URLs absolutas (canonical, Open Graph): /productos → https://tatankids.com.ar/productos
  metadataBase: new URL(SITE_URL),
  // Cada página define su título corto ("Bodys para bebé…") y se le agrega
  // " · Tatan". La home usa el default.
  title: {
    default: "Tatan · Ropa para bebés de Algodón Pima",
    template: "%s · Tatan",
  },
  description:
    "Ropa para bebés en Algodón Pima: bodys, ajuares para recién nacido, batitas, ranitas y accesorios. Envíos a todo el país y cuotas con Mercado Pago.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mensajes de la franja del header (se editan en CRM → Inicio y tienda)
  // Datos del momento del build; el header y el pie los actualizan en vivo
  const [home, products, categories] = await Promise.all([
    fetchHomeContentSSR(),
    fetchAllProductsSSR(),
    fetchCategoriesSSR(),
  ]);
  const { header } = home;
  const hasBanner =
    !!header?.show && header.messages.some((m) => m.text.trim().length > 0);
  return (
    <html
      lang="es-AR"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
      // Alto del header fijo (con o sin la franja de mensajes)
      style={{ "--header-h": hasBanner ? "101px" : "69px" } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col relative">
        {/* Quién es la tienda y su buscador (para Google) */}
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${SITE_URL}/#organizacion`,
              name: SITE_NAME,
              alternateName: SITE_ALT_NAME,
              url: SITE_URL,
              logo: absoluteUrl("/tatanLogo.png"),
              description:
                "Marca argentina de ropa para bebés en Algodón Pima.",
              areaServed: { "@type": "Country", name: "Argentina" },
              // Perfiles de la marca: Google los vincula con la tienda
              sameAs: [INSTAGRAM_URL],
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${SITE_URL}/#sitio`,
              name: SITE_NAME,
              alternateName: SITE_ALT_NAME,
              url: SITE_URL,
              inLanguage: "es-AR",
              publisher: { "@id": `${SITE_URL}/#organizacion` },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/productos?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <AnimatedFavicon />
        <StoreChrome
          initialHome={home}
          initialProducts={products}
          initialCategories={categories}
        >
          {children}
        </StoreChrome>
      </body>
    </html>
  );
}
