import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.pinggy.net",
    "*.pinggy-free.link",
    "*.loca.lt",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
