"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, Ruler, ShoppingCart, Zap } from "lucide-react";
import type { BuyOptions } from "@/lib/buy-options";
import { useBuySelection } from "./useBuySelection";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  productId: string;
  name: string;
  imageSrc: string;
  unitPrice: number;
  options: BuyOptions;
};

/** Talle, color, cantidad y botones de compra de la página de producto. */
export default function ProductBuyBox({
  productId,
  name,
  imageSrc,
  unitPrice,
  options,
}: Props) {
  const router = useRouter();
  const sel = useBuySelection(
    { productId, name, imageSrc, unitPrice },
    options,
  );
  const [qty, setQty] = useState(1);
  const max = sel.size ? sel.remaining(sel.size) : 0;
  const needSize = sel.status === "need-size";
  // Igual que en la card: los talles sin stock no se muestran
  const sizes = options.sizes.filter((s) => s.stock > 0);
  const quantity = Math.max(1, Math.min(qty, max || 1));

  return (
    <>
      {sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-bold text-zinc-800">
              Talle
              {needSize && (
                <span className="ml-2 text-xs font-bold text-rose-500" role="alert">
                  Elegí un talle
                </span>
              )}
            </span>
            <span className="text-xs font-semibold text-tatan-secundario2 inline-flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" strokeWidth={2.2} />
              {sel.size
                ? max > 0
                  ? max <= 3
                    ? `¡Quedan ${max}!`
                    : "Hay stock"
                  : "Ya tenés todo el stock en el carrito"
                : "Elegí tu talle"}
            </span>
          </div>
          <div
            className={cx(
              "grid grid-cols-4 sm:grid-cols-7 gap-2",
              needSize && "quick-shake",
            )}
            role="radiogroup"
            aria-label="Talle"
          >
            {sizes.map((s) => {
              const out = false;
              const active = sel.size === s.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={out}
                  onClick={() => {
                    sel.chooseSize(s.label);
                    setQty(1);
                  }}
                  title={out ? "Sin stock" : undefined}
                  className={cx(
                    "py-2.5 rounded-xl text-sm font-bold border transition-all",
                    active
                      ? "bg-tatan-primario4 text-zinc-800 border-tatan-primario4 shadow-md"
                      : out
                        ? "bg-white/40 border-zinc-200 text-zinc-300 line-through cursor-not-allowed"
                        : cx(
                            "bg-white/70 border-tatan-secundario1/40 text-zinc-700 hover:border-tatan-primario4/60",
                            needSize && "border-rose-300",
                          ),
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {options.colors.length > 0 && (
        <div>
          <span className="text-sm font-bold text-zinc-800 block mb-2.5">
            Color
          </span>
          <div
            className="flex items-center gap-3 flex-wrap"
            role="radiogroup"
            aria-label="Color"
          >
            {options.colors.map((c, i) => {
              const active = sel.colorIdx === i;
              return (
                <button
                  key={`${c.name}-${i}`}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => sel.setColorIdx(i)}
                  className={cx(
                    "flex items-center gap-2 rounded-2xl px-3 py-2 border transition-all",
                    active
                      ? "border-tatan-primario4 bg-white shadow-sm"
                      : "border-transparent bg-white/50 hover:bg-white",
                  )}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-zinc-200 shadow-inner"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs font-semibold text-zinc-700">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!sel.soldOut && (
      <div>
        <span className="text-sm font-bold text-zinc-800 block mb-2.5">
          Cantidad
        </span>
        <div className="inline-flex items-center rounded-2xl border border-tatan-secundario1/40 bg-white/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Restar uno"
            className="px-4 py-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-tatan-primario1/40 transition-colors disabled:text-zinc-300 disabled:hover:bg-transparent"
          >
            <Minus className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <span className="px-4 py-2.5 min-w-12 text-center text-sm font-bold tabular-nums text-zinc-800 border-x border-tatan-secundario1/40">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            disabled={!sel.size || quantity >= max}
            aria-label="Sumar uno"
            className="px-4 py-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-tatan-primario1/40 transition-colors disabled:text-zinc-300 disabled:hover:bg-transparent"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            if (sel.add(quantity)) setQty(1);
          }}
          disabled={sel.soldOut}
          className={cx(
            "font-bold px-6 py-3.5 rounded-2xl text-base flex-1 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
            sel.soldOut
              ? "border-2 border-tatan-secundario1 text-zinc-400 cursor-not-allowed"
              : sel.status === "added"
                ? "bg-tatan-acento-verde text-white shadow-md"
                : "btn-primary",
          )}
          aria-live="polite"
        >
          {sel.soldOut ? (
            "Sin stock"
          ) : sel.status === "added" ? (
            <>
              <Check className="w-5 h-5" strokeWidth={3} />
              ¡Agregado!
            </>
          ) : sel.status === "no-stock" ? (
            "No queda más stock de ese talle"
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" strokeWidth={2} />
              Agregar al carrito
            </>
          )}
        </button>
        {!sel.soldOut && (
          <button
            type="button"
            onClick={() => {
              if (sel.add(quantity)) router.push("/cart");
            }}
            className="px-6 py-3.5 rounded-2xl text-base font-bold border-2 border-tatan-primario4 bg-tatan-primario4/10 text-zinc-700 hover:bg-tatan-primario4/20 transition-colors flex-1 inline-flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" strokeWidth={2.2} />
            Comprar ahora
          </button>
        )}
      </div>
    </>
  );
}
