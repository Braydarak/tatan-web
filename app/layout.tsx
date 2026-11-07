import type { Metadata } from "next";
import { Suspense } from "react";
import { Fredoka, Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ui/ScrollToTop";
import StoreChrome from "@/components/ui/StoreChrome";
import { fetchHomeContentSSR } from "@/lib/home-content";
import { fetchAllProductsSSR, offersInfo } from "@/lib/card-props";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  const [{ header, store }, products] = await Promise.all([
    fetchHomeContentSSR(),
    fetchAllProductsSSR(),
  ]);
  // Sin ofertas cargadas no se muestra el link a /ofertas
  const offers = offersInfo(products);
  const hasBanner =
    !!header?.show && header.messages.some((m) => m.text.trim().length > 0);
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${fredoka.variable} h-full antialiased`}
      // Alto del header fijo (con o sin la franja de mensajes)
      style={{ "--header-h": hasBanner ? "101px" : "69px" } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col relative">
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <StoreChrome header={header} store={store} offers={offers}>
          {children}
        </StoreChrome>
      </body>
    </html>
  );
}
