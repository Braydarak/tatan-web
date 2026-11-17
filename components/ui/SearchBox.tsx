"use client";

/**
 * Buscador de la tienda con sugerencias: mientras se escribe muestra
 * accesos directos (p. ej. "bebés" → todos los productos de bebé) y
 * productos con foto y precio. Enter sin elegir nada → resultados en
 * /productos?q=…
 */

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { apiProducts } from "@/lib/tatan-api";
import { useCategories } from "@/lib/use-categories";
import { formatArs } from "@/lib/cart";
import { buildSuggestions, type SearchProduct, type Suggestion } from "@/lib/search-suggestions";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

// Los productos se piden una sola vez (la primera vez que se usa el buscador)
let productsCache: SearchProduct[] | null = null;
let productsPromise: Promise<SearchProduct[]> | null = null;
function loadProducts(): Promise<SearchProduct[]> {
  if (productsCache) return Promise.resolve(productsCache);
  productsPromise ??= apiProducts()
    .then((list) => {
      productsCache = list.filter((p) => p.active !== false);
      return productsCache;
    })
    .catch(() => {
      productsPromise = null;
      return [];
    });
  return productsPromise;
}

export default function SearchBox({
  autoFocus = false,
  onNavigate,
  className,
  inputClassName,
}: {
  autoFocus?: boolean;
  /** Se llama al ir a un resultado (p. ej. para cerrar el menú del celular) */
  onNavigate?: () => void;
  className?: string;
  inputClassName?: string;
}) {
  const router = useRouter();
  const { categories } = useCategories(false);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const [products, setProducts] = React.useState<SearchProduct[] | null>(productsCache);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  const ensureProducts = () => {
    if (products) return;
    void loadProducts().then(setProducts);
  };

  const suggestions: Suggestion[] = React.useMemo(
    () => (q.trim() && products ? buildSuggestions(q, products, categories) : []),
    [q, products, categories],
  );
  // Último ítem: "Buscar «q» en todos los productos"
  const items: { href: string }[] = q.trim()
    ? [...suggestions, { href: `/productos?q=${encodeURIComponent(q.trim())}` }]
    : [];

  // Cerrar al tocar afuera
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = items[active]?.href ?? (q.trim() ? `/productos?q=${encodeURIComponent(q.trim())}` : "/productos");
    go(target);
  };

  const showPanel = open && q.trim().length > 0;
  const shortcuts = suggestions.filter((s): s is Extract<Suggestion, { kind: "shortcut" }> => s.kind === "shortcut");
  const hits = suggestions.filter((s): s is Extract<Suggestion, { kind: "product" }> => s.kind === "product");
  const indexOf = (s: Suggestion) => suggestions.indexOf(s);

  return (
    <div ref={wrapRef} className={cx("relative", className)}>
      <form role="search" action="/productos" onSubmit={onSubmit}>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tatan-primario4"
          strokeWidth={2.4}
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Buscar producto, talle o categoría"
          aria-label="Buscar productos"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onFocus={() => {
            ensureProducts();
            setOpen(true);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
            ensureProducts();
          }}
          onKeyDown={onKeyDown}
          className={cx(
            "h-11 w-full rounded-2xl border border-tatan-secundario1/60 bg-white pl-10 pr-10 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/70 [&::-webkit-search-cancel-button]:hidden",
            inputClassName,
          )}
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setActive(-1);
            }}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Sugerencias"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[70] max-h-[min(70dvh,520px)] overflow-y-auto rounded-2xl border border-tatan-secundario1/50 bg-[#FFFDF7] p-1.5 shadow-xl"
        >
          {!products && (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Buscando…
            </p>
          )}

          {shortcuts.map((s) => {
            const i = indexOf(s);
            return (
              <button
                key={s.href}
                id={`${listId}-${i}`}
                type="button"
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(s.href)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  active === i ? "bg-tatan-primario1/50" : "hover:bg-tatan-primario1/30",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tatan-primario1/60 text-tatan-secundario2">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-zinc-800">{s.label}</span>
                  <span className="block text-xs text-zinc-500">{s.hint}</span>
                </span>
              </button>
            );
          })}

          {hits.length > 0 && (
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Productos</p>
          )}
          {hits.map((p) => {
            const i = indexOf(p);
            return (
              <button
                key={p.id}
                id={`${listId}-${i}`}
                type="button"
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(p.href)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition",
                  active === i ? "bg-tatan-primario1/50" : "hover:bg-tatan-primario1/30",
                )}
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                  {p.imageSrc && <Image src={p.imageSrc} alt="" fill sizes="48px" className="object-contain p-1" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-semibold text-zinc-800">{p.name}</span>
                  <span className="mt-0.5 flex items-baseline gap-1.5 text-xs">
                    <span className="font-extrabold text-zinc-800">{formatArs(p.price)}</span>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="text-zinc-400 line-through">{formatArs(p.originalPrice)}</span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}

          {products && suggestions.length === 0 && (
            <p className="px-3 py-3 text-sm text-zinc-500">No encontramos productos con “{q.trim()}”.</p>
          )}

          <button
            id={`${listId}-${suggestions.length}`}
            type="button"
            role="option"
            aria-selected={active === suggestions.length}
            onMouseEnter={() => setActive(suggestions.length)}
            onClick={() => go(`/productos?q=${encodeURIComponent(q.trim())}`)}
            className={cx(
              "mt-1 flex w-full items-center justify-between gap-2 rounded-xl border-t border-tatan-secundario1/40 px-3 py-2.5 text-left text-sm font-semibold text-tatan-secundario2 transition",
              active === suggestions.length ? "bg-tatan-primario1/50 text-zinc-800" : "hover:bg-tatan-primario1/30",
            )}
          >
            Ver todos los resultados de “{q.trim()}”
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
