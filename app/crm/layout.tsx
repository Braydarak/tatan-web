import type { Metadata } from "next";

// La página del CRM es un componente de cliente (no puede exportar metadata)
export const metadata: Metadata = {
  title: "CRM",
  robots: { index: false, follow: false },
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
