"use client";

import { createContext, useContext } from "react";
import type { StoreSettings } from "@/components/sections/HomeHeroEditor";
import { STORE_SETTINGS_DEFAULT } from "@/lib/site-content-defaults";

const Ctx = createContext<StoreSettings>(STORE_SETTINGS_DEFAULT);

/** Opciones de la tienda (del CRM) disponibles en los componentes del cliente. */
export function StoreSettingsProvider({
  value,
  children,
}: {
  value?: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <Ctx.Provider value={{ ...STORE_SETTINGS_DEFAULT, ...(value ?? {}) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStoreSettings = () => useContext(Ctx);
