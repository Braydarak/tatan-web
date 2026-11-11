// Genera public/data/cp-ar.json: código postal → provincia y localidades,
// para completar la dirección del checkout.
//
// Fuente: GeoNames (https://www.geonames.org), licencia CC BY 4.0.
//   curl -O https://download.geonames.org/export/zip/AR.zip && unzip AR.zip
//   node scripts/build-postal-codes.mjs AR.txt
//
// Formato de salida: { "5000": ["X", ["Córdoba", "Alto Alberdi", …]], … }
//   - la provincia es la letra (si hay más de una, la más frecuente primero)
//   - las localidades, de la más representativa a la menos
// Capital Federal (1000–1499) no está en GeoNames: lo resuelve lib/postal-codes.ts.

import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("Uso: node scripts/build-postal-codes.mjs ruta/a/AR.txt");
  process.exit(1);
}

const SMALL = new Set(["de", "del", "la", "las", "los", "el", "y", "e"]);
// Acentos que GeoNames no trae (palabras frecuentes en nombres de localidades)
const ACCENTS = {
  cordoba: "Córdoba", rio: "Río", jose: "José", maria: "María", martin: "Martín",
  nicolas: "Nicolás", tucuman: "Tucumán", neuquen: "Neuquén", ramon: "Ramón",
  andres: "Andrés", lujan: "Luján", moron: "Morón", bahia: "Bahía",
  concepcion: "Concepción", belen: "Belén", general: "General", ines: "Inés",
  angel: "Ángel", joaquin: "Joaquín", sebastian: "Sebastián", agustin: "Agustín",
  ezeiza: "Ezeiza", junin: "Junín", tandil: "Tandil", pergamino: "Pergamino",
  olavarria: "Olavarría", saenz: "Sáenz", pena: "Peña", florencio: "Florencio",
  mendez: "Méndez", ramirez: "Ramírez", fernandez: "Fernández", gonzalez: "González",
  rodriguez: "Rodríguez", lopez: "López", perez: "Pérez", garcia: "García",
  jesus: "Jesús", ascension: "Ascensión", asuncion: "Asunción", rafaela: "Rafaela",
  colon: "Colón", parana: "Paraná", uruguay: "Uruguay", plata: "Plata",
};

function titleCase(s) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => {
      if (i > 0 && SMALL.has(w)) return w;
      if (ACCENTS[w]) return ACCENTS[w];
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/** Nombre de localidad "limpio", o null si no es una localidad (barrio, estafeta…). */
function baseName(raw) {
  let s = raw.toUpperCase();
  s = s.split("(")[0]; // "POZO CERCADO (EL CHORRO …)" → "POZO CERCADO"
  // "MAR DEL PLATA SUCURSAL No.5" → "MAR DEL PLATA"
  s = s.split(/\b(ESTAFETA|SUCURSAL|SUC\.|AEROPUERTO|CASILLA|APARTADO|CORREO|C\.?C\.)\b/)[0];
  s = s.replace(/\bN[º°O]\.?\s*\d+.*$/, "").replace(/[.,\-]+$/, "");
  s = s.replace(/\s+/g, " ").trim();
  if (!s || /^BARRIO\b|^B[º°]\b|^VILLA \d|^\d/.test(s)) return null;
  // Estaciones de tren, apeaderos y kilómetros de ruta no son localidades
  if (/^(ESTACION|APEADERO|PARADA|DESVIO|KM|KILOMETRO|CAMINO A)\b|\bF\.?C\.?[A-Z]{1,3}\b/.test(s)) return null;
  return s;
}

// Capitales y ciudades grandes: si están en el código postal, van primero
const MAIN_CITIES = new Set([
  "LA PLATA", "CORDOBA", "ROSARIO", "SANTA FE", "MENDOZA", "SAN MIGUEL DE TUCUMAN",
  "TUCUMAN", "SALTA", "SAN SALVADOR DE JUJUY", "JUJUY", "RESISTENCIA", "CORRIENTES",
  "POSADAS", "FORMOSA", "PARANA", "SANTIAGO DEL ESTERO", "SAN FERNANDO DEL VALLE DE CATAMARCA",
  "CATAMARCA", "LA RIOJA", "SAN JUAN", "SAN LUIS", "SANTA ROSA", "NEUQUEN", "VIEDMA",
  "RAWSON", "RIO GALLEGOS", "USHUAIA", "MAR DEL PLATA", "BAHIA BLANCA",
  "SAN CARLOS DE BARILOCHE", "COMODORO RIVADAVIA", "RIO CUARTO",
]);

// Códigos que en GeoNames solo tienen barrios
const MANUAL = { "9100": "TRELEW", "5006": "CORDOBA", "5008": "CORDOBA" };

const rows = fs
  .readFileSync(src, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => l.split("\t"));

/** cp → { provincias: Map<letra, n>, nombres: Map<base, puntaje> } */
const byCp = new Map();
for (const r of rows) {
  const [, cp, place, , prov] = r;
  if (!/^\d{4}$/.test(cp) || !prov) continue;
  const e = byCp.get(cp) ?? { prov: new Map(), names: new Map() };
  e.prov.set(prov, (e.prov.get(prov) ?? 0) + 1);
  const b = baseName(place ?? "");
  if (b) {
    // Puntaje: cuántas veces aparece (incluidas sus estafetas/sucursales);
    // un nombre que aparece tal cual suma un poco más
    const exact = place.toUpperCase().trim() === b ? 0.5 : 0;
    e.names.set(b, (e.names.get(b) ?? 0) + 1 + exact);
  }
  // La ciudad principal aparece entre paréntesis en sus barrios:
  // "SAN VICENTE (CORDOBA-DPTO.CAPITAL)", "LA FLORIDA (ROSARIO, DEPTO.ROSARIO)"
  const paren = (place ?? "").match(/\(([^()]+)/);
  if (paren) {
    const parent = baseName(paren[1].split(/,|-|\bD(?:E)?PTO\b|\bPDO\b|\bPARTIDO\b/i)[0]);
    if (parent && parent.length > 2) e.names.set(parent, (e.names.get(parent) ?? 0) + 1);
  }
  byCp.set(cp, e);
}

const out = {};
for (const [cp, e] of [...byCp.entries()].sort()) {
  const provs = [...e.prov.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p).join("");
  if (MANUAL[cp]) e.names.set(MANUAL[cp], 2000);
  for (const n of e.names.keys()) if (MAIN_CITIES.has(n)) e.names.set(n, e.names.get(n) + 1000);
  const names = [...e.names.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 15)
    .map(([n]) => titleCase(n));
  out[cp] = [provs, names];
}

const dest = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public", "data", "cp-ar.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`${Object.keys(out).length} códigos postales → ${dest} (${fs.statSync(dest).size} bytes)`);
