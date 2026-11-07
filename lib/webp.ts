/**
 * Las imágenes subidas con versión WebP terminan en "-w.jpg" / "-w.png" y
 * tienen al lado su "-w.webp". Devuelve esa URL, o null si no tiene.
 */
export function webpFor(src: string | undefined | null): string | null {
  if (!src) return null;
  const m = src.match(/^(.*-w)\.(jpe?g|png)(\?.*)?$/i);
  return m ? `${m[1]}.webp${m[3] ?? ""}` : null;
}
