"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { promoEndsAtMs } from "@/lib/promo";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Termina en 2d 05:12:09". Arranca vacío (mismo HTML en server y cliente)
 * con el lugar reservado, así no hay salto al cargar.
 */
export default function PromoCountdown({ endsAt }: { endsAt: string }) {
  const end = promoEndsAtMs(endsAt);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (end === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  if (end === null) return null;
  const left = now === null ? null : end - now;
  if (left !== null && left <= 0) return null;
  const p = left === null ? null : parts(left);

  return (
    <div
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-tatan-acento-rosa/60 bg-white/80 px-3.5 text-sm font-bold text-zinc-700 shadow-sm"
      aria-live="off"
    >
      <Clock className="h-4 w-4 text-rose-400" strokeWidth={2.4} />
      <span>Termina en</span>
      <span className="min-w-[7.5ch] tabular-nums text-zinc-800">
        {p
          ? `${p.d > 0 ? `${p.d}d ` : ""}${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`
          : ""}
      </span>
    </div>
  );
}
