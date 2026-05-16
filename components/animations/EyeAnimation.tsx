"use client";

import EyeSvg from "@/assets/svg/eye";
import { gsap } from "gsap";
import * as React from "react";

export type EyeAnimationProps = {
  open: boolean;
  className?: string;
};

export default function EyeAnimation({ open, className }: EyeAnimationProps) {
  const rawClipId = React.useId();
  const clipId = React.useMemo(() => rawClipId.replace(/:/g, "_"), [rawClipId]);
  const rectRef = React.useRef<SVGRectElement | null>(null);
  const hasMountedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    const rect = rectRef.current;
    if (!rect) return;

    gsap.killTweensOf(rect);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (open) {
        gsap.set(rect, { attr: { y: 0, height: 0 } });
      } else {
        gsap.set(rect, { attr: { y: 0, height: 24 } });
      }
      return;
    }

    if (open) {
      gsap.to(rect, {
        attr: { y: 0, height: 0 },
        duration: 0.22,
        ease: "power2.out",
      });
      return;
    }

    gsap.set(rect, { attr: { y: 24, height: 0 } });
    gsap.to(rect, {
      attr: { y: 0, height: 24 },
      duration: 0.22,
      ease: "power2.out",
    });
  }, [open]);

  return (
    <EyeSvg
      open={open}
      className={className}
      slashClipPathId={clipId}
      slashRectRef={rectRef}
    />
  );
}
