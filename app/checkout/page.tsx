import type { Metadata } from "next";
import Checkout from "@/components/pages/Checkout";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <Checkout />;
}
