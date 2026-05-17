"use client";

import { gsap } from "gsap";
import * as React from "react";

export type UpDownAnimationProps = {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  from?: "top" | "bottom";
  exitTo?: "top" | "bottom";
  distance?: number;
  duration?: number;
  ease?: string;
  onEntered?: () => void;
  onExited?: () => void;
};

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

function getPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  );
}

export default function UpDownAnimation({
  show,
  children,
  className,
  from = "top",
  exitTo,
  distance = 16,
  duration = 0.22,
  ease = "power2.out",
  onEntered,
  onExited,
}: UpDownAnimationProps) {
  const resolvedExitTo = exitTo ?? (from === "top" ? "bottom" : "top");
  const prefersReducedMotion = getPrefersReducedMotion();

  const elementRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    gsap.killTweensOf(element);

    if (prefersReducedMotion) {
      gsap.set(element, {
        clearProps: "transform",
        autoAlpha: show ? 1 : 0,
        display: show ? "block" : "none",
      });
      return;
    }

    const enterY = from === "top" ? -distance : distance;
    const exitY = resolvedExitTo === "top" ? -distance : distance;

    if (show) {
      gsap.set(element, { display: "block" });
      gsap.fromTo(
        element,
        { y: enterY, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration,
          ease,
          onComplete: () => {
            onEntered?.();
          },
        },
      );
      return;
    }

    gsap.to(element, {
      y: exitY,
      autoAlpha: 0,
      duration,
      ease,
      onComplete: () => {
        gsap.set(element, { display: "none" });
        onExited?.();
      },
    });
  }, [
    distance,
    duration,
    ease,
    from,
    onEntered,
    onExited,
    prefersReducedMotion,
    resolvedExitTo,
    show,
  ]);

  return (
    <div ref={elementRef} className={cx(className)}>
      {children}
    </div>
  );
}
