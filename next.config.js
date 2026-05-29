/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    loader: 'custom',
    loaderFile: './supabase-image-loader.js',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'edycymyofrowahspzzpg.supabase.co',
      },
    ],
  },
  
  // Proxy entry point: ./proxy.js (auto-detected by Next.js 16)
  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Temporarily disabled due to critters dependency conflicts
    optimizePackageImports: ['lucide-react', 'framer-motion', 'chart.js', 'react-chartjs-2'],
    proxyPrefetch: 'flexible',
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  turbopack: {
    root: __dirname,
  },

  // Block /admin routes in production by rewriting them to the 404 page.
  // `beforeFiles` runs before filesystem routing so pages/admin/* are never matched.
  // Rewriting to `/404` makes Next.js serve the not-found page with a true 404 status.
  // In development this returns an empty array, leaving /admin accessible for local work.
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    return {
      beforeFiles: [
        { source: '/admin', destination: '/404' },
        { source: '/admin/:path*', destination: '/404' },
      ],
    };
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Bundle splitting optimization
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            enforce: true
          },
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 20
          },
          motion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-motion',
            chunks: 'all',
            priority: 20
          }
        }
      };
    }
    
    return config;
  }
}

module.exports = withBundleAnalyzer(nextConfig);
