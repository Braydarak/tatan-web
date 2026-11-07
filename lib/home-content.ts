import type {
  HomeCategoryItem,
  HomeHeroData,
  HomeSections,
} from "@/components/sections/HomeHeroEditor";
import {
  HOME_HERO_DEFAULT,
  HOME_PROMO_DEFAULT,
  HOME_SECTIONS_DEFAULT,
  PRODUCTS_PAGE_DEFAULT,
  STORE_SETTINGS_DEFAULT,
  HEADER_DEFAULT,
} from "@/lib/site-content-defaults";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Mezcla un objeto guardado con sus valores por defecto (un nivel). */
function merge<T extends Obj>(def: T, saved: unknown): T {
  if (!isObj(saved)) return def;
  const out: Obj = { ...def };
  for (const k of Object.keys(def)) {
    if (!(k in saved)) continue;
    const d = def[k];
    const v = saved[k];
    out[k] = isObj(d) && isObj(v) ? { ...d, ...v } : v;
  }
  return out as T;
}

/** Categorías: respeta el orden/valores guardados y suma las que falten. */
function mergeCategories(saved: unknown): HomeCategoryItem[] {
  const def = HOME_SECTIONS_DEFAULT.categories.items;
  if (!Array.isArray(saved)) return def;
  const list = saved
    .filter(isObj)
    .map((it) => {
      const d = def.find((x) => x.key === it.key);
      return d ? ({ ...d, ...it } as HomeCategoryItem) : null;
    })
    .filter((x): x is HomeCategoryItem => x !== null);
  for (const d of def) if (!list.some((x) => x.key === d.key)) list.push(d);
  return list;
}

function mergeHeader(saved: unknown): typeof HEADER_DEFAULT {
  if (!isObj(saved)) return HEADER_DEFAULT;
  const messages = Array.isArray(saved.messages)
    ? saved.messages.filter(isObj).map((m) => ({
        text: typeof m.text === "string" ? m.text : "",
        mpLogo: m.mpLogo === true,
      }))
    : HEADER_DEFAULT.messages;
  const sec = Number(saved.intervalSec);
  return {
    show: saved.show !== false,
    messages,
    intervalSec: Number.isFinite(sec) && sec >= 1.5 ? Math.min(sec, 20) : HEADER_DEFAULT.intervalSec,
  };
}

/**
 * Completa lo guardado en `home_hero` con los valores por defecto, así las
 * secciones nuevas funcionan aunque el contenido se haya guardado antes de
 * que existieran.
 */
export function withHomeDefaults(saved: Partial<HomeHeroData> | null | undefined): HomeHeroData {
  const s = (saved ?? {}) as Partial<HomeHeroData>;
  const sectionsSaved = isObj(s.sections) ? (s.sections as Obj) : {};
  const sections = merge(HOME_SECTIONS_DEFAULT as unknown as Obj, sectionsSaved) as unknown as HomeSections;
  sections.categories = {
    ...sections.categories,
    items: mergeCategories(
      isObj(sectionsSaved.categories)
        ? (sectionsSaved.categories as Obj).items
        : undefined,
    ),
  };
  if (!Array.isArray(sections.marquee.items)) sections.marquee.items = [];

  // Fotos de la portada: lista nueva, o la foto única de antes
  const imageSrc = typeof s.imageSrc === "string" && s.imageSrc ? s.imageSrc : HOME_HERO_DEFAULT.imageSrc;
  const images = (Array.isArray(s.images) ? s.images : [])
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    .slice(0, 5);

  return {
    ...HOME_HERO_DEFAULT,
    ...s,
    imageSrc: images[0] ?? imageSrc,
    images: images.length ? images : [imageSrc],
    cottonBadge: { ...HOME_HERO_DEFAULT.cottonBadge, ...(s.cottonBadge ?? {}) },
    shippingBadge: { ...HOME_HERO_DEFAULT.shippingBadge, ...(s.shippingBadge ?? {}) },
    benefits: Array.isArray(s.benefits) && s.benefits.length
      ? HOME_HERO_DEFAULT.benefits.map((d, i) => ({ ...d, ...(s.benefits?.[i] ?? {}) }))
      : HOME_HERO_DEFAULT.benefits,
    promo: { ...HOME_PROMO_DEFAULT, ...(s.promo ?? {}) },
    sections,
    productsPage: merge(PRODUCTS_PAGE_DEFAULT as unknown as Obj, s.productsPage) as unknown as typeof PRODUCTS_PAGE_DEFAULT,
    store: { ...STORE_SETTINGS_DEFAULT, ...(s.store ?? {}) },
    header: mergeHeader(s.header),
  };
}

const PHP_API_BASE = "https://tatankids.com.ar/api";

/** Lee `home_hero` (portada, secciones, página de productos y opciones). */
export async function fetchHomeContentSSR(): Promise<HomeHeroData> {
  try {
    const res = await fetch(`${PHP_API_BASE}/site-content.php?key=home_hero`, {
      next: { revalidate: 60, tags: ["tatan-site-content"] },
      cache: "force-cache",
    });
    if (!res.ok) return withHomeDefaults(null);
    const json = (await res.json()) as { ok?: boolean; data?: Partial<HomeHeroData> };
    return withHomeDefaults(json?.ok ? json.data : null);
  } catch {
    return withHomeDefaults(null);
  }
}
