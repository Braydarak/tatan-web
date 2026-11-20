import Image from "next/image";
import MercadoPagoSvg from "@/assets/svg/mercadoPago";
import EnviopackSvg from "@/assets/svg/enviopack";

/**
 * Logos de las marcas con las que trabaja la tienda (Mercado Pago, Enviopack,
 * Pago Fácil, Rapipago), sueltos (sin recuadro) y todos del mismo alto.
 *
 * `brandsIn(...)` mira qué marcas se nombran en un texto: así los logos
 * aparecen solos al lado de lo que se escribe en el CRM (si un texto deja de
 * nombrar a Rapipago, su logo deja de mostrarse).
 */

export type Brand = "mercadopago" | "enviopack" | "pagofacil" | "rapipago";

const PATTERNS: Array<[Brand, RegExp]> = [
  ["mercadopago", /mercado\s*pago/i],
  ["enviopack", /env[ií]o\s*pack/i],
  ["rapipago", /rapi\s*pago/i],
  ["pagofacil", /pago\s*f[aá]cil/i],
];

/** Logo de Rapipago (letras en azul oscuro para leerse sobre fondo claro) */
const RAPIPAGO_SRC = "/logos/rapipago.png";

/** Marcas nombradas en los textos, sin repetir y en un orden fijo */
export function brandsIn(...texts: Array<string | null | undefined>): Brand[] {
  const all = texts.filter(Boolean).join(" ");
  return PATTERNS.filter(([, re]) => re.test(all)).map(([b]) => b);
}

/** Caja invisible del mismo alto para todos los logos (sin fondo ni borde) */
function Chip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex h-8 shrink-0 items-center justify-center overflow-hidden"
      title={label}
    >
      {children}
    </span>
  );
}

function Logo({ brand }: { brand: Brand }) {
  switch (brand) {
    case "mercadopago":
      return (
        <Chip label="Mercado Pago">
          {/* El dibujo trae mucho margen: se agranda y se recorta con la caja */}
          <MercadoPagoSvg className="-my-6 h-20 w-20" color="brand" title="Mercado Pago" />
        </Chip>
      );
    case "enviopack":
      return (
        <Chip label="Enviopack">
          <EnviopackSvg className="h-3.5 w-auto" title="Enviopack" />
        </Chip>
      );
    case "pagofacil":
      return (
        <Chip label="Pago Fácil">
          <Image
            src="/logos/pagofacil.svg"
            alt="Pago Fácil"
            width={24}
            height={24}
            unoptimized
            className="h-6 w-6"
          />
        </Chip>
      );
    case "rapipago":
      return (
        <Chip label="Rapipago">
          <Image
            src={RAPIPAGO_SRC}
            alt="Rapipago"
            width={72}
            height={16}
            unoptimized
            className="h-4 w-auto"
          />
        </Chip>
      );
  }
}

export default function BrandLogos({
  brands,
  className,
}: {
  brands: Brand[];
  className?: string;
}) {
  if (brands.length === 0) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 ${className ?? ""}`}>
      {brands.map((b) => (
        <Logo key={b} brand={b} />
      ))}
    </span>
  );
}
