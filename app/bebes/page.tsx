import Catalog, { catalogMetadata } from "@/components/pages/Catalog";

/** /bebes: ropa del grupo de talles "bebe" (ver lib/seo.ts) */
type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

const route = { kind: "size", size: "bebe" } as const;

export function generateMetadata({ searchParams }: Props) {
  return catalogMetadata(route, searchParams);
}

export default function Page({ searchParams }: Props) {
  return <Catalog route={route} searchParams={searchParams} />;
}
