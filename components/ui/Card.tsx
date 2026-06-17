"use client";

import CustomButton from "@/components/ui/CustomButton";
import Image from "next/image";
import Link from "next/link";
import { Share2 } from "lucide-react";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export type ProductCardProps = {
  name: string;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  href?: string;
  onAddToCart?: () => void;
  onShare?: () => void;
  className?: string;
};

function formatMoneyArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Card({
  name,
  imageSrc,
  price,
  originalPrice,
  badge,
  href,
  onAddToCart,
  onShare,
  className,
}: ProductCardProps) {
  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  const content = (
    <>
      <div className="relative bg-white">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative h-44 w-full">
          <Image
            src={imageSrc}
            alt={name}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        {badge ? (
          <span className="absolute left-2 top-2 inline-flex items-center rounded-full border border-[#FCD1B1] bg-[#FCD1B1] px-2 py-1 text-[11px] font-bold text-zinc-900 shadow-sm">
            {badge}
          </span>
        ) : null}

        {discountPercent !== null ? (
          <span className="absolute left-2 bottom-2 inline-flex items-center rounded-full border border-[#FCD1B1] bg-[#FCD1B1] px-2 py-1 text-[11px] font-bold text-zinc-900 shadow-sm">
            -{discountPercent}%
          </span>
        ) : null}

        <CustomButton
          type="outline"
          className="absolute right-2 top-2 grid h-10 w-10 place-items-center border-black/15 bg-white/95 p-0 backdrop-blur"
          aria-label="Compartir"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onShare?.();
          }}
        >
          <Share2 aria-hidden="true" size={20} className="shrink-0" />
        </CustomButton>

        <span className="absolute bottom-2 right-2 inline-flex flex-col items-end rounded-xl border border-black/10 bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur">
          <span className="text-sm font-bold tabular-nums text-zinc-900 leading-none">
            {formatMoneyArs(price)}
          </span>
          {hasDiscount ? (
            <span className="mt-1 text-[11px] font-semibold tabular-nums text-zinc-500 line-through leading-none">
              {formatMoneyArs(originalPrice)}
            </span>
          ) : null}
        </span>
      </div>

      <div className="border-t border-black/5 px-4 pb-3 pt-3">
        <div className="text-base font-bold tracking-tight text-zinc-900 uppercase sm:text-lg">
          {name}
        </div>
        <div className="text-xs font-semibold text-zinc-500">
          Ver detalles →
        </div>
      </div>
    </>
  );

  return (
    <div
      className={cx(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-[#FEFDF8]/80 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-[#FCD1B1] focus-within:ring-offset-2 focus-within:ring-offset-[#FEFDF8]",
        className,
      )}
    >
      {href ? (
        <Link href={href} className="block flex-1 focus:outline-none">
          {content}
        </Link>
      ) : (
        <div className="block flex-1">{content}</div>
      )}

      <div className="mt-auto px-4 pb-4">
        <CustomButton
          className="w-full"
          type="filled"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart?.();
          }}
        >
          Agregar al carrito
        </CustomButton>
      </div>
    </div>
  );
}
