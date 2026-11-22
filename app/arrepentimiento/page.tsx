import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import ArrepentimientoForm from "@/components/legal/ArrepentimientoForm";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Botón de arrepentimiento",
  description: `Arrepentite de tu compra dentro de los ${LEGAL.withdrawalDays} días corridos desde que la recibiste (Ley 24.240, art. 34). Sin registrarte.`,
  alternates: { canonical: "/arrepentimiento" },
};

export default function ArrepentimientoPage() {
  return (
    <LegalPage
      title="Botón de arrepentimiento"
      intro={`Tenés ${LEGAL.withdrawalDays} días corridos desde que recibiste tu compra para arrepentirte, sin dar explicaciones (art. 34 de la Ley 24.240 y art. 1110 del Código Civil y Comercial).`}
      path="/arrepentimiento"
    >
      <ArrepentimientoForm />
      <h2 style={{ marginTop: "2rem" }}>Cómo funciona</h2>
      <ol>
        <li>Completá el formulario. No hace falta tener una cuenta.</li>
        <li>Te damos al instante un <strong>código de identificación</strong> de tu trámite (y te lo mandamos por mail).</li>
        <li>Te escribimos para coordinar la devolución. <strong>Los gastos de envío de la devolución están a nuestro cargo.</strong></li>
        <li>Cuando recibimos el producto, te reintegramos el <strong>total pagado</strong> por el mismo medio de pago.</li>
      </ol>
      <p>
        También podés pedirlo escribiendo a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Si lo que necesitás es cambiar un talle o un color, mirá{" "}
        <Link href="/legal/cambios">Cambios y devoluciones</Link>.
      </p>
    </LegalPage>
  );
}
