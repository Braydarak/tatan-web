"use client";

import Link from "next/link";
import { ProductCardProps } from "./types";
import CardQuickAdd from "@/components/cart/CardQuickAdd";
import CardGallery from "./CardGallery";
import { useStoreSettings } from "@/components/StoreSettingsContext";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function ProductCard({
  id,
  imageSrc = "/tatanLogo.png",
  title = "Producto",
  originalPrice,
  discountedPrice = 0,
  discountPercentage,
  taxFreePrice,
  showPointsBadge = false,
  colorHex = "#f5ebd9",
  productUrl = "#",
  loading = "lazy",
  priority = false,
  badge,
  colors,
  ctaLabel,
  tagline,
  buy: buyProp,
  soldOut: soldOutProp = false,
  images,
  wholesale,
}: ProductCardProps) {
  const { wholesaleMode } = useStoreSettings();
  // Foto principal + galería, sin repetidas
  const gallery = Array.from(
    new Set([imageSrc, ...(images ?? [])].filter(Boolean)),
  );
  // Sin talles cargados no se puede agregar directo: queda el link al producto
  const buy = buyProp && buyProp.sizes.length > 0 ? buyProp : undefined;
  const ws = wholesale ?? buyProp?.wholesale;
  const soldOut =
    soldOutProp || (buy ? buy.sizes.every((s) => s.stock <= 0) : false);
  const dots = colors && colors.length > 0 ? colors : [colorHex];
  const cta = soldOut ? "Ver producto" : (ctaLabel ?? "Ver producto");

  return (
    <article
      className={cx(
        "product-card group relative w-full max-w-[320px] h-full flex flex-col rounded-2xl sm:rounded-3xl bg-white/75 backdrop-blur-sm border border-tatan-secundario1/50 p-1.5 sm:p-2.5",
        "shadow-[0_1px_3px_rgba(185,168,155,0.12),0_6px_16px_rgba(185,168,155,0.08)]",
        "transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(185,168,155,0.22)]",
      )}
      data-product-id={id}
    >
      {/* Foto */}
      <div
        className="relative aspect-square rounded-xl sm:rounded-[1.25rem] overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 40%, #ffffff 0%, ${colorHex}66 70%, ${colorHex}99 100%)`,
        }}
      >
        <CardGallery
          images={gallery}
          title={title}
          href={productUrl}
          priority={priority}
          loading={loading}
          dim={soldOut}
        />

        {/* Etiquetas arriba a la izquierda */}
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
          {soldOut ? (
            <span className="rounded-full bg-zinc-700/85 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
              Sin stock
            </span>
          ) : (
            <>
              {discountPercentage ? (
                <span className="rounded-full bg-tatan-acento-rosa px-2.5 py-1 text-[11px] font-extrabold text-zinc-800 shadow-sm">
                  -{discountPercentage}%
                </span>
              ) : null}
              {badge && (
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-tatan-secundario2 shadow-sm border border-tatan-secundario1/60">
                  {badge}
                </span>
              )}
            </>
          )}
        </div>

        {showPointsBadge && (
          <div className="absolute bottom-2.5 right-2.5 bg-tatan-primario1 text-zinc-800 rounded-full w-[52px] h-[52px] flex flex-col items-center justify-center text-[10px] leading-tight z-10 shadow-sm pointer-events-none">
            <span>Sumá</span>
            <strong className="font-bold">POINTS</strong>
          </div>
        )}

      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col px-1 sm:px-1.5 pt-2 sm:pt-2.5 pb-0.5">
        <Link href={productUrl} className="focus:outline-none">
          <h3 className="font-[family-name:var(--font-fredoka)] text-sm sm:text-[15px] font-semibold leading-snug text-zinc-800 line-clamp-2 group-hover:text-zinc-950">
            {title}
          </h3>
        </Link>
        {tagline && (
          <p className="mt-0.5 text-[11px] font-semibold text-tatan-secundario2 truncate">
            {tagline}
          </p>
        )}

        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-base sm:text-lg font-extrabold text-[#4da96c] leading-none">
            $ {discountedPrice.toLocaleString("es-AR")}
          </span>
          {originalPrice && originalPrice > discountedPrice ? (
            <span className="text-[13px] text-zinc-400 line-through">
              $ {originalPrice.toLocaleString("es-AR")}
            </span>
          ) : null}
        </div>

        {taxFreePrice ? (
          <p className="mt-0.5 text-[10px] sm:text-[11px] leading-snug text-zinc-400">
            Precio sin impuestos nacionales ${" "}
            {taxFreePrice.toLocaleString("es-AR")}
          </p>
        ) : null}

        {ws && wholesaleMode !== "off" ? (
          <p className="mt-1.5 inline-flex w-fit flex-wrap items-center gap-x-1 rounded-lg bg-tatan-primario2/50 px-2 py-1 text-[11px] leading-tight text-zinc-700">
            <strong className="font-extrabold">Por mayor</strong>
            <span>
              ${ws.price.toLocaleString("es-AR")} c/u desde {ws.minQty} u.
            </span>
          </p>
        ) : null}

        {buy ? (
          <CardQuickAdd
            productId={String(id ?? "")}
            name={title}
            imageSrc={imageSrc}
            unitPrice={discountedPrice}
            options={buy}
          />
        ) : (
          <>
        <div
          className="mt-2.5 flex items-center gap-1.5"
          aria-label={`${dots.length} ${dots.length === 1 ? "color" : "colores"}`}
        >
          {dots.slice(0, 4).map((hex, i) => (
            <span
              key={`${hex}-${i}`}
              className="w-4 h-4 rounded-full border border-zinc-300/80 shadow-inner"
              style={{ backgroundColor: hex }}
            />
          ))}
          {dots.length > 4 && (
            <span className="text-[11px] font-semibold text-zinc-500">
              +{dots.length - 4}
            </span>
          )}
        </div>

        {/* En celu/tablet: botón siempre visible (pegado abajo) */}
        {ctaLabel && <span className="lg:hidden block h-3 shrink-0" />}
        {ctaLabel && (
          <Link
            href={productUrl}
            className={cx(
              "lg:hidden mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl px-2 py-2.5 text-[13px] sm:text-sm font-bold transition-all",
              soldOut
                ? "border-2 border-tatan-secundario1 text-zinc-500"
                : "btn-primary",
            )}
          >
            {cta}
            <Arrow className="w-4 h-4" />
          </Link>
        )}
          </>
        )}
      </div>
    </article>
  );
}
