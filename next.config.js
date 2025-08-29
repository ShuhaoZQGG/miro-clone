/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons']
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  webpack: (config, { isServer }) => {
    // Handle canvas package for server-side rendering
    if (isServer) {
      config.externals = [...config.externals, 'canvas'];
    }
    
    // Handle fabric.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };

    return config;
  },
};

module.exports = nextConfig;