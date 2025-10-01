/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/citizens/',
        destination: 'http://127.0.0.1:8000/citizens/',
      },
      {
        source: '/brokers/',
        destination: 'http://127.0.0.1:8000/brokers/',
      },
      {
        source: '/applications/',
        destination: 'http://127.0.0.1:8000/applications/',
      },
      {
        source: '/analytics/',
        destination: 'http://127.0.0.1:8000/analytics/',
      },
      {
        source: '/chat/',
        destination: 'http://127.0.0.1:8000/chat/',
      },
      {
        source: '/ocr/',
        destination: 'http://127.0.0.1:8000/ocr/',
      },
    ]
  },
}

export default nextConfig
