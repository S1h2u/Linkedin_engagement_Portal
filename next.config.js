/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable the new `/app` directory (App Router) – required for Next.js 14+
    appDir: true,
  },
};

module.exports = nextConfig;
