"use client";

import { useEffect } from "react";

/**
 * Anima los elementos con `data-reveal` al entrar y al salir de pantalla.
 *
 * - Bajando: aparecen subiendo desde abajo.
 * - Subiendo: lo que queda abajo se va hacia abajo (la animación al revés) y
 *   lo que vuelve a entrar por arriba aparece bajando.
 *
 * `data-side` dice por dónde salió cada elemento (above/below) para que el CSS
 * lo esconda hacia ese lado. Sin JS o con "reducir movimiento" todo se ve
 * normal: la clase `reveal-ready` recién se agrega acá.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const root = document.documentElement;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    // Lo que ya está a la vista arranca visible para que no parpadee
    const vh = window.innerHeight;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add("is-visible");
      else el.dataset.side = r.top >= vh ? "below" : "above";
    }
    root.classList.add("reveal-ready");

    // Dos umbrales con margen: aparece cuando entra un 12% y se esconde recién
    // cuando salió del todo, así no tiembla en el borde.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting && e.intersectionRatio >= 0.12) {
            el.classList.add("is-visible");
          } else if (!e.isIntersecting) {
            el.dataset.side =
              e.boundingClientRect.top < (e.rootBounds?.top ?? 0)
                ? "above"
                : "below";
            el.classList.remove("is-visible");
          }
        }
      },
      { threshold: [0, 0.12] },
    );
    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
