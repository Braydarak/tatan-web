"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import MessageBanner from "@/components/ui/MessageBanner";
import CustomInput from "@/components/ui/CustomInput";
import MercadoPagoSvg from "@/assets/svg/mercadoPago";
import { Gift, LayoutGrid, Baby, Truck, Mail } from "lucide-react";

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
  { label: "Envíos", href: "/envios", Icon: Truck },
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

export default function Header() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const mobilePanelId = React.useId();
  const cartPanelId = React.useId();
  const openStateRef = React.useRef({ menuOpen: false, cartOpen: false });

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
  const [headerTotalHeight, setHeaderTotalHeight] = React.useState(0);
  const [bannerHeight, setBannerHeight] = React.useState(0);

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
        <div ref={bannerRef}>
          <MessageBanner
            from="alternate"
            intervalMs={3500}
            messages={[
              "Envíos a todo el país",
              <span
                key="mp"
                className="inline-flex items-center justify-center gap-2"
              >
                Pagos suministrados por Mercado Pago
                <MercadoPagoSvg
                  className="h-20 w-20"
                  color="black"
                  title={undefined}
                />
              </span>,
              "Retiro en punto de entrega (CABA/GBA)",
            ]}
          />
        </div>

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
              <Image
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
            {NAV_ITEMS.map(({ label, href, Icon }) => (
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
            <div className="relative hidden w-96 lg:block">
              <CustomInput
                type="search"
                placeholder="Buscar body, pijama, gorrito..."
                inputClassName={cx(
                  "h-11 rounded-2xl border border-tatan-secundario1/60 bg-white text-sm text-zinc-900 shadow-sm",
                  "pr-3 py-0",
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setCartOpen((v) => !v);
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-tatan-primario3/70 to-tatan-primario4/80 text-zinc-900 shadow-md transition hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1] shrink-0"
              aria-label={cartOpen ? "Cerrar carrito" : "Abrir carrito"}
              aria-expanded={cartOpen}
              aria-controls={cartPanelId}
            >
              <IconCart className="h-6 w-6 text-white" />
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-extrabold text-tatan-primario4 border border-tatan-secundario1/50 shadow-sm">
                0
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
                  placeholder="Buscar body, remera, pijama..."
                  inputClassName="h-12 rounded-2xl border border-tatan-secundario1/60 bg-white text-base pl-10 pr-3"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tatan-primario4">
                  <IconSearch className="w-5 h-5" strokeWidth={2} />
                </span>
              </div>
            </div>

            <div className="flex-1 px-5 py-6">
              <nav className="flex flex-col" aria-label="Secciones">
                {NAV_ITEMS.map(({ label, href, Icon }, i) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={cx(
                      "flex items-center gap-4 py-4 font-bold text-zinc-800",
                      i < NAV_ITEMS.length - 1
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

              <div className="mt-8 grid grid-cols-2 gap-3">
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
                    Hasta 40% OFF
                  </p>
                </Link>
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
                Ir al carrito (0)
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
                    0 productos
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

            <div className="px-5 pb-6 pt-4 border-t border-zinc-100 mt-auto space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-zinc-600">Subtotal</p>
                  <p className="text-sm font-extrabold text-zinc-800">$ 0</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-zinc-600">Envío</p>
                  <p className="text-sm font-extrabold text-tatan-acento-verde">
                    Gratis
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  <p className="text-base font-extrabold text-zinc-800">
                    Total
                  </p>
                  <p className="text-xl font-black text-tatan-primario4">$ 0</p>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="w-full btn-primary font-bold rounded-2xl py-3 text-sm inline-flex items-center justify-center gap-2 shadow-md opacity-60 cursor-not-allowed"
              >
                Finalizar compra
              </button>
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
    </>
  );
}
