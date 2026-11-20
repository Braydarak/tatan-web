import type { NextConfig } from "next";

/**
 * La web se sube a Ferozo como ARCHIVOS ESTÁTICOS (Ferozo no tiene Node):
 * `pnpm build` genera la carpeta `out/` con HTML, JS y CSS, que va a
 * public_html junto a la API PHP (`/api/*.php`). Ver docs/deploy-ferozo.md.
 *
 * - Los datos de la base (productos, precios, stock, textos del CRM) se
 *   leen al compilar (para Google) y el navegador los vuelve a pedir a la
 *   API al abrir cada página (lib/live-data.ts).
 * - Las fotos subidas las achica /api/img.php (lib/image-loader.ts).
 * - Las URLs no llevan ".html": lo resuelve public/.htaccess.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
};

export default nextConfig;
