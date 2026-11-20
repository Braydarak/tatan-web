import Cart from "@/components/pages/Cart";
import { fetchAllProductsSSR } from "@/lib/card-props";
import { fetchHomeContentSSR } from "@/lib/home-content";

export const metadata = {
  title: "Tu carrito",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [catalog, home] = await Promise.all([fetchAllProductsSSR(), fetchHomeContentSSR()]);
  return <Cart catalog={catalog} initialHome={home} />;
}
