import Catalog, { catalogMetadata } from "@/components/pages/Catalog";

const route = { kind: "all" } as const;

export function generateMetadata() {
  return catalogMetadata(route);
}

export default function ProductosPage() {
  return <Catalog route={route} />;
}
