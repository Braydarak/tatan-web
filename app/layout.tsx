import type { Metadata } from "next";
import { Suspense } from "react";
import { Fredoka, Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ui/ScrollToTop";
import StoreChrome from "@/components/ui/StoreChrome";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <StoreChrome>{children}</StoreChrome>
      </body>
    </html>
  );
}
