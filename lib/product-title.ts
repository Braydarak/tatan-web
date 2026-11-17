/**
 * Sugerencia de título de producto para el CRM ("Mejorar título").
 *
 * Formato:  <Prenda y detalles> - <Material>
 *   "Body alg pima manga larga con picot"  →  "Body manga larga con picot - Algodón Pima"
 *   "Escarpin con Picot alg Pima premiun"  →  "Escarpín con picot - Algodón Pima Premium"
 *
 * Sin servicios externos: un diccionario de palabras de ropa de bebé
 * (abreviaturas, acentos y errores comunes) y reglas de formato. Es solo una
 * sugerencia: el título cambia recién cuando se acepta.
 */

/** Palabra mal escrita / abreviada (sin acentos, minúscula) → cómo va */
const WORDS: Record<string, string> = {
  // materiales
  alg: "algodón",
  algod: "algodón",
  algodon: "algodón",
  algdon: "algodón",
  algodn: "algodón",
  pima: "pima",
  premiun: "premium",
  premiu: "premium",
  premiumm: "premium",
  premium: "premium",
  lycra: "lycra",
  modal: "modal",
  bambula: "bambula",
  morley: "morley",
  frisa: "frisa",
  polar: "polar",
  plush: "plush",
  lino: "lino",
  jersey: "jersey",
  hilo: "hilo",
  // prendas
  body: "body",
  bodys: "bodys",
  bodies: "bodys",
  batita: "batita",
  batitas: "batitas",
  ranita: "ranita",
  ranitas: "ranitas",
  ajuar: "ajuar",
  miton: "mitón",
  mitones: "mitones",
  escarpin: "escarpín",
  escarpines: "escarpines",
  gorro: "gorro",
  gorrito: "gorrito",
  bandana: "bandana",
  babero: "babero",
  enterito: "enterito",
  osito: "osito",
  remera: "remera",
  pantalon: "pantalón",
  pantalones: "pantalones",
  short: "short",
  conjunto: "conjunto",
  buzo: "buzo",
  campera: "campera",
  saco: "saco",
  saquito: "saquito",
  vestido: "vestido",
  pollera: "pollera",
  medias: "medias",
  camison: "camisón",
  pijama: "pijama",
  manta: "manta",
  mantita: "mantita",
  toalla: "toalla",
  // detalles
  manga: "manga",
  larga: "larga",
  corta: "corta",
  sin: "sin",
  con: "con",
  c: "con",
  pie: "pie",
  picot: "picot",
  cruzada: "cruzada",
  cruzado: "cruzado",
  basico: "básico",
  basica: "básica",
  basicos: "básicos",
  estampado: "estampado",
  estampa: "estampa",
  liso: "liso",
  lisa: "lisa",
  rayado: "rayado",
  rayas: "rayas",
  lunares: "lunares",
  boton: "botón",
  botones: "botones",
  broche: "broche",
  broches: "broches",
  cuello: "cuello",
  capucha: "capucha",
  volados: "volados",
  puntilla: "puntilla",
  bordado: "bordado",
  doble: "doble",
  reversible: "reversible",
  unidad: "unidad",
  unidades: "unidades",
  unid: "unidades",
  u: "unidades",
  bebe: "bebé",
  bebes: "bebés",
  nino: "niño",
  nina: "niña",
  ninos: "niños",
  ninas: "niñas",
  recien: "recién",
  nacido: "nacido",
  algodonero: "algodonero",
};

/** Palabras que forman el material (van después del guion) */
const MATERIAL = new Set(["algodón", "pima", "premium", "lycra", "modal", "bambula", "morley", "frisa", "polar", "plush", "lino", "jersey", "hilo"]);
/** Orden del material: "Algodón Pima Premium" (lo que no está acá va en el orden escrito) */
const MATERIAL_ORDER = ["algodón", "pima", "premium"];

/** Sin acentos ni signos, en minúscula (para buscar en el diccionario) */
function plain(w: string): string {
  return w
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.,;:]+$/g, "");
}

function capitalize(w: string): string {
  return w ? w[0].toLocaleUpperCase("es-AR") + w.slice(1) : w;
}

/** Corrige una palabra (si la conoce); si no, la deja como está pero en minúscula */
function fixWord(raw: string): string {
  const key = plain(raw);
  if (WORDS[key]) return WORDS[key];
  // Siglas y números (RN, 3M, x6, 2-4) quedan como están
  if (/\d/.test(raw) || (raw.length <= 3 && raw === raw.toUpperCase() && /[A-Z]/.test(raw))) return raw;
  return raw.toLocaleLowerCase("es-AR");
}

export function suggestProductTitle(input: string): string {
  const text = input.replace(/\s+/g, " ").trim();
  if (!text) return "";

  // Separa en palabras (el guion del formato se vuelve a armar)
  const tokens = text
    .replace(/\s+[-–—]\s+/g, " ")
    .split(" ")
    .map((t) => t.replace(/^c\/$/i, "con"))
    .filter(Boolean);

  const detail: string[] = [];
  const material: string[] = [];
  for (const t of tokens) {
    const w = fixWord(t);
    if (MATERIAL.has(w)) {
      if (!material.includes(w)) material.push(w);
    } else {
      detail.push(w);
    }
  }

  // La cantidad ("6 unidades", "x6") va pegada a la prenda: "Ajuar 6 unidades con picot"
  for (let i = 1; i < detail.length; i++) {
    const isPack = /^x\d+$/i.test(detail[i]);
    const isUnits = /^\d+$/.test(detail[i]) && /^unidad(es)?$/.test(detail[i + 1] ?? "");
    if (!isPack && !isUnits) continue;
    const qty = detail.splice(i, isUnits ? 2 : 1);
    detail.splice(1, 0, ...qty);
    break;
  }

  // Si el material quedó "solo" con un "de"/"en" colgando al final, se saca
  while (detail.length > 1 && ["de", "en", "y"].includes(detail[detail.length - 1])) detail.pop();

  material.sort((a, b) => {
    const ia = MATERIAL_ORDER.indexOf(a);
    const ib = MATERIAL_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  // "Premium" sin otro material no es un material: va con los detalles
  if (material.length === 1 && material[0] === "premium") {
    detail.push(material.pop()!);
  }

  const head = capitalize(detail.join(" "));
  const tail = material.map(capitalize).join(" ");
  if (!head) return tail;
  return tail ? `${head} - ${tail}` : head;
}
