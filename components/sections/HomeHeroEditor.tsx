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
  Tag,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import SuccessModal from "@/components/ui/SuccessModal";
import HeroSlideshow from "@/components/home/HeroSlideshow";
import {
  apiProducts,
  apiRebuildCombos,
  apiSiteContent,
  apiSiteContentSave,
  apiRevalidateTag,
  apiUploadImage,
  type Product,
} from "@/lib/tatan-api";
import {
  HOME_HERO_DEFAULT as DEFAULT_HERO,
  HOME_PROMO_DEFAULT,
} from "@/lib/site-content-defaults";
import { withHomeDefaults } from "@/lib/home-content";

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

/** Producto en promoción que ocupa la portada. */
export type HomePromo = {
  enabled: boolean;
  productId: string;
  /** Texto chico arriba ("¡Oferta de la semana!") */
  label: string;
  /** Título; si queda vacío se usa el nombre del producto */
  title: string;
  /** Texto opcional; si queda vacío se usa la descripción de la portada */
  text: string;
  ctaText: string;
  /** Último día de la promo (AAAA-MM-DD). Vacío = sin fecha de fin */
  endsAt: string;
};

/** Tarjeta de categoría del inicio. */
export type HomeCategoryItem = {
  key: "body" | "remera" | "pijama" | "set" | "pantalon" | "buzo" | "accesorio";
  name: string;
  show: boolean;
  /** Foto opcional; vacía = ícono */
  imageSrc: string;
};

/** Secciones del inicio que se pueden prender, apagar y editar. */
export type HomeSections = {
  /** Nubes, estrellitas y adornos animados */
  decorations: boolean;
  socialProof: { show: boolean; text: string };
  /** Cinta en movimiento. Sin frases = se arma sola con etiquetas y beneficios */
  marquee: { show: boolean; items: string[] };
  categories: {
    show: boolean;
    title: string;
    subtitle: string;
    items: HomeCategoryItem[];
    ageShortcuts: boolean;
  };
  products: { show: boolean; title: string; subtitle: string };
  newsletter: {
    show: boolean;
    title: string;
    text: string;
    buttonText: string;
  };
};

/** Página /productos. */
export type ProductsPageContent = {
  title: string;
  subtitle: string;
  banner: {
    show: boolean;
    label: string;
    title: string;
    text: string;
    buttonText: string;
    buttonHref: string;
  };
};

/** Un mensaje de la franja de arriba del header. */
export type HeaderMessage = {
  text: string;
  /** Muestra el logo de Mercado Pago al lado del texto */
  mpLogo: boolean;
};

/** Franja de mensajes arriba del header (en todas las páginas). */
export type HeaderContent = {
  show: boolean;
  messages: HeaderMessage[];
  /** Segundos que queda cada mensaje */
  intervalSec: number;
};

/** Opciones generales de la tienda. */
export type StoreSettings = {
  /** Elegir talle/color y agregar al carrito desde la card */
  quickAdd: boolean;
  /**
   * Precio por mayor:
   *  - "auto": se muestra y el carrito lo aplica solo al llegar a la cantidad
   *  - "info": se muestra, pero el carrito cobra el precio normal
   *  - "off":  no se muestra
   */
  wholesaleMode: "auto" | "info" | "off";
};

export type HomeHeroData = {
  /** Fotos de la portada (hasta 5) que pasan en bucle. La 1ª = imageSrc */
  images?: string[];
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
  promo?: HomePromo;
  sections?: HomeSections;
  productsPage?: ProductsPageContent;
  store?: StoreSettings;
  header?: HeaderContent;
};

const MAX_HERO_IMAGES = 5;

type Toast = { id: number; kind: "ok" | "error"; msg: string } | null;

function initialHeroData(): HomeHeroData {
  if (typeof window === "undefined") return DEFAULT_HERO;
  try {
    const raw = window.localStorage.getItem("crm:home-hero");
    if (!raw) return DEFAULT_HERO;
    return withHomeDefaults(JSON.parse(raw) as Partial<HomeHeroData>);
  } catch {
    return DEFAULT_HERO;
  }
}

export default function HomeHeroEditor() {
  const [data, setData] = React.useState<HomeHeroData>(() =>
    withHomeDefaults(DEFAULT_HERO),
  );
  const [openSection, setOpenSection] = React.useState<string | null>("promo");
  const [showPreview, setShowPreview] = React.useState(false);
  const [savedJson, setSavedJson] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<Toast>(null);
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState<Product[] | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    apiProducts()
      .then((list) => {
        if (!cancelled) setProducts(list.filter((p) => p.active !== false));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const promo = { ...HOME_PROMO_DEFAULT, ...(data.promo ?? {}) };
  const promoProduct = products?.find((p) => p.id === promo.productId) ?? null;
  const setPromo = (patch: Partial<HomePromo>) =>
    setData((prev) => ({
      ...prev,
      promo: { ...HOME_PROMO_DEFAULT, ...(prev.promo ?? {}), ...patch },
    }));

  const header = data.header!;
  const setHeader = (patch: Partial<HeaderContent>) =>
    setData((prev) => ({ ...prev, header: { ...prev.header!, ...patch } }));
  const setMessage = (i: number, patch: Partial<HeaderMessage>) =>
    setHeader({
      messages: header.messages.map((m, j) => (j === i ? { ...m, ...patch } : m)),
    });
  const moveMessage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= header.messages.length) return;
    const list = header.messages.slice();
    [list[i], list[j]] = [list[j], list[i]];
    setHeader({ messages: list });
  };
  const sec = data.sections!;
  const page = data.productsPage!;
  const store = data.store!;
  const setSec = <K extends keyof HomeSections>(
    k: K,
    patch: Partial<HomeSections[K]> | HomeSections[K],
  ) =>
    setData((prev) => {
      const cur = prev.sections!;
      const v =
        typeof cur[k] === "object" && cur[k] !== null
          ? { ...(cur[k] as object), ...(patch as object) }
          : patch;
      return { ...prev, sections: { ...cur, [k]: v } as HomeSections };
    });
  const setCategory = (key: string, patch: Partial<HomeCategoryItem>) =>
    setData((prev) => {
      const cur = prev.sections!;
      return {
        ...prev,
        sections: {
          ...cur,
          categories: {
            ...cur.categories,
            items: cur.categories.items.map((c) =>
              c.key === key ? { ...c, ...patch } : c,
            ),
          },
        },
      };
    });
  const setPage = (patch: Partial<ProductsPageContent>) =>
    setData((prev) => ({
      ...prev,
      productsPage: { ...prev.productsPage!, ...patch },
    }));
  const setBanner = (patch: Partial<ProductsPageContent["banner"]>) =>
    setData((prev) => ({
      ...prev,
      productsPage: {
        ...prev.productsPage!,
        banner: { ...prev.productsPage!.banner, ...patch },
      },
    }));
  const [catUploading, setCatUploading] = React.useState<string | null>(null);
  const [combosMsg, setCombosMsg] = React.useState<string | null>(null);
  const uploadCategoryImage = async (key: string, file: File) => {
    setCatUploading(key);
    try {
      const url = await apiUploadImage(file);
      setCategory(key, { imageSrc: url });
    } catch (err) {
      pushToast(
        "error",
        err instanceof Error ? err.message : "No se pudo subir la imagen",
      );
    } finally {
      setCatUploading(null);
    }
  };

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
          const merged = withHomeDefaults(r.data as Partial<HomeHeroData>);
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

  const heroImages = (data.images?.length ? data.images : [data.imageSrc])
    .filter(Boolean)
    .slice(0, MAX_HERO_IMAGES);
  // La 1ª foto también queda en imageSrc (compatibilidad con la versión anterior)
  const setHeroImages = (list: string[]) =>
    setData((prev) => ({
      ...prev,
      images: list.slice(0, MAX_HERO_IMAGES),
      imageSrc: list[0] ?? prev.imageSrc,
    }));
  const moveHeroImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= heroImages.length) return;
    const list = heroImages.slice();
    [list[i], list[j]] = [list[j], list[i]];
    setHeroImages(list);
  };
  const [heroUrl, setHeroUrl] = React.useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(
      0,
      Math.max(0, MAX_HERO_IMAGES - heroImages.length),
    );
    e.target.value = "";
    if (!files.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await apiUploadImage(f));
      setHeroImages([...heroImages, ...urls]);
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
    setData(withHomeDefaults(DEFAULT_HERO));
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
              Inicio y tienda
            </h2>
            <p className="text-xs text-zinc-500">
              {loading
                ? "Cargando…"
                : remoteStatus === "error"
                  ? "No se pudo leer la versión publicada: estás viendo una copia local."
                  : dirty
                    ? "Tenés cambios sin guardar"
                    : "Tocá una sección para editarla. Un solo “Guardar” guarda todo."}
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
            <GroupLabel first>Header (arriba, en todas las páginas)</GroupLabel>

            <EditorSection
              title="Mensajes de arriba"
              desc={
                header.show
                  ? `${header.messages.filter((m) => m.text.trim()).length} mensajes que van rotando`
                  : "Oculta"
              }
              open={openSection === "header"}
              onToggle={() => toggleSection("header")}
            >
              <ToggleField
                label="Mostrar la franja de mensajes"
                checked={header.show}
                onCheckedChange={(v) => setHeader({ show: v })}
              />
              {header.show ? (
                <>
                  <div className="space-y-2">
                    {header.messages.map((m, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-black/10 bg-white p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 shrink-0 text-center text-xs font-bold text-zinc-400">
                            {i + 1}
                          </span>
                          <input
                            type="text"
                            value={m.text}
                            onChange={(e) => setMessage(i, { text: e.target.value })}
                            aria-label={`Mensaje ${i + 1}`}
                            placeholder="Ej: 3 cuotas sin interés"
                            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-zinc-900 outline-none focus:border-tatan-primario4"
                          />
                          <div className="flex shrink-0 items-center">
                            <button
                              type="button"
                              onClick={() => moveMessage(i, -1)}
                              disabled={i === 0}
                              aria-label="Subir"
                              className="inline-flex h-8 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                            >
                              <ChevronDown className="h-4 w-4 rotate-180" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMessage(i, 1)}
                              disabled={i === header.messages.length - 1}
                              aria-label="Bajar"
                              className="inline-flex h-8 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setHeader({
                                  messages: header.messages.filter((_, j) => j !== i),
                                })
                              }
                              aria-label={`Eliminar mensaje ${i + 1}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <label className="mt-2 ml-7 flex w-fit items-center gap-2 text-xs font-medium text-zinc-600">
                          <input
                            type="checkbox"
                            checked={m.mpLogo}
                            onChange={(e) => setMessage(i, { mpLogo: e.target.checked })}
                            className="h-4 w-4 accent-[#8DBFA3]"
                          />
                          Mostrar el logo de Mercado Pago al lado
                        </label>
                      </div>
                    ))}
                    {header.messages.length === 0 ? (
                      <p className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                        No hay mensajes: la franja no se muestra.
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        setHeader({
                          messages: [...header.messages, { text: "", mpLogo: false }],
                        })
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 py-2.5 text-sm font-semibold text-zinc-600 hover:border-tatan-primario4 hover:bg-tatan-primario1/20"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar mensaje
                    </button>
                  </div>
                  <Field label="Tiempo de cada mensaje">
                    <select
                      value={String(header.intervalSec)}
                      onChange={(e) => setHeader({ intervalSec: Number(e.target.value) })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    >
                      {[2.5, 3.5, 5, 7].map((n) => (
                        <option key={n} value={n}>
                          {String(n).replace(".", ",")} segundos
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              ) : null}
            </EditorSection>

            <GroupLabel>Portada</GroupLabel>

            <EditorSection
              title="Promoción"
              desc={
                promo.enabled && promoProduct
                  ? `Activa: ${promoProduct.name}`
                  : "Destacá un producto en oferta en la portada"
              }
              open={openSection === "promo"}
              onToggle={() => toggleSection("promo")}
            >
              <ToggleField
                label="Mostrar una promoción en la portada"
                checked={promo.enabled}
                onCheckedChange={(v) => setPromo({ enabled: v })}
              >
                <Tag className="h-4 w-4 text-rose-400" strokeWidth={2} />
              </ToggleField>

              {promo.enabled ? (
                <>
                  <Field label="Producto en promoción">
                    <select
                      value={promo.productId}
                      onChange={(e) => setPromo({ productId: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    >
                      <option value="">
                        {products === null ? "Cargando productos…" : "Elegí un producto"}
                      </option>
                      {(products ?? [])
                        .slice()
                        .sort(
                          (a, b) =>
                            Number(!!b.originalPrice) - Number(!!a.originalPrice),
                        )
                        .map((p) => {
                          const off =
                            p.originalPrice && p.originalPrice > p.price
                              ? Math.round(
                                  ((p.originalPrice - p.price) / p.originalPrice) * 100,
                                )
                              : 0;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} · ${Number(p.price).toLocaleString("es-AR")}
                              {off ? ` (-${off}%)` : ""}
                            </option>
                          );
                        })}
                    </select>
                  </Field>

                  {promoProduct ? (
                    <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-zinc-50/70 p-2.5">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                        <Image
                          src={promoProduct.imageSrc || "/tatanLogo.png"}
                          alt=""
                          fill
                          unoptimized
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0 text-xs">
                        <p className="truncate font-bold text-zinc-800">
                          {promoProduct.name}
                        </p>
                        <p className="text-zinc-600">
                          ${Number(promoProduct.price).toLocaleString("es-AR")}
                          {promoProduct.originalPrice &&
                          promoProduct.originalPrice > promoProduct.price ? (
                            <span className="ml-1.5 text-zinc-400 line-through">
                              ${Number(promoProduct.originalPrice).toLocaleString("es-AR")}
                            </span>
                          ) : null}
                        </p>
                        {!(
                          promoProduct.originalPrice &&
                          promoProduct.originalPrice > promoProduct.price
                        ) ? (
                          <p className="mt-0.5 text-amber-700">
                            Para mostrar el % de descuento, cargale un “precio
                            anterior” al producto (Productos → Oferta y por mayor).
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <Field label="Texto chico arriba">
                    <input
                      type="text"
                      value={promo.label}
                      onChange={(e) => setPromo({ label: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                      placeholder="¡Oferta especial!"
                    />
                  </Field>
                  <Field label="Título (opcional: si lo dejás vacío va el nombre del producto)">
                    <input
                      type="text"
                      value={promo.title}
                      onChange={(e) => setPromo({ title: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                      placeholder={promoProduct?.name ?? "Body de algodón"}
                    />
                  </Field>
                  <Field label="Texto (opcional)">
                    <textarea
                      rows={2}
                      value={promo.text}
                      onChange={(e) => setPromo({ text: e.target.value })}
                      className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "resize-y leading-relaxed")}
                      placeholder="Solo por esta semana, aprovechá…"
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Texto del botón">
                      <input
                        type="text"
                        value={promo.ctaText}
                        onChange={(e) => setPromo({ ctaText: e.target.value })}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                        placeholder="Comprar ahora"
                      />
                    </Field>
                    <Field label="Termina el (opcional)">
                      <input
                        type="date"
                        value={promo.endsAt}
                        onChange={(e) => setPromo({ endsAt: e.target.value })}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Con fecha de fin se muestra una cuenta regresiva y la promo
                    se oculta sola al terminar ese día. Si el producto se queda
                    sin stock, también se oculta y vuelve la portada normal.
                  </p>
                </>
              ) : null}
            </EditorSection>

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
              title="Fotos"
              desc={`${heroImages.length} de ${MAX_HERO_IMAGES} · ${heroImages.length > 1 ? "van pasando en bucle" : "foto fija"}`}
              open={openSection === "imagen"}
              onToggle={() => toggleSection("imagen")}
            >
              <p className="text-xs text-zinc-500">
                Hasta {MAX_HERO_IMAGES} fotos. Con más de una, van pasando solas
                con un fundido. La primera es la que se ve al entrar.
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {heroImages.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-[#FEFDF8]"
                  >
                    <Image
                      src={src}
                      alt={`Foto ${i + 1} de la portada`}
                      unoptimized
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-white/90 px-1.5 text-[10px] font-bold text-zinc-700 shadow-sm">
                      {i + 1}
                    </span>
                    <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveHeroImage(i, -1)}
                          disabled={i === 0}
                          aria-label={`Mover foto ${i + 1} antes`}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-zinc-600 shadow-sm disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveHeroImage(i, 1)}
                          disabled={i === heroImages.length - 1}
                          aria-label={`Mover foto ${i + 1} después`}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-zinc-600 shadow-sm disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setHeroImages(heroImages.filter((_, j) => j !== i))
                        }
                        disabled={heroImages.length <= 1}
                        aria-label={`Quitar foto ${i + 1}`}
                        title={heroImages.length <= 1 ? "Tiene que quedar al menos una foto" : undefined}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-zinc-500 shadow-sm hover:text-rose-500 disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {heroImages.length < MAX_HERO_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/15 text-zinc-500 transition hover:border-tatan-primario4 hover:bg-tatan-primario1/20 focus-within:ring-2 focus-within:ring-tatan-primario4">
                    {uploading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/15 border-t-zinc-600" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                    <span className="text-[11px] font-semibold">
                      {uploading ? "Subiendo…" : "Agregar"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      disabled={uploading}
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              {uploadError ? (
                <p className="text-xs font-medium text-rose-600">{uploadError}</p>
              ) : null}
              {heroImages.length < MAX_HERO_IMAGES && (
                <Field label="O agregá una foto con su link">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={heroUrl}
                      onChange={(e) => setHeroUrl(e.target.value)}
                      className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "text-xs")}
                      placeholder="https://…"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const u = heroUrl.trim();
                        if (!/^https?:\/\//i.test(u) && !u.startsWith("/")) return;
                        setHeroImages([...heroImages, u]);
                        setHeroUrl("");
                      }}
                      className="shrink-0 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Agregar
                    </button>
                  </div>
                </Field>
              )}
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
              <p className="text-xs text-zinc-500">
                Si un botón lleva a /ofertas y no hay productos con descuento,
                se oculta solo (también en el menú y el pie de página).
              </p>
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

            <GroupLabel>Secciones del inicio</GroupLabel>

            <EditorSection
              title="Cinta de mensajes"
              desc={sec.marquee.show ? "La franja que se mueve debajo de la portada" : "Oculta"}
              open={openSection === "cinta"}
              onToggle={() => toggleSection("cinta")}
            >
              <ToggleField
                label="Mostrar la cinta"
                checked={sec.marquee.show}
                onCheckedChange={(v) => setSec("marquee", { show: v })}
              />
              {sec.marquee.show ? (
                <Field label="Frases (una por línea)">
                  <textarea
                    rows={5}
                    value={sec.marquee.items.join("\n")}
                    onChange={(e) =>
                      setSec("marquee", { items: e.target.value.split("\n") })
                    }
                    className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "resize-y leading-relaxed")}
                    placeholder={"100% Algodón Pima\nEnvío a todo el país\nCambios sin costo"}
                  />
                  <span className="mt-1.5 block text-xs text-zinc-500">
                    Si lo dejás vacío, se arma sola con las etiquetas de la foto y los beneficios.
                  </span>
                </Field>
              ) : null}
            </EditorSection>

            <EditorSection
              title="Categorías"
              desc={sec.categories.show ? `${sec.categories.items.filter((c) => c.show).length} visibles` : "Oculta"}
              open={openSection === "categorias"}
              onToggle={() => toggleSection("categorias")}
            >
              <ToggleField
                label="Mostrar la sección de categorías"
                checked={sec.categories.show}
                onCheckedChange={(v) => setSec("categories", { show: v })}
              />
              {sec.categories.show ? (
                <>
                  <Field label="Título">
                    <input
                      type="text"
                      value={sec.categories.title}
                      onChange={(e) => setSec("categories", { title: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    />
                  </Field>
                  <Field label="Subtítulo (opcional)">
                    <input
                      type="text"
                      value={sec.categories.subtitle}
                      onChange={(e) => setSec("categories", { subtitle: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    />
                  </Field>
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-zinc-700">
                      Tarjetas
                    </span>
                    {sec.categories.items.map((c) => (
                      <div
                        key={c.key}
                        className={cx(
                          "rounded-xl border p-2.5 transition",
                          c.show ? "border-black/10 bg-white" : "border-black/5 bg-zinc-50/70",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <label
                            className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-black/15 bg-zinc-50 text-zinc-400 hover:border-tatan-primario4"
                            title="Subir foto"
                          >
                            {c.imageSrc ? (
                              <Image
                                src={c.imageSrc}
                                alt=""
                                fill
                                unoptimized
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : catUploading === c.key ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/15 border-t-zinc-600" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = "";
                                if (f) void uploadCategoryImage(c.key, f);
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => setCategory(c.key, { name: e.target.value })}
                            aria-label="Nombre de la categoría"
                            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-zinc-900 outline-none focus:border-tatan-primario4"
                          />
                          <button
                            type="button"
                            role="switch"
                            aria-checked={c.show}
                            aria-label={`Mostrar ${c.name}`}
                            onClick={() => setCategory(c.key, { show: !c.show })}
                            className={cx(
                              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-black/5 transition-colors",
                              c.show ? "bg-tatan-primario1" : "bg-zinc-200",
                            )}
                          >
                            <span
                              className={cx(
                                "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                                c.show ? "translate-x-5" : "translate-x-0.5",
                              )}
                            />
                          </button>
                        </div>
                        {c.imageSrc ? (
                          <button
                            type="button"
                            onClick={() => setCategory(c.key, { imageSrc: "" })}
                            className="mt-1.5 text-[11px] font-semibold text-zinc-500 hover:text-rose-500"
                          >
                            Quitar foto (vuelve el ícono)
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <p className="text-xs text-zinc-500">
                      Tocá el cuadrado para subir una foto; sin foto se usa un ícono.
                    </p>
                  </div>
                  <ToggleField
                    label="Atajos “Para bebés” y “Para niños”"
                    checked={sec.categories.ageShortcuts}
                    onCheckedChange={(v) => setSec("categories", { ageShortcuts: v })}
                  />
                </>
              ) : null}
            </EditorSection>

            <EditorSection
              title="Productos"
              desc={sec.products.show ? "La grilla con todos los productos" : "Oculta"}
              open={openSection === "productos"}
              onToggle={() => toggleSection("productos")}
            >
              <ToggleField
                label="Mostrar los productos en el inicio"
                checked={sec.products.show}
                onCheckedChange={(v) => setSec("products", { show: v })}
              />
              {sec.products.show ? (
                <>
                  <Field label="Título">
                    <input
                      type="text"
                      value={sec.products.title}
                      onChange={(e) => setSec("products", { title: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    />
                  </Field>
                  <Field label="Subtítulo (opcional)">
                    <input
                      type="text"
                      value={sec.products.subtitle}
                      onChange={(e) => setSec("products", { subtitle: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    />
                  </Field>
                </>
              ) : null}
            </EditorSection>

            <EditorSection
              title="Newsletter"
              desc={sec.newsletter.show ? "El cuadro “Sumate al club” del final" : "Oculto"}
              open={openSection === "newsletter"}
              onToggle={() => toggleSection("newsletter")}
            >
              <ToggleField
                label="Mostrar el newsletter"
                checked={sec.newsletter.show}
                onCheckedChange={(v) => setSec("newsletter", { show: v })}
              />
              {sec.newsletter.show ? (
                <>
                  <Field label="Título">
                    <input
                      type="text"
                      value={sec.newsletter.title}
                      onChange={(e) => setSec("newsletter", { title: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    />
                  </Field>
                  <Field label="Texto">
                    <textarea
                      rows={3}
                      value={sec.newsletter.text}
                      onChange={(e) => setSec("newsletter", { text: e.target.value })}
                      className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "resize-y leading-relaxed")}
                    />
                  </Field>
                  <Field label="Texto del botón">
                    <input
                      type="text"
                      value={sec.newsletter.buttonText}
                      onChange={(e) => setSec("newsletter", { buttonText: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    />
                  </Field>
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Ojo: el formulario todavía no guarda los emails. Si no lo vas a usar, mejor ocultalo.
                  </p>
                </>
              ) : null}
            </EditorSection>

            <EditorSection
              title="Detalles y animaciones"
              desc="Dibujitos animados y “mamás felices”"
              open={openSection === "detalles"}
              onToggle={() => toggleSection("detalles")}
            >
              <ToggleField
                label="Nubes, estrellitas y corazones animados"
                checked={sec.decorations}
                onCheckedChange={(v) => setSec("decorations", v)}
              />
              <ToggleField
                label="Mostrar opiniones debajo de los botones"
                checked={sec.socialProof.show}
                onCheckedChange={(v) => setSec("socialProof", { show: v })}
              />
              {sec.socialProof.show ? (
                <Field label="Texto de las opiniones">
                  <input
                    type="text"
                    value={sec.socialProof.text}
                    onChange={(e) => setSec("socialProof", { text: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                  />
                </Field>
              ) : null}
            </EditorSection>

            <GroupLabel>Página de productos</GroupLabel>

            <EditorSection
              title="Encabezado y banner"
              desc="El título de /productos y el cuadro del final"
              open={openSection === "pagina-productos"}
              onToggle={() => toggleSection("pagina-productos")}
            >
              <Field label="Título">
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => setPage({ title: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                />
              </Field>
              <Field label="Subtítulo (opcional)">
                <textarea
                  rows={2}
                  value={page.subtitle}
                  onChange={(e) => setPage({ subtitle: e.target.value })}
                  className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "resize-y leading-relaxed")}
                />
              </Field>
              <ToggleField
                label="Mostrar el banner del final"
                checked={page.banner.show}
                onCheckedChange={(v) => setBanner({ show: v })}
              />
              {page.banner.show ? (
                <>
                  <Field label="Texto chico">
                    <input
                      type="text"
                      value={page.banner.label}
                      onChange={(e) => setBanner({ label: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    />
                  </Field>
                  <Field label="Título">
                    <input
                      type="text"
                      value={page.banner.title}
                      onChange={(e) => setBanner({ title: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                    />
                  </Field>
                  <Field label="Texto">
                    <textarea
                      rows={2}
                      value={page.banner.text}
                      onChange={(e) => setBanner({ text: e.target.value })}
                      className={cx("w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60", "resize-y leading-relaxed")}
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Texto del botón">
                      <input
                        type="text"
                        value={page.banner.buttonText}
                        onChange={(e) => setBanner({ buttonText: e.target.value })}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                      />
                    </Field>
                    <Field label="Link del botón">
                      <input
                        type="text"
                        value={page.banner.buttonHref}
                        onChange={(e) => setBanner({ buttonHref: e.target.value })}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-tatan-primario4 focus:ring-2 focus:ring-tatan-primario1/60"
                        placeholder="/ofertas"
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Si el botón va a /ofertas y no hay productos con descuento, el banner se oculta solo.
                  </p>
                </>
              ) : null}
            </EditorSection>

            <GroupLabel>Tienda</GroupLabel>

            <EditorSection
              title="Compra rápida"
              desc={store.quickAdd ? "Activada: se compra desde la card" : "Desactivada"}
              open={openSection === "tienda"}
              onToggle={() => toggleSection("tienda")}
            >
              <ToggleField
                label="Elegir talle y color y agregar al carrito desde la card"
                checked={store.quickAdd}
                onCheckedChange={(v) =>
                  setData((prev) => ({ ...prev, store: { ...prev.store!, quickAdd: v } }))
                }
              />
              <p className="text-xs text-zinc-500">
                Apagado, las cards muestran solo “Ver producto” y se compra desde la página de cada producto.
              </p>
            </EditorSection>

            <EditorSection
              title="Precio por mayor"
              desc={
                store.wholesaleMode === "auto"
                  ? "Se aplica solo en el carrito"
                  : store.wholesaleMode === "info"
                    ? "Solo se muestra (el carrito cobra precio normal)"
                    : "Apagado"
              }
              open={openSection === "mayor"}
              onToggle={() => toggleSection("mayor")}
            >
              <div role="radiogroup" aria-label="Precio por mayor" className="space-y-2">
                {(
                  [
                    {
                      v: "auto",
                      t: "Mostrar y aplicar en el carrito",
                      d: "Cuando el cliente llega a la cantidad mínima de un producto (sumando talles y colores), el carrito cobra el precio por mayor.",
                    },
                    {
                      v: "info",
                      t: "Solo mostrarlo",
                      d: "Se ve en la card y en el producto, pero el carrito cobra el precio normal. Útil si lo arreglás por WhatsApp.",
                    },
                    {
                      v: "off",
                      t: "No mostrar",
                      d: "Se ignora el precio por mayor en toda la tienda.",
                    },
                  ] as const
                ).map((o) => (
                  <label
                    key={o.v}
                    className={cx(
                      "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
                      store.wholesaleMode === o.v
                        ? "border-tatan-primario4 bg-tatan-primario1/25"
                        : "border-black/10 bg-white hover:bg-zinc-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="wholesale-mode"
                      checked={store.wholesaleMode === o.v}
                      onChange={() =>
                        setData((prev) => ({
                          ...prev,
                          store: { ...prev.store!, wholesaleMode: o.v },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 accent-[#F6C6A1]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-zinc-800">
                        {o.t}
                      </span>
                      <span className="block text-xs text-zinc-500">{o.d}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                El precio y la cantidad mínima se cargan en cada producto
                (Productos → editar → Oferta y por mayor).
              </p>
            </EditorSection>

            <EditorSection
              title="Combinaciones (analítica)"
              desc="“La gente también eligió combinar con”"
              open={openSection === "combos"}
              onToggle={() => toggleSection("combos")}
            >
              <p className="text-sm text-zinc-600">
                Se arma solo con <strong>pedidos pagados</strong>: cuenta qué
                productos se compran juntos. Mientras no haya ventas, el producto
                y el carrito muestran productos relacionados normales.
              </p>
              <button
                type="button"
                onClick={async () => {
                  setCombosMsg("Actualizando…");
                  const r = await apiRebuildCombos();
                  setCombosMsg(
                    r.ok
                      ? `Listo: ${r.pairs ?? 0} combinaciones a partir de pedidos pagados.`
                      : r.error === "MIGRATION_PENDING"
                        ? "Falta correr la migración de la base de datos (ver instrucciones)."
                        : `No se pudo actualizar: ${r.message ?? r.error ?? "error"}`,
                  );
                }}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Actualizar con los pedidos pagados
              </button>
              {combosMsg ? (
                <p className="text-xs font-medium text-zinc-600" role="status">
                  {combosMsg}
                </p>
              ) : null}
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

            {promo.enabled && promoProduct ? (
              <div className="mb-3 flex items-center gap-3 rounded-2xl border border-tatan-acento-rosa/50 bg-tatan-acento-rosa/15 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  <Image
                    src={promoProduct.imageSrc || "/tatanLogo.png"}
                    alt=""
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500">
                    {promo.label || "Promoción"}
                  </p>
                  <p className="truncate text-sm font-bold text-zinc-800">
                    {promo.title || promoProduct.name}
                  </p>
                  <p className="text-xs text-zinc-600">
                    La portada muestra este producto con su precio y el botón
                    “{promo.ctaText || "Comprar ahora"}”.
                    {promo.endsAt ? ` Hasta el ${promo.endsAt.split("-").reverse().join("/")}.` : ""}
                  </p>
                </div>
              </div>
            ) : null}

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

                      {sec.socialProof.show ? (
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
                            {sec.socialProof.text}
                          </p>
                        </div>
                      </div>
                      ) : null}
                    </div>

                    <div className="order-1 relative md:order-2">
                      <div className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-tatan-acento-amarillo/30 blur-2xl sm:-top-6 sm:-left-6 sm:h-24 sm:w-24" />
                      <div className="absolute -bottom-6 -right-4 h-20 w-20 rounded-full bg-tatan-acento-rosa/30 blur-2xl sm:-bottom-8 sm:-right-6 sm:h-32 sm:w-32" />
                      <div className="relative paper-card rounded-3xl p-3 sm:p-6">
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-tatan-primario1/40 to-tatan-primario2/40 p-4 sm:p-6">
                          <HeroSlideshow
                            images={heroImages}
                            priority={false}
                            sizes="(max-width: 768px) 80vw, 400px"
                          />
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

function GroupLabel({
  children,
  first = false,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <p
      className={cx(
        "px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400",
        first ? "pt-0" : "pt-4",
      )}
    >
      {children}
    </p>
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
