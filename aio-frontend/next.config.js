/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Required for Docker / Railway deployments
  output: 'standalone',
};

module.exports = nextConfig;
