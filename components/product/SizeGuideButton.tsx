"use client";

/**
 * Botón "Guía de talles" de la ficha del producto: abre una ventana con el
 * dibujo de la prenda (con las medidas A y B) y la tabla de centímetros por
 * talle. Si ya eligió un talle, su fila aparece resaltada.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ruler, X } from "lucide-react";
import GarmentSvg from "@/components/product/GarmentSvg";
import { visibleGuide, type MeasureId, type SizeGuide } from "@/lib/size-guide";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function SizeGuideButton({
  guide,
  sizes,
  selectedSize,
}: {
  guide: SizeGuide | undefined;
  /** Talles del producto, en orden (con su referencia, p. ej. "3 a 6 meses") */
  sizes: { label: string; hint?: string }[];
  selectedSize?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<MeasureId | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const data = visibleGuide(guide, sizes.map((s) => s.label));

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!data) return null;
  const { template, rows } = data;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-bold text-tatan-secundario2 underline decoration-dotted underline-offset-4 transition hover:text-zinc-800"
      >
        <Ruler className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
        Guía de talles
      </button>

      {/* Va directo en <body>: dentro de una tarjeta con desenfoque, "fixed"
          se acomodaría a la tarjeta y no a la pantalla */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-[#FFFDF7] p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tatan-secundario2">Guía de talles</p>
                <h2 id="size-guide-title" className="mt-0.5 text-xl font-extrabold text-zinc-800">
                  {template.label}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar guía de talles"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm ring-1 ring-black/5 transition hover:text-zinc-900"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 grid items-center gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
              <GarmentSvg garment={template.key} highlight={hover} className="mx-auto h-52 w-52 sm:h-56 sm:w-56" />

              <div className="min-w-0">
                <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-2xl text-sm ring-1 ring-tatan-secundario1/60">
                  <thead>
                    <tr className="bg-tatan-primario1/40 text-zinc-700">
                      <th scope="col" className="px-3 py-2.5 text-left font-bold">Talle</th>
                      {template.measures.map((m) => (
                        <th
                          key={m.id}
                          scope="col"
                          className="px-3 py-2.5 text-center font-bold"
                          onMouseEnter={() => setHover(m.id)}
                          onMouseLeave={() => setHover(null)}
                        >
                          <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d27856] text-[11px] font-extrabold text-[#d27856]">
                            {m.id}
                          </span>
                          {m.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const active = selectedSize === r.size;
                      const hint = sizes.find((s) => s.label === r.size)?.hint;
                      return (
                        <tr key={r.size} className={cx(active ? "bg-tatan-primario4/35" : "bg-white even:bg-[#FEFBF5]")}>
                          <th scope="row" className="border-t border-tatan-secundario1/40 px-3 py-2 text-left">
                            <span className="font-extrabold text-zinc-800">Talle {r.size}</span>
                            {hint && <span className="block text-[11px] font-semibold text-zinc-500">{hint}</span>}
                          </th>
                          {template.measures.map((m) => (
                            <td
                              key={m.id}
                              className={cx(
                                "border-t border-tatan-secundario1/40 px-3 py-2 text-center font-semibold tabular-nums text-zinc-700",
                                hover === m.id && "bg-[#d27856]/10",
                              )}
                            >
                              {r.values[m.id] ? `${r.values[m.id]} cm` : "—"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {selectedSize && rows.some((r) => r.size === selectedSize) && (
                  <p className="mt-2 text-xs font-semibold text-zinc-500">Resaltado: el talle que elegiste.</p>
                )}
              </div>
            </div>

            <ul className="mt-5 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
              {template.measures.map((m) => (
                <li
                  key={m.id}
                  className="flex gap-2 rounded-xl bg-white/80 p-3 ring-1 ring-black/5"
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#d27856] text-[11px] font-extrabold text-[#d27856]">
                    {m.id}
                  </span>
                  <span>
                    <span className="font-bold text-zinc-800">{m.name}:</span> {m.how}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Medidas de la prenda apoyada sobre una superficie plana, en centímetros. Te sirven para compararlas con una prenda que ya le quede bien.
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
