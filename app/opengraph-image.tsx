import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Imagen que se ve al compartir la tienda (WhatsApp, Instagram, Facebook…).
 * Las páginas de producto usan la foto del producto.
 */
export const alt = "Tatan · Ropa para bebés de Algodón Pima";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/tatanLogo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FEFDF8 0%, #FCD1B1 55%, #C7E2D6 100%)",
          color: "#3f3f46",
        }}
      >
        <img src={logoSrc} width={526} height={192} alt="" />
        <div style={{ marginTop: 40, fontSize: 52, fontWeight: 700 }}>
          Ropa para bebés de Algodón Pima
        </div>
        <div style={{ marginTop: 16, fontSize: 30 }}>
          Envíos a todo el país · Cuotas con Mercado Pago
        </div>
      </div>
    ),
    size,
  );
}
