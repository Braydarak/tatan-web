import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description: `Cambios de talle o color, devoluciones, arrepentimiento dentro de los ${LEGAL.withdrawalDays} días y garantía en Tatan Kids.`,
  alternates: { canonical: "/legal/cambios" },
};

export default function CambiosPage() {
  const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
  return (
    <LegalPage
      title="Cambios y devoluciones"
      intro={`Todos los cambios y devoluciones se gestionan por mail a ${LEGAL.email}.`}
      path="/legal/cambios"
    >
      <h2>1. Arrepentimiento: {LEGAL.withdrawalDays} días para devolver tu compra</h2>
      <p>
        Como compraste a distancia, tenés derecho a <strong>arrepentirte dentro de los {LEGAL.withdrawalDays} días corridos</strong> desde que recibís el pedido (art. 34 de la Ley 24.240 y art. 1110 del Código Civil y Comercial). Es un derecho irrenunciable: nos indicás el motivo, y si simplemente cambiaste de opinión también es válido.
      </p>
      <ul>
        <li>Pedilo desde el <Link href="/arrepentimiento">Botón de arrepentimiento</Link> o escribiendo a {mail}. No hace falta tener una cuenta.</li>
        <li>Te enviamos un <strong>código de identificación</strong> de tu solicitud dentro de las 24 horas, por el mismo medio.</li>
        <li>El producto se devuelve en las mismas condiciones en que lo recibiste. <strong>Los gastos de la devolución están a nuestro cargo</strong>: te indicamos cómo despacharlo.</li>
        <li>Te devolvemos el <strong>total pagado</strong>, por el mismo medio de pago (Mercado Pago). El tiempo en que lo ves depende de tu banco o tarjeta.</li>
      </ul>

      <h2>2. Cambios de talle o color</h2>
      <p>Si el talle no le quedó o preferís otro color, lo cambiamos.</p>
      <ul>
        <li>Pedilo dentro de los <strong>{LEGAL.exchangeDays} días corridos</strong> desde que recibiste el pedido, escribiendo a {mail} con tu número de pedido (empieza con TTN) y qué querés cambiar.</li>
        <li>La prenda tiene que estar <strong>sin uso, sin lavar y con sus etiquetas</strong>.</li>
        <li>El cambio está sujeto al stock disponible. Si no hay lo que buscás, podés elegir otro producto o pedir la devolución del dinero.</li>
        <li>
          <strong>El envío de la prenda hacia nosotros corre por tu cuenta</strong>, y
          <strong> el envío del cambio hacia vos lo pagamos nosotros</strong>. Te respondemos por mail con los pasos para enviarla.
        </li>
      </ul>

      <h2>3. Productos con falla</h2>
      <p>
        Si un producto llega con un defecto de fabricación o una falla, escribinos a {mail} con una foto. Lo cambiamos o te devolvemos el dinero, <strong>sin costo para vos</strong>. Todos los productos tienen la garantía legal de 6 meses (art. 11 de la Ley 24.240).
      </p>

      <h2>4. Pedido equivocado o incompleto</h2>
      <p>Si recibiste algo distinto de lo que compraste, avisanos a {mail} y lo resolvemos sin costo.</p>

      <h2>5. ¿Algo no salió bien?</h2>
      <p>
        Escribinos primero: queremos resolverlo. Si no quedás conforme, podés recurrir a la{" "}
        <a href={LEGAL.consumerClaimsUrl} target="_blank" rel="noopener noreferrer">Ventanilla Federal Única de Reclamos de Defensa del Consumidor</a>.
      </p>
    </LegalPage>
  );
}
