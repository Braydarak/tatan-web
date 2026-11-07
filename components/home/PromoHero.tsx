import SmartImage from "@/components/ui/SmartImage";
import Link from "next/link";
import { isPlaceholderImage } from "@/lib/is-placeholder";
import { ArrowRight, Check, Tag } from "lucide-react";
import type {
  HomeHeroData,
  HomePromo,
} from "@/components/sections/HomeHeroEditor";
import PromoCountdown from "./PromoCountdown";
import { Cloud, HeartDoodle, Sparkle, Squiggle, StarDoodle } from "./Doodles";

export type PromoProduct = {
  id: string;
  name: string;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  installments?: number;
  colorHex: string;
};

const delay = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;
const ars = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/**
 * Portada en modo promoción: el producto elegido en el CRM ocupa el hero con
 * su precio, el descuento, la cuenta regresiva y un botón directo a comprarlo.
 */
export default function PromoHero({
  hero,
  promo,
  product,
}: {
  hero: HomeHeroData;
  promo: HomePromo;
  product: PromoProduct;
}) {
  const off =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;
  const href = `/product/${product.id}`;
  const title = promo.title.trim() || product.name;
  // Solo el texto propio de la promo (corto, así el botón queda a la vista)
  const text = promo.text.trim();

  return (
    <section className="relative overflow-hidden">
      <div className="doodle-cloud top-6 left-[4%]">
        <Cloud className="w-24 sm:w-32 opacity-90" />
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
              className="anim-rise inline-flex items-center gap-2 rounded-full bg-tatan-acento-rosa/45 px-3.5 sm:px-4 py-1.5 mb-4 sm:mb-5"
              style={delay(0.05)}
            >
              <Tag className="w-4 h-4 text-zinc-700" strokeWidth={2.2} />
              <span className="text-sm font-bold text-zinc-700">
                {promo.label || "Promoción"}
              </span>
            </div>

            <h1 className="text-[2.1rem] sm:text-5xl lg:text-6xl font-bold text-zinc-800 leading-[1.1] mb-4 sm:mb-5">
              <span className="anim-rise block" style={delay(0.15)}>
                {title}
              </span>
              {off > 0 && (
                <span
                  className="anim-rise relative inline-block text-tatan-primario4 drop-shadow-sm"
                  style={delay(0.28)}
                >
                  {off}% OFF
                  <Squiggle className="absolute left-0 -bottom-2 sm:-bottom-3 w-full h-3 sm:h-4" />
                </span>
              )}
            </h1>

            {text && (
              <p
                className="anim-rise text-base sm:text-lg text-zinc-600 mb-5 max-w-md leading-relaxed"
                style={delay(0.4)}
              >
                {text}
              </p>
            )}

            <div
              className="anim-rise mb-6 flex flex-wrap items-end gap-x-3 gap-y-1"
              style={delay(0.46)}
            >
              <span className="text-3xl sm:text-4xl font-extrabold text-[#4da96c] leading-none">
                {ars(product.price)}
              </span>
              {off > 0 && product.originalPrice && (
                <span className="text-lg text-zinc-400 line-through leading-tight">
                  {ars(product.originalPrice)}
                </span>
              )}
            </div>

            <div
              className="anim-rise flex gap-3 sm:gap-4"
              style={delay(0.52)}
            >
              <Link
                href={href}
                className="btn-primary group flex-[1.4] sm:flex-none justify-center font-bold px-5 sm:px-8 py-3.5 rounded-2xl text-base inline-flex items-center gap-2"
              >
                {promo.ctaText || "Comprar ahora"}
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.2}
                />
              </Link>
              <Link
                href={hero.cta1Href || "/productos"}
                className="group flex-1 sm:flex-none justify-center px-5 sm:px-8 py-3.5 rounded-2xl text-base font-semibold border-2 border-tatan-secundario2/30 text-zinc-700 hover:bg-white/70 hover:-translate-y-px transition-all paper-card inline-flex items-center gap-2"
              >
                {hero.cta1Text || "Ver colección"}
              </Link>
            </div>

            {promo.endsAt && (
              <div className="anim-rise mt-5" style={delay(0.62)}>
                <PromoCountdown endsAt={promo.endsAt} />
              </div>
            )}
          </div>

          <div
            className="anim-pop order-1 md:order-2 relative w-full max-w-[min(300px,72vw)] mx-auto md:max-w-none"
            style={delay(0.1)}
          >
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-tatan-acento-amarillo/30 blur-2xl" />
            <div className="absolute -bottom-8 -right-6 w-32 h-32 rounded-full bg-tatan-acento-rosa/40 blur-2xl" />
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
              <Link
                href={href}
                className="relative block paper-card rounded-3xl p-4 sm:p-6"
                aria-label={`Ver ${product.name}`}
              >
                <div
                  className="aspect-square rounded-2xl overflow-hidden relative"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, #ffffff 0%, ${product.colorHex}66 70%, ${product.colorHex}aa 100%)`,
                  }}
                >
                  <SmartImage
                    src={product.imageSrc}
                    alt={product.name}
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 768px) 80vw, 500px"
                    className={
                      isPlaceholderImage(product.imageSrc)
                        ? "object-contain p-6 mix-blend-multiply drop-shadow-lg"
                        : "object-cover"
                    }
                  />
                </div>
              </Link>
            </div>

            {off > 0 && (
              <div
                className="anim-pop absolute -top-4 -right-3 sm:-top-6 sm:-right-5 z-10"
                style={delay(0.8)}
              >
                <div className="promo-sticker flex h-20 w-20 sm:h-24 sm:w-24 flex-col items-center justify-center rounded-full bg-tatan-acento-rosa text-zinc-800 shadow-lg ring-4 ring-white">
                  <span className="text-2xl sm:text-3xl font-black leading-none font-[family-name:var(--font-fredoka)]">
                    -{off}%
                  </span>
                  <span className="text-[10px] sm:text-xs font-extrabold tracking-wider">
                    OFF
                  </span>
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
  );
}
