import type { BuyOptions } from "@/lib/buy-options";
import type { Wholesale } from "@/lib/wholesale";

export interface ProductCardProps {
  id?: string | number;
  imageSrc?: string;
  title?: string;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  installments?: number;
  installmentPrice?: number;
  taxFreePrice?: number;
  showPointsBadge?: boolean;
  colorHex?: string;
  productUrl?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
  /** Etiqueta arriba a la izquierda ("Nuevo", "Top"...). Se oculta si hay % OFF. */
  badge?: string;
  /** Colores disponibles (se muestran como puntitos, máx. 4). */
  colors?: string[];
  /** Sin stock en ningún talle. */
  soldOut?: boolean;
  /** Si viene, muestra un botón que invita a entrar al producto. */
  ctaLabel?: string;
  /** Frase corta debajo del nombre ("100% Algodón"). */
  tagline?: string;
  /** Si viene, la card permite elegir talle/color y agregar al carrito. */
  buy?: BuyOptions;
  /** Fotos extra (galería). Con más de una, la card permite pasarlas. */
  images?: string[];
  /** Precio por mayor (si no viene, se toma de `buy`) */
  wholesale?: Wholesale;
  /** Número de artículo del producto (para el carrito) */
  sku?: string;
}