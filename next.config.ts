import type { NextConfig } from "next";

/** Dominio real de la API PHP (Ferozo). */
const API_ORIGIN = "https://tatankids.com.ar";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
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
