"use client";

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
  ChevronDown,
  Upload,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import SuccessModal from "@/components/ui/SuccessModal";
import {
  apiSiteContent,
  apiSiteContentSave,
  apiRevalidateTag,
  apiUploadImage,
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
  const [openSection, setOpenSection] = React.useState<string | null>("texto");
  const [showPreview, setShowPreview] = React.useState(false);
  const [savedJson, setSavedJson] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
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
          const merged = {
            ...DEFAULT_HERO,
            ...rest,
            benefits: mergeBenefits(
              DEFAULT_HERO.benefits,
              parsedBenefits ?? null,
            ),
          };
          setData(merged);
          setSavedJson(JSON.stringify(merged));
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

  const dirty =
    remoteStatus === "error" ||
    (savedJson !== null && JSON.stringify(data) !== savedJson);

  const toggleSection = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await apiUploadImage(file);
      setField("imageSrc", url);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "No se pudo subir la imagen",
      );
    } finally {
      setUploading(false);
    }
  };

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
    if (
      !window.confirm(
        "¿Volver a los textos originales de la portada? Se pierde lo que cambiaste (hasta que guardes, la web no cambia).",
      )
    )
      return;
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

      setSavedJson(JSON.stringify(data));
      setRemoteStatus("ok");
      setSavedMsg("La portada se guardó. Los cambios ya se ven en la web.");
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
      <SuccessModal message={savedMsg} onClose={() => setSavedMsg(null)} />
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
        <header className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-black/5 bg-[#F7F6F3]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">
              Portada del inicio
            </h2>
            <p className="text-xs text-zinc-500">
              {loading
                ? "Cargando…"
                : remoteStatus === "error"
                  ? "No se pudo leer la versión publicada: estás viendo una copia local."
                  : dirty
                    ? "Tenés cambios sin guardar"
                    : "Tocá una sección para editarla"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex h-10 items-center rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 lg:hidden"
          >
            {showPreview ? "Ocultar vista previa" : "Vista previa"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-zinc-500 transition hover:bg-black/5 hover:text-zinc-800 sm:inline-flex"
          >
            Restaurar original
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cx(
              "inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition disabled:opacity-60",
              dirty
                ? "bg-tatan-primario1 text-zinc-900 hover:bg-tatan-primario4"
                : "border border-black/10 bg-white text-zinc-700 hover:bg-zinc-50",
            )}
          >
            {saving ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-zinc-900" />
            ) : null}
            {saving ? "Guardando…" : dirty ? "Guardar cambios" : "Guardado"}
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="order-2 space-y-3 lg:order-1 lg:col-span-2">
            <EditorSection
              title="Texto principal"
              desc="El texto chico, el título y la descripción"
              open={openSection === "texto"}
              onToggle={() => toggleSection("texto")}
            >
              <Field label="Texto chico arriba del título">
                <input
                  type="text"
                  value={data.eyebrow}
                  onChange={(e) => setField("eyebrow", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                  placeholder="Nueva colección Otoño"
                />
              </Field>
              <Field label="Título (primera línea)">
                <input
                  type="text"
                  value={data.titleLine1}
                  onChange={(e) => setField("titleLine1", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                  placeholder="Ropa suavecita para"
                />
              </Field>
              <Field label="Título (segunda línea, en color)">
                <input
                  type="text"
                  value={data.titleLine2}
                  onChange={(e) => setField("titleLine2", e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                  placeholder="tus pequeños"
                />
              </Field>
              <Field label="Descripción">
                <textarea
                  rows={4}
                  value={data.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "resize-y leading-relaxed")}
                  placeholder="Descubrí nuestra selección de bodys, remeras y prendas de algodón premium…"
                />
              </Field>
            </EditorSection>

            <EditorSection
              title="Imagen"
              desc="La foto grande de la portada"
              open={openSection === "imagen"}
              onToggle={() => toggleSection("imagen")}
            >
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#FEFDF8]">
                  {data.imageSrc ? (
                    <Image
                      src={data.imageSrc}
                      alt="Imagen de la portada"
                      unoptimized
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-zinc-400">
                      Sin imagen
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-tatan-primario4">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Subiendo…" : "Cambiar imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading}
                      onChange={handleImageUpload}
                    />
                  </label>
                  {uploadError ? (
                    <p className="text-xs font-medium text-rose-600">
                      {uploadError}
                    </p>
                  ) : null}
                </div>
              </div>
              <Field label="O pegá el link de una imagen">
                <input
                  type="url"
                  value={data.imageSrc}
                  onChange={(e) => setField("imageSrc", e.target.value)}
                  className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "text-xs")}
                  placeholder="https://…"
                />
              </Field>
            </EditorSection>

            <EditorSection
              title="Botones"
              desc="Los dos botones debajo del texto"
              open={openSection === "botones"}
              onToggle={() => toggleSection("botones")}
            >
              {([
                ["cta1Text", "cta1Href", "Botón principal", "Ver colección", "/productos"],
                ["cta2Text", "cta2Href", "Botón secundario", "Ofertas", "/ofertas"],
              ] as const).map(([textKey, hrefKey, label, textPh, hrefPh]) => (
                <div key={textKey} className="rounded-xl border border-black/5 bg-zinc-50/60 p-3">
                  <p className="mb-2 text-xs font-bold text-zinc-700">{label}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Texto">
                      <input
                        type="text"
                        value={data[textKey]}
                        onChange={(e) => setField(textKey, e.target.value)}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                        placeholder={textPh}
                      />
                    </Field>
                    <Field label="Lleva a">
                      <input
                        type="text"
                        value={data[hrefKey]}
                        onChange={(e) => setField(hrefKey, e.target.value)}
                        className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "font-mono text-xs")}
                        placeholder={hrefPh}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </EditorSection>

            <EditorSection
              title="Etiquetas sobre la imagen"
              desc="Los dos cartelitos que flotan sobre la foto"
              open={openSection === "etiquetas"}
              onToggle={() => toggleSection("etiquetas")}
            >
              {([
                ["cottonBadge", "Etiqueta de arriba", setCottonBadge, "100% Algodón", "Orgánico"],
                ["shippingBadge", "Etiqueta de abajo", setShippingBadge, "Envío gratis", "Compras mayores a $25k"],
              ] as const).map(([key, label, setBadge, titlePh, subPh]) => {
                const badge = data[key];
                return (
                  <div key={key} className="rounded-xl border border-black/5 bg-zinc-50/60 p-3">
                    <ToggleField
                      label={label}
                      checked={badge.show}
                      onCheckedChange={(v) => setBadge({ show: v })}
                    />
                    {badge.show ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Texto">
                          <input
                            type="text"
                            value={badge.title}
                            onChange={(e) => setBadge({ title: e.target.value })}
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                            placeholder={titlePh}
                          />
                        </Field>
                        <Field label="Texto chico">
                          <input
                            type="text"
                            value={badge.subtitle}
                            onChange={(e) => setBadge({ subtitle: e.target.value })}
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                            placeholder={subPh}
                          />
                        </Field>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={badge.showIcon}
                            onChange={(e) => setBadge({ showIcon: e.target.checked })}
                            className="h-4 w-4 accent-[#8DBFA3]"
                          />
                          Mostrar ícono
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </EditorSection>

            <EditorSection
              title="Beneficios"
              desc="Las 3 tarjetas debajo de la portada (envío, cuotas, cambios)"
              open={openSection === "beneficios"}
              onToggle={() => toggleSection("beneficios")}
            >
              {data.benefits.map((b, i) => (
                <div key={i} className="rounded-xl border border-black/5 bg-zinc-50/60 p-3">
                  <ToggleField
                    label={b.title || `Beneficio ${i + 1}`}
                    checked={b.show}
                    onCheckedChange={(v) => setBenefit(i, { show: v })}
                  >
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
                      style={{ color: b.color }}
                    >
                      {b.iconKey === "Truck" ? (
                        <Truck className="h-3.5 w-3.5" strokeWidth={1.8} />
                      ) : b.iconKey === "CreditCard" ? (
                        <CreditCard className="h-3.5 w-3.5" strokeWidth={1.8} />
                      ) : (
                        <Heart className="h-3.5 w-3.5" strokeWidth={1.8} />
                      )}
                    </span>
                  </ToggleField>
                  {b.show ? (
                    <div className="mt-3 grid gap-3">
                      <Field label="Título">
                        <input
                          type="text"
                          value={b.title}
                          onChange={(e) => setBenefit(i, { title: e.target.value })}
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                        />
                      </Field>
                      <Field label="Descripción">
                        <textarea
                          rows={2}
                          value={b.description}
                          onChange={(e) => setBenefit(i, { description: e.target.value })}
                          className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "resize-y leading-relaxed")}
                        />
                      </Field>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                          <input
                            type="color"
                            value={b.color}
                            onChange={(e) => setBenefit(i, { color: e.target.value })}
                            className="h-8 w-10 cursor-pointer rounded-lg border border-black/10 bg-white p-0.5"
                          />
                          Color del ícono
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                          <input
                            type="checkbox"
                            checked={b.showIcon}
                            onChange={(e) => setBenefit(i, { showIcon: e.target.checked })}
                            className="h-4 w-4 accent-[#8DBFA3]"
                          />
                          Mostrar ícono
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </EditorSection>
          </div>

          <section
            aria-label="Vista previa Hero"
            className={cx(
              "order-1 self-start rounded-2xl border border-black/5 bg-[linear-gradient(180deg,#FFFDF7_0%,#FFFFFF_100%)] p-3 shadow-sm lg:sticky lg:top-36 lg:order-2 lg:col-span-3 lg:block lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto lg:p-5",
              showPreview ? "block" : "hidden",
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
                  Vista previa en vivo
                </h3>
                <p className="text-xs text-zinc-500">
                  Así se ve en la web mientras editás
                </p>
              </div>

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

function EditorSection({
  title,
  desc,
  open,
  onToggle,
  children,
}: {
  title: string;
  desc: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_3px_rgba(185,168,155,0.15)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <ChevronDown
          className={cx(
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="min-w-0">
          <span className="block text-sm font-bold text-zinc-900">{title}</span>
          <span className="mt-0.5 block text-xs text-zinc-500">{desc}</span>
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-4 border-t border-black/5 px-4 pb-5 pt-4 sm:px-5">
          {children}
        </div>
      ) : null}
    </div>
  );
}
