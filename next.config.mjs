/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://209.97.146.210/api/v1/:path*',
      },
      {
        source: '/media-proxy/:path*',
        destination: 'http://209.97.146.210/media/:path*',
      },
    ]
  },
};

export default nextConfig;