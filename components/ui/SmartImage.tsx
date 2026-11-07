import Image, { type ImageProps } from "next/image";

/**
 * Wrapper de next/image para fotos de la tienda. La optimización de Next ya
 * entrega AVIF/WebP achicada al tamaño justo, así que no hace falta ofrecer
 * la "-w.webp" de Ferozo con <picture> (esa es de 1600 px y saltea la CDN).
 */
export default function SmartImage({ alt, ...props }: ImageProps) {
  return <Image alt={alt} {...props} />;
}
