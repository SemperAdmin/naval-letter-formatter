/** @type {import('next').NextConfig} */
const nextConfig = {
  // Comment out these lines during development
  // output: 'export',
  // basePath: '/naval-letter-generator',
  // assetPrefix: '/naval-letter-generator/',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
