"use client";

import CustomButton from "@/components/ui/CustomButton";
import {
  Sparkles,
  Flower2,
  Heart,
  Star,
  Plane,
  Check,
  Leaf,
  Truck,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import {
  apiSiteContent,
  apiSiteContentSave,
  apiRevalidateTag,
} from "@/lib/tatan-api";
import { HOME_HERO_DEFAULT as DEFAULT_HERO } from "@/lib/site-content-defaults";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export type HomeHeroBadge = {
  show: boolean;
  showIcon: boolean;
  title: string;
  subtitle: string;
};

export type HomeBenefitIconKey = "Truck" | "CreditCard" | "Heart";

export type HomeBenefit = {
  show: boolean;
  showIcon: boolean;
  iconKey: HomeBenefitIconKey;
  title: string;
  description: string;
  color: string;
};

export type HomeHeroData = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  imageSrc: string;
  cta1Text: string;
  cta1Href: string;
  cta2Text: string;
  cta2Href: string;
  cottonBadge: HomeHeroBadge;
  shippingBadge: HomeHeroBadge;
  benefits: HomeBenefit[];
};

type Toast = { id: number; kind: "ok" | "error"; msg: string } | null;

function mergeBenefits(
  defaults: HomeBenefit[],
  parsed?: HomeBenefit[] | null,
): HomeBenefit[] {
  if (!Array.isArray(parsed) || parsed.length === 0) return defaults;
  return defaults.map((d, i) => ({
    ...d,
    ...(typeof parsed[i] === "object" && parsed[i] !== null
      ? (parsed[i] as Partial<HomeBenefit>)
      : ({} as Partial<HomeBenefit>)),
  }));
}

function initialHeroData(): HomeHeroData {
  if (typeof window === "undefined") return DEFAULT_HERO;
  try {
    const raw = window.localStorage.getItem("crm:home-hero");
    if (!raw) return DEFAULT_HERO;
    const parsed = JSON.parse(raw) as Partial<HomeHeroData>;
    const { benefits: parsedBenefits, ...rest } = parsed;
    return {
      ...DEFAULT_HERO,
      ...rest,
      benefits: mergeBenefits(DEFAULT_HERO.benefits, parsedBenefits ?? null),
    };
  } catch {
    return DEFAULT_HERO;
  }
}

export default function HomeHeroEditor() {
  const [data, setData] = React.useState<HomeHeroData>(DEFAULT_HERO);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(0);
  const [toast, setToast] = React.useState<Toast>(null);
  const [loading, setLoading] = React.useState(true);
  const [remoteStatus, setRemoteStatus] = React.useState<
    "idle" | "loading" | "ok" | "error"
  >("loading");

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setRemoteStatus("loading");
      setLoading(true);
      try {
        const r = await apiSiteContent<HomeHeroData>("home_hero");
        if (cancelled) return;
        if (r.ok && r.data) {
          const { benefits: parsedBenefits, ...rest } =
            r.data as Partial<HomeHeroData>;
          setData({
            ...DEFAULT_HERO,
            ...rest,
            benefits: mergeBenefits(
              DEFAULT_HERO.benefits,
              parsedBenefits ?? null,
            ),
          });
          setRemoteStatus("ok");
        } else {
          // fallback a localStorage en el browser
          setData(initialHeroData());
          setRemoteStatus("error");
        }
      } catch {
        if (cancelled) return;
        setData(initialHeroData());
        setRemoteStatus("error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toastTimerRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const pushToast = React.useCallback((kind: "ok" | "error", msg: string) => {
    const id = Date.now();
    setToast({ id, kind, msg });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 2600);
  }, []);

  const setField = <K extends keyof HomeHeroData>(k: K, v: HomeHeroData[K]) => {
    setData((prev) => ({ ...prev, [k]: v }));
  };

  const setCottonBadge = (patch: Partial<HomeHeroBadge>) => {
    setData((prev) => ({
      ...prev,
      cottonBadge: { ...prev.cottonBadge, ...patch },
    }));
  };

  const setShippingBadge = (patch: Partial<HomeHeroBadge>) => {
    setData((prev) => ({
      ...prev,
      shippingBadge: { ...prev.shippingBadge, ...patch },
    }));
  };

  const setBenefit = (index: number, patch: Partial<HomeBenefit>) => {
    setData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b, i) =>
        i === index ? { ...b, ...patch } : b,
      ),
    }));
  };

  const onReset = () => {
    setData(DEFAULT_HERO);
    pushToast("ok", "Valores originales restaurados");
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // 1) Guardar en DB remota (PHP API)
      const r = await apiSiteContentSave<HomeHeroData>("home_hero", data);
      if (!r.ok) {
        throw new Error(
          r.error ||
            "No se pudo guardar en la base de datos (¿sesión expirada?)",
        );
      }

      // 2) Purga el caché ISR del sitio para que el cambio se vea al instante.
      await apiRevalidateTag("tatan-site-content");

      // 3) Cache local (backup offline)
      try {
        window.localStorage.setItem("crm:home-hero", JSON.stringify(data));
      } catch {
        /* ignore */
      }

      setSaved((n) => n + 1);
      setRemoteStatus("ok");
      pushToast("ok", `¡Cambios del hero guardados! (v${r.version ?? "?"})`);
    } catch (e) {
      // Fallback: salvar solo en localStorage
      try {
        window.localStorage.setItem("crm:home-hero", JSON.stringify(data));
        pushToast(
          "error",
          `Error DB, pero guardado local: ${e instanceof Error ? e.message : "desconocido"}`,
        );
      } catch {
        pushToast("error", "No se pudo guardar (DB ni localStorage)");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative w-full">
      {toast ? (
        <div className="fixed right-4 top-4 z-[80] w-full max-w-sm">
          <div
            role="status"
            className={cx(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
              toast.kind === "ok"
                ? "border-tatan-acento-verde/40 bg-tatan-acento-verde/15 text-zinc-800"
                : "border-tatan-acento-rosa/40 bg-tatan-acento-rosa/15 text-zinc-800",
            )}
          >
            <div
              className={cx(
                "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                toast.kind === "ok"
                  ? "bg-tatan-acento-verde/30"
                  : "bg-tatan-acento-rosa/30",
              )}
            >
              <Check className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{toast.msg}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {toast.kind === "ok"
                  ? "Los cambios ya están disponibles para previsualizar."
                  : "Volvé a intentarlo en unos segundos."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <header className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-black/5 bg-[#FEFDF8]/80 p-4 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                Editar Hero del Home
              </h2>
              <span
                className={cx(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                  loading
                    ? "bg-sky-50 border-sky-200 text-sky-700"
                    : remoteStatus === "ok"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-amber-50 border-amber-200 text-amber-800",
                )}
              >
                {loading
                  ? "Leyendo DB…"
                  : remoteStatus === "ok"
                    ? "BD sincronizada"
                    : "Datos locales"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Cambiá el texto, la imagen y los botones del primer bloque del
              home. La vista previa se actualiza en tiempo real.
            </p>
            {saved > 0 ? (
              <p className="mt-1.5 text-xs text-zinc-500">
                Guardado {saved} vez{saved === 1 ? "" : "es"} en esta sesión ·
                persistence:{" "}
                <code className="rounded bg-black/5 px-1 py-0.5 text-[11px]">
                  DB + crm:home-hero (cache)
                </code>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CustomButton type="ghost" onClick={onReset}>
              Restaurar original
            </CustomButton>
            <CustomButton type="filled" onClick={onSave} disabled={saving}>
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-zinc-900" />
              ) : null}
              {saving ? "Guardando…" : "Guardar cambios"}
            </CustomButton>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-5">
          <section
            aria-label="Formulario Hero"
            className="order-2 space-y-4 rounded-2xl border border-black/5 bg-white/80 p-4 backdrop-blur lg:order-1 lg:col-span-2 lg:p-5"
          >
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
              Contenido
            </h3>
            <Field label="Texto chiquito (eyebrow)">
              <input
                type="text"
                value={data.eyebrow}
                onChange={(e) => setField("eyebrow", e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                placeholder="Nueva colección Otoño"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título · línea 1">
                <input
                  type="text"
                  value={data.titleLine1}
                  onChange={(e) => setField("titleLine1", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  placeholder="Ropa suavecita para"
                />
              </Field>
              <Field label="Título · línea 2 (destacada)">
                <input
                  type="text"
                  value={data.titleLine2}
                  onChange={(e) => setField("titleLine2", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  placeholder="tus pequeños"
                />
              </Field>
            </div>

            <Field label="Texto descriptivo">
              <textarea
                rows={4}
                value={data.description}
                onChange={(e) => setField("description", e.target.value)}
                className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                placeholder="Descubrí nuestra selección de bodys, remeras y prendas de algodón premium…"
              />
            </Field>

            <Field label="URL de la imagen destacada">
              <input
                type="url"
                value={data.imageSrc}
                onChange={(e) => setField("imageSrc", e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                placeholder="https://…/image.jpg"
              />
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-dashed border-black/10 bg-black/[0.02] p-2">
                {data.imageSrc ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-black/10">
                    <Image
                      src={data.imageSrc}
                      alt="Thumbnail hero"
                      unoptimized
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <p className="text-[11px] leading-snug text-zinc-500">
                  Podés pegar cualquier URL. En el preview se usa{" "}
                  <code className="rounded bg-white px-1">next/image</code> con{" "}
                  <code className="rounded bg-white px-1">unoptimized</code> por
                  la configuración del proyecto.
                </p>
              </div>
            </Field>

            <div className="border-t border-black/5 pt-4">
              <h4 className="text-sm font-semibold tracking-tight text-zinc-900">
                Botones (CTA)
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500">
                Botón 1 = destacado (primario), Botón 2 = secundario con flor.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Texto · Botón 1">
                <input
                  type="text"
                  value={data.cta1Text}
                  onChange={(e) => setField("cta1Text", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  placeholder="Ver colección"
                />
              </Field>
              <Field label="Link · Botón 1">
                <input
                  type="text"
                  value={data.cta1Href}
                  onChange={(e) => setField("cta1Href", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  placeholder="/productos"
                />
              </Field>
              <Field label="Texto · Botón 2">
                <input
                  type="text"
                  value={data.cta2Text}
                  onChange={(e) => setField("cta2Text", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  placeholder="Ofertas"
                />
              </Field>
              <Field label="Link · Botón 2">
                <input
                  type="text"
                  value={data.cta2Href}
                  onChange={(e) => setField("cta2Href", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                  placeholder="/ofertas"
                />
              </Field>
            </div>

            <div className="mt-2 border-t border-black/5 pt-4">
              <h4 className="text-sm font-semibold tracking-tight text-zinc-900">
                Badges flotantes
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500">
                Se muestran sobre la imagen del producto destacado (arriba-der y
                abajo-izq).
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-[#F7FBFF]/50 p-3">
                <ToggleField
                  label="Badge Algodón (arriba)"
                  checked={data.cottonBadge.show}
                  onCheckedChange={(v) => setCottonBadge({ show: v })}
                >
                  <Leaf className="h-4 w-4 text-green-600" />
                </ToggleField>
                <div className="mt-3 grid gap-3 sm:grid-cols-1">
                  <ToggleField
                    label="Mostrar ícono hoja"
                    checked={data.cottonBadge.showIcon}
                    onCheckedChange={(v) => setCottonBadge({ showIcon: v })}
                  />
                  <Field label="Título">
                    <input
                      type="text"
                      value={data.cottonBadge.title}
                      onChange={(e) =>
                        setCottonBadge({ title: e.target.value })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                      placeholder="100% Algodón"
                    />
                  </Field>
                  <Field label="Subtítulo (chico)">
                    <input
                      type="text"
                      value={data.cottonBadge.subtitle}
                      onChange={(e) =>
                        setCottonBadge({ subtitle: e.target.value })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-zinc-700 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                      placeholder="Orgánico"
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-[#FFFBF4]/60 p-3">
                <ToggleField
                  label="Badge Envío (abajo)"
                  checked={data.shippingBadge.show}
                  onCheckedChange={(v) => setShippingBadge({ show: v })}
                >
                  <Check className="h-4 w-4 text-tatan-acento-verde" />
                </ToggleField>
                <div className="mt-3 grid gap-3 sm:grid-cols-1">
                  <ToggleField
                    label="Mostrar ícono check"
                    checked={data.shippingBadge.showIcon}
                    onCheckedChange={(v) => setShippingBadge({ showIcon: v })}
                  />
                  <Field label="Título">
                    <input
                      type="text"
                      value={data.shippingBadge.title}
                      onChange={(e) =>
                        setShippingBadge({ title: e.target.value })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                      placeholder="Envío gratis"
                    />
                  </Field>
                  <Field label="Subtítulo (chico)">
                    <input
                      type="text"
                      value={data.shippingBadge.subtitle}
                      onChange={(e) =>
                        setShippingBadge({ subtitle: e.target.value })
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-zinc-700 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                      placeholder="Compras mayores a $25k"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="mt-2 border-t border-black/5 pt-4">
              <h4 className="text-sm font-semibold tracking-tight text-zinc-900">
                Beneficios destacados
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500">
                La fila de 3 tarjetas que aparece debajo del hero en el home
                (Envío, Cuotas, Cambios).
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-1 xl:grid-cols-3">
              {data.benefits.map((b, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-black/5 bg-white/80 p-3"
                >
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-[#FFF8F0]/80 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
                        style={{ color: b.color }}
                      >
                        {b.iconKey === "Truck" ? (
                          <Truck className="h-3.5 w-3.5" strokeWidth={1.8} />
                        ) : b.iconKey === "CreditCard" ? (
                          <CreditCard
                            className="h-3.5 w-3.5"
                            strokeWidth={1.8}
                          />
                        ) : (
                          <Heart className="h-3.5 w-3.5" strokeWidth={1.8} />
                        )}
                      </div>
                      <span className="truncate text-xs font-semibold tracking-tight text-zinc-800">
                        Beneficio {i + 1}
                      </span>
                    </div>
                    <label className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: b.color }}
                        aria-hidden="true"
                      />
                      Color
                    </label>
                  </div>

                  <div className="mt-3 space-y-3">
                    <ToggleField
                      label="Mostrar este beneficio"
                      checked={b.show}
                      onCheckedChange={(v) => setBenefit(i, { show: v })}
                    />
                    <ToggleField
                      label="Mostrar ícono"
                      checked={b.showIcon}
                      onCheckedChange={(v) => setBenefit(i, { showIcon: v })}
                    />
                    <Field label="Título">
                      <input
                        type="text"
                        value={b.title}
                        onChange={(e) =>
                          setBenefit(i, { title: e.target.value })
                        }
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        placeholder="Envío a todo el país"
                      />
                    </Field>
                    <Field label="Descripción">
                      <textarea
                        rows={2}
                        value={b.description}
                        onChange={(e) =>
                          setBenefit(i, { description: e.target.value })
                        }
                        className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed text-zinc-700 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                        placeholder="Llegamos a todas las provincias en 3-7 días hábiles"
                      />
                    </Field>
                    <Field label="Color del ícono (hex)">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={b.color}
                          onChange={(e) =>
                            setBenefit(i, { color: e.target.value })
                          }
                          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-black/10 bg-white p-1"
                        />
                        <input
                          type="text"
                          value={b.color}
                          onChange={(e) =>
                            setBenefit(i, { color: e.target.value })
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs text-zinc-700 outline-none focus:border-tatan-primario1 focus:ring-2 focus:ring-tatan-primario1/30"
                          placeholder="#E58B60"
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-label="Vista previa Hero"
            className="order-1 lg:sticky lg:top-6 rounded-2xl border border-black/5 bg-[linear-gradient(180deg,#FFFDF7_0%,#FFFFFF_100%)] p-3 shadow-sm lg:order-2 lg:col-span-3 lg:p-5 self-start"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
                  Vista previa en vivo
                </h3>
                <p className="text-xs text-zinc-500">
                  Misma maqueta que el home real · responsive ≈ md breakpoint
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-tatan-primario1/50 bg-tatan-primario1/20 px-2.5 py-1 text-[10px] font-semibold text-zinc-800">
                LIVE PREVIEW
              </span>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white">
              <section className="relative overflow-hidden">
                <div className="px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8">
                  <div className="grid items-center gap-6 md:grid-cols-2 md:gap-8">
                    <div className="order-2 md:order-1">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-tatan-primario2/60 px-3 py-1 sm:mb-5 sm:px-4 sm:py-1.5">
                        <Sparkles
                          className="h-4 w-4 text-zinc-700 sm:h-5 sm:w-5"
                          strokeWidth={2}
                        />
                        <span className="text-[11px] font-semibold text-zinc-700 sm:text-sm">
                          {data.eyebrow || " "}
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold leading-[1.08] text-zinc-800 mb-4 sm:text-3xl lg:text-4xl">
                        {data.titleLine1 || " "}
                        <span className="block text-tatan-primario4 drop-shadow-sm">
                          {data.titleLine2 || " "}
                        </span>
                      </h1>
                      <p className="mb-6 max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base">
                        {data.description || " "}
                      </p>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        <a
                          href={data.cta1Href || "#"}
                          className="btn-primary rounded-2xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
                          onClick={(e) => e.preventDefault()}
                        >
                          {data.cta1Text || " "}
                        </a>
                        <a
                          href={data.cta2Href || "#"}
                          onClick={(e) => e.preventDefault()}
                          className="inline-flex items-center gap-2 rounded-2xl border-2 border-tatan-secundario2/30 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-white/50 paper-card sm:px-8 sm:py-3.5 sm:text-base"
                        >
                          {data.cta2Text || " "}
                          <Flower2
                            className="h-4 w-4 text-pink-400 sm:h-5 sm:w-5"
                            strokeWidth={2}
                          />
                        </a>
                      </div>

                      <div className="mt-8 flex items-center gap-5 sm:mt-10 sm:gap-6">
                        <div className="flex -space-x-2 sm:-space-x-3">
                          {[Heart, Star, Flower2, Plane].map((Icon, i) => (
                            <div
                              key={i}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm sm:h-10 sm:w-10"
                              style={{
                                backgroundColor: [
                                  "#F4B8C8",
                                  "#F7E4A3",
                                  "#8DBFA3",
                                  "#A8C8E0",
                                ][i],
                              }}
                            >
                              <Icon
                                className="h-3 w-3 text-white sm:h-4 sm:w-4"
                                strokeWidth={2.5}
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-sm text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-current sm:h-4 sm:w-4"
                                strokeWidth={0}
                              />
                            ))}
                          </div>
                          <p className="text-[11px] font-medium text-zinc-500 sm:text-xs">
                            +2.000 mamás felices
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="order-1 relative md:order-2">
                      <div className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-tatan-acento-amarillo/30 blur-2xl sm:-top-6 sm:-left-6 sm:h-24 sm:w-24" />
                      <div className="absolute -bottom-6 -right-4 h-20 w-20 rounded-full bg-tatan-acento-rosa/30 blur-2xl sm:-bottom-8 sm:-right-6 sm:h-32 sm:w-32" />
                      <div className="relative paper-card rounded-3xl p-3 sm:p-6">
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-tatan-primario1/40 to-tatan-primario2/40 p-4 sm:p-6">
                          {data.imageSrc ? (
                            <Image
                              src={data.imageSrc}
                              alt="Producto destacado"
                              fill
                              unoptimized
                              sizes="(max-width: 768px) 80vw, 500px"
                              className="rounded-2xl object-cover p-4 drop-shadow-lg sm:p-6"
                            />
                          ) : null}
                        </div>
                        <div className="badge-float-1 absolute -top-3 -right-1 origin-bottom-left rounded-2xl border border-tatan-secundario1/50 bg-white px-3 py-1.5 shadow-lg sm:-top-4 sm:-right-2 sm:px-4 sm:py-2">
                          {data.cottonBadge.show ? (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {data.cottonBadge.showIcon ? (
                                <Leaf
                                  className="h-3.5 w-3.5 text-green-600 sm:h-5 sm:w-5"
                                  strokeWidth={2}
                                />
                              ) : null}
                              <div>
                                <p className="text-[10px] font-bold text-zinc-700 sm:text-xs">
                                  {data.cottonBadge.title || " "}
                                </p>
                                {data.cottonBadge.subtitle ? (
                                  <p className="text-[8px] text-zinc-500 sm:text-[10px]">
                                    {data.cottonBadge.subtitle}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="badge-float-2 absolute -bottom-3 -left-3 origin-top-right rounded-2xl border border-tatan-secundario1/50 bg-white px-3 py-1.5 shadow-lg sm:-bottom-3 sm:-left-3 sm:px-4 sm:py-2">
                          {data.shippingBadge.show ? (
                            <>
                              <p className="inline-flex items-center gap-1 text-[10px] font-bold text-tatan-acento-verde sm:text-xs">
                                {data.shippingBadge.showIcon ? (
                                  <Check
                                    className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5"
                                    strokeWidth={3}
                                  />
                                ) : null}
                                {data.shippingBadge.title || " "}
                              </p>
                              {data.shippingBadge.subtitle ? (
                                <p className="text-[8px] text-zinc-500 sm:text-[10px]">
                                  {data.shippingBadge.subtitle}
                                </p>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-4 w-full">
              <div className="paper-card rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-tatan-primario1/30 via-tatan-acento-amarillo/20 to-tatan-primario2/30">
                <div className="grid gap-6 md:grid-cols-3 text-center">
                  {data.benefits
                    .filter((b) => b.show)
                    .map((b, i) => {
                      const Icon =
                        b.iconKey === "Truck"
                          ? Truck
                          : b.iconKey === "CreditCard"
                            ? CreditCard
                            : Heart;
                      return (
                        <div
                          key={`${b.iconKey}-${i}`}
                          className="flex flex-col items-center gap-2"
                        >
                          {b.showIcon ? (
                            <div
                              className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 shadow-sm sm:h-16 sm:w-16"
                              style={{ color: b.color }}
                            >
                              <Icon
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                strokeWidth={1.8}
                              />
                            </div>
                          ) : null}
                          <h3 className="text-base font-bold text-zinc-800 sm:text-lg">
                            {b.title || " "}
                          </h3>
                          <p className="max-w-xs text-xs text-zinc-600 sm:text-sm">
                            {b.description || " "}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-tight text-zinc-700">
        {label}
      </span>
      {children}
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
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
      <div className="flex items-center gap-2">
        {children ?? null}
        <span className="text-xs font-semibold tracking-tight text-zinc-800">
          {label}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cx(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEFDF8]",
          checked ? "bg-tatan-primario1" : "bg-zinc-200",
        )}
      >
        <span
          className={cx(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
