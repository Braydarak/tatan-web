import Catalog, { catalogMetadata } from "@/components/pages/Catalog";
import { fetchCategoriesSSR } from "@/lib/categories";

/**
 * Una categoría con URL propia: /productos/body, /productos/ajuar…
 * Se genera una página por categoría al compilar. Las que se creen después
 * en el CRM funcionan como /productos?c=… hasta el próximo build (lo
 * resuelve public/.htaccess).
 */
type Props = { params: Promise<{ categoria: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await fetchCategoriesSSR();
  return categories.filter((c) => c.active).map((c) => ({ categoria: c.key }));
}

async function routeOf(params: Props["params"]) {
  const { categoria } = await params;
  return { kind: "category", key: decodeURIComponent(categoria) } as const;
}

export async function generateMetadata({ params }: Props) {
  return catalogMetadata(await routeOf(params));
}

export default async function CategoriaPage({ params }: Props) {
  return <Catalog route={await routeOf(params)} />;
}
