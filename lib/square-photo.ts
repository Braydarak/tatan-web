"use client";

/**
 * Foto de producto cuadrada, lista para la tienda.
 *
 * Al subir una foto de producto desde el CRM:
 *  1. se lee el color del fondo en los bordes de la foto,
 *  2. se busca dónde está la prenda (lo que se distingue del fondo),
 *  3. se arma un cuadrado de 1600 px pintado de ese color, con la
 *     prenda centrada ocupando el 85% del lado.
 *
 * Así sirve igual una foto recortada al ras (le agrega aire) que una que ya
 * viene con margen (no se achica de más). Si el fondo es transparente, el
 * cuadrado queda transparente.
 */

/** Cuánto del lado del cuadrado ocupa la prenda */
const FILL = 0.85;
/** Cuánto se puede agrandar como máximo (para llegar a 1600 px sin empastar) */
const MAX_UPSCALE = 1.5;
/** Lado de la copia chica que se usa para analizar la foto */
const PROBE = 256;
/** Diferencia de color (suma R+G+B) a partir de la cual un píxel no es fondo */
const COLOR_DIFF = 60;
/** Una fila/columna es "prenda" si al menos esta fracción de sus píxeles lo es */
const LINE_SHARE = 0.01;

type RGBA = [number, number, number, number];

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[s.length >> 1] ?? 0;
}

/** Color del fondo: la mediana de los píxeles del borde (2 px de ancho). */
function edgeColor(data: Uint8ClampedArray, w: number, h: number): RGBA {
  const ch: number[][] = [[], [], [], []];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x > 1 && x < w - 2 && y > 1 && y < h - 2) continue;
      const i = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) ch[c].push(data[i + c]);
    }
  }
  return ch.map(median) as RGBA;
}

/** Rectángulo (en la copia chica) que ocupa la prenda, o null si no se distingue. */
function contentBox(data: Uint8ClampedArray, w: number, h: number, bg: RGBA) {
  const transparentBg = bg[3] < 128;
  const isContent = (i: number) =>
    transparentBg
      ? data[i + 3] >= 128
      : data[i + 3] >= 128 &&
        Math.abs(data[i] - bg[0]) +
          Math.abs(data[i + 1] - bg[1]) +
          Math.abs(data[i + 2] - bg[2]) >
          COLOR_DIFF;

  const rows = new Array<number>(h).fill(0);
  const cols = new Array<number>(w).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isContent((y * w + x) * 4)) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  // Se ignoran filas/columnas con muy pocos píxeles distintos (ruido, pelusas)
  const first = (arr: number[], min: number) => arr.findIndex((n) => n >= min);
  const last = (arr: number[], min: number) =>
    arr.length - 1 - [...arr].reverse().findIndex((n) => n >= min);
  const top = first(rows, w * LINE_SHARE);
  const left = first(cols, h * LINE_SHARE);
  if (top < 0 || left < 0) return null;
  const bottom = last(rows, w * LINE_SHARE);
  const right = last(cols, h * LINE_SHARE);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

/**
 * Devuelve un canvas cuadrado con la foto encuadrada, o null si no se pudo
 * (en ese caso se sube la foto como venía).
 */
export function squareProductPhoto(
  bitmap: ImageBitmap,
  maxSide: number,
): HTMLCanvasElement | null {
  const W = bitmap.width;
  const H = bitmap.height;
  if (!W || !H) return null;

  // 1 y 2: analizar una copia chica
  const k = Math.min(1, PROBE / Math.max(W, H));
  const pw = Math.max(1, Math.round(W * k));
  const ph = Math.max(1, Math.round(H * k));
  const probe = document.createElement("canvas");
  probe.width = pw;
  probe.height = ph;
  const pctx = probe.getContext("2d", { willReadFrequently: true });
  if (!pctx) return null;
  pctx.drawImage(bitmap, 0, 0, pw, ph);
  const { data } = pctx.getImageData(0, 0, pw, ph);
  const bg = edgeColor(data, pw, ph);
  const box = contentBox(data, pw, ph, bg) ?? { x: 0, y: 0, w: pw, h: ph };

  // Prenda en píxeles de la foto original
  const bx = box.x / k;
  const by = box.y / k;
  const bw = box.w / k;
  const bh = box.h / k;

  // 3: el cuadrado, de maxSide. Una foto muy chica se agranda hasta
  // MAX_UPSCALE y el cuadrado queda más chico (agrandar más no suma calidad).
  const side = Math.round(
    Math.min(maxSide, (Math.max(bw, bh) * MAX_UPSCALE) / FILL),
  );
  const scale = (side * FILL) / Math.max(bw, bh);
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (bg[3] >= 128) {
    ctx.fillStyle = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;
    ctx.fillRect(0, 0, side, side);
  }
  // Se dibuja la foto entera (con su fondo y sombras) con la prenda centrada;
  // lo que sobra queda afuera y lo que falta ya está pintado del color del fondo.
  ctx.imageSmoothingQuality = "high";
  const dx = side / 2 - (bx + bw / 2) * scale;
  const dy = side / 2 - (by + bh / 2) * scale;
  ctx.drawImage(bitmap, dx, dy, W * scale, H * scale);
  return canvas;
}

/* ----------------------------------------------------------------
 *  Fotos ya subidas (antes de que existiera el encuadre automático)
 * -------------------------------------------------------------- */

const squareCache = new Map<string, boolean | null>();

/**
 * ¿La foto ya es cuadrada (o sea, pasó por el encuadre)? null si no carga.
 * Para saber el tamaño alcanza con cargarla como <img>: no hace falta CORS.
 */
export function isSquarePhoto(url: string): Promise<boolean | null> {
  if (squareCache.has(url)) return Promise.resolve(squareCache.get(url)!);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const square = Math.abs(img.naturalWidth - img.naturalHeight) <= 2;
      squareCache.set(url, square);
      resolve(square);
    };
    img.onerror = () => {
      squareCache.set(url, null);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Trae una foto ya subida como archivo, para volver a encuadrarla y subirla.
 * Las fotos de Ferozo no tienen CORS, así que se piden a través del
 * optimizador de Next (/_next/image, mismo dominio), que devuelve la foto
 * en su tamaño original y en el mismo formato (JPG/PNG).
 */
export async function fetchPhotoFile(url: string): Promise<File> {
  const qs = new URLSearchParams({ url, w: "2048", q: "85" });
  const res = await fetch(`/_next/image?${qs}`, {
    headers: { Accept: "image/jpeg,image/png" },
  });
  if (!res.ok) throw new Error("No se pudo leer la foto");
  const blob = await res.blob();
  const type = blob.type === "image/png" ? "image/png" : "image/jpeg";
  const name = (url.split("/").pop() || "foto").replace(/\.[^.]+$/, "");
  return new File([blob], `${name}.${type === "image/png" ? "png" : "jpg"}`, { type });
}
