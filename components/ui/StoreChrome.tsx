"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
import type {
  HeaderContent,
  StoreSettings,
} from "@/components/sections/HomeHeroEditor";
import { StoreSettingsProvider } from "@/components/StoreSettingsContext";
import type { OffersInfo } from "@/lib/card-props";

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

export default function StoreChrome({
  children,
  header,
  store,
  offers,
}: {
  children: React.ReactNode;
  header?: HeaderContent;
  store?: StoreSettings;
  offers?: OffersInfo;
}) {
  const pathname = usePathname();
  const bare = isBare(pathname);

  return (
    <StoreSettingsProvider value={store}>
      {bare ? null : <Header announcements={header} offers={offers} />}
      {children}
      {bare ? null : <Footer hasOffers={(offers?.count ?? 0) > 0} />}
    </StoreSettingsProvider>
  );
}
