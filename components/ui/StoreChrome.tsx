"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";

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
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bare = isBare(pathname);

  return (
    <>
      {bare ? null : <Header />}
      {children}
      {bare ? null : <Footer />}
    </>
  );
}
