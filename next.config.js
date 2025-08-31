/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './supabase-image-loader.js',
    domains: ['edycymyofrowahspzzpg.supabase.co']
  },
  // Disabled turbopack temporarily for Tailwind compatibility
}

module.exports = nextConfig;

