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

type Rect = { x: number; y: number; w: number; h: number };

/** Rectángulo que ocupa una foto de proporción `ratio` (ancho/alto) dentro de `box` (object-contain). */
function fitRect(box: Rect, ratio: number): Rect {
  let w = box.w;
  let h = box.w / ratio;
  if (h > box.h) {
    h = box.h;
    w = box.h * ratio;
  }
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

function toRect(r: DOMRect): Rect {
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

/** Aire de la foto en la galería (p-[7%] de ProductPhoto framed) */
const GALLERY_PAD = 0.07;
/** Abrir: arranca decidido y frena largo y suave. Cerrar: un poco más corto. */
const ZOOM = {
  open: { ms: 460, ease: "cubic-bezier(0.22, 1, 0.36, 1)" },
  close: { ms: 380, ease: "cubic-bezier(0.32, 0.72, 0, 1)" },
};
/** Fundido de la foto real y los controles sobre la copia al terminar de abrir */
const FADE_MS = 200;

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
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
  const frame = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ rect: Rect; src: string } | null>(null);

  /** Dónde está la foto (sin el aire) dentro del marco de la galería */
  const photoBox = (): Rect | null => {
    const el = frame.current;
    if (!el) return null;
    const r = toRect(el.getBoundingClientRect());
    const pad = r.w * GALLERY_PAD;
    return { x: r.x + pad, y: r.y + pad, w: r.w - pad * 2, h: r.h - pad * 2 };
  };

  const openZoom = () => {
    const img = frame.current?.querySelector("img");
    const box = photoBox();
    setOrigin(
      img && box && img.naturalWidth > 0
        ? {
            rect: fitRect(box, img.naturalWidth / img.naturalHeight),
            src: img.currentSrc || img.src,
          }
        : null,
    );
    setZoomOpen(true);
  };
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
        <div
          ref={frame}
          className={cx(
            "relative aspect-square rounded-2xl overflow-hidden bg-white",
            // Mientras está en pantalla completa, la foto "se fue" de acá
            zoomOpen && "[&_img]:invisible",
          )}
        >
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
                onClick={openZoom}
                className="absolute inset-0 z-[1] cursor-zoom-in"
                aria-label="Ver foto en pantalla completa"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={openZoom}
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
          origin={origin}
          returnRect={(ratio) => {
            const box = photoBox();
            return box ? fitRect(box, ratio) : null;
          }}
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
 *
 * Al abrir, la foto crece desde donde estaba en la galería; al cerrar vuelve
 * a ese lugar. Lo hace una copia de la foto ("ghost") que viaja entre los dos
 * rectángulos mientras el fondo aparece o se va.
 */
function Lightbox({
  images,
  start,
  name,
  origin,
  returnRect,
  onClose,
}: {
  images: string[];
  start: string;
  name: string;
  /** Dónde estaba la foto en la galería (para la animación de apertura) */
  origin: { rect: Rect; src: string } | null;
  /** A dónde vuelve una foto de esa proporción al cerrar */
  returnRect: (ratio: number) => Rect | null;
  /** Devuelve la foto que quedó a la vista, para mostrarla en la galería */
  onClose: (src: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLImageElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, images.indexOf(start)));
  const many = images.length > 1;
  // opening/closing: se ve la copia animándose; open: se ven las fotos reales
  const [phase, setPhase] = useState<"opening" | "open" | "closing">(() =>
    origin && !reducedMotion() ? "opening" : "open",
  );
  // Foto que muestra la copia y de dónde a dónde viaja al cerrar
  const [ghostSrc, setGhostSrc] = useState(origin?.src ?? "");
  // La copia sigue un momento debajo mientras la foto real aparece encima
  const [ghostOn, setGhostOn] = useState(phase === "opening");
  const closing = useRef<{ from: Rect; to: Rect; src: string } | null>(null);

  /** Lugar de la foto `i` en pantalla completa (sin el aire del costado) */
  const slideBox = (i: number): Rect | null => {
    const inner = track.current?.children[i]?.firstElementChild;
    return inner ? toRect(inner.getBoundingClientRect()) : null;
  };
  const slideImg = (i: number) =>
    track.current?.children[i]?.querySelector("img") ?? null;

  /** Anima la copia de `from` a `to` (y el fondo), y avisa al terminar. */
  const fly = (from: Rect, to: Rect, opening: boolean, done: () => void) => {
    const g = ghost.current;
    const bd = backdrop.current;
    if (!g || !bd) return done();
    Object.assign(g.style, {
      left: `${to.x}px`,
      top: `${to.y}px`,
      width: `${to.w}px`,
      height: `${to.h}px`,
    });
    // Misma proporción en los dos lugares: una sola escala, sin deformar
    const k = from.w / to.w;
    const startT = `translate3d(${from.x - to.x}px, ${from.y - to.y}px, 0) scale(${k})`;
    const z = opening ? ZOOM.open : ZOOM.close;
    const opts = { duration: z.ms, easing: z.ease, fill: "both" as const };
    // El fondo acompaña un poco más rápido (al abrir) o más lento (al cerrar)
    bd.animate([{ opacity: opening ? 0 : 1 }, { opacity: opening ? 1 : 0 }], {
      duration: opening ? z.ms * 0.7 : z.ms,
      easing: opening ? "ease-out" : "ease-in",
      fill: "both",
    });
    // Una sola vez: al terminar, o de respaldo si la animación se corta
    let called = false;
    const once = () => {
      if (called) return;
      called = true;
      done();
    };
    g.animate([{ transform: startT }, { transform: "translate3d(0, 0, 0) scale(1)" }], opts).onfinish = once;
    setTimeout(once, z.ms + 250);
  };

  const close = () => {
    const src = images[index] ?? start;
    if (phase !== "open") return;
    const img = slideImg(index);
    const box = slideBox(index);
    const ratio = img && img.naturalWidth > 0 ? img.naturalWidth / img.naturalHeight : 0;
    const to = ratio ? returnRect(ratio) : null;
    if (!img || !box || !to || reducedMotion()) {
      onClose(src);
      return;
    }
    closing.current = { from: fitRect(box, ratio), to, src };
    setGhostSrc(img.currentSrc || img.src);
    setGhostOn(true);
    setPhase("closing");
  };

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  // Arranca en la foto que se estaba viendo y, si hay origen, la foto crece
  // desde la galería hasta su lugar
  const onMount = useEffectEvent(() => {
    const el = track.current;
    if (el) el.scrollLeft = index * el.clientWidth;
    if (phase !== "opening" || !origin) return;
    const box = slideBox(index);
    const to = box ? fitRect(box, origin.rect.w / origin.rect.h) : origin.rect;
    fly(origin.rect, to, true, () => {
      // La copia queda hasta que carga la foto grande, así no parpadea
      const img = slideImg(index);
      // Solo pasa de "abriendo" a "abierto" (si ya se está cerrando, no toca nada)
      const show = () => {
        setPhase((p) => (p === "opening" ? "open" : p));
        // Cuando terminó el fundido, se saca la copia (si no se está cerrando)
        setTimeout(() => setGhostOn((on) => (on && closing.current ? on : false)), FADE_MS + 40);
      };
      if (!img || img.complete) show();
      else {
        img.addEventListener("load", show, { once: true });
        img.addEventListener("error", show, { once: true });
        setTimeout(show, 1500);
      }
    });
  });
  useLayoutEffect(() => onMount(), []);

  // Al cerrar: la copia vuelve a la galería y recién ahí se desmonta
  const onClosing = useEffectEvent(() => {
    const c = closing.current;
    if (phase !== "closing" || !c) return;
    fly(c.from, c.to, false, () => onClose(c.src));
  });
  useLayoutEffect(() => onClosing(), [phase]);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
  });

  // Teclado, foco y scroll de la página bloqueado mientras está abierto
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    // Sin la barra de scroll la página se correría de costado: se compensa
    const bar = window.innerWidth - document.documentElement.clientWidth;
    if (bar > 0) document.body.style.paddingRight = `${bar}px`;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
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
      className="fixed inset-0 z-[200]"
    >
      <div ref={backdrop} className="absolute inset-0 bg-black/90" aria-hidden="true" />
      {ghostOn && ghostSrc && (
        // eslint-disable-next-line @next/next/no-img-element -- copia de la foto ya cargada, solo para la animación
        <img
          ref={ghost}
          src={ghostSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed z-10 origin-top-left object-contain will-change-transform"
        />
      )}
      <div
        className="absolute inset-0 z-20"
        style={{
          // Al abrir aparece con un fundido sobre la copia; al cerrar se va al instante
          opacity: phase === "open" ? 1 : 0,
          transition: phase === "open" ? `opacity ${FADE_MS}ms ease-out` : "none",
          pointerEvents: phase === "open" ? "auto" : "none",
        }}
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
      </div>
    </div>,
    document.body,
  );
}
