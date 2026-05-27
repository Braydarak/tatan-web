"use client";

import CustomButton from "@/components/ui/CustomButton";
import ProductsCrm from "@/components/sections/ProductsCrm";
import Sidebar from "@/components/ui/Sidebar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";

type CrmView =
  | "home"
  | "ventas"
  | "productos"
  | "clientes"
  | "inventario"
  | "ajustes";

function viewFromLocation(): CrmView {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace(/^#/, "");
  if (hash === "productos") return "productos";
  if (hash === "ventas") return "ventas";
  if (hash === "clientes") return "clientes";
  if (hash === "inventario") return "inventario";
  if (hash === "ajustes") return "ajustes";
  return "home";
}

function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label="Cargando"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-[#FCD1B1]" />
    </div>
  );
}

export default function CrmPage() {
  const router = useRouter();
  const [view, setView] = React.useState<CrmView>(() => viewFromLocation());
  const [isLoading, setIsLoading] = React.useState(false);
  const viewRef = React.useRef(view);

  React.useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const loadTo = React.useCallback((nextView: CrmView) => {
    if (nextView === viewRef.current) return;
    setIsLoading(true);
    window.setTimeout(() => {
      setView(nextView);
      setIsLoading(false);
    }, 250);
  }, []);

  const onNavigate = React.useCallback(
    (href: string) => {
      const nextHash = href.split("#")[1] ?? "";
      const nextView =
        nextHash === "productos"
          ? "productos"
          : nextHash === "ventas"
            ? "ventas"
            : nextHash === "clientes"
              ? "clientes"
              : nextHash === "inventario"
                ? "inventario"
                : nextHash === "ajustes"
                  ? "ajustes"
                  : "home";
      loadTo(nextView);
    },
    [loadTo],
  );

  React.useEffect(() => {
    function onHistoryChange() {
      loadTo(viewFromLocation());
    }

    window.addEventListener("hashchange", onHistoryChange);
    window.addEventListener("popstate", onHistoryChange);
    return () => {
      window.removeEventListener("hashchange", onHistoryChange);
      window.removeEventListener("popstate", onHistoryChange);
    };
  }, [loadTo]);

  React.useEffect(() => {
    if (isLoading) return;
    requestAnimationFrame(() => {
      if (view === "home") return;
      document.getElementById(view)?.scrollIntoView({ block: "start" });
    });
  }, [isLoading, view]);

  return (
    <Sidebar onNavigate={onNavigate}>
      <div className="flex min-h-dvh w-full flex-col bg-linear-to-b from-[#FFF7F0] via-white to-[#F7FBFF] px-4 py-10 lg:px-8">
        <main className="mx-auto w-full max-w-7xl">
          {isLoading ? (
            <div className="flex min-h-[420px] w-full items-center justify-center">
              <Spinner />
            </div>
          ) : view === "home" ? (
            <div className="mx-auto mt-20 flex max-w-3xl flex-col items-center justify-center">
              <div className="flex flex-col items-center text-center">
                <Image
                  className="mx-auto"
                  src="/tatanLogo.png"
                  alt="Tatan"
                  width={200}
                  height={40}
                  priority
                />
                <span className="mt-5 inline-flex items-center rounded-full border border-[#FCD1B1] bg-[#FCD1B1]/20 px-3 py-1 text-xs font-semibold text-zinc-800">
                  CRM
                </span>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
                  Panel del CRM
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Seleccioná una sección desde el menú.
                </p>
              </div>

              <div className="mt-6 flex justify-center">
                <CustomButton type="outline" onClick={() => router.push("/")}>
                  Ir al sitio
                </CustomButton>
              </div>
            </div>
          ) : view === "productos" ? (
            <div className="w-full">
              <ProductsCrm />
            </div>
          ) : (
            <section
              id={view}
              className="mx-auto mt-2 w-full max-w-3xl scroll-mt-20 rounded-2xl border border-black/5 bg-[#FEFDF8]/80 p-5 shadow-sm backdrop-blur"
            >
              <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                {view[0]!.toUpperCase()}
                {view.slice(1)}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Sección en construcción.
              </p>
            </section>
          )}
        </main>
      </div>
    </Sidebar>
  );
}
