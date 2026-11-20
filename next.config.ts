import path from "node:path";
import type { NextConfig } from "next";

/**
 * La web corre en el hosting Node de Ferozo, en el mismo dominio que la API
 * PHP. Por eso:
 *  - `/api/*` es SOLO de PHP: la web no tiene rutas propias bajo /api
 *    (la purga del caché del CRM está en /revalidar).
 *  - `output: "standalone"` arma .next/standalone con todo lo necesario
 *    para correr `node server.js` sin instalar dependencias en el servidor
 *    (ver docs/deploy-ferozo.md y scripts/build-ferozo.sh).
 */
const nextConfig: NextConfig = {
  output: "standalone",
  // La raíz es esta carpeta (scripts/build-ferozo.sh compila en una copia
  // dentro de deploy/ y Next no tiene que buscar otra raíz más arriba)
  outputFileTracingRoot: path.resolve("."),
  turbopack: { root: path.resolve(".") },
  /**
   * Optimización de imágenes de Next: las fotos subidas se achican al tamaño
   * real en pantalla (según `sizes`), se convierten a AVIF/WebP y quedan
   * guardadas en .next/cache/images. Así el cliente no baja fotos de 1600 px
   * para una tarjeta de 300 px. Usa `sharp` (en el build para Ferozo va la
   * versión para Linux).
   */
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    // Los archivos subidos tienen nombre único (fecha + hash): nunca cambian.
    minimumCacheTTL: 2678400, // 31 días
    remotePatterns: [
      { protocol: "https", hostname: "tatankids.com.ar", pathname: "/api/uploads/**" },
      { protocol: "https", hostname: "www.tatankids.com.ar", pathname: "/api/uploads/**" },
    ],
  },
};

export default nextConfig;
