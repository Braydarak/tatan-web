// Contenido por defecto de `site_content`, usado como semilla de la BD y como
// respaldo de emergencia si la API no responde. La fuente de verdad es la API
// (`site-content.php`); estos valores sólo evitan pantallas vacías ante errores.

import type { HomeHeroData } from "@/components/sections/HomeHeroEditor";
import type { EnviosData } from "@/components/sections/EnviosEditor";

export const HOME_HERO_DEFAULT: HomeHeroData = {
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

export const ENVIOS_DEFAULT: EnviosData = {
  sections: {
    zones: {
      show: true,
      showEyebrow: true,
      eyebrow: "Zonas de entrega",
      eyebrowBarColor: "#F7CA5C",
      title: "Enviamos a todo el país y Sudamérica",
      showDescription: true,
      description:
        "Los tiempos son estimados desde el despacho (24 h hábiles después de acreditado el pago). Feriados y fin de semana no se cuentan.",
    },
    costos: {
      show: true,
      showEyebrow: true,
      eyebrow: "Costos",
      eyebrowBarColor: "#F2B27B",
      title: "Envío gratis en compras mayores a $25.000",
      showDescription: true,
      description:
        "Sin costos sorpresa. El valor final aparece antes de pagar y se calcula según tu zona y el monto del carrito.",
    },
    proceso: {
      show: true,
      showEyebrow: true,
      eyebrow: "Cómo funciona",
      eyebrowBarColor: "#F29BAF",
      title: "Del carrito a la puerta de tu casa en 4 pasos",
      showDescription: true,
      description:
        "Te contamos todo el recorrido que hace tu pedido desde que pagás hasta que estás abrazando tus prendas nuevas.",
    },
    seguimiento: { show: true },
    cambios: { show: true },
    faq: {
      show: true,
      showEyebrow: true,
      eyebrow: "Preguntas frecuentes",
      eyebrowBarColor: "#CDE1A4",
      title: "Todo lo que querés saber de los envíos",
      showDescription: false,
      description: "",
    },
    finalCta: { show: true },
  },
  hero: {
    show: true,
    eyebrow: "Envíos y entregas",
    title: "Tus prendas viajan seguras hasta tu casa",
    subtitle:
      "Explicá cómo funciona el envío de nuestros productos: zonas de entrega, tiempos, costos, seguimiento y cambios sin costo. Entregamos a todo el país.",
    ctaPrimaryText: "Ver productos",
    ctaPrimaryHref: "/productos",
    ctaSecondaryText: "Ver zonas y tiempos",
    ctaSecondaryHref: "#zonas",
    summaryCardShow: true,
    summaryTime: "3-7 días hábiles",
    summaryTimeLabel: "Interior del país",
    summaryFreeBadgeText: "Gratis",
    summaryFreeAmount: "$25k+",
    summaryFreeLabel: "Envío sin costo",
    summaryChangesDays: "30 días",
    summaryChangesTitle: "Cambios",
    summaryChangesLabel: "Sin letra chica",
    stats: [
      {
        show: true,
        showIcon: true,
        iconKey: "Truck",
        label: "Tiempo promedio",
        value: "3-7 días hábiles",
        tone: "#5B85A8",
        tintBg: "#F7FBFF",
      },
      {
        show: true,
        showIcon: true,
        iconKey: "Sparkles",
        label: "Gratis",
        value: "$25k+",
        tone: "#599E7D",
        tintBg: "#F6FBF7",
      },
      {
        show: true,
        showIcon: true,
        iconKey: "RotateCcw",
        label: "30 días",
        value: "Cambios",
        tone: "#D27856",
        tintBg: "#FFF6F0",
      },
    ],
  },
  zones: [
    {
      show: true,
      showIcon: true,
      iconKey: "MapPin",
      color: "#D27856",
      title: "CABA y GBA",
      time: "24 a 48 hábiles",
      items: [
        "Despacho en 24 h",
        "Entrega a domicilio",
        "Retiro en puntos sin cargo",
      ],
    },
    {
      show: true,
      showIcon: true,
      iconKey: "Truck",
      color: "#7BA5C9",
      title: "Interior del país",
      time: "3 a 7 días hábiles",
      items: [
        "Correo Argentino / Andreani",
        "Entrega a domicilio",
        "Retiro en sucursal",
      ],
    },
    {
      show: true,
      showIcon: true,
      iconKey: "Package",
      color: "#E58BA0",
      title: "Resto de Sudamérica",
      time: "10 a 20 días hábiles",
      items: [
        "Envío internacional",
        "Sin impuestos a < USD 50",
        "Seguimiento completo",
      ],
    },
  ],
  costos: [
    {
      show: true,
      title: "Envío GRATIS",
      subtitle: "Compras mayores a",
      amount: "$25.000",
      badge: "Más elegido",
      details: [
        "Todas las zonas",
        "Aplica Mercado Envíos",
        "Despacho en 24 h hábiles",
      ],
      ctaText: "Ver prendas",
      ctaHref: "/productos",
      highlight: true,
    },
    {
      show: true,
      title: "Envío estándar",
      subtitle: "Compras menores a",
      amount: "$25.000",
      badge: "Costo fijo",
      details: [
        "CABA y GBA: $1.200",
        "Interior del país: desde $1.800",
        "Se calcula al finalizar compra",
      ],
      ctaText: "Ver prendas",
      ctaHref: "/productos",
      highlight: false,
    },
    {
      show: true,
      title: "Retiro sin cargo",
      subtitle: "En puntos de retiro",
      amount: "$0",
      badge: "Gratis siempre",
      details: [
        "Correo Argentino / Andreani",
        "Horarios de sucursal",
        "Te avisan por SMS cuando llega",
      ],
      ctaText: "Ver prendas",
      ctaHref: "/productos",
      highlight: false,
    },
  ],
  steps: [
    {
      show: true,
      showIcon: true,
      iconKey: "CreditCard",
      number: "01",
      title: "Elegís y pagás tu pedido",
      description:
        "Agregás las prendas al carrito y pagás por Mercado Pago, transferencia o efectivo. Confirmamos stock en 2 horas hábiles.",
      tone: "from-tatan-acento-rosa/40 via-white to-tatan-primario1/50",
    },
    {
      show: true,
      showIcon: true,
      iconKey: "Gift",
      number: "02",
      title: "Armamos y despachamos",
      description:
        "Controlamos calidad, doblamos con papel de regalo y despachamos en 24 hs hábiles. Te enviamos el número de seguimiento por WhatsApp.",
      tone: "from-tatan-acento-amarillo/40 via-white to-tatan-primario2/50",
    },
    {
      show: true,
      showIcon: true,
      iconKey: "Truck",
      number: "03",
      title: "Te llega a la puerta",
      description:
        "Trabajamos con transportes de confianza. En CABA podés seguir en tiempo real; en el interior recibís notificación del correo.",
      tone: "from-tatan-acento-azul/40 via-white to-tatan-primario1/50",
    },
    {
      show: true,
      showIcon: true,
      iconKey: "RotateCcw",
      number: "04",
      title: "Si no te convence, lo cambiás",
      description:
        "Tenés 30 días desde que recibís el pedido para cambiar de talle o devolver sin costo. Sin letra chica.",
      tone: "from-tatan-acento-verde/40 via-white to-tatan-primario2/50",
    },
  ],
  seguimiento: [
    {
      show: true,
      showIcon: true,
      iconKey: "Clock",
      iconBg: "#F7FBFF",
      iconColor: "#5B85A8",
      title: "Seguimiento en tiempo real",
      description:
        "Apenas despachamos tu pedido te enviamos un código por WhatsApp y email. Desde la web del correo o la app de Mercado Libre podés seguir el recorrido paso a paso, ver la hora estimada de entrega y dejar instrucciones si no vas a estar.",
      bullets: [
        "Número único por pedido",
        "Notificaciones por SMS/WhatsApp",
        "Fecha estimada visible",
      ],
    },
    {
      show: true,
      showIcon: true,
      iconKey: "Package",
      iconBg: "#F0FAF2",
      iconColor: "#599E7D",
      title: "Retiro sin cargo en sucursal",
      description:
        "Si preferís pasar a buscarlo vos, al finalizar la compra podés elegir la sucursal de Correo Argentino o Andreani más cercana. No pagás nada extra. Cuando llega te avisan por SMS y tenés 7 días para retirarlo.",
      bullets: [
        "Sin costo adicional",
        "Cientos de puntos en todo el país",
        "Aviso por SMS cuando llega",
      ],
    },
  ],
  cambios: {
    show: true,
    title: "Cambios y devoluciones sin costo en 30 días",
    description:
      "Si no te convence el talle, el color o simplemente no es lo que esperabas, lo devolvés o lo cambiás gratis. Sin preguntas, sin letra chica.",
    bullets: [
      "30 días desde que recibís el pedido",
      "Envio de devolución a cargo nuestro",
      "Cambio de talle o color sin costo adicional",
      "Devolución del dinero en hasta 10 días hábiles",
      "Etiqueta de devolución por email en 24 hs",
      "Funciona en todo el país",
    ],
    cta1Text: "Pedir cambio por WhatsApp",
    cta1Href: "/contacto",
    cta2Text: "Escribir por mail",
    cta2Href: "/contacto",
  },
  faqs: [
    {
      show: true,
      q: "¿Con qué transportes trabajan?",
      a: "Trabajamos principalmente con Mercado Envíos, Correo Argentino y Andreani. A CABA y GBA también usamos servicios de encomienda rápida para entregas en 24 hs. La opción exacta la elegís al finalizar la compra.",
    },
    {
      show: true,
      q: "¿Cómo sigo mi pedido?",
      a: "Apenas despachamos te enviamos el número de seguimiento por WhatsApp y email. Ingresando el código en la web del correo podés ver el recorrido en tiempo real.",
    },
    {
      show: true,
      q: "¿Qué pasa si no hay nadie cuando entregan?",
      a: "El transporte deja un aviso de visita y vuelve en 48 h hábiles. Después del 2do intento fallido, el paquete queda en sucursal para retiro durante 7 días.",
    },
    {
      show: true,
      q: "¿Se puede retirar por algún local?",
      a: "Por ahora operamos 100% online. Podés elegir retiro sin cargo en la sucursal del correo más cercana (Correo Argentino o Andreani).",
    },
    {
      show: true,
      q: "¿El envío gratis aplica a todas las prendas?",
      a: "Sí. El envío gratis se activa automáticamente cuando el total del carrito supera los $25.000 sin importar la combinación de productos (bodys, remeras, conjuntos, accesorios, etc.).",
    },
    {
      show: true,
      q: "¿Hay costos extra en aduana para envíos internacionales?",
      a: "Para envíos dentro de Argentina no hay nada. Para Sudamérica, paquetes menores a USD 50 generalmente no pagan impuestos. Superado ese monto, el cliente se hace cargo de los aranceles de su país.",
    },
  ],
  finalCta: {
    show: true,
    title: "¿Tu duda no apareció acá?",
    description:
      "Escribinos por WhatsApp o por email y te respondemos en menos de 24 horas hábiles. También podemos revisar el estado de tu envío en vivo.",
    cta1Text: "WhatsApp",
    cta1Href: "https://wa.me/5491112345678",
    cta2Text: "Ir a contacto",
    cta2Href: "/contacto",
  },
};
