"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import MessageBanner from "@/components/ui/MessageBanner";
import CustomInput from "@/components/ui/CustomInput";
import MercadoPagoSvg from "@/assets/svg/mercadoPago";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Novedades", href: "/novedades" },
  { label: "Recién nacido", href: "/recien-nacido" },
  { label: "0-12 meses", href: "/0-12-meses" },
  { label: "1-3 años", href: "/1-3-anos" },
  { label: "Ofertas", href: "/ofertas" },
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
  const [searchOpen, setSearchOpen] = React.useState(false);
  const mobilePanelId = React.useId();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setSearchOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    const body = document.body;
    const shouldLock = menuOpen || searchOpen;
    if (!shouldLock) return;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [menuOpen, searchOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#FEFDF8]/80 backdrop-blur">
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

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] lg:hidden"
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
          className="inline-flex items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1]"
          onClick={() => {
            setMenuOpen(false);
            setSearchOpen(false);
          }}
          aria-label="Ir al inicio"
        >
          <Image
            className="mx-auto"
            src="/tatanLogo.png"
            alt="Tatan logo"
            width={80}
            height={40}
            priority
          />
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Secciones"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-[#FCD1B1]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden w-88 lg:block">
            <CustomInput
              type="search"
              placeholder="Buscar body, pijama, gorrito..."
              inputClassName={cx(
                "h-10 rounded-xl border border-[#FCD1B1] text-sm text-zinc-900 shadow-sm",
                "pr-3 py-0",
              )}
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] lg:hidden"
            aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? (
              <IconClose className="h-5 w-5" />
            ) : (
              <IconSearch className="h-5 w-5" />
            )}
          </button>

          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center text-zinc-900 transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1]"
            aria-label="Carrito"
          >
            <IconCart className="h-7 w-7" />
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FCD1B1] px-1.5 text-[11px] font-bold text-zinc-900">
              0
            </span>
          </Link>
        </div>
      </div>

      <div
        className={cx(
          "lg:hidden",
          (menuOpen || searchOpen) &&
            "fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]",
        )}
        aria-hidden={!(menuOpen || searchOpen)}
        onClick={() => {
          setMenuOpen(false);
          setSearchOpen(false);
        }}
      />

      <div
        id={mobilePanelId}
        className={cx(
          "lg:hidden",
          "overflow-hidden border-b border-black/5 bg-[#FEFDF8]",
          "transition-[max-height] duration-300 ease-out",
          menuOpen || searchOpen ? "max-h-520px" : "max-h-0",
        )}
      >
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-3 sm:px-6">
          {searchOpen ? (
            <div className="relative">
              <CustomInput
                type="search"
                placeholder="Buscar productos..."
                autoFocus
              />
            </div>
          ) : null}

          <nav className="mt-3 grid gap-1" aria-label="Secciones">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-[#FCD1B1]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1]"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
