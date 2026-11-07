/**
 * ¿Es la imagen de relleno (logo de Tatan) y no una foto real del producto?
 * Las fotos reales llenan todo el cuadro; el logo va con aire alrededor.
 */
export function isPlaceholderImage(src: string | undefined | null): boolean {
  if (!src) return true;
  return /tatanlogo|tatan-logo|text_to_image/i.test(src);
}
