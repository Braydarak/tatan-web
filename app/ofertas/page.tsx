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

const productImages = {
  bodyOsito:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20baby%20onesie%20body%20beige%20cotton%20with%20teddy%20bear%20print%20soft%20pastel%20colors%20flat%20lay%20kids%20clothing%20photography&image_size=square_hd",
  bodyNubes:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=adorable%20baby%20onesie%20body%20white%20with%20clouds%20and%20stars%20pastel%20blue%20pink%20soft%20cotton%20flat%20lay%20baby%20clothing&image_size=square_hd",
  bodyArcoiris:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20baby%20onesie%20rainbow%20print%20soft%20cream%20color%20cotton%20bodysuit%20flat%20lay%20aesthetic%20kids%20fashion&image_size=square_hd",
  bodyAnimalitos:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=baby%20bodysuit%20onesie%20sage%20green%20with%20cute%20safari%20animals%20print%20soft%20cotton%20flat%20lay%20aesthetic%20baby%20clothing&image_size=square_hd",
  remeraDino:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20kids%20t-shirt%20mustard%20yellow%20with%20cartoon%20dinosaur%20print%20soft%20cotton%20flat%20lay%20children%20clothing%20photography&image_size=square_hd",
  remeraFlores:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=adorable%20little%20girl%20t-shirt%20soft%20pink%20with%20cute%20flowers%20print%20cotton%20flat%20lay%20aesthetic%20kids%20fashion%20pastel&image_size=square_hd",
  remeraCohete:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20boys%20tshirt%20soft%20blue%20with%20rocket%20space%20print%20cotton%20flat%20lay%20kids%20clothing%20photography%20pastel%20colors&image_size=square_hd",
  remeraCorazones:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=kids%20tshirt%20cream%20white%20with%20cute%20little%20hearts%20print%20soft%20cotton%20flat%20lay%20children%20fashion%20aesthetic&image_size=square_hd",
  bodyManta:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cozy%20baby%20onesie%20pijama%20mint%20green%20soft%20fleece%20stars%20pattern%20flat%20lay%20warm%20baby%20clothing&image_size=square_hd",
  bodyPijama:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=baby%20pajama%20onesie%20sleeper%20soft%20pink%20little%20sheep%20print%20cozy%20cotton%20flat%20lay%20aesthetic%20toddler%20pjs&image_size=square_hd",
  remeraRayada:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=kids%20striped%20tshirt%20red%20white%20soft%20cotton%20classic%20mariniere%20flat%20lay%20unisex%20children%20clothing&image_size=square_hd",
  bodySet:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=set%20of%203%20baby%20bodysuits%20pastel%20colors%20stripes%20dots%20soft%20cotton%20flat%20lay%20neutrals%20beige%20pink%20green&image_size=square_hd",
};

type OfferProduct = {
  id: string;
  name: string;
  category: "Body" | "Remera" | "Pijama" | "Set";
  imageSrc: string;
  originalPrice: number;
  offerPrice: number;
  colorHex: string;
  badge?: "Hot" | "Últimas unidades" | "Nuevo";
  tag: string;
};

const OFFERS: OfferProduct[] = [
  {
    id: "of-001",
    name: "Body Osito Amor",
    category: "Body",
    imageSrc: productImages.bodyOsito,
    originalPrice: 15990,
    offerPrice: 10990,
    colorHex: "#F5E6D3",
    badge: "Hot",
    tag: "Más vendido",
  },
  {
    id: "of-002",
    name: "Remera Dino Aventura",
    category: "Remera",
    imageSrc: productImages.remeraDino,
    originalPrice: 12990,
    offerPrice: 8990,
    colorHex: "#F5E6B8",
    badge: "Últimas unidades",
    tag: "Talles 4-6 solo",
  },
  {
    id: "of-003",
    name: "Remera Cohete Espacial",
    category: "Remera",
    imageSrc: productImages.remeraCohete,
    originalPrice: 13490,
    offerPrice: 9490,
    colorHex: "#D8E8F5",
    tag: "Verano 2026",
  },
  {
    id: "of-004",
    name: "Body Pijama Ovejiita",
    category: "Pijama",
    imageSrc: productImages.bodyPijama,
    originalPrice: 18990,
    offerPrice: 12990,
    colorHex: "#F8E0E8",
    badge: "Nuevo",
    tag: "Manga larga",
  },
  {
    id: "of-005",
    name: "Remera Rayada Clásica",
    category: "Remera",
    imageSrc: productImages.remeraRayada,
    originalPrice: 10490,
    offerPrice: 6990,
    colorHex: "#F2D0C8",
    tag: "Unisex",
  },
  {
    id: "of-006",
    name: "Body Manta Estrellitas",
    category: "Pijama",
    imageSrc: productImages.bodyManta,
    originalPrice: 21990,
    offerPrice: 15990,
    colorHex: "#D8E8D8",
    badge: "Hot",
    tag: "Micro polar",
  },
  {
    id: "of-007",
    name: "Set x3 Bodys Neutros",
    category: "Set",
    imageSrc: productImages.bodySet,
    originalPrice: 34990,
    offerPrice: 22990,
    colorHex: "#F0E8F5",
    badge: "Últimas unidades",
    tag: "Pack ahorro",
  },
  {
    id: "of-008",
    name: "Body Nubes y Estrellas",
    category: "Body",
    imageSrc: productImages.bodyNubes,
    originalPrice: 11990,
    offerPrice: 8990,
    colorHex: "#E8F0F8",
    tag: "Recién nacido",
  },
  {
    id: "of-009",
    name: "Body Arcoiris Mágico",
    category: "Body",
    imageSrc: productImages.bodyArcoiris,
    originalPrice: 13490,
    offerPrice: 9990,
    colorHex: "#F0E8F5",
    tag: "Babyshower",
  },
  {
    id: "of-010",
    name: "Body Safari Animalitos",
    category: "Body",
    imageSrc: productImages.bodyAnimalitos,
    originalPrice: 14490,
    offerPrice: 10490,
    colorHex: "#D8E8D8",
    tag: "Manga larga",
  },
  {
    id: "of-011",
    name: "Remera Flores Boho",
    category: "Remera",
    imageSrc: productImages.remeraFlores,
    originalPrice: 10990,
    offerPrice: 7790,
    colorHex: "#F8E0E8",
    tag: "Volados",
  },
  {
    id: "of-012",
    name: "Remera Corazones Dulces",
    category: "Remera",
    imageSrc: productImages.remeraCorazones,
    originalPrice: 9490,
    offerPrice: 6790,
    colorHex: "#F5F0EB",
    badge: "Hot",
    tag: "Básico infaltable",
  },
];

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

const CATEGORY_MAP: Record<OfferProduct["category"], FilterKey> = {
  Body: "body",
  Remera: "remera",
  Pijama: "pijama",
  Set: "set",
};

function discountPct(p: OfferProduct) {
  return Math.round(((p.originalPrice - p.offerPrice) / p.originalPrice) * 100);
}

function filterAndSort(items: OfferProduct[], f: FilterKey, s: SortKey) {
  const filtered =
    f === "todos" ? items : items.filter((p) => CATEGORY_MAP[p.category] === f);

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

  const items = filterAndSort(OFFERS, filterKey, sortKey);

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
            ? OFFERS.length
            : OFFERS.filter((o) => CATEGORY_MAP[o.category] === f.key).length,
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
                      productUrl={`/product/${
                        OFFERS.find((o) => o.name === p.name)?.id ?? "b-001"
                      }`}
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
