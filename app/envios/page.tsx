import type { Metadata } from "next";
import EnviosView from "@/components/pages/EnviosView";
import type { EnviosData } from "@/components/sections/EnviosEditor";

export const metadata: Metadata = {
  title: "Envíos y pagos",
  description:
    "Cómo funcionan los envíos y los pagos en Tatan: envíos a todo el país a domicilio o a sucursal, y pagos con Mercado Pago en cuotas, débito o efectivo.",
  alternates: { canonical: "/envios" },
};

const PHP_API_BASE = "https://tatankids.com.ar/api";

async function fetchEnviosSSR(): Promise<EnviosData | null> {
  try {
    const res = await fetch(`${PHP_API_BASE}/site-content.php?key=envios`, {
      next: { revalidate: 60, tags: ["tatan-site-content"] },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; data?: EnviosData };
    return json?.ok && json.data ? json.data : null;
  } catch {
    return null;
  }
}

/** Envíos y pagos: se arma al compilar y se actualiza en vivo en el navegador */
export default async function EnviosPage() {
  return <EnviosView initial={await fetchEnviosSSR()} />;
}
