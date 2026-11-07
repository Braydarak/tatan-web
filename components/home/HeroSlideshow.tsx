"use client";

import { useEffect, useState } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { isPlaceholderImage } from "@/lib/is-placeholder";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Fotos de la portada (hasta 5) que van pasando en bucle con un fundido y
 * un zoom lento. Con una sola foto queda fija. Respeta "reducir movimiento".
 */
export default function HeroSlideshow({
  images,
  alt = "Producto destacado",
  intervalMs = 4200,
  sizes = "(max-width: 768px) 80vw, 500px",
  priority = true,
}: {
  images: string[];
  alt?: string;
  intervalMs?: number;
  sizes?: string;
  priority?: boolean;
}) {
  const list = images.filter(Boolean).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = list.length > 1;

  useEffect(() => {
    if (!many || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % list.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [many, paused, list.length, intervalMs]);

  if (list.length === 0) return null;
  const active = index % list.length;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription={many ? "carrusel" : undefined}
      aria-label={many ? `${alt}: ${list.length} fotos` : undefined}
    >
      {list.map((src, i) => {
        const placeholder = isPlaceholderImage(src);
        return (
          <div
            key={`${src}-${i}`}
            className={cx(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              i === active ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={i !== active}
          >
            <SmartImage
              src={src}
              alt={i === 0 ? alt : `${alt} (${i + 1})`}
              fill
              priority={priority && i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              sizes={sizes}
              className={cx(
                placeholder
                  ? "object-contain p-6 drop-shadow-lg"
                  : "object-cover",
                // Zoom lento mientras la foto está visible
                many && i === active && "hero-kenburns",
              )}
            />
          </div>
        );
      })}

      {many && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${list.length}`}
              aria-current={i === active ? "true" : undefined}
              className={cx(
                "h-1.5 rounded-full transition-all duration-500",
                i === active ? "w-5 bg-zinc-700/70" : "w-1.5 bg-zinc-500/40 hover:bg-zinc-600/60",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
