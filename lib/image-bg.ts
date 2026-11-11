/**
 * Color de fondo de una foto de producto, leído de los píxeles del borde.
 *
 * Las fotos vienen recortadas al ras de la prenda y cada una tiene su gris de
 * estudio. Para mostrarlas enteras (object-contain + aire alrededor) el recuadro
 * se pinta con el mismo color del borde de la foto, así no se nota dónde
 * termina la imagen.
 *
 * Se lee en el navegador con un canvas chico. Funciona porque next/image sirve
 * la foto desde el propio dominio (/_next/image); si el canvas queda bloqueado
 * por CORS, o la foto tiene fondo transparente, devuelve null.
 */

const cache = new Map<string, string | null>();

export function cachedImageBg(src: string): string | null | undefined {
  return cache.get(src);
}

export function readImageBg(src: string, img: HTMLImageElement): string | null {
  if (cache.has(src)) return cache.get(src)!;
  let color: string | null = null;
  try {
    const S = 32;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, S, S);
      const { data } = ctx.getImageData(0, 0, S, S);
      const r: number[] = [];
      const g: number[] = [];
      const b: number[] = [];
      let transparent = 0;
      let total = 0;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          // Solo las dos filas/columnas del borde
          if (x > 1 && x < S - 2 && y > 1 && y < S - 2) continue;
          const i = (y * S + x) * 4;
          total++;
          if (data[i + 3] < 200) {
            transparent++;
            continue;
          }
          r.push(data[i]);
          g.push(data[i + 1]);
          b.push(data[i + 2]);
        }
      }
      // Fondo transparente (p. ej. un PNG recortado): sin color propio
      if (transparent < total / 2 && r.length) {
        const med = (a: number[]) => a.sort((m, n) => m - n)[a.length >> 1];
        color = `rgb(${med(r)}, ${med(g)}, ${med(b)})`;
      }
    }
  } catch {
    color = null; // canvas bloqueado (CORS)
  }
  cache.set(src, color);
  return color;
}
