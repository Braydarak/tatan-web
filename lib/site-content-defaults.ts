// Contenido por defecto de `site_content`, usado como semilla de la BD y como
// respaldo de emergencia si la API no responde. La fuente de verdad es la API
// (`site-content.php`); estos valores sólo evitan pantallas vacías ante errores.

import type {
  HomeHeroData,
  HomePromo,
  HomeSections,
  ProductsPageContent,
  StoreSettings,
  HeaderContent,
} from "@/components/sections/HomeHeroEditor";
import type { EnviosData } from "@/components/sections/EnviosEditor";

export const HOME_PROMO_DEFAULT: HomePromo = {
  enabled: false,
  productId: "",
  label: "¡Oferta especial!",
  title: "",
  text: "",
  ctaText: "Comprar ahora",
  endsAt: "",
};

export const HOME_SECTIONS_DEFAULT: HomeSections = {
  decorations: true,
  socialProof: { show: true, text: "+2.000 mamás felices" },
  marquee: { show: true, items: [] },
  categories: {
    show: true,
    title: "Comprar por categoría",
    subtitle: "Encontrá lo que buscás rápido",
    ageShortcuts: true,
    items: [
      { key: "body", name: "Bodys", show: true, imageSrc: "" },
      { key: "remera", name: "Remeras", show: true, imageSrc: "" },
      { key: "pijama", name: "Pijamas", show: true, imageSrc: "" },
      { key: "accesorio", name: "Accesorios", show: true, imageSrc: "" },
      { key: "set", name: "Sets", show: false, imageSrc: "" },
      { key: "pantalon", name: "Pantalones", show: false, imageSrc: "" },
      { key: "buzo", name: "Buzos", show: false, imageSrc: "" },
    ],
  },
  products: {
    show: true,
    title: "Nuestros productos",
    subtitle: "Elegí talle y color y sumalo al carrito desde acá",
  },
  newsletter: {
    show: true,
    title: "Sumate al club Tatan",
    text: "Recibí 15% OFF en tu primera compra y enterate antes que nadie de las novedades y promociones.",
    buttonText: "Suscribirme",
  },
};

export const PRODUCTS_PAGE_DEFAULT: ProductsPageContent = {
  title: "Toda la colección",
  subtitle: "Ropa suave y cómoda para bebés y niños. Elegí talle y color y sumalo al carrito.",
  banner: {
    show: true,
    label: "¿Buscás algo en oferta?",
    title: "Mirá las ofertas de la semana",
    text: "Hasta 40% OFF en prendas seleccionadas. Envío gratis y cambios sin cargo.",
    buttonText: "Ir a Ofertas",
    buttonHref: "/ofertas",
  },
};

export const HEADER_DEFAULT: HeaderContent = {
  show: true,
  intervalSec: 3.5,
  messages: [
    { text: "Envíos a todo el país", mpLogo: false },
    { text: "Pagos suministrados por Mercado Pago", mpLogo: true },
    { text: "Retiro en punto de entrega (CABA/GBA)", mpLogo: false },
  ],
};

export const STORE_SETTINGS_DEFAULT: StoreSettings = {
  quickAdd: true,
  wholesaleMode: "auto",
};

export const HOME_HERO_DEFAULT: HomeHeroData = {
  promo: HOME_PROMO_DEFAULT,
  sections: HOME_SECTIONS_DEFAULT,
  productsPage: PRODUCTS_PAGE_DEFAULT,
  store: STORE_SETTINGS_DEFAULT,
  header: HEADER_DEFAULT,
  eyebrow: "Nueva colección Otoño",
  titleLine1: "Ropa suavecita para",
  titleLine2: "tus pequeños",
  description:
    "Descubrí nuestra selección de bodys, remeras y prendas de algodón premium. Confeccionadas con amor para los más chiquitos.",
  imageSrc:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20baby%20onesie%20body%20beige%20cotton%20with%20teddy%20bear%20print%20soft%20pastel%20colors%20flat%20lay%20kids%20clothing%20photography&image_size=square_hd",
  cta1Text: "Ver colección",
  cta1Href: "/productos",
  cta2Text: "Ofertas",
  cta2Href: "/ofertas",
  cottonBadge: {
    show: true,
    showIcon: true,
    title: "100% Algodón",
    subtitle: "Orgánico",
  },
  shippingBadge: {
    show: true,
    showIcon: true,
    title: "Envío gratis",
    subtitle: "Compras mayores a $25k",
  },
  benefits: [
    {
      show: true,
      showIcon: true,
      iconKey: "Truck",
      title: "Envío a todo el país",
      description: "Llegamos a todas las provincias en 3-7 días hábiles",
      color: "#E58B60",
    },
    {
      show: true,
      showIcon: true,
      iconKey: "CreditCard",
      title: "Hasta 12 cuotas",
      description: "Pagá como quieras: Mercado Pago, transferencia o efectivo",
      color: "#7BA5C9",
    },
    {
      show: true,
      showIcon: true,
      iconKey: "Heart",
      title: "Cambios sin costo",
      description:
        "Si no te convence, lo cambiás gratis en los primeros 30 días",
      color: "#E58BA0",
    },
  ],
};

/**
 * Versión del contenido de la página "Envíos y pagos". Si lo guardado en la
 * BD es de una versión anterior (el texto de ejemplo original), la web y el
 * editor del CRM usan estos textos. Subirla cuando cambie la estructura o
 * haya que reemplazar lo guardado.
 */
export const ENVIOS_CONTENT_VERSION = 2;

export const ENVIOS_DEFAULT: EnviosData = {
  contentVersion: ENVIOS_CONTENT_VERSION,
  sections: {
    zones: {
      show: true,
      showEyebrow: true,
      eyebrow: "Envíos",
      eyebrowBarColor: "#F7CA5C",
      title: "Enviamos a todo el país",
      showDescription: true,
      description:
        "Trabajamos con distintos correos. El costo y el plazo de entrega dependen de tu código postal y de la opción que elijas, y los ves antes de pagar.",
    },
    costos: {
      show: true,
      showEyebrow: true,
      eyebrow: "Pagos",
      eyebrowBarColor: "#F2B27B",
      title: "Pagás con Mercado Pago sin salir de la tienda",
      showDescription: true,
      description:
        "El pago se hace acá mismo, en el último paso de la compra. Los datos de tu tarjeta los procesa Mercado Pago de forma segura: Tatan no los ve ni los guarda.",
    },
    proceso: {
      show: true,
      showEyebrow: true,
      eyebrow: "Cómo comprar",
      eyebrowBarColor: "#F29BAF",
      title: "Del carrito a tu casa en 4 pasos",
      showDescription: false,
      description: "",
    },
    seguimiento: { show: true },
    // Tatan no publica una política de cambios en esta página
    cambios: { show: false },
    faq: {
      show: true,
      showEyebrow: true,
      eyebrow: "Preguntas frecuentes",
      eyebrowBarColor: "#CDE1A4",
      title: "Dudas sobre envíos y pagos",
      showDescription: false,
      description: "",
    },
    finalCta: { show: true },
  },
  hero: {
    show: true,
    eyebrow: "Envíos y pagos",
    title: "Comprás, pagás y te llega a casa",
    subtitle:
      "Enviamos a todo el país, a domicilio o a una sucursal del correo. Pagás con Mercado Pago: tarjeta de crédito en cuotas, débito o efectivo.",
    ctaPrimaryText: "Ver productos",
    ctaPrimaryHref: "/productos",
    ctaSecondaryText: "Cómo funcionan los envíos",
    ctaSecondaryHref: "#zonas",
    summaryCardShow: true,
    summaryTime: "Todo el país",
    summaryTimeLabel: "A domicilio o retiro en sucursal",
    summaryFreeBadgeText: "Mercado Pago",
    summaryFreeAmount: "Hasta 12 cuotas",
    summaryFreeLabel: "Con tarjeta de crédito",
    summaryChangesDays: "Efectivo",
    summaryChangesTitle: "Rapipago y Pago Fácil",
    summaryChangesLabel: "Con cupón de pago",
    stats: [
      {
        show: true,
        showIcon: true,
        iconKey: "Truck",
        label: "Envíos",
        value: "Todo el país",
        tone: "#5B85A8",
        tintBg: "#F7FBFF",
      },
      {
        show: true,
        showIcon: true,
        iconKey: "Sparkles",
        label: "Cuotas",
        value: "Hasta 12",
        tone: "#599E7D",
        tintBg: "#F6FBF7",
      },
      {
        show: true,
        showIcon: true,
        iconKey: "Sparkles",
        label: "Efectivo",
        value: "Con cupón",
        tone: "#D27856",
        tintBg: "#FFF6F0",
      },
    ],
  },
  zones: [
    {
      show: true,
      showIcon: true,
      iconKey: "Truck",
      title: "Envío a domicilio",
      time: "Plazo según el correo",
      color: "#D27856",
      items: [
        "Lo recibís en la dirección que indiques",
        "Elegís el correo y el servicio",
        "Para la entrega se pide tu DNI",
      ],
    },
    {
      show: true,
      showIcon: true,
      iconKey: "MapPin",
      title: "Retiro en sucursal",
      time: "Plazo según el correo",
      color: "#7BA5C9",
      items: [
        "Elegís la sucursal más cerca tuyo",
        "Retirás cuando te quede cómodo",
        "Llevá tu DNI para retirarlo",
      ],
    },
    {
      show: true,
      showIcon: true,
      iconKey: "Package",
      title: "Costo y plazo",
      time: "Con tu código postal",
      color: "#E58BA0",
      items: [
        "Lo calculás en el carrito con tu código postal",
        "Cada opción muestra su precio y su plazo",
        "Ves el total con envío antes de pagar",
      ],
    },
  ],
  costos: [
    {
      show: true,
      highlight: false,
      badge: "Más elegido",
      title: "Tarjeta de crédito",
      subtitle: "Visa, Mastercard, American Express y más",
      amount: "Hasta 12 cuotas",
      details: [
        "Elegís la cantidad de cuotas al pagar",
        "El interés de las cuotas depende de tu tarjeta y tu banco",
        "El pago se aprueba en el momento",
      ],
      ctaText: "",
      ctaHref: "",
    },
    {
      show: true,
      highlight: false,
      badge: "En un pago",
      title: "Tarjeta de débito",
      subtitle: "Visa Débito, Mastercard Débito y más",
      amount: "1 pago",
      details: [
        "Se debita de tu cuenta en el momento",
        "El pago se aprueba en el momento",
        "Sin cuotas",
      ],
      ctaText: "",
      ctaHref: "",
    },
    {
      show: true,
      highlight: false,
      badge: "Con cupón",
      title: "Efectivo",
      subtitle: "Rapipago o Pago Fácil",
      amount: "Cupón de pago",
      details: [
        "Al terminar la compra generás el cupón",
        "Lo pagás antes de la fecha de vencimiento que figura en el cupón",
        "Preparamos tu pedido cuando se acredita el pago",
      ],
      ctaText: "",
      ctaHref: "",
    },
  ],
  steps: [
    {
      show: true,
      showIcon: true,
      number: "01",
      iconKey: "Gift",
      title: "Elegís tus prendas",
      description: "Agregás al carrito el talle y el color que quieras.",
      tone: "from-tatan-acento-rosa/40 via-white to-tatan-primario1/50",
    },
    {
      show: true,
      showIcon: true,
      number: "02",
      iconKey: "Truck",
      title: "Elegís el envío",
      description:
        "Ingresás tu código postal y elegís a domicilio o retiro en sucursal, viendo el precio y el plazo de cada opción.",
      tone: "from-tatan-acento-amarillo/40 via-white to-tatan-primario2/50",
    },
    {
      show: true,
      showIcon: true,
      number: "03",
      iconKey: "CreditCard",
      title: "Pagás en la web",
      description:
        "Completás tus datos y pagás con Mercado Pago: tarjeta de crédito, débito o efectivo.",
      tone: "from-tatan-acento-azul/40 via-white to-tatan-primario1/50",
    },
    {
      show: true,
      showIcon: true,
      number: "04",
      iconKey: "Package",
      title: "Te llega tu pedido",
      description:
        "Con el pago acreditado preparamos tu pedido y te enviamos por correo el código de seguimiento.",
      tone: "from-tatan-acento-verde/40 via-white to-tatan-primario2/50",
    },
  ],
  seguimiento: [
    {
      show: true,
      showIcon: true,
      iconKey: "Package",
      iconBg: "#F7FBFF",
      iconColor: "#5B85A8",
      title: "Seguimiento por correo",
      description:
        "Cuando despachamos tu pedido, te llega por correo el código de seguimiento para ver dónde está.",
      bullets: [
        "Un código por pedido",
        "Lo recibís en el email que dejaste al comprar",
        "Revisá también la carpeta de spam",
      ],
    },
    {
      show: true,
      showIcon: true,
      iconKey: "ShieldCheck",
      iconBg: "#F6FBF7",
      iconColor: "#599E7D",
      title: "Pago seguro",
      description:
        "Todos los pagos los procesa Mercado Pago. Si un pago se rechaza, no se te cobra nada y podés intentar con otro medio.",
      bullets: [
        "Tus datos de tarjeta no pasan por Tatan",
        "Si se rechaza, te decimos el motivo",
        "Podés reintentar con otra tarjeta o en efectivo",
      ],
    },
  ],
  cambios: {
    show: false,
    title: "",
    description: "",
    bullets: [],
    cta1Text: "Escribinos",
    cta1Href: "/contacto",
    cta2Text: "Ir a contacto",
    cta2Href: "/contacto",
  },
  faqs: [
    {
      show: true,
      q: "¿Cuánto cuesta el envío?",
      a: "Depende de tu código postal, del tamaño del pedido y de la opción que elijas. Lo calculás en el carrito y ves el total con envío antes de pagar.",
    },
    {
      show: true,
      q: "¿Cuánto tarda en llegar?",
      a: "Cada opción de envío muestra su plazo cuando la elegís. Los días cuentan desde que despachamos tu pedido, una vez acreditado el pago.",
    },
    {
      show: true,
      q: "¿Cómo sigo mi pedido?",
      a: "Cuando lo despachamos, te llega por correo el código de seguimiento. Si no lo encontrás, revisá la carpeta de spam o escribinos.",
    },
    {
      show: true,
      q: "¿En cuántas cuotas puedo pagar?",
      a: "Con tarjeta de crédito, hasta 12 cuotas. Al pagar elegís la cantidad y ves cuánto queda cada cuota; el interés depende de tu tarjeta y tu banco.",
    },
    {
      show: true,
      q: "¿Cómo pago en efectivo?",
      a: "En el último paso elegís \"Efectivo\" (Rapipago o Pago Fácil) y se genera un cupón. Lo pagás antes de que venza y, cuando se acredita, preparamos tu pedido.",
    },
    {
      show: true,
      q: "¿Qué pasa si me rechazan el pago?",
      a: "No se te cobra nada. Te mostramos el motivo y podés volver a intentar con otra tarjeta u otro medio de pago, sin perder tu carrito.",
    },
    {
      show: true,
      q: "¿Hay precio por mayor?",
      a: "Sí, en los productos que lo indican. Cuando llevás la cantidad mínima de un producto (sumando talles y colores), el precio por mayor se aplica solo en el carrito.",
    },
  ],
  finalCta: {
    show: true,
    title: "¿Te quedó alguna duda?",
    description: "Escribinos y te ayudamos con tu envío o tu pago.",
    cta1Text: "Ir a contacto",
    cta1Href: "/contacto",
    cta2Text: "Ver productos",
    cta2Href: "/productos",
  },
};
