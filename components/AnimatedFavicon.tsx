"use client";

import { useEffect } from "react";
import { FAVICON_LETTERS } from "@/lib/favicon-letters";

/** Cada letra (ms) y la pausa en la T antes de repetir */
const LETTER_MS = 500;
const REST_MS = 6000;

/**
 * Ícono de la pestaña animado: T → A → T → A → N (cada una con su color del
 * logo) y descansa en la T. Lo hace cambiando el href de los <link rel="icon">
 * (animar el SVG del ícono solo lo respetaría Firefox).
 *
 * En Safari (no actualiza el ícono en vivo) y con "reducir movimiento" no hace
 * nada: queda la T fija de app/icon.svg y app/favicon.ico.
 */
export default function AnimatedFavicon() {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isSafari = /safari/i.test(ua) && !/chrome|chromium|crios|fxios|edg|android/i.test(ua);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isSafari || reduced) return;

    const frames = FAVICON_LETTERS.map(
      ({ viewBox, d, fill }) =>
        `data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path d="${d}" fill="${fill}"/></svg>`,
        )}`,
    );

    // Los íconos originales (para dejarlos como estaban al salir)
    const originals = new Map<HTMLLinkElement, { href: string; type: string | null; sizes: string | null }>();
    const show = (href: string) => {
      // Se buscan cada vez: Next puede volver a poner los <link> al navegar
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((link) => {
        if (!originals.has(link)) {
          originals.set(link, {
            href: link.href,
            type: link.getAttribute("type"),
            sizes: link.getAttribute("sizes"),
          });
        }
        link.type = "image/svg+xml";
        link.setAttribute("sizes", "any");
        link.href = href;
      });
    };

    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      show(frames[i]);
      const last = i === frames.length - 1;
      // Después de la N vuelve a la T y descansa
      i = (i + 1) % frames.length;
      timer = setTimeout(() => {
        if (last) {
          show(frames[0]);
          timer = setTimeout(tick, REST_MS);
        } else {
          tick();
        }
      }, LETTER_MS);
    };
    // Arranca con la T quieta un rato (la que ya se ve) y después anima
    timer = setTimeout(tick, REST_MS / 2);

    return () => {
      clearTimeout(timer);
      originals.forEach((o, link) => {
        link.href = o.href;
        if (o.type) link.type = o.type;
        else link.removeAttribute("type");
        if (o.sizes) link.setAttribute("sizes", o.sizes);
        else link.removeAttribute("sizes");
      });
    };
  }, []);

  return null;
}
