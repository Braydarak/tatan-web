"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import CustomButton from "@/components/ui/CustomButton";

export type SuccessModalProps = {
  /** Mensaje a mostrar; `null` cierra el modal. */
  message: string | null;
  title?: string;
  onClose: () => void;
};

/** Modal de confirmación que se muestra después de guardar algo en el CRM. */
export default function SuccessModal({
  message,
  title = "¡Guardado correctamente!",
  onClose,
}: SuccessModalProps) {
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (message === null) return;
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, onClose]);

  if (message === null) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
        className="w-full max-w-sm rounded-2xl border border-black/5 bg-[#FEFDF8] p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2
          id="success-modal-title"
          className="text-lg font-bold tracking-tight text-zinc-900"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        <CustomButton ref={buttonRef} className="mt-6 w-full" onClick={onClose}>
          Aceptar
        </CustomButton>
      </div>
    </div>
  );
}
