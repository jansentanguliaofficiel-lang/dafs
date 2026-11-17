import type { Metadata } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "DAFS Sarlu | Immobilier, architecture et services",
  description: "Locations, maisons et parcelles à vendre, plans architecturaux, déménagement, aménagement et nettoyage proposés par DAFS Sarlu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
