"use client";

import * as React from "react";
import { useCategories } from "@/lib/use-categories";
import { wholesaleWebPrice } from "@/lib/wholesale";
import Image from "next/image";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import {
  Bold,
  ChevronDown,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { apiUploadImage } from "@/lib/tatan-api";
import ColorPicker, { AddColorButton, paletteName } from "@/components/ui/ColorPicker";
import { colorKey, hasColorStock, totalsBySize, type StockByColor } from "@/lib/stock";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type CategoryKey = string;

const SIZE_GROUP_BEBE = [
  "RN",
  "1M",
  "3M",
  "6M",
  "9M",
  "12M",
  "18M",
  "24M",
  "0-3",
  "3-6",
  "6-9",
  "9-12",
  "12-18",
  "18-24",
];
const SIZE_GROUP_NINIOS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "1-2",
  "2-4",
  "4-6",
  "6-8",
  "8-10",
];

type SizeGroup = "bebe" | "ninios";

/** Modelo / estampado / color del producto (con su stock por talle en el form) */
type ColorVariant = {
  name: string;
  hex: string;
  sku?: string;
  imageSrc?: string;
  stock?: Record<string, number>;
};

export type ProductFormData = {
  id?: string;
  slug?: string;
  name: string;
  tagline?: string;
  imageSrc: string;
  gallery?: string[];
  category: CategoryKey;
  sizeGroup: SizeGroup;
  sizes: string[];
  /** Total por talle (con modelos: la suma de todos) */
  stockBySize: Record<string, number>;
  /** Stock por modelo y talle (solo si el producto tiene modelos) */
  stockByColor?: StockByColor;
  stockTotal: number;
  soldTotal: number;
  colorHex: string;
  colorVariants: ColorVariant[];
  description: string;
  features: string[];
  price: number;
  originalPrice?: number;
  /** null = sin precio por mayor (se manda así para poder borrarlo) */
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  installments: number;
  taxFreePrice?: number;
  showPointsBadge?: boolean;
  rating: number;
  reviews: number;
  relatedIds: string[];
};

export type ProductFormProps = {
  initialData?: Partial<ProductFormData>;
  onSubmit?: (data: ProductFormData) => void;
  onCancel?: () => void;
  className?: string;
  submitting?: boolean;
};

function initialStockFromSizes(
  sizes: string[],
  prev: Record<string, number> = {},
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sizes) {
    out[s] = Number.isFinite(prev[s]) ? prev[s]! : 0;
  }
  return out;
}

/** Modelos del producto con su stock por talle (de stockByColor). */
function initialVariants(data?: Partial<ProductFormData>): ColorVariant[] {
  const variants = data?.colorVariants ?? [];
  const byColor = data?.stockByColor;
  if (hasColorStock(byColor)) {
    return variants.map((v) => ({ ...v, stock: { ...(byColor[colorKey(v.name)] ?? {}) } }));
  }
  // Todavía sin stock por modelo: el stock por talle va al primero
  return variants.map((v, i) => ({
    ...v,
    stock: i === 0 ? { ...(data?.stockBySize ?? {}) } : {},
  }));
}

/** El stock de cada modelo se guarda por su nombre: tiene que ser único. */
function modelsError(variants: ColorVariant[]): string | null {
  if (variants.some((v) => !v.name.trim())) {
    return "Poné un nombre a cada color (el stock se guarda por color)";
  }
  const names = variants.map((v) => colorKey(v.name).toLowerCase());
  if (new Set(names).size !== names.length) {
    return "Hay dos colores con el mismo nombre";
  }
  return null;
}

function sumObj(obj: Record<string, number>) {
  return Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ------------------------------------------------------------------ */
/*  Piezas de UI del formulario                                        */
/* ------------------------------------------------------------------ */

const inputClass =
  "block w-full min-w-0 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition focus:border-tatan-primario4 focus:outline-none focus:ring-2 focus:ring-tatan-primario1/60";

function Field({
  label,
  hint,
  error,
  optional,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cx("min-w-0", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-zinc-800"
      >
        {label}
        {optional ? (
          <span className="text-xs font-normal text-zinc-400">opcional</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

function Card({
  step,
  title,
  description,
  children,
  aside,
}: {
  step?: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_1px_3px_rgba(185,168,155,0.15)] sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {step ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tatan-primario1 text-xs font-extrabold text-zinc-900">
              {step}
            </span>
          ) : null}
          <div>
            <h3 className="text-base font-bold tracking-tight text-zinc-900">
              {title}
            </h3>
            {description ? (
              <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
            ) : null}
          </div>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** Sección plegable de "Más opciones". Muestra cuántos datos tiene cargados. */
function OptionalSection({
  title,
  description,
  filled,
  defaultOpen,
  children,
}: {
  title: string;
  description: string;
  filled: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-black/5 bg-white shadow-[0_1px_3px_rgba(185,168,155,0.15)] [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-5 py-4 transition hover:bg-zinc-50/60 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-zinc-900">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        </div>
        {filled > 0 ? (
          <span className="shrink-0 rounded-full bg-tatan-primario2 px-2.5 py-0.5 text-[11px] font-bold text-zinc-800">
            {filled} {filled === 1 ? "cargado" : "cargados"}
          </span>
        ) : null}
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-black/5 px-5 pb-6 pt-5 sm:px-6">
        {children}
      </div>
    </details>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex h-9 items-center justify-center rounded-xl border px-3.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario4",
        active
          ? "border-tatan-primario4 bg-tatan-primario1 text-zinc-900 shadow-sm"
          : "border-black/10 bg-white text-zinc-600 hover:border-black/20 hover:text-zinc-900",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-white py-1.5 pl-3 pr-1.5">
      <span className="text-sm font-bold text-zinc-800">{label}</span>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Restar uno al talle ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30"
          disabled={value <= 0}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          aria-label={`Stock del talle ${label}`}
          className="w-11 rounded-md bg-transparent text-center text-sm font-bold tabular-nums text-zinc-900 focus:outline-none focus:ring-2 focus:ring-tatan-primario1/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Sumar uno al talle ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Formulario                                                         */
/* ------------------------------------------------------------------ */

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  className,
  submitting = false,
}: ProductFormProps) {
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = React.useState(initialData?.name ?? "");
  const [tagline, setTagline] = React.useState(initialData?.tagline ?? "");
  const [slug, setSlug] = React.useState(initialData?.slug ?? "");
  const [imageSrc, setImageSrc] = React.useState(initialData?.imageSrc ?? "");
  const [gallery, setGallery] = React.useState<string[]>(
    initialData?.gallery ?? [],
  );
  const { categories, label: catLabel } = useCategories();
  const [category, setCategory] = React.useState<CategoryKey>(
    initialData?.category ?? "body",
  );
  const [sizeGroup, setSizeGroup] = React.useState<SizeGroup>(
    initialData?.sizeGroup ?? "bebe",
  );
  const sizesInit = initialData?.sizes?.length
    ? initialData.sizes
    : sizeGroup === "bebe"
      ? ["RN", "3M", "6M", "12M"]
      : ["2", "4", "6", "8"];
  const [sizes, setSizes] = React.useState<string[]>(sizesInit);
  const [stockBySize, setStockBySize] = React.useState<Record<string, number>>(
    () => initialStockFromSizes(sizesInit, initialData?.stockBySize ?? {}),
  );
  // Con modelos el stock se carga por modelo y talle; sin modelos, por talle.
  const [colorVariants, setColorVariants] = React.useState<ColorVariant[]>(
    () => initialVariants(initialData),
  );
  // Productos con modelos cargados antes del stock por color: su stock quedó
  // en el primer modelo para no perderlo. Se avisa para que lo repartan.
  const [stockMovedToFirst] = React.useState(
    () =>
      (initialData?.colorVariants?.length ?? 0) > 0 &&
      !hasColorStock(initialData?.stockByColor) &&
      sumObj(initialData?.stockBySize ?? {}) > 0,
  );
  const perModel = colorVariants.length > 0;
  const variantStock = (v: ColorVariant, size: string) =>
    Math.max(0, Number(v.stock?.[size]) || 0);
  const stockTotal = perModel
    ? colorVariants.reduce(
        (acc, v) => acc + sizes.reduce((a, s) => a + variantStock(v, s), 0),
        0,
      )
    : sizes.reduce((a, s) => a + (Number(stockBySize[s]) || 0), 0);
  const updateVariant = (i: number, patch: Partial<ColorVariant>) =>
    setColorVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    );
  const [activeColor, setActiveColor] = React.useState(0);
  /** Agrega un color (y lo deja elegido). El primero se lleva el stock que ya estaba cargado por talle. */
  const addColor = (hex: string, colorName: string) => {
    setActiveColor(colorVariants.length);
    setColorVariants((prev) => [
      ...prev,
      {
        name: colorName,
        hex,
        sku: "",
        imageSrc: "",
        stock: prev.length === 0 ? { ...stockBySize } : {},
      },
    ]);
  };
  /** Quita un color. Si era el último, su stock vuelve a ser el stock por talle. */
  const removeVariant = (i: number) => {
    if (colorVariants.length === 1) {
      const only = colorVariants[0];
      setStockBySize(Object.fromEntries(sizes.map((s) => [s, variantStock(only, s)])));
    }
    setColorVariants((prev) => prev.filter((_, idx) => idx !== i));
    setActiveColor((a) => (a > i ? a - 1 : a === i ? Math.max(0, i - 1) : a));
  };
  const setVariantStock = (i: number, size: string, value: number) =>
    setColorVariants((prev) =>
      prev.map((v, idx) =>
        idx === i ? { ...v, stock: { ...(v.stock ?? {}), [size]: value } } : v,
      ),
    );
  const [soldTotal, setSoldTotal] = React.useState(
    initialData?.soldTotal?.toString() ?? "0",
  );
  const [colorHex, setColorHex] = React.useState(
    initialData?.colorHex ?? "#F5E6D3",
  );
  const [description, setDescription] = React.useState(
    initialData?.description ?? "",
  );
  const [features, setFeatures] = React.useState<string[]>(
    initialData?.features?.length ? initialData.features : [""],
  );
  const [price, setPrice] = React.useState(
    initialData?.price ? initialData.price.toString() : "",
  );
  const [wholesalePrice, setWholesalePrice] = React.useState(
    initialData?.wholesalePrice ? initialData.wholesalePrice.toString() : "",
  );
  const [wholesaleMinQty, setWholesaleMinQty] = React.useState(
    initialData?.wholesaleMinQty ? initialData.wholesaleMinQty.toString() : "6",
  );
  const [originalPrice, setOriginalPrice] = React.useState(
    initialData?.originalPrice?.toString() ?? "",
  );
  // Las cuotas las define Mercado Pago / el banco: no se editan acá. Se
  // conserva el valor que ya tenga el producto al guardar.
  const [installments] = React.useState(
    initialData?.installments?.toString() ?? "6",
  );
  const [taxFreePrice, setTaxFreePrice] = React.useState(
    initialData?.taxFreePrice?.toString() ?? "",
  );
  const [showPointsBadge, setShowPointsBadge] = React.useState(
    initialData?.showPointsBadge ?? false,
  );
  // Puntuación y reseñas no se editan por ahora: se conservan al guardar
  const [rating] = React.useState(
    initialData?.rating?.toString() ?? "5.0",
  );
  const [reviews] = React.useState(
    initialData?.reviews?.toString() ?? "0",
  );
  const [relatedIds, setRelatedIds] = React.useState<string[]>(
    initialData?.relatedIds ?? [],
  );
  const [relatedInput, setRelatedInput] = React.useState("");
  const [showUrlInput, setShowUrlInput] = React.useState(false);

  // Errores de validación: se muestran recién después del primer intento
  const [triedSubmit, setTriedSubmit] = React.useState(false);

  // Subidas de imágenes en curso (se bloquea el submit hasta que terminen).
  const [uploading, setUploading] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  /** Sube los archivos a la API y devuelve sus URLs (las que fallen se descartan). */
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    setUploadError(null);
    setUploading((n) => n + files.length);
    const results = await Promise.allSettled(
      files.map((f) =>
        apiUploadImage(f).finally(() => setUploading((n) => n - 1)),
      ),
    );
    const failed = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failed) {
      setUploadError(
        failed.reason instanceof Error
          ? failed.reason.message
          : "No se pudo subir la imagen",
      );
    }
    return results
      .filter(
        (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled",
      )
      .map((r) => r.value);
  };

  const editorImageInputRef = React.useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TiptapImage.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: initialData?.description ?? "",
    editorProps: {
      attributes: {
        class:
          "max-w-none min-h-32 px-4 py-3 text-sm leading-relaxed text-zinc-900 outline-none [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-black/10",
      },
    },
    onUpdate({ editor }) {
      setDescription(editor.getHTML());
    },
  });

  const toggleSize = (size: string) => {
    const next = sizes.includes(size)
      ? sizes.filter((s) => s !== size)
      : [...sizes, size];
    setSizes(next);
    setStockBySize((prev) => initialStockFromSizes(next, prev));
  };

  const onSizeGroupChange = (next: SizeGroup) => {
    if (next === sizeGroup) return;
    setSizeGroup(next);
    const nextSizes =
      next === "bebe" ? ["RN", "3M", "6M", "12M"] : ["2", "4", "6", "8"];
    setSizes(nextSizes);
    setStockBySize((prev) => initialStockFromSizes(nextSizes, prev));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadFiles([file]).then(([url]) => {
      if (url) setImageSrc(url);
    });
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    void uploadFiles(files).then((urls) => {
      if (urls.length) setGallery((prev) => [...prev, ...urls]);
    });
  };

  const addRelated = () => {
    const id = relatedInput.trim();
    if (!id) return;
    setRelatedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setRelatedInput("");
  };

  const priceNum = Number(price) || 0;
  const originalNum = Number(originalPrice) || 0;
  const discountPct =
    originalNum > priceNum && priceNum > 0
      ? Math.round(((originalNum - priceNum) / originalNum) * 100)
      : 0;

  // Modelos que se guardan (los vacíos se descartan)
  const keptVariants = colorVariants.filter(
    (v) => v.name.trim() || v.sku?.trim() || v.imageSrc,
  );

  // Validación de lo mínimo para publicar
  const errors = {
    name: name.trim() ? null : "Poné un nombre para el producto",
    image: imageSrc.trim() ? null : "Subí una foto del producto",
    price: priceNum > 0 ? null : "Poné el precio",
    sizes: sizes.length ? null : "Elegí al menos un talle",
    models: modelsError(keptVariants),
  };
  const missing = Object.values(errors).filter(Boolean).length;
  const showErr = (e: string | null) => (triedSubmit ? e : null);

  // Cuántos datos opcionales hay cargados en cada sección plegable
  const filledOffer = [originalPrice, taxFreePrice, wholesalePrice].filter(
    (v) => Number(v) > 0,
  ).length;
  const wholesaleNum = Number(wholesalePrice) || 0;
  const wholesaleMin = Math.max(2, Math.round(Number(wholesaleMinQty) || 0));
  const filledPhotos =
    (gallery.length ? 1 : 0) +
    (colorVariants.length ? 1 : 0) +
    (colorHex.toUpperCase() !== "#F5E6D3" ? 1 : 0);
  const filledStore =
    (tagline.trim() ? 1 : 0) +
    (features.some((f) => f.trim()) ? 1 : 0) +
    (showPointsBadge ? 1 : 0) +
    (relatedIds.length ? 1 : 0);
  const filledAdvanced =
    (Number(soldTotal) > 0 ? 1 : 0);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTriedSubmit(true);
    if (submitting || uploading > 0 || !onSubmit) return;
    if (missing > 0) return;

    // Stock por modelo: { "Rosa": { "3M": 4 } } (solo los talles elegidos)
    const stockByColor: StockByColor | undefined = keptVariants.length
      ? Object.fromEntries(
          keptVariants.map((v) => [
            colorKey(v.name),
            Object.fromEntries(sizes.map((s) => [s, variantStock(v, s)])),
          ]),
        )
      : undefined;

    const data: ProductFormData = {
      id: initialData?.id,
      slug: slug.trim() || undefined,
      name: name.trim(),
      tagline: tagline.trim() || undefined,
      imageSrc,
      gallery: gallery.length ? gallery : undefined,
      category,
      sizeGroup,
      sizes,
      stockBySize: stockByColor ? totalsBySize(stockByColor, sizes) : stockBySize,
      stockByColor,
      stockTotal,
      soldTotal: Number(soldTotal) || 0,
      colorHex,
      colorVariants: keptVariants.map((v) => ({
        name: v.name.trim(),
        hex: v.hex,
        ...(v.sku?.trim() ? { sku: v.sku.trim() } : {}),
        ...(v.imageSrc ? { imageSrc: v.imageSrc } : {}),
      })),
      description,
      features: features.filter((f) => f.trim().length > 0),
      price: priceNum,
      originalPrice: originalNum || undefined,
      wholesalePrice: wholesaleNum > 0 ? wholesaleNum : null,
      wholesaleMinQty: wholesaleNum > 0 ? wholesaleMin : null,
      installments: Number(installments) || 1,
      taxFreePrice: Number(taxFreePrice) || undefined,
      showPointsBadge,
      rating: Number(rating) || 5,
      reviews: Number(reviews) || 0,
      relatedIds,
    };
    onSubmit(data);
  };

  const sizeChoices =
    sizeGroup === "bebe" ? SIZE_GROUP_BEBE : SIZE_GROUP_NINIOS;
  const categoryLabel = catLabel(category);

  const toolbarBtn = (active?: boolean) =>
    cx(
      "inline-flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario4",
      active
        ? "bg-tatan-primario1 text-zinc-900"
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
    );

  const submitLabel = submitting
    ? isEditing
      ? "Guardando…"
      : "Creando…"
    : isEditing
      ? "Guardar cambios"
      : "Crear producto";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cx("w-full pb-24 lg:pb-0", className)}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="mb-2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-900"
            >
              ← Volver a productos
            </button>
          ) : null}
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            {isEditing ? `Editar ${initialData?.name ?? "producto"}` : "Nuevo producto"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Completá lo básico y listo. Lo demás es opcional.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* 1. Foto + datos */}
          <Card step={1} title="Lo básico" description="Foto, nombre, categoría y precio">
            <div className="grid gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
              <div className="max-w-44 sm:max-w-none">
                <p className="mb-1.5 text-sm font-semibold text-zinc-800">Foto</p>
                <label
                  className={cx(
                    "group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-[#FEFDF8] text-center transition hover:border-tatan-primario4 focus-within:ring-2 focus-within:ring-tatan-primario4",
                    showErr(errors.image) ? "border-rose-300" : "border-black/10",
                  )}
                >
                  {imageSrc ? (
                    <>
                      <Image
                        src={imageSrc}
                        alt="Foto del producto"
                        fill
                        sizes="180px"
                        className="object-contain p-3"
                      />
                      <span className="absolute inset-x-2 bottom-2 rounded-lg bg-white/90 py-1 text-xs font-semibold text-zinc-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                        Cambiar foto
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-6 w-6 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-700">
                        Subir foto
                      </span>
                      <span className="mt-0.5 text-xs text-zinc-400">
                        JPG o PNG
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
                {showErr(errors.image) ? (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">
                    {errors.image}
                  </p>
                ) : null}
                {showUrlInput ? (
                  <input
                    type="url"
                    value={imageSrc}
                    onChange={(e) => setImageSrc(e.target.value)}
                    placeholder="https://…"
                    aria-label="URL de la foto"
                    className={cx(inputClass, "mt-2 text-xs")}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="mt-2 text-xs font-semibold text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
                  >
                    o pegar un link
                  </button>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                <Field label="Nombre" htmlFor="pf-name" error={showErr(errors.name)}>
                  <input
                    id="pf-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Body Osito Amor"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Número de artículo"
                  htmlFor="pf-slug"
                  hint="Opcional. Si tiene modelos, cada uno puede tener el suyo (en Más fotos y modelos)"
                  className="max-w-xs"
                >
                  <input
                    id="pf-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Ej: BC-1001"
                    className={cx(inputClass, "font-mono")}
                  />
                </Field>

                <div>
                  <p className="mb-1.5 text-sm font-semibold text-zinc-800">
                    Categoría
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories
                      .filter((c) => c.active || c.key === category)
                      .map((c) => (
                      <Chip
                        key={c.key}
                        active={category === c.key}
                        onClick={() => setCategory(c.key)}
                      >
                        {c.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <Field
                  label="Precio"
                  htmlFor="pf-price"
                  error={showErr(errors.price)}
                >
                  <div className="relative max-w-60">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-zinc-400">
                      $
                    </span>
                    <input
                      id="pf-price"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className={cx(inputClass, "pl-7 tabular-nums")}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </Card>

          {/* 2. Talles y stock */}
          <Card
            step={2}
            title="Talles, colores y stock"
            description={
              perModel
                ? "Elegí los talles, después cada color y cargá cuántos hay por talle"
                : "Elegí los talles y los colores que hay, y cargá cuántos tenés"
            }
            aside={
              <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold tabular-nums text-zinc-700">
                {stockTotal} u.
              </span>
            }
          >
            <div className="mb-4 inline-flex rounded-xl border border-black/10 bg-zinc-50 p-1">
              {(["bebe", "ninios"] as SizeGroup[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onSizeGroupChange(g)}
                  aria-pressed={sizeGroup === g}
                  className={cx(
                    "rounded-lg px-4 py-1.5 text-sm font-semibold transition",
                    sizeGroup === g
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800",
                  )}
                >
                  {g === "bebe" ? "Bebé" : "Niños"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {sizeChoices.map((size) => (
                <Chip
                  key={size}
                  active={sizes.includes(size)}
                  onClick={() => toggleSize(size)}
                  className="min-w-11 px-2.5"
                >
                  {size}
                </Chip>
              ))}
            </div>
            {showErr(errors.sizes) ? (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.sizes}
              </p>
            ) : null}

            {/* Colores: se elige uno y se carga su stock por talle */}
            {sizes.length > 0 ? (
              <div className="mt-6 border-t border-black/5 pt-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <p className="mr-auto text-sm font-bold text-zinc-800">
                    Colores
                    <span className="ml-2 text-xs font-medium text-zinc-500">
                      {perModel
                        ? "Tocá un color para cargar su stock por talle"
                        : "Agregá los colores que hay de este artículo"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {colorVariants.map((v, i) => {
                    const active = i === activeColor;
                    const subtotal = sizes.reduce((a, s) => a + variantStock(v, s), 0);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveColor(i)}
                        aria-pressed={active}
                        className={cx(
                          "inline-flex h-10 items-center gap-2 rounded-xl border pl-1.5 pr-3 text-sm font-semibold transition",
                          active
                            ? "border-tatan-primario4 bg-tatan-primario1/50 text-zinc-900 ring-2 ring-tatan-primario1"
                            : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50",
                        )}
                      >
                        <span
                          className="h-7 w-7 shrink-0 rounded-lg border border-black/10 bg-cover bg-center"
                          style={{
                            backgroundColor: v.hex,
                            backgroundImage: v.imageSrc ? `url("${v.imageSrc}")` : undefined,
                          }}
                          aria-hidden="true"
                        />
                        <span className={cx(!v.name.trim() && "italic text-zinc-400")}>
                          {v.name.trim() || "Sin nombre"}
                        </span>
                        <span className="rounded-full bg-white/80 px-1.5 text-[11px] font-bold tabular-nums text-zinc-500">
                          {subtotal} u.
                        </span>
                      </button>
                    );
                  })}
                  <AddColorButton
                    label={perModel ? "Agregar color" : "Elegir color"}
                    onAdd={addColor}
                    used={colorVariants.map((v) => v.hex)}
                  />
                </div>

                {stockMovedToFirst ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    El stock que tenía este producto quedó en el primer color.
                    Repartilo entre los colores y guardá.
                  </p>
                ) : null}

                {perModel && colorVariants[activeColor] ? (
                  (() => {
                    const i = activeColor;
                    const v = colorVariants[i];
                    return (
                      <div className="mt-4 rounded-2xl border border-tatan-primario4/50 bg-tatan-primario1/15 p-3 sm:p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <ColorPicker
                            compact
                            value={v.hex}
                            onChange={(hex, colorName) =>
                              updateVariant(
                                i,
                                !v.name.trim() || v.name.trim() === paletteName(v.hex)
                                  ? { hex, name: colorName }
                                  : { hex },
                              )
                            }
                            label={`Color ${i + 1}`}
                          />
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVariant(i, { name: e.target.value })}
                            placeholder="Nombre del color"
                            aria-label="Nombre del color"
                            className="h-9 w-44 min-w-0 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-zinc-800 focus:border-tatan-primario4 focus:outline-none focus:ring-2 focus:ring-tatan-primario1/60"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariant(i)}
                            className="ml-auto inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <X className="h-3.5 w-3.5" /> Quitar color
                          </button>
                        </div>
                        <p className="mb-2 text-xs font-semibold text-zinc-600">
                          Cantidad por talle en {v.name.trim() || "este color"}
                        </p>
                        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:grid-cols-3">
                          {sizes.map((s) => (
                            <Stepper
                              key={s}
                              label={s}
                              value={variantStock(v, s)}
                              onChange={(next) => setVariantStock(i, s, next)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : null}

                {/* Sin colores: stock por talle (artículo de un solo color) */}
                {!perModel ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-zinc-600">
                      Sin colores elegidos: cantidad por talle
                    </p>
                    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:grid-cols-3">
                      {sizes.map((s) => (
                        <Stepper
                          key={s}
                          label={s}
                          value={stockBySize[s] ?? 0}
                          onChange={(next) =>
                            setStockBySize((prev) => ({ ...prev, [s]: next }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {showErr(errors.models) ? (
                  <p className="mt-2 text-xs font-medium text-rose-600">{errors.models}</p>
                ) : null}
              </div>
            ) : null}
          </Card>

          {/* 3. Descripción */}
          <Card
            step={3}
            title="Descripción"
            description="Opcional. Se muestra en la página del producto"
          >
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white focus-within:border-tatan-primario4 focus-within:ring-2 focus-within:ring-tatan-primario1/60">
              <div className="flex items-center gap-1 border-b border-black/5 bg-zinc-50/70 px-2 py-1.5">
                <button
                  type="button"
                  aria-label="Negrita"
                  className={toolbarBtn(editor?.isActive("bold"))}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Cursiva"
                  className={toolbarBtn(editor?.isActive("italic"))}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <Italic className="h-4 w-4" />
                </button>
                <span className="mx-1 h-5 w-px bg-black/10" />
                <button
                  type="button"
                  aria-label="Lista"
                  className={toolbarBtn(editor?.isActive("bulletList"))}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Lista numerada"
                  className={toolbarBtn(editor?.isActive("orderedList"))}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
                <span className="mx-1 h-5 w-px bg-black/10" />
                <button
                  type="button"
                  aria-label="Insertar imagen"
                  className={toolbarBtn()}
                  onClick={() => editorImageInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <input
                  ref={editorImageInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    void uploadFiles([file]).then(([src]) => {
                      if (src) editor?.chain().focus().setImage({ src }).run();
                    });
                  }}
                />
              </div>
              <EditorContent editor={editor} />
            </div>
          </Card>

          {/* Más opciones */}
          <div className="mt-2">
            <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
              Más opciones · todo opcional
            </p>
            <div className="flex flex-col gap-3">
              <OptionalSection
                title="Oferta y por mayor"
                description="Precio antes de la oferta, precio sin impuestos y precio por mayor"
                filled={filledOffer}
              >
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field
                    label="Precio antes de la oferta"
                    htmlFor="pf-original"
                    hint={
                      discountPct > 0
                        ? `Se muestra como oferta: -${discountPct}%`
                        : "Dejalo vacío si no está en oferta"
                    }
                  >
                    <input
                      id="pf-original"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="$"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Precio sin impuestos" htmlFor="pf-taxfree">
                    <input
                      id="pf-taxfree"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={taxFreePrice}
                      onChange={(e) => setTaxFreePrice(e.target.value)}
                      placeholder="$"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="mt-5 grid gap-5 rounded-xl border border-black/5 bg-zinc-50/70 p-4 sm:grid-cols-2">
                  <Field
                    label="Precio por mayor (por unidad)"
                    htmlFor="pf-wholesale"
                    hint={
                      wholesaleNum > 0
                        ? wholesaleWebPrice(wholesaleNum) >= priceNum
                          ? `En la web quedaría ${formatArs(wholesaleWebPrice(wholesaleNum))} (con el 10%): tiene que ser menor que el precio normal`
                          : `En la web se ve ${formatArs(wholesaleWebPrice(wholesaleNum))} c/u (le sumamos el 10%)`
                        : "Dejalo vacío si no vendés por mayor"
                    }
                  >
                    <input
                      id="pf-wholesale"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="$"
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Desde (unidades)"
                    htmlFor="pf-wholesale-min"
                    hint="Sumando todos los talles y colores de este producto"
                  >
                    <input
                      id="pf-wholesale-min"
                      type="number"
                      min={2}
                      inputMode="numeric"
                      value={wholesaleMinQty}
                      onChange={(e) => setWholesaleMinQty(e.target.value)}
                      disabled={!(wholesaleNum > 0)}
                      className={inputClass}
                    />
                  </Field>
                  <p className="text-xs text-zinc-500 sm:col-span-2">
                    Cómo se usa (mostrar o aplicar en el carrito) se elige en
                    Inicio y tienda → Tienda → Precio por mayor.
                  </p>
                </div>
              </OptionalSection>

              <OptionalSection
                title="Más fotos y modelos"
                description="Fotos extra, color del producto y modelos/estampados con su número de artículo"
                filled={filledPhotos}
              >
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-800">
                        Fotos extra
                      </p>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-tatan-primario4">
                        <Plus className="h-3.5 w-3.5" /> Agregar fotos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={handleGalleryUpload}
                        />
                      </label>
                    </div>
                    {gallery.length ? (
                      <div className="flex flex-wrap gap-2">
                        {gallery.map((src, i) => (
                          <div
                            key={`${src}-${i}`}
                            className="group relative h-20 w-20 overflow-hidden rounded-xl border border-black/10 bg-white"
                          >
                            <Image
                              src={src}
                              alt={`Foto extra ${i + 1}`}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setGallery((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                )
                              }
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                              aria-label={`Quitar foto ${i + 1}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-black/10 px-4 py-4 text-center text-xs text-zinc-400">
                        Sin fotos extra
                      </p>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
                    <div>
                      <p className="mb-1.5 text-sm font-semibold text-zinc-800">
                        Color del producto
                      </p>
                      <ColorPicker
                        value={colorHex}
                        onChange={(hex) => setColorHex(hex)}
                        label="Color del producto"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-800">
                            Modelos / estampados
                          </p>
                          <p className="text-xs text-zinc-500">
                            El cliente elige uno al comprar. Cada uno puede tener
                            su foto y su número de artículo.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setColorVariants((prev) => [
                              ...prev,
                              { name: "", hex: "#F5E6D3", sku: "", imageSrc: "" },
                            ])
                          }
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          <Plus className="h-3.5 w-3.5" /> Agregar modelo
                        </button>
                      </div>
                      {colorVariants.length ? (
                        <div className="flex flex-col gap-2.5">
                          {colorVariants.map((cv, i) => {
                            const setV = (patch: Partial<ColorVariant>) =>
                              setColorVariants((prev) =>
                                prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
                              );
                            return (
                              <div
                                key={i}
                                className="flex gap-2.5 rounded-xl border border-black/10 bg-white p-2.5"
                              >
                                <label
                                  className="relative flex h-[88px] w-[72px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed border-black/15 bg-zinc-50 text-zinc-400 hover:border-tatan-primario4"
                                  title={cv.imageSrc ? "Cambiar foto del modelo" : "Subir foto del modelo"}
                                >
                                  {cv.imageSrc ? (
                                    <Image
                                      src={cv.imageSrc}
                                      alt={`Foto de ${cv.name || `modelo ${i + 1}`}`}
                                      fill
                                      sizes="72px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4" />
                                      <span className="text-[10px] font-semibold">Foto</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      e.target.value = "";
                                      if (!f) return;
                                      void uploadFiles([f]).then((urls) => {
                                        if (urls[0]) setV({ imageSrc: urls[0] });
                                      });
                                    }}
                                  />
                                </label>
                                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                                  <div className="flex items-center gap-2 sm:col-span-2">
                                    <ColorPicker
                                      value={cv.hex}
                                      onChange={(hex, colorName) =>
                                        // Si el nombre estaba vacío (o era el del color
                                        // anterior), toma el nombre del color elegido
                                        setV(
                                          !cv.name.trim() || cv.name.trim() === paletteName(cv.hex)
                                            ? { hex, name: colorName }
                                            : { hex },
                                        )
                                      }
                                      label={`Color del modelo ${i + 1}`}
                                      className="shrink-0"
                                    />
                                    <input
                                      type="text"
                                      value={cv.name}
                                      onChange={(e) => setV({ name: e.target.value })}
                                      placeholder="Nombre, ej: Ositos, Rosa, Estrellas"
                                      aria-label={`Nombre del modelo ${i + 1}`}
                                      className={inputClass}
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={cv.sku ?? ""}
                                    onChange={(e) => setV({ sku: e.target.value })}
                                    placeholder="Nº de artículo"
                                    aria-label={`Número de artículo del modelo ${i + 1}`}
                                    className={cx(inputClass, "font-mono")}
                                  />
                                  <div className="flex items-center justify-end gap-1">
                                    {cv.imageSrc ? (
                                      <button
                                        type="button"
                                        onClick={() => setV({ imageSrc: "" })}
                                        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
                                      >
                                        Quitar foto
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => removeVariant(i)}
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-500"
                                      aria-label={`Quitar modelo ${i + 1}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-black/10 px-4 py-3 text-center text-xs text-zinc-400">
                          Un solo modelo (el color del producto)
                        </p>
                      )}
                      {showErr(errors.models) ? (
                        <p className="mt-2 text-xs font-medium text-rose-600">{errors.models}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </OptionalSection>

              <OptionalSection
                title="Detalles para la tienda"
                description="Etiqueta, características, badge de puntos y productos relacionados"
                filled={filledStore}
              >
                <div className="flex flex-col gap-6">
                  <Field
                    label="Etiqueta"
                    htmlFor="pf-tagline"
                    hint="Un texto corto que aparece sobre el producto, ej: Nuevo"
                    className="max-w-sm"
                  >
                    <input
                      id="pf-tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Ej: Clásico del mes"
                      className={inputClass}
                    />
                  </Field>

                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-zinc-800">
                      Características
                    </p>
                    <div className="flex flex-col gap-2">
                      {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={f}
                            onChange={(e) =>
                              setFeatures((prev) =>
                                prev.map((x, idx) =>
                                  idx === i ? e.target.value : x,
                                ),
                              )
                            }
                            placeholder="Ej: 100% algodón orgánico"
                            aria-label={`Característica ${i + 1}`}
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFeatures((prev) =>
                                prev.length > 1
                                  ? prev.filter((_, idx) => idx !== i)
                                  : [""],
                              )
                            }
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800"
                            aria-label={`Quitar característica ${i + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFeatures((prev) => [...prev, ""])}
                        className="inline-flex items-center gap-1.5 self-start rounded-lg px-1 py-1 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar otra
                      </button>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-3.5 transition hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={showPointsBadge}
                      onChange={(e) => setShowPointsBadge(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#F6C6A1]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-zinc-800">
                        Mostrar &ldquo;Puntos Tatan&rdquo;
                      </span>
                      <span className="block text-xs text-zinc-500">
                        Agrega el badge de puntos en la tarjeta del producto
                      </span>
                    </span>
                  </label>

                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-zinc-800">
                      Productos relacionados
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={relatedInput}
                        onChange={(e) => setRelatedInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addRelated();
                          }
                        }}
                        placeholder="ID del producto, ej: b-002"
                        aria-label="ID de producto relacionado"
                        className={cx(inputClass, "max-w-56")}
                      />
                      <button
                        type="button"
                        onClick={addRelated}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar
                      </button>
                    </div>
                    {relatedIds.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {relatedIds.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full bg-tatan-primario1/60 px-3 py-1 font-mono text-xs text-zinc-800"
                          >
                            {id}
                            <button
                              type="button"
                              onClick={() =>
                                setRelatedIds((prev) => prev.filter((x) => x !== id))
                              }
                              aria-label={`Quitar ${id}`}
                              className="text-zinc-500 hover:text-zinc-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </OptionalSection>

              <OptionalSection
                title="Avanzado"
                description="Ventas históricas. Normalmente no hace falta tocarlo"
                filled={filledAdvanced}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Vendidos (histórico)" htmlFor="pf-sold">
                    <input
                      id="pf-sold"
                      type="number"
                      min={0}
                      value={soldTotal}
                      onChange={(e) => setSoldTotal(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </OptionalSection>
            </div>
          </div>
        </div>

        {/* Vista previa + guardar (fija en desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_3px_rgba(185,168,155,0.15)]">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                Así se ve en la tienda
              </p>
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[#FEFDF8]">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt=""
                    fill
                    sizes="290px"
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                    Sin foto
                  </div>
                )}
                {tagline ? (
                  <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-zinc-700 shadow-sm">
                    {tagline}
                  </span>
                ) : null}
                {discountPct > 0 ? (
                  <span className="absolute right-2 top-2 rounded-full bg-tatan-acento-rosa px-2.5 py-0.5 text-[11px] font-extrabold text-zinc-900">
                    -{discountPct}%
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {categoryLabel}
              </p>
              <p className="truncate font-semibold text-zinc-900">
                {name || "Nombre del producto"}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-bold tabular-nums text-zinc-900">
                  {priceNum > 0 ? formatArs(priceNum) : "$ —"}
                </span>
                {discountPct > 0 ? (
                  <span className="text-xs tabular-nums text-zinc-400 line-through">
                    {formatArs(originalNum)}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {sizes.length} {sizes.length === 1 ? "talle" : "talles"} · {stockTotal} u.
                en stock
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_3px_rgba(185,168,155,0.15)]">
              <ul className="mb-4 flex flex-col gap-1.5 text-xs">
                {[
                  ["Foto", !errors.image],
                  ["Nombre", !errors.name],
                  ["Precio", !errors.price],
                  ["Al menos un talle", !errors.sizes],
                  ...(perModel ? [["Colores con nombre", !errors.models]] : []),
                ].map(([label, ok]) => (
                  <li
                    key={label as string}
                    className={cx(
                      "flex items-center gap-2",
                      ok ? "text-zinc-700" : "text-zinc-400",
                    )}
                  >
                    <span
                      className={cx(
                        "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                        ok
                          ? "bg-tatan-acento-verde text-white"
                          : "border border-zinc-300",
                      )}
                    >
                      {ok ? "✓" : ""}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <SubmitArea
                submitting={submitting}
                uploading={uploading}
                uploadError={uploadError}
                missing={triedSubmit ? missing : 0}
                label={submitLabel}
                onCancel={onCancel}
                stacked
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Barra fija abajo en celular y tablet */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <SubmitArea
          submitting={submitting}
          uploading={uploading}
          uploadError={uploadError}
          missing={triedSubmit ? missing : 0}
          label={submitLabel}
          onCancel={onCancel}
        />
      </div>
    </form>
  );
}

function SubmitArea({
  submitting,
  uploading,
  uploadError,
  missing,
  label,
  onCancel,
  stacked,
}: {
  submitting: boolean;
  uploading: number;
  uploadError: string | null;
  missing: number;
  label: string;
  onCancel?: () => void;
  stacked?: boolean;
}) {
  const message =
    uploading > 0
      ? "Subiendo fotos…"
      : uploadError
        ? uploadError
        : missing > 0
          ? `Falta completar ${missing} ${missing === 1 ? "dato" : "datos"}`
          : null;
  return (
    <div className={cx("flex gap-2", stacked ? "flex-col" : "items-center")}>
      {message ? (
        <p
          role="status"
          className={cx(
            "text-xs font-medium",
            stacked ? "" : "mr-auto",
            uploadError || missing ? "text-rose-600" : "text-zinc-500",
          )}
        >
          {message}
        </p>
      ) : stacked ? null : (
        <span className="mr-auto" />
      )}
      <button
        type="submit"
        disabled={submitting || uploading > 0}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-tatan-primario1 px-5 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-tatan-primario4 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario4 focus-visible:ring-offset-2"
      >
        {label}
      </button>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-60"
        >
          Cancelar
        </button>
      ) : null}
    </div>
  );
}
