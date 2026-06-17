import CustomButton from "@/components/ui/CustomButton";
import Header from "@/components/ui/Header";
import Image from "next/image";
import Link from "next/link";

type CartItem = {
  id: string;
  name: string;
  imageSrc: string;
  variant?: string;
  size?: string;
  unitPrice: number;
  quantity: number;
};

type RecommendedProduct = {
  id: string;
  name: string;
  imageSrc: string;
  price: number;
  badge?: string;
};

function formatMoneyArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

const DEFAULT_ITEMS: CartItem[] = [
  {
    id: "p-001",
    name: "Body algodón manga corta",
    imageSrc: "/tatanLogo.png",
    variant: "Natural",
    size: "0-3",
    unitPrice: 14990,
    quantity: 2,
  },
  {
    id: "p-002",
    name: "Pijama enterito",
    imageSrc: "/tatanLogo.png",
    variant: "Estampado",
    size: "3-6",
    unitPrice: 21990,
    quantity: 1,
  },
];

const DEFAULT_RECOMMENDED: RecommendedProduct[] = [
  {
    id: "r-001",
    name: "Gorrito tejido",
    imageSrc: "/tatanLogo.png",
    price: 8990,
    badge: "Nuevo",
  },
  {
    id: "r-002",
    name: "Babero impermeable",
    imageSrc: "/tatanLogo.png",
    price: 6990,
    badge: "Top ventas",
  },
  {
    id: "r-003",
    name: "Pack medias x3",
    imageSrc: "/tatanLogo.png",
    price: 7990,
  },
  {
    id: "r-004",
    name: "Manta suave",
    imageSrc: "/tatanLogo.png",
    price: 18990,
  },
];

export default function Cart() {
  const items = DEFAULT_ITEMS;
  const recommended = DEFAULT_RECOMMENDED;

  const subtotal = items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-[#FFF7F0] via-white to-[#F7FBFF]">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Carrito
          </h1>
          <p className="text-sm text-zinc-500">
            Revisá tus productos antes de pagar.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section
            className="rounded-2xl border border-black/5 bg-[#FEFDF8]/80 p-5 shadow-sm backdrop-blur"
            aria-label="Productos del carrito"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                Productos ({items.length})
              </h2>
              <Link
                href="/"
                className="text-sm font-semibold text-zinc-900 underline decoration-tatan-primario1 underline-offset-4 hover:opacity-80"
              >
                Seguir comprando
              </Link>
            </div>

            <div className="mt-4 divide-y divide-black/5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                      <Image
                        src={item.imageSrc}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                        priority={false}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">
                        {item.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
                        {item.variant ? (
                          <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-1">
                            {item.variant}
                          </span>
                        ) : null}
                        {item.size ? (
                          <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-1">
                            Talle {item.size}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm font-semibold tabular-nums text-zinc-900">
                        {formatMoneyArs(item.unitPrice)}
                        <span className="ml-1 text-xs font-semibold text-zinc-500">
                          / unidad
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="inline-flex items-center rounded-xl border border-black/10 bg-white p-1 shadow-sm">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-900 transition hover:bg-zinc-50 active:scale-[0.98]"
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <div className="min-w-10 px-2 text-center text-sm font-semibold tabular-nums text-zinc-900">
                        {item.quantity}
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-900 transition hover:bg-zinc-50 active:scale-[0.98]"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums text-zinc-900">
                        {formatMoneyArs(item.unitPrice * item.quantity)}
                      </div>
                      <button
                        type="button"
                        className="mt-1 text-xs font-semibold text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-black/5 bg-[#FEFDF8]/80 p-5 shadow-sm backdrop-blur lg:sticky lg:top-24">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">
              Resumen
            </h2>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-600">Subtotal</span>
                <span className="font-semibold tabular-nums text-zinc-900">
                  {formatMoneyArs(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-600">Envío</span>
                <span className="font-semibold tabular-nums text-zinc-900">
                  {shipping === 0 ? "A calcular" : formatMoneyArs(shipping)}
                </span>
              </div>
              <div className="h-px w-full bg-black/10" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-900">Total</span>
                <span className="text-lg font-bold tabular-nums text-zinc-900">
                  {formatMoneyArs(total)}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <CustomButton className="w-full" type="filled">
                Pagar con tarjeta
              </CustomButton>
              <CustomButton className="w-full" type="outline">
                Pagar con transferencia
              </CustomButton>
            </div>

            <div className="mt-4 rounded-xl border border-tatan-primario1 bg-tatan-primario1/15 p-3 text-xs font-semibold text-zinc-700">
              Pagos y envío todavía son de muestra. Más adelante se conecta con
              Mercado Pago y cálculo de envío.
            </div>
          </aside>
        </div>

        <section className="mt-10" aria-label="Recomendados">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                También recomendamos
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Sumá algo más antes de finalizar la compra.
              </p>
            </div>
            <Link
              href="/"
              className="hidden text-sm font-semibold text-zinc-900 underline decoration-tatan-primario1 underline-offset-4 hover:opacity-80 sm:inline"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-black/5 bg-[#FEFDF8]/80 p-4 shadow-sm backdrop-blur"
              >
                <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                  <div className="relative h-40 w-full">
                    <Image
                      src={p.imageSrc}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 260px, (min-width: 640px) 50vw, 100vw"
                      className="object-contain p-2"
                    />
                  </div>
                  {p.badge ? (
                    <span className="absolute left-2 top-2 inline-flex items-center rounded-full border border-tatan-primario1 bg-tatan-primario1 px-2 py-1 text-[11px] font-bold text-zinc-900 shadow-sm">
                      {p.badge}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <div className="text-sm font-semibold text-zinc-900">
                    {p.name}
                  </div>
                  <div className="text-sm font-bold tabular-nums text-zinc-900">
                    {formatMoneyArs(p.price)}
                  </div>
                  <CustomButton className="w-full" type="ghost">
                    Agregar al carrito
                  </CustomButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
