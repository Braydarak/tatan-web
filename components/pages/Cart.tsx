"use client";

import ProductPhoto from "@/components/ui/ProductPhoto";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import CustomButton from "@/components/ui/CustomButton";
import ProductCard from "@/components/ui/productCard/ProductCard";
import { apiToCardProps } from "@/lib/card-props";
import { pickRelated } from "@/lib/related";
import { useEffect, useState } from "react";
import { useStoreSettings } from "@/components/StoreSettingsContext";
import WholesaleLine from "@/components/cart/WholesaleLine";
import { cartTotals, effectiveUnitPrice } from "@/lib/wholesale";
import { apiCombos, type Product as ApiProduct } from "@/lib/tatan-api";
import {
  clearCart,
  formatArs,
  removeFromCart,
  setQuantity,
  useCart,
} from "@/lib/cart";

export default function Cart({
  catalog = [],
  quickAdd = true,
}: {
  catalog?: ApiProduct[];
  quickAdd?: boolean;
}) {
  const { items, count } = useCart();
  const { wholesaleMode } = useStoreSettings();
  const { subtotal, saved } = cartTotals(items, wholesaleMode);
  // Recomendados según lo que hay en el carrito (relacionados del CRM,
  // misma categoría, resto). Sin carrito: lo que hay en la tienda.
  const cartIds = Array.from(new Set(items.map((i) => i.productId)));
  const idsKey = cartIds.slice().sort().join(",");
  // "La gente también eligió combinar con": sale de pedidos pagados
  const [combos, setCombos] = useState<{ key: string; ids: string[] }>({
    key: "",
    ids: [],
  });
  useEffect(() => {
    if (!idsKey) return;
    let alive = true;
    apiCombos(idsKey.split(","), 4).then((ids) => {
      if (alive) setCombos({ key: idsKey, ids });
    });
    return () => {
      alive = false;
    };
  }, [idsKey]);
  const ranked = combos.key === idsKey ? combos.ids : [];
  const suggestions = pickRelated(catalog, cartIds, 4, ranked);
  const boughtTogether =
    items.length > 0 && suggestions.some((p) => ranked.includes(p.id));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 relative z-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-800 sm:text-3xl">
          Tu carrito
        </h1>
        <p className="text-sm text-zinc-500">
          Revisá tus productos antes de pagar.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 paper-card rounded-3xl px-6 py-14 flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-tatan-primario1/70 flex items-center justify-center">
            <ShoppingBag
              className="w-9 h-9 text-tatan-secundario2"
              strokeWidth={1.8}
            />
          </div>
          <div>
            <p className="text-lg font-extrabold text-zinc-800">
              Todavía no agregaste nada
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Elegí talle y color desde cualquier producto y sumalo acá.
            </p>
          </div>
          <Link
            href="/productos"
            className="btn-primary rounded-2xl px-6 py-3 text-sm font-bold"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section
            className="paper-card rounded-3xl p-5 sm:p-6"
            aria-label="Productos del carrito"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-zinc-800">
                {count} {count === 1 ? "producto" : "productos"}
              </h2>
              <Link
                href="/productos"
                className="text-sm font-semibold text-zinc-700 underline decoration-tatan-primario4 underline-offset-4 hover:opacity-80"
              >
                Seguir comprando
              </Link>
            </div>

            <ul className="mt-4 divide-y divide-tatan-secundario1/40">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <Link
                      href={`/product/${item.productId}`}
                      className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-tatan-secundario1/50"
                      style={{ backgroundColor: item.colorHex ?? "#fff" }}
                    >
                      <ProductPhoto compact
                        src={item.imageSrc}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1 mix-blend-multiply"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.productId}`}
                        className="text-sm font-bold text-zinc-800 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-600">
                        <span className="inline-flex items-center rounded-full border border-tatan-secundario1/60 bg-white px-2.5 py-1">
                          Talle {item.size}
                        </span>
                        {item.colorName && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-tatan-secundario1/60 bg-white px-2.5 py-1">
                            <span
                              className="w-3 h-3 rounded-full border border-zinc-300"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            {item.colorName}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm font-semibold tabular-nums text-zinc-700">
                        {(() => {
                          const eff = effectiveUnitPrice(item, items, wholesaleMode);
                          return eff.wholesale ? (
                            <>
                              {formatArs(eff.price)}
                              <span className="ml-1.5 text-xs text-zinc-400 line-through">
                                {formatArs(item.unitPrice)}
                              </span>
                            </>
                          ) : (
                            formatArs(item.unitPrice)
                          );
                        })()}
                        <span className="ml-1 text-xs text-zinc-500">
                          / unidad
                        </span>
                      </div>
                      <WholesaleLine
                        item={item}
                        items={items}
                        mode={wholesaleMode}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="inline-flex items-center rounded-xl border border-tatan-secundario1/60 bg-white p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-tatan-primario1/40"
                        aria-label="Restar uno"
                      >
                        <Minus className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                      <div className="min-w-10 px-2 text-center text-sm font-bold tabular-nums text-zinc-800">
                        {item.quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-tatan-primario1/40 disabled:text-zinc-300 disabled:hover:bg-transparent"
                        aria-label="Sumar uno"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold tabular-nums text-zinc-800">
                        {formatArs(
                          effectiveUnitPrice(item, items, wholesaleMode).price *
                            item.quantity,
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Vaciar el carrito?")) clearCart();
              }}
              className="mt-2 text-xs font-semibold text-zinc-400 hover:text-zinc-600"
            >
              Vaciar carrito
            </button>
          </section>

          <aside className="h-fit paper-card rounded-3xl p-5 sm:p-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-bold text-zinc-800">Resumen</h2>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-600">Subtotal</span>
                <span className="font-semibold tabular-nums text-zinc-800">
                  {formatArs(subtotal + saved)}
                </span>
              </div>
              {saved > 0 && (
                <div className="flex items-center justify-between gap-3 text-emerald-700">
                  <span className="font-semibold">Ahorro por mayor</span>
                  <span className="font-bold tabular-nums">
                    -{formatArs(saved)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-600">Envío</span>
                <span className="font-semibold text-zinc-500">A calcular</span>
              </div>
              <div className="h-px w-full bg-tatan-secundario1/50" />
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-zinc-800">Total</span>
                <span className="text-xl font-black tabular-nums text-zinc-800">
                  {formatArs(subtotal)}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <CustomButton className="w-full" type="filled">
                Pagar con tarjeta
              </CustomButton>
              <CustomButton className="w-full" type="outline">
                Pagar con transferencia
              </CustomButton>
            </div>

            <div className="mt-4 rounded-xl border border-tatan-primario1 bg-tatan-primario1/15 p-3 text-xs font-semibold text-zinc-700">
              Pagos y envío todavía son de muestra. Más adelante se conecta con
              Mercado Pago y cálculo de envío.
            </div>
          </aside>
        </div>
      )}

      {suggestions.length > 0 && (
        <section className="mt-12" aria-labelledby="cart-suggestions">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-8 h-1 rounded-full bg-tatan-acento-rosa" />
                <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                  {boughtTogether
                    ? "Se compra junto"
                    : items.length > 0
                      ? "Completá tu compra"
                      : "Para empezar"}
                </span>
              </div>
              <h2
                id="cart-suggestions"
                className="text-2xl sm:text-3xl font-bold text-zinc-800"
              >
                {boughtTogether
                  ? "La gente también eligió combinar con"
                  : items.length > 0
                    ? "Productos relacionados"
                    : "Productos que te pueden gustar"}
              </h2>
            </div>
            <Link
              href="/productos"
              className="shrink-0 text-sm font-bold text-zinc-600 underline decoration-tatan-primario4 underline-offset-4 hover:text-zinc-900"
            >
              Ver todo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 justify-items-center lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={`sug-${p.id}`} {...apiToCardProps(p, { quickAdd })} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
