"use client";

import Image from "next/image";
import * as React from "react";
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { apiProducts, type Product } from "@/lib/tatan-api";
import { LOW_STOCK, formatMoneyArs, totalStockOf } from "./format";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  Icon: React.ElementType;
  tone?: "neutral" | "rose" | "amber" | "green";
};

const TONES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "bg-white border-black/5 text-zinc-900",
  rose: "bg-rose-50 border-rose-100 text-rose-900",
  amber: "bg-amber-50 border-amber-100 text-amber-900",
  green: "bg-emerald-50 border-emerald-100 text-emerald-900",
};

function StatCard({
  label,
  value,
  hint,
  Icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        TONES[tone],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
          {label}
        </p>
        <Icon className="h-4 w-4 opacity-60" strokeWidth={2} />
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs opacity-70">{hint}</p> : null}
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export type DashboardProps = {
  onNavigate: (href: string) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [products, setProducts] = React.useState<Product[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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

  const stats = React.useMemo(() => {
    const list = products ?? [];
    const activeProducts = list.filter((p) => p.active);
    const unitsInStock = list.reduce(
      (acc, p) => acc + totalStockOf(p.stockBySize),
      0,
    );
    const soldTotal = list.reduce((acc, p) => acc + p.soldTotal, 0);
    const revenue = list.reduce((acc, p) => acc + p.soldTotal * p.price, 0);

    const lowStock: Array<{ product: Product; size: string; stock: number }> = [];
    for (const p of list) {
      for (const [size, stock] of Object.entries(p.stockBySize)) {
        if (stock > 0 && stock <= LOW_STOCK) {
          lowStock.push({ product: p, size, stock });
        }
      }
    }
    const outOfStock = list.filter((p) => totalStockOf(p.stockBySize) === 0);

    const topSold = [...list]
      .filter((p) => p.soldTotal > 0)
      .sort((a, b) => b.soldTotal - a.soldTotal)
      .slice(0, 5);

    return {
      total: list.length,
      activeProducts: activeProducts.length,
      unitsInStock,
      soldTotal,
      revenue,
      lowStock,
      outOfStock,
      topSold,
      maxSold: topSold[0]?.soldTotal ?? 0,
    };
  }, [products]);

  if (products === null && !error) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-black/5 bg-white"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
        <p className="font-bold">No se pudieron cargar los datos</p>
        <p className="mt-1 opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vendidos (histórico)"
          value={String(stats.soldTotal)}
          hint="Unidades registradas"
          Icon={ShoppingBag}
        />
        <StatCard
          label="Ingresos estimados"
          value={formatMoneyArs(stats.revenue)}
          hint="Vendidos × precio actual"
          Icon={DollarSign}
          tone="green"
        />
        <StatCard
          label="Unidades en stock"
          value={String(stats.unitsInStock)}
          hint={`${stats.activeProducts} productos activos`}
          Icon={Boxes}
        />
        <StatCard
          label="Alertas de stock"
          value={String(stats.lowStock.length + stats.outOfStock.length)}
          hint={`${stats.outOfStock.length} agotados · ${stats.lowStock.length} bajos`}
          Icon={AlertTriangle}
          tone={stats.outOfStock.length || stats.lowStock.length ? "amber" : "neutral"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card
            title="Más vendidos"
            action={
              <button
                type="button"
                onClick={() => onNavigate("/crm#ventas")}
                className="text-xs font-semibold text-zinc-500 underline-offset-4 transition hover:text-zinc-800 hover:underline"
              >
                Ver ventas
              </button>
            }
          >
            {stats.topSold.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">
                Todavía no hay ventas registradas.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.topSold.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                      <Image
                        src={p.imageSrc || "/tatanLogo.png"}
                        alt={p.name}
                        fill
                        sizes="40px"
                        className="object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-zinc-800">
                          {p.name}
                        </span>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-500">
                          {p.soldTotal} u.
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-tatan-primario4"
                          style={{
                            width: `${
                              stats.maxSold
                                ? Math.max(
                                    6,
                                    (p.soldTotal / stats.maxSold) * 100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card
            title="Reponer stock"
            action={
              <button
                type="button"
                onClick={() => onNavigate("/crm#inventario")}
                className="text-xs font-semibold text-zinc-500 underline-offset-4 transition hover:text-zinc-800 hover:underline"
              >
                Ver inventario
              </button>
            }
          >
            {stats.outOfStock.length === 0 && stats.lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">
                Todo el stock está en orden.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.outOfStock.map((p) => (
                  <li
                    key={`out-${p.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2"
                  >
                    <span className="truncate text-sm font-semibold text-rose-900">
                      {p.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                      Agotado
                    </span>
                  </li>
                ))}
                {stats.lowStock.map(({ product, size, stock }) => (
                  <li
                    key={`low-${product.id}-${size}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2"
                  >
                    <span className="truncate text-sm font-semibold text-amber-900">
                      {product.name}
                      <span className="ml-2 rounded-md border border-amber-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        {size}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-amber-800">
                      {stock} u.
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Productos"
          value={String(stats.total)}
          hint="Total en catálogo"
          Icon={Package}
        />
        <StatCard
          label="Rotación media"
          value={`${
            stats.unitsInStock + stats.soldTotal === 0
              ? 0
              : Math.round(
                  (stats.soldTotal / (stats.unitsInStock + stats.soldTotal)) *
                    100,
                )
          }%`}
          hint="Vendido sobre stock + vendido"
          Icon={TrendingUp}
        />
        <StatCard
          label="Ticket medio estimado"
          value={formatMoneyArs(
            stats.soldTotal === 0 ? 0 : stats.revenue / stats.soldTotal,
          )}
          hint="Ingresos / unidades vendidas"
          Icon={DollarSign}
        />
      </div>
    </div>
  );
}
