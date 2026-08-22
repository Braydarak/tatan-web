import { Metadata } from "next";
import ContactForm from "./ContactForm";
import {
  Mail,
  Smartphone,
  MapPin,
  Clock,
  Shield,
  Send,
  Sparkles,
  Heart,
  Flower2,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contacto Tatan — Atención al cliente",
  description:
    "Contactanos por WhatsApp, mail o teléfono. Respuesta en menos de 24h hábiles. Atención al cliente Tatan ropa infantil.",
};

const INFO_CARDS = [
  {
    title: "E-mail",
    content: "hola@tatan.com",
    href: "mailto:hola@tatan.com",
    Icon: Mail,
    tone: "from-tatan-acento-rosa/40 to-tatan-primario1/50 text-tatan-secundario2",
  },
  {
    title: "WhatsApp",
    content: "+54 9 11 1234-5678",
    href: "https://wa.me/5491112345678",
    Icon: Smartphone,
    tone: "from-tatan-acento-verde/40 to-tatan-primario2/50 text-tatan-secundario2",
  },
  {
    title: "Ubicación",
    content: "Buenos Aires, Argentina",
    href: "https://www.google.com/maps/place/Buenos+Aires",
    Icon: MapPin,
    tone: "from-tatan-acento-azul/40 to-tatan-primario1/50 text-tatan-secundario2",
  },
  {
    title: "Horarios",
    content: "Lun–Vie 9–18hs · Sáb 10–13hs",
    href: undefined,
    Icon: Clock,
    tone: "from-tatan-acento-amarillo/40 to-tatan-primario3/50 text-tatan-secundario2",
  },
];

const FAQS = [
  {
    q: "¿Cuánto tarda en llegar mi pedido?",
    a: "Despachamos en 24hs hábiles. Envíos a CABA en 24–48hs, resto del país 3–7 días hábiles.",
  },
  {
    q: "¿Puedo cambiar o devolver una prenda?",
    a: "Sí. Tenés 30 días después de recibirlo para cambiar o devolver sin costo.",
  },
  {
    q: "¿Qué medios de pago aceptan?",
    a: "Mercado Pago, tarjetas hasta 12 cuotas, transferencia bancaria y efectivo puntos de retiro.",
  },
];

export default function ContactoPage() {
  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full max-h-[560px] pointer-events-none">
            <div className="absolute top-0 -left-8 w-56 h-56 rounded-full bg-tatan-acento-rosa/40 blur-3xl" />
            <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-tatan-acento-amarillo/40 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full bg-tatan-acento-azul/30 blur-3xl" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-1 rounded-full bg-tatan-primario4" />
              <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                Atención al cliente
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-800 leading-tight max-w-2xl">
              Estamos para ayudarte
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 mt-4 max-w-2xl leading-relaxed">
              Escribinos por el medio que prefieras. Respondemos en menos de 24
              horas hábiles de lunes a viernes.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid gap-6 md:grid-cols-5 md:gap-8">
            <div className="md:col-span-3 paper-card rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-tatan-primario1/60 to-tatan-acento-rosa/40">
                  <Send
                    className="w-5 h-5 text-tatan-secundario2"
                    strokeWidth={2.2}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-800 leading-tight">
                    Envianos un mensaje
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Respondemos a todos los correos.
                  </p>
                </div>
              </div>
              <ContactForm />
            </div>

            <div className="md:col-span-2 space-y-4">
              {INFO_CARDS.map(({ Icon, title, content, href, tone }) => {
                const Inner = (
                  <div className="paper-card rounded-3xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${tone}`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        {title}
                      </p>
                      <p className="text-sm font-semibold text-zinc-800 break-words">
                        {content}
                      </p>
                    </div>
                  </div>
                );
                return href ? (
                  <Link key={title} href={href} className="block">
                    {Inner}
                  </Link>
                ) : (
                  <div key={title}>{Inner}</div>
                );
              })}

              <div className="paper-card rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield
                    className="w-4 h-4 text-tatan-primario4"
                    strokeWidth={2.2}
                  />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-700">
                    Seguinos
                  </h3>
                </div>
                <p className="text-sm text-zinc-500 mb-4">
                  Nuevos ingresos, ofertas y tips de moda bebé todas las
                  semanas.
                </p>
                <div className="flex gap-3">
                  {[
                    { Icon: Sparkles, label: "Instagram", href: "#" },
                    { Icon: Heart, label: "Facebook", href: "#" },
                    { Icon: Flower2, label: "TikTok", href: "#" },
                  ].map(({ Icon, label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="w-11 h-11 rounded-2xl border border-tatan-secundario1/40 bg-white flex items-center justify-center text-zinc-600 hover:bg-tatan-primario1/30 transition-colors"
                      aria-label={label}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 paper-card rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-tatan-primario1/30 via-tatan-acento-amarillo/20 to-tatan-primario2/30">
            <h3 className="text-2xl sm:text-3xl font-bold text-zinc-800 mb-8">
              Preguntas frecuentes
            </h3>
            <div className="space-y-5">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="rounded-2xl bg-white/70 p-5 sm:p-6">
                  <p className="text-base font-extrabold text-zinc-800 mb-1">
                    {q}
                  </p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
