import CustomInput from "@/components/ui/CustomInput";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-b from-[#FFF7F0] via-white to-[#F7FBFF] px-4 py-10 sm:px-6">
      <main className="w-full max-w-3xl py-8">
        <Image
          className="mx-auto"
          src="/tatan-logo.png"
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
        </div>
      </main>
    </div>
  );
}
