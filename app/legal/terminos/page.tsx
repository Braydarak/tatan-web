import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Términos y condiciones de compra en Tatan Kids: titular, precios, pagos, envíos, cambios, garantía y defensa del consumidor.",
  alternates: { canonical: "/legal/terminos" },
};

export default function TerminosPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      intro="Las condiciones para comprar en tatankids.com.ar. Al hacer un pedido aceptás estos términos."
      path="/legal/terminos"
    >
      <h2>1. Quiénes somos (aviso legal)</h2>
      <p>
        <strong>{LEGAL.brand}</strong> es una tienda online de ropa para bebés
        {LEGAL.owner ? <>, de {LEGAL.owner}</> : null}
        {LEGAL.cuit ? <> · CUIT {LEGAL.cuit}</> : null}. Domicilio: {LEGAL.address}. Contacto:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
      {LEGAL.trademarkNumber ? (
        <p>
          {LEGAL.brand} es una marca registrada en el Instituto Nacional de la Propiedad Industrial (INPI) bajo el N.º {LEGAL.trademarkNumber}.
        </p>
      ) : null}

      <h2>2. Productos, precios y stock</h2>
      <ul>
        <li>Los precios están expresados en <strong>pesos argentinos</strong> e incluyen IVA. Junto a cada precio informamos el <strong>precio sin impuestos nacionales</strong> (Régimen de Transparencia Fiscal al Consumidor, Ley 27.743).</li>
        <li>El precio que vale es el que figura al momento de confirmar la compra.</li>
        <li>Las fotos son ilustrativas: los colores pueden variar levemente según la pantalla.</li>
        <li>Las compras están sujetas a disponibilidad de stock. Si después de pagar un producto no estuviera disponible, te avisamos y te ofrecemos un cambio o la devolución total del dinero.</li>
        <li>El <strong>precio por mayor</strong>, cuando está disponible, se aplica automáticamente en el carrito al llegar a la cantidad mínima indicada en cada producto.</li>
      </ul>

      <h2>3. Compra y pago</h2>
      <ul>
        <li>Los pagos se procesan con <strong>Mercado Pago</strong>: tarjeta de crédito en cuotas, débito o efectivo (Rapipago y Pago Fácil). Los datos de tu tarjeta los procesa Mercado Pago; {LEGAL.brand} no los ve ni los guarda.</li>
        <li>La compra se confirma cuando el pago se acredita. Te llega un mail con el número de pedido y el detalle.</li>
        <li>Si un pago es rechazado no se te cobra nada y podés intentar con otro medio.</li>
      </ul>

      <h2>4. Envíos</h2>
      <p>
        Enviamos a todo el país, a domicilio o a sucursal del correo. El costo y el plazo dependen del código postal y de la opción que elijas, y los ves antes de pagar. Más información en{" "}
        <Link href="/envios">Envíos y pagos</Link>.
      </p>

      <h2>5. Cambios, devoluciones y arrepentimiento</h2>
      <p>
        Podés arrepentirte de tu compra dentro de los <strong>{LEGAL.withdrawalDays} días corridos</strong> desde que la recibís, sin dar motivos (art. 34 de la Ley 24.240 y art. 1110 del Código Civil y Comercial), usando el{" "}
        <Link href="/arrepentimiento">Botón de arrepentimiento</Link>. Las condiciones de cambios y devoluciones están en{" "}
        <Link href="/legal/cambios">Cambios y devoluciones</Link>.
      </p>

      <h2>6. Garantía</h2>
      <p>
        Todos los productos tienen la <strong>garantía legal de 6 meses</strong> por defectos de fabricación (art. 11 de la Ley 24.240). Si un producto llega con una falla, escribinos a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> y lo resolvemos sin costo para vos.
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        La marca {LEGAL.brand}, el logo, las fotos, los textos y el diseño de este sitio pertenecen a su titular. No se pueden copiar ni usar sin autorización.
      </p>

      <h2>8. Datos personales</h2>
      <p>
        Usamos tus datos solo para gestionar tu compra. Ver la <Link href="/legal/privacidad">Política de privacidad</Link> y la{" "}
        <Link href="/legal/cookies">Política de cookies</Link>.
      </p>

      <h2>9. Defensa del consumidor y ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina, en especial la Ley 24.240 de Defensa del Consumidor. Si tenés un reclamo, primero escribinos: queremos resolverlo. También podés recurrir a la{" "}
        <a href={LEGAL.consumerClaimsUrl} target="_blank" rel="noopener noreferrer">
          Ventanilla Federal Única de Reclamos de Defensa del Consumidor
        </a>
        .
      </p>
    </LegalPage>
  );
}
