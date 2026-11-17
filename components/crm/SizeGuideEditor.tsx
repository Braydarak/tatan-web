"use client";

/**
 * Editor de la guía de talles de un producto (CRM): se elige la prenda (para
 * el dibujo) y se cargan los centímetros de cada medida por talle.
 */

import * as React from "react";
import { Copy } from "lucide-react";
import GarmentSvg from "@/components/product/GarmentSvg";
import { cleanCm, GARMENTS, garmentOf, type MeasureId, type SizeGuide } from "@/lib/size-guide";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function SizeGuideEditor({
  value,
  sizes,
  onChange,
  others = [],
}: {
  value: SizeGuide | null;
  /** Talles del producto (las filas de la tabla) */
  sizes: string[];
  onChange: (next: SizeGuide | null) => void;
  /** Guías de otros productos, para copiarlas */
  others?: { id: string; name: string; guide: SizeGuide }[];
}) {
  const [focused, setFocused] = React.useState<MeasureId | null>(null);
  const template = garmentOf(value?.garment);

  const setCell = (size: string, m: MeasureId, raw: string) => {
    if (!value) return;
    const row = { ...(value.rows[size] ?? {}), [m]: raw };
    onChange({ ...value, rows: { ...value.rows, [size]: row } });
  };

  const copyFrom = (id: string) => {
    const g = others.find((o) => o.id === id)?.guide;
    if (g) onChange({ garment: g.garment, rows: { ...g.rows } });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-800">Prenda</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Prenda de la guía de talles">
          <button
            type="button"
            role="radio"
            aria-checked={!value}
            onClick={() => onChange(null)}
            className={cx(
              "flex h-[86px] w-20 items-center justify-center rounded-xl border text-xs font-semibold transition",
              !value ? "border-tatan-primario4 bg-tatan-primario1/30 text-zinc-800" : "border-black/10 bg-white text-zinc-500 hover:bg-zinc-50",
            )}
          >
            Sin guía
          </button>
          {GARMENTS.map((g) => {
            const active = value?.garment === g.key;
            return (
              <button
                key={g.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ garment: g.key, rows: value?.rows ?? {} })}
                className={cx(
                  "flex w-20 flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] font-semibold leading-tight transition",
                  active ? "border-tatan-primario4 bg-tatan-primario1/30 text-zinc-800" : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50",
                )}
              >
                <GarmentSvg garment={g.key} showArrows={false} className="h-12 w-12" />
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {others.length > 0 && (
        <label className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-600">
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copiar medidas de:
          <select
            value=""
            onChange={(e) => e.target.value && copyFrom(e.target.value)}
            className="min-w-0 max-w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-700"
          >
            <option value="">Elegí un producto…</option>
            {others.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({garmentOf(o.guide.garment)?.label})
              </option>
            ))}
          </select>
        </label>
      )}

      {template && (
        <div className="grid items-start gap-4 sm:grid-cols-[170px_minmax(0,1fr)]">
          <GarmentSvg garment={template.key} highlight={focused} className="mx-auto h-40 w-40" />
          {sizes.length === 0 ? (
            <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
              Primero elegí los talles del producto (en &quot;Lo básico&quot;): cada talle es una fila de la tabla.
            </p>
          ) : (
            <div className="min-w-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500">
                    <th className="pb-2 pr-2 font-semibold">Talle</th>
                    {template.measures.map((m) => (
                      <th key={m.id} className="pb-2 pr-2 font-semibold" title={m.how}>
                        <span className="font-extrabold text-[#d27856]">{m.id}</span> · {m.name} (cm)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizes.map((size) => (
                    <tr key={size}>
                      <td className="py-1 pr-2 font-bold text-zinc-800">{size}</td>
                      {template.measures.map((m) => (
                        <td key={m.id} className="py-1 pr-2">
                          <input
                            inputMode="decimal"
                            value={value?.rows[size]?.[m.id] ?? ""}
                            onChange={(e) => setCell(size, m.id, e.target.value)}
                            onFocus={() => setFocused(m.id)}
                            onBlur={(e) => {
                              setFocused(null);
                              const clean = cleanCm(e.target.value);
                              if (clean !== e.target.value) setCell(size, m.id, clean);
                            }}
                            placeholder="—"
                            aria-label={`Talle ${size}, ${m.name} en centímetros`}
                            className="w-full min-w-0 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm tabular-nums outline-none focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario3/40"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-zinc-500">
                Con la prenda apoyada, en centímetros. Los talles sin medidas no aparecen en la tienda.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
