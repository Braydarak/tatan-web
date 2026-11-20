import Catalog, { catalogMetadata } from "@/components/pages/Catalog";

/** /ninos: ropa del grupo de talles "ninios" (ver lib/seo.ts) */
type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

const route = { kind: "size", size: "ninios" } as const;

export function generateMetadata({ searchParams }: Props) {
  return catalogMetadata(route, searchParams);
}

export default function Page({ searchParams }: Props) {
  return <Catalog route={route} searchParams={searchParams} />;
}
