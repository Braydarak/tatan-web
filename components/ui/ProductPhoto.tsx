"use client";

import { useState } from "react";
import type { ImageProps } from "next/image";
import SmartImage from "@/components/ui/SmartImage";
import MissingPhoto from "@/components/ui/MissingPhoto";
import { isPlaceholderImage } from "@/lib/is-placeholder";
import { cachedImageBg, readImageBg } from "@/lib/image-bg";

/**
 * Foto de producto: si no hay foto (o es la genérica del logo) o si no carga,
 * muestra el aviso "¡Ups! La foto se perdió" dentro del mismo recuadro.
 * Pensada para usarse con `fill` dentro de un contenedor posicionado.
 *
 * `framed`: la foto se ve entera (object-contain) con aire alrededor, y el
 * recuadro se pinta con el color de fondo de la propia foto. Así no se corta
 * la prenda en ningún tamaño de pantalla. El aire se pasa en `className`
 * (p. ej. "p-[7%]").
 */
export default function ProductPhoto({
  compact = false,
  framed = false,
  ...props
}: ImageProps & { compact?: boolean; framed?: boolean }) {
  const src = typeof props.src === "string" ? props.src : "";
  const [failed, setFailed] = useState<string | null>(null);
  const [bg, setBg] = useState<{ src: string; color: string | null } | null>(null);

  if (!src || isPlaceholderImage(src) || failed === src) {
    return <MissingPhoto compact={compact} />;
  }

  const image = (
    <SmartImage
      {...props}
      onError={() => setFailed(src)}
      onLoad={(e) => {
        props.onLoad?.(e);
        if (framed) {
          setBg({ src, color: readImageBg(src, e.currentTarget) });
        }
      }}
    />
  );
  if (!framed) return image;

  const color = bg?.src === src ? bg.color : cachedImageBg(src);
  return (
    <div
      className="absolute inset-0 transition-colors duration-300"
      style={color ? { backgroundColor: color } : undefined}
    >
      {image}
    </div>
  );
}
