"use client";

/**
 * Comprime una imagen en el navegador antes de subirla:
 *  - la achica a 1600 px como máximo (lado más largo),
 *  - genera una versión "de respaldo" (JPEG, o PNG si tiene transparencia),
 *  - y una versión WebP, mucho más liviana, si el navegador sabe crearla.
 * Si algo falla, devuelve el archivo original tal cual.
 */

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.82;
const WEBP_QUALITY = 0.8;

export type CompressedImage = {
  /** JPEG o PNG: lo entiende cualquier navegador */
  fallback: Blob;
  fallbackName: string;
  /** WebP (si el navegador pudo generarlo) */
  webp?: Blob;
};

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), type, quality),
  );
}

function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Muestra una grilla de puntos: alcanza para detectar fondos transparentes
  const data = ctx.getImageData(0, 0, w, h).data;
  const step = Math.max(1, Math.floor((w * h) / 40000)) * 4;
  for (let i = 3; i < data.length; i += step) if (data[i] < 250) return true;
  return false;
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const base = file.name.replace(/\.[^.]+$/, "") || "imagen";
  const original: CompressedImage = { fallback: file, fallbackName: file.name };
  // GIF (puede estar animado) y SVG se suben tal cual
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return original;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const transparent = file.type !== "image/jpeg" && hasTransparency(ctx, w, h);
    let fallback: Blob | null;
    let fallbackName: string;
    if (transparent) {
      fallback = await toBlob(canvas, "image/png");
      fallbackName = `${base}.png`;
    } else {
      // Sin transparencia: JPEG sobre fondo blanco (por si venía de un PNG)
      const flat = document.createElement("canvas");
      flat.width = w;
      flat.height = h;
      const fctx = flat.getContext("2d");
      if (!fctx) return original;
      fctx.fillStyle = "#ffffff";
      fctx.fillRect(0, 0, w, h);
      fctx.drawImage(canvas, 0, 0);
      fallback = await toBlob(flat, "image/jpeg", JPEG_QUALITY);
      fallbackName = `${base}.jpg`;
    }
    if (!fallback) return original;
    // Si comprimida pesa más que la original (ya venía optimizada), queda la original
    if (fallback.size >= file.size && scale === 1 && file.type !== "image/webp") {
      fallback = file;
      fallbackName = file.name;
    }

    const webpBlob = await toBlob(canvas, "image/webp", WEBP_QUALITY);
    // Safari viejo devuelve PNG cuando no sabe hacer WebP: en ese caso no va
    const webp = webpBlob && webpBlob.type === "image/webp" ? webpBlob : undefined;

    return { fallback, fallbackName, webp };
  } catch {
    return original;
  }
}
