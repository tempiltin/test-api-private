import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/internal",
          "/server",
          "/*"
        ],
        allow: ["/"],
      },
    ],
    sitemap: "https://api-private-for-test.vercel.app/sitemap.xml",
  };
}
