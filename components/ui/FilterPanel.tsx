"use client";

import React from "react";
import Link from "next/link";
import {
  Filter,
  Check,
  ChevronDown,
  X,
  Sparkles,
  Gift,
  LayoutGrid,
  Baby,
  Shirt,
  Moon,
  Zap,
} from "lucide-react";

export type IconKey =
  | "sparkles"
  | "gift"
  | "layout-grid"
  | "baby"
  | "shirt"
  | "moon"
  | "zap";

const ICONS: Record<
  IconKey,
  React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>
> = {
  sparkles: Sparkles,
  gift: Gift,
  "layout-grid": LayoutGrid,
  baby: Baby,
  shirt: Shirt,
  moon: Moon,
  zap: Zap,
};

export type FilterOption = {
  key: string;
  label: string;
  icon?: IconKey;
  hint?: string;
  count?: number;
};

export type FilterGroup = {
  id: string;
  title?: string;
  qsKey: string;
  options: FilterOption[];
  style?: "row" | "stack";
  indicator?: "pill" | "checkbox" | "dot";
  activeTint?: "primary" | "secondary" | "green" | "beige";
};

export type SortOption = {
  key: string;
  label: string;
};

type Props = {
  basePath: string;
  groups: FilterGroup[];
  sort?: {
    qsKey: string;
    options: SortOption[];
    active: string;
  };
  active: Record<string, string>;
  clearHref: string;
  activeCount?: number;
  compact?: boolean;
};

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function buildQuery(
  base: Record<string, string | undefined>,
  groupQsKey: string,
  value: string,
  sort?: Props["sort"],
  sortValue?: string,
) {
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) if (v) next[k] = v;
  if (value === "todos") delete next[groupQsKey];
  else next[groupQsKey] = value;
  if (sort && sortValue) {
    if (sortValue !== "recomendado") next[sort.qsKey] = sortValue;
    else delete next[sort.qsKey];
  }
  return next;
}

const TINT: Record<NonNullable<FilterGroup["activeTint"]>, string> = {
  primary:
    "bg-tatan-primario4 text-white border-tatan-primario4 shadow-sm hover:bg-tatan-primario4",
  secondary:
    "bg-tatan-secundario1/70 border-tatan-secundario1 text-zinc-800 shadow-sm hover:bg-tatan-secundario1/70",
  green:
    "bg-tatan-acento-verde/25 border-tatan-acento-verde/60 text-zinc-800 shadow-sm hover:bg-tatan-acento-verde/25",
  beige:
    "bg-tatan-primario1/80 border-tatan-primario2 text-zinc-800 shadow-sm hover:bg-tatan-primario1/80",
};

const INDICATOR: Record<NonNullable<FilterGroup["indicator"]>, string> = {
  pill: "bg-white/25 text-white",
  checkbox: "bg-tatan-primario4 border-tatan-primario4 text-white",
  dot: "bg-tatan-acento-verde",
};

export default function FilterPanel({
  basePath,
  groups,
  sort,
  active,
  clearHref,
  activeCount = 0,
  compact = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [maxH, setMaxH] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => setOpen((prev) => (mql.matches ? true : prev));
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    if (!panelRef.current) return;
    const update = () => setMaxH(panelRef.current?.scrollHeight);
    update();
    const r = new ResizeObserver(update);
    r.observe(panelRef.current);
    window.addEventListener("resize", update);
    return () => {
      r.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open, groups, sort, active]);

  const qsBase = React.useMemo(() => {
    const o: Record<string, string> = {};
    groups.forEach((g) => {
      if (active[g.qsKey]) o[g.qsKey] = active[g.qsKey];
    });
    if (sort && active[sort.qsKey]) o[sort.qsKey] = active[sort.qsKey];
    return o;
  }, [groups, sort, active]);

  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-tatan-secundario1/40",
        "bg-[#FFFDF9] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_3px_rgba(15,23,42,0.04)]",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-tatan-primario1/60 shrink-0">
            <Filter
              className="w-4 h-4 text-tatan-primario4"
              strokeWidth={2.2}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold uppercase tracking-wider text-zinc-700 leading-tight">
              Filtros
              {activeCount > 0 && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-tatan-primario4 text-white text-[10px] font-extrabold px-2 py-0.5 align-middle">
                  {activeCount}
                </span>
              )}
            </p>
            <p className="text-[11px] font-medium text-zinc-500 truncate">
              {compact ? "Categoría y orden" : "Refiná tu búsqueda"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sort && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Orden
              </span>
              <div className="inline-flex rounded-2xl bg-tatan-secundario1/30 border border-tatan-secundario1/40 p-0.5 overflow-hidden">
                {sort.options.map((s) => {
                  const isActive =
                    (active[sort.qsKey] ?? "recomendado") === s.key;
                  const hrefQuery = buildQuery(
                    qsBase,
                    "__noop__",
                    "todos",
                    sort,
                    s.key,
                  );
                  delete (hrefQuery as Record<string, unknown>)["__noop__"];
                  return (
                    <Link
                      key={s.key}
                      href={{ pathname: basePath, query: hrefQuery }}
                      className={cn(
                        "px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
                        isActive
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-600 hover:text-zinc-900",
                      )}
                    >
                      {s.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {activeCount > 0 && (
            <Link
              href={clearHref}
              className="hidden md:inline-flex items-center gap-1.5 rounded-2xl border border-tatan-secundario1/40 bg-white text-zinc-600 text-xs font-bold px-3 py-1.5 hover:text-zinc-900 transition-colors"
            >
              <X className="w-3 h-3" strokeWidth={2.4} />
              Limpiar
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-tatan-secundario1/40 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 shrink-0 transition-colors"
        >
          {open ? "Cerrar" : "Abrir"}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              open && "rotate-180",
            )}
            strokeWidth={2.2}
          />
        </button>
      </div>

      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          maxHeight:
            typeof window === "undefined"
              ? open
                ? 10000
                : 0
              : ((open ? maxH : 0) ?? 0),
        }}
      >
        <div
          ref={panelRef}
          className={cn(
            "grid gap-4 sm:gap-5",
            "px-4 pb-4 sm:px-5 sm:pb-5",
            "lg:grid-cols-[1fr] lg:gap-5",
          )}
        >
          <div
            className={cn(
              "grid gap-4",
              compact
                ? "sm:grid-cols-[1fr_auto] sm:items-center"
                : "md:grid-cols-2 lg:grid-cols-[1fr]",
            )}
          >
            {groups.map((g) => {
              const stack =
                g.style === "stack" ||
                g.options.some((o) => o.hint) ||
                g.options.some((o) => typeof o.count === "number");
              return (
                <div key={g.id}>
                  {g.title && (
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-2">
                      {g.title}
                    </p>
                  )}
                  {stack ? (
                    <div className="flex flex-col gap-1.5">
                      {g.options.map((o) => {
                        const isActive = (active[g.qsKey] ?? "todos") === o.key;
                        const Icon = o.icon ? ICONS[o.icon] : undefined;
                        const hrefQuery = buildQuery(
                          qsBase,
                          g.qsKey,
                          o.key,
                          sort,
                          active[sort?.qsKey ?? ""] ?? "recomendado",
                        );
                        const indicator =
                          (g.indicator as NonNullable<
                            FilterGroup["indicator"]
                          >) || "pill";
                        return (
                          <Link
                            key={o.key}
                            href={{ pathname: basePath, query: hrefQuery }}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm font-semibold border transition-all",
                              isActive
                                ? TINT[g.activeTint ?? "primary"]
                                : "bg-white border-tatan-secundario1/40 text-zinc-700 hover:bg-tatan-secundario1/20",
                            )}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              {indicator === "checkbox" && (
                                <span
                                  className={cn(
                                    "mt-0.5 w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0",
                                    isActive
                                      ? INDICATOR.checkbox
                                      : "border-zinc-300",
                                  )}
                                >
                                  {isActive && (
                                    <Check
                                      className="w-3 h-3 text-white"
                                      strokeWidth={3}
                                    />
                                  )}
                                </span>
                              )}
                              {indicator === "dot" && (
                                <span
                                  className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    isActive ? INDICATOR.dot : "bg-zinc-300",
                                  )}
                                />
                              )}
                              {Icon && (
                                <Icon
                                  className="w-4 h-4 shrink-0"
                                  strokeWidth={isActive ? 2.4 : 2}
                                />
                              )}
                              <span className="leading-tight truncate">
                                <span className="block">{o.label}</span>
                                {o.hint && (
                                  <span className="block text-[11px] font-medium opacity-80 mt-0.5">
                                    {o.hint}
                                  </span>
                                )}
                              </span>
                            </span>
                            {typeof o.count === "number" && (
                              <span
                                className={cn(
                                  "text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0",
                                  isActive
                                    ? "bg-white/25 text-white"
                                    : "bg-tatan-primario1/70 text-zinc-500",
                                )}
                              >
                                {o.count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {g.options.map((o) => {
                        const isActive = (active[g.qsKey] ?? "todos") === o.key;
                        const Icon = o.icon ? ICONS[o.icon] : undefined;
                        const hrefQuery = buildQuery(
                          qsBase,
                          g.qsKey,
                          o.key,
                          sort,
                          active[sort?.qsKey ?? ""] ?? "recomendado",
                        );
                        return (
                          <Link
                            key={o.key}
                            href={{ pathname: basePath, query: hrefQuery }}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-sm font-bold border transition-all",
                              isActive
                                ? TINT[g.activeTint ?? "primary"]
                                : "bg-white border-tatan-secundario1/40 text-zinc-700 hover:bg-tatan-secundario1/20",
                            )}
                          >
                            {Icon && (
                              <Icon
                                className="w-3.5 h-3.5"
                                strokeWidth={isActive ? 2.4 : 2}
                              />
                            )}
                            {o.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
