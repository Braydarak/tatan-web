import Link from "next/link";
import ProductCard from "@/components/ui/productCard/ProductCard";
import FilterPanel from "@/components/ui/FilterPanel";
import { Sparkles, Gift, ArrowLeft, Star, Search } from "lucide-react";
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
  };
}

async function getAllProductsForPage(): Promise<Product[]> {
  const fromApi = await fetchProductsSSR();
  return fromApi.map(mapApiToListProduct);
}

type CategoryKey =
  | "todos"
  | "body"
  | "remera"
  | "pijama"
  | "set"
  | "pantalon"
  | "buzo"
  | "accesorio";

type SizeGroup = "bebe" | "ninios" | "todos";
type SortKey = "recomendado" | "menor" | "mayor" | "novedades";
type PriceRange = "todos" | "hasta10k" | "10a20k" | "20a30k" | "mas30k";

type Product = {
  id: string;
  name: string;
  category: Exclude<CategoryKey, "todos">;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  colorHex: string;
  sizeGroup: SizeGroup;
  badge?: "Nuevo" | "Top" | "Último";
  rating: number;
  reviews: number;
  tagline: string;
};

const CATEGORY_FILTERS: {
  key: CategoryKey;
  label: string;
  Icon: "layout-grid" | "baby" | "shirt" | "moon" | "gift" | "sparkles";
}[] = [
  { key: "todos", label: "Todos", Icon: "layout-grid" },
  { key: "body", label: "Bodys", Icon: "baby" },
  { key: "remera", label: "Remeras", Icon: "shirt" },
  { key: "pijama", label: "Pijamas", Icon: "moon" },
  { key: "set", label: "Sets", Icon: "gift" },
  { key: "pantalon", label: "Pantalones", Icon: "shirt" },
  { key: "buzo", label: "Buzos", Icon: "moon" },
  { key: "accesorio", label: "Accesorios", Icon: "sparkles" },
];

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
}) {
  const sp = params.searchParams ?? {};
  const cat =
    typeof sp.c === "string" && CATEGORY_FILTERS.some((x) => x.key === sp.c)
      ? (sp.c as CategoryKey)
      : ("todos" as const);
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

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSp = await searchParams;
  const allProducts = await getAllProductsForPage();
  const state = applyFilters({ searchParams: resolvedSp });
  const items = filterAndSort(allProducts)(state);

  const activeCount = [
    state.cat !== "todos",
    state.size !== "todos",
    state.pr !== "todos",
    !!state.q,
    state.sort !== "recomendado",
  ].filter(Boolean).length;

  const groupOptions: React.ComponentProps<typeof FilterPanel>["groups"] = [
    {
      id: "category",
      qsKey: "c",
      title: "Categoría",
      activeTint: "primary",
      style: "stack",
      indicator: "pill",
      options: CATEGORY_FILTERS.map((c) => ({
        key: c.key,
        label: c.label,
        icon: c.Icon,
        count:
          c.key === "todos"
            ? allProducts.length
            : allProducts.filter((p) => p.category === c.key).length,
      })),
    },
    {
      id: "size",
      qsKey: "t",
      title: "Grupo de talles",
      activeTint: "beige",
      style: "stack",
      indicator: "checkbox",
      options: SIZE_FILTERS.map((s) => ({
        key: s.key,
        label: s.label,
        hint: s.hint || undefined,
      })),
    },
    {
      id: "price",
      qsKey: "pr",
      title: "Rango de precio",
      activeTint: "green",
      style: "stack",
      indicator: "dot",
      options: PRICE_FILTERS.map((r) => ({ key: r.key, label: r.label })),
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full max-h-[560px] pointer-events-none">
            <div className="absolute top-0 -left-8 w-56 h-56 rounded-full bg-tatan-acento-azul/30 blur-3xl" />
            <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-tatan-acento-verde/30 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full bg-tatan-acento-rosa/30 blur-3xl" />
          </div>
        </section>

        <section className="max-w-7xl mt-10 mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <FilterPanel
            basePath="/productos"
            groups={groupOptions}
            sort={{ qsKey: "s", options: SORTS, active: state.sort }}
            active={{
              c: state.cat,
              t: state.size,
              pr: state.pr,
              s: state.sort,
            }}
            clearHref="/productos"
            activeCount={activeCount}
          />

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-8 h-1 rounded-full bg-tatan-primario4" />
                <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                  {state.cat === "todos"
                    ? "Toda la colección"
                    : (CATEGORY_FILTERS.find((x) => x.key === state.cat)
                        ?.label ?? "Resultados")}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 flex items-center gap-2 flex-wrap">
                {items.length} producto{items.length === 1 ? "" : "s"}
                {state.sort !== "recomendado" && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 rounded-full bg-tatan-primario1/60 px-2.5 py-1">
                    Orden: {SORTS.find((x) => x.key === state.sort)?.label}
                  </span>
                )}
              </h2>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
              Volver al inicio
            </Link>
          </div>

          <div className="mt-8">
            {items.length === 0 ? (
              <div className="paper-card rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-tatan-primario1/60 flex items-center justify-center mx-auto">
                  <Search
                    className="w-8 h-8 text-tatan-primario4"
                    strokeWidth={2}
                  />
                </div>
                <p className="text-lg font-bold text-zinc-800">
                  No encontramos productos con estos filtros
                </p>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Probá limpiando los filtros o cambiando el rango de precio.
                </p>
                <Link
                  href="/productos"
                  className="btn-primary inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-2xl text-sm"
                >
                  <Sparkles className="w-4 h-4" strokeWidth={2} />
                  Limpiar y ver todos
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 justify-items-center sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p, idx) => (
                  <div
                    key={`prod-${p.id}`}
                    className="relative w-full max-w-[320px]"
                  >
                    <ProductCard
                      id={p.id}
                      title={p.name}
                      imageSrc={p.imageSrc}
                      originalPrice={p.originalPrice}
                      discountedPrice={p.price}
                      discountPercentage={discountPct(p)}
                      installments={6}
                      installmentPrice={Math.round(p.price / 6)}
                      taxFreePrice={Math.round(p.price * 0.79)}
                      colorHex={p.colorHex}
                      productUrl={`/product/${p.id}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      priority={idx === 0}
                    />
                    <div className="absolute top-3 left-3 translate-x-0 translate-y-0 pointer-events-none z-20">
                      <div className="flex flex-col gap-1.5 items-start">
                        {p.badge && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-md border border-white/80 ${
                              p.badge === "Top"
                                ? "bg-gradient-to-r from-tatan-primario4 to-tatan-secundario2 text-white"
                                : p.badge === "Nuevo"
                                  ? "bg-tatan-acento-azul/90 text-white"
                                  : "bg-gradient-to-r from-tatan-acento-rosa to-tatan-primario4 text-white"
                            }`}
                          >
                            {p.badge}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 text-zinc-700 border border-tatan-secundario1/60 px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
                          <Star
                            className="w-2.5 h-2.5 text-amber-500 fill-current"
                            strokeWidth={0}
                          />
                          {p.tagline}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6">
          <div className="paper-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-tatan-acento-rosa/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-tatan-acento-verde/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-tatan-primario2/70 px-4 py-1.5 mb-4">
                  <Sparkles
                    className="w-4 h-4 text-zinc-700"
                    strokeWidth={2.2}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    ¿Buscás algo en oferta?
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-800 leading-tight mb-2">
                  Mirá las ofertas de la semana
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed">
                  Hasta 40% OFF en prendas seleccionadas. Envío gratis y cambios
                  sin cargo.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link
                  href="/ofertas"
                  className="btn-primary font-bold px-6 py-3.5 rounded-2xl text-base inline-flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" strokeWidth={2} />
                  Ir a Ofertas
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3.5 rounded-2xl text-base font-bold border-2 border-tatan-secundario1/50 text-zinc-700 hover:bg-white/60 transition-colors paper-card inline-flex items-center justify-center gap-2"
                >
                  Volver al Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
