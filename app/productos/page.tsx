import Link from "next/link";
import Header from "@/components/ui/Header";
import ProductCard from "@/components/ui/productCard/ProductCard";
import FilterPanel from "@/components/ui/FilterPanel";
import { Sparkles, Gift, ArrowLeft, Star, Search } from "lucide-react";

export const metadata = {
  title: "Productos Tatan — Toda la colección de ropa infantil",
  description:
    "Bodys, remeras, pijamas y accesorios para bebés y niños. Filtra por categoría, talle y precio. 100% algodón.",
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
  pantalonJogger:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=kids%20jogger%20pants%20sage%20green%20soft%20cotton%20cuffed%20flat%20lay%20unisex%20children%20clothing%20aesthetic%20pastel&image_size=square_hd",
  buzoPolar:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=toddler%20hoodie%20zip%20up%20soft%20cream%20color%20fleece%20inside%20teddy%20bear%20ears%20on%20hood%20flat%20lay%20kids%20outerwear&image_size=square_hd",
  accesorioBabero:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=baby%20bib%20set%20of%203%20cotton%20muslin%20pastel%20beige%20pink%20green%20prints%20soft%20flat%20lay%20aesthetic%20baby%20accessories&image_size=square_hd",
  accesorioMedias:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20baby%20socks%20set%205%20pairs%20pastel%20colors%20bunny%20ears%20soft%20cotton%20flat%20lay%20adorable%20baby%20clothes&image_size=square_hd",
};

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

const ALL_PRODUCTS: Product[] = [
  {
    id: "b-001",
    name: "Body Osito Amor",
    category: "body",
    imageSrc: productImages.bodyOsito,
    price: 12990,
    originalPrice: 15990,
    colorHex: "#F5E6D3",
    sizeGroup: "bebe",
    badge: "Top",
    rating: 4.9,
    reviews: 124,
    tagline: "Clásico del mes",
  },
  {
    id: "b-002",
    name: "Body Nubes y Estrellas",
    category: "body",
    imageSrc: productImages.bodyNubes,
    price: 11990,
    colorHex: "#E8F0F8",
    sizeGroup: "bebe",
    rating: 4.8,
    reviews: 89,
    tagline: "Recién nacido",
  },
  {
    id: "b-003",
    name: "Body Arcoiris Mágico",
    category: "body",
    imageSrc: productImages.bodyArcoiris,
    price: 13490,
    colorHex: "#F0E8F5",
    sizeGroup: "bebe",
    badge: "Nuevo",
    rating: 4.9,
    reviews: 67,
    tagline: "Edición limitada",
  },
  {
    id: "b-004",
    name: "Body Safari Animalitos",
    category: "body",
    imageSrc: productImages.bodyAnimalitos,
    price: 14490,
    originalPrice: 17990,
    colorHex: "#D8E8D8",
    sizeGroup: "bebe",
    rating: 4.7,
    reviews: 52,
    tagline: "Manga larga",
  },
  {
    id: "r-001",
    name: "Remera Dino Aventura",
    category: "remera",
    imageSrc: productImages.remeraDino,
    price: 12990,
    originalPrice: 15490,
    colorHex: "#F5E6B8",
    sizeGroup: "ninios",
    badge: "Top",
    rating: 4.9,
    reviews: 142,
    tagline: "Más vendida",
  },
  {
    id: "r-002",
    name: "Remera Flores Boho",
    category: "remera",
    imageSrc: productImages.remeraFlores,
    price: 10990,
    colorHex: "#F8E0E8",
    sizeGroup: "ninios",
    rating: 4.8,
    reviews: 76,
    tagline: "Volados",
  },
  {
    id: "r-003",
    name: "Remera Cohete Espacial",
    category: "remera",
    imageSrc: productImages.remeraCohete,
    price: 13490,
    colorHex: "#D8E8F5",
    sizeGroup: "ninios",
    badge: "Nuevo",
    rating: 4.9,
    reviews: 58,
    tagline: "Verano 2026",
  },
  {
    id: "r-004",
    name: "Remera Corazones Dulces",
    category: "remera",
    imageSrc: productImages.remeraCorazones,
    price: 9490,
    colorHex: "#F5F0EB",
    sizeGroup: "ninios",
    rating: 4.7,
    reviews: 104,
    tagline: "Básico infaltable",
  },
  {
    id: "r-005",
    name: "Remera Rayada Clásica",
    category: "remera",
    imageSrc: productImages.remeraRayada,
    price: 10490,
    originalPrice: 12990,
    colorHex: "#F2D0C8",
    sizeGroup: "ninios",
    rating: 4.6,
    reviews: 41,
    tagline: "Unisex",
  },
  {
    id: "p-001",
    name: "Pijama Ovejiita Dulce",
    category: "pijama",
    imageSrc: productImages.bodyPijama,
    price: 18990,
    colorHex: "#F8E0E8",
    sizeGroup: "bebe",
    badge: "Nuevo",
    rating: 4.9,
    reviews: 36,
    tagline: "Manga larga",
  },
  {
    id: "p-002",
    name: "Pijama Manta Estrellitas",
    category: "pijama",
    imageSrc: productImages.bodyManta,
    price: 21990,
    originalPrice: 26490,
    colorHex: "#D8E8D8",
    sizeGroup: "bebe",
    rating: 4.8,
    reviews: 29,
    tagline: "Micropolar",
  },
  {
    id: "s-001",
    name: "Set x3 Bodys Neutros",
    category: "set",
    imageSrc: productImages.bodySet,
    price: 34990,
    originalPrice: 41990,
    colorHex: "#F0E8F5",
    sizeGroup: "bebe",
    badge: "Top",
    rating: 5.0,
    reviews: 88,
    tagline: "Pack ahorro",
  },
  {
    id: "pn-001",
    name: "Jogger Verde Menta",
    category: "pantalon",
    imageSrc: productImages.pantalonJogger,
    price: 15490,
    colorHex: "#D8E8D8",
    sizeGroup: "ninios",
    badge: "Nuevo",
    rating: 4.8,
    reviews: 22,
    tagline: "Algodón peinado",
  },
  {
    id: "pn-002",
    name: "Jogger Beige Clásico",
    category: "pantalon",
    imageSrc: productImages.pantalonJogger,
    price: 14990,
    colorHex: "#F5E6D3",
    sizeGroup: "ninios",
    rating: 4.7,
    reviews: 18,
    tagline: "Unisex",
  },
  {
    id: "bz-001",
    name: "Buzo Orejitas Osito",
    category: "buzo",
    imageSrc: productImages.buzoPolar,
    price: 27990,
    colorHex: "#F5F0EB",
    sizeGroup: "bebe",
    badge: "Último",
    rating: 4.9,
    reviews: 15,
    tagline: "Forrado polar",
  },
  {
    id: "bz-002",
    name: "Buzo Canguro Clásico",
    category: "buzo",
    imageSrc: productImages.buzoPolar,
    price: 24990,
    originalPrice: 29990,
    colorHex: "#E8F0F8",
    sizeGroup: "ninios",
    rating: 4.6,
    reviews: 12,
    tagline: "Cierre con capucha",
  },
  {
    id: "ac-001",
    name: "Set x3 Baberos Muselina",
    category: "accesorio",
    imageSrc: productImages.accesorioBabero,
    price: 11990,
    colorHex: "#F0E8F5",
    sizeGroup: "bebe",
    rating: 4.9,
    reviews: 112,
    tagline: "Ideal regalo",
  },
  {
    id: "ac-002",
    name: "Pack Medias x5 Conejitos",
    category: "accesorio",
    imageSrc: productImages.accesorioMedias,
    price: 8990,
    colorHex: "#F8E0E8",
    sizeGroup: "bebe",
    badge: "Nuevo",
    rating: 4.8,
    reviews: 73,
    tagline: "Antideslizantes",
  },
  {
    id: "ac-003",
    name: "Gorrito Recién Nacido",
    category: "accesorio",
    imageSrc: productImages.bodyManta,
    price: 5990,
    colorHex: "#F5F0EB",
    sizeGroup: "bebe",
    rating: 4.7,
    reviews: 49,
    tagline: "Algodón orgánico",
  },
  {
    id: "s-002",
    name: "Set Remera + Jogger",
    category: "set",
    imageSrc: productImages.remeraDino,
    price: 26990,
    colorHex: "#F5E6B8",
    sizeGroup: "ninios",
    badge: "Nuevo",
    rating: 4.9,
    reviews: 8,
    tagline: "Conjunto listo",
  },
];

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

function filterAndSort() {
  return function (state: {
    cat: CategoryKey;
    size: SizeGroup;
    pr: PriceRange;
    sort: SortKey;
    q: string;
  }) {
    const priceRule = PRICE_FILTERS.find((r) => r.key === state.pr)!.test;
    let list = ALL_PRODUCTS.filter((p) => {
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
  const state = applyFilters({ searchParams: resolvedSp });
  const items = filterAndSort()(state);

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
            ? ALL_PRODUCTS.length
            : ALL_PRODUCTS.filter((p) => p.category === c.key).length,
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
      <Header />
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
