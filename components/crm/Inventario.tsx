"use client";

import Image from "next/image";
import * as React from "react";
import { Check, ChevronDown, Minus, Plus, RotateCcw, Search } from "lucide-react";
import { apiProductSave, apiProducts, type Product } from "@/lib/tatan-api";
import { matchesProduct } from "@/lib/product-search";
import { LOW_STOCK, stockLevel, totalStockOf, type StockLevel } from "./format";
import { colorKey, hasColorStock, totalsBySize, type StockByColor } from "@/lib/stock";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type Filter = "todos" | "bajo" | "agotados";

const LEVEL_ORDER: Record<StockLevel, number> = { out: 0, low: 1, ok: 2 };

/** Modelos del producto (nombres con los que se guarda su stock). */
function modelsOf(p: Product): string[] {
  return p.colorVariants.map((v) => colorKey(v.name));
}

/** Clave de una celda de stock: modelo ("" = sin modelo) + talle. */
const cellKey = (model: string, size: string) => `${model}\u0001${size}`;

/** Stock guardado de un modelo+talle. */
function savedStock(p: Product, model: string, size: string): number {
  if (!model) return p.stockBySize[size] ?? 0;
  if (hasColorStock(p.stockByColor)) return p.stockByColor[model]?.[size] ?? 0;
  // Cargado antes del stock por modelo: el total queda en el primer modelo
  return model === modelsOf(p)[0] ? (p.stockBySize[size] ?? 0) : 0;
}

/** Guarda el producto entero con el stock nuevo (la API reemplaza el registro). */
function saveStock(
  p: Product,
  stockBySize: Record<string, number>,
  stockByColor?: StockByColor,
) {
  return apiProductSave({
    id: p.id,
    name: p.name,
    imageSrc: p.imageSrc,
    category: p.category,
    slug: p.slug,
    tagline: p.tagline,
    sizeGroup: p.sizeGroup,
    sizes: p.sizes,
    stockBySize,
    stockByColor,
    colorHex: p.colorHex,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    // Se reenvían tal cual para no borrar el precio por mayor al ajustar stock
    wholesalePrice: p.wholesalePrice ?? null,
    wholesaleMinQty: p.wholesaleMinQty ?? null,
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
}

function SizeStepper({
  size,
  value,
  changed,
  onChange,
  label,
}: {
  size: string;
  value: number;
  changed: boolean;
  onChange: (next: number) => void;
  /** Para lectores de pantalla (por defecto "talle X") */
  label?: string;
}) {
  const what = label ?? `talle ${size}`;
  return (
    <div
      className={cx(
        "flex items-center rounded-xl border transition",
        changed
          ? "border-tatan-primario4 bg-tatan-primario1/40"
          : value === 0
            ? "border-rose-100 bg-rose-50/60"
            : "border-black/10 bg-white",
      )}
    >
      <span className="min-w-9 pl-2.5 pr-1 text-xs font-bold text-zinc-600">
        {size}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        aria-label={`Restar uno al ${what}`}
        className="flex h-8 w-7 items-center justify-center text-zinc-400 transition hover:text-zinc-900 disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={`Stock del ${what}`}
        className={cx(
          "w-8 bg-transparent text-center text-sm font-extrabold tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          value === 0 && !changed ? "text-rose-600" : "text-zinc-900",
        )}
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`Sumar uno al ${what}`}
        className="flex h-8 w-7 items-center justify-center text-zinc-400 transition hover:text-zinc-900"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function Inventario() {
  const [products, setProducts] = React.useState<Product[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("todos");
  const [edits, setEdits] = React.useState<
    Record<string, Record<string, number>>
  >({});
  const [saving, setSaving] = React.useState(false);
  // Acordeón: artículos abiertos y, de cada uno, el color abierto
  const [openProducts, setOpenProducts] = React.useState<Set<string>>(new Set());
  const [openColors, setOpenColors] = React.useState<Record<string, string | null>>({});
  const toggleProduct = (id: string) =>
    setOpenProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleColor = (id: string, model: string) =>
    setOpenColors((prev) => ({ ...prev, [id]: prev[id] === model ? null : model }));
  const [notice, setNotice] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const noticeTimer = React.useRef<number | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setNotice({ type, text });
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3500);
  };

  const load = React.useCallback(async () => {
    try {
      const list = await apiProducts();
      setProducts(list);
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

  const stockOf = (p: Product, model: string, size: string) =>
    edits[p.id]?.[cellKey(model, size)] ?? savedStock(p, model, size);

  const totalOf = (p: Product) => {
    const models = modelsOf(p);
    return (models.length ? models : [""]).reduce(
      (acc, m) => acc + p.sizes.reduce((a, s) => a + stockOf(p, m, s), 0),
      0,
    );
  };

  const setCellStock = (p: Product, model: string, size: string, value: number) => {
    const key = cellKey(model, size);
    setEdits((prev) => {
      const forProduct = { ...(prev[p.id] ?? {}) };
      // Si vuelve al valor original deja de contar como cambio
      if (value === savedStock(p, model, size)) delete forProduct[key];
      else forProduct[key] = value;
      const next = { ...prev };
      if (Object.keys(forProduct).length) next[p.id] = forProduct;
      else delete next[p.id];
      return next;
    });
  };

  const changedIds = Object.keys(edits);

  const saveAll = async () => {
    if (!products || !changedIds.length) return;
    setSaving(true);
    const targets = products.filter((p) => edits[p.id]);
    const results = await Promise.allSettled(
      targets.map(async (p) => {
        const value = (m: string, s: string) =>
          Math.max(0, Math.floor(stockOf(p, m, s)) || 0);
        const models = modelsOf(p);
        let r;
        if (models.length) {
          // Con modelos se manda el stock de todos (modelo × talle)
          const byColor: StockByColor = Object.fromEntries(
            models.map((m) => [m, Object.fromEntries(p.sizes.map((s) => [s, value(m, s)]))]),
          );
          r = await saveStock(p, totalsBySize(byColor, p.sizes), byColor);
        } else {
          const merged: Record<string, number> = { ...p.stockBySize };
          for (const s of p.sizes) merged[s] = value("", s);
          r = await saveStock(p, merged);
        }
        if (!r.ok) throw new Error(r.error || `No se pudo guardar "${p.name}"`);
        return p.id;
      }),
    );
    const savedIds = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = results.length - savedIds.length;

    // Se descartan solo los cambios que se guardaron; los fallidos quedan
    setEdits((prev) => {
      const next = { ...prev };
      for (const id of savedIds) delete next[id];
      return next;
    });
    await load();
    setSaving(false);

    if (failed) {
      notify(
        "err",
        `No se pudieron guardar ${failed} ${failed === 1 ? "producto" : "productos"}. Probá de nuevo.`,
      );
    } else {
      notify(
        "ok",
        `Stock guardado (${savedIds.length} ${savedIds.length === 1 ? "producto" : "productos"})`,
      );
    }
  };

  const list = React.useMemo(() => products ?? [], [products]);
  const levelOf = (p: Product) => stockLevel(totalStockOf(p.stockBySize));
  const counts = {
    todos: list.length,
    bajo: list.filter((p) => levelOf(p) === "low").length,
    agotados: list.filter((p) => levelOf(p) === "out").length,
  };
  const units = list.reduce((acc, p) => acc + totalStockOf(p.stockBySize), 0);

  const q = query.trim().toLowerCase();
  const rows = list
    .filter((p) =>
      filter === "bajo"
        ? levelOf(p) === "low"
        : filter === "agotados"
          ? levelOf(p) === "out"
          : true,
    )
    .filter((p) => matchesProduct(p, q))
    // Lo que necesita reposición primero
    .sort(
      (a, b) =>
        LEVEL_ORDER[levelOf(a)] - LEVEL_ORDER[levelOf(b)] ||
        a.name.localeCompare(b.name),
    );

  if (products === null && !error) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-20 animate-pulse rounded-2xl bg-white/70" />
        <div className="h-32 animate-pulse rounded-2xl bg-white/70" />
        <div className="h-32 animate-pulse rounded-2xl bg-white/70" />
      </div>
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

  const tabs: Array<{ id: Filter; label: string; count: number; tone: string }> = [
    { id: "todos", label: "Todos", count: counts.todos, tone: "text-zinc-900" },
    { id: "bajo", label: "Stock bajo", count: counts.bajo, tone: "text-amber-700" },
    { id: "agotados", label: "Agotados", count: counts.agotados, tone: "text-rose-600" },
  ];

  return (
    <div className={cx("flex flex-col gap-4", changedIds.length > 0 && "pb-24")}>
      {/* Resumen que también filtra */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            aria-pressed={filter === t.id}
            className={cx(
              "rounded-2xl border p-3 text-left transition sm:p-4",
              filter === t.id
                ? "border-tatan-primario4 bg-white shadow-sm ring-2 ring-tatan-primario1"
                : "border-black/5 bg-white/70 hover:bg-white",
            )}
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              {t.label}
            </span>
            <span
              className={cx(
                "mt-1 block text-2xl font-extrabold tabular-nums",
                t.count === 0 && t.id !== "todos" ? "text-zinc-300" : t.tone,
              )}
            >
              {t.count}
            </span>
            {t.id === "todos" ? (
              <span className="block text-[11px] text-zinc-500">
                {units} unidades
              </span>
            ) : t.id === "bajo" ? (
              <span className="block text-[11px] text-zinc-500">
                {LOW_STOCK} u. o menos
              </span>
            ) : (
              <span className="block text-[11px] text-zinc-500">sin stock</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          strokeWidth={2}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o Nº de artículo"
          aria-label="Buscar producto"
          className="block w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-tatan-primario4 focus:outline-none focus:ring-2 focus:ring-tatan-primario1/60"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-12 text-center">
          <p className="font-semibold text-zinc-800">
            {filter === "todos" && !q
              ? "Todavía no hay productos"
              : filter !== "todos" && !q
                ? "¡Nada por reponer!"
                : "Sin resultados"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {filter !== "todos" && !q
              ? "Todos los productos tienen stock suficiente."
              : "Probá con otra búsqueda."}
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_3px_rgba(185,168,155,0.15)]">
          {rows.map((p) => {
            const total = totalOf(p);
            const level = stockLevel(total);
            const changed = Boolean(edits[p.id]);
            const open = openProducts.has(p.id);
            const colorTotal = (model: string) =>
              p.sizes.reduce((a, size) => a + stockOf(p, model, size), 0);
            return (
              <li
                key={p.id}
                className={cx(
                  "border-b border-black/5 last:border-b-0",
                  changed && "bg-tatan-primario1/10",
                )}
              >
                {/* Nivel 1: el artículo */}
                <button
                  type="button"
                  onClick={() => toggleProduct(p.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-50/80 md:px-5"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-[#FEFDF8]">
                    <Image
                      src={p.imageSrc || "/tatanLogo.png"}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {p.name}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      {p.slug ? (
                        <span className="font-mono text-[11px] text-zinc-400">
                          Art. {p.slug}
                        </span>
                      ) : null}
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                          level === "out"
                            ? "bg-rose-50 text-rose-700"
                            : level === "low"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-emerald-50 text-emerald-800",
                        )}
                      >
                        {level === "out" ? "Agotado" : `${total} u.`}
                      </span>
                      {p.colorVariants.length ? (
                        <span className="text-zinc-500">
                          {p.colorVariants.length}{" "}
                          {p.colorVariants.length === 1 ? "color" : "colores"}
                        </span>
                      ) : null}
                      {changed ? (
                        <span className="font-semibold text-tatan-secundario2">
                          Sin guardar
                        </span>
                      ) : null}
                    </p>
                  </div>
                  {/* Puntitos de los colores */}
                  <span className="hidden shrink-0 items-center -space-x-1 sm:flex" aria-hidden="true">
                    {p.colorVariants.slice(0, 6).map((v, vi) => (
                      <span
                        key={vi}
                        className="h-4 w-4 rounded-full border-2 border-white"
                        style={{ backgroundColor: v.hex }}
                      />
                    ))}
                  </span>
                  <ChevronDown
                    className={cx(
                      "h-5 w-5 shrink-0 text-zinc-400 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open ? (
                  <div className="px-4 pb-4 md:px-5 md:pl-[5.25rem]">
                    {p.sizes.length === 0 ? (
                      <p className="text-xs italic text-zinc-400">
                        Sin talles. Agregalos desde Productos.
                      </p>
                    ) : p.colorVariants.length === 0 ? (
                      // Sin colores: directamente el stock por talle
                      <div>
                        <p className="mb-2 text-xs text-zinc-500">
                          Sin colores cargados. Stock por talle:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {p.sizes.map((size) => (
                            <SizeStepper
                              key={size}
                              size={size}
                              value={stockOf(p, "", size)}
                              changed={edits[p.id]?.[cellKey("", size)] !== undefined}
                              onChange={(v) => setCellStock(p, "", size, v)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Nivel 2: los colores; nivel 3: los talles de ese color
                      <div className="flex flex-col gap-2">
                        {!hasColorStock(p.stockByColor) ? (
                          <p className="text-[11px] text-amber-800">
                            El stock todavía no está repartido por color: quedó en el primero.
                          </p>
                        ) : null}
                        {p.colorVariants.map((v, vi) => {
                          const model = colorKey(v.name);
                          const colorOpen = openColors[p.id] === model;
                          const ct = colorTotal(model);
                          const colorChanged = p.sizes.some(
                            (size) => edits[p.id]?.[cellKey(model, size)] !== undefined,
                          );
                          return (
                            <div
                              key={`${model}-${vi}`}
                              className={cx(
                                "overflow-hidden rounded-xl border",
                                colorOpen ? "border-tatan-primario4/60 bg-white" : "border-black/10 bg-zinc-50/60",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => toggleColor(p.id, model)}
                                aria-expanded={colorOpen}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white"
                              >
                                <span
                                  className="h-6 w-6 shrink-0 rounded-full border border-black/10 bg-cover bg-center"
                                  style={{
                                    backgroundColor: v.hex,
                                    backgroundImage: v.imageSrc ? `url("${v.imageSrc}")` : undefined,
                                  }}
                                  aria-hidden="true"
                                />
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800">
                                  {v.name}
                                  {v.sku ? (
                                    <span className="ml-2 font-mono text-[11px] font-normal text-zinc-400">
                                      Art. {v.sku}
                                    </span>
                                  ) : null}
                                </span>
                                {colorChanged ? (
                                  <span className="text-[11px] font-semibold text-tatan-secundario2">
                                    Sin guardar
                                  </span>
                                ) : null}
                                <span
                                  className={cx(
                                    "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                                    ct === 0 ? "bg-rose-50 text-rose-700" : "bg-zinc-100 text-zinc-700",
                                  )}
                                >
                                  {ct === 0 ? "Agotado" : `${ct} u.`}
                                </span>
                                <ChevronDown
                                  className={cx(
                                    "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
                                    colorOpen && "rotate-180",
                                  )}
                                />
                              </button>
                              {colorOpen ? (
                                <div className="flex flex-wrap gap-2 border-t border-black/5 px-3 py-3">
                                  {p.sizes.map((size) => (
                                    <SizeStepper
                                      key={size}
                                      size={size}
                                      value={stockOf(p, model, size)}
                                      changed={edits[p.id]?.[cellKey(model, size)] !== undefined}
                                      onChange={(n) => setCellStock(p, model, size, n)}
                                      label={`${v.name} talle ${size}`}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {notice ? (
        <div
          role="status"
          className={cx(
            "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl lg:left-[calc(50%+9rem)]",
            notice.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900",
          )}
        >
          {notice.type === "ok" ? <Check className="h-4 w-4" /> : null}
          {notice.text}
        </div>
      ) : null}

      {/* Un solo guardar para todos los cambios */}
      {changedIds.length ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur lg:left-72">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <p className="mr-auto text-sm text-zinc-700">
              <span className="font-bold">{changedIds.length}</span>{" "}
              {changedIds.length === 1 ? "producto con cambios" : "productos con cambios"}
            </p>
            <button
              type="button"
              onClick={() => setEdits({})}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={() => void saveAll()}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-xl bg-tatan-primario1 px-5 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-tatan-primario4 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
