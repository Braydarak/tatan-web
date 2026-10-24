"use client";

import Image from "next/image";
import * as React from "react";
import { Search } from "lucide-react";
import { apiProducts, type Product } from "@/lib/tatan-api";
import { formatMoneyArs, totalStockOf } from "./format";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

const CATEGORY_LABEL: Record<string, string> = {
  body: "Body",
  remera: "Remera",
  pijama: "Pijama",
  set: "Set",
  pantalon: "Pantalón",
  buzo: "Buzo",
  accesorio: "Accesorio",
};

export default function Ventas() {
  const [products, setProducts] = React.useState<Product[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await apiProducts();
        if (alive) setProducts(list);
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "Error al cargar datos");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const rows = React.useMemo(() => {
    const list = [...(products ?? [])].sort((a, b) => b.soldTotal - a.soldTotal);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  const totals = React.useMemo(() => {
    const list = products ?? [];
    const sold = list.reduce((acc, p) => acc + p.soldTotal, 0);
    const revenue = list.reduce((acc, p) => acc + p.soldTotal * p.price, 0);
    return { sold, revenue };
  }, [products]);

  if (products === null && !error) {
    return (
      <div className="h-72 animate-pulse rounded-2xl border border-black/5 bg-white" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
        <p className="font-bold">No se pudieron cargar las ventas</p>
        <p className="mt-1 opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Unidades vendidas
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-zinc-900">
            {totals.sold}
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Ingresos estimados
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-zinc-900">
            {formatMoneyArs(totals.revenue)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-zinc-900">
              Ventas por producto
            </h2>
            <p className="text-xs text-zinc-500">
              {rows.length} productos · el detalle de pedidos se activará cuando
              el checkout esté en línea.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
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

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs font-semibold text-zinc-500">
                <th className="px-3 py-3 font-medium">Producto</th>
                <th className="px-3 py-3 font-medium">Categoría</th>
                <th className="px-3 py-3 text-right font-medium">Vendidos</th>
                <th className="px-3 py-3 text-right font-medium">Precio</th>
                <th className="px-3 py-3 text-right font-medium">
                  Ingresos est.
                </th>
                <th className="px-3 py-3 text-right font-medium">Rotación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const stock = totalStockOf(p.stockBySize);
                const rotation =
                  stock + p.soldTotal === 0
                    ? 0
                    : Math.round(
                        (p.soldTotal / (stock + p.soldTotal)) * 100,
                      );
                return (
                  <tr
                    key={p.id}
                    className="border-b border-black/5 transition hover:bg-zinc-50/60"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                          <Image
                            src={p.imageSrc || "/tatanLogo.png"}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {p.name}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-400">
                            {p.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center rounded-xl border border-tatan-secundario1/60 bg-tatan-primario1/50 px-2.5 py-1 text-[11px] font-bold text-zinc-800">
                        {CATEGORY_LABEL[p.category] ?? p.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-bold tabular-nums text-zinc-900">
                      {p.soldTotal}
                    </td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-zinc-700">
                      {formatMoneyArs(p.price)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-zinc-900">
                      {formatMoneyArs(p.soldTotal * p.price)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                          rotation >= 60
                            ? "bg-emerald-50 text-emerald-700"
                            : rotation > 0
                              ? "bg-zinc-100 text-zinc-600"
                              : "bg-zinc-50 text-zinc-400",
                        )}
                      >
                        {rotation}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-10 text-center text-sm text-zinc-400"
                  >
                    Sin resultados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
