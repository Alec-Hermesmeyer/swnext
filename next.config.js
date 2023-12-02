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
  images: {
    loader: 'custom',
    loaderFile: './supabase-image-loader.js',
  },
}
module.exports = nextConfig;


