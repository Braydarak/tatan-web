import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Web estática (output: "export"): se genera una vez, al compilar
export const dynamic = "force-static";

/**
 * robots.txt: Google puede recorrer toda la tienda menos lo privado
 * (CRM, login, carrito, checkout) y las búsquedas internas.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/crm", "/login", "/cart", "/checkout", "/api/", "/*?*q="],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
