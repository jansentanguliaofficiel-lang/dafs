import type { Metadata } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  title: "DAFS Services | Administration",
  description: "Espace d’administration DAFS Services.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
