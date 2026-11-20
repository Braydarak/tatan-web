/**
 * Datos estructurados (JSON-LD) para Google: le dicen qué es cada página
 * (un producto con su precio y stock, una lista de productos, la tienda…).
 * El "<" se escapa para que un texto cargado en el CRM no pueda cerrar el
 * <script> (recomendación de Next).
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
