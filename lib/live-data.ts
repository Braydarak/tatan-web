"use client";

/**
 * Datos de la tienda EN VIVO desde la API PHP (en el navegador).
 *
 * La web se sube a Ferozo como archivos estáticos (sin Node): cada página
 * se arma al compilar con los datos de ese momento (eso es lo que lee
 * Google) y, al abrirla, el navegador vuelve a pedir los datos a la API.
 * Si algo cambió en el CRM (un precio, el stock, un texto, un producto
 * nuevo), la página se actualiza sola.
 *
 * Cada recurso se pide una vez por visita (y se renueva cada minuto) y se
 * comparte entre todos los componentes que lo usan.
 */

import { useEffect, useState } from "react";
import type { HomeHeroData } from "@/components/sections/HomeHeroEditor";
import type { Category } from "@/lib/categories";
import { withHomeDefaults } from "@/lib/home-content";
import { parseSizeGuides, type SizeGuides } from "@/lib/size-guide";
import { apiBaseUrl, type Product as ApiProduct } from "@/lib/tatan-api";

type Resources = {
  products: ApiProduct[];
  categories: Category[];
  home: HomeHeroData;
  envios: unknown;
  sizeGuides: SizeGuides;
};
export type LiveKey = keyof Resources;

type Json = { ok?: boolean; data?: unknown };

/** Dónde se pide cada recurso y cómo se lee la respuesta (null = no usar) */
const SOURCES: { [K in LiveKey]: { path: string; parse: (j: Json) => Resources[K] | null } } = {
  products: {
    path: "/products.php",
    parse: (j) =>
      Array.isArray(j.data) ? (j.data as ApiProduct[]).filter((p) => p.active !== false) : null,
  },
  categories: {
    path: "/categories.php",
    parse: (j) => (j.ok && Array.isArray(j.data) ? (j.data as Category[]) : null),
  },
  home: {
    path: "/site-content.php?key=home_hero",
    parse: (j) => (j.ok ? withHomeDefaults(j.data as Partial<HomeHeroData>) : null),
  },
  envios: {
    path: "/site-content.php?key=envios",
    parse: (j) => (j.ok && j.data ? j.data : null),
  },
  sizeGuides: {
    path: "/site-content.php?key=size_guides",
    parse: (j) => (j.ok ? parseSizeGuides(j.data) : null),
  },
};

const MAX_AGE = 60_000;
const cache = new Map<LiveKey, { at: number; promise: Promise<unknown> }>();

function load<K extends LiveKey>(key: K): Promise<Resources[K] | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < MAX_AGE) return hit.promise as Promise<Resources[K] | null>;
  const { path, parse } = SOURCES[key];
  const promise = fetch(`${apiBaseUrl()}${path}`, { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? (r.json() as Promise<Json>) : null))
    .then((j) => (j ? parse(j) : null))
    .catch(() => null);
  cache.set(key, { at: Date.now(), promise });
  return promise as Promise<Resources[K] | null>;
}

/**
 * Valor en vivo de un recurso. Arranca con `initial` (lo del build, así el
 * HTML y la primera pintada coinciden) y lo reemplaza cuando llega la API.
 * Si la API falla, se queda con `initial`.
 */
export function useLive<K extends LiveKey>(key: K, initial: Resources[K]): Resources[K] {
  return useLiveStatus(key, initial)[0];
}

/** Como useLive, y además si ya respondió la API (true también si falló) */
export function useLiveStatus<K extends LiveKey>(
  key: K,
  initial: Resources[K],
): [Resources[K], boolean] {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    load(key).then((v) => {
      if (!alive) return;
      if (v != null) setValue(v);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [key]);
  return [value, ready];
}

/** "Se compró junto con" de unos productos (solo pedidos pagados), en vivo */
export function useLiveCombos(ids: string[], initial: string[], limit = 4): string[] {
  const [value, setValue] = useState(initial);
  const idsKey = ids.join(",");
  useEffect(() => {
    if (!idsKey) return;
    let alive = true;
    const qs = new URLSearchParams({ ids: idsKey, limit: String(limit) });
    fetch(`${apiBaseUrl()}/combos.php?${qs}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ ok?: boolean; data?: { productId: string }[] }>) : null))
      .then((j) => {
        if (alive && j?.ok && Array.isArray(j.data)) setValue(j.data.map((d) => d.productId));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [idsKey, limit]);
  return value;
}
