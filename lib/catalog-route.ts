/**
 * Rutas del catálogo (ver lib/seo.ts): qué fija cada una (categoría o
 * grupo de talles), su URL limpia y sus textos. Las usan el armado al
 * compilar (components/pages/Catalog.tsx) y la vista en el navegador
 * (components/pages/CatalogView.tsx).
 */

import type { Category } from "@/lib/categories";
import {
  ALL_SEO,
  SIZE_SEO,
  SIZE_PATH,
  categoryPath,
  categorySeo,
  type CatalogSeo,
  type SizeGroupKey,
} from "@/lib/seo";

export type CatalogRoute =
  | { kind: "all" }
  | { kind: "category"; key: string }
  | { kind: "size"; size: SizeGroupKey };

export type SearchParams = { [key: string]: string | string[] | undefined };

/** Parámetros de la URL + lo que fija la ruta (/productos/body → c=body) */
export function routeParams(route: CatalogRoute, sp: SearchParams): SearchParams {
  if (route.kind === "category") return { ...sp, c: route.key };
  if (route.kind === "size") return { ...sp, t: route.size };
  return sp;
}

/** Ruta limpia (sin filtros extra) de lo que se está viendo */
export function routePath(route: CatalogRoute): string {
  if (route.kind === "category") return categoryPath(route.key);
  if (route.kind === "size") return SIZE_PATH[route.size];
  return "/productos";
}

/** Textos SEO de la ruta */
export function routeSeo(route: CatalogRoute, categories: Category[]): CatalogSeo | null {
  if (route.kind === "all") return ALL_SEO;
  if (route.kind === "size") return SIZE_SEO[route.size];
  const cat = categories.find((c) => c.key === route.key && c.active);
  return cat ? categorySeo(cat.key, cat.label) : null;
}

/** Hay filtros extra (precio, orden, búsqueda…): esa variante no se indexa */
export function hasExtraFilters(route: CatalogRoute, sp: SearchParams): boolean {
  const keys = ["pr", "s", "q"];
  if (route.kind !== "size") keys.push("t");
  if (route.kind !== "category") keys.push("c");
  return keys.some((k) => typeof sp[k] === "string" && sp[k] !== "");
}
