/**
 * SEO de la tienda: dominio, marca, URLs limpias del catálogo y los textos
 * de cada página de categoría (título, descripción y el texto de abajo de
 * la grilla).
 *
 * Las URLs del catálogo son "de verdad" (no con ?c=) para que Google las
 * trate como páginas distintas, cada una con su título:
 *   /bebes               ropa para bebés (talle bebé)
 *   /ninos               ropa para niños (talle niños)
 *   /productos/body      una categoría
 *   /productos/body?t=bebe&pr=hasta10k…  filtros extra (no se indexan)
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tatankids.com.ar").replace(/\/$/, "");
export const SITE_NAME = "Tatan";
export const SITE_ALT_NAME = "Tatan Kids";
export const SITE_LOCALE = "es_AR";

/** Redes de la marca (Tatan tiene solo Instagram) */
export const INSTAGRAM_HANDLE = "tatankids26";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

/** URL absoluta (para JSON-LD y el sitemap) */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/* ================================================================
 *  URLs del catálogo
 * ============================================================== */

export type SizeGroupKey = "bebe" | "ninios";

/** Página de un grupo de talles */
export const SIZE_PATH: Record<SizeGroupKey, string> = {
  bebe: "/bebes",
  ninios: "/ninos",
};

export function categoryPath(key: string): string {
  return `/productos/${encodeURIComponent(key)}`;
}

/**
 * URL de un filtro del catálogo. La categoría o el talle van en la ruta;
 * el resto (precio, orden, búsqueda, o talle dentro de una categoría) en
 * la query.
 */
export function catalogHref(f: {
  cat?: string;
  size?: string;
  pr?: string;
  sort?: string;
  q?: string;
}): string {
  const cat = f.cat && f.cat !== "todos" ? f.cat : "";
  const size = f.size && f.size !== "todos" ? f.size : "";
  let path = "/productos";
  const qs = new URLSearchParams();
  if (cat) {
    path = categoryPath(cat);
    if (size) qs.set("t", size);
  } else if (size && size in SIZE_PATH) {
    path = SIZE_PATH[size as SizeGroupKey];
  } else if (size) {
    qs.set("t", size);
  }
  if (f.pr && f.pr !== "todos") qs.set("pr", f.pr);
  if (f.sort && f.sort !== "recomendado") qs.set("s", f.sort);
  if (f.q) qs.set("q", f.q);
  const str = qs.toString();
  return str ? `${path}?${str}` : path;
}

/* ================================================================
 *  Textos de cada página del catálogo
 * ============================================================== */

export type CatalogSeo = {
  /** <title> (se le agrega " · Tatan") */
  title: string;
  /** <h1> de la página */
  h1: string;
  /** meta description (~150 caracteres) */
  description: string;
  /** Texto de abajo de la grilla (párrafos) */
  intro: string[];
};

const SHIPPING = "Envíos a todo el país y pago con Mercado Pago en cuotas.";

export const ALL_SEO: CatalogSeo = {
  title: "Ropa para bebés de Algodón Pima",
  h1: "Ropa para bebés",
  description:
    "Bodys, ajuares, batitas, ranitas y accesorios para bebés en Algodón Pima. " + SHIPPING,
  intro: [
    "En Tatan hacemos ropa para bebés en Algodón Pima: bodys, ajuares para recién nacidos, batitas, ranitas, gorros, mitones y escarpines, pensados para la piel más delicada.",
    "Elegís el talle y el color, calculás el envío con tu código postal y pagás con Mercado Pago: tarjeta en cuotas, débito o efectivo en Rapipago y Pago Fácil.",
  ],
};

export const SIZE_SEO: Record<SizeGroupKey, CatalogSeo> = {
  bebe: {
    title: "Ropa de bebé de Algodón Pima",
    h1: "Ropa para bebés",
    description:
      "Ropa de bebé de recién nacido a 24 meses en Algodón Pima: bodys, ajuares, batitas, ranitas y accesorios. " +
      SHIPPING,
    intro: [
      "Ropa para bebés de recién nacido a 24 meses, hecha en Algodón Pima: una fibra suave, fresca y resistente, ideal para la piel sensible de los más chiquitos.",
      "Encontrás bodys de manga larga y corta, ajuares para el recién nacido, batitas, ranitas y accesorios como gorros, mitones, escarpines y bandanas. " +
        SHIPPING,
    ],
  },
  ninios: {
    title: "Ropa para niños",
    h1: "Ropa para niños",
    description: "Ropa para niños de 2 a 10 años, cómoda y de algodón. " + SHIPPING,
    intro: [
      "Ropa para niños de 2 a 10 años, cómoda y de algodón, para el día a día.",
      SHIPPING,
    ],
  },
};

/** Textos de las categorías conocidas (key de la base → textos) */
const CATEGORY_SEO: Record<string, CatalogSeo> = {
  body: {
    title: "Bodys para bebé de Algodón Pima",
    h1: "Bodys para bebé",
    description:
      "Bodys para bebé de manga larga y manga corta en Algodón Pima, lisos, estampados y con picot. " + SHIPPING,
    intro: [
      "El body es el básico que más usa un bebé. Los nuestros son de Algodón Pima, suaves y frescos, con broches abajo para cambiar el pañal fácil.",
      "Hay bodys de manga larga y de manga corta, lisos, estampados y con terminación picot, en talles desde recién nacido. " +
        SHIPPING,
    ],
  },
  ajuar: {
    title: "Ajuar para recién nacido de Algodón Pima",
    h1: "Ajuares para recién nacido",
    description:
      "Ajuares de 3 y 6 piezas para recién nacido en Algodón Pima, ideales para el bolso maternal o para regalar. " +
      SHIPPING,
    intro: [
      "El ajuar es el primer conjunto del bebé: las prendas que lleva el bolso maternal y que usa en sus primeros días. Los nuestros son de Algodón Pima, la fibra más suave para su piel.",
      "Hay ajuares de 3 y de 6 piezas, lisos o con terminación picot. También son un regalo ideal para un baby shower o un nacimiento. " +
        SHIPPING,
    ],
  },
  accesorio: {
    title: "Accesorios para bebé: gorros, mitones y escarpines",
    h1: "Accesorios para bebé",
    description:
      "Gorros, mitones, escarpines y bandanas para bebé en Algodón Pima, para el recién nacido y los primeros meses. " +
      SHIPPING,
    intro: [
      "Los accesorios completan el ajuar del recién nacido: gorros para abrigar la cabecita, mitones para que no se rasguñe, escarpines para los pies y bandanas que absorben la baba.",
      "Todos son de Algodón Pima, suaves y livianos. " + SHIPPING,
    ],
  },
  batita: {
    title: "Batitas para bebé de Algodón Pima",
    h1: "Batitas para bebé",
    description:
      "Batitas cruzadas para recién nacido en Algodón Pima, fáciles de poner y sacar. " + SHIPPING,
    intro: [
      "La batita cruzada es la prenda más cómoda para vestir a un recién nacido: se abre adelante y no hay que pasarla por la cabeza.",
      "Las nuestras son de Algodón Pima, lisas o con terminación picot. " + SHIPPING,
    ],
  },
  pantalon: {
    title: "Pantalones y ranitas para bebé",
    h1: "Pantalones y ranitas para bebé",
    description:
      "Pantalones y ranitas con pie para bebé en algodón, cómodos y suaves para el día a día. " + SHIPPING,
    intro: [
      "Pantalones y ranitas para bebé, con cintura suave que no aprieta. La ranita con pie abriga las piernas y los pies en una sola prenda.",
      SHIPPING,
    ],
  },
  short: {
    title: "Shorts para bebé de algodón",
    h1: "Shorts para bebé",
    description: "Shorts para bebé de algodón, frescos y cómodos para el verano. " + SHIPPING,
    intro: ["Shorts para bebé de algodón, frescos y cómodos, con cintura elástica suave.", SHIPPING],
  },
  remera: {
    title: "Remeras para bebé y niños",
    h1: "Remeras para bebé y niños",
    description: "Remeras de algodón para bebé y niños. " + SHIPPING,
    intro: ["Remeras de algodón para bebé y niños, cómodas para todos los días.", SHIPPING],
  },
  enterito: {
    title: "Enteritos para bebé",
    h1: "Enteritos para bebé",
    description: "Enteritos para bebé de algodón, cómodos y abrigados. " + SHIPPING,
    intro: ["Enteritos para bebé de algodón: una sola prenda, cómoda y abrigada.", SHIPPING],
  },
  saquito: {
    title: "Saquitos para bebé",
    h1: "Saquitos para bebé",
    description: "Saquitos para bebé, abrigados y suaves. " + SHIPPING,
    intro: ["Saquitos para bebé, abrigados y suaves para los días frescos.", SHIPPING],
  },
  chaleco: {
    title: "Chalecos para bebé",
    h1: "Chalecos para bebé",
    description: "Chalecos para bebé, abrigados y livianos. " + SHIPPING,
    intro: ["Chalecos para bebé, abrigados y livianos.", SHIPPING],
  },
};

/** Textos de una categoría (las nuevas, creadas en el CRM, usan su nombre) */
export function categorySeo(key: string, label: string): CatalogSeo {
  const known = CATEGORY_SEO[key];
  if (known) return known;
  return {
    title: `${label} para bebés y niños`,
    h1: label,
    description: `${label} para bebés y niños en algodón. ${SHIPPING}`,
    intro: [`${label} para bebés y niños en algodón.`, SHIPPING],
  };
}
