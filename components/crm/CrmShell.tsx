"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  Boxes,
  ExternalLink,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Truck,
  X,
} from "lucide-react";
import type { AdminUser } from "@/lib/tatan-api";

export type CrmNavItem = {
  id: string;
  label: string;
  href: string;
  Icon: React.ElementType;
};

const NAV_GROUPS: Array<{ title: string; items: CrmNavItem[] }> = [
  {
    title: "Operaciones",
    items: [
      { id: "home", label: "Dashboard", href: "/crm", Icon: LayoutDashboard },
      { id: "ventas", label: "Ventas", href: "/crm#ventas", Icon: Receipt },
      {
        id: "productos",
        label: "Productos",
        href: "/crm#productos",
        Icon: Package,
      },
      {
        id: "inventario",
        label: "Inventario",
        href: "/crm#inventario",
        Icon: Boxes,
      },
    ],
  },
  {
    title: "Contenido del sitio",
    items: [
      { id: "hero", label: "Home", href: "/crm#hero", Icon: Home },
      { id: "envios", label: "Envíos", href: "/crm#envios", Icon: Truck },
    ],
  },
];

export type CrmShellProps = {
  active: string;
  title: string;
  subtitle?: string;
  admin?: AdminUser | null;
  onNavigate: (href: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-tatan-primario1/40">
        <Image
          src="/tatanLogo.png"
          alt="Tatan"
          width={30}
          height={30}
          className="object-contain"
        />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight text-zinc-900">TATAN</p>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-tatan-secundario2">
          CRM
        </p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
  onAfterNavigate,
}: {
  item: CrmNavItem;
  active: boolean;
  onNavigate: (href: string) => void;
  onAfterNavigate?: () => void;
}) {
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      onClick={() => {
        onNavigate(item.href);
        onAfterNavigate?.();
      }}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
        active
          ? "bg-tatan-primario1/45 text-zinc-900 shadow-sm"
          : "text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-900",
      )}
    >
      <Icon
        className={cx(
          "h-4 w-4 shrink-0",
          active ? "text-tatan-secundario2" : "text-zinc-400 group-hover:text-zinc-600",
        )}
        strokeWidth={2}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroups({
  active,
  onNavigate,
  onAfterNavigate,
}: {
  active: string;
  onNavigate: (href: string) => void;
  onAfterNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="CRM">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-5 last:mb-0">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            {group.title}
          </p>
          <div className="grid gap-1">
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={active === item.id}
                onNavigate={onNavigate}
                onAfterNavigate={onAfterNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UserFooter({
  admin,
  onLogout,
}: {
  admin?: AdminUser | null;
  onLogout: () => void;
}) {
  const name = admin?.name || admin?.username || "Sesión activa";
  const role = admin?.role ?? "";

  return (
    <div className="border-t border-black/5 p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tatan-acento-verde/50 text-xs font-extrabold uppercase text-zinc-800">
          {name.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
          {role ? (
            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {role}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        Cerrar sesión
      </button>
    </div>
  );
}

export default function CrmShell({
  active,
  title,
  subtitle,
  admin,
  onNavigate,
  onLogout,
  children,
}: CrmShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative z-10 min-h-dvh w-full flex-1 bg-[#F7F6F3]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-black/5 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-black/5 px-4">
          <Brand />
        </div>
        <NavGroups active={active} onNavigate={onNavigate} />
        <UserFooter admin={admin} onLogout={onLogout} />
      </aside>

      {/* Drawer mobile */}
      <div
        className={cx(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cx(
            "absolute inset-0 bg-zinc-900/40 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cx(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-black/5 px-4">
            <Brand />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <NavGroups
            active={active}
            onNavigate={onNavigate}
            onAfterNavigate={() => setMobileOpen(false)}
          />
          <UserFooter
            admin={admin}
            onLogout={() => {
              setMobileOpen(false);
              onLogout();
            }}
          />
        </aside>
      </div>

      {/* Contenido */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1 lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold tracking-tight text-zinc-900">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-xs text-zinc-500">{subtitle}</p>
              ) : null}
            </div>

            <Link
              href="/"
              className="hidden items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1 sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
              Ver sitio
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
