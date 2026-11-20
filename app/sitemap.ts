import type { MetadataRoute } from "next";
import { fetchAllProductsSSR } from "@/lib/card-props";
import { fetchCategoriesSSR } from "@/lib/categories";
import { productHref } from "@/lib/product-url";
import { SIZE_PATH, absoluteUrl, categoryPath } from "@/lib/seo";

// Web estática (output: "export"): se genera una vez, al compilar
export const dynamic = "force-static";

/**
 * sitemap.xml: todas las páginas que queremos en Google, con la fecha de
 * la última modificación de cada producto y sus fotos. Las categorías y
 * grupos de talles vacíos no van (Google castiga las páginas sin contenido).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    fetchAllProductsSSR(),
    fetchCategoriesSSR(),
  ]);
  const active = products.filter((p) => p.active !== false);
  const lastOf = (list: typeof active) => {
    const t = Math.max(0, ...list.map((p) => Date.parse(p.updatedAt ?? p.createdAt ?? "") || 0));
    return t ? new Date(t) : undefined;
  };
  const latest = lastOf(active);
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    lastModified = latest,
  ) => ({ url: absoluteUrl(path), lastModified, changeFrequency, priority });

  const out: MetadataRoute.Sitemap = [
    page("/", 1, "daily"),
    page("/productos", 0.9, "daily"),
  ];

  for (const [size, path] of Object.entries(SIZE_PATH)) {
    const list = active.filter((p) => p.sizeGroup === size);
    if (list.length) out.push(page(path, 0.9, "daily", lastOf(list)));
  }
  for (const c of categories.filter((c) => c.active)) {
    const list = active.filter((p) => p.category === c.key);
    if (list.length) out.push(page(categoryPath(c.key), 0.8, "weekly", lastOf(list)));
  }
  if (active.some((p) => p.originalPrice && p.originalPrice > p.price)) {
    out.push(page("/ofertas", 0.7, "daily"));
  }
  out.push(page("/envios", 0.4, "monthly", undefined), page("/contacto", 0.3, "yearly", undefined));

  for (const p of active) {
    const images = Array.from(
      new Set([p.imageSrc, ...(p.gallery ?? []), ...p.colorVariants.map((c) => c.imageSrc ?? "")]),
    )
      .filter(Boolean)
      .map(absoluteUrl);
    out.push({
      url: absoluteUrl(productHref(p)),
      lastModified: lastOf([p]),
      changeFrequency: "weekly",
      priority: 0.7,
      images,
    });
  }
  return out;
}
