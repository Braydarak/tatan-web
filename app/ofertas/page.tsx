import Link from "next/link";
import ProductCard from "@/components/ui/productCard/ProductCard";
import FilterPanel from "@/components/ui/FilterPanel";
import {
  Sparkles,
  Gift,
  ArrowLeft,
  Percent,
  Clock,
  Shield,
  Check,
} from "lucide-react";

export const metadata = {
  title: "Ofertas Tatan — Ropa infantil con descuentos",
  description:
    "Ofertas en bodys, remeras, pijamas y accesorios para bebés y niños. Hasta 40% OFF. Envío gratis a partir de $25.000.",
};

import type { Product as ApiProduct } from "@/lib/tatan-api";

const PHP_API_BASE = "https://tatankids.com.ar/api";

type OfferProduct = {
  id: string;
  name: string;
  category: string;
  imageSrc: string;
  originalPrice: number;
  offerPrice: number;
  colorHex: string;
  badge?: "Hot" | "Últimas unidades";
  tag: string;
};

async function fetchOffersSSR(): Promise<ApiProduct[]> {
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

function mapApiToOffer(api: ApiProduct): OfferProduct | null {
  const originalPrice =
    api.originalPrice != null ? Number(api.originalPrice) : 0;
  const offerPrice = Number(api.price) || 0;
  if (!originalPrice || originalPrice <= offerPrice) return null;
  const pct = Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
  return {
    id: api.id,
    name: api.name,
    category: (api.category || "").toLowerCase(),
    imageSrc:
      api.imageSrc ||
      `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20${encodeURIComponent(api.category)}%20kids%20clothing%20pastel%20flat%20lay&image_size=square_hd`,
    originalPrice,
    offerPrice,
    colorHex: api.colorHex || "#F5E6D3",
    badge: pct >= 30 ? "Hot" : pct >= 20 ? "Últimas unidades" : undefined,
    tag: api.tagline || "Oferta",
  };
}

async function getOffersForPage(): Promise<OfferProduct[]> {
  const fromApi = await fetchOffersSSR();
  return fromApi
    .map(mapApiToOffer)
    .filter((o): o is OfferProduct => o !== null);
}

type FilterKey = "todos" | "body" | "remera" | "pijama" | "set";
type SortKey = "recomendado" | "menor" | "mayor" | "descuento";

const FILTERS: {
  key: FilterKey;
  label: string;
  Icon: "gift" | "baby" | "shirt" | "moon";
}[] = [
  { key: "todos", label: "Todos", Icon: "gift" },
  { key: "body", label: "Bodys", Icon: "baby" },
  { key: "remera", label: "Remeras", Icon: "shirt" },
  { key: "pijama", label: "Pijamas", Icon: "moon" },
  { key: "set", label: "Sets", Icon: "gift" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recomendado", label: "Recomendados" },
  { key: "menor", label: "Menor precio" },
  { key: "mayor", label: "Mayor precio" },
  { key: "descuento", label: "Mayor % OFF" },
];

function discountPct(p: OfferProduct) {
  return Math.round(((p.originalPrice - p.offerPrice) / p.originalPrice) * 100);
}

function filterAndSort(items: OfferProduct[], f: FilterKey, s: SortKey) {
  const filtered =
    f === "todos" ? items : items.filter((p) => p.category === f);

  const sorted = [...filtered];
  switch (s) {
    case "menor":
      sorted.sort((a, b) => a.offerPrice - b.offerPrice);
      break;
    case "mayor":
      sorted.sort((a, b) => b.offerPrice - a.offerPrice);
      break;
    case "descuento":
      sorted.sort((a, b) => discountPct(b) - discountPct(a));
      break;
    default:
      sorted.sort((a, b) => {
        const weight = (p: OfferProduct) =>
          (p.badge === "Hot" ? 3 : p.badge ? 1 : 0) + discountPct(p) / 40;
        return weight(b) - weight(a);
      });
  }
  return sorted;
}

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const rawFilter = typeof sp?.c === "string" ? (sp.c as string) : "todos";
  const rawSort = typeof sp?.s === "string" ? (sp.s as string) : "recomendado";

  const filterKey = FILTERS.some((x) => x.key === rawFilter)
    ? (rawFilter as FilterKey)
    : "todos";
  const sortKey = SORTS.some((x) => x.key === rawSort)
    ? (rawSort as SortKey)
    : "recomendado";

  const allOffers = await getOffersForPage();
  const items = filterAndSort(allOffers, filterKey, sortKey);

  if (!items.length && filterKey !== "todos") {
    // notFound();
  }

  const activeCount = [filterKey !== "todos", sortKey !== "recomendado"].filter(
    Boolean,
  ).length;

  const groups: React.ComponentProps<typeof FilterPanel>["groups"] = [
    {
      id: "category",
      qsKey: "c",
      activeTint: "primary",
      style: "row",
      options: FILTERS.map((f) => ({
        key: f.key,
        label: f.label,
        icon: f.Icon,
        count:
          f.key === "todos"
            ? allOffers.length
            : allOffers.filter((o) => o.category === f.key).length,
      })),
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full max-h-[560px] pointer-events-none">
            <div className="absolute top-0 -left-8 w-56 h-56 rounded-full bg-tatan-acento-rosa/40 blur-3xl" />
            <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-tatan-acento-amarillo/40 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full bg-tatan-acento-azul/30 blur-3xl" />
          </div>
        </section>

        <section className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 pb-4">
          <FilterPanel
            basePath="/ofertas"
            groups={groups}
            sort={{ qsKey: "s", options: SORTS, active: sortKey }}
            active={{ c: filterKey, s: sortKey }}
            clearHref="/ofertas"
            activeCount={activeCount}
            compact
          />

          <div className="mt-6 flex items-end justify-between flex-wrap gap-3">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-8 h-1 rounded-full bg-tatan-primario4" />
                <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                  {filterKey === "todos"
                    ? "Todas las ofertas"
                    : (FILTERS.find((f) => f.key === filterKey)?.label ??
                      "Resultados")}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 flex items-center gap-2 flex-wrap">
                {items.length} producto{items.length === 1 ? "" : "s"} en oferta
                {filterKey !== "todos" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-tatan-primario3/30 text-tatan-secundario2 text-[11px] font-bold px-3 py-1 align-middle">
                    <Percent className="w-3.5 h-3.5" strokeWidth={2.4} />
                    Solo {FILTERS.find((f) => f.key === filterKey)?.label ?? ""}
                  </span>
                )}
                {sortKey !== "recomendado" && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 rounded-full bg-tatan-primario1/60 px-2.5 py-1">
                    Orden: {SORTS.find((x) => x.key === sortKey)?.label}
                  </span>
                )}
              </h2>
            </div>
            <Link
              href="/productos"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
              Ver colección
            </Link>
          </div>

          <div className="mt-8">
            {items.length === 0 ? (
              <div className="paper-card rounded-3xl p-12 text-center">
                <p className="text-zinc-500">
                  No hay productos que coincidan con este filtro.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 justify-items-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((p, idx) => (
                  <div
                    key={`of-${p.id}`}
                    className="relative w-full max-w-[320px]"
                  >
                    <ProductCard
                      id={p.id}
                      title={p.name}
                      imageSrc={p.imageSrc}
                      originalPrice={p.originalPrice}
                      discountedPrice={p.offerPrice}
                      discountPercentage={discountPct(p)}
                      installments={6}
                      installmentPrice={Math.round(p.offerPrice / 6)}
                      taxFreePrice={Math.round(p.offerPrice * 0.79)}
                      colorHex={p.colorHex}
                      productUrl={`/product/${p.id}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      priority={idx === 0}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6">
          <div className="paper-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-tatan-acento-rosa/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-tatan-acento-verde/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-tatan-primario2/70 px-4 py-1.5 mb-4">
                  <Sparkles
                    className="w-4 h-4 text-zinc-700"
                    strokeWidth={2.2}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    Beneficios Tatan
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-800 leading-tight mb-4">
                  Comprá con tranquilidad
                </h3>
                <ul className="space-y-3">
                  {[
                    { Icon: Clock, t: "Despachamos en 24hs hábiles" },
                    {
                      Icon: Shield,
                      t: "Garantía de 3 meses en toda la compra",
                    },
                    {
                      Icon: Check,
                      t: "Devolución de dinero si no te convence",
                    },
                  ].map(({ Icon, t }, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-tatan-acento-verde/25 text-tatan-acento-verde flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                      </span>
                      <span className="text-sm text-zinc-700 font-medium leading-relaxed">
                        {t}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/productos"
                  className="btn-primary font-bold px-6 py-3.5 rounded-2xl text-base inline-flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" strokeWidth={2} />
                  Ver toda la colección
                </Link>
                <Link
                  href="#top"
                  className="px-6 py-3.5 rounded-2xl text-base font-bold border-2 border-tatan-secundario1/50 text-zinc-700 hover:bg-white/60 transition-colors paper-card inline-flex items-center justify-center gap-2"
                >
                  Volver arriba
                  <ArrowLeft className="w-4 h-4 -rotate-90" strokeWidth={2.2} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
