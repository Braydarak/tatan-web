import Catalog, { catalogMetadata } from "@/components/pages/Catalog";

/** /ninos: ropa del grupo de talles "ninios" (ver lib/seo.ts) */
const route = { kind: "size", size: "ninios" } as const;

export function generateMetadata() {
  return catalogMetadata(route);
}

export default function Page() {
  return <Catalog route={route} />;
}
