import SmartImage from "@/components/ui/SmartImage";
import Link from "next/link";
import {
  buyOptionsFromApi,
  totalStock,
  type BuyOptions,
} from "@/lib/buy-options";
import ProductCard from "@/components/ui/productCard/ProductCard";
import type { Product as ApiProduct } from "@/lib/tatan-api";
import type { HomeBenefitIconKey } from "@/components/sections/HomeHeroEditor";
import { fetchHomeContentSSR, mergeHomeCategories } from "@/lib/home-content";
import { fetchCategoriesSSR } from "@/lib/categories";
import { offersInfo } from "@/lib/card-props";
import RevealOnScroll from "@/components/home/RevealOnScroll";
import HeroSlideshow from "@/components/home/HeroSlideshow";
import PromoHero, { type PromoProduct } from "@/components/home/PromoHero";
import { isPromoOpen } from "@/lib/promo";
import {
  Cloud,
  HeartDoodle,
  Sparkle,
  Squiggle,
  StarDoodle,
} from "@/components/home/Doodles";
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
  colors: string[];
  installments?: number;
  stock: number;
  buy: BuyOptions;
  images: string[];
  showPointsBadge: boolean;
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
    colors: (api.colorVariants ?? []).map((c) => c.hex).filter(Boolean),
    installments: Number(api.installments) || undefined,
    buy: buyOptionsFromApi(api),
    images: Array.isArray(api.gallery) ? api.gallery.filter(Boolean) : [],
    showPointsBadge: !!api.showPointsBadge,
    stock: Object.values(api.stockBySize ?? {}).reduce(
      (a, n) => a + (Number(n) || 0),
      0,
    ),
  };
}

/** Etiqueta que ve el cliente: solo cosas que el dato respalda. */
function cardLabel(p: HomeProductCard): string | undefined {
  if (p.stock > 0 && p.stock <= 3) return "Últimas unidades";
  if (p.badge === "Top") return "Más elegido";
  if (p.badge === "Nuevo") return "Nuevo";
  return undefined;
}

async function loadHomeProducts(): Promise<{
  products: HomeProductCard[];
  byCategory: Record<string, number>;
  apiById: Map<string, ApiProduct>;
}> {
  const fromApi = (await fetchProductsHomeSSR()).filter(
    (p) => p.active !== false,
  );
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
    // Primero lo que se puede comprar: lo agotado va al final
    const inStock = Number(b.stock > 0) - Number(a.stock > 0);
    return inStock || w(b) - w(a);
  });
  // Conteo por categoría real del producto (body, remera, pijama, accesorio)
  const byCategory: Record<string, number> = {};
  for (const p of fromApi) {
    const key = String(p.category ?? "");
    byCategory[key] = (byCategory[key] ?? 0) + 1;
  }
  const apiById = new Map(fromApi.map((p) => [p.id, p]));
  return { products: topApi, byCategory, apiById };
}

// Estilo de cada categoría (el nombre, la foto y si se muestra salen del CRM)
const CATEGORY_STYLE: Record<
  string,
  { Icon: typeof Baby; bg: string; color: string }
> = {
  body: { Icon: Baby, bg: "rgba(244, 184, 200, 0.28)", color: "#E58BA0" },
  remera: { Icon: Shirt, bg: "rgba(168, 200, 224, 0.28)", color: "#7BA5C9" },
  pijama: { Icon: Moon, bg: "rgba(247, 228, 163, 0.35)", color: "#E5CA70" },
  accesorio: { Icon: Gift, bg: "rgba(141, 191, 163, 0.25)", color: "#6FA889" },
  set: { Icon: Gift, bg: "rgba(252, 209, 177, 0.32)", color: "#E58B60" },
  pantalon: { Icon: Shirt, bg: "rgba(199, 226, 214, 0.4)", color: "#6FA889" },
  buzo: { Icon: Moon, bg: "rgba(232, 213, 196, 0.45)", color: "#B9A89B" },
};

// Grilla que centra las tarjetas aunque haya menos de 4 productos
const PRODUCT_GRID =
  "grid gap-3 sm:gap-6 justify-center justify-items-center grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(240px,300px))]";

function SectionTitle({
  eyebrow,
  title,
  barClass,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  barClass: string;
  subtitle?: string;
}) {
  return (
    <div data-reveal>
      <div className="inline-flex items-center gap-2 mb-2">
        <span className={`title-bar w-8 h-1 rounded-full ${barClass}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
          {eyebrow}
        </span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800">{title}</h2>
      {subtitle && <p className="text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function productCardProps(p: HomeProductCard) {
  return {
    id: p.id,
    title: p.name,
    imageSrc: p.imageSrc,
    originalPrice: p.originalPrice,
    discountedPrice: p.price,
    discountPercentage: p.originalPrice
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : undefined,
    installments: p.installments,
    installmentPrice: p.installments
      ? Math.round(p.price / p.installments)
      : undefined,
    taxFreePrice: Math.round(p.price * 0.79),
    colorHex: p.colorHex,
    colors: p.colors,
    soldOut: p.stock <= 0,
    badge: cardLabel(p),
    ctaLabel: "Ver producto",
    buy: p.buy,
    images: p.images,
    productUrl: `/product/${p.id}`,
  };
}

const AGE_SHORTCUTS = [
  {
    label: "Para bebés",
    hint: "Talles 0 a 4 (hasta 12 meses)",
    href: "/productos?t=bebe",
    Icon: Baby,
    color: "#E58BA0",
  },
  {
    label: "Para niños",
    hint: "Talles 2 a 10 años",
    href: "/productos?t=ninios",
    Icon: Shirt,
    color: "#7BA5C9",
  },
];

function SeeAll({ href, label = "Ver todo" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="group shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-bold border-2 border-tatan-primario4/70 text-zinc-700 hover:bg-tatan-primario4 transition-all"
    >
      {label}
      <ArrowRight
        className="w-4 h-4 transition-transform group-hover:translate-x-1"
        strokeWidth={2.2}
      />
    </Link>
  );
}

const delay = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;

export default async function Home() {
  const reviewIcons = [Heart, Star, Flower2, Plane];
  const reviewColors = ["#F4B8C8", "#F7E4A3", "#8DBFA3", "#A8C8E0"];
  const { products, byCategory, apiById } = await loadHomeProducts();
  const [hero, dbCategories] = await Promise.all([
    fetchHomeContentSSR(),
    fetchCategoriesSSR(),
  ]);
  const sec = hero.sections!;
  const quickAdd = hero.store?.quickAdd !== false;
  // Tarjetas prendidas en el CRM, de categorías que existen y no están ocultas
  const visibleCategories = mergeHomeCategories(
    sec.categories.items,
    dbCategories,
  ).filter((c) => c.show && !c.hidden);

  // Promoción elegida en el CRM: solo si el producto existe, tiene stock y
  // la fecha de fin (si hay) no pasó. Si no, se ve la portada normal.
  const promo = hero.promo!;
  const promoApi = promo.enabled ? apiById.get(promo.productId) : undefined;
  const promoProduct: PromoProduct | null =
    promoApi &&
    totalStock(buyOptionsFromApi(promoApi)) > 0 &&
    isPromoOpen(promo.endsAt)
      ? {
          id: promoApi.id,
          name: promoApi.name,
          imageSrc: promoApi.imageSrc || "/tatanLogo.png",
          price: Number(promoApi.price) || 0,
          originalPrice:
            promoApi.originalPrice != null
              ? Number(promoApi.originalPrice) || undefined
              : undefined,
          installments: Number(promoApi.installments) || undefined,
          colorHex: promoApi.colorHex || "#F5E6D3",
        }
      : null;

  const benefits = hero.benefits.filter((b) => b.show);
  // El 2º botón de la portada no se muestra si lleva a /ofertas y no hay ofertas
  const hasOffers = offersInfo([...apiById.values()]).count > 0;
  const cta2IsOffers =
    (hero.cta2Href || "/ofertas").replace(/\/$/, "") === "/ofertas";
  const showCta2 = !!hero.cta2Text?.trim() && (!cta2IsOffers || hasOffers);

  // Frases de la cinta: las del CRM, o si no hay, se arman solas con las
  // etiquetas y beneficios de la portada
  const customMarquee = sec.marquee.items
    .map((t) => t.trim())
    .filter(Boolean);
  const marqueeItems = customMarquee.length > 0 ? customMarquee : [
    hero.cottonBadge.title,
    hero.cottonBadge.subtitle,
    hero.shippingBadge.title &&
      `${hero.shippingBadge.title} ${hero.shippingBadge.subtitle}`.trim(),
    ...benefits.map((b) => b.title),
  ].filter((t): t is string => !!t && t.trim().length > 0);
  const marqueeIcons = [HeartDoodle, StarDoodle, Sparkle];
  const marqueeColors = ["#f4b8c8", "#f7e4a3", "#8dbfa3", "#a8c8e0"];

  return (
    <div
      className={`min-h-dvh flex flex-col relative z-10${sec.decorations ? "" : " no-decor"}`}
    >
      <RevealOnScroll />
      <main className="flex-1 w-full">
        {/* ───────── Hero (con promo o normal) ───────── */}
        {promoProduct ? (
          <PromoHero hero={hero} promo={promo} product={promoProduct} />
        ) : (
          <section className="relative overflow-hidden">
            {/* Dibujitos de fondo */}
            <div className="doodle-cloud top-6 left-[4%]">
              <Cloud className="w-24 sm:w-32 opacity-90" />
            </div>
            <div
              className="doodle-cloud bottom-10 left-[38%] hidden lg:block"
              style={{ "--t": "16s", "--d": "-8s" } as React.CSSProperties}
            >
              <Cloud className="w-16 opacity-70" />
            </div>
            <div
              className="doodle-twinkle top-14 left-[46%] hidden sm:block"
              style={delay(0.4)}
            >
              <StarDoodle className="w-6" />
            </div>
            <div
              className="doodle-twinkle top-[60%] left-[3%]"
              style={{ "--t": "3.4s", "--d": "1s" } as React.CSSProperties}
            >
              <Sparkle className="w-5" />
            </div>
            <div
              className="doodle bottom-16 right-[3%] hidden md:block"
              style={{ "--t": "5s", "--r": "-10deg" } as React.CSSProperties}
            >
              <HeartDoodle className="w-7" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pt-12 sm:pb-20">
              <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
                <div className="order-2 md:order-1">
                  <div
                    className="anim-rise inline-flex items-center gap-2 rounded-full bg-tatan-primario2/60 px-3.5 sm:px-4 py-1.5 mb-4 sm:mb-5"
                    style={delay(0.05)}
                  >
                    <Sparkles className="w-5 h-5 text-zinc-700" strokeWidth={2} />
                    <span className="text-sm font-semibold text-zinc-700">
                      {hero.eyebrow}
                    </span>
                  </div>
                  <h1 className="text-[2.1rem] sm:text-5xl lg:text-6xl font-bold text-zinc-800 leading-[1.1] mb-4 sm:mb-5">
                    <span className="anim-rise block" style={delay(0.15)}>
                      {hero.titleLine1}
                    </span>
                    <span
                      className="anim-rise relative inline-block text-tatan-primario4 drop-shadow-sm"
                      style={delay(0.28)}
                    >
                      {hero.titleLine2}
                      <Squiggle className="absolute left-0 -bottom-2 sm:-bottom-3 w-full h-3 sm:h-4" />
                    </span>
                  </h1>
                  <p
                    className="anim-rise text-base sm:text-lg text-zinc-600 mb-6 sm:mb-8 max-w-md leading-relaxed"
                    style={delay(0.4)}
                  >
                    {hero.description}
                  </p>
                  <div
                    className="anim-rise flex gap-3 sm:gap-4"
                    style={delay(0.5)}
                  >
                    <Link
                      href={hero.cta1Href || "/productos"}
                      className="btn-primary group flex-[1.4] sm:flex-none justify-center font-bold px-5 sm:px-8 py-3.5 rounded-2xl text-base inline-flex items-center gap-2"
                    >
                      {hero.cta1Text}
                      <ArrowRight
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        strokeWidth={2.2}
                      />
                    </Link>
                    {showCta2 && (
                    <Link
                      href={hero.cta2Href || "/ofertas"}
                      className="group flex-1 sm:flex-none justify-center px-5 sm:px-8 py-3.5 rounded-2xl text-base font-semibold border-2 border-tatan-secundario2/30 text-zinc-700 hover:bg-white/70 hover:-translate-y-px transition-all paper-card inline-flex items-center gap-2"
                    >
                      {hero.cta2Text}
                      <Flower2
                        className="w-5 h-5 text-pink-400 transition-transform duration-500 group-hover:rotate-90"
                        strokeWidth={2}
                      />
                    </Link>
                    )}
                  </div>

                  {sec.socialProof.show && (
                  <div
                    className="anim-rise flex items-center gap-6 mt-10"
                    style={delay(0.62)}
                  >
                    <div className="flex -space-x-3">
                      {reviewIcons.map((Icon, i) => (
                        <div
                          key={i}
                          className="anim-pop w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center hover:-translate-y-1 transition-transform"
                          style={{
                            backgroundColor: reviewColors[i],
                            ...delay(0.7 + i * 0.08),
                          }}
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
                            className="anim-pop w-4 h-4 fill-current"
                            strokeWidth={0}
                            style={delay(0.9 + i * 0.07)}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">
                        {sec.socialProof.text}
                      </p>
                    </div>
                  </div>
                  )}
                </div>

                <div
                  className="anim-pop order-1 md:order-2 relative w-full max-w-[min(300px,72vw)] mx-auto md:max-w-none"
                  style={delay(0.1)}
                >
                  <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-tatan-acento-amarillo/30 blur-2xl" />
                  <div className="absolute -bottom-8 -right-6 w-32 h-32 rounded-full bg-tatan-acento-rosa/30 blur-2xl" />
                  {/* Anillo de costura */}
                  <svg
                    viewBox="0 0 100 100"
                    className="stitch-ring absolute -inset-[6%] w-[112%] h-[112%] pointer-events-none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke="#e8d5c4"
                      strokeWidth="0.5"
                      strokeDasharray="2 2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="hero-cradle relative">
                    <div className="relative paper-card rounded-3xl p-4 sm:p-6">
                      <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-tatan-primario1/40 to-tatan-primario2/40 relative">
                        <HeroSlideshow images={hero.images ?? [hero.imageSrc]} />
                      </div>
                    </div>
                  </div>
                  {hero.cottonBadge.show && (
                    <div
                      className="anim-pop absolute -top-4 -right-2 z-10"
                      style={delay(0.8)}
                    >
                      <div className="bg-white rounded-2xl shadow-lg px-4 py-2 flex items-center gap-2 border border-tatan-secundario1/50 badge-float-1 origin-bottom-left">
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
                    </div>
                  )}
                  {hero.shippingBadge.show && (
                    <div
                      className="anim-pop absolute -bottom-3 -left-3 z-10"
                      style={delay(1)}
                    >
                      <div className="bg-white rounded-2xl shadow-lg px-4 py-2 border border-tatan-secundario1/50 badge-float-2 origin-top-right">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ───────── Cinta ───────── */}
        {sec.marquee.show && marqueeItems.length > 0 && (
          <div
            className="marquee relative overflow-hidden border-y border-tatan-secundario1/60 bg-white/50 py-3 -rotate-1 scale-[1.02]"
            aria-label={marqueeItems.join(" · ")}
          >
            <div className="marquee-track flex w-max" aria-hidden="true">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0">
                  {[...marqueeItems, ...marqueeItems].map((text, i) => {
                    const Icon = marqueeIcons[i % marqueeIcons.length];
                    return (
                      <span
                        key={`${copy}-${i}`}
                        className="flex items-center gap-4 px-4 text-sm sm:text-base font-semibold text-zinc-600 whitespace-nowrap"
                        style={{ fontFamily: "var(--font-fredoka)" }}
                      >
                        <Icon
                          className="w-4 h-4"
                          color={marqueeColors[i % marqueeColors.length]}
                        />
                        {text}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────── Categorías ───────── */}
        {sec.categories.show &&
          (visibleCategories.length > 0 || sec.categories.ageShortcuts) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="mb-8">
            <SectionTitle
              eyebrow="Categorías"
              title={sec.categories.title}
              subtitle={sec.categories.subtitle || undefined}
              barClass="bg-tatan-acento-rosa"
            />
          </div>
          {visibleCategories.length > 0 && (
          <div
            className={`grid grid-cols-2 gap-4 sm:gap-6 ${
              visibleCategories.length >= 4
                ? "sm:grid-cols-4"
                : visibleCategories.length === 3
                  ? "sm:grid-cols-3"
                  : "sm:grid-cols-2"
            }`}
          >
            {visibleCategories.map(({ name, key, imageSrc }, i) => {
              const { Icon, bg, color } =
                CATEGORY_STYLE[key] ??
                Object.values(CATEGORY_STYLE)[i % Object.keys(CATEGORY_STYLE).length];
              const count = byCategory[key] ?? 0;
              return (
                <Link
                  key={name}
                  href={`/productos?c=${key}`}
                  data-reveal="pop"
                  style={{ ...delay(i * 0.08) }}
                  className="category-card group relative overflow-hidden rounded-3xl p-5 sm:p-6 border border-tatan-secundario1/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-[box-shadow,translate] duration-300 block"
                >
                  <span
                    className="absolute inset-0"
                    style={{ backgroundColor: bg }}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/40 transition-transform duration-500 group-hover:scale-150"
                    aria-hidden="true"
                  />
                  <span className="relative block">
                    {imageSrc ? (
                      <span className="category-icon relative mb-3 block w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-2xl bg-white/80 shadow-sm">
                        <SmartImage
                          src={imageSrc}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span
                        className="category-icon mb-3 w-14 h-14 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center"
                        style={{ color }}
                      >
                        <Icon className="w-8 h-8" strokeWidth={1.8} />
                      </span>
                    )}
                    <span className="block font-bold text-zinc-800 text-lg font-[family-name:var(--font-fredoka)]">
                      {name}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-zinc-600">
                      {count > 0
                        ? `${count} ${count === 1 ? "producto" : "productos"}`
                        : "Ver categoría"}
                      <ArrowRight
                        className="category-arrow w-3.5 h-3.5"
                        strokeWidth={2.2}
                      />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
          )}

          {/* Atajos por edad: lo primero que piensa quien compra para un bebé */}
          {sec.categories.ageShortcuts && (
          <div className="mt-4 sm:mt-6 grid sm:grid-cols-2 gap-3 sm:gap-4">
            {AGE_SHORTCUTS.map(({ label, hint, href, Icon, color }, i) => (
              <Link
                key={href}
                href={href}
                data-reveal
                style={delay(0.2 + i * 0.08)}
                className="group paper-card flex items-center gap-4 rounded-2xl px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,translate] duration-300"
              >
                <span
                  className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}55`, color }}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.9} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-zinc-800 font-[family-name:var(--font-fredoka)]">
                    {label}
                  </span>
                  <span className="block text-sm text-zinc-500">{hint}</span>
                </span>
                <ArrowRight
                  className="w-5 h-5 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-zinc-600"
                  strokeWidth={2}
                />
              </Link>
            ))}
          </div>
          )}
        </section>
        )}

        {/* ───────── Todos los productos ───────── */}
        {sec.products.show && products.length > 0 && (
          <section
            id="productos"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-28"
          >
            <div className="flex items-end justify-between gap-3 mb-8">
              <SectionTitle
                eyebrow="Tienda"
                title={sec.products.title}
                subtitle={sec.products.subtitle || undefined}
                barClass="bg-tatan-primario4"
              />
              <SeeAll href="/productos" label="Filtrar" />
            </div>

            <div className={PRODUCT_GRID}>
              {products.map((p, idx) => (
                <div
                  key={`product-card-${p.id}`}
                  data-reveal
                  style={delay((idx % 4) * 0.08)}
                  className="w-full flex justify-center"
                >
                  <ProductCard
                    {...productCardProps(p)}
                    buy={quickAdd ? p.buy : undefined}
                    wholesale={p.buy.wholesale}
                    showPointsBadge={p.showPointsBadge}
                    loading={idx < 2 ? "eager" : "lazy"}
                    priority={idx === 0 && !promoProduct}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───────── Beneficios ───────── */}
        {benefits.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div
              data-reveal
              className="relative overflow-hidden paper-card rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-tatan-primario1/30 via-tatan-acento-amarillo/20 to-tatan-primario2/30"
            >
              <div
                className="doodle-twinkle top-5 right-6"
                style={delay(0.3)}
              >
                <StarDoodle className="w-5" />
              </div>
              <div
                className="doodle bottom-4 left-6"
                style={{ "--t": "5.5s" } as React.CSSProperties}
              >
                <HeartDoodle className="w-5" />
              </div>
              <div className="relative grid md:grid-cols-3 gap-8 text-center">
                {benefits.map((b, i) => {
                  const Icon = BENEFIT_ICONS[b.iconKey];
                  return (
                    <div
                      key={i}
                      data-reveal="pop"
                      style={delay(0.15 + i * 0.12)}
                      className="benefit flex flex-col items-center gap-2"
                    >
                      <div
                        className="benefit-icon w-16 h-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center mb-1"
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
        )}

        {/* ───────── Newsletter ───────── */}
        {sec.newsletter.show && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            data-reveal
            className="paper-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-tatan-acento-rosa/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-tatan-acento-verde/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div
              className="doodle top-8 left-[12%]"
              style={{ "--t": "6s" } as React.CSSProperties}
            >
              <HeartDoodle className="w-6" />
            </div>
            <div
              className="doodle-twinkle top-12 right-[14%]"
              style={delay(0.8)}
            >
              <StarDoodle className="w-6" />
            </div>
            <div
              className="doodle-twinkle bottom-10 right-[10%] hidden sm:block"
              style={{ "--t": "3.6s" } as React.CSSProperties}
            >
              <Sparkle className="w-5" color="#a8c8e0" />
            </div>
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-tatan-primario1/60 to-tatan-acento-rosa/40 flex items-center justify-center">
                  <Mail
                    className="envelope-wiggle w-10 h-10 text-tatan-secundario2"
                    strokeWidth={1.8}
                  />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 mb-3">
                {sec.newsletter.title}
              </h2>
              <p className="text-zinc-600 mb-6 max-w-md mx-auto">
                {sec.newsletter.text}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 px-5 py-3.5 rounded-2xl border-2 border-tatan-secundario1/50 bg-white/80 focus:outline-none focus:border-tatan-primario4 transition-colors text-zinc-700 placeholder-zinc-400"
                />
                <button className="btn-primary group font-bold px-8 py-3.5 rounded-2xl whitespace-nowrap inline-flex items-center justify-center gap-2">
                  {sec.newsletter.buttonText}
                  <Send
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={2.2}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>
        )}
      </main>
    </div>
  );
}
