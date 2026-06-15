import CustomButton from "@/components/ui/CustomButton";
import Card from "@/components/ui/Card";
import CustomInput from "@/components/ui/CustomInput";
import Header from "@/components/ui/Header";
import Image from "next/image";

export default function Home() {
  const products = [
    {
      id: "p-001",
      name: "Body algodón manga corta",
      imageSrc: "/tatanLogo.png",
      price: 14990,
      badge: "Nuevo",
    },
    {
      id: "p-002",
      name: "Pijama enterito",
      imageSrc: "/tatanLogo.png",
      price: 21990,
      originalPrice: 25990,
      badge: "Top ventas",
    },
    {
      id: "p-003",
      name: "Gorrito tejido",
      imageSrc: "/tatanLogo.png",
      price: 8990,
    },
    {
      id: "p-004",
      name: "Manta suave",
      imageSrc: "/tatanLogo.png",
      price: 18990,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-b from-[#FFF7F0] via-white to-[#F7FBFF]">
      <Header />
      <main className="w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Image
          className="mx-auto"
          src="/tatanLogo.png"
          alt="Tatan logo"
          width={200}
          height={40}
          priority
        />
        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="inline-flex items-center rounded-full border border-[#FCD1B1] bg-[#FCD1B1]/20 px-3 py-1 text-xs font-semibold text-zinc-800">
              Playground
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Esta página actualmente es solo para probar componentes.
            </h1>
            <p className="text-sm text-zinc-500">
              Más adelante va a tener el contenido real de la web.
            </p>
          </div>

          {/* Aca podes agregar componentes para renderizarlos y probarlos */}
          <CustomInput
            label="Email"
            placeholder="Ingresa tu correo electrónico"
            className="w-full"
          />
          <CustomInput
            label="Password"
            placeholder="Ingresa tu contraseña"
            className="w-full"
            type="password"
          />

          <div className="flex justify-center flex-col items-center w-full gap-5">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              TIPOS DE BOTONES
            </h2>
            <CustomButton className="w-full" type="filled">
              filled
            </CustomButton>
            <CustomButton className="w-full" type="ghost">
              ghost
            </CustomButton>
            <CustomButton className="w-full" type="outline">
              outline
            </CustomButton>
            <div className="w-full flex justify-center">
              <CustomButton type="text">text</CustomButton>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Productos
            </h2>
            <p className="text-sm text-zinc-500">
              Ejemplo visual con productos hardcodeados.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <Card
                key={p.id}
                name={p.name}
                imageSrc={p.imageSrc}
                price={p.price}
                originalPrice={p.originalPrice}
                badge={p.badge}
                href={`/product/${p.id}`}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
