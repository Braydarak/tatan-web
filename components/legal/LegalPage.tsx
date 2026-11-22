import Link from "next/link";
import { LEGAL } from "@/lib/legal";

/**
 * Diseño común de las páginas legales: título, fecha de actualización,
 * índice de las otras páginas y el texto en una tarjeta.
 */

const PAGES = [
  { href: "/legal/terminos", label: "Términos y condiciones" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/cambios", label: "Cambios y devoluciones" },
  { href: "/arrepentimiento", label: "Botón de arrepentimiento" },
];

export default function LegalPage({
  title,
  intro,
  path,
  children,
}: {
  title: string;
  intro?: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full max-h-[420px] pointer-events-none">
            <div className="absolute -top-4 -left-8 w-56 h-56 rounded-full bg-tatan-acento-azul/25 blur-3xl" />
            <div className="absolute top-8 right-0 w-64 h-64 rounded-full bg-tatan-acento-amarillo/30 blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-8 h-1 rounded-full bg-tatan-primario4" />
              <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">Legales</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-800 leading-tight">{title}</h1>
            {intro && <p className="mt-3 text-base text-zinc-600 leading-relaxed">{intro}</p>}
            <p className="mt-2 text-xs text-zinc-400">Última actualización: {LEGAL.updated}</p>
            <nav aria-label="Páginas legales" className="mt-5 flex flex-wrap gap-2">
              {PAGES.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  aria-current={p.href === path ? "page" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    p.href === path
                      ? "border-tatan-primario4 bg-tatan-primario1/60 text-zinc-800"
                      : "border-black/10 bg-white/70 text-zinc-600 hover:bg-white"
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="paper-card rounded-3xl p-6 sm:p-9 legal-prose">{children}</div>
        </section>
      </main>
    </div>
  );
}
