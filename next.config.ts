import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  basePath: isProd ? '/naval-letter-formatter' : '',
  assetPrefix: isProd ? '/naval-letter-formatter/' : '',
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // GitHub Pages does not support Next.js image optimization
  },
};
