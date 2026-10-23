import { Metadata } from "next";
import {
  Truck,
  Package,
  MapPin,
  CreditCard,
  Clock,
  Check,
  RotateCcw,
  Sparkles,
  Smartphone,
  Mail,
  Gift,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import type {
  EnviosData,
  ZoneIconKey,
  StepIconKey,
} from "@/components/sections/EnviosEditor";
import { ENVIOS_DEFAULT } from "@/lib/site-content-defaults";

export const metadata: Metadata = {
  title: "Envíos y entregas — Cómo funciona | Tatan",
  description:
    "Cómo funcionan los envíos de prendas Tatan: zonas, tiempos de entrega, costo, seguimiento, retiro sin cargo, cambios y devoluciones gratis.",
};

const PHP_API_BASE = "https://tatankids.com.ar/api";

const ZONE_ICONS: Record<ZoneIconKey, typeof MapPin> = {
  MapPin,
  Truck,
  Package,
};

const STEP_ICONS: Record<StepIconKey, typeof CreditCard> = {
  CreditCard,
  Gift,
  Truck,
  RotateCcw,
};

const SEGUIMIENTO_ICONS = { Clock, Package } as const;

const STAT_ICONS = { Truck, Sparkles, RotateCcw } as const;
type StatIconKey = keyof typeof STAT_ICONS;

async function fetchEnviosSSR(): Promise<EnviosData | null> {
  try {
    const res = await fetch(`${PHP_API_BASE}/site-content.php?key=envios`, {
      next: { revalidate: 60, tags: ["tatan-site-content"] },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; data?: EnviosData };
    return json?.ok && json.data ? json.data : null;
  } catch {
    return null;
  }
}

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export default async function EnviosPage() {
  const data = (await fetchEnviosSSR()) ?? ENVIOS_DEFAULT;
  const { sections, hero } = data;
  const zones = data.zones.filter((z) => z.show);
  const costos = data.costos.filter((c) => c.show);
  const steps = data.steps.filter((s) => s.show);
  const seguimiento = data.seguimiento.filter((s) => s.show);
  const faqs = data.faqs.filter((f) => f.show);
  const { cambios, finalCta } = data;
  const HeroStatIcon: (typeof STAT_ICONS)[StatIconKey] =
    STAT_ICONS[hero.stats[0].iconKey];

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <main className="flex-1 w-full">
        {/* HERO */}
        {hero.show && (
          <section id="hero" className="relative overflow-hidden scroll-mt-28">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full max-h-[620px] pointer-events-none">
              <div className="absolute -top-4 -left-8 w-64 h-64 rounded-full bg-tatan-acento-azul/30 blur-3xl" />
              <div className="absolute top-8 right-0 w-72 h-72 rounded-full bg-tatan-acento-amarillo/40 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full bg-tatan-acento-rosa/30 blur-3xl" />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <span
                  className="w-8 h-1 rounded-full"
                  style={{ backgroundColor: sections.zones.eyebrowBarColor }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                  {hero.eyebrow}
                </span>
              </div>
              <div className="grid gap-10 lg:grid-cols-5 lg:gap-8 items-center">
                <div className="lg:col-span-3">
                  <h1 className="text-4xl sm:text-5xl font-bold text-zinc-800 leading-[1.05] max-w-3xl">
                    {hero.title}
                  </h1>
                  <p className="text-base sm:text-lg text-zinc-600 mt-4 max-w-2xl leading-relaxed">
                    {hero.subtitle}
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link
                      href={hero.ctaPrimaryHref || "/productos"}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-tatan-primario1 to-tatan-primario2 px-6 py-3 text-sm font-extrabold text-zinc-900 shadow-[0_8px_20px_-12px_rgba(214,149,85,0.65)] hover:brightness-[1.03] transition-all"
                    >
                      {hero.ctaPrimaryText}
                    </Link>
                    <Link
                      href={hero.ctaSecondaryHref || "#zonas"}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-white transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" strokeWidth={2} />
                      {hero.ctaSecondaryText}
                    </Link>
                  </div>
                </div>
                {hero.summaryCardShow && (
                  <div className="lg:col-span-2">
                    <div className="paper-card rounded-[2rem] p-5 sm:p-6 bg-gradient-to-br from-tatan-acento-azul/30 via-tatan-primario1/20 to-tatan-acento-amarillo/20 border border-white/60 shadow-[0_18px_48px_-24px_rgba(103,146,137,0.35)]">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 rounded-3xl bg-white/80 p-4 flex items-start gap-3">
                          <div
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                            style={{
                              backgroundColor: hero.stats[0].tintBg,
                              color: hero.stats[0].tone,
                            }}
                          >
                            <HeroStatIcon
                              className="w-5 h-5"
                              strokeWidth={1.9}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-500">
                              {hero.stats[0].label}
                            </p>
                            <p className="text-xl font-extrabold text-zinc-800 leading-tight mt-0.5">
                              {hero.summaryTime}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {hero.summaryTimeLabel}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-3xl bg-white/80 p-4 flex flex-col gap-1.5">
                          <div
                            className="inline-flex items-center gap-1.5"
                            style={{ color: hero.stats[1].tone }}
                          >
                            <Check className="w-4 h-4" strokeWidth={2.4} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {hero.summaryFreeBadgeText}
                            </span>
                          </div>
                          <p className="text-lg font-extrabold text-zinc-800 leading-tight">
                            {hero.summaryFreeAmount}
                          </p>
                          <p className="text-[11px] text-zinc-500 leading-tight">
                            {hero.summaryFreeLabel}
                          </p>
                        </div>
                        <div className="rounded-3xl bg-white/80 p-4 flex flex-col gap-1.5">
                          <div
                            className="inline-flex items-center gap-1.5"
                            style={{ color: hero.stats[2].tone }}
                          >
                            <RotateCcw className="w-4 h-4" strokeWidth={2} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {hero.summaryChangesDays}
                            </span>
                          </div>
                          <p className="text-lg font-extrabold text-zinc-800 leading-tight">
                            {hero.summaryChangesTitle}
                          </p>
                          <p className="text-[11px] text-zinc-500 leading-tight">
                            {hero.summaryChangesLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ZONAS Y TIEMPOS */}
        {sections.zones.show && (
          <section
            id="zonas"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 scroll-mt-28"
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                {sections.zones.showEyebrow && (
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span
                      className="w-6 h-1 rounded-full"
                      style={{
                        backgroundColor: sections.zones.eyebrowBarColor,
                      }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                      {sections.zones.eyebrow}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
                  {sections.zones.title}
                </h2>
              </div>
              {sections.zones.showDescription && (
                <p className="max-w-md text-sm text-zinc-600 leading-relaxed">
                  {sections.zones.description}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {zones.map((z, i) => {
                const Icon = ZONE_ICONS[z.iconKey];
                return (
                  <article
                    key={`zone-${i}`}
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
                        {z.showIcon && (
                          <Icon className="w-5.5 h-5.5" strokeWidth={1.9} />
                        )}
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
                );
              })}
            </div>
          </section>
        )}

        {/* COSTOS */}
        {sections.costos.show && (
          <section id="costos" className="relative py-16 sm:py-20 scroll-mt-28">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FFFBF2]/60 to-white" />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                {sections.costos.showEyebrow && (
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span
                      className="w-6 h-1 rounded-full"
                      style={{
                        backgroundColor: sections.costos.eyebrowBarColor,
                      }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                      {sections.costos.eyebrow}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
                  {sections.costos.title}
                </h2>
                {sections.costos.showDescription && (
                  <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">
                    {sections.costos.description}
                  </p>
                )}
              </div>
              <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
                {costos.map((c, i) => (
                  <article
                    key={`costo-${i}`}
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
                        href={c.ctaHref || "/productos"}
                        className={cx(
                          "inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors",
                          c.highlight
                            ? "bg-white text-tatan-secundario2 hover:bg-tatan-secundario2 hover:text-tatan-primario3 shadow-sm"
                            : "bg-zinc-900 text-white hover:bg-zinc-800",
                        )}
                      >
                        {c.ctaText}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PROCESO PASO A PASO */}
        {sections.proceso.show && (
          <section
            id="proceso"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 scroll-mt-28"
          >
            <div className="text-center max-w-2xl mx-auto mb-10">
              {sections.proceso.showEyebrow && (
                <div className="inline-flex items-center gap-2 mb-2">
                  <span
                    className="w-6 h-1 rounded-full"
                    style={{
                      backgroundColor: sections.proceso.eyebrowBarColor,
                    }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                    {sections.proceso.eyebrow}
                  </span>
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
                {sections.proceso.title}
              </h2>
              {sections.proceso.showDescription && (
                <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">
                  {sections.proceso.description}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => {
                const Icon = STEP_ICONS[s.iconKey];
                return (
                  <article
                    key={`step-${i}`}
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
                          {s.showIcon && (
                            <Icon className="w-5 h-5" strokeWidth={2} />
                          )}
                        </span>
                        <span className="text-3xl font-black text-white/70 tracking-tighter">
                          {s.number}
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
                );
              })}
            </div>
          </section>
        )}

        {/* SEGUIMIENTO Y RETIRO */}
        {sections.seguimiento.show && (
          <section
            id="seguimiento"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-28"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {seguimiento.map((s, i) => {
                const Icon = SEGUIMIENTO_ICONS[s.iconKey];
                return (
                  <article
                    key={`seg-${i}`}
                    className="paper-card rounded-3xl p-6 sm:p-7 border border-black/5 bg-gradient-to-br from-white to-[#F7FBFF]/60"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                        style={{
                          backgroundColor: s.iconBg,
                          color: s.iconColor,
                        }}
                      >
                        {s.showIcon && (
                          <Icon className="w-5.5 h-5.5" strokeWidth={2} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-extrabold text-zinc-800 leading-tight">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                          {s.description}
                        </p>
                        <ul className="mt-4 space-y-2">
                          {s.bullets.map((t) => (
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
                );
              })}
            </div>
          </section>
        )}

        {/* CAMBIOS */}
        {sections.cambios.show && (
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
                      {cambios.title}
                    </h2>
                    <p className="mt-3 text-base text-zinc-700 leading-relaxed">
                      {cambios.description}
                    </p>
                  </div>
                  <div className="lg:col-span-3 grid sm:grid-cols-2 gap-3">
                    {cambios.bullets.map((t) => (
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
                    href={cambios.cta1Href || "/contacto"}
                    className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    {cambios.cta1Text}
                  </Link>
                  <Link
                    href={cambios.cta2Href || "/contacto"}
                    className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-bold text-zinc-800 hover:bg-tatan-primario3/40 transition-colors"
                  >
                    <Mail className="w-4 h-4" strokeWidth={2} />
                    {cambios.cta2Text}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQS */}
        {sections.faq.show && (
          <section
            id="faq"
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-28"
          >
            <div className="text-center max-w-2xl mx-auto mb-10">
              {sections.faq.showEyebrow && (
                <div className="inline-flex items-center gap-2 mb-2">
                  <span
                    className="w-6 h-1 rounded-full"
                    style={{ backgroundColor: sections.faq.eyebrowBarColor }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                    {sections.faq.eyebrow}
                  </span>
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-800 leading-tight">
                {sections.faq.title}
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
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
        )}

        {/* CTA CONTACTO */}
        {sections.finalCta.show && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="paper-card rounded-[2rem] p-6 sm:p-8 border border-white/80 bg-gradient-to-br from-tatan-primario2/40 via-tatan-acento-amarillo/40 to-tatan-primario1/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-800 leading-tight">
                  {finalCta.title}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-zinc-700 leading-relaxed max-w-xl">
                  {finalCta.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={finalCta.cta1Href || "/contacto"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-colors"
                >
                  <Smartphone className="w-4 h-4" strokeWidth={2} />
                  {finalCta.cta1Text}
                </Link>
                <Link
                  href={finalCta.cta2Href || "/contacto"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-zinc-800 border border-black/10 hover:bg-tatan-primario3/60 transition-colors"
                >
                  <Mail className="w-4 h-4" strokeWidth={2} />
                  {finalCta.cta2Text}
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
