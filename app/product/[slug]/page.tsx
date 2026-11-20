import type { Metadata } from "next";
import ProductView from "@/components/pages/ProductView";
import JsonLd from "@/components/seo/JsonLd";
import { fetchAllProductsSSR, fetchCombosSSR } from "@/lib/card-props";
import { categoryLabel, fetchCategoriesSSR } from "@/lib/categories";
import { fetchHomeContentSSR } from "@/lib/home-content";
import { productHref, productSlug } from "@/lib/product-url";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { absoluteUrl, categoryPath } from "@/lib/seo";
import { fetchSizeGuidesSSR } from "@/lib/size-guide";
import type { Product as ApiProduct } from "@/lib/tatan-api";

/**
 * Página de un producto, armada al compilar (una por producto, con su
 * título, descripción y datos para Google). El contenido se actualiza en
 * vivo en el navegador (components/pages/ProductView.tsx). Los productos
 * cargados después del build se ven en /producto?s=… (lo resuelve
 * public/.htaccess) hasta la próxima compilación.
 */

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const products = await fetchAllProductsSSR();
  return products.map((p) => ({ slug: productSlug(p) }));
}

async function findProduct(rawSlug: string): Promise<ApiProduct | null> {
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {}
  const all = await fetchAllProductsSSR();
  return all.find((p) => productSlug(p) === slug) ?? null;
}

/** Texto plano de la descripción del CRM (sin HTML) */
function plainText(html: string | null | undefined): string {
  return sanitizeHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Body manga larga" → "Body manga larga para bebé" (si es de bebé y no lo dice) */
function seoName(p: Pick<ApiProduct, "name" | "sizeGroup">): string {
  if (p.sizeGroup === "bebe" && !/beb[eé]|reci[eé]n nacido/i.test(p.name)) return `${p.name} para bebé`;
  return p.name;
}

/** Fotos del producto sin repetir (principal, galería y modelos), en URL absoluta */
function productImages(p: ApiProduct): string[] {
  return Array.from(
    new Set([
      p.imageSrc,
      ...(Array.isArray(p.gallery) ? p.gallery : []),
      ...(Array.isArray(p.colorVariants) ? p.colorVariants.map((c) => c.imageSrc ?? "") : []),
    ]),
  )
    .filter(Boolean)
    .map(absoluteUrl);
}

const ARS = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

/** Título, descripción y URL canónica del producto (+ " · Tatan" del layout) */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await findProduct(slug);
  if (!p) return { title: "Producto no encontrado", robots: { index: false } };
  const title = seoName(p);
  const text = (p.tagline ?? "").trim() || plainText(p.description);
  const price = Number(p.price) || 0;
  // Lo que se lee en Google: qué es, el precio y el envío (≈155 caracteres)
  const tail = `${price ? ` ${ARS(price)}.` : ""} Envíos a todo el país y cuotas con Mercado Pago.`;
  const room = Math.max(40, 158 - title.length - tail.length);
  const intro = text ? (text.length > room ? `${text.slice(0, room).replace(/\s+\S*$/, "")}…` : text) : "";
  const description = `${title}${intro ? `: ${intro}` : "."}${tail}`;
  const path = productHref(p);
  const images = productImages(p).slice(0, 4);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      images: images.map((url) => ({ url, alt: p.name })),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [products, home, categories, sizeGuides, p] = await Promise.all([
    fetchAllProductsSSR(),
    fetchHomeContentSSR(),
    fetchCategoriesSSR(),
    fetchSizeGuidesSSR(),
    findProduct(slug),
  ]);
  const combos = p ? await fetchCombosSSR([p.id], 4) : [];

  // Datos para Google: el producto con su precio, stock y fotos (sin
  // calificaciones: solo se publicarían si fueran reseñas reales)
  const ld = p
    ? (() => {
        const stock = Object.values(p.stockBySize ?? {}).reduce((a, n) => a + (Number(n) || 0), 0);
        const url = absoluteUrl(productHref(p));
        const category = categoryLabel(categories, p.category);
        return [
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: plainText(p.description) || (p.tagline ?? "").trim() || undefined,
            image: productImages(p),
            sku: (p.slug ?? "").trim() || p.id,
            category,
            brand: { "@type": "Brand", name: "Tatan" },
            url,
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "ARS",
              price: (Number(p.price) || 0).toFixed(2),
              availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@type": "Organization", name: "Tatan" },
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { name: "Inicio", item: absoluteUrl("/") },
              { name: "Productos", item: absoluteUrl("/productos") },
              { name: category, item: absoluteUrl(categoryPath(p.category)) },
              { name: p.name, item: url },
            ].map((b, i) => ({ "@type": "ListItem", position: i + 1, ...b })),
          },
        ];
      })()
    : null;

  return (
    <>
      {ld && <JsonLd data={ld} />}
      <ProductView
        slug={slug}
        initialProducts={products}
        initialHome={home}
        initialCategories={categories}
        initialSizeGuides={sizeGuides}
        initialCombos={combos}
      />
    </>
  );
}
