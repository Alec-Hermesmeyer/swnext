/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './supabase-image-loader.js',
    domains: ['edycymyofrowahspzzpg.supabase.co']
  },
  // Enable turbopack for better performance
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      }
    }
  }
}

module.exports = nextConfig;

