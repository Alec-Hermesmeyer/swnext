/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,

  // Skip lint and type checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    loader: 'custom',
    loaderFile: './supabase-image-loader.js',
    domains: ['edycymyofrowahspzzpg.supabase.co']
  },
  
  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Temporarily disabled due to critters dependency conflicts
    optimizePackageImports: ['lucide-react', 'framer-motion', 'chart.js', 'react-chartjs-2']
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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

