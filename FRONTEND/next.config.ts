
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This allows the Next.js development server to accept requests from the
    // Firebase Studio environment.
    allowedDevOrigins: ["*.cloudworkstations.dev"],
    // Performance optimizations
    optimizeCss: true,
    nextScriptWorkers: true,
    optimizeUniversalDefaults: true,
  },
  // Performance optimizations
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // allow all hostnames
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent.fbom2-2.fna.fbcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'as1.ftcdn.net',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
  },
  // Bundle optimization
  modularizeImports: {
    '@radix-ui/react-*': {
      transform: '@radix-ui/react-{{member}}',
      preventFullImport: true,
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
  },
  // Enable compression
  compress: true,
  // Optimize static assets
  staticPageGenerationTimeout: 1000,
};

module.exports = nextConfig;
