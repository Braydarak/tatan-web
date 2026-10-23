"use client";

import * as React from "react";
import Image from "next/image";
import CustomButton from "@/components/ui/CustomButton";
import ProductForm, { ProductFormData } from "@/components/ui/ProductForm";
import { ChevronDown, Mail, Smartphone, MapPin, Clock } from "lucide-react";
import {
  apiProducts,
  apiProductSave,
  apiProductDelete,
  type Product,
} from "@/lib/tatan-api";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type CategoryKey =
  | "body"
  | "remera"
  | "pijama"
  | "set"
  | "pantalon"
  | "buzo"
  | "accesorio";

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

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  body: "Body",
  remera: "Remera",
  pijama: "Pijama",
  set: "Set",
  pantalon: "Pantalón",
  buzo: "Buzo",
  accesorio: "Accesorio",
};

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
  const totalStock = sum(Object.values(product.stockBySize));
  const pct = discountPct(product);

  return (
    <tr>
      <td colSpan={8} className="px-0 sm:px-4 pb-6 border-b border-black/10">
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
                {CATEGORY_LABEL[product.category]}
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
              <KeyValue k="Categoría" v={CATEGORY_LABEL[product.category]} />
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
                k="Cuotas"
                v={
                  <span className="text-zinc-800 tabular-nums">
                    {product.installments}x de{" "}
                    {formatMoneyArs(
                      Math.round(product.price / product.installments),
                    )}{" "}
                    s/ interés
                  </span>
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
              <KeyValue
                k="Rating"
                v={
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-bold tabular-nums text-zinc-900">
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="text-[11px] text-zinc-500 ml-1">
                      ({product.reviews} reviews)
                    </span>
                  </div>
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
  const [remoteProducts, setRemoteProducts] = React.useState<ProductCrm[]>([]);
  const [loadStatus, setLoadStatus] = React.useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [editingProduct, setEditingProduct] = React.useState<ProductCrm | null>(
    null,
  );
  const [isCreating, setIsCreating] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

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
      installments: p.installments,
      taxFreePrice: p.taxFreePrice ?? undefined,
      showPointsBadge: p.showPointsBadge,
      rating: p.rating,
      reviews: p.reviews,
      relatedIds: p.relatedIds,
    };
  };

  const loadProducts = React.useCallback(async () => {
    setLoadStatus("loading");
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
    void loadProducts();
  }, [loadProducts]);

  // Datos a renderizar: los productos pasados por props o los traídos de la API.
  const products: ProductCrm[] =
    initialPropProducts && initialPropProducts.length
      ? initialPropProducts
      : remoteProducts;

  /* ------------------------------------------------------------------ */
  /*  CRUD actions                                                      */
  /* ------------------------------------------------------------------ */

  const handleCreateOrSave = async (
    data: ProductFormData,
    mode: "create" | "update",
  ) => {
    setSaving(true);
    try {
      const payload = {
        id: mode === "update" && editingProduct ? editingProduct.id : undefined,
        ...data,
        category: (data as any).category as string,
      };
      const r = await apiProductSave(payload as any);
      if (!r.ok) throw new Error(r.error || "No se pudo guardar el producto");
      notify(
        "ok",
        mode === "create" ? "Producto creado ✓" : "Producto guardado ✓",
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
      notify("ok", "Producto borrado ✓");
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

        <div className="flex items-center justify-between gap-3 px-1 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                Productos
              </h2>
              <span
                className={cx(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                  loadStatus === "loading"
                    ? "bg-sky-50 border-sky-200 text-sky-700"
                    : loadStatus === "error"
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : loadStatus === "ok"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600",
                )}
              >
                {loadStatus === "loading"
                  ? "Cargando de DB…"
                  : loadStatus === "error"
                    ? "Sin conexión (datos locales)"
                    : loadStatus === "ok"
                      ? "Conectado a tatankids.com.ar"
                      : "Esperando…"}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {products.length} productos
              </span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              Mismos campos y valores que se renderizan en la web pública.
              {loadError ? (
                <>
                  {" "}
                  <span className="text-rose-600 font-semibold">
                    Aviso: {loadError}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CustomButton
              type="outline"
              className="text-xs py-1.5"
              onClick={() => void loadProducts()}
              disabled={loadStatus === "loading"}
            >
              Recargar
            </CustomButton>
            <CustomButton onClick={() => setIsCreating(true)} disabled={saving}>
              Crear producto
            </CustomButton>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs font-semibold text-zinc-500">
                <th className="px-4 py-3 font-medium">Foto</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Cat.</th>
                <th className="px-4 py-3 font-medium">Talles</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="[&_tr:nth-child(4n-1)]:hover:bg-zinc-50/50">
              {products.map((p) => {
                const totalStock = sum(Object.values(p.stockBySize));
                const pct = discountPct(p);
                const expanded = expandedId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr className="align-middle transition border-b border-black/5">
                      <td className="px-4 py-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                          <Image
                            src={p.imageSrc || "/tatanLogo.png"}
                            alt={p.name}
                            fill
                            sizes="80px"
                            className="object-contain p-1"
                          />
                          <span
                            className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow"
                            style={{ background: p.colorHex }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="max-w-[260px] text-sm font-semibold text-zinc-900 truncate">
                                {p.name}
                              </div>
                              {pct > 0 ? (
                                <span className="inline-flex items-center rounded-full bg-tatan-acento-rosa/20 text-tatan-secundario2 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                                  -{pct}%
                                </span>
                              ) : null}
                            </div>
                            {p.tagline ? (
                              <div className="text-[11px] text-zinc-500 mt-0.5">
                                {p.tagline}
                              </div>
                            ) : null}
                            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                              ID {p.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex h-7 items-center rounded-xl bg-tatan-primario1/50 border border-tatan-secundario1/60 px-2.5 text-[11px] font-bold text-zinc-800">
                          {CATEGORY_LABEL[p.category]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {p.sizes.slice(0, 5).map((s) => (
                            <span
                              key={s}
                              className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-black/10 bg-white px-1.5 text-[10px] font-bold text-zinc-600"
                            >
                              {s}
                            </span>
                          ))}
                          {p.sizes.length > 5 ? (
                            <span className="text-[10px] text-zinc-400 self-center ml-0.5 font-medium">
                              +{p.sizes.length - 5}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mt-1">
                          {p.sizeGroup === "bebe" ? "Bebé" : "Niños"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold tabular-nums text-zinc-900">
                          {totalStock}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Vendidos {p.soldTotal}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold tabular-nums text-zinc-900">
                          {formatMoneyArs(p.price)}
                        </div>
                        {p.originalPrice ? (
                          <div className="text-[11px] text-zinc-400 line-through">
                            {formatMoneyArs(p.originalPrice)}
                          </div>
                        ) : null}
                        <div className="text-[10px] text-zinc-400 font-medium">
                          {p.installments} cuotas ·{" "}
                          {formatMoneyArs(Math.round(p.price / p.installments))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm font-bold tabular-nums text-zinc-800">
                          {p.rating.toFixed(1)}
                          <span className="text-amber-500 text-xs">★</span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {p.reviews} reviews
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <CustomButton
                              type="outline"
                              className="w-20 text-xs py-1.5"
                              onClick={() => setEditingProduct(p)}
                            >
                              Editar
                            </CustomButton>
                            <CustomButton
                              type="outline"
                              className="w-20 text-xs py-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              onClick={() => void handleDelete(p)}
                            >
                              Borrar
                            </CustomButton>
                          </div>
                          <CustomButton
                            type="ghost"
                            aria-expanded={expanded}
                            aria-controls={`detail-${p.id}`}
                            className="w-full text-xs py-1.5"
                            onClick={() =>
                              setExpandedId((prev) =>
                                prev === p.id ? null : p.id,
                              )
                            }
                          >
                            <span
                              className={cx(
                                "inline-flex items-center justify-center transition-transform duration-200",
                                expanded && "rotate-180",
                              )}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </span>
                            Más detalles
                          </CustomButton>
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
      </div>
    </section>
  );
}
