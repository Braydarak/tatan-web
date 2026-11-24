"use client";

/**
 * Muestra u oculta su contenido deslizándolo hacia arriba o abajo con un
 * fundido. Usa las animaciones nativas del navegador (Web Animations API):
 * antes usaba gsap, que pesaba ~70 KB en todas las páginas solo para esto.
 */

import * as React from "react";

export type UpDownAnimationProps = {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  from?: "top" | "bottom";
  exitTo?: "top" | "bottom";
  distance?: number;
  /** Segundos (como antes con gsap) */
  duration?: number;
  ease?: string;
  onEntered?: () => void;
  onExited?: () => void;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export default function UpDownAnimation({
  show,
  children,
  className,
  from = "top",
  exitTo,
  distance = 16,
  duration = 0.22,
  ease = "cubic-bezier(0.33, 1, 0.68, 1)", // equivalente a power2.out
  onEntered,
  onExited,
}: UpDownAnimationProps) {
  const resolvedExitTo = exitTo ?? (from === "top" ? "bottom" : "top");
  const ref = React.useRef<HTMLDivElement | null>(null);
  // Callbacks actuales sin reiniciar la animación cuando cambian
  const cbs = React.useRef({ onEntered, onExited });
  React.useEffect(() => {
    cbs.current = { onEntered, onExited };
  });

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.getAnimations().forEach((a) => a.cancel());

    if (prefersReducedMotion() || typeof el.animate !== "function") {
      el.style.display = show ? "block" : "none";
      el.style.opacity = show ? "1" : "0";
      (show ? cbs.current.onEntered : cbs.current.onExited)?.();
      return;
    }

    const enterY = from === "top" ? -distance : distance;
    const exitY = resolvedExitTo === "top" ? -distance : distance;
    const ms = duration * 1000;

    if (show) {
      el.style.display = "block";
      const a = el.animate(
        [
          { transform: `translateY(${enterY}px)`, opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration: ms, easing: ease, fill: "both" },
      );
      a.onfinish = () => cbs.current.onEntered?.();
      return;
    }

    const a = el.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: `translateY(${exitY}px)`, opacity: 0 },
      ],
      { duration: ms, easing: ease, fill: "both" },
    );
    a.onfinish = () => {
      el.style.display = "none";
      cbs.current.onExited?.();
    };
  }, [distance, duration, ease, from, resolvedExitTo, show]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
