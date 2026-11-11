/**
 * Código postal → provincia y localidades, para completar la dirección del
 * checkout a partir del código postal que el comprador ya puso.
 *
 * Datos: public/data/cp-ar.json (se baja recién cuando hace falta), generado
 * con scripts/build-postal-codes.mjs a partir de GeoNames
 * (https://www.geonames.org, licencia CC BY 4.0).
 */

/** Letra de provincia (ISO 3166-2:AR) → nombre como en el formulario */
const PROVINCES: Record<string, string> = {
  A: "Salta",
  B: "Buenos Aires",
  C: "Ciudad Autónoma de Buenos Aires",
  D: "San Luis",
  E: "Entre Ríos",
  F: "La Rioja",
  G: "Santiago del Estero",
  H: "Chaco",
  J: "San Juan",
  K: "Catamarca",
  L: "La Pampa",
  M: "Mendoza",
  N: "Misiones",
  P: "Formosa",
  Q: "Neuquén",
  R: "Río Negro",
  S: "Santa Fe",
  T: "Tucumán",
  U: "Chubut",
  V: "Tierra del Fuego",
  W: "Corrientes",
  X: "Córdoba",
  Y: "Jujuy",
  Z: "Santa Cruz",
};

export type PostalInfo = {
  /** Provincias posibles, la más probable primero (casi siempre una sola) */
  provinces: string[];
  /** Localidades del código postal, la más probable primero */
  localities: string[];
};

type Data = Record<string, [string, string[]]>;
let data: Promise<Data> | null = null;

function load(): Promise<Data> {
  data ??= fetch("/data/cp-ar.json")
    .then((r) => (r.ok ? (r.json() as Promise<Data>) : {}))
    .catch(() => {
      data = null; // que se pueda reintentar
      return {};
    });
  return data;
}

/** null si no lo conocemos (el comprador completa a mano). */
export async function lookupPostalCode(cp: string): Promise<PostalInfo | null> {
  if (!/^\d{4}$/.test(cp)) return null;
  const n = Number(cp);
  // Capital Federal (no está en GeoNames)
  if (n >= 1000 && n <= 1499) {
    return {
      provinces: [PROVINCES.C],
      localities: ["Ciudad Autónoma de Buenos Aires"],
    };
  }
  const entry = (await load())[cp];
  if (!entry) return null;
  const provinces = [...entry[0]].map((l) => PROVINCES[l]).filter(Boolean);
  return provinces.length ? { provinces, localities: entry[1] } : null;
}
