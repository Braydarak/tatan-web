/**
 * Guía de talles de los productos: qué prenda es (para el dibujo) y cuántos
 * centímetros mide cada talle en cada medida (A, B…).
 *
 * Se guarda en `site_content` con la clave "size_guides" (una sola fila con
 * todas las guías, por id de producto). Se edita en el CRM, dentro del
 * formulario del producto ("Guía de talles").
 */

export type GarmentKey = "body" | "remera" | "pantalon" | "ranita" | "batita" | "gorro";
export type MeasureId = "A" | "B";

export type GarmentTemplate = {
  key: GarmentKey;
  label: string;
  /** Qué mide cada letra del dibujo */
  measures: { id: MeasureId; name: string; how: string }[];
};

export const GARMENTS: GarmentTemplate[] = [
  {
    key: "body",
    label: "Body",
    measures: [
      { id: "A", name: "Ancho", how: "De axila a axila, con la prenda apoyada" },
      { id: "B", name: "Largo", how: "Del hombro a la entrepierna" },
    ],
  },
  {
    key: "remera",
    label: "Remera",
    measures: [
      { id: "A", name: "Ancho", how: "De axila a axila, con la prenda apoyada" },
      { id: "B", name: "Largo", how: "Del hombro al ruedo" },
    ],
  },
  {
    key: "pantalon",
    label: "Pantalón",
    measures: [
      { id: "A", name: "Cintura", how: "De lado a lado de la cintura, sin estirar" },
      { id: "B", name: "Largo", how: "De la cintura al ruedo, por el costado" },
    ],
  },
  {
    key: "ranita",
    label: "Ranita / enterito",
    measures: [
      { id: "A", name: "Ancho", how: "De axila a axila, con la prenda apoyada" },
      { id: "B", name: "Largo", how: "Del hombro al pie" },
    ],
  },
  {
    key: "batita",
    label: "Batita",
    measures: [
      { id: "A", name: "Ancho", how: "De axila a axila, con la prenda apoyada" },
      { id: "B", name: "Largo", how: "Del hombro al ruedo" },
    ],
  },
  {
    key: "gorro",
    label: "Gorro",
    measures: [
      { id: "A", name: "Ancho", how: "De lado a lado, con el gorro apoyado" },
      { id: "B", name: "Alto", how: "Del borde a la punta" },
    ],
  },
];

export function garmentOf(key: string | undefined | null): GarmentTemplate | undefined {
  return GARMENTS.find((g) => g.key === key);
}

export type SizeGuide = {
  garment: GarmentKey;
  /** talle → medida → centímetros (texto, p. ej. "21" o "21,5") */
  rows: Record<string, Partial<Record<MeasureId, string>>>;
};

/** Lo que se guarda en site_content "size_guides" */
export type SizeGuides = {
  version: 1;
  byProduct: Record<string, SizeGuide>;
};

export const EMPTY_SIZE_GUIDES: SizeGuides = { version: 1, byProduct: {} };

/** Lee lo guardado (tolerante a datos viejos o mal formados). */
export function parseSizeGuides(raw: unknown): SizeGuides {
  const data = (typeof raw === "string" ? safeJson(raw) : raw) as Partial<SizeGuides> | null;
  if (!data || typeof data !== "object" || typeof data.byProduct !== "object" || !data.byProduct) {
    return { version: 1, byProduct: {} };
  }
  const byProduct: Record<string, SizeGuide> = {};
  for (const [id, g] of Object.entries(data.byProduct)) {
    if (g && typeof g === "object" && garmentOf((g as SizeGuide).garment) && typeof (g as SizeGuide).rows === "object") {
      byProduct[id] = g as SizeGuide;
    }
  }
  return { version: 1, byProduct };
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** "21,5" / "21.5 cm" → "21,5" (vacío si no es un número) */
export function cleanCm(v: string): string {
  const m = v.replace(",", ".").match(/\d+(\.\d+)?/);
  if (!m) return "";
  return m[0].replace(".", ",");
}

/**
 * Guía lista para mostrar: solo los talles que tiene el producto (en su
 * orden) y que tienen al menos una medida. null si no hay nada para mostrar.
 */
export function visibleGuide(
  guide: SizeGuide | undefined | null,
  sizes: string[],
): { template: GarmentTemplate; rows: { size: string; values: Partial<Record<MeasureId, string>> }[] } | null {
  if (!guide) return null;
  const template = garmentOf(guide.garment);
  if (!template) return null;
  const rows = sizes
    .map((size) => ({ size, values: guide.rows[size] ?? {} }))
    .filter((r) => template.measures.some((m) => (r.values[m.id] ?? "").trim()));
  return rows.length ? { template, rows } : null;
}

/** Lee las guías desde la API (en el servidor; se refresca con el tag de contenido). */
export async function fetchSizeGuidesSSR(): Promise<SizeGuides> {
  try {
    const res = await fetch("https://tatankids.com.ar/api/site-content.php?key=size_guides", {
      next: { revalidate: 60, tags: ["tatan-site-content"] },
      cache: "force-cache",
    });
    if (!res.ok) return EMPTY_SIZE_GUIDES;
    const json = (await res.json()) as { ok?: boolean; data?: unknown };
    return json?.ok ? parseSizeGuides(json.data) : EMPTY_SIZE_GUIDES;
  } catch {
    return EMPTY_SIZE_GUIDES;
  }
}
