import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'arcraiders.wiki',
        port: '',
        pathname: '/w/images/**',
      },
    ],
  },
};

export default nextConfig;
