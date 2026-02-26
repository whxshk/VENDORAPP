import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname, ".."),
  serverExternalPackages: [
    "playwright-extra",
    "puppeteer-extra-plugin",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin-recaptcha"
  ]
};

export default nextConfig;
