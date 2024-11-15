/** @type {import('next').NextConfig} */
// const withCSS = require('@zeit/next-css');
// const withImages = require('next-images');
// const webpack = require('webpack');
// const nodeExternals = require('webpack-node-externals');

// module.exports = withImages(withCSS({
//   cssLoaderOptions: {
//     url: false
//   },
  
//   reactStrictMode: true,
//   webpack(config, options) {
//     config.module.rules.push({
//       test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
//       use: {
//         loader: 'url-loader',
//         options: {
//           limit: 100000
//         }
//       }
//     });

//     if (!options.isServer) {
//       config.node = {
//         fs: 'empty'
//       }
//     }
//     else {
//       config.externals.push(nodeExternals({
//         allowlist: ['fs']
//       }))
//     }

//     return config;
//   },
  
//   css: {
//     // Set the cssLoaderOptions here
//     loaderOptions: {
//       url: false
//     }
//   },
// }));
// module.exports = (phase, defaultConfig) => {
//   return withBundleAnalyzer(defaultConfig)
// }

// const nextConfig = {
//   reactStrictMode: true,
  
  
// }
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Disable cache only for development environment
    if (process.env.NODE_ENV === 'development') {
      config.cache = false;
    }
    return config;
  },
  images: {
    loader: 'custom',
    loaderFile: './supabase-image-loader.js',
    domains: ['edycymyofrowahspzzpg.supabase.co']
  },
}
module.exports = nextConfig;

