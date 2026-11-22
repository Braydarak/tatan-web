import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Tatan Kids cuida tus datos personales según la Ley 25.326: qué datos usamos, para qué, con quién los compartimos y cómo ejercer tus derechos.",
  alternates: { canonical: "/legal/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro="Cómo usamos y cuidamos tus datos personales, según la Ley 25.326 de Protección de los Datos Personales."
      path="/legal/privacidad"
    >
      <h2>1. Responsable</h2>
      <p>
        El responsable de tus datos es <strong>{LEGAL.brand}</strong>, con domicilio en {LEGAL.address}. Contacto:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>2. Qué datos usamos</h2>
      <ul>
        <li><strong>Cuando comprás:</strong> nombre y apellido, mail, teléfono, DNI (lo piden los correos para entregar), dirección de entrega o sucursal elegida, los productos que compraste y el estado del pago.</li>
        <li><strong>Cuando nos escribís</strong> (formulario de contacto o botón de arrepentimiento): nombre, mail, teléfono si lo dejás y tu mensaje.</li>
        <li><strong>Datos de pago:</strong> los datos de tu tarjeta los procesa Mercado Pago. Nosotros no los vemos ni los guardamos; solo recibimos el resultado del pago y el medio usado.</li>
        <li><strong>Navegación:</strong> el carrito y los datos del checkout se guardan en tu propio dispositivo. Ver la <Link href="/legal/cookies">Política de cookies</Link>.</li>
      </ul>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Procesar tu compra, cobrarla y enviarla.</li>
        <li>Avisarte el estado de tu pedido y responder tus consultas, cambios y reclamos.</li>
        <li>Cumplir obligaciones legales y fiscales.</li>
      </ul>
      <p>No te mandamos publicidad sin tu consentimiento y <strong>no vendemos ni alquilamos tus datos</strong>.</p>

      <h2>4. Con quién los compartimos</h2>
      <p>Solo con quienes necesitamos para completar tu compra, y solo los datos necesarios:</p>
      <ul>
        <li><strong>Mercado Pago</strong>, para procesar el pago.</li>
        <li><strong>Enviopack y la empresa de correo</strong> que elijas, para entregar el pedido (nombre, dirección, teléfono y DNI).</li>
        <li><strong>Nuestro proveedor de hosting</strong>, que aloja la tienda y la base de datos en Argentina.</li>
        <li>Autoridades, cuando una ley o una orden judicial lo exija.</li>
      </ul>

      <h2>5. Cuánto tiempo los guardamos</h2>
      <p>
        Mientras sean necesarios para tu compra, sus cambios y la garantía, y durante los plazos que exigen las normas fiscales y de defensa del consumidor. Después los eliminamos o los anonimizamos.
      </p>

      <h2>6. Tus derechos</h2>
      <p>Podés en cualquier momento:</p>
      <ul>
        <li><strong>Acceder</strong> a tus datos, en forma gratuita y a intervalos no menores a seis meses, salvo que acredites un interés legítimo (art. 14 de la Ley 25.326). Te respondemos dentro de los 10 días corridos.</li>
        <li><strong>Rectificarlos, actualizarlos o pedir que los borremos</strong> (art. 16). Lo hacemos dentro de los 5 días hábiles.</li>
        <li><strong>Retirar tu consentimiento</strong> para usos que no sean necesarios para tu compra.</li>
      </ul>
      <p>
        Para ejercerlos escribinos a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> desde el mail con el que compraste o indicando tu nombre y DNI.
      </p>
      <p className="nota">
        La <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, en su carácter de órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos de quienes resulten afectados en sus derechos por incumplimiento de las normas de protección de datos personales.{" "}
        <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">argentina.gob.ar/aaip</a>
      </p>

      <h2>7. Seguridad</h2>
      <p>
        La tienda funciona con conexión segura (HTTPS), los pagos los procesa Mercado Pago y el acceso a los datos de los pedidos está restringido al personal de {LEGAL.brand} con usuario y contraseña.
      </p>

      <h2>8. Menores de edad</h2>
      <p>La tienda está pensada para que compren personas mayores de edad. No recolectamos a sabiendas datos de menores.</p>

      <h2>9. Cambios en esta política</h2>
      <p>Si la modificamos, publicamos la versión nueva en esta página con su fecha de actualización.</p>
    </LegalPage>
  );
}
