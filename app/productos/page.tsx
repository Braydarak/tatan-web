import Catalog, { catalogMetadata } from "@/components/pages/Catalog";

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

const route = { kind: "all" } as const;

export function generateMetadata({ searchParams }: Props) {
  return catalogMetadata(route, searchParams);
}

export default function ProductosPage({ searchParams }: Props) {
  return <Catalog route={route} searchParams={searchParams} />;
}
