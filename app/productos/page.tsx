import Link from "next/link";
import { buyOptionsFromApi, type BuyOptions } from "@/lib/buy-options";
import ProductCard from "@/components/ui/productCard/ProductCard";
import SortSelect from "@/components/ui/SortSelect";
import { fetchHomeContentSSR } from "@/lib/home-content";
import { fetchCategoriesSSR, type Category } from "@/lib/categories";
import {
  Sparkles,
  Gift,
  Search,
  ChevronRight,
  X,
  LayoutGrid,
  Baby,
  Shirt,
  Moon,
  Tag,
} from "lucide-react";
import type { Product as ApiProduct } from "@/lib/tatan-api";

export const metadata = {
  title: "Productos Tatan — Toda la colección de ropa infantil",
  description:
    "Bodys, remeras, pijamas y accesorios para bebés y niños. Filtra por categoría, talle y precio. 100% algodón.",
};

const PHP_API_BASE = "https://tatankids.com.ar/api";

async function fetchProductsSSR(): Promise<ApiProduct[]> {
  try {
    const res = await fetch(`${PHP_API_BASE}/products.php`, {
      next: { revalidate: 60, tags: ["tatan-products"] },
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { ok?: boolean; data?: ApiProduct[] };
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

function badgeFromApi(
  api: Pick<
    ApiProduct,
    "id" | "createdAt" | "soldTotal" | "rating" | "reviews"
  >,
): Product["badge"] | undefined {
  const idNum = Number(api.id.match(/^[a-z]+-(\d+)$/)?.[1] ?? 0);
  if (api.soldTotal >= 50 || (api.rating >= 4.8 && api.reviews >= 40))
    return "Top";
  if (!idNum || idNum <= 2) return "Nuevo";
  if (api.reviews > 0 && api.reviews <= 20 && api.rating >= 4.7)
    return "Último";
  return undefined;
}

function mapApiToListProduct(api: ApiProduct): Product {
  return {
    id: api.id,
    name: api.name,
    category: api.category,
    imageSrc:
      api.imageSrc ||
      `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20${encodeURIComponent(api.category)}%20kids%20clothing%20pastel%20flat%20lay&image_size=square_hd`,
    price: Number(api.price) || 0,
    originalPrice:
      api.originalPrice != null
        ? Number(api.originalPrice) || undefined
        : undefined,
    colorHex: api.colorHex || "#F5E6D3",
    sizeGroup: api.sizeGroup,
    badge: badgeFromApi(api),
    rating: Number(api.rating) || 4.6,
    reviews: Number(api.reviews) || 0,
    tagline: api.tagline || "100% Algodón",
    installments: Number(api.installments) || undefined,
    buy: buyOptionsFromApi(api),
    images: Array.isArray(api.gallery) ? api.gallery.filter(Boolean) : [],
  };
}

async function getAllProductsForPage(): Promise<Product[]> {
  const fromApi = await fetchProductsSSR();
  return fromApi.map(mapApiToListProduct);
}

/** key de una categoría (vienen de la base) o "todos" */
type CategoryKey = string;

type SizeGroup = "bebe" | "ninios" | "todos";
type SortKey = "recomendado" | "menor" | "mayor" | "novedades";
type PriceRange = "todos" | "hasta10k" | "10a20k" | "20a30k" | "mas30k";

type Product = {
  id: string;
  name: string;
  category: string;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  colorHex: string;
  sizeGroup: SizeGroup;
  badge?: "Nuevo" | "Top" | "Último";
  rating: number;
  reviews: number;
  tagline: string;
  installments?: number;
  buy: BuyOptions;
  images: string[];
};

type CategoryFilter = { key: CategoryKey; label: string };

/** Chips de categorías: "Todos" + las categorías visibles de la base. */
function categoryFilters(categories: Category[]): CategoryFilter[] {
  return [
    { key: "todos", label: "Todos" },
    ...categories
      .filter((c) => c.active)
      .map((c) => ({ key: c.key, label: c.label })),
  ];
}

const SIZE_FILTERS: { key: SizeGroup; label: string; hint: string }[] = [
  { key: "todos", label: "Todos los talles", hint: "" },
  { key: "bebe", label: "Bebé (RN a 24M)", hint: "0-2 años" },
  { key: "ninios", label: "Niños (2 a 10)", hint: "2-10 años" },
];

const PRICE_FILTERS: {
  key: PriceRange;
  label: string;
  test: (n: number) => boolean;
}[] = [
  { key: "todos", label: "Todos", test: () => true },
  { key: "hasta10k", label: "Hasta $10.000", test: (n) => n <= 10000 },
  {
    key: "10a20k",
    label: "$10.000 - $20.000",
    test: (n) => n > 10000 && n <= 20000,
  },
  {
    key: "20a30k",
    label: "$20.000 - $30.000",
    test: (n) => n > 20000 && n <= 30000,
  },
  { key: "mas30k", label: "Más de $30.000", test: (n) => n > 30000 },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recomendado", label: "Recomendados" },
  { key: "novedades", label: "Novedades" },
  { key: "menor", label: "Menor precio" },
  { key: "mayor", label: "Mayor precio" },
];

function discountPct(p: Product) {
  return p.originalPrice
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    : undefined;
}

function applyFilters(params: {
  searchParams: Awaited<{ [k: string]: string | string[] | undefined }>;
  filters: CategoryFilter[];
}) {
  const sp = params.searchParams ?? {};
  const cat: CategoryKey =
    typeof sp.c === "string" && params.filters.some((x) => x.key === sp.c)
      ? sp.c
      : "todos";
  const size =
    typeof sp.t === "string" && SIZE_FILTERS.some((x) => x.key === sp.t)
      ? (sp.t as SizeGroup)
      : ("todos" as const);
  const pr =
    typeof sp.pr === "string" && PRICE_FILTERS.some((x) => x.key === sp.pr)
      ? (sp.pr as PriceRange)
      : ("todos" as const);
  const sort =
    typeof sp.s === "string" && SORTS.some((x) => x.key === sp.s)
      ? (sp.s as SortKey)
      : ("recomendado" as const);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  return { cat, size, pr, sort, q };
}

function filterAndSort(all: Product[]) {
  return function (state: {
    cat: CategoryKey;
    size: SizeGroup;
    pr: PriceRange;
    sort: SortKey;
    q: string;
  }) {
    const priceRule = PRICE_FILTERS.find((r) => r.key === state.pr)!.test;
    let list = all.filter((p) => {
      if (state.cat !== "todos" && p.category !== state.cat) return false;
      if (state.size !== "todos" && p.sizeGroup !== state.size) return false;
      if (!priceRule(p.price)) return false;
      if (state.q) {
        const qq = state.q.toLowerCase();
        return (
          p.name.toLowerCase().includes(qq) ||
          p.tagline.toLowerCase().includes(qq) ||
          p.category.toLowerCase().includes(qq)
        );
      }
      return true;
    });
    switch (state.sort) {
      case "menor":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "mayor":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "novedades":
        list = [...list].sort((a, b) => {
          const w = (x: Product) =>
            (x.badge === "Nuevo" ? 3 : x.badge === "Último" ? 1 : 0) +
            (x.id.match(/^[a-z]+-(\d+)$/)?.[1]
              ? 10 - Math.min(10, Number(x.id.match(/^[a-z]+-(\d+)$/)![1]))
              : 0);
          return w(b) - w(a);
        });
        break;
      default:
        list = [...list].sort((a, b) => {
          const w = (x: Product) =>
            x.rating * 2 +
            Math.log10(x.reviews + 1) * 1.6 +
            (x.badge === "Top" ? 2.2 : x.badge ? 1.3 : 0);
          return w(b) - w(a);
        });
    }
    return list;
  };
}

// Ícono de cada categoría conocida; las nuevas usan una etiqueta
const CATEGORY_ICON: Record<string, typeof LayoutGrid> = {
  todos: LayoutGrid,
  body: Baby,
  remera: Shirt,
  pijama: Moon,
  set: Gift,
  pantalon: Shirt,
  buzo: Moon,
  accesorio: Sparkles,
};

type FilterState = ReturnType<typeof applyFilters>;

/** Link a /productos con los filtros actuales y un cambio. */
function hrefWith(state: FilterState, patch: Partial<FilterState>) {
  const next = { ...state, ...patch };
  const qs = new URLSearchParams();
  if (next.cat !== "todos") qs.set("c", next.cat);
  if (next.size !== "todos") qs.set("t", next.size);
  if (next.pr !== "todos") qs.set("pr", next.pr);
  if (next.sort !== "recomendado") qs.set("s", next.sort);
  if (next.q) qs.set("q", next.q);
  const str = qs.toString();
  return str ? `/productos?${str}` : "/productos";
}

function Chip({
  href,
  active,
  children,
  tone = "primary",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  tone?: "primary" | "soft";
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
        active
          ? tone === "primary"
            ? "border-tatan-primario4 bg-tatan-primario4 text-zinc-800 shadow-sm"
            : "border-tatan-acento-verde/60 bg-tatan-acento-verde/25 text-zinc-800"
          : "border-tatan-secundario1/70 bg-white/80 text-zinc-600 hover:border-tatan-primario4 hover:text-zinc-800"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSp = await searchParams;
  const [allProducts, content, categories] = await Promise.all([
    getAllProductsForPage(),
    fetchHomeContentSSR(),
    fetchCategoriesSSR(),
  ]);
  const CATEGORY_FILTERS = categoryFilters(categories);
  const page = content.productsPage!;
  const quickAdd = content.store?.quickAdd !== false;
  const state = applyFilters({
    searchParams: resolvedSp,
    filters: CATEGORY_FILTERS,
  });
  const items = filterAndSort(allProducts)(state);
  const hasOffers = allProducts.some(
    (p) => p.originalPrice && p.originalPrice > p.price,
  );
  // El banner a /ofertas no se muestra si no hay ninguna oferta cargada
  const showBanner =
    page.banner.show &&
    (page.banner.buttonHref.replace(/\/$/, "") !== "/ofertas" || hasOffers);

  const countFor = (key: CategoryKey) =>
    key === "todos"
      ? allProducts.length
      : allProducts.filter((p) => p.category === key).length;
  // Solo categorías con productos (y la elegida, aunque quede vacía)
  const categoryChips = CATEGORY_FILTERS.filter(
    (c) => c.key === "todos" || countFor(c.key) > 0 || c.key === state.cat,
  );
  const categoryLabel =
    state.cat === "todos"
      ? null
      : (CATEGORY_FILTERS.find((x) => x.key === state.cat)?.label ?? null);

  const activeFilters = [
    categoryLabel && {
      label: categoryLabel,
      href: hrefWith(state, { cat: "todos" }),
    },
    state.size !== "todos" && {
      label: SIZE_FILTERS.find((x) => x.key === state.size)?.label ?? "",
      href: hrefWith(state, { size: "todos" }),
    },
    state.pr !== "todos" && {
      label: PRICE_FILTERS.find((x) => x.key === state.pr)?.label ?? "",
      href: hrefWith(state, { pr: "todos" }),
    },
    state.q && {
      label: `“${state.q}”`,
      href: hrefWith(state, { q: "" }),
    },
  ].filter(Boolean) as { label: string; href: string }[];

  const sortHrefs = Object.fromEntries(
    SORTS.map((s) => [s.key, hrefWith(state, { sort: s.key })]),
  );

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        {/* ───────── Encabezado ───────── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-tatan-acento-azul/25 blur-3xl" />
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-tatan-acento-verde/20 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 w-60 h-60 rounded-full bg-tatan-acento-rosa/25 blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 sm:pt-10 sm:pb-8">
            <nav
              aria-label="Ruta"
              className="anim-rise mb-3 flex items-center gap-1.5 text-xs font-semibold text-zinc-500"
            >
              <Link href="/" className="hover:text-zinc-800">
                Inicio
              </Link>
              <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
              <Link href="/productos" className="hover:text-zinc-800">
                Productos
              </Link>
              {categoryLabel && (
                <>
                  <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
                  <span className="text-zinc-700">{categoryLabel}</span>
                </>
              )}
            </nav>
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 max-w-2xl">
                <h1
                  className="anim-rise text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-800 leading-tight"
                  style={{ "--d": "0.08s" } as React.CSSProperties}
                >
                  {categoryLabel ?? page.title}
                </h1>
                {page.subtitle && (
                  <p
                    className="anim-rise mt-2 text-sm sm:text-base text-zinc-600 leading-relaxed"
                    style={{ "--d": "0.16s" } as React.CSSProperties}
                  >
                    {page.subtitle}
                  </p>
                )}
              </div>
              <form
                action="/productos"
                role="search"
                className="anim-rise relative w-full md:w-80 shrink-0"
                style={{ "--d": "0.22s" } as React.CSSProperties}
              >
                {state.cat !== "todos" && (
                  <input type="hidden" name="c" value={state.cat} />
                )}
                {state.size !== "todos" && (
                  <input type="hidden" name="t" value={state.size} />
                )}
                {state.pr !== "todos" && (
                  <input type="hidden" name="pr" value={state.pr} />
                )}
                {state.sort !== "recomendado" && (
                  <input type="hidden" name="s" value={state.sort} />
                )}
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  strokeWidth={2.2}
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={state.q}
                  placeholder="Buscar body, pijama, batita…"
                  aria-label="Buscar productos"
                  className="h-12 w-full rounded-2xl border border-tatan-secundario1/70 bg-white/90 pl-10 pr-24 text-sm text-zinc-800 shadow-sm outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/70"
                />
                <button
                  type="submit"
                  className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl px-3.5 py-2 text-xs font-bold"
                >
                  Buscar
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ───────── Filtros ───────── */}
        <div className="sticky top-[var(--header-h,101px)] z-30 border-y border-tatan-secundario1/50 bg-[#FBF7F0]/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3 sm:mx-0 sm:px-0"
              aria-label="Categorías"
            >
              {categoryChips.map((c) => {
                const Icon = CATEGORY_ICON[c.key] ?? Tag;
                const active = state.cat === c.key;
                return (
                  <Chip
                    key={c.key}
                    href={hrefWith(state, { cat: c.key })}
                    active={active}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {c.label}
                    <span
                      className={`rounded-full px-1.5 text-[11px] font-bold ${
                        active ? "bg-white/50" : "bg-tatan-secundario1/40"
                      }`}
                    >
                      {countFor(c.key)}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="no-scrollbar -mx-4 flex min-w-0 items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-visible">
              {SIZE_FILTERS.map((s) => (
                <Chip
                  key={s.key}
                  href={hrefWith(state, { size: s.key })}
                  active={state.size === s.key}
                  tone="soft"
                >
                  {s.key === "bebe" && (
                    <Baby className="h-4 w-4" strokeWidth={2} />
                  )}
                  {s.key === "ninios" && (
                    <Shirt className="h-4 w-4" strokeWidth={2} />
                  )}
                  {s.key === "todos" ? "Todas las edades" : s.label}
                </Chip>
              ))}
              <span className="mx-1 h-6 w-px shrink-0 bg-tatan-secundario1" />
              {PRICE_FILTERS.filter((r) => r.key !== "todos").map((r) => (
                <Chip
                  key={r.key}
                  href={hrefWith(state, {
                    pr: state.pr === r.key ? "todos" : r.key,
                  })}
                  active={state.pr === r.key}
                  tone="soft"
                >
                  {r.label}
                </Chip>
              ))}
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 lg:justify-end">
              <p className="text-sm font-semibold text-zinc-500 lg:hidden">
                {items.length} producto{items.length === 1 ? "" : "s"}
              </p>
              <SortSelect
                value={state.sort}
                options={SORTS}
                hrefs={sortHrefs}
              />
            </div>
          </div>

          <div
            className={`mt-4 flex-wrap items-center gap-2 min-h-8 ${
              activeFilters.length > 0 ? "flex" : "hidden lg:flex"
            }`}
          >
            <p className="hidden lg:block text-sm font-semibold text-zinc-500 mr-1">
              {items.length} producto{items.length === 1 ? "" : "s"}
            </p>
            {activeFilters.map((f) => (
              <Link
                key={f.href + f.label}
                href={f.href}
                scroll={false}
                className="group inline-flex items-center gap-1.5 rounded-full bg-tatan-primario1/60 py-1 pl-3 pr-2 text-xs font-bold text-zinc-700 hover:bg-tatan-primario1"
                aria-label={`Quitar filtro ${f.label}`}
              >
                {f.label}
                <X className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-800" strokeWidth={2.6} />
              </Link>
            ))}
            {activeFilters.length > 1 && (
              <Link
                href={hrefWith(state, {
                  cat: "todos",
                  size: "todos",
                  pr: "todos",
                  q: "",
                })}
                scroll={false}
                className="text-xs font-bold text-zinc-500 underline underline-offset-4 hover:text-zinc-800"
              >
                Limpiar todo
              </Link>
            )}
          </div>

          <div className="mt-5">
            {items.length === 0 ? (
              <div className="paper-card rounded-3xl px-6 py-14 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-tatan-primario1/60 flex items-center justify-center">
                  <Search
                    className="w-8 h-8 text-tatan-primario4"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-800">
                    No encontramos productos
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Probá con otra categoría o sacá algún filtro.
                  </p>
                </div>
                <Link
                  href="/productos"
                  className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold"
                >
                  <Sparkles className="w-4 h-4" strokeWidth={2} />
                  Ver todos los productos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 justify-items-center">
                {items.map((p, idx) => (
                  <div
                    key={`prod-${p.id}`}
                    className="anim-rise w-full flex justify-center"
                    style={
                      { "--d": `${Math.min(idx, 8) * 0.05}s` } as React.CSSProperties
                    }
                  >
                    <ProductCard
                      id={p.id}
                      title={p.name}
                      imageSrc={p.imageSrc}
                      originalPrice={p.originalPrice}
                      discountedPrice={p.price}
                      discountPercentage={discountPct(p)}
                      installments={p.installments}
                      installmentPrice={
                        p.installments
                          ? Math.round(p.price / p.installments)
                          : undefined
                      }
                      buy={quickAdd ? p.buy : undefined}
                    wholesale={p.buy.wholesale}
                      ctaLabel="Ver producto"
                      images={p.images}
                      taxFreePrice={Math.round(p.price * 0.79)}
                      colorHex={p.colorHex}
                      productUrl={`/product/${p.id}`}
                      loading={idx < 4 ? "eager" : "lazy"}
                      priority={idx === 0}
                      badge={
                        p.badge === "Top"
                          ? "Más elegido"
                          : p.badge === "Nuevo"
                            ? "Nuevo"
                            : undefined
                      }
                      tagline={p.tagline}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {showBanner && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
            <div className="paper-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-tatan-acento-rosa/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-tatan-acento-verde/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
                <div>
                  {page.banner.label && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-tatan-primario2/70 px-4 py-1.5 mb-4">
                      <Sparkles
                        className="w-4 h-4 text-zinc-700"
                        strokeWidth={2.2}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                        {page.banner.label}
                      </span>
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 leading-tight mb-2">
                    {page.banner.title}
                  </h2>
                  {page.banner.text && (
                    <p className="text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed">
                      {page.banner.text}
                    </p>
                  )}
                </div>
                {page.banner.buttonText && (
                  <Link
                    href={page.banner.buttonHref || "/ofertas"}
                    className="btn-primary font-bold px-6 py-3.5 rounded-2xl text-base inline-flex items-center justify-center gap-2"
                  >
                    <Gift className="w-5 h-5" strokeWidth={2} />
                    {page.banner.buttonText}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
