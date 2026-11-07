"use client";

import { useState } from "react";
import type { ImageProps } from "next/image";
import SmartImage from "@/components/ui/SmartImage";
import MissingPhoto from "@/components/ui/MissingPhoto";
import { isPlaceholderImage } from "@/lib/is-placeholder";

/**
 * Foto de producto: si no hay foto (o es la genérica del logo) o si no carga,
 * muestra el aviso "¡Ups! La foto se perdió" dentro del mismo recuadro.
 * Pensada para usarse con `fill` dentro de un contenedor posicionado.
 */
export default function ProductPhoto({
  compact = false,
  ...props
}: ImageProps & { compact?: boolean }) {
  const src = typeof props.src === "string" ? props.src : "";
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || isPlaceholderImage(src) || failed === src) {
    return <MissingPhoto compact={compact} />;
  }
  return (
    <SmartImage
      {...props}
      onError={() => setFailed(src)}
    />
  );
}
