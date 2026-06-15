import CustomButton from "@/components/ui/CustomButton";
import Header from "@/components/ui/Header";
import Image from "next/image";
import Link from "next/link";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

function formatMoneyArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

const PRODUCTS: Record<
  string,
  { id: string; name: string; imageSrc: string; price: number }
> = {
  "p-001": {
    id: "p-001",
    name: "Body algodón manga corta",
    imageSrc: "/tatanLogo.png",
    price: 14990,
  },
  "p-002": {
    id: "p-002",
    name: "Pijama enterito",
    imageSrc: "/tatanLogo.png",
    price: 21990,
  },
  "p-003": {
    id: "p-003",
    name: "Gorrito tejido",
    imageSrc: "/tatanLogo.png",
    price: 8990,
  },
  "p-004": {
    id: "p-004",
    name: "Manta suave",
    imageSrc: "/tatanLogo.png",
    price: 18990,
  },
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = PRODUCTS[id] ?? {
    id,
    name: `Producto ${id}`,
    imageSrc: "/tatanLogo.png",
    price: 0,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-[#FFF7F0] via-white to-[#F7FBFF]">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-900 underline decoration-[#FCD1B1] underline-offset-4 hover:opacity-80"
          >
            Volver
          </Link>
          <Link
            href="/cart"
            className="text-sm font-semibold text-zinc-900 underline decoration-[#FCD1B1] underline-offset-4 hover:opacity-80"
          >
            Ir al carrito
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-black/5 bg-[#FEFDF8]/80 p-5 shadow-sm backdrop-blur">
            <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
              <div className="relative h-80 w-full">
                <Image
                  src={product.imageSrc}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 640px, 100vw"
                  className="object-contain p-6"
                />
              </div>
              <span className="absolute bottom-3 right-3 inline-flex items-center rounded-xl border border-black/10 bg-white/95 px-3 py-1.5 text-base font-bold tabular-nums text-zinc-900 shadow-sm backdrop-blur">
                {formatMoneyArs(product.price)}
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Página de producto visual (hardcodeado). Después se reemplaza por
              datos reales.
            </p>
          </section>

          <aside className="h-fit rounded-2xl border border-black/5 bg-[#FEFDF8]/80 p-5 shadow-sm backdrop-blur lg:sticky lg:top-24">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">
              Comprar
            </h2>
            <div className="mt-4 grid gap-2">
              <CustomButton className="w-full" type="filled">
                Agregar al carrito
              </CustomButton>
              <CustomButton className="w-full" type="outline">
                Comprar ahora
              </CustomButton>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

