import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = [
    "/",
    "/locations",
    "/acheter",
    "/plans-architecturaux",
    "/estimation",
    "/a-propos",
    "/contact",
    "/faq",
    "/informations-legales",
  ];
  return paths.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
