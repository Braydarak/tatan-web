"use client";

import * as React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";

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

const DARK = new Set([
  "#222222", "#2B3A67", "#6B6B6B", "#8B6B4F", "#8E6BBF",
  "#4F7CC4", "#D9474B", "#E0559A", "#8F9A5B",
]);

/** Abre/cierra un popover y lo cierra al tocar afuera o con Escape. */
function usePopover() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !ref.current?.contains(e.target as Node)
      ) {
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
  return { open, setOpen, ref };
}

/** La grilla de colores. `used` = colores que ya están (se ven pero no se eligen). */
function PalettePanel({
  label,
  value,
  used,
  onPick,
  alignRight,
}: {
  label: string;
  value?: string;
  used?: string[];
  onPick: (hex: string, name: string) => void;
  /** Abre hacia la izquierda (para botones pegados al borde derecho) */
  alignRight?: boolean;
}) {
  const usedSet = new Set((used ?? []).map((h) => h.toUpperCase()));
  return (
    <div
      role="listbox"
      aria-label={label}
      className={cx(
        "absolute top-full z-30 mt-1.5 grid w-64 grid-cols-6 gap-1.5 rounded-xl border border-black/10 bg-white p-2.5 shadow-xl",
        alignRight ? "right-0" : "left-0",
      )}
    >
      {COLOR_PALETTE.map((c) => {
        const active = !!value && c.hex === value.trim().toUpperCase();
        const taken = usedSet.has(c.hex) && !active;
        return (
          <button
            key={c.hex}
            type="button"
            role="option"
            aria-selected={active}
            disabled={taken}
            title={taken ? `${c.name} (ya está)` : c.name}
            aria-label={c.name}
            onClick={() => onPick(c.hex, c.name)}
            className={cx(
              "flex h-8 w-8 items-center justify-center rounded-full border transition",
              active
                ? "border-zinc-900 ring-2 ring-tatan-primario4 ring-offset-1"
                : "border-black/10",
              taken ? "cursor-not-allowed opacity-25" : "hover:scale-110",
            )}
            style={{ backgroundColor: c.hex }}
          >
            {active ? (
              <Check
                className={cx("h-4 w-4", DARK.has(c.hex) ? "text-white" : "text-zinc-800")}
                strokeWidth={3}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

type Props = {
  value: string;
  /** Devuelve el color elegido y su nombre en la paleta */
  onChange: (hex: string, name: string) => void;
  /** Texto para lectores de pantalla */
  label: string;
  className?: string;
  /** Solo el cuadradito del color, sin el nombre */
  compact?: boolean;
};

/**
 * Selector de color sin códigos: un botón con el color actual que abre la
 * paleta. Se elige tocando un color.
 */
export default function ColorPicker({ value, onChange, label, className, compact }: Props) {
  const { open, setOpen, ref } = usePopover();
  const current = paletteName(value);
  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${label}: ${current ?? "personalizado"}`}
        title="Cambiar color"
        className={cx(
          "flex items-center gap-2 rounded-lg border border-black/10 bg-white transition hover:bg-zinc-50",
          compact ? "h-9 p-1" : "h-10 pl-1.5 pr-2 text-sm font-semibold text-zinc-700",
        )}
      >
        <span
          className={cx(
            "shrink-0 rounded-md border border-black/10",
            compact ? "h-7 w-7" : "h-7 w-7",
          )}
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        {compact ? null : (
          <>
            <span className="hidden max-w-24 truncate sm:inline">{current ?? "Color"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </>
        )}
      </button>
      {open ? (
        <PalettePanel
          label={label}
          value={value}
          onPick={(hex, name) => {
            onChange(hex, name);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Botón "+ Agregar color" que abre la paleta (los colores ya usados no se repiten). */
export function AddColorButton({
  onAdd,
  used,
  label = "Agregar color",
  className,
  alignRight,
}: {
  onAdd: (hex: string, name: string) => void;
  used?: string[];
  label?: string;
  className?: string;
  alignRight?: boolean;
}) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-tatan-primario4 bg-tatan-primario1/30 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-tatan-primario1/60"
      >
        <Plus className="h-4 w-4" /> {label}
      </button>
      {open ? (
        <PalettePanel
          label={label}
          used={used}
          alignRight={alignRight}
          onPick={(hex, name) => {
            onAdd(hex, name);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
