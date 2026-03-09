/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://palenquego.com/api/v1/:path*',
      },
      {
        source: '/media-proxy/:path*',
        destination: 'https://palenquego.com/media/:path*',
      },
    ]
  },
}

export default nextConfig;