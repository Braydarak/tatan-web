import Cart from "@/components/pages/Cart";
import { fetchAllProductsSSR } from "@/lib/card-props";
import { fetchHomeContentSSR } from "@/lib/home-content";

export const metadata = {
  title: "Tu carrito · Tatan",
};

export default async function CartPage() {
  const [catalog, content] = await Promise.all([
    fetchAllProductsSSR(),
    fetchHomeContentSSR(),
  ]);
  return (
    <Cart catalog={catalog} quickAdd={content.store?.quickAdd !== false} />
  );
}
