import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Web estática (output: "export"): se genera una vez, al compilar
export const dynamic = "force-static";

/**
 * robots.txt: Google puede recorrer toda la tienda menos lo privado
 * (CRM, login, carrito, checkout), la API y las búsquedas internas.
 * Las fotos SÍ (están dentro de /api): sin eso no aparecen en Google
 * Imágenes ni en los resultados de productos. Gana la regla más
 * específica, así que /api/uploads/ y /api/img.php quedan permitidos.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/uploads/", "/api/img.php"],
      disallow: ["/crm", "/login", "/cart", "/checkout", "/api/", "/*?*q="],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
