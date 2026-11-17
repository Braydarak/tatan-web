"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { PendingMark } from "@/components/ui/LinkPending";

type Props = {
  value: string;
  options: { key: string; label: string }[];
  /** Link de cada opción (ya con el resto de los filtros) */
  hrefs: Record<string, string>;
};

/**
 * Selector de orden: cambia la URL manteniendo los filtros. Mientras llegan
 * los productos ya muestra la opción elegida y la grilla se atenúa.
 */
export default function SortSelect({ value, options, hrefs }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(value);
  return (
    <label className="relative inline-flex h-10 items-center gap-2 rounded-2xl border border-tatan-secundario1/70 bg-white/90 pl-3 pr-2 text-sm font-semibold text-zinc-700 shadow-sm focus-within:ring-2 focus-within:ring-tatan-primario4">
      <ArrowUpDown className="h-4 w-4 text-zinc-400" strokeWidth={2.2} />
      <span className="sr-only">Ordenar por</span>
      <PendingMark pending={pending} />
      <select
        value={shown}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(() => {
            setShown(next);
            router.push(hrefs[next] ?? "/productos", { scroll: false });
          });
        }}
        className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-zinc-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
