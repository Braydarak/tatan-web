/**
 * Datos legales de la tienda (Argentina). Se usan en las páginas legales
 * (/legal/*), el botón de arrepentimiento y el pie de página.
 *
 * Los campos vacíos no se muestran: completalos cuando los tengas
 * (CUIT, número de registro de la marca en el INPI, Data Fiscal de ARCA).
 */

export const LEGAL = {
  /** Nombre comercial */
  brand: "Tatan Kids",
  /**
   * Titular de la tienda y de la marca. Vacío = no se publica su nombre
   * (la tienda se presenta como Tatan Kids).
   */
  owner: "",
  /** CUIT del titular (aparece en el aviso legal) */
  cuit: "",
  /** Número de registro / acta de la marca en el INPI (p. ej. "3.123.456") */
  trademarkNumber: "",
  /** Domicilio (ciudad y provincia alcanzan si no se quiere publicar la calle) */
  address: "Buenos Aires, Argentina",
  email: "contacto@tatankids.com.ar",
  site: "tatankids.com.ar",

  /**
   * Data Fiscal de ARCA (Formulario 960/D, RG 4042-E). ARCA da un código
   * HTML con un link (href) y una imagen (src): copiá cada uno acá. Se
   * obtiene en ARCA → "Formulario 960/D - Data Fiscal" con Clave Fiscal.
   * Mientras alguno esté vacío no se muestra.
   */
  dataFiscalUrl: "",
  dataFiscalImage: "",

  /** Ventanilla Federal Única de Reclamos (Res. SCI 274/2021, Disp. 890/2025) */
  consumerClaimsUrl: "https://autogestion.produccion.gob.ar/consumidores",

  /** Plazo para pedir un cambio de talle o color (días corridos desde la entrega) */
  exchangeDays: 30,
  /** Derecho de arrepentimiento (art. 34 Ley 24.240 y art. 1110 CCyC) */
  withdrawalDays: 10,

  /** Última actualización de los textos legales */
  updated: "22 de noviembre de 2026",
} as const;
