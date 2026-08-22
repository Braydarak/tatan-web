import { Metadata } from "next";
import {
  Truck,
  Package,
  MapPin,
  CreditCard,
  Clock,
  Shield,
  Check,
  RotateCcw,
  Sparkles,
  Smartphone,
  Mail,
  Gift,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Envíos y entregas — Cómo funciona | Tatan",
  description:
    "Cómo funcionan los envíos de prendas Tatan: zonas, tiempos de entrega, costo, seguimiento, retiro sin cargo, cambios y devoluciones gratis.",
};

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

const ZONES = [
  {
    title: "CABA y GBA",
    time: "24 a 48 hábiles",
    icon: MapPin,
    color: "#D27856",
    items: [
      "Despacho en 24 h",
      "Entrega a domicilio",
      "Retiro en puntos sin cargo",
    ],
  },
  {
    title: "Interior del país",
    time: "3 a 7 días hábiles",
    icon: Truck,
    color: "#7BA5C9",
    items: [
      "Correo Argentino / Andreani",
      "Entrega a domicilio",
      "Retiro en sucursal",
    ],
  },
  {
    title: "Resto de Sudamérica",
    time: "10 a 20 días hábiles",
    icon: Package,
    color: "#E58BA0",
    items: [
      "Envío internacional",
      "Sin impuestos a < USD 50",
      "Seguimiento completo",
    ],
  },
];

const STEPS = [
  {
    step: "01",
    title: "Elegís y pagás tu pedido",
    description:
      "Agregás las prendas al carrito y pagás por Mercado Pago, transferencia o efectivo. Confirmamos stock en 2 horas hábiles.",
    icon: CreditCard,
    tone: "from-tatan-acento-rosa/40 via-white to-tatan-primario1/50",
  },
  {
    step: "02",
    title: "Armamos y despachamos",
    description:
      "Controlamos calidad, doblamos con papel de regalo y despachamos en 24 hs hábiles. Te enviamos el número de seguimiento por WhatsApp.",
    icon: Gift,
    tone: "from-tatan-acento-amarillo/40 via-white to-tatan-primario2/50",
  },
  {
    step: "03",
    title: "Te llega a la puerta",
    description:
      "Trabajamos con transportes de confianza. En CABA podés seguir en tiempo real; en el interior recibís notificación del correo.",
    icon: Truck,
    tone: "from-tatan-acento-azul/40 via-white to-tatan-primario1/50",
  },
  {
    step: "04",
    title: "Si no te convence, lo cambiás",
    description:
      "Tenés 30 días desde que recibís el pedido para cambiar de talle o devolver sin costo. Sin letra chica.",
    icon: RotateCcw,
    tone: "from-tatan-acento-verde/40 via-white to-tatan-primario2/50",
  },
];

const COSTOS = [
  {
    title: "Envío GRATIS",
    subtitle: "Compras mayores a",
    amount: "$25.000",
    badge: "Más elegido",
    details: [
      "Todas las zonas",
      "Aplica Mercado Envíos",
      "Despacho en 24 h hábiles",
    ],
    highlight: true,
  },
  {
    title: "Envío estándar",
    subtitle: "Compras menores a",
    amount: "$25.000",
    badge: "Costo fijo",
    details: [
      "CABA y GBA: $1.200",
      "Interior del país: desde $1.800",
      "Se calcula al finalizar compra",
    ],
    highlight: false,
  },
  {
    title: "Retiro sin cargo",
    subtitle: "En puntos de retiro",
    amount: "$0",
    badge: "Gratis siempre",
    details: [
      "Correo Argentino / Andreani",
      "Horarios de sucursal",
      "Te avisan por SMS cuando llega",
    ],
    highlight: false,
  },
];

const FAQS = [
  {
    q: "¿Con qué transportes trabajan?",
    a: "Trabajamos principalmente con Mercado Envíos, Correo Argentino y Andreani. A CABA y GBA también usamos servicios de encomienda rápida para entregas en 24 hs. La opción exacta la elegís al finalizar la compra.",
  },
  {
    q: "¿Cómo sigo mi pedido?",
    a: "Apenas despachamos te enviamos el número de seguimiento por WhatsApp y email. Ingresando el código en la web del correo podés ver el recorrido en tiempo real.",
  },
  {
    q: "¿Qué pasa si no hay nadie cuando entregan?",
    a: "El transporte deja un aviso de visita y vuelve en 48 h hábiles. Después del 2do intento fallido, el paquete queda en sucursal para retiro durante 7 días.",
  },
  {
    q: "¿Se puede retirar por algún local?",
    a: "Por ahora operamos 100% online. Podés elegir retiro sin cargo en la sucursal del correo más cercana (Correo Argentino o Andreani).",
  },
  {
    q: "¿El envío gratis aplica a todas las prendas?",
    a: "Sí. El envío gratis se activa automáticamente cuando el total del carrito supera los $25.000 sin importar la combinación de productos (bodys, remeras, conjuntos, accesorios, etc.).",
  },
  {
    q: "¿Hay costos extra en aduana para envíos internacionales?",
    a: "Para envíos dentro de Argentina no hay nada. Para Sudamérica, paquetes menores a USD 50 generalmente no pagan impuestos. Superado ese monto, el cliente se hace cargo de los aranceles de su país.",
  },
];

export default function EnviosPage() {
  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        {/* HERO */}
        <section id="hero" className="relative overflow-hidden scroll-mt-28">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full max-h-[620px] pointer-events-none">
            <div className="absolute -top-4 -left-8 w-64 h-64 rounded-full bg-tatan-acento-azul/30 blur-3xl" />
            <div className="absolute top-8 right-0 w-72 h-72 rounded-full bg-tatan-acento-amarillo/40 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full bg-tatan-acento-rosa/30 blur-3xl" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-1 rounded-full bg-tatan-acento-azul" />
              <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                Envíos y entregas
              </span>
            </div>
            <div className="grid gap-10 lg:grid-cols-5 lg:gap-8 items-center">
              <div className="lg:col-span-3">
                <h1 className="text-4xl sm:text-5xl font-bold text-zinc-800 leading-[1.05] max-w-3xl">
                  Tus prendas viajan seguras hasta tu casa
                </h1>
                <p className="text-base sm:text-lg text-zinc-600 mt-4 max-w-2xl leading-relaxed">
                  Explicá cómo funciona el envío de nuestros productos: zonas de
                  entrega, tiempos, costos, seguimiento y cambios sin costo.
                  Entregamos a todo el país.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/productos"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-tatan-primario1 to-tatan-primario2 px-6 py-3 text-sm font-extrabold text-zinc-900 shadow-[0_8px_20px_-12px_rgba(214,149,85,0.65)] hover:brightness-[1.03] transition-all"
                  >
                    Ver productos
                  </Link>
                  <Link
                    href="#zonas"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" strokeWidth={2} />
                    Ver zonas y tiempos
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="paper-card rounded-[2rem] p-5 sm:p-6 bg-gradient-to-br from-tatan-acento-azul/30 via-tatan-primario1/20 to-tatan-acento-amarillo/20 border border-white/60 shadow-[0_18px_48px_-24px_rgba(103,146,137,0.35)]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 rounded-3xl bg-white/80 p-4 flex items-start gap-3">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7FBFF] text-[#5B85A8] shadow-sm">
                        <Truck className="w-5 h-5" strokeWidth={1.9} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-500">
                          Tiempo promedio
                        </p>
                        <p className="text-xl font-extrabold text-zinc-800 leading-tight mt-0.5">
                          3-7 días hábiles
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Interior del país
                        </p>
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white/80 p-4 flex flex-col gap-1.5">
                      <div className="inline-flex items-center gap-1.5 text-[#599E7D]">
                        <Check className="w-4 h-4" strokeWidth={2.4} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Gratis
                        </span>
                      </div>
                      <p className="text-lg font-extrabold text-zinc-800 leading-tight">
                        $25k+
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-tight">
                        Envío sin costo
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white/80 p-4 flex flex-col gap-1.5">
                      <div className="inline-flex items-center gap-1.5 text-[#D27856]">
                        <Shield className="w-4 h-4" strokeWidth={2} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          30 días
                        </span>
                      </div>
                      <p className="text-lg font-extrabold text-zinc-800 leading-tight">
                        Cambios
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-tight">
                        Sin letra chica
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ZONAS Y TIEMPOS */}
        <section
          id="zonas"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 scroll-mt-28"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-6 h-1 rounded-full bg-tatan-acento-amarillo" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                  Zonas de entrega
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
                Enviamos a todo el país y Sudamérica
              </h2>
            </div>
            <p className="max-w-md text-sm text-zinc-600 leading-relaxed">
              Los tiempos son estimados desde el despacho (24 h hábiles después
              de acreditado el pago). Feriados y fin de semana no se cuentan.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {ZONES.map((z, i) => (
              <article
                key={z.title}
                className={cx(
                  "paper-card rounded-3xl p-5 sm:p-6 border border-white/60 transition-transform duration-200",
                  i === 1
                    ? "bg-gradient-to-br from-tatan-acento-azul/30 via-tatan-primario1/20 to-tatan-primario2/30 -translate-y-1"
                    : "bg-white/80",
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm"
                    style={{ color: z.color }}
                  >
                    <z.icon className="w-5.5 h-5.5" strokeWidth={1.9} />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-700 shadow-sm border border-black/5">
                    {z.time}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-zinc-800">
                  {z.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {z.items.map((it) => (
                    <li
                      key={it}
                      className="flex items-start gap-2 text-sm text-zinc-600"
                    >
                      <Check
                        className="w-4 h-4 mt-0.5 text-tatan-acento-verde shrink-0"
                        strokeWidth={2.4}
                      />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* COSTOS */}
        <section id="costos" className="relative py-16 sm:py-20 scroll-mt-28">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FFFBF2]/60 to-white" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-6 h-1 rounded-full bg-tatan-primario1" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                  Costos
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
                Envío gratis en compras mayores a $25.000
              </h2>
              <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">
                Sin costos sorpresa. El valor final aparece antes de pagar y se
                calcula según tu zona y el monto del carrito.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
              {COSTOS.map((c) => (
                <article
                  key={c.title}
                  className={cx(
                    "paper-card rounded-3xl p-6 sm:p-7 border flex flex-col",
                    c.highlight
                      ? "bg-gradient-to-br from-tatan-primario1/40 via-tatan-primario3/30 to-tatan-acento-amarillo/40 border-tatan-primario2/60 lg:-translate-y-2 shadow-xl"
                      : "bg-white/80 border-black/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        {c.subtitle}
                      </p>
                      <h3 className="mt-0.5 text-lg sm:text-xl font-extrabold text-zinc-800 leading-tight">
                        {c.title}
                      </h3>
                    </div>
                    <span
                      className={cx(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider whitespace-nowrap",
                        c.highlight
                          ? "bg-white text-tatan-secundario2 shadow-sm"
                          : "bg-tatan-primario1/30 text-tatan-secundario2",
                      )}
                    >
                      <Sparkles
                        className={cx(
                          "w-3 h-3",
                          c.highlight
                            ? "text-tatan-primario1"
                            : "text-tatan-secundario2",
                        )}
                        strokeWidth={2.2}
                      />
                      {c.badge}
                    </span>
                  </div>
                  <div className="mt-4 pb-4 border-b border-black/5">
                    <p
                      className={cx(
                        "font-extrabold tracking-tight leading-none",
                        c.highlight
                          ? "text-5xl text-tatan-secundario2"
                          : "text-4xl text-zinc-800",
                      )}
                    >
                      {c.amount}
                    </p>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {c.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-sm text-zinc-700"
                      >
                        <Check
                          className={cx(
                            "w-4 h-4 mt-0.5 shrink-0",
                            c.highlight
                              ? "text-tatan-secundario2"
                              : "text-tatan-acento-verde",
                          )}
                          strokeWidth={2.4}
                        />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-black/5">
                    <Link
                      href="/productos"
                      className={cx(
                        "inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors",
                        c.highlight
                          ? "bg-white text-tatan-secundario2 hover:bg-tatan-secundario2 hover:text-tatan-primario3 shadow-sm"
                          : "bg-zinc-900 text-white hover:bg-zinc-800",
                      )}
                    >
                      Ver prendas
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESO PASO A PASO */}
        <section
          id="proceso"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 scroll-mt-28"
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-6 h-1 rounded-full bg-tatan-acento-rosa" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                Cómo funciona
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
              Del carrito a la puerta de tu casa en 4 pasos
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">
              Te contamos todo el recorrido que hace tu pedido desde que pagás
              hasta que estás abrazando tus prendas nuevas.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <article
                key={s.step}
                className="relative paper-card rounded-3xl p-5 sm:p-6 border border-black/5 bg-gradient-to-br overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${s.tone} opacity-90`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-tatan-secundario2">
                      <s.icon className="w-5 h-5" strokeWidth={2} />
                    </span>
                    <span className="text-3xl font-black text-white/70 tracking-tighter">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-zinc-800 leading-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-700 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SEGUIMIENTO Y RETIRO */}
        <section
          id="seguimiento"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-28"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="paper-card rounded-3xl p-6 sm:p-7 border border-black/5 bg-gradient-to-br from-white to-[#F7FBFF]/60">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tatan-acento-azul/20 text-[#5B85A8] shadow-sm">
                  <Clock className="w-5.5 h-5.5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold text-zinc-800 leading-tight">
                    Seguimiento en tiempo real
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    Apenas despachamos tu pedido te enviamos un código por
                    WhatsApp y email. Desde la web del correo o la app de
                    Mercado Libre podés seguir el recorrido paso a paso, ver la
                    hora estimada de entrega y dejar instrucciones si no vas a
                    estar.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {[
                      "Número único por pedido",
                      "Notificaciones por SMS/WhatsApp",
                      "Fecha estimada visible",
                    ].map((t) => (
                      <li
                        key={t}
                        className="flex items-start gap-2 text-sm text-zinc-700"
                      >
                        <Check
                          className="w-4 h-4 mt-0.5 text-[#599E7D] shrink-0"
                          strokeWidth={2.4}
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
            <article className="paper-card rounded-3xl p-6 sm:p-7 border border-black/5 bg-gradient-to-br from-white to-[#FFFBF4]/80">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tatan-acento-verde/20 text-tatan-acento-verde shadow-sm">
                  <Package className="w-5.5 h-5.5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold text-zinc-800 leading-tight">
                    Retiro sin cargo en sucursal
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    Si preferís pasar a buscarlo vos, al finalizar la compra
                    podés elegir la sucursal de Correo Argentino o Andreani más
                    cercana. No pagás nada extra. Cuando llega te avisan por SMS
                    y tenés 7 días para retirarlo.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {[
                      "Sin costo adicional",
                      "Cientos de puntos en todo el país",
                      "Aviso por SMS cuando llega",
                    ].map((t) => (
                      <li
                        key={t}
                        className="flex items-start gap-2 text-sm text-zinc-700"
                      >
                        <Check
                          className="w-4 h-4 mt-0.5 text-tatan-acento-verde shrink-0"
                          strokeWidth={2.4}
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* CAMBIOS */}
        <section id="cambios" className="relative py-16 scroll-mt-28">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FFF3EE]/60 to-white" />
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="paper-card rounded-[2rem] p-6 sm:p-10 lg:p-12 border border-white/80 bg-gradient-to-br from-tatan-acento-rosa/30 via-tatan-primario1/30 to-tatan-acento-amarillo/30">
              <div className="grid gap-8 lg:grid-cols-5 lg:gap-10 items-center">
                <div className="lg:col-span-2">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm text-tatan-acento-rosa">
                    <RotateCcw className="w-7 h-7" strokeWidth={2} />
                  </div>
                  <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
                    Cambios y devoluciones sin costo en 30 días
                  </h2>
                  <p className="mt-3 text-base text-zinc-700 leading-relaxed">
                    Si no te convence el talle, el color o simplemente no es lo
                    que esperabas, lo devolvés o lo cambiás gratis. Sin
                    preguntas, sin letra chica.
                  </p>
                </div>
                <div className="lg:col-span-3 grid sm:grid-cols-2 gap-3">
                  {[
                    "30 días desde que recibís el pedido",
                    "Envio de devolución a cargo nuestro",
                    "Cambio de talle o color sin costo adicional",
                    "Devolución del dinero en hasta 10 días hábiles",
                    "Etiqueta de devolución por email en 24 hs",
                    "Funciona en todo el país",
                  ].map((t) => (
                    <div
                      key={t}
                      className="rounded-2xl bg-white/80 p-3.5 flex items-start gap-2.5 border border-black/5"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tatan-primario1/50 text-tatan-secundario2">
                        <Check className="w-4 h-4" strokeWidth={2.6} />
                      </span>
                      <p className="text-sm text-zinc-700 leading-snug pt-0.5">
                        {t}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Pedir cambio por WhatsApp
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-bold text-zinc-800 hover:bg-tatan-primario3/40 transition-colors"
                >
                  <Mail className="w-4 h-4" strokeWidth={2} />
                  Escribir por mail
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQS */}
        <section
          id="faq"
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-28"
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-6 h-1 rounded-full bg-tatan-primario2" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                Preguntas frecuentes
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
              Todo lo que querés saber de los envíos
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={`faq-${f.q}`}
                className="group paper-card rounded-2xl border border-black/5 bg-white/90 overflow-hidden"
              >
                <summary className="list-none cursor-pointer px-5 sm:px-6 py-4 sm:py-4.5 flex items-start justify-between gap-4 hover:bg-[#FFFBF4]/70 transition-colors">
                  <span className="text-base sm:text-lg font-bold text-zinc-800 leading-snug pt-0.5">
                    {f.q}
                  </span>
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tatan-primario1/40 text-tatan-secundario2 group-open:rotate-180 transition-transform duration-200">
                    <ChevronDown className="w-4 h-4" strokeWidth={2.4} />
                  </span>
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-1">
                  <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-3xl">
                    {f.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA CONTACTO */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="paper-card rounded-[2rem] p-6 sm:p-8 border border-white/80 bg-gradient-to-br from-tatan-primario2/40 via-tatan-acento-amarillo/40 to-tatan-primario1/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-800 leading-tight">
                ¿Tu duda no apareció acá?
              </h3>
              <p className="mt-2 text-sm sm:text-base text-zinc-700 leading-relaxed max-w-xl">
                Escribinos por WhatsApp o por email y te respondemos en menos de
                24 horas hábiles. También podemos revisar el estado de tu envío
                en vivo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://wa.me/5491112345678"
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-colors"
              >
                <Smartphone className="w-4 h-4" strokeWidth={2} />
                WhatsApp
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-zinc-800 border border-black/10 hover:bg-tatan-primario3/60 transition-colors"
              >
                <Mail className="w-4 h-4" strokeWidth={2} />
                Ir a contacto
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
