"use client";

import * as React from "react";
import { useCategories } from "@/lib/use-categories";
import SuccessModal from "@/components/ui/SuccessModal";
import { LOW_STOCK } from "@/components/crm/format";
import Image from "next/image";
import ProductForm, { ProductFormData } from "@/components/ui/ProductForm";
import {
  ChevronDown,
  Mail,
  Smartphone,
  MapPin,
  Clock,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  apiProducts,
  apiProductSave,
  apiProductDelete,
  type Product,
} from "@/lib/tatan-api";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type CategoryKey = string;

type SizeGroup = "bebe" | "ninios";

export type ProductCrm = ProductFormData & {
  id: string;
  category: CategoryKey;
  sizeGroup: SizeGroup;
};

export type ProductsCrmProps = {
  products?: ProductCrm[];
  className?: string;
};

function sum(values: number[]) {
  return values.reduce((acc, v) => acc + v, 0);
}

function formatMoneyArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function discountPct(p: ProductFormData) {
  return p.originalPrice && p.originalPrice > p.price
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    : 0;
}



function StockBadge({ stock }: { stock: number }) {
  const tone =
    stock === 0
      ? "bg-rose-50 text-rose-700"
      : stock <= LOW_STOCK
        ? "bg-amber-50 text-amber-800"
        : "bg-emerald-50 text-emerald-800";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
        tone,
      )}
    >
      {stock === 0 ? "Agotado" : `${stock} u.`}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
  danger,
  expanded,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={cx(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario4",
        danger
          ? "text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      {children}
    </button>
  );
}

const SIZE_GROUP_LABEL: Record<SizeGroup, string> = {
  bebe: "Bebé (RN → 24M)",
  ninios: "Niños (2 → 10)",
};

const ICONS: Record<"mail" | "tel" | "pin" | "clock", React.ElementType> = {
  mail: Mail,
  tel: Smartphone,
  pin: MapPin,
  clock: Clock,
};

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-xl border px-2.5 py-1 text-[11px] font-bold",
        className,
      )}
    >
      {children}
    </span>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: keyof typeof ICONS;
  children: React.ReactNode;
}) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-2 mb-3">
        {Icon ? <Icon className="w-4 h-4 text-tatan-primario4" /> : null}
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-700">
          {title}
        </h4>
      </div>
      <div>{children}</div>
    </div>
  );
}

function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-black/5 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 w-36 shrink-0">
        {k}
      </span>
      <span className="text-sm text-zinc-800 text-right flex-1 break-words">
        {v}
      </span>
    </div>
  );
}

function ProductDetailRow({ product }: { product: ProductCrm }) {
  const { label: catLabel } = useCategories();
  const totalStock = sum(Object.values(product.stockBySize));
  const pct = discountPct(product);

  return (
    <tr>
      <td colSpan={8} className="px-0 sm:px-3 pb-6 border-b border-black/10">
        <div className="rounded-3xl bg-gradient-to-br from-white via-tatan-primario1/30 to-tatan-acento-amarillo/20 border border-tatan-secundario1/50 px-3 sm:px-6 py-5 sm:py-6 shadow-[0_4px_18px_-8px_rgba(252,209,177,0.5)]">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-black/10 bg-white">
                <Image
                  src={product.imageSrc || "/tatanLogo.png"}
                  alt={product.name}
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-tatan-secundario2 mb-0.5">
                  Detalle completo
                </p>
                <p className="text-base font-bold text-zinc-900 leading-tight">
                  {product.name}
                  {pct > 0 ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-tatan-acento-rosa/20 text-tatan-secundario2 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider align-middle">
                      -{pct}%
                    </span>
                  ) : null}
                </p>
                <p className="text-[11px] font-mono text-zinc-400">
                  ID {product.id}
                  {product.slug ? ` · slug ${product.slug}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Pill className="bg-tatan-primario1/60 border-tatan-secundario1/60 text-zinc-800">
                {catLabel(product.category)}
              </Pill>
              <Pill
                className={cx(
                  product.showPointsBadge
                    ? "bg-tatan-acento-amarillo/40 border-tatan-secundario2/40 text-tatan-secundario2"
                    : "bg-zinc-100 border-black/10 text-zinc-600",
                )}
              >
                {product.showPointsBadge
                  ? "Con badge Puntos"
                  : "Sin badge Puntos"}
              </Pill>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DetailSection title="Identidad">
              <KeyValue k="Tagline" v={product.tagline || "—"} />
              <KeyValue k="Categoría" v={catLabel(product.category)} />
              <KeyValue
                k="Grupo de talles"
                v={SIZE_GROUP_LABEL[product.sizeGroup]}
              />
              <KeyValue
                k="Talles activos"
                v={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {product.sizes.length ? (
                      product.sizes.map((s) => (
                        <span
                          key={s}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-black/10 bg-white px-1.5 text-[10px] font-bold text-zinc-700"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 text-xs">Sin talles</span>
                    )}
                  </div>
                }
              />
              <KeyValue
                k="Color principal"
                v={
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className="inline-block w-5 h-5 rounded-full border border-black/10 shadow-sm"
                      style={{ background: product.colorHex }}
                    />
                    <span className="font-mono text-[11px] text-zinc-700">
                      {product.colorHex}
                    </span>
                  </div>
                }
              />
            </DetailSection>

            <DetailSection title="Precios">
              <KeyValue
                k="Precio actual"
                v={
                  <span className="font-extrabold tabular-nums">
                    {formatMoneyArs(product.price)}
                  </span>
                }
              />
              <KeyValue
                k="Original"
                v={
                  product.originalPrice ? (
                    <span className="line-through text-zinc-500 tabular-nums">
                      {formatMoneyArs(product.originalPrice)}
                    </span>
                  ) : (
                    "— sin oferta"
                  )
                }
              />
              <KeyValue
                k="Libre impuestos"
                v={
                  product.taxFreePrice ? (
                    <span className="tabular-nums">
                      {formatMoneyArs(product.taxFreePrice)}
                    </span>
                  ) : (
                    "— no definido"
                  )
                }
              />
            </DetailSection>

            <DetailSection title="Stock & ventas">
              <KeyValue
                k="Stock total"
                v={
                  <span
                    className={cx(
                      "font-extrabold tabular-nums",
                      totalStock === 0
                        ? "text-tatan-secundario2"
                        : totalStock <= 5
                          ? "text-tatan-acento-rosa"
                          : "text-zinc-900",
                    )}
                  >
                    {totalStock} u.
                    {totalStock <= 5 && totalStock > 0
                      ? " · stock bajo"
                      : totalStock === 0
                        ? " · agotado"
                        : ""}
                  </span>
                }
              />
              <KeyValue
                k="Vendidos totales"
                v={
                  <span className="font-bold tabular-nums text-zinc-900">
                    {product.soldTotal} u.
                  </span>
                }
              />
              <KeyValue
                k="Rotación"
                v={
                  totalStock + product.soldTotal === 0 ? (
                    "—"
                  ) : (
                    <span className="tabular-nums">
                      {Math.round(
                        (product.soldTotal / (totalStock + product.soldTotal)) *
                          100,
                      )}
                      % vendido
                    </span>
                  )
                }
              />
              <KeyValue
                k="Badge Puntos"
                v={product.showPointsBadge ? "Sí" : "No"}
              />
            </DetailSection>

            <DetailSection title="Galería de imágenes">
              {product.gallery?.length ? (
                <div className="flex flex-wrap gap-2">
                  {product.gallery.map((src, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-black/10 bg-white shadow-sm"
                    >
                      <Image
                        src={src}
                        alt={`Galería ${i + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  Sin fotos extra en galería.
                </p>
              )}
            </DetailSection>

            <DetailSection title="Variantes de color">
              {product.colorVariants.length ? (
                <div className="space-y-2">
                  {product.colorVariants.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2 border border-black/5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block w-6 h-6 rounded-full border border-black/10 shadow-sm shrink-0"
                          style={{ background: v.hex }}
                        />
                        <span className="text-sm font-semibold text-zinc-800 truncate">
                          {v.name}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                        {v.hex}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  Sin variantes adicionales.
                </p>
              )}
            </DetailSection>

            <DetailSection title="Stock por talle">
              {product.sizes.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {product.sizes.map((s) => {
                    const st = product.stockBySize?.[s] ?? 0;
                    return (
                      <div
                        key={s}
                        className="rounded-xl bg-white/80 border border-black/5 px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-tatan-primario1/60 border border-tatan-secundario1/60 px-1.5 text-[10px] font-bold text-zinc-800">
                          {s}
                        </span>
                        <span
                          className={cx(
                            "font-extrabold tabular-nums text-[13px]",
                            st === 0
                              ? "text-zinc-400"
                              : st <= 2
                                ? "text-tatan-secundario2"
                                : "text-zinc-900",
                          )}
                        >
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  Sin talles configurados.
                </p>
              )}
            </DetailSection>

            <DetailSection title="Características">
              {product.features?.filter(Boolean).length ? (
                <ul className="space-y-1.5">
                  {product.features.filter(Boolean).map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-zinc-800"
                    >
                      <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-tatan-primario4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  Sin características cargadas.
                </p>
              )}
            </DetailSection>

            <DetailSection title="Descripción larga">
              {product.description ? (
                <div
                  className="prose prose-sm max-w-none text-sm text-zinc-800 leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_li]:my-1 [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-black/10"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-xs text-zinc-400 italic">Sin descripción.</p>
              )}
            </DetailSection>

            <DetailSection title="Productos relacionados">
              {product.relatedIds?.length ? (
                <div className="flex flex-wrap gap-2">
                  {product.relatedIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center rounded-full bg-tatan-primario1/60 border border-tatan-secundario1/60 text-zinc-800 font-mono text-[11px] px-3 py-1"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  Sin relacionados asignados.
                </p>
              )}
            </DetailSection>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function ProductsCrm({
  products: initialPropProducts,
  className,
}: ProductsCrmProps) {
  const { categories, label: catLabel } = useCategories();
  const [remoteProducts, setRemoteProducts] = React.useState<ProductCrm[]>([]);
  const [loadStatus, setLoadStatus] = React.useState<
    "idle" | "loading" | "ok" | "error"
  >("loading");
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [editingProduct, setEditingProduct] = React.useState<ProductCrm | null>(
    null,
  );
  const [isCreating, setIsCreating] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<
    CategoryKey | "all"
  >("all");

  const toastTimer = React.useRef<number | null>(null);
  const notify = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const adapt = (p: Product): ProductCrm => {
    const totalStock = Object.values(p.stockBySize).reduce((a, b) => a + b, 0);
    return {
      id: p.id,
      slug: p.slug ?? undefined,
      name: p.name,
      tagline: p.tagline ?? undefined,
      imageSrc: p.imageSrc,
      gallery: p.gallery,
      category: p.category as ProductCrm["category"],
      sizeGroup: p.sizeGroup,
      sizes: p.sizes,
      stockBySize: p.stockBySize,
      stockTotal: totalStock,
      soldTotal: p.soldTotal,
      colorHex: p.colorHex,
      colorVariants: p.colorVariants,
      description: p.description ?? "",
      features: p.features,
      price: p.price,
      originalPrice: p.originalPrice ?? undefined,
      wholesalePrice: p.wholesalePrice ?? null,
      wholesaleMinQty: p.wholesaleMinQty ?? null,
      installments: p.installments,
      taxFreePrice: p.taxFreePrice ?? undefined,
      showPointsBadge: p.showPointsBadge,
      rating: p.rating,
      reviews: p.reviews,
      relatedIds: p.relatedIds,
    };
  };

  const loadProducts = React.useCallback(async () => {
    try {
      const list = await apiProducts();
      setRemoteProducts(list.map(adapt));
      setLoadStatus("ok");
      setLoadError(null);
    } catch (e) {
      setLoadStatus("error");
      setLoadError(
        e instanceof Error ? e.message : "Error al cargar productos",
      );
    }
  }, []);

  React.useEffect(() => {
    // Carga inicial. `loadProducts` es async: sus setState ocurren después del
    // await, no de forma síncrona, pero la regla lo detecta por la llamada directa.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  // Datos a renderizar: los productos pasados por props o los traídos de la API.
  const products: ProductCrm[] =
    initialPropProducts && initialPropProducts.length
      ? initialPropProducts
      : remoteProducts;

  const normalized = query.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (categoryFilter === "all" || p.category === categoryFilter) &&
      (!normalized ||
        p.name.toLowerCase().includes(normalized) ||
        p.id.toLowerCase().includes(normalized)),
  );

  /* ------------------------------------------------------------------ */
  /*  CRUD actions                                                      */
  /* ------------------------------------------------------------------ */

  const handleCreateOrSave = async (
    data: ProductFormData,
    mode: "create" | "update",
  ) => {
    setSaving(true);
    try {
      // El id va al final: decide POST (sin id → el servidor lo genera) vs PUT.
      const payload = {
        ...data,
        id: mode === "update" && editingProduct ? editingProduct.id : undefined,
      };
      const r = await apiProductSave(payload);
      if (!r.ok) throw new Error(r.error || "No se pudo guardar el producto");
      setSavedMsg(
        mode === "create"
          ? `El producto "${data.name}" se creó correctamente.`
          : `Los cambios de "${data.name}" se guardaron correctamente.`,
      );
      setEditingProduct(null);
      setIsCreating(false);
      void loadProducts();
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: ProductCrm) => {
    const ok = window.confirm(
      `¿Borrar el producto "${p.name}" (ID ${p.id})?\nEsta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      const r = await apiProductDelete(p.id);
      if (!r) throw new Error("No se pudo borrar (¿sesión expirada?)");
      setSavedMsg(`El producto "${p.name}" se borró correctamente.`);
      void loadProducts();
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Error al borrar");
    }
  };

  if (isCreating) {
    return (
      <section id="productos" className={cx("w-full scroll-mt-20", className)}>
        <ProductForm
          onSubmit={(data) => handleCreateOrSave(data, "create")}
          onCancel={() => setIsCreating(false)}
          submitting={saving}
        />
      </section>
    );
  }

  if (editingProduct) {
    const initialData: Partial<ProductFormData> = {
      id: editingProduct.id,
      slug: editingProduct.slug,
      name: editingProduct.name,
      tagline: editingProduct.tagline,
      imageSrc: editingProduct.imageSrc,
      gallery: editingProduct.gallery ?? [],
      category: editingProduct.category,
      sizeGroup: editingProduct.sizeGroup,
      sizes: editingProduct.sizes,
      stockBySize: editingProduct.stockBySize,
      stockTotal: editingProduct.stockTotal,
      soldTotal: editingProduct.soldTotal,
      colorHex: editingProduct.colorHex,
      colorVariants: editingProduct.colorVariants,
      description: editingProduct.description,
      features: editingProduct.features,
      price: editingProduct.price,
      originalPrice: editingProduct.originalPrice,
      wholesalePrice: editingProduct.wholesalePrice,
      wholesaleMinQty: editingProduct.wholesaleMinQty,
      installments: editingProduct.installments,
      taxFreePrice: editingProduct.taxFreePrice,
      showPointsBadge: editingProduct.showPointsBadge,
      rating: editingProduct.rating,
      reviews: editingProduct.reviews,
      relatedIds: editingProduct.relatedIds,
    };

    return (
      <section id="productos" className={cx("w-full scroll-mt-20", className)}>
        <ProductForm
          initialData={initialData}
          onSubmit={(data) => handleCreateOrSave(data, "update")}
          onCancel={() => setEditingProduct(null)}
          submitting={saving}
        />
      </section>
    );
  }

  return (
    <section id="productos" className={cx("w-full scroll-mt-20", className)}>
      <div className="flex flex-col gap-4 relative">
        <SuccessModal message={savedMsg} onClose={() => setSavedMsg(null)} />
        {/* Toast */}
        {toast ? (
          <div
            className={cx(
              "fixed top-6 right-6 z-50 rounded-2xl shadow-2xl px-4 py-3 border text-sm font-bold",
              toast.type === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900",
            )}
            role="status"
          >
            {toast.text}
          </div>
        ) : null}

        {/* Barra superior: buscar, filtrar y crear */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o ID"
              aria-label="Buscar productos"
              className="block w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-tatan-primario4 focus:outline-none focus:ring-2 focus:ring-tatan-primario1/60"
            />
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={() => {
                setLoadStatus("loading");
                void loadProducts();
              }}
              disabled={loadStatus === "loading"}
              title="Recargar"
              aria-label="Recargar productos"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
            >
              <RotateCw
                className={cx(
                  "h-4 w-4",
                  loadStatus === "loading" && "animate-spin",
                )}
              />
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              disabled={saving}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-tatan-primario1 px-4 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-tatan-primario4 active:scale-[0.98] disabled:opacity-60 sm:flex-none"
            >
              <Plus className="h-4 w-4" /> Nuevo producto
            </button>
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["all", ...categories.map((c) => c.key)].map((key) => {
            const count =
              key === "all"
                ? products.length
                : products.filter((p) => p.category === key).length;
            if (key !== "all" && count === 0) return null;
            const active = categoryFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key)}
                aria-pressed={active}
                className={cx(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
                  active
                    ? "border-tatan-primario4 bg-tatan-primario1 text-zinc-900"
                    : "border-black/10 bg-white text-zinc-600 hover:text-zinc-900",
                )}
              >
                {key === "all" ? "Todos" : catLabel(key)}
                <span className="tabular-nums text-zinc-400">{count}</span>
              </button>
            );
          })}
        </div>

        {loadStatus === "error" ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            No se pudieron cargar los productos{loadError ? `: ${loadError}` : ""}.
          </p>
        ) : null}

        {loadStatus === "loading" && products.length === 0 ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-white/70"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-12 text-center">
            <p className="font-semibold text-zinc-800">
              {products.length ? "No hay productos con ese filtro" : "Todavía no hay productos"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {products.length
                ? "Probá con otra búsqueda o categoría."
                : "Creá el primero con el botón “Nuevo producto”."}
            </p>
          </div>
        ) : (
          <>
            {/* Celular: tarjetas */}
            <ul className="flex flex-col gap-2 md:hidden">
              {visible.map((p) => {
                const totalStock = sum(Object.values(p.stockBySize));
                const pct = discountPct(p);
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_1px_3px_rgba(185,168,155,0.15)]"
                  >
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      aria-label={`Editar ${p.name}`}
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-[#FEFDF8]">
                        <Image
                          src={p.imageSrc || "/tatanLogo.png"}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {catLabel(p.category)} · {p.sizes.length}{" "}
                          {p.sizes.length === 1 ? "talle" : "talles"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold tabular-nums text-zinc-900">
                            {formatMoneyArs(p.price)}
                          </span>
                          {pct > 0 ? (
                            <span className="rounded-full bg-tatan-acento-rosa/30 px-1.5 text-[10px] font-extrabold text-zinc-800">
                              -{pct}%
                            </span>
                          ) : null}
                          <StockBadge stock={totalStock} />
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      title="Borrar"
                      aria-label={`Borrar ${p.name}`}
                      onClick={() => void handleDelete(p)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Escritorio: tabla */}
            <div className="hidden overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_3px_rgba(185,168,155,0.15)] md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black/5 bg-zinc-50/60 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-3 py-3">Categoría</th>
                    <th className="px-3 py-3">Talles</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Precio</th>
                    <th className="px-5 py-3 text-right">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => {
                    const totalStock = sum(Object.values(p.stockBySize));
                    const pct = discountPct(p);
                    const expanded = expandedId === p.id;
                    return (
                      <React.Fragment key={p.id}>
                        <tr className="border-b border-black/5 align-middle transition last:border-b-0 hover:bg-zinc-50/50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-[#FEFDF8]">
                                <Image
                                  src={p.imageSrc || "/tatanLogo.png"}
                                  alt=""
                                  fill
                                  sizes="56px"
                                  className="object-contain p-1"
                                />
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(p)}
                                  className="block max-w-[260px] truncate text-left text-sm font-semibold text-zinc-900 hover:underline"
                                >
                                  {p.name}
                                </button>
                                <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                                  {p.id}
                                  {p.tagline ? (
                                    <span className="ml-2 font-sans text-zinc-500">
                                      · {p.tagline}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex h-7 items-center rounded-full bg-tatan-primario1/50 px-2.5 text-xs font-semibold text-zinc-800">
                              {catLabel(p.category)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {p.sizes.slice(0, 4).map((size) => (
                                <span
                                  key={size}
                                  className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-black/10 bg-white px-1.5 text-[10px] font-bold text-zinc-600"
                                >
                                  {size}
                                </span>
                              ))}
                              {p.sizes.length > 4 ? (
                                <span className="self-center text-[11px] font-medium text-zinc-400">
                                  +{p.sizes.length - 4}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <StockBadge stock={totalStock} />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold tabular-nums text-zinc-900">
                                {formatMoneyArs(p.price)}
                              </span>
                              {pct > 0 ? (
                                <span className="rounded-full bg-tatan-acento-rosa/30 px-1.5 text-[10px] font-extrabold text-zinc-800">
                                  -{pct}%
                                </span>
                              ) : null}
                            </div>
                            {p.originalPrice ? (
                              <p className="text-[11px] tabular-nums text-zinc-400 line-through">
                                {formatMoneyArs(p.originalPrice)}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <IconButton
                                label={`Editar ${p.name}`}
                                onClick={() => setEditingProduct(p)}
                              >
                                <Pencil className="h-4 w-4" strokeWidth={2} />
                              </IconButton>
                              <IconButton
                                label={`Borrar ${p.name}`}
                                onClick={() => void handleDelete(p)}
                                danger
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={2} />
                              </IconButton>
                              <IconButton
                                label={
                                  expanded
                                    ? `Ocultar detalles de ${p.name}`
                                    : `Ver detalles de ${p.name}`
                                }
                                onClick={() =>
                                  setExpandedId((prev) =>
                                    prev === p.id ? null : p.id,
                                  )
                                }
                                expanded={expanded}
                              >
                                <ChevronDown
                                  className={cx(
                                    "h-4 w-4 transition-transform duration-200",
                                    expanded && "rotate-180",
                                  )}
                                  strokeWidth={2}
                                />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                        {expanded ? <ProductDetailRow product={p} /> : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
