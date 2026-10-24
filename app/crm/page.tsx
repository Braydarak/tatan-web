"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import CrmShell from "@/components/crm/CrmShell";
import Dashboard from "@/components/crm/Dashboard";
import Ventas from "@/components/crm/Ventas";
import Inventario from "@/components/crm/Inventario";
import ProductsCrm from "@/components/sections/ProductsCrm";
import HomeHeroEditor from "@/components/sections/HomeHeroEditor";
import EnviosEditor from "@/components/sections/EnviosEditor";
import { apiLogout, apiSession, type AdminUser } from "@/lib/tatan-api";

type CrmView =
  | "home"
  | "ventas"
  | "productos"
  | "inventario"
  | "hero"
  | "envios";

const VIEW_META: Record<CrmView, { title: string; subtitle: string }> = {
  home: {
    title: "Dashboard",
    subtitle: "Resumen de ventas, stock y alertas",
  },
  ventas: {
    title: "Ventas",
    subtitle: "Productos más vendidos e ingresos estimados",
  },
  productos: {
    title: "Productos",
    subtitle: "Catálogo completo de la tienda",
  },
  inventario: {
    title: "Inventario",
    subtitle: "Stock por talle y ajustes rápidos",
  },
  hero: {
    title: "Contenido · Home",
    subtitle: "Portada editable del sitio",
  },
  envios: {
    title: "Contenido · Envíos",
    subtitle: "Página de envíos editable",
  },
};

function isView(value: string): value is CrmView {
  return Object.prototype.hasOwnProperty.call(VIEW_META, value);
}

function viewFromHash(): CrmView {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace(/^#/, "");
  return isView(hash) && hash !== "home" ? hash : "home";
}

function viewFromHref(href: string): CrmView {
  const hash = href.split("#")[1] ?? "";
  return isView(hash) && hash !== "home" ? hash : "home";
}

function FullScreenSpinner() {
  return (
    <div className="relative z-10 flex min-h-dvh w-full flex-1 items-center justify-center bg-[#F7F6F3]">
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando"
        className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-tatan-primario1"
      />
    </div>
  );
}

export default function CrmPage() {
  const router = useRouter();
  const [view, setView] = React.useState<CrmView>(() => viewFromHash());
  const [admin, setAdmin] = React.useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = React.useState(true);

  // Guard: la sesión vive en la cookie PHP, así que hasta confirmarla no se
  // renderiza el CRM. Sin sesión válida → /login.
  React.useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const session = await apiSession();
        if (!alive) return;
        if (session.authenticated) {
          setAdmin(session.admin);
          setCheckingSession(false);
          return;
        }
      } catch {
        // API inaccesible: derivamos a /login igualmente.
      }
      if (alive) router.replace("/login");
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const go = React.useCallback((href: string) => {
    const next = viewFromHref(href);
    setView(next);
    const hash = next === "home" ? "" : `#${next}`;
    window.history.replaceState(null, "", `/crm${hash}`);
  }, []);

  React.useEffect(() => {
    function onHistoryChange() {
      setView(viewFromHash());
    }
    window.addEventListener("hashchange", onHistoryChange);
    window.addEventListener("popstate", onHistoryChange);
    return () => {
      window.removeEventListener("hashchange", onHistoryChange);
      window.removeEventListener("popstate", onHistoryChange);
    };
  }, []);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  const handleLogout = React.useCallback(async () => {
    await apiLogout();
    router.replace("/login");
  }, [router]);

  if (checkingSession) {
    return <FullScreenSpinner />;
  }

  const meta = VIEW_META[view];

  return (
    <CrmShell
      active={view}
      title={meta.title}
      subtitle={meta.subtitle}
      admin={admin}
      onNavigate={go}
      onLogout={handleLogout}
    >
      {view === "home" ? (
        <Dashboard onNavigate={go} />
      ) : view === "ventas" ? (
        <Ventas />
      ) : view === "inventario" ? (
        <Inventario />
      ) : view === "productos" ? (
        <ProductsCrm />
      ) : view === "hero" ? (
        <HomeHeroEditor />
      ) : (
        <EnviosEditor />
      )}
    </CrmShell>
  );
}
