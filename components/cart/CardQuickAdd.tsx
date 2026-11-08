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
  /** Número de artículo del producto */
  sku?: string;
  /** Avisa la foto del modelo elegido (para mostrarla en la card) */
  onModelChange?: (imageSrc?: string) => void;
};

/** Talle + color + "Agregar" dentro de la card del producto. */
export default function CardQuickAdd({
  productId,
  name,
  imageSrc,
  unitPrice,
  options,
  sku,
  onModelChange,
}: Props) {
  const sel = useBuySelection(
    { productId, name, imageSrc, unitPrice, sku },
    options,
  );
  // "Modelo" si son estampados (tienen foto o número de artículo); si no, "Color"
  const isModels = options.colors.some((c) => c.imageSrc || c.sku);
  const needSize = sel.status === "need-size";
  // Solo se muestran los talles que hay (sin stock no aparecen); con stock por
  // color, los que no hay en el color elegido aparecen tachados
  const sizes = sel.sizes;

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
              const out = s.stock <= 0;
              return (
                <button
                  key={s.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={out}
                  title={out ? "Sin stock en este color" : s.hint}
                  onClick={() => sel.chooseSize(s.label)}
                  className={cx(
                    "h-6 sm:h-7 min-w-7 sm:min-w-8 rounded-lg px-1.5 text-[11px] font-bold border transition-all",
                    active
                      ? "bg-tatan-primario4 border-tatan-primario4 text-zinc-800 shadow-sm scale-105"
                      : out
                        ? "bg-white/40 border-zinc-200 text-zinc-300 line-through cursor-not-allowed"
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
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          {sel.status === "need-model" && (
            <p className="basis-full text-[11px] font-bold text-rose-500" role="alert">
              Elegí un {isModels ? "modelo" : "color"}
            </p>
          )}
          <div
            className={cx(
              "flex shrink-0 items-center gap-1.5",
              sel.status === "need-model" && "quick-shake",
            )}
            role="radiogroup"
            aria-label={`${isModels ? "Modelo" : "Color"} de ${name}`}
          >
            {options.colors.map((c, i) => {
              const active = sel.colorIdx === i;
              const colorOut = sel.isColorSoldOut(i);
              return (
                <button
                  key={`${c.hex}-${i}`}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={colorOut ? `${c.name} (sin stock)` : c.name}
                  title={colorOut ? `${c.name} · sin stock` : c.name}
                  disabled={colorOut}
                  onClick={() => {
                    sel.setColorIdx(i);
                    onModelChange?.(c.imageSrc);
                  }}
                  className={cx(
                    "rounded-full border border-zinc-300/80 shadow-inner transition-all bg-cover bg-center",
                    c.imageSrc ? "w-6 h-6 sm:w-7 sm:h-7" : "w-4 h-4 sm:w-[18px] sm:h-[18px]",
                    active
                      ? "ring-2 ring-tatan-primario4 ring-offset-1 ring-offset-white scale-110"
                      : colorOut
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:scale-110",
                  )}
                  style={{
                    backgroundColor: c.hex,
                    backgroundImage: c.imageSrc ? `url("${c.imageSrc}")` : undefined,
                  }}
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
