"use client";

import Image from "next/image";
import * as React from "react";
import { AlertTriangle, PackageX, RotateCcw, Save, Search } from "lucide-react";
import { apiProductSave, apiProducts, type Product } from "@/lib/tatan-api";
import { LOW_STOCK, stockLevel, totalStockOf } from "./format";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type Filter = "todos" | "bajo" | "agotados";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "bajo", label: "Stock bajo" },
  { id: "agotados", label: "Agotados" },
];

export default function Inventario() {
  const [products, setProducts] = React.useState<Product[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("todos");
  const [edits, setEdits] = React.useState<
    Record<string, Record<string, number>>
  >({});
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const toastTimer = React.useRef<number | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const load = React.useCallback(async () => {
    try {
      const list = await apiProducts();
      setProducts(list);
      setEdits({});
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar productos");
    }
  }, []);

  React.useEffect(() => {
    // `load` es async: sus setState ocurren después del await. La regla lo
    // detecta por la llamada directa, así que la silenciamos igual que en ProductsCrm.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const setSizeStock = (productId: string, size: string, value: number) => {
    setEdits((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? {}), [size]: value },
    }));
  };

  const isDirty = (productId: string) =>
    Object.keys(edits[productId] ?? {}).length > 0;

  const stockOf = (p: Product, size: string) =>
    edits[p.id]?.[size] ?? p.stockBySize[size] ?? 0;

  const save = async (p: Product) => {
    const merged: Record<string, number> = { ...p.stockBySize };
    for (const [size, value] of Object.entries(edits[p.id] ?? {})) {
      merged[size] = Math.max(0, Math.floor(value) || 0);
    }

    setSavingId(p.id);
    try {
      const r = await apiProductSave({
        id: p.id,
        name: p.name,
        imageSrc: p.imageSrc,
        category: p.category,
        slug: p.slug,
        tagline: p.tagline,
        sizeGroup: p.sizeGroup,
        sizes: p.sizes,
        stockBySize: merged,
        colorHex: p.colorHex,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        installments: p.installments,
        taxFreePrice: p.taxFreePrice,
        showPointsBadge: p.showPointsBadge,
        rating: p.rating,
        reviews: p.reviews,
        soldTotal: p.soldTotal,
        active: p.active,
        gallery: p.gallery,
        colorVariants: p.colorVariants,
        features: p.features,
        relatedIds: p.relatedIds,
      });
      if (!r.ok) throw new Error(r.error || "No se pudo guardar el stock");
      notify("ok", `Stock de "${p.name}" actualizado`);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      void load();
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingId(null);
    }
  };

  const reset = (productId: string) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const rows = React.useMemo(() => {
    let list = products ?? [];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
      );
    }
    if (filter === "bajo") {
      list = list.filter(
        (p) => stockLevel(totalStockOf(p.stockBySize)) === "low",
      );
    } else if (filter === "agotados") {
      list = list.filter(
        (p) => stockLevel(totalStockOf(p.stockBySize)) === "out",
      );
    }
    return list;
  }, [products, query, filter]);

  const summary = React.useMemo(() => {
    const list = products ?? [];
    const units = list.reduce((acc, p) => acc + totalStockOf(p.stockBySize), 0);
    const low = list.filter(
      (p) => stockLevel(totalStockOf(p.stockBySize)) === "low",
    ).length;
    const out = list.filter(
      (p) => stockLevel(totalStockOf(p.stockBySize)) === "out",
    ).length;
    return { units, low, out };
  }, [products]);

  if (products === null && !error) {
    return (
      <div className="h-72 animate-pulse rounded-2xl border border-black/5 bg-white" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
        <p className="font-bold">No se pudo cargar el inventario</p>
        <p className="mt-1 opacity-80">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {toast ? (
        <div
          role="status"
          className={cx(
            "fixed right-6 top-20 z-50 rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl",
            toast.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900",
          )}
        >
          {toast.text}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Unidades en stock
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-zinc-900">
            {summary.units}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800/70">
            Productos con stock bajo
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold tabular-nums text-amber-900">
            <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            {summary.low}
          </p>
          <p className="mt-0.5 text-xs text-amber-800/70">
            Umbral ≤ {LOW_STOCK} unidades
          </p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800/70">
            Productos agotados
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold tabular-nums text-rose-900">
            <PackageX className="h-5 w-5" strokeWidth={2} />
            {summary.out}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-zinc-900">
              Stock por talle
            </h2>
            <p className="text-xs text-zinc-500">
              Ajustá las unidades y guardá los cambios de cada producto.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-xl border border-black/10 bg-zinc-50 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cx(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    filter === f.id
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-60">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                strokeWidth={2}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto…"
                className="w-full rounded-xl border border-black/10 bg-white py-2 pl-9 pr-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/40"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((p) => {
            const total = p.sizes.reduce((acc, s) => acc + stockOf(p, s), 0);
            const level = stockLevel(total);
            const dirty = isDirty(p.id);
            const saving = savingId === p.id;

            return (
              <div
                key={p.id}
                className={cx(
                  "rounded-2xl border p-3 transition sm:p-4",
                  level === "out"
                    ? "border-rose-100 bg-rose-50/40"
                    : level === "low"
                      ? "border-amber-100 bg-amber-50/40"
                      : "border-black/5 bg-white",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                      <Image
                        src={p.imageSrc || "/tatanLogo.png"}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {p.name}
                      </p>
                      <p className="font-mono text-[11px] text-zinc-400">
                        {p.id} · {p.sizeGroup === "bebe" ? "Bebé" : "Niños"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Total
                      </p>
                      <p
                        className={cx(
                          "text-sm font-extrabold tabular-nums",
                          level === "out"
                            ? "text-rose-600"
                            : level === "low"
                              ? "text-amber-600"
                              : "text-zinc-900",
                        )}
                      >
                        {total} u.
                      </p>
                    </div>
                    {level === "out" ? (
                      <span className="rounded-full bg-rose-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                        Agotado
                      </span>
                    ) : level === "low" ? (
                      <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                        Stock bajo
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                        OK
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-end gap-2">
                  {p.sizes.length === 0 ? (
                    <p className="text-xs italic text-zinc-400">
                      Sin talles configurados.
                    </p>
                  ) : (
                    p.sizes.map((size) => {
                      const value = stockOf(p, size);
                      const changed = edits[p.id]?.[size] !== undefined;
                      return (
                        <label
                          key={size}
                          className={cx(
                            "flex w-20 flex-col gap-1 rounded-xl border px-2 py-1.5",
                            changed
                              ? "border-tatan-primario4 bg-tatan-primario1/30"
                              : "border-black/10 bg-white",
                          )}
                        >
                          <span className="text-center text-[10px] font-bold text-zinc-500">
                            {size}
                          </span>
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={value}
                            onChange={(e) =>
                              setSizeStock(
                                p.id,
                                size,
                                Math.max(0, Number(e.target.value) || 0),
                              )
                            }
                            className="w-full rounded-lg border border-black/10 bg-white px-1 py-1 text-center text-sm font-bold tabular-nums text-zinc-900 outline-none transition focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/40"
                          />
                        </label>
                      );
                    })
                  )}
                </div>

                {dirty ? (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => reset(p.id)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                    >
                      <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={() => void save(p)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-[#FCD1B1] px-3 py-1.5 text-xs font-bold text-zinc-900 shadow-sm transition hover:bg-[#FCD1B1]/90 disabled:opacity-60"
                    >
                      <Save className="h-3.5 w-3.5" strokeWidth={2} />
                      {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}

          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              Sin productos que coincidan.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
