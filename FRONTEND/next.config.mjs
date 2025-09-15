/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 15+: use serverExternalPackages (renamed from experimental.serverComponentsExternalPackages)
  serverExternalPackages: [
    'handlebars',
    'dotprompt',
    '@genkit-ai/core',
    'genkit',
    '@genkit-ai/googleai',
  ],
  async rewrites() {
    const backendPort = process.env.BACKEND_PORT || '4000';
    return [
      // keep genkit first so it doesn't get shadowed by catch-all
      { source: '/api/genkit/:path*', destination: 'http://127.0.0.1:3400/:path*' },
      // catch-all proxy to backend
      { source: '/api/:path*', destination: `http://127.0.0.1:${backendPort}/api/:path*` },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // allow all hostnames
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
export default nextConfig;
import dotenv from 'dotenv';
// Load env from repo root so FE server components have DB credentials during transition
dotenv.config({ path: '../.env' });
