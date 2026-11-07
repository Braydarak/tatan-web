"use client";

import * as React from "react";
import { ChevronDown, Eye, EyeOff, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import {
  apiCategories,
  apiCategoryCreate,
  apiCategoryDelete,
  apiCategoryUpdate,
  apiRevalidateTag,
} from "@/lib/tatan-api";
import type { Category } from "@/lib/categories";
import { refreshCategories } from "@/lib/use-categories";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type Notice = { kind: "ok" | "error"; text: string } | null;

/** CRM → Categorías: crear, renombrar, ocultar, ordenar y borrar. */
export default function Categorias() {
  const [list, setList] = React.useState<Category[] | null>(null);
  const [remote, setRemote] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [newLabel, setNewLabel] = React.useState("");
  const [notice, setNotice] = React.useState<Notice>(null);
  const [editing, setEditing] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    const r = await apiCategories(true);
    setList(r.list);
    setRemote(r.remote);
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const flash = (n: Notice) => {
    setNotice(n);
    if (n?.kind === "ok") window.setTimeout(() => setNotice(null), 2500);
  };

  // Después de cada cambio: refrescar la lista del CRM y la caché de la web
  const after = async (r: { ok: boolean; data?: Category[]; message?: string; error?: string }, okText: string) => {
    if (!r.ok) {
      flash({ kind: "error", text: r.message || r.error || "No se pudo guardar" });
      return false;
    }
    if (r.data) setList(r.data);
    void refreshCategories(true);
    await Promise.all([
      apiRevalidateTag("tatan-categories"),
      apiRevalidateTag("tatan-products"),
    ]);
    flash({ kind: "ok", text: okText });
    return true;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (label.length < 2) {
      flash({ kind: "error", text: "Escribí un nombre de al menos 2 letras" });
      return;
    }
    setBusy("__new");
    const r = await apiCategoryCreate(label);
    if (await after(r, `Categoría “${label}” creada`)) setNewLabel("");
    setBusy(null);
  };

  const rename = async (c: Category) => {
    const label = (editing[c.key] ?? c.label).trim();
    setEditing((p) => {
      const n = { ...p };
      delete n[c.key];
      return n;
    });
    if (label === c.label) return;
    if (label.length < 2) {
      flash({ kind: "error", text: "El nombre tiene que tener al menos 2 letras" });
      return;
    }
    setBusy(c.key);
    await after(await apiCategoryUpdate(c.key, { label }), "Nombre actualizado");
    setBusy(null);
  };

  const toggle = async (c: Category) => {
    setBusy(c.key);
    await after(
      await apiCategoryUpdate(c.key, { active: !c.active }),
      c.active ? `“${c.label}” quedó oculta` : `“${c.label}” vuelve a verse`,
    );
    setBusy(null);
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!list) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    // Reasigna el orden 1..n con los dos intercambiados
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setBusy(next[j].key);
    let last: { ok: boolean; data?: Category[]; message?: string } = { ok: true };
    for (let k = 0; k < next.length; k++) {
      if (next[k].sortOrder !== k + 1) {
        last = await apiCategoryUpdate(next[k].key, { sortOrder: k + 1 });
        if (!last.ok) break;
      }
    }
    await after(last, "Orden actualizado");
    setBusy(null);
  };

  const remove = async (c: Category) => {
    if (!window.confirm(`¿Borrar la categoría “${c.label}”? No se puede deshacer.`)) return;
    setBusy(c.key);
    await after(await apiCategoryDelete(c.key), `“${c.label}” borrada`);
    setBusy(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {!remote && list && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Todavía no está subido <strong>categories.php</strong> a Ferozo: se
            muestran las categorías de siempre y no se pueden editar. Subilo y
            recargá esta pantalla.
          </p>
        </div>
      )}

      <form
        onSubmit={create}
        className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <label className="block flex-1">
          <span className="mb-1.5 block text-xs font-semibold text-zinc-700">
            Nueva categoría
          </span>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ej: Conjuntos, Gorritos, Mantas…"
            maxLength={50}
            disabled={!remote}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60 disabled:bg-zinc-50"
          />
        </label>
        <button
          type="submit"
          disabled={!remote || busy !== null}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-tatan-primario1 px-5 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-tatan-primario4 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Crear
        </button>
      </form>

      {notice && (
        <p
          role="status"
          className={cx(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
            notice.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700",
          )}
        >
          {notice.kind === "ok" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {notice.text}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
          <p className="text-sm font-bold text-zinc-900">
            {list ? `${list.length} categorías` : "Cargando…"}
          </p>
          <p className="text-xs text-zinc-500">El orden es el de la tienda</p>
        </div>
        <ul className="divide-y divide-black/5">
          {(list ?? []).map((c, i) => {
            const count = c.productCount ?? 0;
            const working = busy === c.key;
            return (
              <li
                key={c.key}
                className={cx(
                  "flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap",
                  !c.active && "bg-zinc-50/80",
                  working && "opacity-60",
                )}
              >
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={!remote || i === 0 || busy !== null}
                    aria-label={`Subir ${c.label}`}
                    className="flex h-5 w-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={!remote || i === (list?.length ?? 0) - 1 || busy !== null}
                    aria-label={`Bajar ${c.label}`}
                    className="flex h-5 w-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={editing[c.key] ?? c.label}
                    onChange={(e) => setEditing((p) => ({ ...p, [c.key]: e.target.value }))}
                    onBlur={() => editing[c.key] !== undefined && void rename(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape")
                        setEditing((p) => {
                          const n = { ...p };
                          delete n[c.key];
                          return n;
                        });
                    }}
                    disabled={!remote}
                    maxLength={50}
                    aria-label={`Nombre de ${c.label}`}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-zinc-900 outline-none transition hover:border-black/10 focus:border-tatan-primario4 focus:bg-white disabled:hover:border-transparent"
                  />
                  <p className="px-2 text-xs text-zinc-500">
                    {count} {count === 1 ? "producto" : "productos"} · /productos?c={c.key}
                    {!c.active && <span className="ml-1.5 font-semibold text-amber-700">· Oculta</span>}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggle(c)}
                  disabled={!remote || busy !== null}
                  className={cx(
                    "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition disabled:opacity-50",
                    c.active
                      ? "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
                      : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
                  )}
                >
                  {c.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {c.active ? "Visible" : "Oculta"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  disabled={!remote || busy !== null || count > 0}
                  aria-label={`Borrar ${c.label}`}
                  title={count > 0 ? "Tiene productos: movelos a otra categoría u ocultala" : "Borrar"}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-zinc-500">
        Las categorías ocultas no aparecen en los filtros de la tienda ni se
        pueden elegir para productos nuevos (los productos que ya tienen siguen
        visibles). Solo se puede borrar una categoría sin productos. Para que una
        categoría aparezca como tarjeta en el inicio, prendela en Inicio y tienda
        → Categorías.
      </p>
    </div>
  );
}
