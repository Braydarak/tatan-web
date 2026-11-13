"use client";

import SmartImage from "@/components/ui/SmartImage";
import ProductPhoto from "@/components/ui/ProductPhoto";
import Link from "next/link";
import * as React from "react";
import MessageBanner from "@/components/ui/MessageBanner";
import CustomInput from "@/components/ui/CustomInput";
import MercadoPagoSvg from "@/assets/svg/mercadoPago";
import type { HeaderContent } from "@/components/sections/HomeHeroEditor";
import type { OffersInfo } from "@/lib/card-props";
import { useStoreSettings } from "@/components/StoreSettingsContext";
import WholesaleLine from "@/components/cart/WholesaleLine";
import { cartTotals, effectiveUnitPrice } from "@/lib/wholesale";
import {
  Gift,
  LayoutGrid,
  Baby,
  Truck,
  Mail,
  Minus,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import {
  formatArs,
  removeFromCart,
  setQuantity,
  useCart,
} from "@/lib/cart";
import { productHref } from "@/lib/product-url";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type NavItem = {
  label: string;
  href: string;
  Icon: typeof Gift;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Ofertas", href: "/ofertas", Icon: Gift },
  { label: "Productos", href: "/productos", Icon: LayoutGrid },
  { label: "Bebés", href: "/productos?t=bebe", Icon: Baby },
  { label: "Envíos y pagos", href: "/envios", Icon: Truck },
  { label: "Contacto", href: "/contacto", Icon: Mail },
];

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" />
      <path d="M21 21l-5.2-5.2" />
    </svg>
  );
}

function IconCart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 6h15l-1.5 9H7.5L6 6Z" />
      <path d="M6 6 5 3H2" />
      <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  );
}

export default function Header({
  announcements,
  offers,
}: {
  announcements?: HeaderContent;
  offers?: OffersInfo;
}) {
  // Sin ofertas cargadas, no se muestra "Ofertas" en el menú
  const hasOffers = (offers?.count ?? 0) > 0;
  const navItems = hasOffers
    ? NAV_ITEMS
    : NAV_ITEMS.filter((n) => n.href !== "/ofertas");
  // Mensajes de la franja de arriba (editables en el CRM)
  const bannerMessages =
    announcements && announcements.show
      ? announcements.messages.filter((m) => m.text.trim().length > 0)
      : [];
  const hasBanner = bannerMessages.length > 0;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const mobilePanelId = React.useId();
  const cartPanelId = React.useId();
  const openStateRef = React.useRef({ menuOpen: false, cartOpen: false });
  const cart = useCart();
  const { wholesaleMode } = useStoreSettings();
  const totals = cartTotals(cart.items, wholesaleMode);
  const [toast, setToast] = React.useState<{
    id: number;
    text: string;
  } | null>(null);
  const [bump, setBump] = React.useState(0);

  // Abrir el carrito desde cualquier parte y avisar cuando se agrega algo
  React.useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    const onOpen = () => {
      setMenuOpen(false);
      setCartOpen(true);
    };
    const onAdded = (e: Event) => {
      const d = (e as CustomEvent<{
        name: string;
        size: string;
        colorName?: string;
      }>).detail;
      const extra = [d?.size && `Talle ${d.size}`, d?.colorName]
        .filter(Boolean)
        .join(" · ");
      setToast({ id: Date.now(), text: `${d?.name ?? "Producto"}${extra ? ` (${extra})` : ""}` });
      setBump((b) => b + 1);
      if (hide) clearTimeout(hide);
      hide = setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener("tatan:open-cart", onOpen);
    window.addEventListener("tatan:cart-added", onAdded);
    return () => {
      if (hide) clearTimeout(hide);
      window.removeEventListener("tatan:open-cart", onOpen);
      window.removeEventListener("tatan:cart-added", onAdded);
    };
  }, []);

  React.useEffect(() => {
    openStateRef.current.menuOpen = menuOpen;
    openStateRef.current.cartOpen = cartOpen;
    const shouldLock = menuOpen || cartOpen;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    if (shouldLock) {
      body.style.overflow = "hidden";
    }
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [menuOpen, cartOpen]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setCartOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const outerRef = React.useRef<HTMLDivElement>(null);
  const bannerRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  // Arrancan con la altura real (banner h-8 = 32px + fila de 68px + borde)
  // para que el espacio exista desde el primer render y la página no salte
  // cuando el JS mide el header.
  const [headerTotalHeight, setHeaderTotalHeight] = React.useState(
    hasBanner ? 101 : 69,
  );
  const [bannerHeight, setBannerHeight] = React.useState(hasBanner ? 32 : 0);

  React.useEffect(() => {
    let cancelled = false;
    const el = outerRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      let cancelled2 = false;
      function measureLegacy() {
        if (cancelled2) return;
        if (bannerRef.current) {
          setBannerHeight(
            Math.ceil(bannerRef.current.getBoundingClientRect().height),
          );
        }
        if (headerRef.current) {
          setHeaderTotalHeight(
            Math.ceil(
              headerRef.current.getBoundingClientRect().top +
                headerRef.current.getBoundingClientRect().height,
            ),
          );
        }
      }
      measureLegacy();
      window.addEventListener("resize", measureLegacy);
      window.addEventListener("orientationchange", measureLegacy);
      const t = setInterval(measureLegacy, 2000);
      return () => {
        cancelled2 = true;
        window.removeEventListener("resize", measureLegacy);
        window.removeEventListener("orientationchange", measureLegacy);
        clearInterval(t);
      };
    }
    function measure() {
      if (cancelled || !el) return;
      const total = Math.ceil(el.getBoundingClientRect().height);
      setHeaderTotalHeight(total);
      if (bannerRef.current) {
        setBannerHeight(
          Math.ceil(bannerRef.current.getBoundingClientRect().height),
        );
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        style={{ height: `${headerTotalHeight}px`, width: "100%" }}
      />
      <header
        ref={outerRef}
        className="fixed top-0 inset-x-0 z-50 w-full border-b border-black/5 bg-[#FEFDF8]/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.02)]"
      >
        {hasBanner ? (
          <div ref={bannerRef}>
            <MessageBanner
              from="alternate"
              intervalMs={Math.round((announcements?.intervalSec ?? 3.5) * 1000)}
              messages={bannerMessages.map((m, i) =>
                m.mpLogo ? (
                  <span
                    key={`mp-${i}`}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    {m.text}
                    <MercadoPagoSvg
                      className="h-20 w-20"
                      color="black"
                      title={undefined}
                    />
                  </span>
                ) : (
                  m.text
                ),
              )}
            />
          </div>
        ) : null}

        <div
          ref={headerRef}
          className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8"
        >
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-tatan-secundario1/50 bg-white text-zinc-900 shadow-sm transition hover:bg-tatan-primario1/60 active:scale-[0.98] lg:hidden shrink-0"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls={mobilePanelId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <IconClose className="h-5 w-5" />
            ) : (
              <IconMenu className="h-5 w-5" />
            )}
          </button>

          <Link
            href="/"
            className="flex-1 lg:flex-none inline-flex items-center justify-center lg:justify-start gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1]"
            onClick={() => {
              setMenuOpen(false);
            }}
            aria-label="Ir al inicio"
          >
            <div
              className="relative lg:mx-0 mx-auto"
              style={{ width: "auto", height: "44px", aspectRatio: "2 / 1" }}
            >
              <SmartImage
                fill
                src="/tatanLogo.png"
                alt="Tatan logo"
                priority
                sizes="88px"
                className="object-contain"
              />
            </div>
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Secciones"
          >
            {navItems.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-zinc-800 transition hover:bg-tatan-primario1/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1]"
              >
                <Icon
                  className="w-4 h-4 text-tatan-primario4 transition-transform group-hover:-translate-y-0.5"
                  strokeWidth={2}
                />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <form
              action="/productos"
              role="search"
              className="relative hidden w-96 lg:block"
            >
              <CustomInput
                type="search"
                name="q"
                aria-label="Buscar productos"
                placeholder="Buscar producto"
                inputClassName={cx(
                  "h-11 rounded-2xl border border-tatan-secundario1/60 bg-white text-sm text-zinc-900 shadow-sm",
                  "pr-3 py-0",
                )}
              />
            </form>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setCartOpen((v) => !v);
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-tatan-primario3/70 to-tatan-primario4/80 text-zinc-900 shadow-md transition hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1] shrink-0"
              aria-label={
                cartOpen
                  ? "Cerrar carrito"
                  : `Abrir carrito (${cart.count} ${cart.count === 1 ? "producto" : "productos"})`
              }
              aria-expanded={cartOpen}
              aria-controls={cartPanelId}
            >
              <IconCart className="h-6 w-6 text-white" />
              <span
                key={bump}
                className={cx(
                  "absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold border shadow-sm",
                  cart.count > 0
                    ? "bg-tatan-acento-rosa text-zinc-800 border-white"
                    : "bg-white text-tatan-primario4 border-tatan-secundario1/50",
                  bump > 0 && "cart-bump",
                )}
              >
                {cart.count}
              </span>
            </button>
          </div>
        </div>

        <div
          id={mobilePanelId}
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
          className={cx(
            "lg:hidden fixed left-0 z-[60] h-dvh w-full",
            menuOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          style={{ top: headerTotalHeight }}
          aria-hidden={!menuOpen}
        >
          <div
            className={cx(
              "relative bg-[#FFFDF7] pointer-events-auto",
              "overflow-y-auto overscroll-contain",
              "flex flex-col",
              "transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              menuOpen ? "translate-x-0" : "-translate-x-full",
            )}
            style={{
              height: `calc(100dvh - ${headerTotalHeight}px)`,
            }}
          >
            <div className="px-5 py-4 border-b border-zinc-100">
              <div className="relative">
                <CustomInput
                  type="search"
                  placeholder="Buscar producto"
                  inputClassName="h-12 rounded-2xl border border-tatan-secundario1/60 bg-white text-base pl-10 pr-3"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tatan-primario4">
                  <IconSearch className="w-5 h-5" strokeWidth={2} />
                </span>
              </div>
            </div>

            <div className="flex-1 px-5 py-6">
              <nav className="flex flex-col" aria-label="Secciones">
                {navItems.map(({ label, href, Icon }, i) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={cx(
                      "flex items-center gap-4 py-4 font-bold text-zinc-800",
                      i < navItems.length - 1
                        ? "border-b border-zinc-100"
                        : "",
                      "hover:text-tatan-primario4 transition-colors",
                    )}
                  >
                    <span className="w-10 h-10 rounded-2xl bg-tatan-primario1/70 text-tatan-secundario2 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </span>
                    <span className="text-lg flex-1">{label}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-zinc-400"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                ))}
              </nav>

              <div
                className={cx(
                  "mt-8 grid gap-3",
                  hasOffers ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                {hasOffers && (
                <Link
                  href="/ofertas"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl p-4 bg-gradient-to-br from-tatan-acento-rosa/70 to-tatan-primario3/60 border border-white/70 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-8 h-8 rounded-xl bg-white/95 text-tatan-secundario2 flex items-center justify-center">
                      <Gift className="w-4 h-4" strokeWidth={2} />
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-zinc-800 leading-tight">
                    Ofertas
                  </p>
                  <p className="text-[11px] font-bold text-zinc-700 mt-0.5">
                    {offers && offers.maxPct > 0
                      ? `Hasta ${offers.maxPct}% OFF`
                      : "Precios especiales"}
                  </p>
                </Link>
                )}
                <Link
                  href="/productos"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl p-4 bg-gradient-to-br from-tatan-acento-verde/60 to-tatan-acento-azul/40 border border-white/70 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-8 h-8 rounded-xl bg-white/95 text-tatan-secundario2 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-zinc-800 leading-tight">
                    Productos
                  </p>
                  <p className="text-[11px] font-bold text-zinc-700 mt-0.5">
                    Toda la colección
                  </p>
                </Link>
              </div>
            </div>

            <div className="px-5 pb-6 pt-4 border-t border-zinc-100 mt-auto">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setCartOpen(true);
                }}
                className="w-full btn-primary font-bold rounded-2xl py-3 text-sm inline-flex items-center justify-center gap-2 shadow-md"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4.5 h-4.5"
                >
                  <path d="M6 6h15l-1.5 9H7.5L6 6Z" />
                  <path d="M6 6 5 3H2" />
                  <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                </svg>
                Ir al carrito ({cart.count})
              </button>
              <p className="text-[11px] font-semibold text-zinc-400 text-center mt-4">
                © Tatan · Ropa para los más chicos
              </p>
            </div>
          </div>
        </div>

        <div
          id={cartPanelId}
          role="dialog"
          aria-modal="true"
          aria-label="Carrito"
          aria-hidden={!cartOpen}
        >
          {/* Fondo: tocar afuera del carrito lo cierra. Con tamaño explícito
              (h-dvh w-screen): el header tiene backdrop-blur y eso hace que un
              "fixed inset-0" adentro mida solo lo que mide el header. */}
          <div
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
            className={cx(
              "fixed left-0 top-0 z-[65] h-dvh w-screen bg-zinc-900/25 backdrop-blur-[2px] transition-opacity duration-300",
              cartOpen ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          />
          <div
            className={cx(
              "fixed right-0 z-[70] w-full bg-[#FFFDF7] shadow-2xl border-l border-tatan-secundario1/40",
              "lg:max-w-md lg:rounded-tl-none lg:rounded-bl-none lg:rounded-l-xl",
              "overflow-y-auto overscroll-contain",
              "flex flex-col",
              "transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              cartOpen
                ? "translate-x-0 pointer-events-auto"
                : "translate-x-full pointer-events-none",
            )}
            style={{
              top: bannerHeight,
              height: `calc(100dvh - ${bannerHeight}px)`,
            }}
          >
            <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-tatan-primario3/70 to-tatan-primario4/80 text-white flex items-center justify-center shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <path d="M6 6h15l-1.5 9H7.5L6 6Z" />
                    <path d="M6 6 5 3H2" />
                    <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                    <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <p className="text-base font-extrabold text-zinc-800">
                    Tu carrito
                  </p>
                  <p className="text-xs font-semibold text-zinc-500">
                    {cart.count} {cart.count === 1 ? "producto" : "productos"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar carrito"
                onClick={() => setCartOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-tatan-secundario1/50 bg-white text-zinc-800 shadow-sm transition hover:bg-tatan-primario1/60 active:scale-[0.98]"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            {cart.items.length === 0 ? (
              <div className="flex-1 px-5 py-6 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-tatan-primario1/70 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-9 h-9 text-tatan-primario4"
                  >
                    <path d="M6 6h15l-1.5 9H7.5L6 6Z" />
                    <path d="M6 6 5 3H2" />
                    <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                    <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  </svg>
                </div>
                <div className="max-w-xs">
                  <p className="text-lg font-extrabold text-zinc-800 leading-tight">
                    Todavía no agregaste nada
                  </p>
                  <p className="text-sm font-semibold text-zinc-500 mt-2 leading-relaxed">
                    Explorá la colección y sumá las prendas que te gusten al
                    carrito.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border border-tatan-secundario1/50 px-5 py-2.5 text-sm font-bold text-zinc-800 shadow-sm transition hover:bg-tatan-primario1/60"
                >
                  Seguir comprando
                </button>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-zinc-100 px-5">
                {cart.items.map((item) => (
                  <li key={item.key} className="flex gap-3 py-4">
                    <Link
                      href={productHref({ id: item.productId, name: item.name })}
                      onClick={() => setCartOpen(false)}
                      className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-tatan-secundario1/50"
                      style={{ backgroundColor: item.colorHex ?? "#fff" }}
                    >
                      <ProductPhoto
                        compact
                        src={item.imageSrc}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-contain p-1 mix-blend-multiply"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-zinc-800 leading-snug line-clamp-2">
                          {item.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.key)}
                          aria-label={`Quitar ${item.name}`}
                          className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
                        <span>Talle {item.size}</span>
                        {item.colorName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-zinc-300"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span>{item.colorName}</span>
                          </>
                        )}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-xl border border-tatan-secundario1/60 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.key, item.quantity - 1)
                            }
                            aria-label="Restar uno"
                            className="inline-flex h-8 w-8 items-center justify-center text-zinc-600 hover:text-zinc-900"
                          >
                            <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                          <span className="min-w-6 text-center text-sm font-bold tabular-nums text-zinc-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.key, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Sumar uno"
                            className="inline-flex h-8 w-8 items-center justify-center text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300"
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                        <p className="text-sm font-extrabold tabular-nums text-zinc-800">
                          {formatArs(
                            effectiveUnitPrice(item, cart.items, wholesaleMode)
                              .price * item.quantity,
                          )}
                        </p>
                      </div>
                      <WholesaleLine
                        item={item}
                        items={cart.items}
                        mode={wholesaleMode}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="px-5 pb-6 pt-4 border-t border-zinc-100 mt-auto space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-zinc-600">Subtotal</p>
                  <p className="text-sm font-extrabold tabular-nums text-zinc-800">
                    {formatArs(totals.subtotal + totals.saved)}
                  </p>
                </div>
                {totals.saved > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-emerald-700">
                      Ahorro por mayor
                    </p>
                    <p className="text-sm font-extrabold tabular-nums text-emerald-700">
                      -{formatArs(totals.saved)}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-zinc-600">Envío</p>
                  <p className="text-sm font-bold text-zinc-500">
                    Se calcula al finalizar
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  <p className="text-base font-extrabold text-zinc-800">
                    Total
                  </p>
                  <p className="text-xl font-black tabular-nums text-zinc-800">
                    {formatArs(totals.subtotal)}
                  </p>
                </div>
              </div>
              {cart.count > 0 ? (
                <Link
                  href="/cart"
                  onClick={() => setCartOpen(false)}
                  className="w-full btn-primary font-bold rounded-2xl py-3 text-sm inline-flex items-center justify-center gap-2 shadow-md"
                >
                  Finalizar compra
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full btn-primary font-bold rounded-2xl py-3 text-sm inline-flex items-center justify-center gap-2 shadow-md opacity-60 cursor-not-allowed"
                >
                  Finalizar compra
                </button>
              )}
              <Link
                href="/cart"
                onClick={() => setCartOpen(false)}
                className="w-full rounded-2xl border border-tatan-secundario1/50 bg-white text-zinc-800 font-bold py-3 text-sm text-center inline-flex items-center justify-center gap-2 hover:bg-tatan-primario1/60 transition"
              >
                Ir a la página del carrito
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Aviso al agregar al carrito */}
      <div
        className="fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 pointer-events-none"
        aria-live="polite"
      >
        {toast && (
          <div
            key={toast.id}
            className="cart-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-tatan-secundario1/60 bg-white/95 px-4 py-3 shadow-xl backdrop-blur"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tatan-acento-verde text-white">
              <Check className="w-5 h-5" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-zinc-800">
                Agregado al carrito
              </p>
              <p className="truncate text-xs font-semibold text-zinc-500">
                {toast.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setToast(null);
                setMenuOpen(false);
                setCartOpen(true);
              }}
              className="shrink-0 rounded-xl bg-tatan-primario1/70 px-3 py-2 text-xs font-extrabold text-zinc-800 hover:bg-tatan-primario4 transition"
            >
              Ver carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
