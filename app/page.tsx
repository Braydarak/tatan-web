import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ui/productCard/ProductCard";
import type { Product as ApiProduct } from "@/lib/tatan-api";
import type {
  HomeHeroData,
  HomeBenefitIconKey,
} from "@/components/sections/HomeHeroEditor";
import { HOME_HERO_DEFAULT } from "@/lib/site-content-defaults";
import {
  Sparkles,
  Flower2,
  Heart,
  Star,
  Plane,
  Leaf,
  Baby,
  Shirt,
  Moon,
  Gift,
  Truck,
  CreditCard,
  Mail,
  Send,
  Check,
  ArrowRight,
} from "lucide-react";

const PHP_API_BASE = "https://tatankids.com.ar/api";

async function fetchProductsHomeSSR(): Promise<ApiProduct[]> {
  try {
    const res = await fetch(`${PHP_API_BASE}/products.php`, {
      next: { revalidate: 60, tags: ["tatan-home-products"] },
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { ok?: boolean; data?: ApiProduct[] };
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

async function fetchHomeHeroSSR(): Promise<HomeHeroData | null> {
  try {
    const res = await fetch(`${PHP_API_BASE}/site-content.php?key=home_hero`, {
      next: { revalidate: 60, tags: ["tatan-site-content"] },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; data?: HomeHeroData };
    return json?.ok && json.data ? json.data : null;
  } catch {
    return null;
  }
}

const BENEFIT_ICONS: Record<HomeBenefitIconKey, typeof Truck> = {
  Truck,
  CreditCard,
  Heart,
};

type HomeProductCard = {
  id: string;
  name: string;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  badge?: "Nuevo" | "Top" | "Último";
  colorHex: string;
};

function badgeFromApi(
  api: Pick<ApiProduct, "id" | "soldTotal" | "rating" | "reviews">,
): HomeProductCard["badge"] | undefined {
  const idNum = Number(api.id.match(/^[a-z]+-(\d+)$/)?.[1] ?? 0);
  if (api.soldTotal >= 50 || (api.rating >= 4.8 && api.reviews >= 40))
    return "Top";
  if (!idNum || idNum <= 2) return "Nuevo";
  if (api.reviews > 0 && api.reviews <= 20 && api.rating >= 4.7)
    return "Último";
  return undefined;
}

function mapApiToHomeCard(api: ApiProduct): HomeProductCard {
  return {
    id: api.id,
    name: api.name,
    imageSrc:
      api.imageSrc ||
      `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20${encodeURIComponent(api.category)}%20kids%20clothing%20pastel%20flat%20lay&image_size=square_hd`,
    price: Number(api.price) || 9990,
    originalPrice:
      api.originalPrice != null
        ? Number(api.originalPrice) || undefined
        : undefined,
    badge: badgeFromApi(api),
    colorHex: api.colorHex || "#F5E6D3",
  };
}

async function loadHomeProducts(): Promise<{
  featured: HomeProductCard[];
  all: HomeProductCard[];
  byCategory: Record<string, number>;
}> {
  const fromApi = await fetchProductsHomeSSR();
  const apiCards = fromApi.map(mapApiToHomeCard);

  const topApi = [...apiCards].sort((a, b) => {
    const w = (x: HomeProductCard) =>
      (x.badge === "Top"
        ? 3
        : x.badge === "Nuevo"
          ? 2
          : x.badge === "Último"
            ? 1
            : 0) + (x.originalPrice ? 0.5 : 0);
    return w(b) - w(a);
  });

  const featured = topApi.slice(0, 4);
  const all = topApi.slice(4, 12);

  const byCategory: Record<string, number> = {};
  for (const p of apiCards) {
    // inferimos la categoría por prefijo de ID ya que la home no necesita el campo category
    const prefix = p.id.split("-")[0] ?? "x";
    const map: Record<string, string> = {
      b: "Bodys",
      r: "Remeras",
      p: "Pijamas",
      ac: "Accesorios",
      s: "Sets",
      pn: "Pantalones",
      bz: "Buzos",
    };
    const label = map[prefix];
    if (label) byCategory[label] = (byCategory[label] ?? 0) + 1;
  }
  return { featured, all, byCategory };
}

const categories = [
  {
    name: "Bodys",
    Icon: Baby,
    bg: "bg-tatan-acento-rosa/40",
    color: "#E58BA0",
  },
  {
    name: "Remeras",
    Icon: Shirt,
    bg: "bg-tatan-acento-azul/40",
    color: "#7BA5C9",
  },
  {
    name: "Pijamas",
    Icon: Moon,
    bg: "bg-tatan-acento-amarillo/40",
    color: "#E5CA70",
  },
  {
    name: "Accesorios",
    Icon: Gift,
    bg: "bg-tatan-acento-verde/40",
    color: "#6FA889",
  },
];

export default async function Home() {
  const reviewIcons = [Heart, Star, Flower2, Plane];
  const reviewColors = ["#F4B8C8", "#F7E4A3", "#8DBFA3", "#A8C8E0"];
  const { featured, all, byCategory } = await loadHomeProducts();
  const hero = (await fetchHomeHeroSSR()) ?? HOME_HERO_DEFAULT;

  const benefits = hero.benefits.filter((b) => b.show);

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-12 sm:pb-20">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="order-2 md:order-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-tatan-primario2/60 px-4 py-1.5 mb-5">
                  <Sparkles className="w-5 h-5 text-zinc-700" strokeWidth={2} />
                  <span className="text-sm font-semibold text-zinc-700">
                    {hero.eyebrow}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-800 leading-[1.1] mb-5">
                  {hero.titleLine1}
                  <span className="block text-tatan-primario4 drop-shadow-sm">
                    {hero.titleLine2}
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-zinc-600 mb-8 max-w-md leading-relaxed">
                  {hero.description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={hero.cta1Href || "/productos"}
                    className="btn-primary font-semibold px-8 py-3.5 rounded-2xl text-base"
                  >
                    {hero.cta1Text}
                  </Link>
                  <Link
                    href={hero.cta2Href || "/ofertas"}
                    className="px-8 py-3.5 rounded-2xl text-base font-semibold border-2 border-tatan-secundario2/30 text-zinc-700 hover:bg-white/50 transition-colors paper-card inline-flex items-center gap-2"
                  >
                    {hero.cta2Text}
                    <Flower2
                      className="w-5 h-5 text-pink-400"
                      strokeWidth={2}
                    />
                  </Link>
                </div>

                <div className="flex items-center gap-6 mt-10">
                  <div className="flex -space-x-3">
                    {reviewIcons.map((Icon, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: reviewColors[i] }}
                      >
                        <Icon
                          className="w-4 h-4 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-current"
                          strokeWidth={0}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                      +2.000 mamás felices
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-1 md:order-2 relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-tatan-acento-amarillo/30 blur-2xl" />
                <div className="absolute -bottom-8 -right-6 w-32 h-32 rounded-full bg-tatan-acento-rosa/30 blur-2xl" />
                <div className="relative paper-card rounded-3xl p-4 sm:p-6">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-tatan-primario1/40 to-tatan-primario2/40 p-6 flex items-center justify-center relative">
                    <Image
                      src={hero.imageSrc}
                      alt="Producto destacado"
                      fill
                      priority
                      loading="eager"
                      sizes="(max-width: 768px) 80vw, 500px"
                      className="object-cover rounded-2xl drop-shadow-lg p-6"
                    />
                  </div>
                  {hero.cottonBadge.show && (
                    <div className="absolute -top-4 -right-2 bg-white rounded-2xl shadow-lg px-4 py-2 flex items-center gap-2 border border-tatan-secundario1/50 badge-float-1 origin-bottom-left">
                      {hero.cottonBadge.showIcon && (
                        <Leaf
                          className="w-7 h-7 text-green-600"
                          strokeWidth={2}
                        />
                      )}
                      <div>
                        <p className="text-xs font-bold text-zinc-700">
                          {hero.cottonBadge.title}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {hero.cottonBadge.subtitle}
                        </p>
                      </div>
                    </div>
                  )}
                  {hero.shippingBadge.show && (
                    <div className="absolute -bottom-3 -left-3 bg-white rounded-2xl shadow-lg px-4 py-2 border border-tatan-secundario1/50 badge-float-2 origin-top-right">
                      <p className="text-xs font-bold text-tatan-acento-verde inline-flex items-center gap-1">
                        {hero.shippingBadge.showIcon && (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        )}
                        {hero.shippingBadge.title}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {hero.shippingBadge.subtitle}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-8 h-1 rounded-full bg-tatan-primario4" />
                <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                  Destacados
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800">
                Los favoritos de la semana
              </h2>
            </div>
          </div>

          <div className="grid gap-6 justify-items-center sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, idx) => (
              <ProductCard
                key={`product-card-${p.id}`}
                id={p.id}
                title={p.name}
                imageSrc={p.imageSrc}
                originalPrice={p.originalPrice}
                discountedPrice={p.price}
                discountPercentage={
                  p.originalPrice
                    ? Math.round(
                        ((p.originalPrice - p.price) / p.originalPrice) * 100,
                      )
                    : undefined
                }
                installments={6}
                installmentPrice={Math.round(p.price / 6)}
                taxFreePrice={Math.round(p.price * 0.79)}
                showPointsBadge={p.id === "b-001"}
                colorHex={p.colorHex}
                productUrl={`/product/${p.id}`}
                loading={idx === 0 ? "eager" : "lazy"}
                priority={idx === 0}
              />
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 mb-2">
            Comprar por categoría
          </h2>
          <p className="text-zinc-500 mb-8">Encontrá lo que buscás rápido</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {categories.map(({ name, Icon, bg, color }) => (
              <Link
                key={name}
                href={`/productos?c=${
                  name === "Bodys"
                    ? "body"
                    : name === "Remeras"
                      ? "remera"
                      : name === "Pijamas"
                        ? "pijama"
                        : name === "Accesorios"
                          ? "accesorio"
                          : "todos"
                }`}
                className={`category-bubble paper-card ${bg} rounded-3xl p-6 cursor-pointer hover:shadow-md block`}
              >
                <div className="mb-3" style={{ color }}>
                  <Icon className="w-12 h-12" strokeWidth={1.8} />
                </div>
                <h3 className="font-bold text-zinc-800 text-lg">{name}</h3>
                <p className="text-sm text-zinc-500">
                  {byCategory[name] ?? 0} productos
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="paper-card rounded-3xl p-6 sm:p-10 mb-12 bg-gradient-to-r from-tatan-primario1/30 via-tatan-acento-amarillo/20 to-tatan-primario2/30">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {benefits.map((b, i) => {
                const Icon = BENEFIT_ICONS[b.iconKey];
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 h-16 rounded-2xl bg-white/70 shadow-sm flex items-center justify-center mb-1"
                      style={{ color: b.color }}
                    >
                      {b.showIcon && (
                        <Icon className="w-8 h-8" strokeWidth={1.8} />
                      )}
                    </div>
                    <h3 className="font-bold text-zinc-800 text-lg">
                      {b.title}
                    </h3>
                    <p className="text-sm text-zinc-600 max-w-xs">
                      {b.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {all.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="w-8 h-1 rounded-full bg-tatan-acento-verde" />
                  <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                    Todo Tatan
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800">
                  Nuestra colección completa
                </h2>
              </div>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold border-2 border-tatan-primario4/70 text-tatan-primario4 hover:bg-tatan-primario4 hover:text-white transition-all shadow-sm"
              >
                Ver todos los productos
                <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
              </Link>
            </div>

            <div className="grid gap-6 justify-items-center sm:grid-cols-2 lg:grid-cols-4">
              {all.map((p) => (
                <ProductCard
                  key={`product-card-${p.id}`}
                  id={p.id}
                  title={p.name}
                  imageSrc={p.imageSrc}
                  originalPrice={p.originalPrice}
                  discountedPrice={p.price}
                  discountPercentage={
                    p.originalPrice
                      ? Math.round(
                          ((p.originalPrice - p.price) / p.originalPrice) * 100,
                        )
                      : undefined
                  }
                  installments={6}
                  installmentPrice={Math.round(p.price / 6)}
                  taxFreePrice={Math.round(p.price * 0.79)}
                  colorHex={p.colorHex}
                  productUrl={`/product/${p.id}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="paper-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-tatan-acento-rosa/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-tatan-acento-verde/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-tatan-primario1/60 to-tatan-acento-rosa/40 flex items-center justify-center">
                  <Mail
                    className="w-10 h-10 text-tatan-secundario2"
                    strokeWidth={1.8}
                  />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 mb-3">
                Sumate al club Tatan
              </h2>
              <p className="text-zinc-600 mb-6 max-w-md mx-auto">
                Recibí 15% OFF en tu primera compra y enterate antes que nadie
                de las novedades y promociones.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 px-5 py-3.5 rounded-2xl border-2 border-tatan-secundario1/50 bg-white/80 focus:outline-none focus:border-tatan-primario4 transition-colors text-zinc-700 placeholder-zinc-400"
                />
                <button className="btn-primary font-bold px-8 py-3.5 rounded-2xl whitespace-nowrap inline-flex items-center justify-center gap-2">
                  Suscribirme
                  <Send className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
