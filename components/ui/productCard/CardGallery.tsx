"use client";

import { useRef, useState } from "react";
import ProductPhoto from "@/components/ui/ProductPhoto";
import Link from "next/link";
import { isPlaceholderImage } from "@/lib/is-placeholder";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  images: string[];
  title: string;
  href: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  dim?: boolean;
};

/**
 * Fotos de la card. Con una sola foto es una imagen normal; con varias se
 * deslizan con el dedo (scroll-snap) y en compu aparecen flechas al pasar
 * el mouse. Los puntitos muestran cuál se está viendo.
 */
export default function CardGallery({
  images,
  title,
  href,
  priority = false,
  loading = "lazy",
  dim = false,
}: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  // Foto real: llena el cuadro. Logo de relleno: centrado con aire.
  const imgClass = (src: string) =>
    cx(
      "transition-transform duration-500 ease-out",
      isPlaceholderImage(src)
        ? "object-contain p-2 sm:p-4 mix-blend-multiply"
        : "object-cover",
      !many && "group-hover:scale-[1.06]",
      dim && "opacity-55 grayscale-[35%]",
    );

  if (!many) {
    return (
      <Link
        href={href}
        className="absolute inset-0 block"
        aria-label={`Ver ${title}`}
        tabIndex={-1}
      >
        <ProductPhoto
          src={images[0]}
          alt={title}
          fill
          loading={priority ? undefined : loading}
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 300px"
          className={imgClass(images[0])}
        />
      </Link>
    );
  }

  return (
    <>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== index) setIndex(i);
        }}
        className="no-scrollbar absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${title}`}
      >
        {images.map((src, i) => (
          <Link
            key={`${src}-${i}`}
            href={href}
            className="relative block h-full w-full shrink-0 snap-center"
            aria-label={`Ver ${title} (foto ${i + 1} de ${images.length})`}
            tabIndex={i === 0 ? 0 : -1}
          >
            <ProductPhoto
              src={src}
              alt={i === 0 ? title : `${title}, foto ${i + 1}`}
              fill
              loading={i === 0 && priority ? undefined : "lazy"}
              priority={i === 0 && priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 300px"
              className={imgClass(src)}
            />
          </Link>
        ))}
      </div>

      {/* Flechas (compu, al pasar el mouse) */}
      {(["prev", "next"] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            go(index + (dir === "next" ? 1 : -1));
          }}
          aria-label={dir === "next" ? "Foto siguiente" : "Foto anterior"}
          className={cx(
            "gallery-arrow absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-md transition hover:bg-white hover:scale-105 sm:flex",
            dir === "prev" ? "left-2" : "right-2",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={dir === "next" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
          </svg>
        </button>
      ))}

      {/* Puntitos */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1">
        {images.map((_, i) => (
          <span
            key={i}
            className={cx(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-4 bg-zinc-700/70" : "w-1.5 bg-zinc-400/50",
            )}
          />
        ))}
      </div>
    </>
  );
}
