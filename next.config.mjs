/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse is CommonJS and reads files at runtime; keep it external to the bundle.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
