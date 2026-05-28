"use client";

import * as React from "react";
import Image from "next/image";
import CustomButton from "@/components/ui/CustomButton";
import ProductForm, { ProductFormData } from "@/components/ui/ProductForm";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export type ProductCrm = {
  id: string;
  name: string;
  imageSrc: string;
  imageAlt?: string;
  stockBySize: Record<string, number>;
  soldTotal: number;
  price: number;
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

const DEFAULT_PRODUCTS: ProductCrm[] = [
  {
    id: "1",
    name: "Body algodón manga corta",
    imageSrc: "/tatanLogo.png",
    imageAlt: "Body algodón manga corta",
    stockBySize: { RN: 6, "0-3": 12, "3-6": 9, "6-9": 4 },
    soldTotal: 38,
    price: 14990,
  },
  {
    id: "2",
    name: "Pijama enterito",
    imageSrc: "/tatanLogo.png",
    imageAlt: "Pijama enterito",
    stockBySize: { "0-3": 3, "3-6": 6, "6-9": 1, "9-12": 0 },
    soldTotal: 21,
    price: 21990,
  },
  {
    id: "3",
    name: "Gorrito tejido",
    imageSrc: "/tatanLogo.png",
    imageAlt: "Gorrito tejido",
    stockBySize: { RN: 10, "0-3": 7, "3-6": 2 },
    soldTotal: 9,
    price: 8990,
  },
];

export default function ProductsCrm({
  products = DEFAULT_PRODUCTS,
  className,
}: ProductsCrmProps) {
  const [editingProduct, setEditingProduct] = React.useState<ProductCrm | null>(
    null,
  );
  const [isCreating, setIsCreating] = React.useState(false);

  if (isCreating) {
    return (
      <section id="productos" className={cx("w-full scroll-mt-20", className)}>
        <ProductForm
          onSubmit={(data) => {
            console.log("Producto creado:", data);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      </section>
    );
  }

  if (editingProduct) {
    const initialData: Partial<ProductFormData> = {
      id: editingProduct.id,
      name: editingProduct.name,
      imageSrc: editingProduct.imageSrc,
      price: editingProduct.price,
      discount: 0,
      discountCode: "",
      stockTotal: sum(Object.values(editingProduct.stockBySize)),
      sizes: Object.keys(editingProduct.stockBySize),
    };

    return (
      <section id="productos" className={cx("w-full scroll-mt-20", className)}>
        <ProductForm
          initialData={initialData}
          onSubmit={(data) => {
            console.log("Producto guardado:", data);
            setEditingProduct(null);
          }}
          onCancel={() => setEditingProduct(null)}
        />
      </section>
    );
  }

  return (
    <section id="productos" className={cx("w-full scroll-mt-20", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              Productos
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Lista de productos con stock, talles, ventas y precio.
            </p>
          </div>
          <CustomButton onClick={() => setIsCreating(true)}>
            Crear producto
          </CustomButton>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs font-semibold text-zinc-500">
                <th className="px-4 py-3 font-medium">Foto</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Stock total</th>
                <th className="px-4 py-3 font-medium">Vendidos</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {products.map((p) => {
                const totalStock = sum(Object.values(p.stockBySize));
                return (
                  <tr
                    key={p.id}
                    className="align-middle transition hover:bg-zinc-50/50"
                  >
                    <td className="px-4 py-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                        <Image
                          src={p.imageSrc}
                          alt={p.imageAlt ?? p.name}
                          fill
                          sizes="80px"
                          className="object-contain p-1"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[280px] text-sm font-semibold text-zinc-900">
                        {p.name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold tabular-nums text-zinc-900">
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold tabular-nums text-zinc-900">
                        {p.soldTotal}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold tabular-nums text-zinc-900">
                        {formatMoneyArs(p.price)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <CustomButton
                          type="outline"
                          className="w-28 text-xs py-1.5"
                          onClick={() => setEditingProduct(p)}
                        >
                          Editar
                        </CustomButton>
                        <CustomButton
                          type="ghost"
                          className="w-28 text-xs py-1.5"
                          onClick={() => console.log("Detalles", p.id)}
                        >
                          Más detalles
                        </CustomButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
