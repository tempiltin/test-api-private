import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false, // source maplarni yashirish
  poweredByHeader: false, // X-Powered-By headerni olib tashlash
};

export default nextConfig;
