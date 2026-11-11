import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { productHref, productSlug, slugify } from "@/lib/product-url";
import { buyOptionsFromApi, type BuyOptions } from "@/lib/buy-options";
import { fetchHomeContentSSR } from "@/lib/home-content";
import {
  apiToCardProps,
  fetchAllProductsSSR,
  fetchCombosSSR,
} from "@/lib/card-props";
import { wholesaleOf } from "@/lib/wholesale";
import { categoryLabel, fetchCategoriesSSR } from "@/lib/categories";
import { pickRelated } from "@/lib/related";
import ProductCard from "@/components/ui/productCard/ProductCard";
import ProductBuyBox from "@/components/cart/ProductBuyBox";
import ProductGallery from "@/components/product/ProductGallery";
import { hasText, sanitizeHtml } from "@/lib/sanitize-html";
import type { Product as ApiProduct } from "@/lib/tatan-api";
import {
  ChevronRight,
  ChevronDown,
  Truck,
  Check,
  RotateCcw,
  Shield,
  Gift,
  Tag,
} from "lucide-react";

type ProductPageProps = {
  /** Nombre del producto en la URL (o el ID, en links viejos) */
  params: Promise<{ slug: string }>;
};

type FullProduct = {
  id: string;
  name: string;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  colorHex: string;
  category: string;
  categoryKey: string;
  tagline: string;
  /** Número de artículo del producto */
  sku?: string;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  sizes: string[];
  colorVariants: { name: string; hex: string }[];
  badge?: "Nuevo" | "Top" | "Último";
  relatedIds: string[];
  installments?: number;
  buy: BuyOptions;
  images: string[];
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


function mapApiToFullProduct(api: ApiProduct): FullProduct {
  // Todo sale del producto cargado en el CRM: si falta algo, esa parte no
  // se muestra (no se inventan textos).
  const cat = api.category || "body";
  const description = sanitizeHtml(api.description);
  const features = Array.isArray(api.features)
    ? api.features.map((f) => String(f).trim()).filter(Boolean)
    : [];
  const colorVariants = Array.isArray(api.colorVariants)
    ? api.colorVariants
    : [];
  return {
    installments: Number(api.installments) || undefined,
    buy: buyOptionsFromApi(api),
    images: Array.isArray(api.gallery) ? api.gallery.filter(Boolean) : [],
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
    // El nombre real se completa con la categoría de la API (ver más abajo)
    category: capitalizeLabel(cat),
    categoryKey: cat,
    tagline: (api.tagline ?? "").trim(),
    sku: (api.slug ?? "").trim() || undefined,
    rating: Number(api.rating) || 0,
    reviews: Number(api.reviews) || 0,
    description,
    features,
    sizes: Array.isArray(api.sizes) ? api.sizes : [],
    colorVariants,
    badge: badgeFromApi(api),
    relatedIds:
      Array.isArray(api.relatedIds) && api.relatedIds.length
        ? api.relatedIds
        : [],
  };
}

/**
 * Producto de la URL: /product/<nombre> (o el ID, en links viejos).
 * Los fetch quedan cacheados, así que llamarla desde la página y desde
 * generateMetadata no repite pedidos a la API.
 */
async function findProduct(rawSlug: string): Promise<ApiProduct | null> {
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {}
  const allProducts = await fetchAllProductsSSR();
  const wanted = slugify(slug);
  const match = allProducts.find((p) => productSlug(p) === wanted);
  return fetchProductByIdSSR(match?.id ?? slug);
}

/** Título de la pestaña: el nombre del producto (+ " · Tatan" del layout) */
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = await findProduct(slug);
  if (!p) return { title: "Producto no encontrado" };
  const text = (p.tagline ?? "").trim() ||
    sanitizeHtml(p.description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const description = text ? text.slice(0, 160) : undefined;
  return {
    title: p.name,
    description,
    openGraph: {
      title: p.name,
      description,
      images: p.imageSrc ? [{ url: p.imageSrc }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: rawSlug } = await params;
  // La URL lleva el nombre del producto: /product/body-manga-larga
  const [fromApi, allProducts] = await Promise.all([
    findProduct(rawSlug),
    fetchAllProductsSSR(),
  ]);
  if (!fromApi) {
    notFound();
  }
  // Links viejos con el ID (/product/b-001) o escritos distinto: a la URL con el nombre.
  // La URL se arma con la lista de productos (la misma que usan los links de
  // la tienda): si el nombre cambió hace poco, la lista y el pedido por ID
  // pueden estar cacheados con nombres distintos y no se tiene que rebotar.
  const listed = allProducts.find((p) => p.id === fromApi.id) ?? fromApi;
  if (productSlug(listed) !== rawSlug) {
    permanentRedirect(productHref(listed));
  }
  const product: FullProduct = mapApiToFullProduct(fromApi);
  const id = product.id;

  const [content, combos, categories] = await Promise.all([
    fetchHomeContentSSR(),
    fetchCombosSSR([id], 4),
    fetchCategoriesSSR(),
  ]);
  // Nombre de la categoría tal como está en CRM → Categorías
  product.category = categoryLabel(categories, product.categoryKey);
  const quickAdd = content.store?.quickAdd !== false;
  const wholesaleMode = content.store?.wholesaleMode ?? "auto";
  const wholesale = wholesaleMode !== "off" ? wholesaleOf(fromApi) : undefined;
  // Relacionados: primero lo que se compró junto (pedidos pagados), después
  // los cargados en el CRM, la misma categoría y el resto.
  const related = pickRelated(allProducts, [product.id], 4, combos);
  const boughtTogether =
    combos.length > 0 && related.some((p) => combos.includes(p.id));

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;
  const showDescription = hasText(product.description);

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          <nav
            aria-label="Ruta"
            className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-zinc-500"
          >
            <Link href="/" className="hover:text-zinc-800">
              Inicio
            </Link>
            <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
            <Link href="/productos" className="hover:text-zinc-800">
              Productos
            </Link>
            <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
            <Link
              href={`/productos?c=${product.categoryKey}`}
              className="hover:text-zinc-800"
            >
              {product.category}
            </Link>
            <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
            <span className="text-zinc-700 truncate max-w-[50vw]">
              {product.name}
            </span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Fotos */}
            <div className="lg:sticky lg:top-[calc(var(--header-h,101px)+1.5rem)]">
              <ProductGallery
                images={Array.from(
                  new Set(
                    [
                      product.imageSrc,
                      ...product.images,
                      // fotos de los modelos, al final de la galería
                      ...product.buy.colors.map((c) => c.imageSrc ?? ""),
                    ].filter(Boolean),
                  ),
                )}
                name={product.name}
                colorHex={product.colorHex}
              >
                {discount > 0 && (
                  <span className="absolute top-5 left-5 sm:top-7 sm:left-7 z-10 rounded-full bg-tatan-acento-rosa px-3 py-1 text-xs font-extrabold text-zinc-800 shadow-sm">
                    -{discount}%
                  </span>
                )}
              </ProductGallery>
            </div>

            {/* Compra */}
            <div className="space-y-5">
              <div className="paper-card rounded-3xl p-5 sm:p-8 space-y-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/productos?c=${product.categoryKey}`}
                      className="rounded-full bg-tatan-primario2/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-700 hover:bg-tatan-primario2"
                    >
                      {product.category}
                    </Link>
                    {product.badge === "Nuevo" || product.badge === "Top" ? (
                      <span className="rounded-full border border-tatan-secundario1/60 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                        {product.badge === "Top" ? "Más elegido" : "Nuevo"}
                      </span>
                    ) : null}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-zinc-800 leading-tight">
                    {product.name}
                  </h1>
                  {product.tagline && (
                    <p className="mt-1.5 text-sm font-semibold text-tatan-secundario2">
                      {product.tagline}
                    </p>
                  )}
                </div>

                {/* Precio */}
                <div className="rounded-2xl bg-white/70 border border-tatan-secundario1/50 px-4 py-3.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#4da96c] tracking-tight">
                      ${product.price.toLocaleString("es-AR")}
                    </span>
                    {discount > 0 && product.originalPrice && (
                      <>
                        <span className="text-lg text-zinc-400 line-through">
                          ${product.originalPrice.toLocaleString("es-AR")}
                        </span>
                        <span className="rounded-full bg-tatan-acento-rosa/50 px-2 py-0.5 text-xs font-extrabold text-zinc-700">
                          Ahorrás $
                          {(product.originalPrice - product.price).toLocaleString(
                            "es-AR",
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    Precio sin impuestos nacionales $
                    {Math.round(product.price * 0.79).toLocaleString("es-AR")}
                  </p>
                </div>

                {wholesale && (
                  <div className="flex items-start gap-3 rounded-2xl border border-tatan-primario2 bg-tatan-primario2/35 px-4 py-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-tatan-acento-verde shadow-sm">
                      <Tag className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                    <div className="text-sm text-zinc-700">
                      <p>
                        <strong className="font-extrabold">Por mayor:</strong>{" "}
                        <strong className="text-zinc-800">
                          ${wholesale.price.toLocaleString("es-AR")} c/u
                        </strong>{" "}
                        llevando {wholesale.minQty} o más unidades
                      </p>
                      <p className="text-xs text-zinc-500">
                        {wholesaleMode === "auto"
                          ? "Se suman todos los talles y colores. El precio se aplica solo en el carrito."
                          : "Se suman todos los talles y colores. Consultanos para comprar por mayor."}
                      </p>
                    </div>
                  </div>
                )}

                <ProductBuyBox
                  productId={product.id}
                  name={product.name}
                  imageSrc={product.imageSrc}
                  unitPrice={product.price}
                  options={product.buy}
                  sku={product.sku}
                />

                {/* Por qué comprar tranquilo */}
                <ul className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { Icon: Gift, t: "Envío gratis +$25k", c: "text-tatan-acento-verde bg-tatan-acento-verde/15" },
                    { Icon: Truck, t: "Envío en 3-7 días", c: "text-[#7BA5C9] bg-tatan-acento-azul/20" },
                    { Icon: RotateCcw, t: "Cambios 30 días", c: "text-[#E58BA0] bg-tatan-acento-rosa/25" },
                    { Icon: Shield, t: "Garantía 3 meses", c: "text-[#B9A89B] bg-tatan-secundario1/40" },
                  ].map(({ Icon, t, c }) => (
                    <li
                      key={t}
                      className="flex items-center gap-2 rounded-xl bg-white/60 px-2.5 py-2"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c}`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <span className="text-xs font-bold text-zinc-700 leading-tight">
                        {t}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Info del producto (desplegable) */}
              {(showDescription || product.features.length > 0) && (
                <div className="paper-card rounded-3xl divide-y divide-tatan-secundario1/40 overflow-hidden">
                  {showDescription && (
                    <details className="product-acc group" open>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 sm:px-8 py-4 text-base font-bold text-zinc-800">
                        Descripción
                        <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <div
                        className="product-description px-5 sm:px-8 pb-5 text-sm text-zinc-600 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </details>
                  )}
                  {product.features.length > 0 && (
                    <details className="product-acc group" open={!showDescription}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 sm:px-8 py-4 text-base font-bold text-zinc-800">
                        Características
                        <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <ul className="space-y-2.5 px-5 sm:px-8 pb-5">
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
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Relacionados */}
          {related.length > 0 && (
            <section className="mt-14 sm:mt-20">
              <div className="flex items-end justify-between gap-3 mb-6 sm:mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="w-8 h-1 rounded-full bg-tatan-acento-rosa" />
                    <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                      {boughtTogether ? "Se compra junto" : "Productos relacionados"}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800">
                    {boughtTogether
                      ? "La gente también eligió combinar con"
                      : "También te puede gustar"}
                  </h2>
                </div>
                <Link
                  href={`/productos?c=${product.categoryKey}`}
                  className="shrink-0 text-sm font-bold text-zinc-600 underline decoration-tatan-primario4 underline-offset-4 hover:text-zinc-900"
                >
                  Ver más
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 justify-items-center lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard
                    key={`related-${p.id}`}
                    {...apiToCardProps(p, { quickAdd })}
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
