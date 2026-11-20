import Catalog, { catalogMetadata } from "@/components/pages/Catalog";

/** /bebes: ropa del grupo de talles "bebe" (ver lib/seo.ts) */
const route = { kind: "size", size: "bebe" } as const;

export function generateMetadata() {
  return catalogMetadata(route);
}

export default function Page() {
  return <Catalog route={route} />;
}
