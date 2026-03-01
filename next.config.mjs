/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Esto captura la ruta que tú estás probando directamente
        source: '/api/v1/:path*',
        destination: 'http://209.97.146.210/api/v1/:path*',
      },
      {
        source: '/media/:path*',
        destination: 'http://209.97.146.210/media/:path*',
      },
    ]
  },
};

export default nextConfig;