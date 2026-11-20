"use client";

import { useSearchParams } from "next/navigation";
import ProductView from "@/components/pages/ProductView";
import type { HomeHeroData } from "@/components/sections/HomeHeroEditor";
import type { Category } from "@/lib/categories";
import type { SizeGuides } from "@/lib/size-guide";
import type { Product as ApiProduct } from "@/lib/tatan-api";

/** Producto de /producto?s=… (ver app/producto/page.tsx) */
export default function ProductoPorQuery(props: {
  initialProducts: ApiProduct[];
  initialHome: HomeHeroData;
  initialCategories: Category[];
  initialSizeGuides: SizeGuides;
}) {
  const slug = useSearchParams().get("s") ?? "";
  return <ProductView slug={slug} initialCombos={[]} {...props} />;
}
