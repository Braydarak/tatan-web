"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/** Colores de la paleta (los más comunes en ropa de bebé y niños). */
export const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Crudo", hex: "#F4EEE1" },
  { name: "Beige", hex: "#E8D9C2" },
  { name: "Camel", hex: "#C9A27E" },
  { name: "Marrón", hex: "#8B6B4F" },
  { name: "Gris", hex: "#C4C4C4" },
  { name: "Gris oscuro", hex: "#6B6B6B" },
  { name: "Negro", hex: "#222222" },
  { name: "Rosa", hex: "#F6C9D3" },
  { name: "Rosa viejo", hex: "#D9A3A8" },
  { name: "Fucsia", hex: "#E0559A" },
  { name: "Rojo", hex: "#D9474B" },
  { name: "Coral", hex: "#F28B6E" },
  { name: "Naranja", hex: "#F2A65A" },
  { name: "Amarillo", hex: "#F6DC7A" },
  { name: "Mostaza", hex: "#D9A93B" },
  { name: "Verde agua", hex: "#A8DCCB" },
  { name: "Verde", hex: "#8BBF8A" },
  { name: "Verde oliva", hex: "#8F9A5B" },
  { name: "Celeste", hex: "#B9DCF2" },
  { name: "Azul", hex: "#4F7CC4" },
  { name: "Azul marino", hex: "#2B3A67" },
  { name: "Lila", hex: "#CDB8E6" },
  { name: "Violeta", hex: "#8E6BBF" },
];

/** Nombre del color de la paleta con ese código (si es uno de la paleta). */
export function paletteName(hex: string): string | undefined {
  const h = hex.trim().toUpperCase();
  return COLOR_PALETTE.find((c) => c.hex === h)?.name;
}

type Props = {
  value: string;
  /** Devuelve el color elegido y su nombre en la paleta */
  onChange: (hex: string, name: string) => void;
  /** Texto para lectores de pantalla */
  label: string;
  className?: string;
};

/**
 * Selector de color sin códigos: un botón con el color actual que abre la
 * paleta. Se elige tocando un color.
 */
export default function ColorPicker({ value, onChange, label, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = paletteName(value);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${label}: ${current ?? "personalizado"}`}
        className="flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white pl-1.5 pr-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        <span
          className="h-7 w-7 shrink-0 rounded-md border border-black/10"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        <span className="hidden max-w-24 truncate sm:inline">{current ?? "Color"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-30 mt-1.5 grid w-64 grid-cols-6 gap-1.5 rounded-xl border border-black/10 bg-white p-2.5 shadow-xl"
        >
          {COLOR_PALETTE.map((c) => {
            const active = c.hex === value.trim().toUpperCase();
            return (
              <button
                key={c.hex}
                type="button"
                role="option"
                aria-selected={active}
                title={c.name}
                aria-label={c.name}
                onClick={() => {
                  onChange(c.hex, c.name);
                  setOpen(false);
                }}
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-full border transition hover:scale-110",
                  active
                    ? "border-zinc-900 ring-2 ring-tatan-primario4 ring-offset-1"
                    : "border-black/10",
                )}
                style={{ backgroundColor: c.hex }}
              >
                {active ? (
                  <Check
                    className={cx(
                      "h-4 w-4",
                      ["#222222", "#2B3A67", "#6B6B6B", "#8B6B4F", "#8E6BBF", "#4F7CC4", "#D9474B", "#E0559A", "#8F9A5B"].includes(c.hex)
                        ? "text-white"
                        : "text-zinc-800",
                    )}
                    strokeWidth={3}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
