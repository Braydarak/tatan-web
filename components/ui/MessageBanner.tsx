"use client";

import * as React from "react";
import UpDownAnimation from "@/components/animations/Up&DownAnimation";

export type MessageBannerProps = {
  messages?: Array<React.ReactNode>;
  intervalMs?: number;
  from?: "top" | "bottom" | "alternate";
  message?: string;
  children?: React.ReactNode;
  className?: string;
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

export default function MessageBanner({
  messages,
  intervalMs = 3200,
  from = "top",
  message = "Envíos a todo el país · Cambios fáciles · Pagá como quieras",
  children,
  className,
}: MessageBannerProps) {
  const prefersReducedMotion = getPrefersReducedMotion();

  const items = React.useMemo<Array<React.ReactNode>>(() => {
    if (children != null) return [children];
    if (messages && messages.length > 0) return messages;
    return [message];
  }, [children, message, messages]);

  const [index, setIndex] = React.useState(0);
  const [show, setShow] = React.useState(true);

  React.useEffect(() => {
    if (items.length <= 1) return;

    if (prefersReducedMotion) {
      const id = window.setInterval(() => {
        setIndex((i) => (i + 1) % items.length);
      }, intervalMs);
      return () => window.clearInterval(id);
    }

    if (!show) return;
    const id = window.setTimeout(() => setShow(false), intervalMs);
    return () => window.clearTimeout(id);
  }, [intervalMs, items.length, prefersReducedMotion, show]);

  const safeIndex = items.length > 0 ? index % items.length : 0;
  const resolvedFrom =
    from === "alternate" ? (safeIndex % 2 === 0 ? "top" : "bottom") : from;

  return (
    <div className={cx("w-full bg-[#FCD1B1]/30 text-zinc-900", className)}>
      <div className="relative mx-auto flex h-8 max-w-7xl items-center justify-center overflow-hidden px-4 text-center text-sm font-semibold sm:px-6 lg:px-8">
        <UpDownAnimation
          show={prefersReducedMotion || items.length <= 1 ? true : show}
          from={resolvedFrom}
          distance={14}
          className="w-full"
          onExited={() => {
            if (items.length <= 1) return;
            setIndex((i) => (i + 1) % items.length);
            setShow(true);
          }}
        >
          <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap leading-none">
            {items[safeIndex]}
          </div>
        </UpDownAnimation>
      </div>
    </div>
  );
}
