/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/sportsbook-tracker',
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
