"use client";

import CustomButton from "@/components/ui/CustomButton";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CrmPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-b from-[#FFF7F0] via-white to-[#F7FBFF] px-4 py-10">
      <main className="w-full max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <Image
            className="mx-auto"
            src="/tatanLogo.png"
            alt="Tatan"
            width={200}
            height={40}
            priority
          />
          <span className="mt-5 inline-flex items-center rounded-full border border-[#FCD1B1] bg-[#FCD1B1]/20 px-3 py-1 text-xs font-semibold text-zinc-800">
            CRM
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
            Panel del CRM
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ruta creada. Acá va a vivir el dashboard del CRM.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <CustomButton type="outline" onClick={() => router.push("/")}>
            Ir al sitio
          </CustomButton>
        </div>
      </main>
    </div>
  );
}
