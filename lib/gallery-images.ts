/**
 * Fotos de la galería de un producto sin repetir.
 *
 * Dos fotos son la misma si tienen el mismo nombre de archivo original
 * (ver imageKey), aunque la dirección cambie. Si una foto del
 * producto también es la foto de un color, queda una sola, en el lugar
 * donde aparecía primero, pero con la dirección del color: así, al elegir
 * ese color, la galería la encuentra y la muestra.
 */

/** Nombre del archivo (sin carpetas, ?query ni #hash), en minúsculas */
export function imageFileName(src: string): string {
  const clean = src.trim().split(/[?#]/)[0];
  const name = clean.slice(clean.lastIndexOf("/") + 1);
  try {
    return decodeURIComponent(name).toLowerCase();
  } catch {
    return name.toLowerCase();
  }
}

/**
 * Con qué se compara una foto para saber si está repetida.
 *
 * Las fotos subidas desde el CRM se guardan como
 * "20261113-<código al azar>--<nombre original>(-w).jpg" (php-api/upload.php):
 * la misma foto subida dos veces tiene distinto código pero el mismo nombre
 * original, y eso es lo que se compara. Las fotos viejas (sin nombre
 * original) se comparan por el nombre de archivo completo.
 */
export function imageKey(src: string): string {
  const file = imageFileName(src);
  const m = file.match(/^\d{8}-[0-9a-f]{16}--(.+?)(?:-w)?\.[a-z0-9]+$/);
  return m ? `original:${m[1]}` : file;
}

export function galleryImages(
  /** Foto principal y galería, en orden */
  productImages: Array<string | null | undefined>,
  /** Fotos de los colores (van al final si no estaban ya) */
  colorImages: Array<string | null | undefined> = [],
): string[] {
  const out: string[] = [];
  const indexByName = new Map<string, number>();

  for (const src of productImages) {
    if (!src) continue;
    const key = imageKey(src);
    if (indexByName.has(key)) continue;
    indexByName.set(key, out.length);
    out.push(src);
  }
  for (const src of colorImages) {
    if (!src) continue;
    const key = imageKey(src);
    const at = indexByName.get(key);
    if (at === undefined) {
      indexByName.set(key, out.length);
      out.push(src);
    } else {
      // Ya estaba como foto del producto: se usa la del color en su lugar
      out[at] = src;
    }
  }
  return out;
}
