"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Store, Truck, Zap } from "lucide-react";
import type { CartItem } from "@/lib/cart";
import { formatArs } from "@/lib/cart";
import {
  daysLabel,
  listBranches,
  modeLabel,
  normalizePostalCode,
  quoteShipping,
  STORE_PICKUP,
  type Branch,
  type ShippingMode,
  type ShippingQuote,
} from "@/lib/shipping";
import {
  cartSignature,
  selectedQuote,
  setShipping,
  useShipping,
} from "@/lib/checkout-state";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

const MODE_ORDER: ShippingMode[] = ["domicilio", "sucursal", "retiro"];
const MODE_ICON = { domicilio: Truck, sucursal: MapPin, retiro: Store } as const;

/**
 * Cálculo de envío: código postal → tarifas para elegir (correo, servicio,
 * a domicilio o en sucursal) → sucursal, si corresponde.
 * Lo elegido queda guardado (lib/checkout-state) y lo usa el checkout.
 */
export default function ShippingOptions({
  items,
  compact = false,
}: {
  items: CartItem[];
  /** Versión del resumen del carrito (más chica) */
  compact?: boolean;
}) {
  const ship = useShipping();
  const sig = cartSignature(items);
  const [cp, setCp] = useState(ship.postalCode);
  const [editing, setEditing] = useState(!ship.postalCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const inputId = useId();

  const calc = async (postal: string) => {
    const norm = normalizePostalCode(postal);
    if (!norm) {
      setError("Ingresá un código postal válido (por ejemplo 1425)");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const quotes = await quoteShipping(norm, items);
      const keep = quotes.some((q) => q.id === ship.selectedId) ? ship.selectedId : null;
      setShipping({
        postalCode: norm,
        quotes,
        cartSig: sig,
        selectedId: keep,
        branch: keep ? ship.branch : null,
      });
      setCp(norm);
      setEditing(false);
      setShowAll(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos calcular el envío. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Si cambió el carrito (unidades), la cotización quedó vieja: se recalcula
  const stale = ship.quotes.length > 0 && ship.cartSig !== sig && items.length > 0;
  useEffect(() => {
    if (!stale) return;
    // En un timeout: si el carrito sigue cambiando (+ + +), cotiza una sola vez
    const t = setTimeout(() => void calc(ship.postalCode), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale, sig]);

  const quotes = ship.quotes;
  const chosen = selectedQuote(ship);
  const cheapest = quotes.filter((q) => q.mode !== "retiro").reduce<ShippingQuote | null>(
    (a, q) => (!a || q.price < a.price ? q : a),
    null,
  );
  const fastest = quotes.filter((q) => q.mode !== "retiro").reduce<ShippingQuote | null>(
    (a, q) => (!a || q.days.max < a.days.max ? q : a),
    null,
  );
  // En la versión chica se ve la más barata de cada modalidad (así siempre
  // aparece el envío a domicilio) y la elegida; el resto con "Ver todas"
  const cheapestOfMode = new Set(
    MODE_ORDER.map((m) => quotes.find((q) => q.mode === m)?.id).filter(Boolean),
  );
  const visible =
    showAll || !compact
      ? quotes
      : quotes.filter((q) => cheapestOfMode.has(q.id) || q.id === ship.selectedId);
  const hidden = quotes.length - visible.length;

  return (
    <div className="grid gap-3">
      {/* Código postal */}
      {editing || !ship.postalCode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void calc(cp);
          }}
          className="grid gap-1.5"
        >
          <label htmlFor={inputId} className="text-sm font-bold text-zinc-800">
            Calculá el envío
          </label>
          <div className="flex gap-2">
            <input
              id={inputId}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={8}
              placeholder="Código postal"
              value={cp}
              onChange={(e) => setCp(e.target.value)}
              className="block w-full min-w-0 rounded-xl border-2 border-tatan-secundario1/50 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-tatan-primario4 focus:ring-4 focus:ring-tatan-primario3/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary shrink-0 rounded-xl px-4 text-sm font-bold disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Calculando" /> : "Calcular"}
            </button>
          </div>
          {error ? (
            <p className="text-xs font-semibold text-rose-600" role="alert">
              {error}
            </p>
          ) : (
            <a
              href="https://www.correoargentino.com.ar/formularios/cpa"
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-xs font-semibold text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
            >
              No sé mi código postal
            </a>
          )}
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-bold text-zinc-800">
            Envío a CP {ship.postalCode}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
          >
            Cambiar
          </button>
        </div>
      )}

      {/* Cargando */}
      {loading && (
        <div className="grid gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[58px] animate-pulse rounded-2xl bg-zinc-200/60" />
          ))}
        </div>
      )}

      {/* Tarifas */}
      {!loading && quotes.length > 0 && !editing && (
        <div role="radiogroup" aria-label="Opciones de envío" className="grid gap-3">
          {MODE_ORDER.map((mode) => {
            const group = visible.filter((q) => q.mode === mode);
            if (!group.length) return null;
            const Icon = MODE_ICON[mode];
            return (
              <div key={mode} className="grid gap-1.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {modeLabel(mode)}
                </p>
                {group.map((q) => (
                  <QuoteOption
                    key={q.id}
                    quote={q}
                    selected={q.id === ship.selectedId}
                    cheapest={q.id === cheapest?.id}
                    fastest={q.id === fastest?.id && fastest?.id !== cheapest?.id}
                    compact={compact}
                    onSelect={() =>
                      setShipping({
                        selectedId: q.id,
                        branch: ship.branch?.carrierId === q.carrierId ? ship.branch : null,
                      })
                    }
                  />
                ))}
              </div>
            );
          })}
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
            >
              Ver todas las opciones ({quotes.length})
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Sucursal del correo */}
      {!loading && !editing && chosen?.mode === "sucursal" && (
        <BranchPicker
          key={chosen.carrierId}
          postalCode={ship.postalCode}
          carrierId={chosen.carrierId}
          carrier={chosen.carrier}
          value={ship.branch}
          onChange={(branch) => setShipping({ branch })}
        />
      )}

      {!loading && !editing && chosen?.mode === "retiro" && (
        <p className="rounded-xl bg-tatan-primario2/40 px-3 py-2 text-xs font-semibold text-zinc-700">
          {STORE_PICKUP.detail}
        </p>
      )}
    </div>
  );
}

function QuoteOption({
  quote,
  selected,
  cheapest,
  fastest,
  compact,
  onSelect,
}: {
  quote: ShippingQuote;
  selected: boolean;
  cheapest: boolean;
  fastest: boolean;
  compact: boolean;
  onSelect: () => void;
}) {
  const pickup = quote.mode === "retiro";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        "flex w-full items-center gap-3 rounded-2xl border-2 bg-white/80 text-left transition",
        compact ? "px-3 py-2.5" : "px-4 py-3",
        selected
          ? "border-tatan-primario4 bg-white shadow-sm"
          : "border-transparent ring-1 ring-tatan-secundario1/60 hover:ring-tatan-primario4/70",
      )}
    >
      <span
        className={cx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-tatan-primario4 bg-tatan-primario4" : "border-zinc-300",
        )}
        aria-hidden="true"
      >
        {selected && <Check className="h-3 w-3 text-zinc-800" strokeWidth={3.5} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-bold text-zinc-800">
            {pickup ? "Retiro en Tatan" : quote.carrier}
          </span>
          {quote.service === "prioritario" && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-tatan-acento-amarillo/70 px-1.5 py-0.5 text-[10px] font-bold text-zinc-800">
              <Zap className="h-2.5 w-2.5" aria-hidden="true" />
              Prioritario
            </span>
          )}
          {cheapest && (
            <span className="rounded-full bg-tatan-primario2 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
              Más barato
            </span>
          )}
          {fastest && (
            <span className="rounded-full bg-tatan-acento-azul/50 px-1.5 py-0.5 text-[10px] font-bold text-sky-900">
              Más rápido
            </span>
          )}
        </span>
        <span className="block text-xs text-zinc-500">
          {pickup ? STORE_PICKUP.detail : `Llega en ${daysLabel(quote.days)}`}
        </span>
      </span>
      <span
        className={cx(
          "shrink-0 text-sm font-extrabold tabular-nums",
          quote.price === 0 ? "text-emerald-700" : "text-zinc-800",
        )}
      >
        {quote.price === 0 ? "Gratis" : formatArs(quote.price)}
      </span>
    </button>
  );
}

function BranchPicker({
  postalCode,
  carrierId,
  carrier,
  value,
  onChange,
}: {
  postalCode: string;
  carrierId: string;
  carrier: string;
  value: Branch | null;
  onChange: (b: Branch) => void;
}) {
  const [branches, setBranches] = useState<Branch[] | null>(null);
  useEffect(() => {
    let alive = true;
    void listBranches(postalCode, carrierId)
      .then((b) => {
        if (alive) setBranches(b);
      })
      .catch(() => {
        if (alive) setBranches([]);
      });
    return () => {
      alive = false;
    };
  }, [postalCode, carrierId]);

  return (
    <div className="grid gap-1.5 rounded-2xl bg-white/60 p-3 ring-1 ring-tatan-secundario1/60">
      <p className="text-sm font-bold text-zinc-800">
        Elegí la sucursal de {carrier}
      </p>
      {!branches ? (
        <div className="grid gap-1.5" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-200/60" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <p className="text-xs text-zinc-500">
          No encontramos sucursales cerca. Elegí envío a domicilio.
        </p>
      ) : (
        <div role="radiogroup" aria-label="Sucursal" className="grid gap-1.5">
          {branches.map((b) => {
            const on = value?.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(b)}
                className={cx(
                  "flex items-start gap-2.5 rounded-xl border-2 bg-white px-3 py-2 text-left transition",
                  on ? "border-tatan-primario4" : "border-transparent ring-1 ring-tatan-secundario1/50 hover:ring-tatan-primario4/70",
                )}
              >
                <MapPin
                  className={cx("mt-0.5 h-4 w-4 shrink-0", on ? "text-tatan-secundario2" : "text-zinc-400")}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-800">{b.address}</span>
                  <span className="block text-xs text-zinc-500">
                    {b.city}
                    {b.distanceKm != null && ` · a ${b.distanceKm.toLocaleString("es-AR")} km`}
                  </span>
                  {b.hours && <span className="block text-[11px] text-zinc-400">{b.hours}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
