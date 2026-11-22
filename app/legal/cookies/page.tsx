import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import CookieSettingsButton from "@/components/legal/CookieSettingsButton";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies y datos guarda Tatan Kids en tu navegador y cómo elegir cuáles aceptar.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de cookies"
      intro="Qué guarda la tienda en tu navegador, para qué, y cómo elegir qué aceptás."
      path="/legal/cookies"
    >
      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Son pequeños archivos o datos que un sitio guarda en tu navegador para funcionar o recordar cosas, como los productos de tu carrito. Además de cookies, usamos el almacenamiento local del navegador, que funciona de forma parecida.
      </p>

      <h2>2. Qué usamos</h2>
      <h3>Necesarias (siempre activas)</h3>
      <p>Sin estas la tienda no funciona. No sirven para identificarte ni para publicidad.</p>
      <table>
        <thead>
          <tr><th>Qué</th><th>Para qué</th><th>Duración</th></tr>
        </thead>
        <tbody>
          <tr><td>Carrito</td><td>Recordar los productos que agregaste</td><td>Hasta que lo vacíes o compres</td></tr>
          <tr><td>Datos del checkout</td><td>No perder lo que escribiste si recargás la página durante la compra</td><td>Mientras esté abierta la pestaña</td></tr>
          <tr><td>Preferencias de cookies</td><td>Recordar lo que elegiste en el aviso de cookies</td><td>12 meses</td></tr>
          <tr><td>Mercado Pago</td><td>Seguridad y prevención de fraude al pagar (solo en el paso de pago)</td><td>Según Mercado Pago</td></tr>
          <tr><td>Sesión del panel</td><td>Mantener la sesión del personal de {LEGAL.brand} en el panel de administración (no se usa en la tienda)</td><td>Hasta cerrar sesión</td></tr>
        </tbody>
      </table>

      <h3>Estadísticas y marketing (opcionales)</h3>
      <p>
        Hoy <strong>no usamos</strong> herramientas de estadísticas ni de publicidad. Si en el futuro las sumamos (por ejemplo, para saber qué productos se miran más), solo se activan si las aceptás en el aviso de cookies.
      </p>

      <h2>3. Cómo elegir o cambiar tu preferencia</h2>
      <p>Cuando entrás por primera vez te preguntamos. Podés cambiar tu elección cuando quieras:</p>
      <p><CookieSettingsButton /></p>
      <p>
        También podés borrar las cookies y los datos guardados desde la configuración de tu navegador. Si lo hacés, se vacía el carrito y te volvemos a preguntar.
      </p>
    </LegalPage>
  );
}
