/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api requests to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://admin_backend:8000'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
