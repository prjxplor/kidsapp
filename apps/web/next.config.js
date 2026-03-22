/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kids-app/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "**.foursquare.com" },
      { protocol: "https", hostname: "**.ticketmaster.com" },
      { protocol: "https", hostname: "s1.ticketm.net" },
    ],
  },
};

module.exports = nextConfig;
