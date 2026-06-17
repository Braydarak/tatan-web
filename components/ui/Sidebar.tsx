"use client";

import Link from "next/link";
import * as React from "react";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

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

export type SidebarItem = {
  label: string;
  href: string;
};

export type SidebarProps = {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: (href: string) => void;
  title?: string;
  items?: SidebarItem[];
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

const DEFAULT_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/crm" },
  { label: "Ventas", href: "/crm#ventas" },
  { label: "Productos", href: "/crm#productos" },
  { label: "Clientes", href: "/crm#clientes" },
  { label: "Inventario", href: "/crm#inventario" },
  { label: "Ajustes", href: "/crm#ajustes" },
];

export default function Sidebar({
  defaultOpen = true,
  open,
  onOpenChange,
  onNavigate,
  title = "TATAN CRM",
  items = DEFAULT_ITEMS,
  footer,
  children,
  className,
}: SidebarProps) {
  const isControlled = open !== undefined;
  const [desktopOpen, setDesktopOpen] = React.useState(defaultOpen);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const desktopIsOpen = isControlled ? open : desktopOpen;
  const mobileIsOpen = isControlled ? open : mobileOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setDesktopOpen(next);
        setMobileOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  React.useEffect(() => {
    const body = document.body;
    if (!mobileIsOpen) return;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [mobileIsOpen]);

  return (
    <div className={cx("flex min-h-dvh", className)}>
      <aside
        className={cx(
          "hidden shrink-0 overflow-hidden bg-[#FEFDF8] lg:block",
          "transition-[width] duration-300 ease-out",
          desktopIsOpen ? "w-80 border-r border-black/10 shadow-sm" : "w-0",
        )}
        aria-hidden={!desktopIsOpen}
      >
        <div
          className={cx(
            "flex h-dvh flex-col",
            !desktopIsOpen && "pointer-events-none opacity-0",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-4">
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              {title}
            </span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1"
              aria-label="Cerrar sidebar"
              onClick={() => {
                if (!isControlled) setDesktopOpen(false);
                onOpenChange?.(false);
              }}
            >
              <IconClose className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="CRM">
            <div className="grid gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-tatan-primario1/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1"
                  onClick={() => onNavigate?.(item.href)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {footer ? (
            <div className="border-t border-black/5 px-4 py-4">{footer}</div>
          ) : null}
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        {!desktopIsOpen ? (
          <button
            type="button"
            className="absolute left-4 top-4 z-10 hidden h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1 lg:inline-flex"
            aria-label="Abrir sidebar"
            onClick={() => {
              if (!isControlled) setDesktopOpen(true);
              onOpenChange?.(true);
            }}
          >
            <IconMenu className="h-5 w-5" />
          </button>
        ) : null}

        {!mobileIsOpen ? (
          <button
            type="button"
            className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1 lg:hidden"
            aria-label="Abrir sidebar"
            onClick={() => {
              if (!isControlled) setMobileOpen(true);
              onOpenChange?.(true);
            }}
          >
            <IconMenu className="h-5 w-5" />
          </button>
        ) : null}

        <aside
          className={cx(
            "fixed inset-0 z-50 bg-[#FEFDF8] lg:hidden",
            "transition-transform duration-300 ease-out",
            mobileIsOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-hidden={!mobileIsOpen}
        >
          <div className="flex h-dvh flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-4">
              <span className="text-sm font-semibold tracking-tight text-zinc-900">
                {title}
              </span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1"
                aria-label="Cerrar sidebar"
                onClick={() => {
                  if (!isControlled) setMobileOpen(false);
                  onOpenChange?.(false);
                }}
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="CRM">
              <div className="grid gap-1">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-tatan-primario1/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tatan-primario1"
                    onClick={() => {
                      onNavigate?.(item.href);
                      if (!isControlled) setMobileOpen(false);
                      onOpenChange?.(false);
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {footer ? (
              <div className="border-t border-black/5 px-4 py-4">{footer}</div>
            ) : null}
          </div>
        </aside>

        {children}
      </div>
    </div>
  );
}
