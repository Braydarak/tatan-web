import type { NextConfig } from "next";

/** Dominio real de la API PHP (Ferozo). */
const API_ORIGIN = "https://tatankids.com.ar";

const nextConfig: NextConfig = {
  /**
   * Optimización de imágenes de Next (Vercel): las fotos de Ferozo se bajan
   * una sola vez, se achican al tamaño real en pantalla (según `sizes`), se
   * convierten a AVIF/WebP y quedan cacheadas en la CDN de Vercel. Así el
   * cliente no espera al servidor lento de Ferozo ni baja fotos de 1600 px
   * para una tarjeta de 300 px.
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
  /**
   * Proxy same-origin hacia la API PHP.
   * El navegador llama a `/api/php/*` en el propio dominio (Vercel o Ferozo)
   * y Next reenvía la petición server-side, así que:
   *  - no hay CORS (el navegador nunca ve el dominio de Ferozo),
   *  - la cookie de sesión del CRM (TATANCRMSESSID) es first-party.
   */
  async rewrites() {
    return [
      {
        source: "/api/php/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
