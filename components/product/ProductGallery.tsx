"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import ProductPhoto from "@/components/ui/ProductPhoto";
import SmartImage from "@/components/ui/SmartImage";
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
  /** Ya no se usa (el fondo sale de la foto); se acepta por compatibilidad */
  colorHex?: string;
  /** Etiquetas que van encima de la foto (descuento, "Nuevo"...) */
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const current = images[active] ?? images[0];
  const canZoom = !!current && !isPlaceholderImage(current);
  // Al elegir un modelo con foto, la galería salta a esa foto
  useEffect(() => {
    const onShow = (e: Event) => {
      const src = (e as CustomEvent<string>).detail;
      const i = images.indexOf(src);
      if (i >= 0) setActive(i);
    };
    window.addEventListener("tatan:show-image", onShow);
    return () => window.removeEventListener("tatan:show-image", onShow);
  }, [images]);

  return (
    <div className="space-y-3">
      <div className="relative paper-card rounded-3xl p-3 sm:p-5 overflow-hidden">
        {children}
        {/* La foto se ve entera, con aire del mismo color que su fondo */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white">
          <ProductPhoto
            framed
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
                : "object-contain p-[7%]",
            )}
          />
          {canZoom && (
            <>
              {/* Tocar la foto también la abre en grande */}
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                className="absolute inset-0 z-[1] cursor-zoom-in"
                aria-label="Ver foto en pantalla completa"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                aria-label="Ver foto en pantalla completa"
                title="Pantalla completa"
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-md transition hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-tatan-primario4"
              >
                <Expand className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
              </button>
            </>
          )}
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
                framed
                src={src}
                alt=""
                fill
                sizes="96px"
                className={
                  isPlaceholderImage(src)
                    ? "object-contain p-1.5 mix-blend-multiply"
                    : "object-contain p-[6%]"
                }
              />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <Lightbox
          images={images.filter((src) => !isPlaceholderImage(src))}
          start={current}
          name={name}
          onClose={(src) => {
            setZoomOpen(false);
            const i = images.indexOf(src);
            if (i >= 0) setActive(i);
          }}
        />
      )}
    </div>
  );
}

/**
 * Fotos en pantalla completa: se deslizan con el dedo, con flechas o con el
 * teclado (← →). Se cierra con la X, con Esc o tocando fuera de la foto.
 */
function Lightbox({
  images,
  start,
  name,
  onClose,
}: {
  images: string[];
  start: string;
  name: string;
  /** Devuelve la foto que quedó a la vista, para mostrarla en la galería */
  onClose: (src: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, images.indexOf(start)));
  const many = images.length > 1;

  const close = () => onClose(images[index] ?? start);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  // Arranca en la foto que se estaba viendo (sin animación)
  const jumpToStart = useEffectEvent(() => {
    const el = track.current;
    if (el) el.scrollLeft = index * el.clientWidth;
  });
  useLayoutEffect(() => jumpToStart(), []);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
  });

  // Teclado, foco y scroll de la página bloqueado mientras está abierto
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${name}`}
      className="fixed inset-0 z-[200] bg-black/90"
    >
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== index) setIndex(i);
        }}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-contain"
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
            className="relative flex h-full w-full shrink-0 snap-center items-center justify-center px-2 py-16 sm:px-20"
          >
            <div className="relative h-full w-full">
              <SmartImage
                src={src}
                alt={i === 0 ? name : `${name}, foto ${i + 1}`}
                fill
                quality={85}
                sizes="100vw"
                loading={Math.abs(i - index) <= 1 ? "eager" : "lazy"}
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 sm:p-4">
        <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white">
          {many ? `${index + 1} / ${images.length}` : ""}
        </span>
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className={cx(btn, "pointer-events-auto")}
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {many && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Foto anterior"
            className={cx(btn, "absolute left-3 top-1/2 hidden -translate-y-1/2 sm:flex")}
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Foto siguiente"
            className={cx(btn, "absolute right-3 top-1/2 hidden -translate-y-1/2 sm:flex")}
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
