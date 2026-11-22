import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import CookieSettingsButton from "@/components/legal/CookieSettingsButton";
import Image from "next/image";
import {
  Heart,
  Undo2,
  Mail,
  MapPin,
} from "lucide-react";
import { categoryPath, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/seo";
import InstagramIcon from "@/assets/svg/instagram";

export default function Footer({
  hasOffers = true,
  categories,
}: {
  hasOffers?: boolean;
  /** Categorías de la API que tienen productos */
  categories?: { key: string; label: string }[];
}) {
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
              {(categories ?? []).map((c) => (
                <li key={c.key}>
                  <Link
                    href={categoryPath(c.key)}
                    className="hover:text-zinc-700 transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/productos"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Todos los productos
                </Link>
              </li>
              {hasOffers && (
                <li>
                  <Link
                    href="/ofertas"
                    className="hover:text-zinc-700 transition-colors"
                  >
                    Ofertas
                  </Link>
                </li>
              )}
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
                  Envíos y pagos
                </Link>
              </li>
              <li>
                <Link
                  href="/envios#costos"
                  className="hover:text-zinc-700 transition-colors"
                >
                  Medios de pago
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
                <Mail className="w-4 h-4" strokeWidth={2} />
                <Link
                  href="mailto:contacto@tatankids.com.ar"
                  className="hover:text-zinc-700 transition-colors"
                >
                  contacto@tatankids.com.ar
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <InstagramIcon className="w-4 h-4" />
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-700 transition-colors"
                >
                  @{INSTAGRAM_HANDLE}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" strokeWidth={2} />
                Buenos Aires, Argentina
              </li>
            </ul>
          </div>
        </div>

        {/* Legales (Argentina): botón de arrepentimiento (Res. SCI 424/2020),
            reclamos de consumidores (Res. SCI 274/2021) y Data Fiscal de ARCA */}
        <div className="border-t border-tatan-secundario1/40 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/arrepentimiento"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-tatan-primario4 bg-white px-4 py-2 text-sm font-extrabold text-zinc-800 hover:bg-tatan-primario1/40 transition-colors"
            >
              <Undo2 className="h-4 w-4" strokeWidth={2.4} />
              Botón de arrepentimiento
            </Link>
            <a
              href={LEGAL.consumerClaimsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs leading-snug text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <span className="font-bold">Defensa de las y los Consumidores.</span>
              <br />
              Para reclamos <span className="underline underline-offset-2">ingrese aquí</span>
            </a>
            {LEGAL.dataFiscalUrl && LEGAL.dataFiscalImage && (
              <a href={LEGAL.dataFiscalUrl} target="_blank" rel="noopener noreferrer" aria-label="Data Fiscal (ARCA)">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LEGAL.dataFiscalImage} alt="Data Fiscal" width={44} height={60} className="h-14 w-auto" />
              </a>
            )}
          </div>
          <nav aria-label="Legales" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
            <Link href="/legal/terminos" className="hover:text-zinc-800 transition-colors">Términos y condiciones</Link>
            <Link href="/legal/privacidad" className="hover:text-zinc-800 transition-colors">Política de privacidad</Link>
            <Link href="/legal/cookies" className="hover:text-zinc-800 transition-colors">Política de cookies</Link>
            <Link href="/legal/cambios" className="hover:text-zinc-800 transition-colors">Cambios y devoluciones</Link>
            <CookieSettingsButton className="hover:text-zinc-800 transition-colors" />
          </nav>
        </div>

        <div className="border-t border-tatan-secundario1/40 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-zinc-400 text-center sm:text-left">
            © {new Date().getFullYear()} {LEGAL.brand} · {LEGAL.owner}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-zinc-400 inline-flex flex-wrap items-center justify-center gap-1">
            Hecho con
            <Heart
              className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
              strokeWidth={0}
            />
            en Argentina
            <span className="mx-1 text-zinc-300">·</span>
            Web hecha por
            <a
              href="https://brian-darakdjian.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline transition-colors"
            >
              Brian Darakdjian
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
