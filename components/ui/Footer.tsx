import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Smartphone,
  Mail,
  MapPin,
  Share2,
  Users,
  Music2,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-tatan-secundario1/50 mt-8 relative z-10 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1] rounded-xl"
              aria-label="Ir al inicio"
            >
              <div
                className="relative"
                style={{ width: "auto", height: "40px", aspectRatio: "2 / 1" }}
              >
                <Image
                  fill
                  src="/tatanLogo.png"
                  alt="Tatan logo"
                  sizes="80px"
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Ropa hecha con amor para bebés y niños. Calidad y comodidad en
              cada prenda.
            </p>
          </div>

          <div className="hidden sm:block">
            <h4 className="font-bold text-zinc-800 mb-3">Comprar</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link
                  href="/productos?c=body"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Bodys
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?c=remera"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Remeras
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?c=pijama"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Pijamas
                </Link>
              </li>
              <li>
                <Link
                  href="/ofertas"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Ofertas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-zinc-800 mb-3">Ayuda</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link
                  href="/envios#zonas"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Envíos y entregas
                </Link>
              </li>
              <li>
                <Link
                  href="/envios#cambios"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Cambios y devoluciones
                </Link>
              </li>
              <li>
                <Link
                  href="/envios#costos"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Medios de pago y costos
                </Link>
              </li>
              <li>
                <Link
                  href="/envios#faq"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-zinc-800 mb-3">Contacto</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" strokeWidth={2} />
                WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" strokeWidth={2} />
                <Link
                  href="mailto:hola@tatan.com"
                  className="hover:text-zinc-700 transition-colors"
                >
                  hola@tatan.com
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" strokeWidth={2} />
                Buenos Aires, Argentina
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              {[
                { Icon: Share2, label: "Instagram", href: "#" },
                { Icon: Users, label: "Facebook", href: "#" },
                { Icon: Music2, label: "TikTok", href: "#" },
              ].map(({ Icon, label, href }, i) => (
                <Link
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-full paper-card flex items-center justify-center text-zinc-600 hover:bg-tatan-primario1/30 transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-tatan-secundario1/40 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} Tatan. Todos los derechos reservados.
          </p>
          <p className="text-xs text-zinc-400 inline-flex items-center gap-1">
            Hecho con
            <Heart
              className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
              strokeWidth={0}
            />
            en Argentina
          </p>
        </div>
      </div>
    </footer>
  );
}
