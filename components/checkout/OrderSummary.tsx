"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ProductPhoto from "@/components/ui/ProductPhoto";
import { useStoreSettings } from "@/components/StoreSettingsContext";
import { formatArs, type CartItem } from "@/lib/cart";
import { cartTotals, effectiveUnitPrice } from "@/lib/wholesale";
import type { ShippingQuote } from "@/lib/shipping";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/** Totales del pedido con el envío elegido (null = todavía sin elegir). */
export function useOrderTotals(items: CartItem[], quote: ShippingQuote | null) {
  const { wholesaleMode } = useStoreSettings();
  const { subtotal, saved } = cartTotals(items, wholesaleMode);
  const shipping = quote ? quote.price : null;
  return {
    /** Sin descuentos por mayor */
    gross: subtotal + saved,
    saved,
    subtotal,
    shipping,
    total: subtotal + (shipping ?? 0),
  };
}

/**
 * Resumen: productos (opcional, plegable en celular), subtotal, ahorro por
 * mayor, envío y total. `children` va abajo (botón de pagar / continuar).
 */
export default function OrderSummary({
  items,
  quote,
  showItems = false,
  shippingHint = "A calcular",
  children,
}: {
  items: CartItem[];
  quote: ShippingQuote | null;
  showItems?: boolean;
  /** Qué decir en "Envío" cuando todavía no se eligió */
  shippingHint?: string;
  children?: React.ReactNode;
}) {
  const { wholesaleMode } = useStoreSettings();
  const t = useOrderTotals(items, quote);
  const count = items.reduce((a, i) => a + i.quantity, 0);
  const [open, setOpen] = useState(false);

  return (
    // minmax(0,1fr): un nombre largo no estira la columna (se corta con …)
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {showItems && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-2 text-sm font-bold text-zinc-800 lg:pointer-events-none"
          >
            {count} {count === 1 ? "producto" : "productos"}
            <ChevronDown
              className={cx("h-4 w-4 text-zinc-500 transition lg:hidden", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          <ul className={cx("mt-3 grid grid-cols-[minmax(0,1fr)] gap-3", !open && "hidden lg:grid")}>
            {items.map((item) => {
              const eff = effectiveUnitPrice(item, items, wholesaleMode);
              return (
                <li key={item.key} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-tatan-secundario1/50">
                    <ProductPhoto
                      compact
                      framed
                      src={item.imageSrc}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain p-[6%]"
                    />
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-800 px-1 text-[10px] font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="truncate text-sm font-semibold text-zinc-800">{item.name}</p>
                    <p className="text-zinc-500">
                      Talle {item.size}
                      {item.colorName ? ` · ${item.colorName}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-800">
                    {formatArs(eff.price * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-2.5 text-sm">
        <Row label="Subtotal" value={formatArs(t.gross)} />
        {t.saved > 0 && (
          <Row
            label="Ahorro por mayor"
            value={`-${formatArs(t.saved)}`}
            className="text-emerald-700 font-semibold"
          />
        )}
        <Row
          label={quote ? `Envío · ${quote.mode === "retiro" ? "Retiro" : quote.carrier}` : "Envío"}
          value={
            t.shipping == null ? (
              <span className="font-semibold text-zinc-400">{shippingHint}</span>
            ) : t.shipping === 0 ? (
              <span className="font-bold text-emerald-700">Gratis</span>
            ) : (
              formatArs(t.shipping)
            )
          }
        />
        <div className="h-px w-full bg-tatan-secundario1/50" />
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-bold text-zinc-800">Total</span>
          <span className="text-xl font-black tabular-nums text-zinc-800">
            {formatArs(t.total)}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-center justify-between gap-3", className)}>
      <span className="text-zinc-600">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-800">{value}</span>
    </div>
  );
}
