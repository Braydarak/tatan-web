import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutResultParams from "@/components/pages/CheckoutResultParams";

export const metadata: Metadata = {
  title: "Estado de tu compra",
  robots: { index: false, follow: false },
};

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutResultParams />
    </Suspense>
  );
}
