/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kids-app/shared"],
  images: {
    domains: ["maps.googleapis.com"],
  },
};

module.exports = nextConfig;
