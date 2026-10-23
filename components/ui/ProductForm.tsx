"use client";

import * as React from "react";
import Image from "next/image";
import CustomInput from "@/components/ui/CustomInput";
import CustomButton from "@/components/ui/CustomButton";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { Minus, Plus, X, Upload } from "lucide-react";

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

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "body", label: "Body" },
  { key: "remera", label: "Remera" },
  { key: "pijama", label: "Pijama" },
  { key: "set", label: "Set" },
  { key: "pantalon", label: "Pantalón" },
  { key: "buzo", label: "Buzo" },
  { key: "accesorio", label: "Accesorio" },
];

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

type ColorVariant = { name: string; hex: string };

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
  stockBySize: Record<string, number>;
  stockTotal: number;
  soldTotal: number;
  colorHex: string;
  colorVariants: ColorVariant[];
  description: string;
  features: string[];
  price: number;
  originalPrice?: number;
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

function sumObj(obj: Record<string, number>) {
  return Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  className,
  submitting = false,
}: ProductFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [tagline, setTagline] = React.useState(initialData?.tagline ?? "");
  const [slug, setSlug] = React.useState(initialData?.slug ?? "");
  const [imageSrc, setImageSrc] = React.useState(initialData?.imageSrc ?? "");
  const [gallery, setGallery] = React.useState<string[]>(
    initialData?.gallery ?? [],
  );
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
  const stockTotal = sumObj(stockBySize);
  const [soldTotal, setSoldTotal] = React.useState(
    initialData?.soldTotal?.toString() ?? "0",
  );
  const [colorHex, setColorHex] = React.useState(
    initialData?.colorHex ?? "#F5E6D3",
  );
  const [colorVariants, setColorVariants] = React.useState<ColorVariant[]>(
    initialData?.colorVariants ?? [],
  );
  const [description, setDescription] = React.useState(
    initialData?.description ?? "",
  );
  const [features, setFeatures] = React.useState<string[]>(
    initialData?.features ?? ["", "", ""],
  );
  const [price, setPrice] = React.useState(
    initialData?.price?.toString() ?? "",
  );
  const [originalPrice, setOriginalPrice] = React.useState(
    initialData?.originalPrice?.toString() ?? "",
  );
  const [installments, setInstallments] = React.useState(
    initialData?.installments?.toString() ?? "6",
  );
  const [taxFreePrice, setTaxFreePrice] = React.useState(
    initialData?.taxFreePrice?.toString() ?? "",
  );
  const [showPointsBadge, setShowPointsBadge] = React.useState(
    initialData?.showPointsBadge ?? false,
  );
  const [rating, setRating] = React.useState(
    initialData?.rating?.toString() ?? "5.0",
  );
  const [reviews, setReviews] = React.useState(
    initialData?.reviews?.toString() ?? "0",
  );
  const [relatedIds, setRelatedIds] = React.useState<string[]>(
    initialData?.relatedIds ?? [],
  );
  const [relatedInput, setRelatedInput] = React.useState("");

  const editorImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
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
          "max-w-none min-h-36 px-4 py-3 text-sm leading-relaxed text-zinc-900 outline-none [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-black/10",
      },
    },
    onUpdate({ editor }) {
      setDescription(editor.getHTML());
    },
  });

  const toggleSize = React.useCallback((size: string) => {
    setSizes((prev) => {
      const next = prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size];
      setStockBySize((prevStock) => initialStockFromSizes(next, prevStock));
      return next;
    });
  }, []);

  const onSizeGroupChange = (next: SizeGroup) => {
    setSizeGroup(next);
    const nextSizes =
      next === "bebe"
        ? SIZE_GROUP_BEBE.slice(0, 5)
        : SIZE_GROUP_NINIOS.slice(0, 4);
    setSizes(nextSizes);
    setStockBySize((prev) => initialStockFromSizes(nextSizes, prev));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = (ev) => resolve(ev.target?.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) => {
      setGallery((prev) => [...prev, ...urls]);
    });
    e.target.value = "";
  };

  const addColorVariant = () => {
    setColorVariants((prev) => [
      ...prev,
      { name: `Color ${prev.length + 1}`, hex: "#F5E6D3" },
    ]);
  };
  const removeColorVariant = (i: number) => {
    setColorVariants((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateColorVariant = (i: number, patch: Partial<ColorVariant>) => {
    setColorVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    );
  };

  const setFeatureAt = (i: number, value: string) => {
    setFeatures((prev) => prev.map((f, idx) => (idx === i ? value : f)));
  };
  const addFeature = () => setFeatures((prev) => [...prev, ""]);
  const removeFeature = (i: number) =>
    setFeatures((prev) => prev.filter((_, idx) => idx !== i));

  const addRelated = () => {
    const id = relatedInput.trim();
    if (!id) return;
    setRelatedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setRelatedInput("");
  };
  const removeRelated = (id: string) =>
    setRelatedIds((prev) => prev.filter((x) => x !== id));

  const discountPct =
    Number(originalPrice) > 0 && Number(price) > 0
      ? Math.round(
          ((Number(originalPrice) - Number(price)) / Number(originalPrice)) *
            100,
        )
      : 0;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !onSubmit) return;

    const data: ProductFormData = {
      id: initialData?.id || crypto.randomUUID(),
      slug: slug.trim() || undefined,
      name,
      tagline: tagline.trim() || undefined,
      imageSrc,
      gallery: gallery.length ? gallery : undefined,
      category,
      sizeGroup,
      sizes,
      stockBySize,
      stockTotal,
      soldTotal: Number(soldTotal) || 0,
      colorHex,
      colorVariants,
      description,
      features: features.filter((f) => f.trim().length > 0),
      price: Number(price) || 0,
      originalPrice: Number(originalPrice) || undefined,
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

  const baseLabel =
    "mb-1 block text-sm font-semibold tracking-tight text-tatan-primario1";

  return (
    <form
      onSubmit={handleSubmit}
      className={cx("w-full flex flex-col gap-6", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            {initialData?.id ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Campos con los mismos atributos que se renderizan en la web.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {slug ? (
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 font-mono">
              slug: {slug}
            </span>
          ) : null}
          {discountPct > 0 ? (
            <span className="inline-flex items-center rounded-full bg-tatan-acento-rosa/20 text-tatan-secundario2 px-2.5 py-1 font-bold">
              Oferta -{discountPct}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-3">
          <CustomInput
            label="Nombre del producto *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Body Osito Amor"
            required
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <CustomInput
              label="Tagline (badge chiquito)"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ej: Clásico del mes"
            />
            <CustomInput
              label="Slug / ID (ej: b-001)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Dejar vacío para autogenerar"
            />
          </div>
        </div>

        <div className="sm:col-span-2 paper-card rounded-2xl p-4 sm:p-5">
          <p className={`${baseLabel} mb-2`}>Imagen principal + galería</p>
          <div className="flex flex-wrap gap-4 sm:gap-6 items-start">
            <div className="flex items-start gap-4">
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt="Preview principal"
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-zinc-400">Sin imagen</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold tracking-tight text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] focus-within:ring-2 focus-within:ring-tatan-primario1">
                  <Upload className="w-4 h-4" />
                  <span>Subir principal</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
                <CustomInput
                  label="ó pega URL"
                  value={imageSrc}
                  onChange={(e) => setImageSrc(e.target.value)}
                  placeholder="https://..."
                  containerClassName="w-64"
                  inputClassName="text-xs"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Galería ({gallery.length})
                </p>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                  <Plus className="w-3 h-3" /> Agregar
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleGalleryUpload}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {gallery.length === 0 ? (
                  <span className="text-xs text-zinc-400 py-6 px-3 rounded-xl border border-dashed border-black/10 bg-white/50">
                    Sin fotos extra en galería
                  </span>
                ) : (
                  gallery.map((src, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-black/10 bg-white shadow-sm group"
                    >
                      <Image
                        src={src}
                        alt={`Galería ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGallery((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white items-center justify-center hidden group-hover:flex"
                        aria-label="Quitar imagen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className={baseLabel}>Categoría *</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={cx(
                    "h-9 px-3.5 rounded-xl border text-xs font-bold transition-colors",
                    active
                      ? "border-tatan-primario1 bg-tatan-primario1 text-zinc-900 shadow-sm"
                      : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-2 paper-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <p className={cx(baseLabel, "mb-0")}>Grupo de talles *</p>
              <div className="inline-flex rounded-xl bg-white border border-black/10 p-0.5">
                {(["bebe", "ninios"] as SizeGroup[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onSizeGroupChange(g)}
                    className={cx(
                      "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                      sizeGroup === g
                        ? "bg-tatan-primario1 text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800",
                    )}
                  >
                    {g === "bebe" ? "Bebé (RN a 24M)" : "Niños (2 a 10)"}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              Stock total calculado:{" "}
              <span className="font-extrabold text-zinc-900 tabular-nums">
                {stockTotal}
              </span>{" "}
              u.
            </div>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Tamaños disponibles (tocá para activar y cargar stock por talle)
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {sizeChoices.map((size) => {
              const isSelected = sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={cx(
                    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1",
                    isSelected
                      ? "border-tatan-primario1 bg-tatan-primario1 text-zinc-900 shadow-sm"
                      : "border-black/10 bg-white text-zinc-500 hover:bg-zinc-50",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {sizes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Stock por talle
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {sizes.map((s) => (
                  <CustomInput
                    key={s}
                    label={`Stock · Talle ${s}`}
                    type="number"
                    min="0"
                    value={String(stockBySize[s] ?? 0)}
                    onChange={(e) =>
                      setStockBySize((prev) => ({
                        ...prev,
                        [s]: Number(e.target.value) || 0,
                      }))
                    }
                    inputClassName="text-sm py-2"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <CustomInput
          label="Vendidos totales (histórico)"
          type="number"
          min="0"
          value={soldTotal}
          onChange={(e) => setSoldTotal(e.target.value)}
        />
        <CustomInput
          label="Cuotas sin interés (ej: 6)"
          type="number"
          min="1"
          max="24"
          value={installments}
          onChange={(e) => setInstallments(e.target.value)}
        />

        <CustomInput
          label="Precio actual (ARS) *"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          required
        />
        <CustomInput
          label="Precio original (antes de oferta)"
          type="number"
          min="0"
          value={originalPrice}
          onChange={(e) => setOriginalPrice(e.target.value)}
          placeholder="Vacío = sin oferta"
        />
        <CustomInput
          label="Precio libre de impuestos (taxFree)"
          type="number"
          min="0"
          value={taxFreePrice}
          onChange={(e) => setTaxFreePrice(e.target.value)}
        />

        <div className="paper-card rounded-2xl p-4 sm:p-5 sm:col-span-2">
          <p className={`${baseLabel} mb-3`}>Colores y variantes</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Color principal
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-xl border border-black/10 shadow-sm"
                    style={{ background: colorHex }}
                  />
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="h-9 w-14 rounded-lg cursor-pointer border border-black/10 bg-white p-1"
                  />
                  <input
                    type="text"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-28 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-mono text-zinc-700"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Variantes de color ({colorVariants.length})
                </p>
                <button
                  type="button"
                  onClick={addColorVariant}
                  className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Plus className="w-3 h-3" /> Agregar variante
                </button>
              </div>
              <div className="space-y-2">
                {colorVariants.length === 0 ? (
                  <span className="block text-xs text-zinc-400 py-4 px-3 rounded-xl border border-dashed border-black/10 bg-white/50">
                    Sin variantes adicionales
                  </span>
                ) : (
                  colorVariants.map((cv, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-xl bg-white border border-black/5 p-2"
                    >
                      <input
                        type="color"
                        value={cv.hex}
                        onChange={(e) =>
                          updateColorVariant(i, { hex: e.target.value })
                        }
                        className="h-8 w-10 rounded-md cursor-pointer border border-black/10 bg-white p-0.5"
                      />
                      <input
                        type="text"
                        value={cv.name}
                        onChange={(e) =>
                          updateColorVariant(i, { name: e.target.value })
                        }
                        placeholder="Nombre del color"
                        className="flex-1 min-w-[120px] rounded-md border border-black/10 bg-white px-2 py-1.5 text-xs text-zinc-700"
                      />
                      <span className="font-mono text-[11px] text-zinc-400 w-20">
                        {cv.hex}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeColorVariant(i)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-black/5 hover:text-zinc-800"
                        aria-label="Quitar color"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="paper-card rounded-2xl p-4 sm:p-5 sm:col-span-2">
          <p className={`${baseLabel} mb-3`}>Descripción larga</p>
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-zinc-50 px-2 py-2">
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1",
                  editor?.isActive("bold")
                    ? "border-tatan-primario1 bg-tatan-primario1 text-zinc-900 shadow-sm"
                    : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50",
                )}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={!editor?.can().chain().focus().toggleBold().run()}
              >
                B
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1",
                  editor?.isActive("italic")
                    ? "border-tatan-primario1 bg-tatan-primario1 text-zinc-900 shadow-sm"
                    : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50",
                )}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={!editor?.can().chain().focus().toggleItalic().run()}
              >
                I
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1",
                  editor?.isActive("strike")
                    ? "border-tatan-primario1 bg-tatan-primario1 text-zinc-900 shadow-sm"
                    : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50",
                )}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                disabled={!editor?.can().chain().focus().toggleStrike().run()}
              >
                S
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1",
                  editor?.isActive("bulletList")
                    ? "border-tatan-primario1 bg-tatan-primario1 text-zinc-900 shadow-sm"
                    : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50",
                )}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                • Lista
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1",
                  editor?.isActive("orderedList")
                    ? "border-tatan-primario1 bg-tatan-primario1 text-zinc-900 shadow-sm"
                    : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50",
                )}
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
              >
                1. Lista
              </button>
              <button
                type="button"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1"
                onClick={() => editorImageInputRef.current?.click()}
              >
                Imagen
              </button>
              <input
                ref={editorImageInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const src = event.target?.result as string | undefined;
                    if (!src) return;
                    editor?.chain().focus().setImage({ src }).run();
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().chain().focus().undo().run()}
                >
                  Deshacer
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().chain().focus().redo().run()}
                >
                  Rehacer
                </button>
              </div>
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="paper-card rounded-2xl p-4 sm:p-5 sm:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className={`${baseLabel} mb-0`}>
              Características (features · bullet points)
            </p>
            <button
              type="button"
              onClick={addFeature}
              className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <Plus className="w-3 h-3" /> Agregar ítem
            </button>
          </div>
          <div className="space-y-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-zinc-300 w-5 text-center text-xs">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={f}
                  onChange={(e) => setFeatureAt(i, e.target.value)}
                  placeholder="Ej: 100% Algodón orgánico peinado"
                  className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-tatan-primario1/40 focus:border-tatan-primario1"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  disabled={features.length <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-black/5 hover:text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Quitar característica"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <CustomInput
          label="Rating estrellas (0.0 a 5.0)"
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
        <CustomInput
          label="Cantidad de reseñas"
          type="number"
          min="0"
          value={reviews}
          onChange={(e) => setReviews(e.target.value)}
        />

        <div className="sm:col-span-2 flex items-center gap-6 pt-1 pb-1 flex-wrap">
          <label className="inline-flex items-center gap-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={showPointsBadge}
              onChange={(e) => setShowPointsBadge(e.target.checked)}
              className="h-4 w-4 accent-[#FCD1B1]"
            />
            <span className="text-sm text-zinc-700 font-medium">
              Mostrar badge &ldquo;Puntos Tatan&rdquo;
            </span>
          </label>
        </div>

        <div className="paper-card rounded-2xl p-4 sm:p-5 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className={`${baseLabel} mb-0`}>Productos relacionados (IDs)</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={relatedInput}
                onChange={(e) => setRelatedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRelated();
                  }
                }}
                placeholder="ej: b-002"
                className="w-40 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-zinc-700"
              />
              <button
                type="button"
                onClick={addRelated}
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {relatedIds.length === 0 ? (
              <span className="text-xs text-zinc-400 py-3 px-3 rounded-xl border border-dashed border-black/10 bg-white/50">
                Sin productos relacionados asociados
              </span>
            ) : (
              relatedIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full bg-tatan-primario1/60 text-zinc-800 font-mono text-xs px-3 py-1 border border-tatan-secundario1/60"
                >
                  {id}
                  <button
                    type="button"
                    onClick={() => removeRelated(id)}
                    className="text-zinc-600 hover:text-zinc-900"
                    aria-label={`Quitar ${id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-black/5 pt-6">
        {onCancel && (
          <CustomButton type="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </CustomButton>
        )}
        <CustomButton htmlType="submit" disabled={submitting}>
          {submitting
            ? initialData?.id
              ? "Guardando…"
              : "Creando…"
            : initialData?.id
              ? "Guardar cambios"
              : "Crear producto"}
        </CustomButton>
      </div>
    </form>
  );
}
