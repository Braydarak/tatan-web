"use client";

import { Check, ShoppingBag } from "lucide-react";
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

/** Talle + color + "Agregar" dentro de la card del producto. */
export default function CardQuickAdd({
  productId,
  name,
  imageSrc,
  unitPrice,
  options,
}: Props) {
  const sel = useBuySelection(
    { productId, name, imageSrc, unitPrice },
    options,
  );
  const needSize = sel.status === "need-size";
  // Solo se muestran los talles que hay (sin stock no aparecen)
  const sizes = options.sizes.filter((s) => s.stock > 0);

  return (
    <div className="mt-2 flex flex-1 flex-col">
      {sizes.length > 0 && (
        <div>
          {needSize && (
            <p className="mb-1 text-[11px] font-bold text-rose-500" role="alert">
              Elegí un talle
            </p>
          )}
          <div
            className={cx(
              "flex flex-wrap gap-1",
              needSize && "quick-shake",
            )}
            role="radiogroup"
            aria-label={`Talle de ${name}`}
          >
            {sizes.map((s) => {
              const active = sel.size === s.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => sel.chooseSize(s.label)}
                  className={cx(
                    "h-6 sm:h-7 min-w-7 sm:min-w-8 rounded-lg px-1.5 text-[11px] font-bold border transition-all",
                    active
                      ? "bg-tatan-primario4 border-tatan-primario4 text-zinc-800 shadow-sm scale-105"
                      : cx(
                          "bg-white border-tatan-secundario1/70 text-zinc-700 hover:border-tatan-primario4",
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
        <div className="mt-2 flex items-center gap-2 min-w-0">
          <div
            className="flex shrink-0 items-center gap-1.5"
            role="radiogroup"
            aria-label={`Color de ${name}`}
          >
            {options.colors.map((c, i) => {
              const active = sel.colorIdx === i;
              return (
                <button
                  key={`${c.hex}-${i}`}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => sel.setColorIdx(i)}
                  className={cx(
                    "w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full border border-zinc-300/80 shadow-inner transition-all",
                    active
                      ? "ring-2 ring-tatan-primario4 ring-offset-1 ring-offset-white scale-110"
                      : "hover:scale-110",
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
          {sel.color && (
            <span className="truncate text-[11px] font-semibold text-zinc-500">
              {sel.color.name}
            </span>
          )}
        </div>
      )}

      <span className="block h-2.5 shrink-0" />
      <button
        type="button"
        onClick={() => sel.add(1)}
        disabled={sel.soldOut}
        className={cx(
          "mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl px-2 py-2 text-[13px] sm:text-sm font-bold transition-all active:scale-[0.97]",
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
            <Check className="w-4 h-4" strokeWidth={3} />
            ¡Agregado!
          </>
        ) : sel.status === "no-stock" ? (
          "No queda más stock"
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" strokeWidth={2.2} />
            <span>
              Agregar<span className="hidden sm:inline"> al carrito</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
