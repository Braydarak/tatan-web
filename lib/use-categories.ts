"use client";

import { useEffect, useState } from "react";
import { apiCategories } from "@/lib/tatan-api";
import { DEFAULT_CATEGORIES, categoryLabel, type Category } from "@/lib/categories";

// Caché compartida entre componentes del CRM (se pide una sola vez)
let cache: { all: boolean; list: Category[] } | null = null;
let inflight: Promise<Category[]> | null = null;
const listeners = new Set<(l: Category[]) => void>();

async function load(all: boolean, force = false): Promise<Category[]> {
  if (!force && cache && (cache.all || !all)) return cache.list;
  if (!force && inflight) return inflight;
  inflight = apiCategories(all)
    .then(({ list }) => {
      cache = { all, list };
      listeners.forEach((l) => l(list));
      return list;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Vuelve a pedir las categorías (después de crear/editar). */
export function refreshCategories(all = true) {
  return load(all, true);
}

/**
 * Categorías para el CRM. `all` incluye las ocultas (para elegir en un
 * producto que ya estaba en una categoría oculta, o administrarlas).
 */
export function useCategories(all = true) {
  const [list, setList] = useState<Category[]>(cache?.list ?? DEFAULT_CATEGORIES);
  useEffect(() => {
    let alive = true;
    const l = (next: Category[]) => alive && setList(next);
    listeners.add(l);
    load(all).then(l);
    return () => {
      alive = false;
      listeners.delete(l);
    };
  }, [all]);
  return {
    categories: list,
    label: (key: string) => categoryLabel(list, key),
  };
}
