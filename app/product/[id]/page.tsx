import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ui/productCard/ProductCard";
import type { Product as ApiProduct } from "@/lib/tatan-api";
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Truck,
  Leaf,
  Check,
  Heart,
  Star,
  Ruler,
  RotateCcw,
  Shield,
  Minus,
  Plus,
} from "lucide-react";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

type FullProduct = {
  id: string;
  name: string;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  colorHex: string;
  category: string;
  description: string;
  features: string[];
  sizes: string[];
  colorVariants: { name: string; hex: string }[];
  badge?: "Nuevo" | "Top" | "Último";
  relatedIds: string[];
};

const PHP_API_BASE = "https://tatankids.com.ar/api";

async function fetchProductByIdSSR(id: string): Promise<ApiProduct | null> {
  try {
    const res = await fetch(
      `${PHP_API_BASE}/products.php?id=${encodeURIComponent(id)}`,
      {
        next: { revalidate: 60, tags: ["tatan-product-detail"] },
        cache: "force-cache",
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; data?: ApiProduct };
    return json?.ok && json.data ? json.data : null;
  } catch {
    return null;
  }
}

function capitalizeLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function badgeFromApi(
  api: Pick<ApiProduct, "id" | "soldTotal" | "rating" | "reviews">,
): FullProduct["badge"] | undefined {
  const idNum = Number(api.id.match(/^[a-z]+-(\d+)$/)?.[1] ?? 0);
  if (api.soldTotal >= 50 || (api.rating >= 4.8 && api.reviews >= 40))
    return "Top";
  if (!idNum || idNum <= 2) return "Nuevo";
  if (api.reviews > 0 && api.reviews <= 20 && api.rating >= 4.7)
    return "Último";
  return undefined;
}

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  body: "Prenda de algodón extra suave para bebés, con broches de presión sin níquel y costuras antirozaduras para máxima comodidad en la piel delicada.",
  remera:
    "Remera de algodón cardado con cuello redondo reforzado. Ideal para usar sola o combinada. Lavable a máquina sin deformarse.",
  pijama:
    "Pijama de algodón o micropolar cálido y abrazable. Diseñado para dormir bien abrigaditos sin pasar calor.",
  set: "Pack ahorro de prendas coordinadas. Calidad premium a mejor precio. Regalo ideal para babyshowers o cumpleaños.",
  pantalon:
    "Jogger de algodón peinado con puños elásticos y cintura ajustable. Super cómodo para jugar todo el día.",
  buzo: "Buzo con capucha y forro polar suave. Cierre de calidad y bolsillos funcionales para las aventuras de los más chicos.",
  accesorio:
    "Accesorio práctico y lindo hecho con materiales hipoalergénicos. Complementa cualquier look del bebé o niño.",
};

const FALLBACK_FEATURES_POOL = [
  "100% Algodón peinado premium",
  "Sin etiquetas en el cuello",
  "Costuras planas antirozaduras",
  "Pre lavado - no encoge",
  "Hipoalergénico - apto piel atópica",
  "Lavable a máquina 30°",
  "Broches de presión sin níquel",
  "Secado rápido en sombra",
];

function pickDefaultFeatures(n: number) {
  return FALLBACK_FEATURES_POOL.slice(0, Math.max(3, Math.min(6, n)));
}

const DEFAULT_COLORS_BY_CAT: Record<string, { name: string; hex: string }[]> = {
  body: [
    { name: "Beige Clásico", hex: "#F5E6D3" },
    { name: "Rosa Suave", hex: "#F8E0E8" },
    { name: "Menta", hex: "#D8E8D8" },
  ],
  remera: [
    { name: "Estampa Original", hex: "#F5E6B8" },
    { name: "Cruda", hex: "#F5F0EB" },
  ],
  pijama: [
    { name: "Oveja Rosa", hex: "#F8E0E8" },
    { name: "Verde Manta", hex: "#D8E8D8" },
  ],
  set: [{ name: "Neutros", hex: "#F0E8F5" }],
  pantalon: [{ name: "Verde Menta", hex: "#D8E8D8" }],
  buzo: [{ name: "Crema Polar", hex: "#F5F0EB" }],
  accesorio: [{ name: "Pasteles", hex: "#F0E8F5" }],
};

function mapApiToFullProduct(api: ApiProduct): FullProduct {
  const cat = api.category || "body";
  const description = (api.description || "").trim()
    ? (api.description as string)
    : (FALLBACK_DESCRIPTIONS[cat] ?? FALLBACK_DESCRIPTIONS.body);
  const features =
    Array.isArray(api.features) && api.features.filter(Boolean).length
      ? api.features.filter(Boolean)
      : pickDefaultFeatures(api.features?.length || 4);
  const colorVariants =
    Array.isArray(api.colorVariants) && api.colorVariants.length
      ? api.colorVariants
      : (DEFAULT_COLORS_BY_CAT[cat] ?? DEFAULT_COLORS_BY_CAT.body);
  return {
    id: api.id,
    name: api.name,
    imageSrc:
      api.imageSrc ||
      `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20${encodeURIComponent(cat)}%20kids%20clothing%20pastel%20flat%20lay&image_size=square_hd`,
    price: Number(api.price) || 0,
    originalPrice:
      api.originalPrice != null
        ? Number(api.originalPrice) || undefined
        : undefined,
    colorHex: api.colorHex || "#F5E6D3",
    category: capitalizeLabel(cat),
    description,
    features,
    sizes:
      Array.isArray(api.sizes) && api.sizes.length
        ? api.sizes
        : ["3M", "6M", "9M", "12M"],
    colorVariants,
    badge: badgeFromApi(api),
    relatedIds:
      Array.isArray(api.relatedIds) && api.relatedIds.length
        ? api.relatedIds
        : [],
  };
}

type RelatedCard = {
  id: string;
  name: string;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  colorHex: string;
  badge?: FullProduct["badge"];
};

function getRelatedProducts(ids: string[], map: Record<string, RelatedCard>) {
  return ids.map((id) => map[id]).filter(Boolean) as RelatedCard[];
}

async function fetchRelatedMap(): Promise<Record<string, RelatedCard>> {
  try {
    const res = await fetch(`${PHP_API_BASE}/products.php`, {
      next: { revalidate: 60, tags: ["tatan-products"] },
      cache: "force-cache",
    });
    if (!res.ok) return {};
    const json = (await res.json()) as { ok?: boolean; data?: ApiProduct[] };
    if (!json?.ok || !Array.isArray(json.data)) return {};
    const out: Record<string, RelatedCard> = {};
    for (const api of json.data) {
      const mapped = mapApiToFullProduct(api);
      out[mapped.id] = {
        id: mapped.id,
        name: mapped.name,
        imageSrc: mapped.imageSrc,
        price: mapped.price,
        originalPrice: mapped.originalPrice,
        colorHex: mapped.colorHex,
        badge: mapped.badge,
      };
    }
    return out;
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const fromApi = await fetchProductByIdSSR(id);
  if (!fromApi) {
    notFound();
  }
  const product: FullProduct = mapApiToFullProduct(fromApi);

  const relatedMap = await fetchRelatedMap();
  const related = getRelatedProducts(product.relatedIds, relatedMap);

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-tatan-primario4 transition-colors mb-6 group"
          >
            <ArrowLeft
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2.2}
            />
            Volver al inicio
          </Link>

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
            <div className="space-y-4">
              <div className="relative paper-card rounded-3xl p-4 sm:p-6 overflow-hidden">
                {discount > 0 && (
                  <div className="absolute top-5 left-5 bg-tatan-primario2 text-zinc-800 rounded-full w-14 h-14 flex flex-col items-center justify-center text-center text-xs font-bold leading-tight z-10 shadow-sm">
                    <span>{discount}%</span>
                    <span>OFF</span>
                  </div>
                )}
                {product.badge && (
                  <div className="absolute top-5 right-5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm z-10 border border-tatan-secundario1/50 bg-white text-zinc-700">
                    {product.badge}
                  </div>
                )}
                <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-tatan-primario1/40 to-tatan-primario2/40 p-6 sm:p-8 flex items-center justify-center relative">
                  <Image
                    src={product.imageSrc}
                    alt={product.name}
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 1024px) 90vw, 600px"
                    className="object-cover rounded-2xl drop-shadow-lg p-4 sm:p-6"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`flex-1 aspect-square paper-card rounded-2xl overflow-hidden p-2 transition-all ${
                      i === 0
                        ? "ring-2 ring-tatan-primario4/60"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Vista ${i + 1} del producto`}
                  >
                    <div className="relative w-full h-full rounded-xl bg-white/60">
                      <Image
                        src={product.imageSrc}
                        alt={`${product.name} vista ${i + 1}`}
                        fill
                        sizes="100px"
                        className="object-cover rounded-xl p-1"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="paper-card rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-tatan-primario2/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                      {product.category}
                    </span>
                    {discount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tatan-acento-rosa/40 px-3 py-1 text-[11px] font-bold text-zinc-700">
                        Oferta limitada
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-zinc-800 leading-tight">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-current"
                        strokeWidth={0}
                      />
                    ))}
                    <span className="ml-2 text-xs text-zinc-500 font-medium">
                      (124 reseñas)
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  {product.originalPrice && (
                    <span className="text-lg text-zinc-400 line-through font-medium">
                      ${product.originalPrice.toLocaleString("es-AR")}
                    </span>
                  )}
                  <span className="text-3xl sm:text-4xl font-extrabold text-tatan-acento-verde tracking-tight">
                    ${product.price.toLocaleString("es-AR")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-tatan-acento-verde/15 border border-tatan-acento-verde/30 px-3 py-2.5">
                    <Truck
                      className="w-4 h-4 text-tatan-acento-verde shrink-0"
                      strokeWidth={2.2}
                    />
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Envío gratis +$25k
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-tatan-acento-azul/20 border border-tatan-acento-azul/30 px-3 py-2.5">
                    <Leaf
                      className="w-4 h-4 text-green-700 shrink-0"
                      strokeWidth={2.2}
                    />
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Algodón orgánico
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-bold text-zinc-800">
                      Talle
                    </span>
                    <button className="text-xs font-semibold text-tatan-secundario2 hover:underline inline-flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5" strokeWidth={2.2} />
                      Guía de talles
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {product.sizes.map((s, i) => (
                      <button
                        key={s}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          i === 2
                            ? "bg-tatan-primario4 text-white border-tatan-primario4 shadow-md"
                            : "bg-white/70 border-tatan-secundario1/40 text-zinc-700 hover:border-tatan-primario4/60"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-bold text-zinc-800 block mb-2.5">
                    Color
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {product.colorVariants.map((c, i) => (
                      <button
                        key={c.name}
                        className={`flex items-center gap-2 rounded-2xl px-3 py-2 border transition-all ${
                          i === 0
                            ? "border-tatan-primario4/60 bg-white shadow-sm"
                            : "border-transparent bg-white/50 hover:bg-white"
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-zinc-200 shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs font-semibold text-zinc-700">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-bold text-zinc-800 block mb-2.5">
                    Cantidad
                  </span>
                  <div className="inline-flex items-center rounded-2xl border border-tatan-secundario1/40 bg-white/80 overflow-hidden">
                    <button className="px-4 py-2.5 text-zinc-600 hover:text-tatan-primario4 hover:bg-tatan-primario1/40 transition-colors">
                      <Minus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <span className="px-4 py-2.5 text-sm font-bold text-zinc-800 border-x border-tatan-secundario1/40">
                      1
                    </span>
                    <button className="px-4 py-2.5 text-zinc-600 hover:text-tatan-primario4 hover:bg-tatan-primario1/40 transition-colors">
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button className="btn-primary font-bold px-6 py-3.5 rounded-2xl text-base flex-1 inline-flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                    Agregar al carrito
                  </button>
                  <button className="px-6 py-3.5 rounded-2xl text-base font-bold border-2 border-tatan-primario4 bg-tatan-primario4/10 text-tatan-secundario2 hover:bg-tatan-primario4/20 transition-colors flex-1 inline-flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" strokeWidth={2.2} />
                    Comprar ahora
                  </button>
                </div>

                <button className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-zinc-600 hover:text-red-500 transition-colors py-1">
                  <Heart className="w-4 h-4" strokeWidth={2} />
                  Guardar en favoritos
                </button>
              </div>

              <div className="paper-card rounded-3xl p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-bold text-zinc-800">
                  Características
                </h2>
                <ul className="space-y-3">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-tatan-acento-verde/25 text-tatan-acento-verde flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-zinc-600 leading-relaxed">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="paper-card rounded-3xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-zinc-800 mb-5">
                  Descripción
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                  {product.description}
                </p>
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-tatan-secundario1/40">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-tatan-acento-azul/20 flex items-center justify-center text-tatan-acento-azul">
                      <Truck className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Envío 3-7 días
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-tatan-acento-rosa/30 flex items-center justify-center text-tatan-primario4">
                      <RotateCcw className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Cambios 30 días
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-tatan-acento-verde/20 flex items-center justify-center text-tatan-acento-verde">
                      <Shield className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Garantía 3 meses
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-16 sm:mt-20">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="w-8 h-1 rounded-full bg-tatan-acento-rosa" />
                    <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                      También te puede gustar
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800">
                    Productos relacionados
                  </h2>
                </div>
              </div>
              <div className="grid gap-6 justify-items-center sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p, idx) => (
                  <ProductCard
                    key={`related-${p.id}`}
                    id={p.id}
                    title={p.name}
                    imageSrc={p.imageSrc}
                    originalPrice={p.originalPrice}
                    discountedPrice={p.price}
                    discountPercentage={
                      p.originalPrice
                        ? Math.round(
                            ((p.originalPrice - p.price) / p.originalPrice) *
                              100,
                          )
                        : undefined
                    }
                    installments={6}
                    installmentPrice={Math.round(p.price / 6)}
                    taxFreePrice={Math.round(p.price * 0.79)}
                    colorHex={p.colorHex}
                    productUrl={`/product/${p.id}`}
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
