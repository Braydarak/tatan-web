"use client";

import { useState } from "react";
import ProductPhoto from "@/components/ui/ProductPhoto";
import { isPlaceholderImage } from "@/lib/is-placeholder";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/** Foto grande + miniaturas reales del producto (solo si hay más de una). */
export default function ProductGallery({
  images,
  name,
  children,
}: {
  images: string[];
  name: string;
  /** Ya no se usa (el fondo es blanco); se acepta por compatibilidad */
  colorHex?: string;
  /** Etiquetas que van encima de la foto (descuento, "Nuevo"...) */
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative paper-card rounded-3xl p-3 sm:p-5 overflow-hidden">
        {children}
        {/* Fondo blanco: las fotos de producto suelen venir en blanco y así
            no se nota el borde de la imagen */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white">
          <ProductPhoto
            key={current}
            src={current}
            alt={active === 0 ? name : `${name}, foto ${active + 1}`}
            fill
            priority={active === 0}
            loading={active === 0 ? "eager" : undefined}
            sizes="(max-width: 1024px) 90vw, 600px"
            className={cx(
              "gallery-fade",
              isPlaceholderImage(current)
                ? "object-contain p-5 sm:p-8"
                : "object-cover",
            )}
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver foto ${i + 1} de ${images.length}`}
              aria-pressed={i === active}
              className={cx(
                "relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border-2 bg-white/70 transition-all",
                i === active
                  ? "border-tatan-primario4 shadow-md"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <ProductPhoto compact
                src={src}
                alt=""
                fill
                sizes="96px"
                className={
                  isPlaceholderImage(src)
                    ? "object-contain p-1.5 mix-blend-multiply"
                    : "object-cover"
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
