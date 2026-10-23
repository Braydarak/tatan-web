"use client";

import CustomButton from "@/components/ui/CustomButton";
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
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { apiSiteContent, apiSiteContentSave } from "@/lib/tatan-api";
import { ENVIOS_DEFAULT as DEFAULT_ENVios } from "@/lib/site-content-defaults";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/* ---------- Types ---------- */

export type ZoneIconKey = "MapPin" | "Truck" | "Package";
export type StepIconKey = "CreditCard" | "Gift" | "Truck" | "RotateCcw";
export type BenefitBadgeTone = "green" | "pink" | "orange";

export type EnviosHeroSummaryStat = {
  show: boolean;
  showIcon: boolean;
  iconKey: "Truck" | "Sparkles" | "RotateCcw";
  label: string;
  value: string;
  tone: string;
  tintBg: string;
};

export type EnviosHero = {
  show: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaSecondaryText: string;
  ctaSecondaryHref: string;
  summaryCardShow: boolean;
  summaryTime: string;
  summaryTimeLabel: string;
  summaryFreeBadgeText: string;
  summaryFreeAmount: string;
  summaryFreeLabel: string;
  summaryChangesDays: string;
  summaryChangesTitle: string;
  summaryChangesLabel: string;
  stats: [EnviosHeroSummaryStat, EnviosHeroSummaryStat, EnviosHeroSummaryStat];
};

export type EnviosZone = {
  show: boolean;
  showIcon: boolean;
  iconKey: ZoneIconKey;
  color: string;
  title: string;
  time: string;
  items: string[];
};

export type EnviosCostCard = {
  show: boolean;
  title: string;
  subtitle: string;
  amount: string;
  badge: string;
  details: string[];
  ctaText: string;
  ctaHref: string;
  highlight: boolean;
};

export type EnviosStep = {
  show: boolean;
  showIcon: boolean;
  iconKey: StepIconKey;
  number: string;
  title: string;
  description: string;
  tone: string;
};

export type EnviosSeguimientoCard = {
  show: boolean;
  showIcon: boolean;
  iconKey: "Clock" | "Package";
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  bullets: string[];
};

export type EnviosCambios = {
  show: boolean;
  title: string;
  description: string;
  bullets: string[];
  cta1Text: string;
  cta1Href: string;
  cta2Text: string;
  cta2Href: string;
};

export type EnviosFaq = { show: boolean; q: string; a: string };

export type EnviosCta = {
  show: boolean;
  title: string;
  description: string;
  cta1Text: string;
  cta1Href: string;
  cta2Text: string;
  cta2Href: string;
};

export type EnviosSectionHeader = {
  showEyebrow: boolean;
  eyebrow: string;
  eyebrowBarColor: string;
  title: string;
  description: string;
  showDescription: boolean;
};

export type EnviosData = {
  sections: {
    zones: EnviosSectionHeader & { show: boolean };
    costos: EnviosSectionHeader & { show: boolean };
    proceso: EnviosSectionHeader & { show: boolean };
    seguimiento: { show: boolean };
    cambios: { show: boolean };
    faq: EnviosSectionHeader & { show: boolean };
    finalCta: { show: boolean };
  };
  hero: EnviosHero;
  zones: [EnviosZone, EnviosZone, EnviosZone];
  costos: [EnviosCostCard, EnviosCostCard, EnviosCostCard];
  steps: [EnviosStep, EnviosStep, EnviosStep, EnviosStep];
  seguimiento: [EnviosSeguimientoCard, EnviosSeguimientoCard];
  cambios: EnviosCambios;
  faqs: EnviosFaq[];
  finalCta: EnviosCta;
};

/* ---------- Helpers ---------- */

type Toast = { id: number; kind: "ok" | "error"; msg: string } | null;

function mergeByIndex<T>(defaults: T[], parsed?: unknown[] | null): T[] {
  if (!Array.isArray(parsed) || parsed.length === 0) return defaults;
  return defaults.map((d, i) => ({
    ...d,
    ...(typeof parsed[i] === "object" && parsed[i] !== null
      ? (parsed[i] as Partial<T>)
      : ({} as Partial<T>)),
  }));
}

function mergeEnvios(defaults: EnviosData, raw: unknown): EnviosData {
  const p = (
    typeof raw === "string" ? JSON.parse(raw) : (raw ?? {})
  ) as Partial<EnviosData>;
  return {
    ...defaults,
    ...p,
    sections: { ...defaults.sections, ...(p.sections ?? {}) },
    hero: {
      ...defaults.hero,
      ...(p.hero ?? {}),
      stats: mergeByIndex(defaults.hero.stats, p.hero?.stats ?? null) as [
        EnviosHeroSummaryStat,
        EnviosHeroSummaryStat,
        EnviosHeroSummaryStat,
      ],
    },
    zones: mergeByIndex(defaults.zones, p.zones ?? null) as [
      EnviosZone,
      EnviosZone,
      EnviosZone,
    ],
    costos: mergeByIndex(defaults.costos, p.costos ?? null) as [
      EnviosCostCard,
      EnviosCostCard,
      EnviosCostCard,
    ],
    steps: mergeByIndex(defaults.steps, p.steps ?? null) as [
      EnviosStep,
      EnviosStep,
      EnviosStep,
      EnviosStep,
    ],
    seguimiento: mergeByIndex(defaults.seguimiento, p.seguimiento ?? null) as [
      EnviosSeguimientoCard,
      EnviosSeguimientoCard,
    ],
    cambios: { ...defaults.cambios, ...(p.cambios ?? {}) },
    faqs:
      Array.isArray(p.faqs) && p.faqs.length > 0
        ? p.faqs.map((f, i) => ({ ...(defaults.faqs[i] ?? f), ...f }))
        : defaults.faqs,
    finalCta: { ...defaults.finalCta, ...(p.finalCta ?? {}) },
  };
}

function initialEnviosData(): EnviosData {
  if (typeof window === "undefined") return DEFAULT_ENVios;
  try {
    const raw = window.localStorage.getItem("crm:envios");
    if (!raw) return DEFAULT_ENVios;
    const p = JSON.parse(raw) as Partial<EnviosData>;
    const defaults = DEFAULT_ENVios;
    return {
      ...defaults,
      ...p,
      sections: { ...defaults.sections, ...(p.sections ?? {}) },
      hero: {
        ...defaults.hero,
        ...(p.hero ?? {}),
        stats: mergeByIndex(defaults.hero.stats, p.hero?.stats ?? null) as [
          EnviosHeroSummaryStat,
          EnviosHeroSummaryStat,
          EnviosHeroSummaryStat,
        ],
      },
      zones: mergeByIndex(defaults.zones, p.zones ?? null) as [
        EnviosZone,
        EnviosZone,
        EnviosZone,
      ],
      costos: mergeByIndex(defaults.costos, p.costos ?? null) as [
        EnviosCostCard,
        EnviosCostCard,
        EnviosCostCard,
      ],
      steps: mergeByIndex(defaults.steps, p.steps ?? null) as [
        EnviosStep,
        EnviosStep,
        EnviosStep,
        EnviosStep,
      ],
      seguimiento: mergeByIndex(
        defaults.seguimiento,
        p.seguimiento ?? null,
      ) as [EnviosSeguimientoCard, EnviosSeguimientoCard],
      cambios: { ...defaults.cambios, ...(p.cambios ?? {}) },
      faqs:
        Array.isArray(p.faqs) && p.faqs.length > 0
          ? p.faqs.map((f, i) => ({ ...(defaults.faqs[i] ?? f), ...f }))
          : defaults.faqs,
      finalCta: { ...defaults.finalCta, ...(p.finalCta ?? {}) },
    };
  } catch {
    return DEFAULT_ENVios;
  }
}

/* ---------- Small UI pieces ---------- */

function Field({
  label,
  children,
  hint,
  right,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-tight text-zinc-700">
          {label}
        </span>
        {right}
      </div>
      {children}
      {hint ? (
        <p className="text-[10px] leading-snug text-zinc-400">{hint}</p>
      ) : null}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onCheckedChange,
  children,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {children ?? null}
        <span className="truncate text-xs font-semibold text-zinc-700">
          {label}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cx(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors border border-black/5",
          checked
            ? "bg-gradient-to-br from-tatan-primario1 to-tatan-primario2"
            : "bg-zinc-200",
        )}
      >
        <span
          className={cx(
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function SectionShowHeader({
  title,
  show,
  onShowChange,
  desc,
}: {
  title: string;
  show: boolean;
  onShowChange: (v: boolean) => void;
  desc?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-black/5 bg-[#FFF8F0]/60 px-4 py-3">
      <div className="min-w-0">
        <h4 className="text-sm font-extrabold tracking-tight text-zinc-900">
          {title}
        </h4>
        {desc ? (
          <p className="mt-0.5 text-[11px] text-zinc-500 leading-snug">
            {desc}
          </p>
        ) : null}
      </div>
      <ToggleField
        label="Mostrar sección"
        checked={show}
        onCheckedChange={onShowChange}
      />
    </div>
  );
}

/* ---------- Component ---------- */

export default function EnviosEditor() {
  const [data, setData] = React.useState<EnviosData>(() => initialEnviosData());
  const [savedCount, setSavedCount] = React.useState(0);
  const [toast, setToast] = React.useState<Toast>(null);
  const [saving, setSaving] = React.useState(false);
  const [loadStatus, setLoadStatus] = React.useState<
    "idle" | "loading" | "ok" | "error"
  >("loading");

  // Cargar desde DB al montar
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadStatus("loading");
      try {
        const r = await apiSiteContent<EnviosData>("envios");
        if (cancelled) return;
        if (r.ok && r.data) {
          const parsed =
            typeof r.data === "string" ? JSON.parse(r.data) : r.data;
          setData(mergeEnvios(DEFAULT_ENVios, parsed));
          setLoadStatus("ok");
          try {
            window.localStorage.setItem(
              "crm:envios",
              JSON.stringify(mergeEnvios(DEFAULT_ENVios, parsed)),
            );
          } catch {
            /* ignore */
          }
        } else {
          setData(initialEnviosData());
          setLoadStatus("error");
        }
      } catch {
        if (cancelled) return;
        setData(initialEnviosData());
        setLoadStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pushToast = React.useCallback((kind: "ok" | "error", msg: string) => {
    const id = Date.now() + Math.random();
    setToast({ id, kind, msg });
    window.setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 2600);
  }, []);

  const patch = React.useCallback(
    <K extends keyof EnviosData>(k: K, v: EnviosData[K]) => {
      setData((prev) => ({ ...prev, [k]: v }));
    },
    [],
  );

  const patchHero = (p: Partial<EnviosHero>) =>
    setData((d) => ({ ...d, hero: { ...d.hero, ...p } }));

  const patchZone = (i: 0 | 1 | 2, p: Partial<EnviosZone>) =>
    setData((d) => {
      const next = [...d.zones];
      next[i] = { ...next[i], ...p };
      return { ...d, zones: next as [EnviosZone, EnviosZone, EnviosZone] };
    });

  const patchZoneItem = (zi: 0 | 1 | 2, ii: number, value: string) =>
    setData((d) => {
      const items = [...d.zones[zi].items];
      items[ii] = value;
      const next = [...d.zones];
      next[zi] = { ...next[zi], items };
      return { ...d, zones: next as [EnviosZone, EnviosZone, EnviosZone] };
    });

  const addZoneItem = (zi: 0 | 1 | 2) =>
    setData((d) => {
      const next = [...d.zones];
      next[zi] = { ...next[zi], items: [...next[zi].items, "Nuevo punto"] };
      return { ...d, zones: next as [EnviosZone, EnviosZone, EnviosZone] };
    });

  const removeZoneItem = (zi: 0 | 1 | 2, ii: number) =>
    setData((d) => {
      const next = [...d.zones];
      next[zi] = {
        ...next[zi],
        items: next[zi].items.filter((_, i) => i !== ii),
      };
      return { ...d, zones: next as [EnviosZone, EnviosZone, EnviosZone] };
    });

  const patchCosto = (i: 0 | 1 | 2, p: Partial<EnviosCostCard>) =>
    setData((d) => {
      const next = [...d.costos];
      next[i] = { ...next[i], ...p };
      return {
        ...d,
        costos: next as [EnviosCostCard, EnviosCostCard, EnviosCostCard],
      };
    });

  const patchCostoItem = (ci: 0 | 1 | 2, di: number, value: string) =>
    setData((d) => {
      const details = [...d.costos[ci].details];
      details[di] = value;
      const next = [...d.costos];
      next[ci] = { ...next[ci], details };
      return {
        ...d,
        costos: next as [EnviosCostCard, EnviosCostCard, EnviosCostCard],
      };
    });

  const addCostoItem = (ci: 0 | 1 | 2) =>
    setData((d) => {
      const next = [...d.costos];
      next[ci] = { ...next[ci], details: [...next[ci].details, "Detalle"] };
      return {
        ...d,
        costos: next as [EnviosCostCard, EnviosCostCard, EnviosCostCard],
      };
    });

  const removeCostoItem = (ci: 0 | 1 | 2, di: number) =>
    setData((d) => {
      const next = [...d.costos];
      next[ci] = {
        ...next[ci],
        details: next[ci].details.filter((_, i) => i !== di),
      };
      return {
        ...d,
        costos: next as [EnviosCostCard, EnviosCostCard, EnviosCostCard],
      };
    });

  const patchStep = (i: 0 | 1 | 2 | 3, p: Partial<EnviosStep>) =>
    setData((d) => {
      const next = [...d.steps];
      next[i] = { ...next[i], ...p };
      return {
        ...d,
        steps: next as [EnviosStep, EnviosStep, EnviosStep, EnviosStep],
      };
    });

  const patchSeguimiento = (i: 0 | 1, p: Partial<EnviosSeguimientoCard>) =>
    setData((d) => {
      const next = [...d.seguimiento];
      next[i] = { ...next[i], ...p };
      return {
        ...d,
        seguimiento: next as [EnviosSeguimientoCard, EnviosSeguimientoCard],
      };
    });

  const patchSegBullet = (si: 0 | 1, bi: number, value: string) =>
    setData((d) => {
      const bullets = [...d.seguimiento[si].bullets];
      bullets[bi] = value;
      const next = [...d.seguimiento];
      next[si] = { ...next[si], bullets };
      return {
        ...d,
        seguimiento: next as [EnviosSeguimientoCard, EnviosSeguimientoCard],
      };
    });

  const addSegBullet = (si: 0 | 1) =>
    setData((d) => {
      const next = [...d.seguimiento];
      next[si] = { ...next[si], bullets: [...next[si].bullets, "Item"] };
      return {
        ...d,
        seguimiento: next as [EnviosSeguimientoCard, EnviosSeguimientoCard],
      };
    });

  const removeSegBullet = (si: 0 | 1, bi: number) =>
    setData((d) => {
      const next = [...d.seguimiento];
      next[si] = {
        ...next[si],
        bullets: next[si].bullets.filter((_, i) => i !== bi),
      };
      return {
        ...d,
        seguimiento: next as [EnviosSeguimientoCard, EnviosSeguimientoCard],
      };
    });

  const patchCambiosBullet = (i: number, v: string) =>
    setData((d) => {
      const bullets = [...d.cambios.bullets];
      bullets[i] = v;
      return { ...d, cambios: { ...d.cambios, bullets } };
    });

  const addCambiosBullet = () =>
    setData((d) => ({
      ...d,
      cambios: { ...d.cambios, bullets: [...d.cambios.bullets, "Punto"] },
    }));

  const removeCambiosBullet = (i: number) =>
    setData((d) => ({
      ...d,
      cambios: {
        ...d.cambios,
        bullets: d.cambios.bullets.filter((_, idx) => idx !== i),
      },
    }));

  const patchFaq = (i: number, p: Partial<EnviosFaq>) =>
    setData((d) => ({
      ...d,
      faqs: d.faqs.map((f, idx) => (idx === i ? { ...f, ...p } : f)),
    }));

  const addFaq = () =>
    setData((d) => ({
      ...d,
      faqs: [...d.faqs, { show: true, q: "Nueva pregunta", a: "Respuesta" }],
    }));

  const removeFaq = (i: number) =>
    setData((d) => ({
      ...d,
      faqs: d.faqs.filter((_, idx) => idx !== i),
    }));

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const r = await apiSiteContentSave<EnviosData>("envios", data);
      if (!r.ok) {
        throw new Error(
          r.error || "No se pudo guardar en la DB (¿sesión expirada?)",
        );
      }
      // cache local offline
      try {
        window.localStorage.setItem("crm:envios", JSON.stringify(data));
      } catch {
        /* ignore */
      }
      setSavedCount((x) => x + 1);
      setLoadStatus("ok");
      pushToast("ok", `¡Página de envíos guardada! (v${r.version ?? "?"})`);
    } catch (e) {
      // fallback: salvar solo en localStorage
      try {
        window.localStorage.setItem("crm:envios", JSON.stringify(data));
        setSavedCount((x) => x + 1);
        pushToast(
          "error",
          `Error DB, guardado local: ${e instanceof Error ? e.message : "desconocido"}`,
        );
      } catch {
        pushToast("error", "No se pudo guardar (DB ni localStorage)");
      }
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setData(DEFAULT_ENVios);
    try {
      window.localStorage.removeItem("crm:envios");
    } catch {
      // noop
    }
    pushToast("ok", "Restablecido a valores originales");
  };

  /* -------------------- FORM -------------------- */

  return (
    <div className="relative w-full">
      <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 mb-1 flex-wrap">
            <span className="w-6 h-1 rounded-full bg-tatan-acento-azul" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
              Contenido del sitio
            </span>
            <span
              className={cx(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                loadStatus === "loading"
                  ? "bg-sky-50 border-sky-200 text-sky-700"
                  : loadStatus === "ok"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-800",
              )}
            >
              {loadStatus === "loading"
                ? "Leyendo DB…"
                : loadStatus === "ok"
                  ? "BD sincronizada"
                  : "Datos locales"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            Editor de Página Envíos
          </h2>
          <p className="mt-1 text-sm text-zinc-500 max-w-2xl leading-relaxed">
            Modificá textos, colores, mostrá u ocultá secciones enteras y agregá
            o quitá items.
            {savedCount > 0 ? (
              <>
                {" "}
                Guardado <strong>{savedCount}</strong> vez
                {savedCount === 1 ? "" : "es"} en esta sesión · persistence:{" "}
                <code className="rounded bg-black/5 px-1 py-0.5 text-[11px]">
                  DB + crm:envios (cache)
                </code>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CustomButton type="outline" onClick={onReset} className="text-xs">
            Restaurar original
          </CustomButton>
          <CustomButton
            type="filled"
            onClick={onSave}
            disabled={saving}
            className="text-xs bg-gradient-to-br from-tatan-primario1 to-tatan-primario2 text-zinc-900 border-transparent shadow-sm"
          >
            {saving ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-zinc-900 mr-1.5" />
            ) : null}
            Guardar cambios
            {savedCount > 0 && !saving ? (
              <span className="ml-1 text-[10px] opacity-80">
                ({savedCount})
              </span>
            ) : null}
          </CustomButton>
        </div>
      </header>

      {toast ? (
        <div
          className={cx(
            "fixed bottom-5 right-5 z-[9999] rounded-2xl px-4 py-3 shadow-lg border backdrop-blur text-sm font-semibold max-w-xs",
            toast.kind === "ok"
              ? "bg-tatan-acento-verde/15 text-zinc-800 border-tatan-acento-verde/40"
              : "bg-tatan-acento-rosa/15 text-zinc-800 border-tatan-acento-rosa/40",
          )}
        >
          {toast.msg}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* FORM */}
        <section
          aria-label="Formulario Envios"
          className="order-2 space-y-5 rounded-2xl border border-black/5 bg-white/80 p-4 backdrop-blur lg:order-1 lg:col-span-2 lg:p-5"
        >
          {/* HERO */}
          <div className="space-y-3">
            <SectionShowHeader
              title="1. Hero principal"
              show={data.hero.show}
              onShowChange={(v) => patchHero({ show: v })}
              desc="Título, descripción, CTAs y tarjetita resumen superior."
            />
            {data.hero.show ? (
              <div className="grid gap-3">
                <Field label="Eyebrow (chiquito arriba)">
                  <input
                    type="text"
                    value={data.hero.eyebrow}
                    onChange={(e) => patchHero({ eyebrow: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  />
                </Field>
                <Field label="Título">
                  <textarea
                    rows={2}
                    value={data.hero.title}
                    onChange={(e) => patchHero({ title: e.target.value })}
                    className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold leading-snug outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  />
                </Field>
                <Field label="Subtítulo">
                  <textarea
                    rows={3}
                    value={data.hero.subtitle}
                    onChange={(e) => patchHero({ subtitle: e.target.value })}
                    className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Botón 1 (texto)">
                    <input
                      type="text"
                      value={data.hero.ctaPrimaryText}
                      onChange={(e) =>
                        patchHero({ ctaPrimaryText: e.target.value })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 1 (link)">
                    <input
                      type="text"
                      value={data.hero.ctaPrimaryHref}
                      onChange={(e) =>
                        patchHero({ ctaPrimaryHref: e.target.value })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 2 (texto)">
                    <input
                      type="text"
                      value={data.hero.ctaSecondaryText}
                      onChange={(e) =>
                        patchHero({ ctaSecondaryText: e.target.value })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 2 (link)">
                    <input
                      type="text"
                      value={data.hero.ctaSecondaryHref}
                      onChange={(e) =>
                        patchHero({ ctaSecondaryHref: e.target.value })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                </div>
                <ToggleField
                  label="Mostrar tarjeta resumen (columna der)"
                  checked={data.hero.summaryCardShow}
                  onCheckedChange={(v) => patchHero({ summaryCardShow: v })}
                />
                {data.hero.summaryCardShow ? (
                  <div className="rounded-2xl border border-black/5 bg-[#F7FBFF]/40 p-3 grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tiempo">
                        <input
                          type="text"
                          value={data.hero.summaryTime}
                          onChange={(e) =>
                            patchHero({ summaryTime: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                      <Field label="Label tiempo">
                        <input
                          type="text"
                          value={data.hero.summaryTimeLabel}
                          onChange={(e) =>
                            patchHero({ summaryTimeLabel: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[11px] outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                      <Field label="Badge Gratis texto">
                        <input
                          type="text"
                          value={data.hero.summaryFreeBadgeText}
                          onChange={(e) =>
                            patchHero({ summaryFreeBadgeText: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                      <Field label="Monto Gratis">
                        <input
                          type="text"
                          value={data.hero.summaryFreeAmount}
                          onChange={(e) =>
                            patchHero({ summaryFreeAmount: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-extrabold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                      <Field label="Label Gratis">
                        <input
                          type="text"
                          value={data.hero.summaryFreeLabel}
                          onChange={(e) =>
                            patchHero({ summaryFreeLabel: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[11px] outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                      <Field label="Días cambios">
                        <input
                          type="text"
                          value={data.hero.summaryChangesDays}
                          onChange={(e) =>
                            patchHero({ summaryChangesDays: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                      <Field label="Título cambios">
                        <input
                          type="text"
                          value={data.hero.summaryChangesTitle}
                          onChange={(e) =>
                            patchHero({ summaryChangesTitle: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-extrabold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                      <Field label="Label cambios">
                        <input
                          type="text"
                          value={data.hero.summaryChangesLabel}
                          onChange={(e) =>
                            patchHero({ summaryChangesLabel: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[11px] outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ZONAS */}
          <div className="space-y-3">
            <SectionShowHeader
              title="2. Zonas y tiempos"
              show={data.sections.zones.show}
              onShowChange={(v) =>
                patch("sections", {
                  ...data.sections,
                  zones: { ...data.sections.zones, show: v },
                })
              }
              desc="Las 3 tarjetas: CABA/GBA, Interior, Sudamérica."
            />
            {data.sections.zones.show ? (
              <>
                <div className="grid gap-3">
                  <Field label="Eyebrow sección">
                    <input
                      type="text"
                      value={data.sections.zones.eyebrow}
                      onChange={(e) =>
                        patch("sections", {
                          ...data.sections,
                          zones: {
                            ...data.sections.zones,
                            eyebrow: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Título sección">
                    <input
                      type="text"
                      value={data.sections.zones.title}
                      onChange={(e) =>
                        patch("sections", {
                          ...data.sections,
                          zones: {
                            ...data.sections.zones,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Descripción sección">
                    <textarea
                      rows={2}
                      value={data.sections.zones.description}
                      onChange={(e) =>
                        patch("sections", {
                          ...data.sections,
                          zones: {
                            ...data.sections.zones,
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                </div>
                <div className="space-y-3">
                  {(data.zones as Array<EnviosZone>).map((z, i) => {
                    const idx = i as 0 | 1 | 2;
                    return (
                      <div
                        key={`z-${i}`}
                        className="rounded-2xl border border-black/5 bg-white/90 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold tracking-tight text-zinc-900">
                            Zona {i + 1}
                          </span>
                          <ToggleField
                            label="Mostrar"
                            checked={z.show}
                            onCheckedChange={(v) => patchZone(idx, { show: v })}
                          />
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <ToggleField
                            label="Mostrar ícono"
                            checked={z.showIcon}
                            onCheckedChange={(v) =>
                              patchZone(idx, { showIcon: v })
                            }
                          />
                          <Field label="Color ícono (hex)">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={z.color}
                                onChange={(e) =>
                                  patchZone(idx, { color: e.target.value })
                                }
                                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-black/10 bg-white p-1"
                              />
                              <input
                                type="text"
                                value={z.color}
                                onChange={(e) =>
                                  patchZone(idx, { color: e.target.value })
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                              />
                            </div>
                          </Field>
                          <Field label="Título">
                            <input
                              type="text"
                              value={z.title}
                              onChange={(e) =>
                                patchZone(idx, { title: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                          <Field label="Tiempo badge">
                            <input
                              type="text"
                              value={z.time}
                              onChange={(e) =>
                                patchZone(idx, { time: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600">
                              Items ({z.items.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => addZoneItem(idx)}
                              className="text-[10px] font-bold text-tatan-secundario2 underline-offset-2 hover:underline"
                            >
                              + Agregar
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {z.items.map((it, ii) => (
                              <div
                                key={`${idx}-item-${ii}`}
                                className="flex items-center gap-1.5"
                              >
                                <Check
                                  className="w-3.5 h-3.5 text-tatan-acento-verde shrink-0"
                                  strokeWidth={2.5}
                                />
                                <input
                                  type="text"
                                  value={it}
                                  onChange={(e) =>
                                    patchZoneItem(idx, ii, e.target.value)
                                  }
                                  className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-tatan-primario1 focus:ring-1 focus:ring-tatan-primario1/30"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeZoneItem(idx, ii)}
                                  className="text-zinc-400 hover:text-tatan-acento-rosa"
                                  aria-label="Quitar item"
                                >
                                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>

          {/* COSTOS */}
          <div className="space-y-3">
            <SectionShowHeader
              title="3. Costos y envío gratis"
              show={data.sections.costos.show}
              onShowChange={(v) =>
                patch("sections", {
                  ...data.sections,
                  costos: { ...data.sections.costos, show: v },
                })
              }
              desc="3 pricing cards: Gratis, Estándar, Retiro."
            />
            {data.sections.costos.show ? (
              <>
                <div className="grid gap-3">
                  <Field label="Título sección">
                    <input
                      type="text"
                      value={data.sections.costos.title}
                      onChange={(e) =>
                        patch("sections", {
                          ...data.sections,
                          costos: {
                            ...data.sections.costos,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Descripción sección">
                    <textarea
                      rows={2}
                      value={data.sections.costos.description}
                      onChange={(e) =>
                        patch("sections", {
                          ...data.sections,
                          costos: {
                            ...data.sections.costos,
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                </div>
                <div className="space-y-3">
                  {(data.costos as Array<EnviosCostCard>).map((c, i) => {
                    const idx = i as 0 | 1 | 2;
                    return (
                      <div
                        key={`c-${i}`}
                        className={cx(
                          "rounded-2xl border p-3 space-y-2.5",
                          c.highlight
                            ? "bg-gradient-to-br from-tatan-primario1/20 to-tatan-acento-amarillo/20 border-tatan-primario2/50"
                            : "bg-white/90 border-black/5",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold tracking-tight text-zinc-900">
                              Precio {i + 1}
                            </span>
                            {c.highlight ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase text-tatan-secundario2 shadow-sm border border-black/5">
                                <Sparkles
                                  className="w-2.5 h-2.5"
                                  strokeWidth={2.2}
                                />
                                Destacado
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3">
                            <ToggleField
                              label="Destacar"
                              checked={c.highlight}
                              onCheckedChange={(v) =>
                                patchCosto(idx, { highlight: v })
                              }
                            />
                            <ToggleField
                              label="Mostrar"
                              checked={c.show}
                              onCheckedChange={(v) =>
                                patchCosto(idx, { show: v })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <Field label="Subtítulo (arriba)">
                            <input
                              type="text"
                              value={c.subtitle}
                              onChange={(e) =>
                                patchCosto(idx, { subtitle: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                          <Field label="Título">
                            <input
                              type="text"
                              value={c.title}
                              onChange={(e) =>
                                patchCosto(idx, { title: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                          <Field label="Monto">
                            <input
                              type="text"
                              value={c.amount}
                              onChange={(e) =>
                                patchCosto(idx, { amount: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xl font-extrabold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                          <Field label="Badge texto">
                            <input
                              type="text"
                              value={c.badge}
                              onChange={(e) =>
                                patchCosto(idx, { badge: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                          <Field label="CTA texto">
                            <input
                              type="text"
                              value={c.ctaText}
                              onChange={(e) =>
                                patchCosto(idx, { ctaText: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                          <Field label="CTA link">
                            <input
                              type="text"
                              value={c.ctaHref}
                              onChange={(e) =>
                                patchCosto(idx, { ctaHref: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600">
                              Detalles ({c.details.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => addCostoItem(idx)}
                              className="text-[10px] font-bold text-tatan-secundario2 underline-offset-2 hover:underline"
                            >
                              + Agregar
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {c.details.map((d, di) => (
                              <div
                                key={`${idx}-d-${di}`}
                                className="flex items-center gap-1.5"
                              >
                                <Check
                                  className={cx(
                                    "w-3.5 h-3.5 shrink-0",
                                    c.highlight
                                      ? "text-tatan-secundario2"
                                      : "text-tatan-acento-verde",
                                  )}
                                  strokeWidth={2.5}
                                />
                                <input
                                  type="text"
                                  value={d}
                                  onChange={(e) =>
                                    patchCostoItem(idx, di, e.target.value)
                                  }
                                  className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-tatan-primario1 focus:ring-1 focus:ring-tatan-primario1/30"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCostoItem(idx, di)}
                                  className="text-zinc-400 hover:text-tatan-acento-rosa"
                                  aria-label="Quitar detalle"
                                >
                                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>

          {/* PROCESO */}
          <div className="space-y-3">
            <SectionShowHeader
              title="4. Proceso en 4 pasos"
              show={data.sections.proceso.show}
              onShowChange={(v) =>
                patch("sections", {
                  ...data.sections,
                  proceso: { ...data.sections.proceso, show: v },
                })
              }
              desc="Tarjetas gradiente 01-02-03-04."
            />
            {data.sections.proceso.show ? (
              <>
                <div className="grid gap-3">
                  <Field label="Título sección">
                    <input
                      type="text"
                      value={data.sections.proceso.title}
                      onChange={(e) =>
                        patch("sections", {
                          ...data.sections,
                          proceso: {
                            ...data.sections.proceso,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Descripción sección">
                    <textarea
                      rows={2}
                      value={data.sections.proceso.description}
                      onChange={(e) =>
                        patch("sections", {
                          ...data.sections,
                          proceso: {
                            ...data.sections.proceso,
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                </div>
                <div className="space-y-3">
                  {(data.steps as Array<EnviosStep>).map((s, i) => {
                    const idx = i as 0 | 1 | 2 | 3;
                    return (
                      <div
                        key={`s-${i}`}
                        className="rounded-2xl border border-black/5 bg-white/90 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-tatan-primario1/40 text-zinc-900 text-xs font-extrabold">
                              {s.number}
                            </span>
                            <span className="text-xs font-extrabold tracking-tight text-zinc-900">
                              Paso {i + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <ToggleField
                              label="Ícono"
                              checked={s.showIcon}
                              onCheckedChange={(v) =>
                                patchStep(idx, { showIcon: v })
                              }
                            />
                            <ToggleField
                              label="Mostrar"
                              checked={s.show}
                              onCheckedChange={(v) =>
                                patchStep(idx, { show: v })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <Field label="Número">
                            <input
                              type="text"
                              value={s.number}
                              onChange={(e) =>
                                patchStep(idx, { number: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-extrabold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                          <Field label="Título">
                            <input
                              type="text"
                              value={s.title}
                              onChange={(e) =>
                                patchStep(idx, { title: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                        </div>
                        <Field label="Descripción">
                          <textarea
                            rows={2}
                            value={s.description}
                            onChange={(e) =>
                              patchStep(idx, { description: e.target.value })
                            }
                            className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                          />
                        </Field>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>

          {/* SEGUIMIENTO */}
          <div className="space-y-3">
            <SectionShowHeader
              title="5. Seguimiento y retiro"
              show={data.sections.seguimiento.show}
              onShowChange={(v) =>
                patch("sections", {
                  ...data.sections,
                  seguimiento: { ...data.sections.seguimiento, show: v },
                })
              }
              desc="2 cards paralelas: Seguimiento + Retiro."
            />
            {data.sections.seguimiento.show ? (
              <div className="space-y-3">
                {(data.seguimiento as Array<EnviosSeguimientoCard>).map(
                  (c, i) => {
                    const idx = i as 0 | 1;
                    return (
                      <div
                        key={`sg-${i}`}
                        className="rounded-2xl border border-black/5 bg-white/90 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-extrabold tracking-tight text-zinc-900">
                            Card {i + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <ToggleField
                              label="Ícono"
                              checked={c.showIcon}
                              onCheckedChange={(v) =>
                                patchSeguimiento(idx, { showIcon: v })
                              }
                            />
                            <ToggleField
                              label="Mostrar"
                              checked={c.show}
                              onCheckedChange={(v) =>
                                patchSeguimiento(idx, { show: v })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <Field label="Título">
                            <input
                              type="text"
                              value={c.title}
                              onChange={(e) =>
                                patchSeguimiento(idx, { title: e.target.value })
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                            />
                          </Field>
                          <div className="grid grid-cols-2 gap-2">
                            <Field label="Color fondo ícono">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={c.iconBg}
                                  onChange={(e) =>
                                    patchSeguimiento(idx, {
                                      iconBg: e.target.value,
                                    })
                                  }
                                  className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-black/10 bg-white p-1"
                                />
                                <input
                                  type="text"
                                  value={c.iconBg}
                                  onChange={(e) =>
                                    patchSeguimiento(idx, {
                                      iconBg: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-xl border border-black/10 bg-white px-2 py-2 font-mono text-[10px] outline-none focus:border-tatan-primario1 focus:ring-1 focus:ring-tatan-primario1/30"
                                />
                              </div>
                            </Field>
                            <Field label="Color ícono">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={c.iconColor}
                                  onChange={(e) =>
                                    patchSeguimiento(idx, {
                                      iconColor: e.target.value,
                                    })
                                  }
                                  className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-black/10 bg-white p-1"
                                />
                                <input
                                  type="text"
                                  value={c.iconColor}
                                  onChange={(e) =>
                                    patchSeguimiento(idx, {
                                      iconColor: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-xl border border-black/10 bg-white px-2 py-2 font-mono text-[10px] outline-none focus:border-tatan-primario1 focus:ring-1 focus:ring-tatan-primario1/30"
                                />
                              </div>
                            </Field>
                          </div>
                        </div>
                        <Field label="Descripción larga">
                          <textarea
                            rows={3}
                            value={c.description}
                            onChange={(e) =>
                              patchSeguimiento(idx, {
                                description: e.target.value,
                              })
                            }
                            className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                          />
                        </Field>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600">
                              Bullets ({c.bullets.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => addSegBullet(idx)}
                              className="text-[10px] font-bold text-tatan-secundario2 underline-offset-2 hover:underline"
                            >
                              + Agregar
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {c.bullets.map((b, bi) => (
                              <div
                                key={`${idx}-b-${bi}`}
                                className="flex items-center gap-1.5"
                              >
                                <Check
                                  className="w-3.5 h-3.5 shrink-0 text-tatan-acento-verde"
                                  strokeWidth={2.5}
                                />
                                <input
                                  type="text"
                                  value={b}
                                  onChange={(e) =>
                                    patchSegBullet(idx, bi, e.target.value)
                                  }
                                  className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-tatan-primario1 focus:ring-1 focus:ring-tatan-primario1/30"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSegBullet(idx, bi)}
                                  className="text-zinc-400 hover:text-tatan-acento-rosa"
                                  aria-label="Quitar bullet"
                                >
                                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            ) : null}
          </div>

          {/* CAMBIOS */}
          <div className="space-y-3">
            <SectionShowHeader
              title="6. Cambios y devoluciones"
              show={data.sections.cambios.show}
              onShowChange={(v) =>
                patch("sections", {
                  ...data.sections,
                  cambios: { ...data.sections.cambios, show: v },
                })
              }
              desc="Bloque grande gradiente rosa/beige + 6 puntos + CTA."
            />
            {data.sections.cambios.show ? (
              <div className="rounded-2xl border border-black/5 bg-white/90 p-3 space-y-2.5">
                <Field label="Título">
                  <input
                    type="text"
                    value={data.cambios.title}
                    onChange={(e) =>
                      setData({
                        ...data,
                        cambios: { ...data.cambios, title: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  />
                </Field>
                <Field label="Descripción">
                  <textarea
                    rows={2}
                    value={data.cambios.description}
                    onChange={(e) =>
                      setData({
                        ...data,
                        cambios: {
                          ...data.cambios,
                          description: e.target.value,
                        },
                      })
                    }
                    className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  />
                </Field>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-600">
                      Puntos ({data.cambios.bullets.length})
                    </span>
                    <button
                      type="button"
                      onClick={addCambiosBullet}
                      className="text-[10px] font-bold text-tatan-secundario2 underline-offset-2 hover:underline"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {data.cambios.bullets.map((b, i) => (
                      <div
                        key={`cb-${i}`}
                        className="flex items-center gap-1.5"
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tatan-primario1/50 text-tatan-secundario2">
                          <Check className="w-4 h-4" strokeWidth={2.6} />
                        </span>
                        <input
                          type="text"
                          value={b}
                          onChange={(e) =>
                            patchCambiosBullet(i, e.target.value)
                          }
                          className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-tatan-primario1 focus:ring-1 focus:ring-tatan-primario1/30"
                        />
                        <button
                          type="button"
                          onClick={() => removeCambiosBullet(i)}
                          className="text-zinc-400 hover:text-tatan-acento-rosa"
                          aria-label="Quitar punto"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Botón 1 (texto)">
                    <input
                      type="text"
                      value={data.cambios.cta1Text}
                      onChange={(e) =>
                        setData({
                          ...data,
                          cambios: {
                            ...data.cambios,
                            cta1Text: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 1 (href)">
                    <input
                      type="text"
                      value={data.cambios.cta1Href}
                      onChange={(e) =>
                        setData({
                          ...data,
                          cambios: {
                            ...data.cambios,
                            cta1Href: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 2 (texto)">
                    <input
                      type="text"
                      value={data.cambios.cta2Text}
                      onChange={(e) =>
                        setData({
                          ...data,
                          cambios: {
                            ...data.cambios,
                            cta2Text: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 2 (href)">
                    <input
                      type="text"
                      value={data.cambios.cta2Href}
                      onChange={(e) =>
                        setData({
                          ...data,
                          cambios: {
                            ...data.cambios,
                            cta2Href: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                </div>
              </div>
            ) : null}
          </div>

          {/* FAQ */}
          <div className="space-y-3">
            <SectionShowHeader
              title="7. Preguntas frecuentes"
              show={data.sections.faq.show}
              onShowChange={(v) =>
                patch("sections", {
                  ...data.sections,
                  faq: { ...data.sections.faq, show: v },
                })
              }
              desc="Preguntas colapsables tipo acordeón."
            />
            {data.sections.faq.show ? (
              <>
                <div className="grid gap-3">
                  <Field label="Título sección">
                    <input
                      type="text"
                      value={data.sections.faq.title}
                      onChange={(e) =>
                        patch("sections", {
                          ...data.sections,
                          faq: { ...data.sections.faq, title: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={addFaq}
                    className="text-[11px] font-bold text-tatan-secundario2 underline-offset-2 hover:underline"
                  >
                    + Agregar pregunta
                  </button>
                </div>
                <div className="space-y-2.5">
                  {data.faqs.map((f, i) => (
                    <div
                      key={`faq-${i}`}
                      className="rounded-2xl border border-black/5 bg-white/90 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-extrabold tracking-tight text-zinc-900">
                          FAQ {i + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <ToggleField
                            label="Mostrar"
                            checked={f.show}
                            onCheckedChange={(v) => patchFaq(i, { show: v })}
                          />
                          <button
                            type="button"
                            onClick={() => removeFaq(i)}
                            className="text-zinc-400 hover:text-tatan-acento-rosa"
                            aria-label="Eliminar FAQ"
                          >
                            <X className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <Field label="Pregunta">
                        <textarea
                          rows={1}
                          value={f.q}
                          onChange={(e) => patchFaq(i, { q: e.target.value })}
                          className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold leading-snug outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                      <Field label="Respuesta">
                        <textarea
                          rows={3}
                          value={f.a}
                          onChange={(e) => patchFaq(i, { a: e.target.value })}
                          className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* CTA FINAL */}
          <div className="space-y-3">
            <SectionShowHeader
              title="8. CTA final contacto"
              show={data.sections.finalCta.show}
              onShowChange={(v) =>
                patch("sections", {
                  ...data.sections,
                  finalCta: { ...data.sections.finalCta, show: v },
                })
              }
              desc="Banner gradiente amarillo/rosa al final de la página."
            />
            {data.sections.finalCta.show ? (
              <div className="rounded-2xl border border-black/5 bg-white/90 p-3 space-y-2.5">
                <Field label="Título">
                  <input
                    type="text"
                    value={data.finalCta.title}
                    onChange={(e) =>
                      setData({
                        ...data,
                        finalCta: { ...data.finalCta, title: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  />
                </Field>
                <Field label="Descripción">
                  <textarea
                    rows={2}
                    value={data.finalCta.description}
                    onChange={(e) =>
                      setData({
                        ...data,
                        finalCta: {
                          ...data.finalCta,
                          description: e.target.value,
                        },
                      })
                    }
                    className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Botón 1 (texto)">
                    <input
                      type="text"
                      value={data.finalCta.cta1Text}
                      onChange={(e) =>
                        setData({
                          ...data,
                          finalCta: {
                            ...data.finalCta,
                            cta1Text: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 1 (href)">
                    <input
                      type="text"
                      value={data.finalCta.cta1Href}
                      onChange={(e) =>
                        setData({
                          ...data,
                          finalCta: {
                            ...data.finalCta,
                            cta1Href: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 2 (texto)">
                    <input
                      type="text"
                      value={data.finalCta.cta2Text}
                      onChange={(e) =>
                        setData({
                          ...data,
                          finalCta: {
                            ...data.finalCta,
                            cta2Text: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                  <Field label="Botón 2 (href)">
                    <input
                      type="text"
                      value={data.finalCta.cta2Href}
                      onChange={(e) =>
                        setData({
                          ...data,
                          finalCta: {
                            ...data.finalCta,
                            cta2Href: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                    />
                  </Field>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* PREVIEW STICKY */}
        <section
          aria-label="Vista previa Envíos"
          className="order-1 lg:sticky lg:top-6 self-start rounded-2xl border border-black/5 bg-[linear-gradient(180deg,#FFFDF7_0%,#FFFFFF_100%)] p-3 shadow-sm lg:order-2 lg:col-span-3 lg:p-5"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
                Vista previa en vivo
              </h3>
              <p className="text-xs text-zinc-500">
                Mismos estilos que la página /envios.
              </p>
            </div>
            <Link
              href="/envios"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-[#FFFBF4] transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Abrir /envios
            </Link>
          </div>

          <div className="w-full">
            {data.hero.show ? (
              <section
                id="hero"
                className="relative overflow-hidden scroll-mt-28 rounded-2xl border border-black/5"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full max-h-[620px] pointer-events-none">
                  <div className="absolute -top-4 -left-8 w-40 h-40 rounded-full bg-tatan-acento-azul/30 blur-3xl" />
                  <div className="absolute top-6 right-0 w-48 h-48 rounded-full bg-tatan-acento-amarillo/40 blur-3xl" />
                  <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-tatan-acento-rosa/30 blur-3xl" />
                </div>
                <div className="relative px-4 sm:px-6 pt-10 pb-6">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="w-8 h-1 rounded-full bg-tatan-acento-azul" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-tatan-secundario2">
                      {data.hero.eyebrow || " "}
                    </span>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-5 items-center">
                    <div className="lg:col-span-3">
                      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-800 leading-[1.05] max-w-3xl">
                        {data.hero.title || " "}
                      </h1>
                      <p className="text-sm text-zinc-600 mt-3 max-w-2xl leading-relaxed">
                        {data.hero.subtitle || " "}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-2.5">
                        <Link
                          href={data.hero.ctaPrimaryHref}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-tatan-primario1 to-tatan-primario2 px-5 py-2.5 text-xs font-extrabold text-zinc-900 shadow-[0_8px_20px_-12px_rgba(214,149,85,0.65)] hover:brightness-[1.03] transition-all"
                        >
                          {data.hero.ctaPrimaryText || " "}
                        </Link>
                        <Link
                          href={data.hero.ctaSecondaryHref}
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3.5 py-2 text-[11px] font-semibold text-zinc-700 shadow-sm hover:bg-white transition-colors"
                        >
                          <ChevronDown
                            className="w-3.5 h-3.5"
                            strokeWidth={2}
                          />
                          {data.hero.ctaSecondaryText || " "}
                        </Link>
                      </div>
                    </div>
                    {data.hero.summaryCardShow ? (
                      <div className="lg:col-span-2">
                        <div className="paper-card rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-tatan-acento-azul/30 via-tatan-primario1/20 to-tatan-acento-amarillo/20 border border-white/60 shadow-[0_18px_48px_-24px_rgba(103,146,137,0.35)]">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 rounded-3xl bg-white/80 p-4 flex items-start gap-3">
                              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F7FBFF] text-[#5B85A8] shadow-sm">
                                <Truck className="w-5 h-5" strokeWidth={1.9} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-zinc-500">
                                  {data.hero.stats[0].label || " "}
                                </p>
                                <p className="text-lg font-extrabold text-zinc-800 leading-tight mt-0.5">
                                  {data.hero.summaryTime || " "}
                                </p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                  {data.hero.summaryTimeLabel || " "}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-3xl bg-white/80 p-3.5 flex flex-col gap-1.5">
                              <div
                                className="inline-flex items-center gap-1.5"
                                style={{ color: "#599E7D" }}
                              >
                                <Check className="w-4 h-4" strokeWidth={2.4} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                  {data.hero.summaryFreeBadgeText || " "}
                                </span>
                              </div>
                              <p className="text-lg font-extrabold text-zinc-800 leading-tight">
                                {data.hero.summaryFreeAmount || " "}
                              </p>
                              <p className="text-[10px] text-zinc-500 leading-tight">
                                {data.hero.summaryFreeLabel || " "}
                              </p>
                            </div>
                            <div className="rounded-3xl bg-white/80 p-3.5 flex flex-col gap-1.5">
                              <div
                                className="inline-flex items-center gap-1.5"
                                style={{ color: "#D27856" }}
                              >
                                <Shield className="w-4 h-4" strokeWidth={2} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                  {data.hero.summaryChangesDays || " "}
                                </span>
                              </div>
                              <p className="text-lg font-extrabold text-zinc-800 leading-tight">
                                {data.hero.summaryChangesTitle || " "}
                              </p>
                              <p className="text-[10px] text-zinc-500 leading-tight">
                                {data.hero.summaryChangesLabel || " "}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {data.sections.zones.show ? (
              <section id="zonas" className="py-10 scroll-mt-28">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                  <div>
                    {data.sections.zones.showEyebrow ? (
                      <div className="inline-flex items-center gap-2 mb-2">
                        <span
                          className="w-6 h-1 rounded-full"
                          style={{
                            backgroundColor:
                              data.sections.zones.eyebrowBarColor || "#F7CA5C",
                          }}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-tatan-secundario2">
                          {data.sections.zones.eyebrow || " "}
                        </span>
                      </div>
                    ) : null}
                    <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-800 leading-tight">
                      {data.sections.zones.title || " "}
                    </h2>
                  </div>
                  {data.sections.zones.showDescription ? (
                    <p className="max-w-md text-xs text-zinc-600 leading-relaxed">
                      {data.sections.zones.description || " "}
                    </p>
                  ) : null}
                </div>
                {(() => {
                  const visible = (data.zones as Array<EnviosZone>).filter(
                    (z) => z.show,
                  );
                  const count = visible.length;
                  const cols =
                    count <= 1
                      ? "grid-cols-1"
                      : count === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1 sm:grid-cols-3";
                  return (
                    <div className={cx("grid gap-3", cols)}>
                      {visible.map((z, i) => {
                        const IconCmp =
                          z.iconKey === "Truck"
                            ? Truck
                            : z.iconKey === "Package"
                              ? Package
                              : MapPin;
                        return (
                          <article
                            key={`z-prev-${i}-${z.title}`}
                            className={cx(
                              "paper-card rounded-3xl p-5 border border-white/60",
                              count === 3 && i === 1
                                ? "bg-gradient-to-br from-tatan-acento-azul/30 via-tatan-primario1/20 to-tatan-primario2/30 -translate-y-1"
                                : "bg-white/80",
                            )}
                          >
                            <div className="flex items-start justify-between">
                              {z.showIcon ? (
                                <div
                                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm"
                                  style={{ color: z.color }}
                                >
                                  <IconCmp
                                    className="w-5 h-5"
                                    strokeWidth={1.9}
                                  />
                                </div>
                              ) : (
                                <div className="w-11 h-11" aria-hidden="true" />
                              )}
                              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-700 shadow-sm border border-black/5">
                                {z.time || " "}
                              </span>
                            </div>
                            <h3 className="mt-4 text-base font-extrabold text-zinc-800">
                              {z.title || " "}
                            </h3>
                            <ul className="mt-3 space-y-2">
                              {z.items.map((it, ii) => (
                                <li
                                  key={ii}
                                  className="flex items-start gap-2 text-xs text-zinc-600"
                                >
                                  <Check
                                    className="w-3.5 h-3.5 mt-0.5 text-tatan-acento-verde shrink-0"
                                    strokeWidth={2.4}
                                  />
                                  <span>{it || " "}</span>
                                </li>
                              ))}
                            </ul>
                          </article>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>
            ) : null}

            {data.sections.costos.show ? (
              <section id="costos" className="relative py-14 scroll-mt-28">
                <div className="absolute inset-0 -z-10 rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FFFBF2]/60 to-white" />
                </div>
                <div className="text-center max-w-2xl mx-auto mb-8">
                  {data.sections.costos.showEyebrow ? (
                    <div className="inline-flex items-center gap-2 mb-2">
                      <span
                        className="w-6 h-1 rounded-full"
                        style={{
                          backgroundColor:
                            data.sections.costos.eyebrowBarColor || "#F2B27B",
                        }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-tatan-secundario2">
                        {data.sections.costos.eyebrow || " "}
                      </span>
                    </div>
                  ) : null}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-800 leading-tight">
                    {data.sections.costos.title || " "}
                  </h2>
                  {data.sections.costos.showDescription ? (
                    <p className="mt-3 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {data.sections.costos.description || " "}
                    </p>
                  ) : null}
                </div>
                {(() => {
                  const visible = (data.costos as Array<EnviosCostCard>).filter(
                    (c) => c.show,
                  );
                  const count = visible.length;
                  const cols =
                    count <= 1
                      ? "grid-cols-1"
                      : count === 2
                        ? "grid-cols-1 lg:grid-cols-2 lg:gap-6"
                        : "grid-cols-1 lg:grid-cols-3 lg:gap-6";
                  return (
                    <div className={cx("grid gap-4", cols)}>
                      {visible.map((c, i) => (
                        <article
                          key={`c-prev-${i}-${c.title}`}
                          className={cx(
                            "paper-card rounded-3xl p-6 border flex flex-col",
                            c.highlight
                              ? "bg-gradient-to-br from-tatan-primario1/40 via-tatan-primario3/30 to-tatan-acento-amarillo/40 border-tatan-primario2/60 lg:-translate-y-2 shadow-xl"
                              : "bg-white/80 border-black/5",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                {c.subtitle || " "}
                              </p>
                              <h3 className="mt-0.5 text-base font-extrabold text-zinc-800 leading-tight">
                                {c.title || " "}
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
                              {c.badge || " "}
                            </span>
                          </div>
                          <div className="mt-4 pb-4 border-b border-black/5">
                            <p
                              className={cx(
                                "font-extrabold tracking-tight leading-none",
                                c.highlight
                                  ? "text-4xl text-tatan-secundario2"
                                  : "text-3xl text-zinc-800",
                              )}
                            >
                              {c.amount || " "}
                            </p>
                          </div>
                          <ul className="mt-4 space-y-2.5 flex-1">
                            {c.details.map((d, di) => (
                              <li
                                key={di}
                                className="flex items-start gap-2 text-xs text-zinc-700"
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
                                <span>{d || " "}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-6 pt-4 border-t border-black/5">
                            <Link
                              href={c.ctaHref}
                              className={cx(
                                "inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 text-xs font-bold transition-colors",
                                c.highlight
                                  ? "bg-white text-tatan-secundario2 hover:bg-tatan-secundario2 hover:text-tatan-primario3 shadow-sm"
                                  : "bg-zinc-900 text-white hover:bg-zinc-800",
                              )}
                            >
                              {c.ctaText || " "}
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  );
                })()}
              </section>
            ) : null}

            {data.sections.proceso.show ? (
              <section id="proceso" className="py-14 scroll-mt-28">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  {data.sections.proceso.showEyebrow ? (
                    <div className="inline-flex items-center gap-2 mb-2">
                      <span
                        className="w-6 h-1 rounded-full"
                        style={{
                          backgroundColor:
                            data.sections.proceso.eyebrowBarColor || "#F29BAF",
                        }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-tatan-secundario2">
                        {data.sections.proceso.eyebrow || " "}
                      </span>
                    </div>
                  ) : null}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-800 leading-tight">
                    {data.sections.proceso.title || " "}
                  </h2>
                  {data.sections.proceso.showDescription ? (
                    <p className="mt-3 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {data.sections.proceso.description || " "}
                    </p>
                  ) : null}
                </div>
                {(() => {
                  const visible = (data.steps as Array<EnviosStep>).filter(
                    (s) => s.show,
                  );
                  const count = visible.length;
                  const cols =
                    count <= 1
                      ? "grid-cols-1"
                      : count === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : count === 3
                          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
                  return (
                    <div className={cx("grid gap-3", cols)}>
                      {visible.map((s, i) => {
                        const IconCmp =
                          s.iconKey === "Truck"
                            ? Truck
                            : s.iconKey === "Gift"
                              ? Gift
                              : s.iconKey === "RotateCcw"
                                ? RotateCcw
                                : CreditCard;
                        return (
                          <article
                            key={`s-prev-${i}-${s.title}`}
                            className="relative paper-card rounded-3xl p-5 border border-black/5 bg-gradient-to-br overflow-hidden"
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${s.tone} opacity-90`}
                            />
                            <div className="relative">
                              <div className="flex items-center justify-between">
                                {s.showIcon ? (
                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-tatan-secundario2">
                                    <IconCmp
                                      className="w-5 h-5"
                                      strokeWidth={2}
                                    />
                                  </span>
                                ) : (
                                  <span />
                                )}
                                <span className="text-3xl font-black text-white/70 tracking-tighter">
                                  {s.number || " "}
                                </span>
                              </div>
                              <h3 className="mt-4 text-base font-extrabold text-zinc-800 leading-tight">
                                {s.title || " "}
                              </h3>
                              <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
                                {s.description || " "}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>
            ) : null}

            {data.sections.seguimiento.show ? (
              <section id="seguimiento" className="py-10 scroll-mt-28">
                <div className="grid gap-4 lg:grid-cols-2">
                  {(data.seguimiento as Array<EnviosSeguimientoCard>)
                    .filter((c) => c.show)
                    .map((c, i) => {
                      const IconCmp = c.iconKey === "Clock" ? Clock : Package;
                      return (
                        <article
                          key={`sg-prev-${i}-${c.title}`}
                          className={cx(
                            "paper-card rounded-3xl p-6 border border-black/5",
                            i === 0
                              ? "bg-gradient-to-br from-white to-[#F7FBFF]/60"
                              : "bg-gradient-to-br from-white to-[#FFFBF4]/80",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {c.showIcon ? (
                              <div
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                                style={{
                                  backgroundColor: c.iconBg,
                                  color: c.iconColor,
                                }}
                              >
                                <IconCmp className="w-5 h-5" strokeWidth={2} />
                              </div>
                            ) : null}
                            <div className="flex-1">
                              <h3 className="text-lg font-extrabold text-zinc-800 leading-tight">
                                {c.title || " "}
                              </h3>
                              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                                {c.description || " "}
                              </p>
                              <ul className="mt-4 space-y-2">
                                {c.bullets.map((t, bi) => (
                                  <li
                                    key={bi}
                                    className="flex items-start gap-2 text-xs text-zinc-700"
                                  >
                                    <Check
                                      className="w-4 h-4 mt-0.5 shrink-0"
                                      style={{
                                        color: c.iconColor,
                                      }}
                                      strokeWidth={2.4}
                                    />
                                    <span>{t || " "}</span>
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
            ) : null}

            {data.sections.cambios.show ? (
              <section id="cambios" className="relative py-14 scroll-mt-28">
                <div className="absolute inset-0 -z-10 rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FFF3EE]/60 to-white" />
                </div>
                <div className="max-w-5xl mx-auto">
                  <div className="paper-card rounded-[2rem] p-6 sm:p-8 lg:p-10 border border-white/80 bg-gradient-to-br from-tatan-acento-rosa/30 via-tatan-primario1/30 to-tatan-acento-amarillo/30">
                    <div className="grid gap-6 lg:grid-cols-5 lg:gap-8 items-center">
                      <div className="lg:col-span-2">
                        <div className="inline-flex h-13 w-13 items-center justify-center rounded-3xl bg-white shadow-sm text-tatan-acento-rosa">
                          <RotateCcw className="w-7 h-7" strokeWidth={2} />
                        </div>
                        <h2 className="mt-5 text-xl sm:text-2xl font-extrabold text-zinc-800 leading-tight">
                          {data.cambios.title || " "}
                        </h2>
                        <p className="mt-3 text-sm text-zinc-700 leading-relaxed">
                          {data.cambios.description || " "}
                        </p>
                      </div>
                      <div className="lg:col-span-3 grid sm:grid-cols-2 gap-3">
                        {data.cambios.bullets.map((t, i) => (
                          <div
                            key={`cb-prev-${i}`}
                            className="rounded-2xl bg-white/80 p-3.5 flex items-start gap-2.5 border border-black/5"
                          >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tatan-primario1/50 text-tatan-secundario2">
                              <Check className="w-4 h-4" strokeWidth={2.6} />
                            </span>
                            <p className="text-xs text-zinc-700 leading-snug pt-0.5">
                              {t || " "}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <Link
                        href={data.cambios.cta1Href}
                        className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                      >
                        {data.cambios.cta1Text || " "}
                      </Link>
                      <Link
                        href={data.cambios.cta2Href}
                        className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-xs font-bold text-zinc-800 hover:bg-tatan-primario3/40 transition-colors"
                      >
                        <Mail className="w-4 h-4" strokeWidth={2} />
                        {data.cambios.cta2Text || " "}
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {data.sections.faq.show ? (
              <section
                id="faq"
                className="max-w-4xl mx-auto py-12 scroll-mt-28"
              >
                <div className="text-center max-w-2xl mx-auto mb-8">
                  {data.sections.faq.showEyebrow ? (
                    <div className="inline-flex items-center gap-2 mb-2">
                      <span
                        className="w-6 h-1 rounded-full"
                        style={{
                          backgroundColor:
                            data.sections.faq.eyebrowBarColor || "#CDE1A4",
                        }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-tatan-secundario2">
                        {data.sections.faq.eyebrow || " "}
                      </span>
                    </div>
                  ) : null}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-800 leading-tight">
                    {data.sections.faq.title || " "}
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.faqs
                    .filter((f) => f.show)
                    .map((f, i) => (
                      <details
                        key={`faq-prev-${i}-${f.q}`}
                        className="group paper-card rounded-2xl border border-black/5 bg-white/90 overflow-hidden"
                      >
                        <summary className="list-none cursor-pointer px-5 py-4 flex items-start justify-between gap-4 hover:bg-[#FFFBF4]/70 transition-colors">
                          <span className="text-sm font-bold text-zinc-800 leading-snug pt-0.5">
                            {f.q || " "}
                          </span>
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tatan-primario1/40 text-tatan-secundario2 group-open:rotate-180 transition-transform duration-200">
                            <ChevronDown
                              className="w-4 h-4"
                              strokeWidth={2.4}
                            />
                          </span>
                        </summary>
                        <div className="px-5 pb-5 -mt-1">
                          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-3xl">
                            {f.a || " "}
                          </p>
                        </div>
                      </details>
                    ))}
                </div>
              </section>
            ) : null}

            {data.sections.finalCta.show ? (
              <section className="max-w-4xl mx-auto pb-8">
                <div className="paper-card rounded-[2rem] p-6 sm:p-8 border border-white/80 bg-gradient-to-br from-tatan-primario2/40 via-tatan-acento-amarillo/40 to-tatan-primario1/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-zinc-800 leading-tight">
                      {data.finalCta.title || " "}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-xl">
                      {data.finalCta.description || " "}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={data.finalCta.cta1Href}
                      className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Smartphone className="w-4 h-4" strokeWidth={2} />
                      {data.finalCta.cta1Text || " "}
                    </Link>
                    <Link
                      href={data.finalCta.cta2Href}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-zinc-800 border border-black/10 hover:bg-tatan-primario3/60 transition-colors"
                    >
                      <Mail className="w-4 h-4" strokeWidth={2} />
                      {data.finalCta.cta2Text || " "}
                    </Link>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
