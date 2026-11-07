import Image, { type ImageProps } from "next/image";
import { webpFor } from "@/lib/webp";

/**
 * Igual que next/image, pero si la foto tiene versión WebP la ofrece con
 * <picture>: los navegadores que entienden WebP bajan la liviana y el resto
 * usa el JPEG/PNG de siempre.
 */
export default function SmartImage({ alt, ...props }: ImageProps) {
  const src = typeof props.src === "string" ? props.src : null;
  const webp = webpFor(src);
  if (!webp) return <Image alt={alt} {...props} />;
  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <Image alt={alt} {...props} />
    </picture>
  );
}
