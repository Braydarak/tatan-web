import Catalog, { catalogMetadata } from "@/components/pages/Catalog";

/** Una categoría con URL propia: /productos/body, /productos/ajuar… */
type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function routeOf(params: Props["params"]) {
  const { categoria } = await params;
  let key = categoria;
  try {
    key = decodeURIComponent(categoria);
  } catch {}
  return { kind: "category", key } as const;
}

export async function generateMetadata({ params, searchParams }: Props) {
  return catalogMetadata(await routeOf(params), searchParams);
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  return <Catalog route={await routeOf(params)} searchParams={searchParams} />;
}
