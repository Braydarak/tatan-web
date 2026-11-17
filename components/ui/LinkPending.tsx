"use client";

import { useLinkStatus } from "next/link";

/**
 * Marca invisible que aparece mientras carga el link que la contiene (o
 * cuando `pending` es true). El CSS la usa con :has() para atenuar la grilla
 * de productos y hacer latir el filtro tocado, sin mover nada de lugar.
 * Debe ir dentro de un <Link> (salvo que se pase `pending`).
 */
export function PendingMark({ pending }: { pending: boolean }) {
  return pending ? <span data-link-pending aria-hidden="true" hidden /> : null;
}

export default function LinkPending() {
  const { pending } = useLinkStatus();
  return <PendingMark pending={pending} />;
}
