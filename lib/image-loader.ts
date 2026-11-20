/**
 * Cargador de imágenes de next/image para la web estática (sin Node).
 *
 * Las fotos subidas desde el CRM (/api/uploads/...) se piden a
 * /api/img.php, que las achica al ancho justo y las pasa a WebP (ver
 * php-api/img.php). El resto (logos y archivos de /public) se usan tal cual.
 */

const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://tatankids.com.ar/api").replace(/\/$/, "");

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const m = src.match(/^(?:https?:\/\/(?:www\.)?tatankids\.com\.ar)?\/api\/uploads\/([^?#]+\.(?:jpe?g|png|webp))$/i);
  if (!m) return src;
  return `${API}/img.php?f=${encodeURIComponent(m[1]).replace(/%2F/g, "/")}&w=${width}&q=${quality ?? 75}`;
}
