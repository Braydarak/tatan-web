"use client";

import * as React from "react";
import Image from "next/image";
import CustomInput from "@/components/ui/CustomInput";
import CustomButton from "@/components/ui/CustomButton";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

const AVAILABLE_SIZES = [
  "RN",
  "0-3",
  "3-6",
  "6-9",
  "9-12",
  "12-18",
  "18-24",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
];

export type ProductFormData = {
  id?: string;
  name: string;
  imageSrc: string;
  description: string;
  price: number;
  discount: number;
  discountCode: string;
  stockTotal: number;
  sizes: string[];
};

export type ProductFormProps = {
  initialData?: Partial<ProductFormData>;
  onSubmit?: (data: ProductFormData) => void;
  onCancel?: () => void;
  className?: string;
};

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  className,
}: ProductFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [imageSrc, setImageSrc] = React.useState(initialData?.imageSrc ?? "");
  const [description, setDescription] = React.useState(
    initialData?.description ?? "",
  );
  const [price, setPrice] = React.useState(
    initialData?.price?.toString() ?? "",
  );
  const [discount, setDiscount] = React.useState(
    initialData?.discount?.toString() ?? "",
  );
  const [discountCode, setDiscountCode] = React.useState(
    initialData?.discountCode ?? "",
  );
  const [stockTotal, setStockTotal] = React.useState(
    initialData?.stockTotal?.toString() ?? "",
  );
  const [sizes, setSizes] = React.useState<string[]>(initialData?.sizes ?? []);
  const editorImageInputRef = React.useRef<HTMLInputElement | null>(null);

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
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onSubmit) return;

    const data: ProductFormData = {
      id: initialData?.id || crypto.randomUUID(),
      name,
      imageSrc,
      description,
      price: Number(price) || 0,
      discount: Number(discount) || 0,
      discountCode,
      stockTotal: Number(stockTotal) || 0,
      sizes,
    };
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cx("w-full flex flex-col gap-6", className)}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">
          {initialData?.id ? "Editar Producto" : "Nuevo Producto"}
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <CustomInput
            label="Nombre del producto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Body algodón manga corta"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold tracking-tight text-tatan-primario1">
            Imagen del producto
          </label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-10">
            <div className="flex items-center gap-4">
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt="Vista previa"
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-zinc-400">Sin imagen</span>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold tracking-tight text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] focus-within:ring-2 focus-within:ring-tatan-primario1">
                <span>Subir foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <div className="min-w-0 flex-1 sm:pt-1">
              <label className="mb-2 block text-sm font-semibold tracking-tight text-tatan-primario1">
                Talles disponibles
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SIZES.map((size) => {
                  const isSelected = sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={cx(
                        "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1",
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
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold tracking-tight text-tatan-primario1">
            Descripción
          </label>
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

        <CustomInput
          label="Precio (ARS)"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          required
        />

        <CustomInput
          label="Stock Total"
          type="number"
          min="0"
          value={stockTotal}
          onChange={(e) => setStockTotal(e.target.value)}
          placeholder="0"
          required
        />

        <CustomInput
          label="Descuento (%)"
          type="number"
          min="0"
          max="100"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          placeholder="0"
        />

        <CustomInput
          label="Código de descuento"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="Ej: TATAN10"
        />
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-black/5 pt-6">
        {onCancel && (
          <CustomButton type="outline" onClick={onCancel}>
            Cancelar
          </CustomButton>
        )}
        <CustomButton htmlType="submit">
          {initialData?.id ? "Guardar cambios" : "Crear producto"}
        </CustomButton>
      </div>
    </form>
  );
}
